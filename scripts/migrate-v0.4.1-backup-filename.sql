-- Migration for SimpleIT v0.4.1
-- Add backup_filename column to restore_history table
-- This preserves the backup filename even if the backup file is deleted
-- Add backup_jobs table for scheduled backups

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

-- Create backup_jobs table for scheduled backups
-- Drop the old table if it exists and create the new one
DROP TABLE IF EXISTS backup_jobs CASCADE;

CREATE TABLE backup_jobs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    schedule_type VARCHAR(20) NOT NULL, -- 'hourly', 'daily', 'weekly', 'monthly'
    schedule_value INTEGER NOT NULL DEFAULT 1, -- number of units
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP
);

-- Create index for performance
CREATE INDEX idx_backup_jobs_enabled_next_run ON backup_jobs(is_enabled, next_run_at);

-- Add comment to the table for documentation
COMMENT ON TABLE backup_jobs IS 'Stores scheduled backup job configurations (added in v0.4.1)';
COMMENT ON COLUMN backup_jobs.schedule_type IS 'Type of schedule: hourly, daily, weekly, or monthly';
COMMENT ON COLUMN backup_jobs.schedule_value IS 'Number of units for the schedule (e.g., every 2 days, every 3 weeks)';
COMMENT ON COLUMN backup_jobs.is_enabled IS 'Whether the scheduled backup job is currently active';
COMMENT ON COLUMN backup_jobs.next_run_at IS 'Calculated timestamp for when this job should run next';