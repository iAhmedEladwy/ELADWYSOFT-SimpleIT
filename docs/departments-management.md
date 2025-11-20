# Departments Management Guide

## Database Information

**Table:** `system_config`  
**Field:** `departments` (text array)

Departments are NOT stored in a separate table. They are stored as a PostgreSQL text array in the `system_config` table.

## SQL Commands

### View Current Departments
```sql
SELECT id, departments FROM system_config;
```

### View All System Config (including departments)
```sql
SELECT * FROM system_config;
```

### Delete All Departments
```sql
UPDATE system_config 
SET departments = ARRAY[]::text[], 
    updated_at = NOW() 
WHERE id = 1;
```

### Add Departments Manually
```sql
UPDATE system_config 
SET departments = ARRAY['IT', 'HR', 'Finance', 'Operations', 'Marketing']::text[], 
    updated_at = NOW() 
WHERE id = 1;
```

### Add a Single Department to Existing List
```sql
UPDATE system_config 
SET departments = array_append(departments, 'New Department'), 
    updated_at = NOW() 
WHERE id = 1;
```

### Remove a Specific Department
```sql
UPDATE system_config 
SET departments = array_remove(departments, 'Department Name'), 
    updated_at = NOW() 
WHERE id = 1;
```

### Check if Departments Column Exists
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'system_config' 
AND column_name = 'departments';
```

## Common Issues

### Issue: White Screen After Saving Department
**Cause:** Race condition between mutation success and query refetch  
**Fix:** Applied in commit - mutation now updates local state immediately before invalidating queries

### Issue: Departments Not Displaying
**Possible Causes:**
1. Departments array is null in database
2. Query not fetching properly
3. State not updating after config load

**Solution:**
```sql
-- Check if departments exist
SELECT departments FROM system_config WHERE id = 1;

-- If null, initialize with empty array
UPDATE system_config 
SET departments = ARRAY[]::text[] 
WHERE id = 1 AND departments IS NULL;
```

## Application Behavior

- Departments are loaded from `system_config` table on component mount
- Changes are saved immediately when adding/editing/deleting
- The mutation updates both database AND local state to prevent UI flash
- Tab state is preserved during department operations
