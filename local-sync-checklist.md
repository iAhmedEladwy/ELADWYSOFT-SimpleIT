# Local Environment Sync Checklist

## Critical Files to Copy from Replit to Local

### ✅ Step 1: Core Code Files (MUST SYNC)

1. **shared/schema.ts** - Complete schema rebuild with fixed relations
2. **server/storage.ts** - Updated createEmployee method with raw SQL  
3. **server/routes.ts** - Employee creation endpoint `/api/employees/create-raw`
4. **client/src/pages/Employees.tsx** - Fixed caching and refetch logic

### ✅ Step 2: Database Schema Update

Run the provided SQL script: `local-environment-fix.sql`

```bash
psql -d your_database < local-environment-fix.sql
```

### ✅ Step 3: Environment Configuration

Verify your local `.env` has:
```
DATABASE_URL=postgresql://username:password@localhost:5432/simpleit
NODE_ENV=development
```

### ✅ Step 4: Dependencies Update

```bash
npm install
npm run db:push  # Apply schema changes
```

### ✅ Step 5: Test Employee Creation

#### API Test:
```bash
curl -X POST http://localhost:3000/api/employees/create-raw \
  -H "Content-Type: application/json" \
  -d '{
    "englishName": "Test Local",
    "department": "IT", 
    "idNumber": "TEST123",
    "title": "Developer",
    "employmentType": "Full-time",
    "status": "Active",
    "joiningDate": "2025-08-04"
  }'
```

Expected Response: `201 Created` with employee data including auto-generated `emp_id`

#### Frontend Test:
1. Login to local application
2. Go to Employees page
3. Click "Add Employee"
4. Fill form and save
5. Verify employee appears in list immediately

## Key Differences Fixed

### Before (Local - Broken):
- ❌ Missing database sequences
- ❌ Old schema with relation errors  
- ❌ Cache issues preventing UI updates
- ❌ Manual ID generation conflicts

### After (Matching Replit - Working):
- ✅ Database auto-generates IDs (EMP-XXXX)
- ✅ Fixed schema with proper relations
- ✅ Immediate UI updates after creation
- ✅ Consistent cross-platform behavior

## Troubleshooting

### If Employee Creation Still Fails:

1. **Check Database Connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

2. **Verify Sequences Exist:**
   ```sql
   SELECT sequence_name FROM information_schema.sequences;
   ```

3. **Test Sequence Generation:**
   ```sql
   SELECT 'EMP-' || LPAD(nextval('employees_emp_id_seq')::TEXT, 5, '0');
   ```

4. **Check API Endpoint:**
   ```bash
   curl -X GET http://localhost:3000/api/employees
   ```

5. **Verify Console Logs:**
   - Backend: "Employee created successfully"  
   - Frontend: Success toast message
   - Network: 201 response from POST request

## Success Criteria

After following this checklist, your local environment should:
- ✅ Create employees with auto-generated IDs
- ✅ Show immediate success feedback
- ✅ Update employee list without refresh
- ✅ Match Replit behavior exactly

This ensures identical functionality across all deployment environments.