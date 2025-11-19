-- Migration: Remove access_level column from users table
-- Version: 1.0.2
-- Date: 2025-11-19
-- Description: Remove deprecated access_level field, keeping only role field for RBAC

-- Drop the access_level column
ALTER TABLE users DROP COLUMN IF EXISTS access_level;

-- Drop the access_level enum type if it exists and is no longer used
DROP TYPE IF EXISTS access_level CASCADE;

-- Verify the migration
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
