-- ==============================================
-- System Logging & Super Admin Migration Script
-- Version: 0.4.7
-- Date: 2025-11-11
-- ==============================================

-- This script will:
-- 1. Verify schema changes from Drizzle push
-- 2. Promote an existing admin to Super Admin
-- 3. Insert sample logs for testing

-- ==============================================
-- STEP 1: Verify Enums (created by drizzle push)
-- ==============================================

-- Check access_level enum includes '5'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = '5' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'access_level')
  ) THEN
    RAISE EXCEPTION 'Access level 5 not found. Run: npm run db:push';
  END IF;
END $$;

-- Check role enum includes 'super_admin'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'super_admin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'role')
  ) THEN
    RAISE EXCEPTION 'Role super_admin not found. Run: npm run db:push';
  END IF;
END $$;

-- Check log_level enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'log_level') THEN
    RAISE EXCEPTION 'Log level enum not found. Run: npm run db:push';
  END IF;
END $$;

-- Check system_logs table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') THEN
    RAISE EXCEPTION 'system_logs table not found. Run: npm run db:push';
  END IF;
END $$;

RAISE NOTICE 'Schema verification complete ✓';

-- ==============================================
-- STEP 2: Promote Existing Admin to Super Admin
-- ==============================================

-- Option A: Promote specific user by ID
-- IMPORTANT: Replace '1' with your actual admin user ID
UPDATE users 
SET 
  role = 'super_admin'::role,
  access_level = '5'::access_level
WHERE id = 1  -- ⚠️ CHANGE THIS TO YOUR ADMIN USER ID
  AND role = 'admin'::role;

-- Verify promotion
DO $$
DECLARE
  super_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO super_admin_count 
  FROM users 
  WHERE role = 'super_admin'::role;
  
  IF super_admin_count = 0 THEN
    RAISE WARNING 'No super admin created. Check user ID in UPDATE statement.';
  ELSE
    RAISE NOTICE 'Super admin count: %', super_admin_count;
  END IF;
END $$;

-- Display super admin users
SELECT 
  id,
  username,
  full_name,
  email,
  role,
  access_level,
  is_active
FROM users
WHERE role = 'super_admin'::role;

-- ==============================================
-- STEP 3: Insert Sample System Logs (Optional)
-- ==============================================

-- Sample DEBUG log
INSERT INTO system_logs (level, module, message, metadata)
VALUES (
  'DEBUG'::log_level,
  'test',
  'System logging initialized successfully',
  '{"test": true, "timestamp": "2025-11-11"}'::jsonb
);

-- Sample INFO log
INSERT INTO system_logs (level, module, message, user_id, metadata)
VALUES (
  'INFO'::log_level,
  'auth',
  'Super Admin user created',
  (SELECT id FROM users WHERE role = 'super_admin'::role LIMIT 1),
  '{"action": "user_promotion", "to_role": "super_admin"}'::jsonb
);

-- Sample WARN log
INSERT INTO system_logs (level, module, message, metadata)
VALUES (
  'WARN'::log_level,
  'api',
  'Deprecated endpoint accessed',
  '{"endpoint": "/old-api", "recommended": "/new-api"}'::jsonb
);

-- Sample ERROR log
INSERT INTO system_logs (level, module, message, metadata, resolved)
VALUES (
  'ERROR'::log_level,
  'database',
  'Connection pool exhausted',
  '{"pool_size": 10, "active_connections": 10}'::jsonb,
  false  -- Unresolved error for testing
);

-- Sample CRITICAL log with stack trace
INSERT INTO system_logs (level, module, message, stack_trace, metadata, resolved)
VALUES (
  'CRITICAL'::log_level,
  'backup',
  'Backup process failed catastrophically',
  'Error: ENOSPC: no space left on device
    at WriteStream.write (fs.js:123)
    at BackupService.createBackup (backup.js:456)',
  '{"backup_type": "full", "size_mb": 500}'::jsonb,
  false
);

RAISE NOTICE 'Sample logs inserted ✓';

-- ==============================================
-- STEP 4: Verification Queries
-- ==============================================

-- View all system logs
SELECT 
  id,
  timestamp,
  level,
  module,
  message,
  user_id,
  resolved
FROM system_logs
ORDER BY timestamp DESC
LIMIT 10;

-- Count logs by level
SELECT 
  level,
  COUNT(*) as count
FROM system_logs
GROUP BY level
ORDER BY count DESC;

-- Count unresolved errors
SELECT COUNT(*) as unresolved_errors
FROM system_logs
WHERE resolved = false
  AND level IN ('ERROR'::log_level, 'CRITICAL'::log_level);

-- ==============================================
-- STEP 5: Create Super Admin User "dev"
-- ==============================================

-- Password: SuperDev@2025! (Change this in production!)
-- This creates a dedicated developer account for system logs access

-- First, check if user "dev" already exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE username = 'dev') THEN
    RAISE NOTICE 'User "dev" already exists. Promoting to Super Admin...';
    
    UPDATE users 
    SET 
      role = 'super_admin'::role,
      access_level = '5'::access_level,
      is_active = true
    WHERE username = 'dev';
  ELSE
    RAISE NOTICE 'Creating new Super Admin user "dev"...';
    
    -- Password: SuperDev@2025!
    -- Generated using: bcrypt.hash('SuperDev@2025!', 10)
    INSERT INTO users (
      username,
      full_name,
      email,
      password_hash,
      role,
      access_level,
      is_active,
      created_at
    ) VALUES (
      'dev',
      'Super Developer',
      'dev@simpleit.local',
      '$2a$10$8YWZ5xZQX9YKPq9B2N5zKe4L5kZrF3vH8wX2jQ9nM4rP5tY6vN7W.',  -- SuperDev@2025!
      'super_admin'::role,
      '5'::access_level,
      true,
      NOW()
    );
  END IF;
END $$;

RAISE NOTICE '==================================================';
RAISE NOTICE 'Super Admin User "dev" Created/Updated';
RAISE NOTICE '==================================================';
RAISE NOTICE 'Username: dev';
RAISE NOTICE 'Password: SuperDev@2025!';
RAISE NOTICE '⚠️  IMPORTANT: Change this password after first login!';
RAISE NOTICE '==================================================';

-- ==============================================
-- STEP 6: Optional - Create Additional Super Admin
-- ==============================================

-- Uncomment to create another super admin user
-- NOTE: Generate password hash using Node.js:
--   const bcrypt = require('bcrypt');
--   const hash = await bcrypt.hash('YourPassword123!', 10);
--   console.log(hash);
/*
INSERT INTO users (
  username,
  full_name,
  email,
  password_hash,
  role,
  access_level,
  is_active
) VALUES (
  'superadmin',
  'Super Administrator',
  'dev@yourdomain.com',
  '$2a$10$...',  -- ⚠️ REPLACE WITH BCRYPT HASH
  'super_admin'::role,
  '5'::access_level,
  true
);
*/

-- ==============================================
-- CLEANUP QUERIES (Use with caution)
-- ==============================================

-- Delete all test logs (uncomment to use)
-- DELETE FROM system_logs WHERE module = 'test';

-- Delete old logs (older than 90 days)
-- DELETE FROM system_logs WHERE timestamp < NOW() - INTERVAL '90 days';

-- Reset user to regular admin (uncomment and set user ID)
-- UPDATE users SET role = 'admin'::role, access_level = '4'::access_level WHERE id = 1;

-- ==============================================
-- END OF MIGRATION SCRIPT
-- ==============================================

RAISE NOTICE '===================================';
RAISE NOTICE 'System Logging Migration Complete!';
RAISE NOTICE '===================================';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Login as Super Admin user';
RAISE NOTICE '2. Triple-click version text in sidebar';
RAISE NOTICE '3. Click "System Logs" menu item';
RAISE NOTICE '4. View sample logs and test filters';
RAISE NOTICE '===================================';
