-- Migration Script: Employee Auto-Linking
-- Adds unique constraints and prepares database for email-based auto-linking
-- Version: 1.0.1
-- Date: 2025-11-19

-- Step 1: Find and report duplicate corporate emails
SELECT corporate_email, COUNT(*) as count
FROM employees 
WHERE corporate_email IS NOT NULL AND corporate_email != ''
GROUP BY corporate_email 
HAVING COUNT(*) > 1;

-- Step 2: Find and report duplicate user IDs (employees linked to same user)
SELECT user_id, COUNT(*) as count, 
       STRING_AGG(english_name, ', ') as employee_names
FROM employees 
WHERE user_id IS NOT NULL
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Step 3: Nullify duplicate corporate emails (keep first one only)
-- You may want to manually resolve these instead
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

-- Step 4: Add unique constraint to corporate_email
ALTER TABLE employees 
ADD CONSTRAINT employees_corporate_email_unique 
UNIQUE (corporate_email);

-- Step 5: Add unique constraint to user_id (one employee per user)
ALTER TABLE employees 
ADD CONSTRAINT employees_user_id_unique 
UNIQUE (user_id);

-- Verification queries
-- Check that constraints were added
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'employees'::regclass 
  AND conname IN ('employees_corporate_email_unique', 'employees_user_id_unique');

-- Count employees with corporate emails
SELECT COUNT(*) as employees_with_corporate_email
FROM employees 
WHERE corporate_email IS NOT NULL AND corporate_email != '';

-- Count employees linked to users
SELECT COUNT(*) as employees_linked_to_users
FROM employees 
WHERE user_id IS NOT NULL;

-- Show employees ready for auto-linking (have corporate email, no user link)
SELECT id, emp_id, english_name, corporate_email, department
FROM employees 
WHERE corporate_email IS NOT NULL 
  AND corporate_email != ''
  AND user_id IS NULL
ORDER BY english_name;
