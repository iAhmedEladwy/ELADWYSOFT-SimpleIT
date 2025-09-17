-- Migration: Add firstName and lastName to users table
-- Date: 2025-09-17
-- Description: Add first_name and last_name columns to users table to support display names

-- Add the new columns
ALTER TABLE users 
ADD COLUMN first_name VARCHAR(50),
ADD COLUMN last_name VARCHAR(50);

-- Optional: Update existing users with data from employees table if they exist
-- This will populate names for users who are also employees
UPDATE users 
SET 
  first_name = SPLIT_PART(employees.english_name, ' ', 1),
  last_name = CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(employees.english_name, ' '), 1) > 1 
    THEN SUBSTRING(employees.english_name FROM POSITION(' ' IN employees.english_name) + 1)
    ELSE NULL
  END
FROM employees 
WHERE users.id = employees.user_id 
AND users.first_name IS NULL;

-- Add indexes for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);

-- Display results
SELECT 
  id, 
  username, 
  first_name, 
  last_name, 
  email,
  role
FROM users 
ORDER BY id;