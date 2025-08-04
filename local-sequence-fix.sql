-- SQL commands to create sequences in your LOCAL database
-- Run these in your local PostgreSQL before running npm run db:push

-- Create sequences with correct names (matching Replit)
CREATE SEQUENCE IF NOT EXISTS employees_id_seq;
CREATE SEQUENCE IF NOT EXISTS assets_id_seq; 
CREATE SEQUENCE IF NOT EXISTS tickets_id_seq;

-- Set sequences to start from appropriate values
-- Adjust these numbers based on your existing data
SELECT setval('employees_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM employees) + 1, 1));
SELECT setval('assets_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM assets) + 1, 1)); 
SELECT setval('tickets_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM tickets) + 1, 1));