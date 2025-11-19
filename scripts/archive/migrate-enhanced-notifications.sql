-- Migration: Enhanced Notification Features
-- Version: v1.0.2
-- Date: 2025-11-19
-- Description: Adds priority, category, templates, versioning, batching, snooze, and DND features

-- Step 1: Create new enums
DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM ('info', 'low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_category AS ENUM ('assignments', 'status_changes', 'maintenance', 'approvals', 'announcements', 'reminders', 'alerts');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add new columns to notifications table
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS priority notification_priority NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS category notification_category NOT NULL DEFAULT 'alerts',
  ADD COLUMN IF NOT EXISTS template_id INTEGER,
  ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMP,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Step 3: Add new columns to notification_preferences table
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dnd_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dnd_start_time VARCHAR(5),
  ADD COLUMN IF NOT EXISTS dnd_end_time VARCHAR(5),
  ADD COLUMN IF NOT EXISTS dnd_days JSONB DEFAULT '[]';

-- Step 4: Create notification_templates table
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

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_batch_id ON notifications(batch_id);
CREATE INDEX IF NOT EXISTS idx_notifications_snoozed_until ON notifications(snoozed_until);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);

-- Step 6: Insert default notification templates
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
  
  ('maintenance_scheduled', 'Maintenance scheduled notification', 'maintenance', 'Asset', 'medium',
   'Maintenance Scheduled on Your Asset',
   '{{maintenanceType}} maintenance scheduled for "{{assetName}}" on {{date}}',
   '["assetName", "maintenanceType", "date"]'),
  
  ('upgrade_approval_pending', 'Upgrade request pending approval', 'approvals', 'Asset', 'high',
   'Asset Upgrade Request Pending Approval',
   '{{requestedBy}} requested an upgrade for "{{assetName}}"{{cost}}',
   '["requestedBy", "assetName", "cost"]'),
  
  ('system_announcement', 'System-wide announcement', 'announcements', 'System', 'medium',
   'System Announcement',
   '{{message}}',
   '["message"]')
ON CONFLICT (name) DO NOTHING;

-- Step 7: Update existing notifications to have default values
UPDATE notifications SET priority = 'medium' WHERE priority IS NULL;
UPDATE notifications SET category = 'alerts' WHERE category IS NULL;
UPDATE notifications SET version = 1 WHERE version IS NULL;

-- Step 8: Add comments for documentation
COMMENT ON COLUMN notifications.priority IS 'Priority level of notification: info, low, medium, high, critical';
COMMENT ON COLUMN notifications.category IS 'Category for filtering: assignments, status_changes, maintenance, approvals, announcements, reminders, alerts';
COMMENT ON COLUMN notifications.batch_id IS 'Groups related notifications together for smart batching';
COMMENT ON COLUMN notifications.version IS 'Schema version for handling format changes';
COMMENT ON COLUMN notifications.snoozed_until IS 'Timestamp until which notification is snoozed';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when notification was marked as read';
COMMENT ON COLUMN notification_preferences.sound_enabled IS 'Whether to play sound for new notifications';
COMMENT ON COLUMN notification_preferences.dnd_enabled IS 'Do Not Disturb mode enabled';
COMMENT ON COLUMN notification_preferences.dnd_start_time IS 'DND start time in HH:MM format (e.g., 22:00)';
COMMENT ON COLUMN notification_preferences.dnd_end_time IS 'DND end time in HH:MM format (e.g., 08:00)';
COMMENT ON COLUMN notification_preferences.dnd_days IS 'Array of weekday numbers for DND (0=Sunday, 6=Saturday)';

COMMENT ON TABLE notification_templates IS 'Admin-configurable notification templates with variable substitution';
COMMENT ON COLUMN notification_templates.title_template IS 'Template string with {{variable}} placeholders for title';
COMMENT ON COLUMN notification_templates.message_template IS 'Template string with {{variable}} placeholders for message';
COMMENT ON COLUMN notification_templates.variables IS 'JSON array of variable names used in templates';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully: Enhanced notification features added';
END $$;
