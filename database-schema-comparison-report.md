# Database Schema Comparison Report

## Summary
This report compares the current database structure with the schema definition in `shared/schema.ts` to identify differences.

## Database Analysis Completed
- **Database Tables Found**: 25 tables
- **Schema File Tables Defined**: 25 tables  
- **Analysis Status**: In Progress

## Tables Present in Both Database and Schema File
✅ All core tables are present in both database and schema:

1. `activity_log` ✅
2. `asset_maintenance` ✅
3. `asset_sale_items` ✅
4. `asset_sales` ✅
5. `asset_service_providers` ✅
6. `asset_transactions` ✅
7. `asset_upgrades` ✅
8. `assets` ✅
9. `changes_log` ✅
10. `custom_asset_brands` ✅
11. `custom_asset_statuses` ✅
12. `custom_asset_types` ✅
13. `custom_request_types` ✅
14. `employees` ✅
15. `notifications` ✅
16. `password_reset_tokens` ✅
17. `security_questions` ✅
18. `service_providers` ✅
19. `sessions` ✅
20. `system_config` ✅
21. `ticket_comments` ✅
22. `ticket_history` ✅
23. `tickets` ✅
24. `upgrade_history` ✅
25. `users` ✅

## Missing Tables
- **In Database but not in Schema**: None identified so far
- **In Schema but not in Database**: None identified so far

## Enum Values Comparison
✅ **All enum types and values match between database and schema**:

### Database Enums Found:
- `access_level`: ['1', '2', '3', '4'] ✅
- `asset_status`: ['Available', 'In Use', 'Damaged', 'Maintenance', 'Sold', 'Retired'] ✅
- `asset_transaction_type`: ['Check-Out', 'Check-In'] ✅
- `asset_type`: ['Laptop', 'Desktop', 'Mobile', 'Tablet', 'Monitor', 'Printer', 'Server', 'Network', 'Other'] ✅
- `employee_status`: ['Active', 'Resigned', 'Terminated', 'On Leave'] ✅
- `employment_type`: ['Full-time', 'Part-time', 'Contract', 'Intern'] ✅
- `maintenance_type`: ['Preventive', 'Corrective', 'Upgrade', 'Repair', 'Inspection', 'Cleaning', 'Replacement'] ✅
- `notification_type`: ['Asset', 'Ticket', 'System', 'Employee'] ✅
- `role_enum`: ['employee', 'agent', 'manager', 'admin'] ✅
- `ticket_priority`: ['Low', 'Medium', 'High'] ✅
- `ticket_status`: ['Open', 'In Progress', 'Resolved', 'Closed'] ✅
- `upgrade_priority`: ['Critical', 'High', 'Medium', 'Low'] ✅
- `upgrade_risk`: ['Critical', 'High', 'Medium', 'Low'] ✅
- `upgrade_status`: ['Planned', 'Approved', 'In Progress', 'Testing', 'Completed', 'Failed', 'Cancelled', 'Rolled Back'] ✅

### Additional Database Enums (Not in Schema):
- `ticket_category`: ['Hardware', 'Software', 'Network', 'Other']
- `ticket_request_type`: ['Hardware', 'Software', 'Network', 'Other']

## Column Structure Analysis

### ❌ MAJOR DIFFERENCES FOUND:

#### 1. Users Table - Missing Columns in Database:
**Database has 9 columns, Schema defines additional fields:**
- ❌ `firstName` (varchar) - **MISSING from database**
- ❌ `lastName` (varchar) - **MISSING from database** 
- ❌ `profileImageUrl` (varchar) - **MISSING from database**
- ❌ `employeeId` (integer) - **MISSING from database**
- ❌ `managerId` (integer) - **MISSING from database**

**Current Database Structure for users table:**
```sql
- id (serial, primary key)
- username (varchar(50), not null, unique)  
- password (text, not null)
- email (varchar(100), not null, unique)
- access_level (enum, default '1')
- role (enum, default 'employee') 
- is_active (boolean, default true)
- created_at (timestamp, default now())
- updated_at (timestamp, default now())
```

**Schema defines these additional columns:**
```typescript
- firstName: varchar("first_name") 
- lastName: varchar("last_name")
- profileImageUrl: varchar("profile_image_url")
- employeeId: integer("employee_id")
- managerId: integer("manager_id")
```

#### 2. Missing Enum Types:
- ❌ `asset_condition` enum - **MISSING from database** (defined in schema as ['New', 'Good', 'Fair', 'Poor', 'Damaged'])

#### 3. Extra Database Enums (Not in Schema):
- ⚠️ `ticket_category` enum exists in database but not defined in schema
- ⚠️ `ticket_request_type` enum exists in database but not defined in schema

## Summary of Differences:

### 🔴 CRITICAL Issues (5 total):
1. **Users table missing 5 columns**: firstName, lastName, profileImageUrl, employeeId, managerId
2. **Missing asset_condition enum** that schema expects

### 🟡 MODERATE Issues (2 total):
1. **Extra ticket_category enum** in database not in schema
2. **Extra ticket_request_type enum** in database not in schema

### ✅ What's Working Well:
- All 25 core tables exist in both database and schema
- All primary enum types match perfectly (18 enums verified)
- Core table structures are consistent
- Foreign key relationships are intact

## Recommendations:

**Before making any changes, please confirm:**

1. **Add missing users table columns** (5 columns):
   ```sql
   ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
   ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
   ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(255);
   ALTER TABLE users ADD COLUMN employee_id INTEGER REFERENCES employees(id);
   ALTER TABLE users ADD COLUMN manager_id INTEGER REFERENCES users(id);
   ```

2. **Create missing asset_condition enum**:
   ```sql
   CREATE TYPE asset_condition AS ENUM ('New', 'Good', 'Fair', 'Poor', 'Damaged');
   ```

3. **Handle extra enums** (optional):
   - Either add `ticket_category` and `ticket_request_type` to schema
   - Or remove from database if unused

**Status**: Database and schema are NOT 100% identical. Key differences identified that may affect application functionality.

**Impact**: Missing user profile fields and asset condition enum could cause runtime errors in features that depend on these schema elements.
