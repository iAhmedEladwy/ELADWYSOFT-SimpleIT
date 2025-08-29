-- Add status column to asset_maintenance table
ALTER TABLE asset_maintenance 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Completed';

-- Update existing records to have a status
UPDATE asset_maintenance 
SET status = 'Completed' 
WHERE status IS NULL;