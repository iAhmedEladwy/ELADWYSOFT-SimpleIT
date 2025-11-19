-- ====================================================================
-- SimpleIT Migration Script: v1.0.1
-- ====================================================================
-- Version: 1.0.1
-- Date: 2025-11-19
-- Description: Consolidated migration for employee auto-linking, 
--              self-registration, RBAC cleanup, enhanced notifications,
--              and password reset rate limiting
-- ====================================================================

-- ====================================================================
-- SECTION 1: Employee Auto-Linking
-- ====================================================================
-- Enables email-based automatic linking of users to employee records

-- Step 1.1: Report duplicate corporate emails before cleanup
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT corporate_email
    FROM employees 
    WHERE corporate_email IS NOT NULL AND corporate_email != ''
    GROUP BY corporate_email 
    HAVING COUNT(*) > 1
  ) dupes;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Found % duplicate corporate emails - will keep first occurrence only', duplicate_count;
  ELSE
    RAISE NOTICE 'No duplicate corporate emails found';
  END IF;
END $$;

-- Step 1.2: Nullify duplicate corporate emails (keep first occurrence by ID)
WITH ranked_employees AS (
  SELECT id, corporate_email,
         ROW_NUMBER() OVER (PARTITION BY corporate_email ORDER BY id) as rn
  FROM employees
  WHERE corporate_email IS NOT NULL AND corporate_email != ''
)
UPDATE employees 
SET corporate_email = NULL
FROM ranked_employees
WHERE employees.id = ranked_employees.id 
  AND ranked_employees.rn > 1;

-- Step 1.3: Add unique constraint to corporate_email
DO $$
BEGIN
  ALTER TABLE employees 
  ADD CONSTRAINT employees_corporate_email_unique 
  UNIQUE (corporate_email);
  RAISE NOTICE 'Added unique constraint: employees_corporate_email_unique';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint employees_corporate_email_unique already exists';
END $$;

-- Step 1.4: Add unique constraint to user_id (one employee per user)
DO $$
BEGIN
  ALTER TABLE employees 
  ADD CONSTRAINT employees_user_id_unique 
  UNIQUE (user_id);
  RAISE NOTICE 'Added unique constraint: employees_user_id_unique';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint employees_user_id_unique already exists';
END $$;


-- ====================================================================
-- SECTION 2: Employee Self-Registration
-- ====================================================================
-- Adds registration tokens table for email verification workflow

-- Step 2.1: Create registration_tokens table
CREATE TABLE IF NOT EXISTS registration_tokens (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used BOOLEAN DEFAULT false
);

-- Step 2.2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registration_tokens_token ON registration_tokens(token);
CREATE INDEX IF NOT EXISTS idx_registration_tokens_email ON registration_tokens(email);
CREATE INDEX IF NOT EXISTS idx_registration_tokens_expires_at ON registration_tokens(expires_at);

RAISE NOTICE 'Created registration_tokens table with indexes';


-- ====================================================================
-- SECTION 3: RBAC Cleanup
-- ====================================================================
-- Remove deprecated access_level column from users table

-- Step 3.1: Drop access_level column if exists
DO $$
BEGIN
  ALTER TABLE users DROP COLUMN IF EXISTS access_level;
  RAISE NOTICE 'Removed deprecated access_level column from users table';
EXCEPTION
  WHEN undefined_column THEN
    RAISE NOTICE 'Column access_level does not exist, skipping';
END $$;

-- Step 3.2: Drop access_level enum type if exists
DROP TYPE IF EXISTS access_level CASCADE;


-- ====================================================================
-- SECTION 4: Enhanced Notifications
-- ====================================================================
-- Adds priority, categories, templates, batching, snooze, and DND features

-- Step 4.1: Create new enums for notification system
DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM ('info', 'low', 'medium', 'high', 'critical');
  RAISE NOTICE 'Created enum: notification_priority';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Enum notification_priority already exists';
END $$;

DO $$ BEGIN
  CREATE TYPE notification_category AS ENUM ('assignments', 'status_changes', 'maintenance', 'approvals', 'announcements', 'reminders', 'alerts');
  RAISE NOTICE 'Created enum: notification_category';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Enum notification_category already exists';
END $$;

-- Step 4.2: Add new columns to notifications table
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS priority notification_priority NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS category notification_category NOT NULL DEFAULT 'alerts',
  ADD COLUMN IF NOT EXISTS template_id INTEGER,
  ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMP,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

RAISE NOTICE 'Enhanced notifications table with new columns';

-- Step 4.3: Add new columns to notification_preferences table
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dnd_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dnd_start_time VARCHAR(5),
  ADD COLUMN IF NOT EXISTS dnd_end_time VARCHAR(5),
  ADD COLUMN IF NOT EXISTS dnd_days JSONB DEFAULT '[]';

RAISE NOTICE 'Enhanced notification_preferences with DND settings';

-- Step 4.4: Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category notification_category NOT NULL,
  type notification_type NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'medium',
  title_template VARCHAR(255) NOT NULL,
  message_template TEXT NOT NULL,
  variables JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

RAISE NOTICE 'Created notification_templates table';

-- Step 4.5: Create indexes for performance
-- Optimized indexes for common notification query patterns
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_snoozed ON notifications(snoozed_until) WHERE snoozed_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_cleanup ON notifications(is_read, created_at) WHERE is_read = true;
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(user_id, category);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_created ON notifications(user_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_batch_id ON notifications(batch_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);

RAISE NOTICE 'Created notification indexes';

-- Step 4.6: Insert default notification templates
INSERT INTO notification_templates (name, description, category, type, priority, title_template, message_template, variables)
VALUES
  ('ticket_assignment', 'Ticket assignment notification', 'assignments', 'Ticket', 'medium', 
   'Ticket {{ticketId}} Assigned to You', 
   'You have been assigned ticket {{ticketId}}: {{title}}',
   '["ticketId", "title"]'),
  
  ('ticket_status_change', 'Ticket status change notification', 'status_changes', 'Ticket', 'low',
   'Ticket {{ticketId}} Status Updated',
   'Ticket "{{title}}" status changed from {{oldStatus}} to {{newStatus}}',
   '["ticketId", "title", "oldStatus", "newStatus"]'),
  
  ('asset_assignment', 'Asset assignment notification', 'assignments', 'Asset', 'medium',
   'New Asset Assigned to You',
   'Asset "{{assetName}}" has been assigned to you',
   '["assetName", "assetTag"]'),
  
  ('asset_unassignment', 'Asset unassignment notification', 'status_changes', 'Asset', 'low',
   'Asset Unassigned',
   'Asset "{{assetName}}" has been unassigned from you',
   '["assetName", "assetTag"]'),
  
  ('maintenance_scheduled', 'Maintenance scheduled notification', 'maintenance', 'Asset', 'medium',
   'Maintenance Scheduled on Your Asset',
   '{{maintenanceType}} maintenance scheduled for "{{assetName}}" on {{date}}',
   '["assetName", "maintenanceType", "date"]'),
  
  ('maintenance_completed', 'Maintenance completed notification', 'maintenance', 'Asset', 'low',
   'Maintenance Completed',
   '{{maintenanceType}} maintenance completed for your asset "{{assetName}}"',
   '["assetName", "maintenanceType"]'),
  
  ('upgrade_approval_pending', 'Upgrade request pending approval', 'approvals', 'Asset', 'high',
   'Asset Upgrade Request Pending Approval',
   '{{requestedBy}} requested an upgrade for "{{assetName}}"{{cost}}',
   '["requestedBy", "assetName", "cost"]'),
  
  ('upgrade_decision', 'Upgrade request decision notification', 'approvals', 'Asset', 'medium',
   'Upgrade Request {{decision}}',
   'Your upgrade request for "{{assetName}}" was {{decision}} by {{approvedBy}}',
   '["assetName", "decision", "approvedBy"]'),
  
  ('employee_onboarding', 'Employee onboarding notification', 'reminders', 'Employee', 'medium',
   'New Employee Onboarding',
   '{{employeeName}} joining {{department}} on {{startDate}}. Please prepare onboarding checklist.',
   '["employeeName", "department", "startDate"]'),
  
  ('employee_offboarding', 'Employee offboarding notification', 'reminders', 'Employee', 'high',
   'Employee Offboarding Required',
   '{{employeeName}} leaving on {{lastDay}}. Please initiate asset recovery and offboarding process.',
   '["employeeName", "lastDay"]'),
  
  ('system_announcement', 'System-wide announcement', 'announcements', 'System', 'medium',
   'System Announcement',
   '{{message}}',
   '["message"]')
ON CONFLICT (name) DO NOTHING;

RAISE NOTICE 'Seeded default notification templates';

-- Step 4.7: Update existing notifications to have default values
UPDATE notifications SET priority = 'medium' WHERE priority IS NULL;
UPDATE notifications SET category = 'alerts' WHERE category IS NULL;
UPDATE notifications SET version = 1 WHERE version IS NULL;

-- Step 4.8: Set readAt timestamp for already-read notifications
UPDATE notifications 
SET read_at = created_at 
WHERE is_read = true AND read_at IS NULL;

RAISE NOTICE 'Updated existing notifications with default values and readAt timestamps';

-- Step 4.9: Add column comments for documentation
COMMENT ON COLUMN notifications.priority IS 'Priority level: info, low, medium, high, critical';
COMMENT ON COLUMN notifications.category IS 'Category for filtering: assignments, status_changes, maintenance, approvals, announcements, reminders, alerts';
COMMENT ON COLUMN notifications.batch_id IS 'Groups related notifications for smart batching';
COMMENT ON COLUMN notifications.version IS 'Schema version for handling format changes';
COMMENT ON COLUMN notifications.snoozed_until IS 'Timestamp until which notification is snoozed';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when notification was marked as read';
COMMENT ON COLUMN notification_preferences.sound_enabled IS 'Play sound for new notifications';
COMMENT ON COLUMN notification_preferences.dnd_enabled IS 'Do Not Disturb mode enabled';
COMMENT ON COLUMN notification_preferences.dnd_start_time IS 'DND start time in HH:MM format';
COMMENT ON COLUMN notification_preferences.dnd_end_time IS 'DND end time in HH:MM format';
COMMENT ON COLUMN notification_preferences.dnd_days IS 'Array of weekday numbers for DND (0=Sunday, 6=Saturday)';

COMMENT ON TABLE notification_templates IS 'Admin-configurable notification templates with variable substitution';
COMMENT ON COLUMN notification_templates.title_template IS 'Template string with {{variable}} placeholders for title';
COMMENT ON COLUMN notification_templates.message_template IS 'Template string with {{variable}} placeholders for message';
COMMENT ON COLUMN notification_templates.variables IS 'JSON array of variable names used in templates';


-- ====================================================================
-- SECTION 5: Password Reset Rate Limiting
-- ====================================================================
-- Implements rate limiting for password reset attempts to prevent abuse

-- Step 5.1: Create password_reset_attempts table
CREATE TABLE IF NOT EXISTS password_reset_attempts (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  email VARCHAR(100),
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_attempt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  blocked_until TIMESTAMP
);

-- Step 5.2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_ip 
ON password_reset_attempts(ip_address);

CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_blocked 
ON password_reset_attempts(blocked_until) 
WHERE blocked_until IS NOT NULL;

RAISE NOTICE 'Created password_reset_attempts table with rate limiting support';

-- Step 5.3: Add comments for documentation
COMMENT ON TABLE password_reset_attempts IS 'Rate limiting for password reset attempts - prevents brute force attacks';
COMMENT ON COLUMN password_reset_attempts.ip_address IS 'IP address making the reset attempt';
COMMENT ON COLUMN password_reset_attempts.email IS 'Email/username attempted (optional tracking)';
COMMENT ON COLUMN password_reset_attempts.attempt_count IS 'Number of attempts from this IP';
COMMENT ON COLUMN password_reset_attempts.blocked_until IS 'Timestamp until which IP is blocked (30 minutes after 5 attempts)';


-- ====================================================================
-- VERIFICATION
-- ====================================================================

-- Verify employee constraints
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint 
  WHERE conrelid = 'employees'::regclass 
    AND conname IN ('employees_corporate_email_unique', 'employees_user_id_unique');
  
  RAISE NOTICE 'Employee constraints verified: % of 2 expected', constraint_count;
END $$;

-- Verify registration_tokens table
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'registration_tokens'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'registration_tokens table verified';
  ELSE
    RAISE WARNING 'registration_tokens table not found!';
  END IF;
END $$;

-- Verify notification enhancements
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'notifications'
    AND column_name IN ('priority', 'category', 'batch_id', 'version', 'snoozed_until', 'read_at');
  
  RAISE NOTICE 'Notification columns verified: % of 6 expected', column_count;
END $$;

-- Verify notification templates
DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count FROM notification_templates;
  RAISE NOTICE 'Notification templates seeded: % templates', template_count;
END $$;

-- Verify password_reset_attempts table
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'password_reset_attempts'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'password_reset_attempts table verified';
  ELSE
    RAISE WARNING 'password_reset_attempts table not found!';
  END IF;
END $$;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================================================';
  RAISE NOTICE 'Migration v1.0.1 completed successfully!';
  RAISE NOTICE '====================================================================';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  ✓ Employee auto-linking (unique constraints)';
  RAISE NOTICE '  ✓ Self-registration system (registration_tokens)';
  RAISE NOTICE '  ✓ RBAC cleanup (removed access_level)';
  RAISE NOTICE '  ✓ Enhanced notifications (priority, categories, templates, DND, snooze)';
  RAISE NOTICE '  ✓ Password reset rate limiting (5 attempts/hour, 30-min block)';
  RAISE NOTICE '====================================================================';
END $$;
