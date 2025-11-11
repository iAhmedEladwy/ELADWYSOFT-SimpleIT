-- ==============================================
-- Fix Orphaned Activity Log Records
-- ==============================================
-- This script fixes foreign key violations in activity_log table
-- by either deleting orphaned records or assigning them to a valid user

-- ==============================================
-- STEP 1: Identify the Problem
-- ==============================================

-- Check for orphaned activity_log records
SELECT 
  al.id,
  al.user_id,
  al.action,
  al.timestamp,
  al.entity_type
FROM activity_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE u.id IS NULL
ORDER BY al.timestamp DESC;

-- Count orphaned records
SELECT COUNT(*) as orphaned_count
FROM activity_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE u.id IS NULL;

-- ==============================================
-- STEP 2: Choose a Fix Strategy
-- ==============================================

-- OPTION A: Delete orphaned activity logs (Recommended if data is not critical)
-- This removes all activity log entries that reference non-existent users

/*
DELETE FROM activity_log
WHERE user_id NOT IN (SELECT id FROM users);
*/

-- OPTION B: Assign orphaned logs to a system/admin user
-- First, find an existing admin user to assign to:

SELECT id, username, role 
FROM users 
WHERE role IN ('admin', 'super_admin')
ORDER BY id 
LIMIT 1;

-- Then update orphaned records (replace USER_ID with actual admin ID):
/*
UPDATE activity_log
SET user_id = 1  -- Replace with actual admin user ID from query above
WHERE user_id NOT IN (SELECT id FROM users);
*/

-- OPTION C: Set user_id to NULL (if schema allows nullable)
-- This preserves the log but removes the user reference
/*
ALTER TABLE activity_log ALTER COLUMN user_id DROP NOT NULL;

UPDATE activity_log
SET user_id = NULL
WHERE user_id NOT IN (SELECT id FROM users);
*/

-- ==============================================
-- RECOMMENDED FIX (Execute this)
-- ==============================================

-- This deletes orphaned activity logs (safest for fresh systems)
BEGIN;

-- Backup count before deletion
SELECT COUNT(*) as records_to_delete
FROM activity_log
WHERE user_id NOT IN (SELECT id FROM users);

-- Delete orphaned records
DELETE FROM activity_log
WHERE user_id NOT IN (SELECT id FROM users);

-- Verify deletion
SELECT COUNT(*) as orphaned_count_after
FROM activity_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE u.id IS NULL;

COMMIT;

-- ==============================================
-- STEP 3: Verify Fix
-- ==============================================

-- Should return 0 rows
SELECT 
  al.id,
  al.user_id,
  al.action,
  al.timestamp
FROM activity_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE u.id IS NULL;

RAISE NOTICE '✓ Orphaned activity logs cleaned up successfully!';
RAISE NOTICE 'You can now run: npm run db:push';
