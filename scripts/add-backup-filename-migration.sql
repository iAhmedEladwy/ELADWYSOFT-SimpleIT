-- Migration for SimpleIT v0.4.1
-- Add backup_filename column to restore_history table
-- This preserves the backup filename even if the backup file is deleted

-- Add the backup_filename column
ALTER TABLE restore_history 
ADD COLUMN backup_filename VARCHAR(255);

-- Update existing records to populate the backup_filename from the backup_files table
UPDATE restore_history 
SET backup_filename = bf.filename 
FROM backup_files bf 
WHERE restore_history.backup_file_id = bf.id 
AND restore_history.backup_filename IS NULL;

-- Add a comment to the column for documentation
COMMENT ON COLUMN restore_history.backup_filename IS 'Stores the backup filename for display purposes, preserved even if backup file is deleted (added in v0.4.1)';