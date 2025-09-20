import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { backupFiles, backupJobs, systemHealth, restoreHistory, assets, employees, tickets, activityLog, users } from '../../shared/schema';
import { eq, desc, sql } from 'drizzle-orm';

export class BackupService {
  private backupDir = path.join(process.cwd(), 'backups');
  
  constructor() {
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  async createManualBackup(userId: number, description?: string): Promise<{ success: boolean; backupId?: number; error?: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `simpleit_backup_${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);

      // Get database URL from environment
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Create backup using pg_dump (excluding backup management tables to avoid circular references)
      const command = `pg_dump "${dbUrl}" --no-owner --no-privileges --clean --if-exists --exclude-table=backup_files --exclude-table=backup_jobs --exclude-table=system_health --exclude-table=restore_history > "${filepath}"`;
      execSync(command, { stdio: 'pipe' });

      // Get file size
      const stats = await fs.stat(filepath);
      const fileSize = stats.size;

      // Save to database
      const [backupRecord] = await db.insert(backupFiles).values({
        filename,
        filepath,
        fileSize,
        backupType: 'manual',
        status: 'completed',
        createdById: userId,
        metadata: JSON.stringify({ description: description || 'Manual backup' })
      }).returning({ id: backupFiles.id });

      return { success: true, backupId: backupRecord.id };
    } catch (error) {
      console.error('Backup creation failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async restoreFromBackup(backupId: number, userId: number): Promise<{ success: boolean; error?: string; recordsRestored?: number }> {
    const restoreStartTime = new Date();
    
    try {
      // Get backup file info
      const backup = await db.select().from(backupFiles).where(eq(backupFiles.id, backupId)).limit(1);
      if (backup.length === 0) {
        throw new Error('Backup file not found');
      }

      const backupFile = backup[0];
      
      // Create restore history record
      const [restoreRecord] = await db.insert(restoreHistory).values({
        backupFileId: backupId,
        backupFilename: backupFile.filename, // Store filename for display
        status: 'in_progress',
        restoredById: userId,
        startedAt: restoreStartTime
      }).returning({ id: restoreHistory.id });

      // Check if backup file exists
      try {
        await fs.access(backupFile.filepath);
      } catch {
        await db.update(restoreHistory)
          .set({ 
            status: 'failed', 
            errorMessage: 'Backup file not found on disk',
            completedAt: new Date()
          })
          .where(eq(restoreHistory.id, restoreRecord.id));
        throw new Error('Backup file not found on disk');
      }

      // Get database URL
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // First, backup current backup management tables
      console.log('Preserving backup management tables...');
      const backupTablesFile = path.join(this.backupDir, `backup_tables_temp_${Date.now()}.sql`);
      const backupTablesCommand = `pg_dump "${dbUrl}" --data-only --table=backup_files --table=backup_jobs --table=system_health --table=restore_history > "${backupTablesFile}"`;
      execSync(backupTablesCommand, { stdio: 'pipe' });

      // Restore database - this will completely replace current data
      console.log('Restoring database from backup...');
      const command = `psql "${dbUrl}" < "${backupFile.filepath}"`;
      execSync(command, { stdio: 'pipe' });

      // Restore backup management tables to preserve history
      console.log('Restoring backup management tables...');
      const restoreBackupTablesCommand = `psql "${dbUrl}" < "${backupTablesFile}"`;
      execSync(restoreBackupTablesCommand, { stdio: 'pipe' });

      // Clean up temporary backup file
      try {
        await fs.unlink(backupTablesFile);
      } catch (error) {
        console.warn('Could not delete temporary backup file:', error);
      }

      // Count restored records (approximate)
      const tablesQuery = `
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('backup_jobs', 'backup_files', 'system_health', 'restore_history')
      `;
      
      const countResult = execSync(`psql "${dbUrl}" -t -c "${tablesQuery}"`, { encoding: 'utf8' });
      const tables = countResult.trim().split('\n').filter((line: string) => line.trim()).length;

      // Update restore history
      await db.update(restoreHistory)
        .set({ 
          status: 'completed',
          completedAt: new Date(),
          recordsRestored: tables,
          tablesRestored: 'All application tables'
        })
        .where(eq(restoreHistory.id, restoreRecord.id));

      return { success: true, recordsRestored: tables };
    } catch (error) {
      console.error('Restore failed:', error);
      
      // Update restore history with error
      try {
        await db.update(restoreHistory)
          .set({ 
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date()
          })
          .where(eq(restoreHistory.backupFileId, backupId));
      } catch (dbError) {
        console.error('Failed to update restore history:', dbError);
      }

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getBackupList() {
    return await db.select({
      id: backupFiles.id,
      filename: backupFiles.filename,
      fileSize: backupFiles.fileSize,
      backupType: backupFiles.backupType,
      status: backupFiles.status,
      createdAt: backupFiles.createdAt,
      metadata: backupFiles.metadata
    }).from(backupFiles).orderBy(desc(backupFiles.createdAt));
  }

  async deleteBackup(backupId: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Get backup file info
      const backup = await db.select().from(backupFiles).where(eq(backupFiles.id, backupId)).limit(1);
      if (backup.length === 0) {
        return { success: false, error: 'Backup not found' };
      }

      // First, update any related restore history records to remove the foreign key reference
      // This preserves the audit trail while allowing the backup file to be deleted
      const restoreHistoryUpdated = await db.update(restoreHistory)
        .set({ backupFileId: null })
        .where(eq(restoreHistory.backupFileId, backupId));

      console.log(`Updated ${restoreHistoryUpdated} restore history records for backup ${backupId}`);

      // Delete file from disk
      try {
        await fs.unlink(backup[0].filepath);
        console.log(`Deleted backup file: ${backup[0].filepath}`);
      } catch (error) {
        console.warn('Could not delete backup file from disk:', error);
        // Continue with database deletion even if file deletion fails
      }

      // Delete from database
      await db.delete(backupFiles).where(eq(backupFiles.id, backupId));
      console.log(`Deleted backup record with ID: ${backupId}`);

      return { success: true };
    } catch (error) {
      console.error('Error deleting backup:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred while deleting backup'
      };
    }
  }

  async downloadBackup(backupId: number): Promise<{ success: boolean; filepath?: string; filename?: string; error?: string }> {
    try {
      // Get backup file info
      const backup = await db.select().from(backupFiles).where(eq(backupFiles.id, backupId)).limit(1);
      if (backup.length === 0) {
        return { success: false, error: 'Backup not found' };
      }

      // Check if file exists on disk
      try {
        await fs.access(backup[0].filepath);
        return { 
          success: true, 
          filepath: backup[0].filepath,
          filename: backup[0].filename
        };
      } catch (error) {
        return { success: false, error: 'Backup file not found on disk' };
      }
    } catch (error) {
      console.error('Error accessing backup file:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred while accessing backup file'
      };
    }
  }

  async restoreFromFile(uploadedFilePath: string, restoredById: number): Promise<{ success: boolean; error?: string; recordsRestored?: number }> {
    const startTime = Date.now();
    
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        return { success: false, error: 'DATABASE_URL not configured' };
      }

      // Check if uploaded file exists
      try {
        await fs.access(uploadedFilePath);
      } catch (error) {
        return { success: false, error: 'Uploaded file not found' };
      }

      // Extract filename from uploaded file path
      const filename = path.basename(uploadedFilePath);

      // Create restore history entry
      const restoreHistoryEntry = await db.insert(restoreHistory).values({
        backupFileId: null, // Since this is from an uploaded file, not from our backup files table
        backupFilename: filename, // Store the uploaded filename for display
        status: 'in_progress',
        restoredById: restoredById
      }).returning();

      try {
        // First, backup current backup management tables
        console.log('Preserving backup management tables...');
        const backupTablesFile = path.join(this.backupDir, `backup_tables_temp_${Date.now()}.sql`);
        const backupTablesCommand = `pg_dump "${dbUrl}" --data-only --table=backup_files --table=backup_jobs --table=system_health --table=restore_history > "${backupTablesFile}"`;
        execSync(backupTablesCommand, { stdio: 'pipe' });

        // Execute the restore using psql
        console.log('Restoring database from uploaded file...');
        const restoreCommand = `psql "${dbUrl}" < "${uploadedFilePath}"`;
        execSync(restoreCommand, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });

        // Restore backup management tables to preserve history
        console.log('Restoring backup management tables...');
        const restoreBackupTablesCommand = `psql "${dbUrl}" < "${backupTablesFile}"`;
        execSync(restoreBackupTablesCommand, { stdio: 'pipe' });

        // Clean up temporary backup file
        try {
          await fs.unlink(backupTablesFile);
        } catch (error) {
          console.warn('Could not delete temporary backup file:', error);
        }

        // Update restore history with success
        await db.update(restoreHistory)
          .set({ 
            status: 'completed', 
            completedAt: new Date(),
            recordsRestored: 0 // We don't have an easy way to count from uploaded file
          })
          .where(eq(restoreHistory.id, restoreHistoryEntry[0].id));

        console.log('Restore from uploaded file completed successfully');
        return { success: true, recordsRestored: 0 };

      } catch (error) {
        // Update restore history with failure
        await db.update(restoreHistory)
          .set({ 
            status: 'failed', 
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          })
          .where(eq(restoreHistory.id, restoreHistoryEntry[0].id));

        console.error('Restore from uploaded file failed:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error during restore from file:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred during restore'
      };
    }
  }

  async getSystemHealth() {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const healthMetrics = [];

      // === DATABASE PERFORMANCE METRICS ===
      
      // Get database size
      const dbSizeQuery = `
        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
               pg_database_size(current_database()) as size_bytes
      `;
      const dbSizeResult = execSync(`psql "${dbUrl}" -t -c "${dbSizeQuery}"`, { encoding: 'utf8' });
      const dbSize = dbSizeResult.trim().split('|')[0].trim();
      const dbSizeBytes = parseInt(dbSizeResult.trim().split('|')[1].trim());

      healthMetrics.push({
        metricName: 'Database Size',
        metricValue: dbSize,
        metricType: 'database',
        status: dbSizeBytes > 1000000000 ? 'warning' : 'healthy',
        threshold: '1GB'
      });

      // Cache hit ratio
      const cacheHitQuery = `
        SELECT round(
          (sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read) + 1)) * 100, 2
        ) as cache_hit_ratio
        FROM pg_statio_user_tables
      `;
      const cacheHitResult = execSync(`psql "${dbUrl}" -t -c "${cacheHitQuery}"`, { encoding: 'utf8' });
      const cacheHitRatio = parseFloat(cacheHitResult.trim()) || 0;

      healthMetrics.push({
        metricName: 'Cache Hit Ratio',
        metricValue: `${cacheHitRatio}%`,
        metricType: 'database',
        status: cacheHitRatio < 80 ? 'warning' : cacheHitRatio < 90 ? 'warning' : 'healthy',
        threshold: '90%'
      });

      // Active connections
      const connectionQuery = `SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()`;
      const connectionResult = execSync(`psql "${dbUrl}" -t -c "${connectionQuery}"`, { encoding: 'utf8' });
      const activeConnections = parseInt(connectionResult.trim());

      healthMetrics.push({
        metricName: 'Active Connections',
        metricValue: activeConnections.toString(),
        metricType: 'database',
        status: activeConnections > 50 ? 'warning' : 'healthy',
        threshold: '50'
      });

      // Long running queries
      const longQueriesQuery = `
        SELECT count(*) 
        FROM pg_stat_activity 
        WHERE state = 'active' 
        AND query_start < now() - interval '5 minutes'
        AND query NOT LIKE '%pg_stat_activity%'
      `;
      const longQueriesResult = execSync(`psql "${dbUrl}" -t -c "${longQueriesQuery}"`, { encoding: 'utf8' });
      const longQueries = parseInt(longQueriesResult.trim());

      healthMetrics.push({
        metricName: 'Long Running Queries',
        metricValue: longQueries.toString(),
        metricType: 'database',
        status: longQueries > 0 ? 'warning' : 'healthy',
        threshold: '0'
      });

      // === SYSTEM RESOURCE METRICS ===

      // Memory usage (Node.js process)
      const memUsage = process.memoryUsage();
      const memUsedMB = Math.round(memUsage.rss / 1024 / 1024);
      const memHeapMB = Math.round(memUsage.heapUsed / 1024 / 1024);

      healthMetrics.push({
        metricName: 'Memory Usage (RSS)',
        metricValue: `${memUsedMB} MB`,
        metricType: 'system',
        status: memUsedMB > 512 ? 'warning' : 'healthy',
        threshold: '512 MB'
      });

      healthMetrics.push({
        metricName: 'Heap Memory',
        metricValue: `${memHeapMB} MB`,
        metricType: 'system',
        status: memHeapMB > 256 ? 'warning' : 'healthy',
        threshold: '256 MB'
      });

      // Disk space (backup directory)
      try {
        const stats = await fs.stat(this.backupDir);
        const backupDirExists = stats.isDirectory();
        const backupFiles = await fs.readdir(this.backupDir);
        const backupCount = backupFiles.filter((f: string) => f.endsWith('.sql')).length;

        healthMetrics.push({
          metricName: 'Backup Directory',
          metricValue: backupDirExists ? `${backupCount} files` : 'Not found',
          metricType: 'system',
          status: backupDirExists ? 'healthy' : 'critical',
          threshold: 'Directory exists'
        });
      } catch (error) {
        healthMetrics.push({
          metricName: 'Backup Directory',
          metricValue: 'Error accessing',
          metricType: 'system',
          status: 'critical',
          threshold: 'Directory exists'
        });
      }

      // === APPLICATION-SPECIFIC METRICS ===

      // Get application data counts
      const totalAssetsResult = await db.select({ count: sql<number>`count(*)` }).from(assets);
      const totalEmployeesResult = await db.select({ count: sql<number>`count(*)` }).from(employees);  
      const totalTicketsResult = await db.select({ count: sql<number>`count(*)` }).from(tickets);

      const totalAssets = totalAssetsResult[0].count;
      const totalEmployees = totalEmployeesResult[0].count;
      const totalTickets = totalTicketsResult[0].count;

      healthMetrics.push({
        metricName: 'Total Assets',
        metricValue: totalAssets.toString(),
        metricType: 'database',
        status: 'healthy',
        threshold: 'N/A'
      });

      healthMetrics.push({
        metricName: 'Total Employees',
        metricValue: totalEmployees.toString(),
        metricType: 'database',
        status: 'healthy',
        threshold: 'N/A'
      });

      healthMetrics.push({
        metricName: 'Total Tickets',
        metricValue: totalTickets.toString(),
        metricType: 'database',
        status: 'healthy',
        threshold: 'N/A'
      });

      // Recent ticket activity (last 24 hours) - with error handling
      let recentTickets = 0;
      try {
        const recentTicketsQuery = `
          SELECT count(*) 
          FROM tickets 
          WHERE created_at > now() - interval '24 hours'
        `;
        const recentTicketsResult = execSync(`psql "${dbUrl}" -t -c "${recentTicketsQuery}"`, { encoding: 'utf8' });
        recentTickets = parseInt(recentTicketsResult.trim()) || 0;
      } catch (error) {
        console.warn('Failed to get recent tickets metrics:', error);
        recentTickets = 0;
      }

      healthMetrics.push({
        metricName: 'New Tickets (24h)',
        metricValue: recentTickets.toString(),
        metricType: 'performance',
        status: recentTickets > 50 ? 'warning' : 'healthy',
        threshold: '50/day'
      });

      // === BACKUP & MAINTENANCE HEALTH ===

      // Last backup status
      const lastBackupResult = await db.select().from(backupFiles)
        .orderBy(desc(backupFiles.createdAt)).limit(1);

      if (lastBackupResult.length > 0) {
        const lastBackup = lastBackupResult[0];
        const hoursAgo = Math.floor((Date.now() - new Date(lastBackup.createdAt).getTime()) / (1000 * 60 * 60));
        
        healthMetrics.push({
          metricName: 'Last Backup',
          metricValue: `${hoursAgo} hours ago`,
          metricType: 'database',
          status: hoursAgo > 24 ? 'warning' : hoursAgo > 168 ? 'critical' : 'healthy',
          threshold: '24 hours'
        });

        healthMetrics.push({
          metricName: 'Backup Status',
          metricValue: lastBackup.status,
          metricType: 'database',
          status: lastBackup.status === 'completed' ? 'healthy' : 'warning',
          threshold: 'completed'
        });
      } else {
        healthMetrics.push({
          metricName: 'Last Backup',
          metricValue: 'No backups found',
          metricType: 'database',
          status: 'critical',
          threshold: '24 hours'
        });
      }

      // === ACCESS PATTERN ANALYSIS ===

      // Failed login attempts (last hour) - with error handling
      let failedLogins = 0;
      try {
        const failedLoginsQuery = `
          SELECT count(*) 
          FROM activity_log 
          WHERE action = 'Login Failed' 
          AND created_at > now() - interval '1 hour'
        `;
        const failedLoginsResult = execSync(`psql "${dbUrl}" -t -c "${failedLoginsQuery}"`, { encoding: 'utf8' });
        failedLogins = parseInt(failedLoginsResult.trim()) || 0;
      } catch (error) {
        console.warn('Failed to get failed login metrics:', error);
        failedLogins = 0;
      }

      healthMetrics.push({
        metricName: 'Failed Logins (1h)',
        metricValue: failedLogins.toString(),
        metricType: 'performance',
        status: failedLogins > 10 ? 'critical' : failedLogins > 5 ? 'warning' : 'healthy',
        threshold: '5/hour'
      });

      // Active user sessions (approximate) - with error handling
      let activeUsers = 0;
      try {
        const activeUsersQuery = `
          SELECT count(DISTINCT user_id) 
          FROM activity_log 
          WHERE created_at > now() - interval '30 minutes'
        `;
        const activeUsersResult = execSync(`psql "${dbUrl}" -t -c "${activeUsersQuery}"`, { encoding: 'utf8' });
        activeUsers = parseInt(activeUsersResult.trim()) || 0;
      } catch (error) {
        console.warn('Failed to get active users metrics:', error);
        activeUsers = 0;
      }

      healthMetrics.push({
        metricName: 'Active Users (30m)',
        metricValue: activeUsers.toString(),
        metricType: 'performance',
        status: 'healthy',
        threshold: 'N/A'
      });

      // Clear old records and insert new metrics
      await db.delete(systemHealth);
      await db.insert(systemHealth).values(healthMetrics);

      return await db.select().from(systemHealth).orderBy(desc(systemHealth.recordedAt));
    } catch (error) {
      console.error('System health check failed:', error);
      return [];
    }
  }

      async getSystemOverview() {
      try {
        // Get total counts
        const totalAssetsResult = await db.select({ count: sql<number>`count(*)` }).from(assets);
        const totalEmployeesResult = await db.select({ count: sql<number>`count(*)` }).from(employees);  
        const totalTicketsResult = await db.select({ count: sql<number>`count(*)` }).from(tickets);

        const totalAssets = totalAssetsResult[0].count;
        const totalEmployees = totalEmployeesResult[0].count;
        const totalTickets = totalTicketsResult[0].count;

        // Get database info
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
          throw new Error('DATABASE_URL not configured');
        }

        const dbSizeQuery = `SELECT pg_size_pretty(pg_database_size(current_database())) as size`;
        const dbSizeResult = execSync(`psql "${dbUrl}" -t -c "${dbSizeQuery}"`, { encoding: 'utf8' });
        const databaseSize = dbSizeResult.trim();

        const connectionQuery = `SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()`;
        const connectionResult = execSync(`psql "${dbUrl}" -t -c "${connectionQuery}"`, { encoding: 'utf8' });
        const activeConnections = parseInt(connectionResult.trim());

        // Get last backup
        const lastBackupResult = await db.select().from(backupFiles)
          .orderBy(desc(backupFiles.createdAt)).limit(1);

        return {
          totalAssets: totalAssets,
          totalEmployees: totalEmployees,
          totalTickets: totalTickets,
          activeConnections,
          databaseSize,
          uptime: '24h 30m', // You can implement actual uptime calculation
          lastBackup: lastBackupResult[0]?.createdAt
        };
      } catch (error) {
        console.error('System overview failed:', error);
        throw error;
      }
    }

  async getRestoreHistory() {
    return await db.select({
      id: restoreHistory.id,
      status: restoreHistory.status,
      startedAt: restoreHistory.startedAt,
      completedAt: restoreHistory.completedAt,
      errorMessage: restoreHistory.errorMessage,
      recordsRestored: restoreHistory.recordsRestored,
      filename: sql`COALESCE(${restoreHistory.backupFilename}, ${backupFiles.filename})`.as('filename'), // Use backupFilename first, fallback to backup file's filename
      restoredByUsername: users.username,
      restoredByFirstName: users.firstName,
      restoredByLastName: users.lastName
    })
    .from(restoreHistory)
    .leftJoin(backupFiles, eq(restoreHistory.backupFileId, backupFiles.id))
    .leftJoin(users, eq(restoreHistory.restoredById, users.id))
    .orderBy(desc(restoreHistory.startedAt));
  }

  // Backup Job Management Methods

  /**
   * Create a new scheduled backup job
   */
  async createBackupJob(params: {
    name: string;
    description?: string;
    schedule_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
    schedule_value?: number;
    is_enabled?: boolean;
  }): Promise<{ success: boolean; jobId?: number; error?: string }> {
    try {
      const { name, description, schedule_type, schedule_value = 1, is_enabled = true } = params;
      
      // Calculate next run time based on schedule
      const nextRunAt = this.calculateNextRunTime(schedule_type, schedule_value);
      
      const [job] = await db.insert(backupJobs).values({
        name,
        description,
        schedule_type,
        schedule_value,
        is_enabled,
        next_run_at: nextRunAt,
      }).returning();

      return { success: true, jobId: job.id };
    } catch (error) {
      console.error('Error creating backup job:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get all backup jobs
   */
  async getBackupJobs() {
    try {
      return await db.select({
        id: backupJobs.id,
        name: backupJobs.name,
        description: backupJobs.description,
        schedule_type: backupJobs.schedule_type,
        schedule_value: backupJobs.schedule_value,
        is_enabled: backupJobs.is_enabled,
        created_at: backupJobs.created_at,
        updated_at: backupJobs.updated_at,
        last_run_at: backupJobs.last_run_at,
        next_run_at: backupJobs.next_run_at,
      })
      .from(backupJobs)
      .orderBy(desc(backupJobs.created_at));
    } catch (error) {
      console.error('Error fetching backup jobs:', error);
      throw error;
    }
  }

  /**
   * Update a backup job
   */
  async updateBackupJob(jobId: number, updates: {
    name?: string;
    description?: string;
    schedule_type?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    schedule_value?: number;
    is_enabled?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { ...updates, updated_at: new Date() };
      
      // If schedule is updated, recalculate next run time
      if (updates.schedule_type !== undefined || updates.schedule_value !== undefined) {
        // Get current job to get existing values
        const [currentJob] = await db.select().from(backupJobs).where(eq(backupJobs.id, jobId));
        if (currentJob) {
          const scheduleType = updates.schedule_type || currentJob.schedule_type;
          const scheduleValue = updates.schedule_value || currentJob.schedule_value;
          updateData.next_run_at = this.calculateNextRunTime(scheduleType, scheduleValue);
        }
      }

      await db.update(backupJobs)
        .set(updateData)
        .where(eq(backupJobs.id, jobId));

      return { success: true };
    } catch (error) {
      console.error('Error updating backup job:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Delete a backup job
   */
  async deleteBackupJob(jobId: number): Promise<{ success: boolean; error?: string }> {
    try {
      await db.delete(backupJobs).where(eq(backupJobs.id, jobId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting backup job:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get backup jobs that are due to run
   */
  async getDueJobs() {
    try {
      return await db.select()
        .from(backupJobs)
        .where(
          sql`${backupJobs.is_enabled} = true AND ${backupJobs.next_run_at} <= NOW()`
        );
    } catch (error) {
      console.error('Error fetching due jobs:', error);
      return [];
    }
  }

  /**
   * Execute a scheduled backup job
   */
  async executeScheduledJob(jobId: number): Promise<{ success: boolean; error?: string; backupId?: number }> {
    try {
      // Get job details
      const [job] = await db.select().from(backupJobs).where(eq(backupJobs.id, jobId));
      if (!job) {
        return { success: false, error: 'Job not found' };
      }

      // Create automatic backup
      const result = await this.createAutomaticBackup(1, `Scheduled ${job.schedule_type} backup: ${job.name}`);
      
      if (result.success) {
        // Update job's last run and next run times
        const nextRunAt = this.calculateNextRunTime(job.schedule_type, job.schedule_value);
        await db.update(backupJobs)
          .set({
            last_run_at: new Date(),
            next_run_at: nextRunAt,
            updated_at: new Date()
          })
          .where(eq(backupJobs.id, jobId));

        return { success: true, backupId: result.backupId };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error executing scheduled job:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create an automatic backup (similar to manual but marked as automatic)
   */
  private async createAutomaticBackup(userId: number, description?: string): Promise<{ success: boolean; backupId?: number; error?: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `simpleit_auto_backup_${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);

      // Get database URL from environment
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Create backup using pg_dump
      const command = `pg_dump "${dbUrl}" --no-owner --no-privileges --clean --if-exists --exclude-table=backup_files --exclude-table=backup_jobs --exclude-table=system_health --exclude-table=restore_history > "${filepath}"`;
      execSync(command, { stdio: 'pipe' });

      // Get file size
      const stats = await fs.stat(filepath);
      const fileSize = stats.size;

      // Save to database
      const [backupRecord] = await db.insert(backupFiles).values({
        filename,
        filepath,
        fileSize,
        backupType: 'automatic',
        status: 'completed',
        createdById: userId,
        description: description || 'Automatic scheduled backup'
      }).returning();

      return { success: true, backupId: backupRecord.id };
    } catch (error) {
      console.error('Error creating automatic backup:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Calculate next run time based on schedule
   */
  private calculateNextRunTime(scheduleType: string, scheduleValue: number): Date {
    const now = new Date();
    const nextRun = new Date(now);

    switch (scheduleType) {
      case 'hourly':
        nextRun.setHours(now.getHours() + scheduleValue);
        break;
      case 'daily':
        nextRun.setDate(now.getDate() + scheduleValue);
        nextRun.setHours(2, 0, 0, 0); // Run at 2 AM
        break;
      case 'weekly':
        nextRun.setDate(now.getDate() + (scheduleValue * 7));
        nextRun.setHours(2, 0, 0, 0); // Run at 2 AM
        break;
      case 'monthly':
        nextRun.setMonth(now.getMonth() + scheduleValue);
        nextRun.setDate(1); // First day of target month
        nextRun.setHours(2, 0, 0, 0); // Run at 2 AM
        break;
      default:
        // Default to daily
        nextRun.setDate(now.getDate() + 1);
        nextRun.setHours(2, 0, 0, 0);
    }

    return nextRun;
  }
}