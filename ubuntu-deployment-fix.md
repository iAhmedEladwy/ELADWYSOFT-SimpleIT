# Ubuntu Deployment Fix for Employee Creation

## Problem
The employee creation was failing on Ubuntu with the error:
```
null value in column "emp_id" of relation "employees" violates not-null constraint
```

## Root Cause
The local Ubuntu database schema doesn't have the auto-generation setup for `emp_id` that exists in the Replit environment.

## Solution Applied
1. **Updated Storage Layer**: Modified `createEmployee` method in `server/storage.ts` to use raw SQL instead of Drizzle ORM for employee insertion
2. **Manual ID Generation**: Added fallback ID generation using the existing `generateId` method when `emp_id` is not provided
3. **Excluded Generated Columns**: Ensured that generated columns (`name`, `email`, `phone`, `position`) are not included in INSERT operations

## Files Changed
- `server/storage.ts`: Updated `createEmployee` method to use raw SQL
- `shared/schema.ts`: Fixed schema definition for `empId` field

## Database Schema Requirements
For fresh Ubuntu deployments, ensure the following:

1. **Employee ID Auto-generation** (optional, manual generation works as fallback):
```sql
ALTER TABLE employees ALTER COLUMN emp_id SET DEFAULT concat('EMP-', lpad((nextval('employees_id_seq'::regclass))::text, 5, '0'::text));
```

2. **Generated Name Column**:
```sql
ALTER TABLE employees ALTER COLUMN name SET DEFAULT NULL;
UPDATE employees SET name = COALESCE(english_name, arabic_name, emp_id) WHERE name IS NULL;
```

## Testing
After applying these changes:
- Employee creation should work on both Replit and Ubuntu environments
- Import functionality should work correctly
- Manual employee addition through UI should function properly

## Deployment Steps for Ubuntu
1. Pull latest code changes
2. Run `npm install` if needed
3. Run `npm run db:push` to sync schema (optional)
4. Restart the application: `npm run dev`

The application will now handle employee creation reliably across both environments.