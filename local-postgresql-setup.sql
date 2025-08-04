-- Local PostgreSQL Setup for SimpleIT
-- Run this on your local PostgreSQL database

-- Create sequences for auto-increment IDs
CREATE SEQUENCE IF NOT EXISTS employees_emp_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS assets_asset_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS tickets_ticket_id_seq START 1;

-- Set up auto-increment defaults
ALTER TABLE employees 
ALTER COLUMN emp_id SET DEFAULT 'EMP-' || LPAD(nextval('employees_emp_id_seq')::TEXT, 5, '0');

ALTER TABLE assets 
ALTER COLUMN asset_id SET DEFAULT 'AST-' || LPAD(nextval('assets_asset_id_seq')::TEXT, 5, '0');

ALTER TABLE tickets 
ALTER COLUMN ticket_id SET DEFAULT 'TKT-' || LPAD(nextval('tickets_ticket_id_seq')::TEXT, 6, '0');

-- Sync sequences with existing data
DO $$
DECLARE
    max_emp INTEGER;
    max_asset INTEGER;
    max_ticket INTEGER;
BEGIN
    -- Get current max IDs
    SELECT COALESCE(MAX(CAST(SUBSTRING(emp_id FROM 5) AS INTEGER)), 0) INTO max_emp 
    FROM employees WHERE emp_id ~ '^EMP-[0-9]+$';
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(asset_id FROM 5) AS INTEGER)), 0) INTO max_asset
    FROM assets WHERE asset_id ~ '^AST-[0-9]+$';
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_id FROM 5) AS INTEGER)), 0) INTO max_ticket
    FROM tickets WHERE ticket_id ~ '^TKT-[0-9]+$';
    
    -- Set sequences to continue from max + 1
    PERFORM setval('employees_emp_id_seq', GREATEST(max_emp + 1, 1));
    PERFORM setval('assets_asset_id_seq', GREATEST(max_asset + 1, 1));
    PERFORM setval('tickets_ticket_id_seq', GREATEST(max_ticket + 1, 1));
    
    RAISE NOTICE 'Sequences set: EMP=%, AST=%, TKT=%', max_emp + 1, max_asset + 1, max_ticket + 1;
END
$$;

-- Test sequence generation
SELECT 
    'EMP-' || LPAD(nextval('employees_emp_id_seq')::TEXT, 5, '0') as next_emp_id,
    'AST-' || LPAD(nextval('assets_asset_id_seq')::TEXT, 5, '0') as next_asset_id,
    'TKT-' || LPAD(nextval('tickets_ticket_id_seq')::TEXT, 6, '0') as next_ticket_id;

-- Reset test increment
SELECT setval('employees_emp_id_seq', currval('employees_emp_id_seq') - 1);
SELECT setval('assets_asset_id_seq', currval('assets_asset_id_seq') - 1);
SELECT setval('tickets_ticket_id_seq', currval('tickets_ticket_id_seq') - 1);

COMMIT;