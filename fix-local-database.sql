-- SQL commands to fix the local Ubuntu database schema
-- Run these commands in your local PostgreSQL database

-- 1. First, drop the NOT NULL constraint on emp_id
ALTER TABLE employees ALTER COLUMN emp_id DROP NOT NULL;

-- 2. Set the default value for emp_id to auto-generate
ALTER TABLE employees ALTER COLUMN emp_id SET DEFAULT concat('EMP-', lpad((nextval('employees_id_seq'::regclass))::text, 5, '0'::text));

-- 3. Update any existing records that might have NULL emp_id
UPDATE employees 
SET emp_id = concat('EMP-', lpad(id::text, 5, '0'::text)) 
WHERE emp_id IS NULL;

-- 4. Now make emp_id NOT NULL again (this is safe now that we have defaults)
ALTER TABLE employees ALTER COLUMN emp_id SET NOT NULL;

-- 5. Set up the generated name column properly
ALTER TABLE employees ALTER COLUMN name SET DEFAULT NULL;
UPDATE employees SET name = COALESCE(english_name, arabic_name, emp_id) WHERE name IS NULL;

-- 6. Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'employees' AND column_name IN ('emp_id', 'name')
ORDER BY ordinal_position;