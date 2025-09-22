-- Database initialization script for SimpleIT Asset Management System
-- Based on deployment script configuration

-- Create sequences for auto-incrementing IDs (matching deployment script)
CREATE SEQUENCE IF NOT EXISTS employees_emp_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS assets_asset_id_seq START 1; 
CREATE SEQUENCE IF NOT EXISTS tickets_ticket_id_seq START 1;

-- Set default values for ID columns to use sequences (matching deployment script)
-- Note: These will be applied during schema migration after tables are created
-- ALTER TABLE employees ALTER COLUMN emp_id SET DEFAULT 'EMP-' || LPAD(nextval('employees_emp_id_seq')::TEXT, 5, '0');
-- ALTER TABLE assets ALTER COLUMN asset_id SET DEFAULT 'AST-' || LPAD(nextval('assets_asset_id_seq')::TEXT, 5, '0');
-- ALTER TABLE tickets ALTER COLUMN ticket_id SET DEFAULT 'TKT-' || LPAD(nextval('tickets_ticket_id_seq')::TEXT, 6, '0');

-- Grant permissions to the application user
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO simpleit;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO simpleit;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO simpleit;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO simpleit;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO simpleit;