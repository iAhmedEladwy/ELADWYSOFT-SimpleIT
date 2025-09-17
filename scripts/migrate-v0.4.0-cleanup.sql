-- SimpleIT v0.4.0 Schema Migration Script (PostgreSQL)
-- Migration for recent code cleanup and priority auto-calculation changes
-- Date: 2025-09-15
-- Description: Removes unused tables/columns and implements auto-calculated priority

-- ============================================================================
-- MIGRATION: Remove Unused Service Provider System
-- ============================================================================

-- Drop service provider related tables (if they exist)
DROP TABLE IF EXISTS asset_service_providers CASCADE;
DROP TABLE IF EXISTS service_providers CASCADE;

-- ============================================================================
-- MIGRATION: Remove Obsolete Enums and References
-- ============================================================================

-- Remove obsolete enum types (if they exist)
DROP TYPE IF EXISTS asset_type_enum CASCADE;
DROP TYPE IF EXISTS upgrade_risk_enum CASCADE;
DROP TYPE IF EXISTS upgrade_priority_enum CASCADE;

-- ============================================================================
-- MIGRATION: Clean Up Tickets Table
-- ============================================================================

-- Remove mergedIntoId column from tickets table (if it exists)
ALTER TABLE tickets DROP COLUMN IF EXISTS merged_into_id;

-- Remove time tracking columns from tickets table (if it exists)
ALTER TABLE tickets DROP COLUMN IF EXISTS is_time_tracking;
ALTER TABLE tickets DROP COLUMN IF EXISTS time_tracking_started_at;

-- Ensure tickets table has the correct v0.4.0 structure
-- PostgreSQL doesn't support ADD COLUMN IF NOT EXISTS in older versions
-- So we'll use a more compatible approach

DO $$
BEGIN
    -- Add priority column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='priority') THEN
        ALTER TABLE tickets ADD COLUMN priority ticket_priority DEFAULT 'Medium' NOT NULL;
    END IF;
    
    -- Add urgency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='urgency') THEN
        ALTER TABLE tickets ADD COLUMN urgency ticket_urgency DEFAULT 'Medium' NOT NULL;
    END IF;
    
    -- Add impact column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='impact') THEN
        ALTER TABLE tickets ADD COLUMN impact ticket_impact DEFAULT 'Medium' NOT NULL;
    END IF;
    
    -- Add title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='title') THEN
        ALTER TABLE tickets ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT '';
    END IF;
    
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='type') THEN
        ALTER TABLE tickets ADD COLUMN type ticket_type DEFAULT 'Incident' NOT NULL;
    END IF;
    
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='category') THEN
        ALTER TABLE tickets ADD COLUMN category ticket_category DEFAULT 'Other' NOT NULL;
    END IF;
    
    -- Add time management fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='completion_time') THEN
        ALTER TABLE tickets ADD COLUMN completion_time TIMESTAMP NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='time_spent') THEN
        ALTER TABLE tickets ADD COLUMN time_spent INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='due_date') THEN
        ALTER TABLE tickets ADD COLUMN due_date TIMESTAMP NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='sla_target') THEN
        ALTER TABLE tickets ADD COLUMN sla_target TIMESTAMP NULL;
    END IF;
END$$;

-- ============================================================================
-- MIGRATION: Update Priority Values Using Auto-Calculation Logic
-- ============================================================================

-- Create a function to calculate priority based on urgency and impact
CREATE OR REPLACE FUNCTION calculate_priority(urgency_val ticket_urgency, impact_val ticket_impact)
RETURNS ticket_priority
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- ITIL Priority Matrix Implementation
    -- Critical Urgency
    IF urgency_val = 'Critical' THEN
        CASE impact_val
            WHEN 'Low' THEN RETURN 'Medium';
            WHEN 'Medium' THEN RETURN 'High';
            WHEN 'High' THEN RETURN 'High';
            WHEN 'Critical' THEN RETURN 'Critical';
        END CASE;
    -- High Urgency
    ELSIF urgency_val = 'High' THEN
        CASE impact_val
            WHEN 'Low' THEN RETURN 'Low';
            WHEN 'Medium' THEN RETURN 'Medium';
            WHEN 'High' THEN RETURN 'High';
            WHEN 'Critical' THEN RETURN 'High';
        END CASE;
    -- Medium Urgency
    ELSIF urgency_val = 'Medium' THEN
        CASE impact_val
            WHEN 'Low' THEN RETURN 'Low';
            WHEN 'Medium' THEN RETURN 'Low';
            WHEN 'High' THEN RETURN 'Medium';
            WHEN 'Critical' THEN RETURN 'Medium';
        END CASE;
    -- Low Urgency
    ELSIF urgency_val = 'Low' THEN
        RETURN 'Low';
    END IF;
    
    -- Default fallback
    RETURN 'Medium';
END$$;

-- Update existing tickets to have correct priority based on urgency and impact
UPDATE tickets 
SET priority = calculate_priority(urgency, impact)
WHERE urgency IS NOT NULL AND impact IS NOT NULL;

-- ============================================================================
-- MIGRATION: Create Trigger for Auto-Priority Calculation
-- ============================================================================

-- Create trigger function to automatically calculate priority
CREATE OR REPLACE FUNCTION tickets_priority_calculation_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Calculate priority based on urgency and impact
    NEW.priority := calculate_priority(NEW.urgency, NEW.impact);
    RETURN NEW;
END$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS tickets_priority_calculation_insert ON tickets;
DROP TRIGGER IF EXISTS tickets_priority_calculation_update ON tickets;

-- Create trigger for INSERT
CREATE TRIGGER tickets_priority_calculation_insert
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION tickets_priority_calculation_trigger();

-- Create trigger for UPDATE (only when urgency or impact changes)
CREATE OR REPLACE FUNCTION tickets_priority_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only recalculate if urgency or impact has changed
    IF NEW.urgency IS DISTINCT FROM OLD.urgency OR NEW.impact IS DISTINCT FROM OLD.impact THEN
        NEW.priority := calculate_priority(NEW.urgency, NEW.impact);
    END IF;
    RETURN NEW;
END$$;

CREATE TRIGGER tickets_priority_calculation_update
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION tickets_priority_update_trigger();

-- ============================================================================
-- MIGRATION: Clean Up Unused Storage Methods References
-- ============================================================================

-- Note: Application-level cleanup has been done in storage.ts to remove:
-- - getServiceProviders()
-- - createServiceProvider()
-- - updateServiceProvider()  
-- - deleteServiceProvider()
-- - startTicketTimeTracking()
-- - stopTicketTimeTracking()

-- ============================================================================
-- MIGRATION: Data Validation
-- ============================================================================

-- Verify all tickets have valid priority values
SELECT 
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN priority IS NOT NULL THEN 1 END) as tickets_with_priority,
    COUNT(CASE WHEN urgency IS NOT NULL THEN 1 END) as tickets_with_urgency,
    COUNT(CASE WHEN impact IS NOT NULL THEN 1 END) as tickets_with_impact
FROM tickets;

-- Show sample of priority calculations
SELECT 
    ticket_id,
    urgency,
    impact, 
    priority,
    CASE 
        WHEN calculate_priority(urgency, impact) = priority THEN 'CORRECT'
        ELSE 'MISMATCH'
    END as priority_status
FROM tickets 
LIMIT 10;

-- ============================================================================
-- MIGRATION: Optional - Add Indexes for Performance
-- ============================================================================

-- Add indexes for frequently queried priority fields
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_urgency ON tickets(urgency);
CREATE INDEX IF NOT EXISTS idx_tickets_impact ON tickets(impact);
CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON tickets(status, priority);

-- ============================================================================
-- MIGRATION VERIFICATION QUERIES
-- ============================================================================

-- 1. Verify removed tables are gone
SELECT 
    COUNT(*) as service_provider_tables_remaining
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
    AND table_name IN ('service_providers', 'asset_service_providers');

-- 2. Verify tickets table structure
DESCRIBE tickets;

-- 3. Verify priority distribution
SELECT 
    priority,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tickets), 2) as percentage
FROM tickets 
GROUP BY priority
ORDER BY 
    CASE priority 
        WHEN 'Critical' THEN 1 
        WHEN 'High' THEN 2 
        WHEN 'Medium' THEN 3 
        WHEN 'Low' THEN 4 
    END;

-- 4. Verify urgency vs impact vs priority matrix
SELECT 
    urgency,
    impact,
    priority,
    COUNT(*) as count
FROM tickets 
GROUP BY urgency, impact, priority
ORDER BY urgency, impact;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

/*
CHANGES APPLIED:

1. ✅ Removed Service Provider System
   - Dropped service_providers table
   - Dropped asset_service_providers table
   - Removed related storage methods in application code

2. ✅ Removed Obsolete Enums
   - Dropped asset_type_enum
   - Dropped upgrade_risk_enum  
   - Dropped upgrade_priority_enum

3. ✅ Cleaned Up Tickets Table
   - Removed merged_into_id column
   - Removed time tracking columns (is_time_tracking, time_tracking_started_at)
   - Ensured v0.4.0 simplified 21-field structure

4. ✅ Implemented Priority Auto-Calculation
   - Added calculate_priority() function using ITIL matrix
   - Added triggers for automatic priority calculation
   - Updated existing tickets with correct priorities
   - Added indexes for performance

5. ✅ Application Code Updates (Already Done)
   - Frontend forms now show read-only calculated priority
   - Backend auto-calculates priority on create/update
   - Validation ensures priority matches urgency × impact

ROLLBACK INSTRUCTIONS:
If you need to rollback these changes:
1. DROP TRIGGER tickets_priority_calculation_insert;
2. DROP TRIGGER tickets_priority_calculation_update;  
3. DROP FUNCTION calculate_priority;
4. Restore service provider tables if needed
5. Add back removed columns if needed

TESTING:
After running this migration:
1. Test ticket creation with different urgency/impact combinations
2. Verify priority is calculated correctly according to ITIL matrix
3. Test ticket updates to ensure priority recalculates
4. Verify frontend shows read-only priority field
*/