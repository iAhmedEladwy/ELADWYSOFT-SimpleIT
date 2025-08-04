# Replit-Local Environment Sync Guide

## Issue: Employee Creation Working in Replit but Failing Locally

### Root Cause Analysis

The discrepancy between Replit (working) and local environment (failing) is likely due to:

1. **Database Schema Differences**
   - Replit uses PostgreSQL with sequences for auto-increment
   - Local environment may be missing sequences or have different constraints

2. **Code Version Mismatch**
   - Replit has latest fixes from our recent work
   - Local environment may be missing critical updates

3. **Environment Configuration**
   - Different PostgreSQL versions or connection settings
   - Missing environment variables

### Critical Files to Sync from Replit to Local

#### 1. **shared/schema.ts** (CRITICAL)
- Contains latest database schema with proper ID generation
- Fixed duplicate table definitions
- Corrected enum values to match actual database

#### 2. **server/storage.ts** (CRITICAL)
- Updated `createEmployee` method with raw SQL for cross-platform compatibility
- Fixed column name mismatches (buyPrice vs purchasePrice)
- Proper ID auto-generation handling

#### 3. **server/routes.ts** (IMPORTANT)
- `/api/employees/create-raw` endpoint implementation
- Proper error handling and logging
- Database auto-increment support

#### 4. **Database Schema Updates**
```sql
-- Ensure sequences exist for auto-increment
CREATE SEQUENCE IF NOT EXISTS employees_emp_id_seq;
ALTER TABLE employees ALTER COLUMN emp_id SET DEFAULT 'EMP-' || LPAD(nextval('employees_emp_id_seq')::TEXT, 5, '0');

-- Similar for assets and tickets
CREATE SEQUENCE IF NOT EXISTS assets_asset_id_seq;
CREATE SEQUENCE IF NOT EXISTS tickets_ticket_id_seq;
```

### Synchronization Steps

#### Step 1: Export Current Replit Code
1. Use git to identify differences: `git status` and `git diff`
2. Export current schema: `node scripts/sync-schema.js`
3. Backup current Replit state

#### Step 2: Update Local Environment
1. Pull latest changes from Replit repository
2. Update database schema to match Replit
3. Run migrations: `npm run db:push`
4. Verify sequences and auto-increment setup

#### Step 3: Test Local Environment
1. Test employee creation API directly
2. Verify database insertions
3. Compare API responses with Replit

#### Step 4: Environment Variables
Ensure local environment has:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/simpleit
NODE_ENV=development
```

### Quick Diagnostic Commands

#### Test Employee Creation API Directly:
```bash
curl -X POST http://localhost:3000/api/employees/create-raw \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "englishName": "Test Employee",
    "department": "IT",
    "idNumber": "12345",
    "title": "Developer",
    "employmentType": "Full-time",
    "status": "Active",
    "joiningDate": "2025-08-04"
  }'
```

#### Check Database Sequences:
```sql
SELECT sequence_name FROM information_schema.sequences;
SELECT nextval('employees_emp_id_seq');
```

#### Verify Employee Table Structure:
```sql
\d employees
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'employees';
```

### Expected Resolution

After syncing these critical files and database schema, the local environment should:
1. ✅ Create employees successfully
2. ✅ Auto-generate proper IDs (EMP-XXXXX format)
3. ✅ Return 201 status with complete employee data
4. ✅ Update frontend employee list immediately

This will ensure both environments behave identically.