import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { backupFiles, backupJobs, systemHealth, restoreHistory } from '../../shared/schema';
import { eq, desc } from 'drizzle-orm';

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

      // Create backup using pg_dump
      const command = `pg_dump "${dbUrl}" --no-owner --no-privileges --clean --if-exists > "${filepath}"`;
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

      // Restore database - this will completely replace current data
      const command = `psql "${dbUrl}" < "${backupFile.filepath}"`;
      execSync(command, { stdio: 'pipe' });

      // Count restored records (approximate)
      const tablesQuery = `
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('backup_jobs', 'backup_files', 'system_health', 'restore_history')
      `;
      
      const countResult = execSync(`psql "${dbUrl}" -t -c "${tablesQuery}"`, { encoding: 'utf8' });
      const tables = countResult.trim().split('\n').filter(line => line.trim()).length;

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
        throw new Error('Backup not found');
      }

      // Delete file from disk
      try {
        await fs.unlink(backup[0].filepath);
      } catch (error) {
        console.warn('Could not delete backup file from disk:', error);
      }

      // Delete from database
      await db.delete(backupFiles).where(eq(backupFiles.id, backupId));

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getSystemHealth() {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Get database size
      const dbSizeQuery = `
        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
               pg_database_size(current_database()) as size_bytes
      `;
      const dbSizeResult = execSync(`psql "${dbUrl}" -t -c "${dbSizeQuery}"`, { encoding: 'utf8' });
      const dbSize = dbSizeResult.trim().split('|')[0].trim();
      const dbSizeBytes = parseInt(dbSizeResult.trim().split('|')[1].trim());

      // Get table count and record counts
      const tableCountQuery = `
        SELECT COUNT(*) as table_count FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `;
      const tableCountResult = execSync(`psql "${dbUrl}" -t -c "${tableCountQuery}"`, { encoding: 'utf8' });
      const tableCount = parseInt(tableCountResult.trim());

      // Get connection count
      const connectionQuery = `SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()`;
      const connectionResult = execSync(`psql "${dbUrl}" -t -c "${connectionQuery}"`, { encoding: 'utf8' });
      const activeConnections = parseInt(connectionResult.trim());

      // Record health metrics
      await db.delete(systemHealth); // Clear old records
      await db.insert(systemHealth).values([
        {
          metricName: 'Database Size',
          metricValue: dbSize,
          metricType: 'database',
          status: dbSizeBytes > 1000000000 ? 'warning' : 'healthy', // 1GB threshold
          threshold: '1GB'
        },
        {
          metricName: 'Table Count',
          metricValue: tableCount.toString(),
          metricType: 'database',
          status: 'healthy'
        },
        {
          metricName: 'Active Connections',
          metricValue: activeConnections.toString(),
          metricType: 'database',
          status: activeConnections > 50 ? 'warning' : 'healthy',
          threshold: '50'
        }
      ]);

      return await db.select().from(systemHealth).orderBy(desc(systemHealth.recordedAt));
    } catch (error) {
      console.error('System health check failed:', error);
      return [];
    }
  }

      async getSystemOverview() {
      try {
        // Get total counts
        const totalAssets = await db.select({ count: sql<number>`count(*)` }).from(assets);
        const totalEmployees = await db.select({ count: sql<number>`count(*)` }).from(employees);  
        const totalTickets = await db.select({ count: sql<number>`count(*)` }).from(tickets);

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
          totalAssets: totalAssets[0].count,
          totalEmployees: totalEmployees[0].count,
          totalTickets: totalTickets[0].count,
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
      filename: backupFiles.filename
    })
    .from(restoreHistory)
    .leftJoin(backupFiles, eq(restoreHistory.backupFileId, backupFiles.id))
    .orderBy(desc(restoreHistory.startedAt));
  }
}