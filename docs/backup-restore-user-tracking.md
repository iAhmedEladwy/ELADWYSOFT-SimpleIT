# Backup and Restore User Tracking Enhancement - v0.4.1

## Overview
This enhancement improves the backup and restore system by adding user tracking and preserving backup filenames in restore history records. This feature is part of SimpleIT v0.4.1.

## Changes Made

### 1. Database Schema Updates (`shared/schema.ts`)
- Added `backupFilename` column to `restoreHistory` table
- This field stores the backup filename for display purposes, preserved even if the backup file is deleted

### 2. Backend Service Updates (`server/services/backupService.ts`)
- Updated `restoreFromBackup()` method to store the backup filename in restore history
- Updated `restoreFromFile()` method to extract and store the uploaded filename
- Updated `getRestoreHistory()` method to:
  - Include user information (username, firstName, lastName) via JOIN with users table
  - Use COALESCE to prioritize `backupFilename` field over `backup_files.filename`
  - Return comprehensive restore history with user attribution

### 3. Frontend Updates (`client/src/pages/admin/BackupRestore.tsx`)
- Added "Restored By" column to restore history table
- Added translation for "restoredBy" field
- Enhanced table display to show:
  - Username of the person who performed the restore
  - Full name (first + last name) when available
  - Fallback to "System" when user information is not available

### 4. Database Migration (`scripts/migrate-v0.4.1-backup-filename.sql`)
- Adds `backup_filename` column to existing `restore_history` table
- Populates existing records with filenames from `backup_files` table
- Adds column documentation with version information

## Benefits

### User Accountability
- All restore operations are now tracked with the user who performed them
- Provides audit trail for database restore activities
- Helps with compliance and security monitoring

### Filename Preservation
- Backup filenames are preserved in restore history even if backup files are deleted
- Uploaded backup files retain their original filename for reference
- Improves traceability of restore operations

### Enhanced UI
- Restore history now shows clear user attribution
- Better user experience with comprehensive restore information
- Consistent with other audit features in the system

## Usage

### For Regular Backups
When restoring from a backup file in the system:
1. The restore operation records the authenticated user ID
2. The backup filename is stored for future reference
3. Restore history shows both the filename and the user who performed the restore

### For Uploaded Files
When restoring from an uploaded backup file:
1. The uploaded filename is extracted and stored
2. The user who uploaded and restored the file is recorded
3. Even if the uploaded file is cleaned up, the filename remains in history

## Migration Instructions

To apply the database changes to an existing system:

```sql
-- Run the v0.4.1 migration script
psql your_database < scripts/migrate-v0.4.1-backup-filename.sql
```

This will:
1. Add the new `backup_filename` column
2. Populate existing records with filenames from the backup_files table
3. Add proper documentation to the column

## Technical Notes

- The `restoredById` field was already present in the schema but may not have been properly populated in all cases
- The new implementation ensures all restore operations include user tracking
- The COALESCE function in the query ensures backward compatibility while prioritizing the new filename field
- Foreign key relationships are preserved while allowing backup files to be deleted without losing audit trail