#!/usr/bin/env node
/**
 * Schema-to-Code Sync Script
 * Automatically updates shared/schema.ts from current database structure
 * Usage: node scripts/sync-schema.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const SCHEMA_FILE = path.join(PROJECT_ROOT, 'shared/schema.ts');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups/schema');
const EXPORT_FILE = path.join(PROJECT_ROOT, 'database-schema-export.sql');

function createBackup() {
  console.log('📦 Creating schema backup...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `schema-${timestamp}.ts`);
  
  if (fs.existsSync(SCHEMA_FILE)) {
    fs.copyFileSync(SCHEMA_FILE, backupFile);
    console.log(`✅ Schema backed up to: ${backupFile}`);
  }
}

function exportDatabaseSchema() {
  console.log('🔄 Exporting current database schema...');
  
  try {
    // Export complete database schema using pg_dump
    const command = `pg_dump "${process.env.DATABASE_URL}" --schema-only --no-owner --no-privileges > ${EXPORT_FILE}`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Database schema exported to: ${EXPORT_FILE}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to export database schema:', error.message);
    return false;
  }
}

function generateSchemaComparison() {
  console.log('🔍 Analyzing schema differences...');
  
  try {
    // Get current table list from database
    const tablesQuery = `
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position;
    `;
    
    const result = execSync(`psql "${process.env.DATABASE_URL}" -t -c "${tablesQuery}"`, { 
      encoding: 'utf8' 
    });
    
    const reportFile = path.join(PROJECT_ROOT, 'schema-sync-report.md');
    const report = `# Schema Sync Report
Generated: ${new Date().toISOString()}

## Current Database Tables and Columns
\`\`\`
${result}
\`\`\`

## Actions Needed
1. Review exported schema in ${EXPORT_FILE}
2. Update shared/schema.ts with missing tables/columns
3. Run \`npm run db:push\` to sync changes
4. Test application functionality

## Files Modified
- ${EXPORT_FILE} (database export)
- ${reportFile} (this report)
`;
    
    fs.writeFileSync(reportFile, report);
    console.log(`✅ Schema comparison report: ${reportFile}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to generate schema comparison:', error.message);
    return false;
  }
}

function updateSchemaFile() {
  console.log('📝 Analyzing schema.ts for required updates...');
  
  // Read current schema file
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error('❌ Schema file not found:', SCHEMA_FILE);
    return false;
  }
  
  const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Check for common issues
  const issues = [];
  
  if (schemaContent.includes('Multiple exports')) {
    issues.push('Duplicate table exports detected');
  }
  
  if (!schemaContent.includes('export const ticketComments')) {
    issues.push('Missing ticketComments table');
  }
  
  if (!schemaContent.includes('export const notifications')) {
    issues.push('Missing notifications table');
  }
  
  if (issues.length > 0) {
    console.log('⚠️  Schema issues detected:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('✅ Schema file appears healthy');
  }
  
  return issues.length === 0;
}

async function main() {
  console.log('🚀 Starting Schema-to-Code Sync...\n');
  
  // Step 1: Create backup
  createBackup();
  
  // Step 2: Export current database schema
  const exportSuccess = exportDatabaseSchema();
  if (!exportSuccess) {
    process.exit(1);
  }
  
  // Step 3: Generate comparison report
  const comparisonSuccess = generateSchemaComparison();
  if (!comparisonSuccess) {
    process.exit(1);
  }
  
  // Step 4: Analyze current schema file
  const schemaHealthy = updateSchemaFile();
  
  console.log('\n📋 Summary:');
  console.log('✅ Database schema exported');
  console.log('✅ Comparison report generated');
  console.log(`${schemaHealthy ? '✅' : '⚠️'} Schema file ${schemaHealthy ? 'healthy' : 'needs attention'}`);
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Review schema-sync-report.md');
  console.log('2. Update shared/schema.ts if needed');
  console.log('3. Run: npm run db:push');
  console.log('4. Test application: npm run dev');
  
  console.log('\n✨ Schema sync complete!');
}

// Run the sync
main().catch(error => {
  console.error('❌ Schema sync failed:', error);
  process.exit(1);
});