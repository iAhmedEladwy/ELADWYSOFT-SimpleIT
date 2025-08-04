#!/usr/bin/env node
/**
 * Automated Sync Workflow for Replit
 * Keeps source code synchronized with current application state
 * Monitors database changes and updates schema files accordingly
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

const PROJECT_ROOT = process.cwd();
const SYNC_CONFIG = path.join(PROJECT_ROOT, '.sync-config.json');

// Default configuration
const DEFAULT_CONFIG = {
  watchFiles: [
    'shared/schema.ts',
    'server/storage.ts',
    'drizzle.config.ts'
  ],
  syncInterval: 300000, // 5 minutes
  autoCommit: false,
  backupEnabled: true,
  notificationEnabled: true
};

class AutoSyncWorkflow {
  constructor() {
    this.config = this.loadConfig();
    this.lastHashes = new Map();
    this.isRunning = false;
  }

  loadConfig() {
    if (fs.existsSync(SYNC_CONFIG)) {
      try {
        const config = JSON.parse(fs.readFileSync(SYNC_CONFIG, 'utf8'));
        return { ...DEFAULT_CONFIG, ...config };
      } catch (error) {
        console.warn('⚠️  Invalid sync config, using defaults');
      }
    }
    return DEFAULT_CONFIG;
  }

  saveConfig() {
    fs.writeFileSync(SYNC_CONFIG, JSON.stringify(this.config, null, 2));
  }

  getFileHash(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return createHash('sha256').update(content).digest('hex');
  }

  getDatabaseHash() {
    try {
      // Get database schema fingerprint
      const query = `
        SELECT string_agg(
          table_name || ':' || column_name || ':' || data_type, 
          '|' ORDER BY table_name, ordinal_position
        ) as schema_hash
        FROM information_schema.columns 
        WHERE table_schema = 'public';
      `;
      
      const result = execSync(`psql "${process.env.DATABASE_URL}" -t -c "${query}"`, {
        encoding: 'utf8'
      }).trim();
      
      return createHash('sha256').update(result).digest('hex');
    } catch (error) {
      console.error('Failed to get database hash:', error.message);
      return null;
    }
  }

  checkForChanges() {
    const changes = [];
    
    // Check watched files
    for (const file of this.config.watchFiles) {
      const filePath = path.join(PROJECT_ROOT, file);
      const currentHash = this.getFileHash(filePath);
      const lastHash = this.lastHashes.get(file);
      
      if (currentHash !== lastHash) {
        changes.push({
          type: 'file',
          path: file,
          exists: currentHash !== null
        });
        this.lastHashes.set(file, currentHash);
      }
    }
    
    // Check database schema
    const dbHash = this.getDatabaseHash();
    const lastDbHash = this.lastHashes.get('__database__');
    
    if (dbHash !== lastDbHash && dbHash !== null) {
      changes.push({
        type: 'database',
        hash: dbHash
      });
      this.lastHashes.set('__database__', dbHash);
    }
    
    return changes;
  }

  async syncSchema() {
    console.log('🔄 Running schema sync...');
    
    try {
      // Run the schema sync script
      execSync('node scripts/sync-schema.js', { 
        stdio: 'inherit',
        cwd: PROJECT_ROOT 
      });
      
      console.log('✅ Schema sync completed');
      return true;
    } catch (error) {
      console.error('❌ Schema sync failed:', error.message);
      return false;
    }
  }

  async handleChanges(changes) {
    console.log(`📝 Detected ${changes.length} changes:`);
    
    for (const change of changes) {
      if (change.type === 'file') {
        console.log(`   📄 File: ${change.path} ${change.exists ? 'modified' : 'deleted'}`);
      } else if (change.type === 'database') {
        console.log(`   🗄️  Database schema changed`);
        
        // Trigger schema sync for database changes
        await this.syncSchema();
      }
    }
    
    // Auto-commit if enabled
    if (this.config.autoCommit && changes.length > 0) {
      this.autoCommitChanges(changes);
    }
  }

  autoCommitChanges(changes) {
    try {
      console.log('📤 Auto-committing changes...');
      
      const timestamp = new Date().toISOString();
      const changeTypes = [...new Set(changes.map(c => c.type))];
      const message = `Auto-sync: ${changeTypes.join(', ')} changes - ${timestamp}`;
      
      execSync('git add .', { cwd: PROJECT_ROOT });
      execSync(`git commit -m "${message}"`, { cwd: PROJECT_ROOT });
      
      console.log('✅ Changes committed automatically');
    } catch (error) {
      console.warn('⚠️  Auto-commit failed:', error.message);
    }
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️  Sync workflow already running');
      return;
    }
    
    this.isRunning = true;
    console.log('🚀 Starting Auto-Sync Workflow...');
    console.log(`⏱️  Sync interval: ${this.config.syncInterval / 1000}s`);
    console.log(`📁 Watching: ${this.config.watchFiles.join(', ')}`);
    
    // Initialize file hashes
    for (const file of this.config.watchFiles) {
      const hash = this.getFileHash(path.join(PROJECT_ROOT, file));
      this.lastHashes.set(file, hash);
    }
    
    // Initialize database hash
    const dbHash = this.getDatabaseHash();
    this.lastHashes.set('__database__', dbHash);
    
    // Start monitoring loop
    const monitor = async () => {
      if (!this.isRunning) return;
      
      const changes = this.checkForChanges();
      if (changes.length > 0) {
        await this.handleChanges(changes);
      }
      
      // Schedule next check
      setTimeout(monitor, this.config.syncInterval);
    };
    
    // Start monitoring
    setTimeout(monitor, this.config.syncInterval);
    console.log('✅ Auto-sync workflow started');
  }

  stop() {
    this.isRunning = false;
    console.log('⏹️  Auto-sync workflow stopped');
  }

  status() {
    console.log('📊 Auto-Sync Status:');
    console.log(`   Running: ${this.isRunning ? '✅' : '❌'}`);
    console.log(`   Watched files: ${this.config.watchFiles.length}`);
    console.log(`   Auto-commit: ${this.config.autoCommit ? '✅' : '❌'}`);
    console.log(`   Backup: ${this.config.backupEnabled ? '✅' : '❌'}`);
  }
}

// CLI interface
const command = process.argv[2];
const workflow = new AutoSyncWorkflow();

switch (command) {
  case 'start':
    workflow.start();
    break;
  
  case 'stop':
    workflow.stop();
    break;
  
  case 'status':
    workflow.status();
    break;
  
  case 'sync':
    workflow.syncSchema();
    break;
  
  case 'config':
    console.log('📋 Current Configuration:');
    console.log(JSON.stringify(workflow.config, null, 2));
    break;
  
  default:
    console.log(`
🔄 Auto-Sync Workflow for Replit

Usage: node scripts/auto-sync-workflow.js <command>

Commands:
  start    Start the auto-sync workflow
  stop     Stop the auto-sync workflow  
  status   Show workflow status
  sync     Run manual schema sync
  config   Show current configuration

Examples:
  node scripts/auto-sync-workflow.js start
  node scripts/auto-sync-workflow.js sync
  node scripts/auto-sync-workflow.js status
`);
}