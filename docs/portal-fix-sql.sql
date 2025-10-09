-- Portal Fix SQL Commands
-- Run these in your PostgreSQL database if needed

-- 1. Check current users and their roles
SELECT id, username, role, "firstName", "lastName" FROM users;

-- 2. Check current employees and their user links
SELECT id, "empId", "englishName", "userId" FROM employees;

-- 3. Create a test employee user (if no employee user exists)
INSERT INTO users (username, password, email, role, "firstName", "lastName")
VALUES ('employee1', '$2b$10$example_hash_here', 'employee@company.com', 'employee', 'Test', 'Employee')
ON CONFLICT (username) DO NOTHING;

-- 4. Create a test employee record (if no employee records exist)
INSERT INTO employees ("englishName", department, "idNumber", title, "employmentType", "joiningDate")
VALUES ('Test Employee', 'IT Department', 'EMP001', 'Software Developer', 'full_time', '2024-01-01')
ON CONFLICT ("idNumber") DO NOTHING;

-- 5. Link user to employee (replace IDs with actual values)
UPDATE employees 
SET "userId" = (SELECT id FROM users WHERE username = 'employee1' LIMIT 1)
WHERE "englishName" = 'Test Employee';

-- 6. Verify the link
SELECT u.id as user_id, u.username, u.role, e.id as emp_id, e."englishName", e."userId"
FROM users u
LEFT JOIN employees e ON u.id = e."userId"
WHERE u.role = 'employee';