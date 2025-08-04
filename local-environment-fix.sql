-- Local Environment Database Fix Script
-- Run this on your local PostgreSQL database to match Replit setup

-- Create sequences for auto-increment IDs if they don't exist
CREATE SEQUENCE IF NOT EXISTS employees_emp_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS assets_asset_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS tickets_ticket_id_seq START 1;

-- Update employees table to use auto-generated emp_id
ALTER TABLE employees 
ALTER COLUMN emp_id SET DEFAULT 'EMP-' || LPAD(nextval('employees_emp_id_seq')::TEXT, 5, '0');

-- Update assets table to use auto-generated asset_id  
ALTER TABLE assets 
ALTER COLUMN asset_id SET DEFAULT 'AST-' || LPAD(nextval('assets_asset_id_seq')::TEXT, 5, '0');

-- Update tickets table to use auto-generated ticket_id
ALTER TABLE tickets 
ALTER COLUMN ticket_id SET DEFAULT 'TKT-' || LPAD(nextval('tickets_ticket_id_seq')::TEXT, 6, '0');

-- Verify the sequences are working
SELECT 'EMP-' || LPAD(nextval('employees_emp_id_seq')::TEXT, 5, '0') as next_emp_id;
SELECT 'AST-' || LPAD(nextval('assets_asset_id_seq')::TEXT, 5, '0') as next_asset_id;
SELECT 'TKT-' || LPAD(nextval('tickets_ticket_id_seq')::TEXT, 6, '0') as next_ticket_id;

-- Check table structures
\d employees
\d assets  
\d tickets

-- Verify current max IDs to set sequences properly
SELECT MAX(CAST(SUBSTRING(emp_id FROM 5) AS INTEGER)) as max_emp_num FROM employees WHERE emp_id ~ '^EMP-[0-9]+$';
SELECT MAX(CAST(SUBSTRING(asset_id FROM 5) AS INTEGER)) as max_asset_num FROM assets WHERE asset_id ~ '^AST-[0-9]+$';  
SELECT MAX(CAST(SUBSTRING(ticket_id FROM 5) AS INTEGER)) as max_ticket_num FROM tickets WHERE ticket_id ~ '^TKT-[0-9]+$';

-- Set sequences to continue from current max + 1
-- Replace XXX with actual max numbers from above queries
-- SELECT setval('employees_emp_id_seq', XXX);
-- SELECT setval('assets_asset_id_seq', XXX);  
-- SELECT setval('tickets_ticket_id_seq', XXX);

COMMIT;