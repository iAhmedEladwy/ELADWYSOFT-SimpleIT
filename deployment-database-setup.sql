-- Complete Database Setup Script for GitHub/Local Deployments
-- This script ensures database matches working Replit environment

-- ============================================================================
-- SEQUENCES FOR AUTO-INCREMENT IDS
-- ============================================================================

-- Create sequences if they don't exist
CREATE SEQUENCE IF NOT EXISTS employees_emp_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS assets_asset_id_seq START 1; 
CREATE SEQUENCE IF NOT EXISTS tickets_ticket_id_seq START 1;

-- ============================================================================
-- TABLE DEFAULTS FOR AUTO-GENERATED IDS
-- ============================================================================

-- Employees: EMP-XXXXX format
ALTER TABLE employees 
ALTER COLUMN emp_id SET DEFAULT 'EMP-' || LPAD(nextval('employees_emp_id_seq')::TEXT, 5, '0');

-- Assets: AST-XXXXX format  
ALTER TABLE assets
ALTER COLUMN asset_id SET DEFAULT 'AST-' || LPAD(nextval('assets_asset_id_seq')::TEXT, 5, '0');

-- Tickets: TKT-XXXXXX format
ALTER TABLE tickets
ALTER COLUMN ticket_id SET DEFAULT 'TKT-' || LPAD(nextval('tickets_ticket_id_seq')::TEXT, 6, '0');

-- ============================================================================
-- SYNC SEQUENCES WITH EXISTING DATA
-- ============================================================================

-- Set sequences to continue from current maximum IDs
DO $$
DECLARE
    max_emp_num INTEGER;
    max_asset_num INTEGER; 
    max_ticket_num INTEGER;
BEGIN
    -- Get current maximum employee number
    SELECT COALESCE(MAX(CAST(SUBSTRING(emp_id FROM 5) AS INTEGER)), 0) 
    INTO max_emp_num 
    FROM employees 
    WHERE emp_id ~ '^EMP-[0-9]+$';
    
    -- Get current maximum asset number
    SELECT COALESCE(MAX(CAST(SUBSTRING(asset_id FROM 5) AS INTEGER)), 0)
    INTO max_asset_num
    FROM assets 
    WHERE asset_id ~ '^AST-[0-9]+$';
    
    -- Get current maximum ticket number
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_id FROM 5) AS INTEGER)), 0)
    INTO max_ticket_num
    FROM tickets
    WHERE ticket_id ~ '^TKT-[0-9]+$';
    
    -- Set sequences to continue from max + 1
    PERFORM setval('employees_emp_id_seq', max_emp_num + 1);
    PERFORM setval('assets_asset_id_seq', max_asset_num + 1);
    PERFORM setval('tickets_ticket_id_seq', max_ticket_num + 1);
    
    -- Log the sequence values
    RAISE NOTICE 'Sequences synchronized:';
    RAISE NOTICE 'employees_emp_id_seq: %', max_emp_num + 1;
    RAISE NOTICE 'assets_asset_id_seq: %', max_asset_num + 1;
    RAISE NOTICE 'tickets_ticket_id_seq: %', max_ticket_num + 1;
END
$$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test sequence generation
SELECT 
    'EMP-' || LPAD(nextval('employees_emp_id_seq')::TEXT, 5, '0') as next_emp_id,
    'AST-' || LPAD(nextval('assets_asset_id_seq')::TEXT, 5, '0') as next_asset_id,
    'TKT-' || LPAD(nextval('tickets_ticket_id_seq')::TEXT, 6, '0') as next_ticket_id;

-- Reset sequences after test (subtract the test increment)
SELECT setval('employees_emp_id_seq', currval('employees_emp_id_seq') - 1);
SELECT setval('assets_asset_id_seq', currval('assets_asset_id_seq') - 1);
SELECT setval('tickets_ticket_id_seq', currval('tickets_ticket_id_seq') - 1);

-- Show current sequence values
SELECT 
    sequence_name,
    last_value,
    increment_by,
    is_called
FROM information_schema.sequences 
WHERE sequence_name IN ('employees_emp_id_seq', 'assets_asset_id_seq', 'tickets_ticket_id_seq');

COMMIT;