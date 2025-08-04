# Code vs Database Column Mismatch Report

Generated: August 4, 2025

## Critical Issues Found

### 1. Assets Table Mismatches 🔴 CRITICAL

**Database Columns (actual):**
- `buy_price` (numeric)
- `model_name` (varchar)
- `model_number` (varchar) 
- `assigned_employee_id` (integer)
- `warranty_expiry_date` (date)
- `out_of_box_os` (varchar)
- `cpu`, `ram`, `storage` (varchar)

**Schema File Expects:**
- `purchase_price` (decimal) ❌ Should be `buy_price`
- `modelName` → `model_name` ✅ 
- `purchasePrice` → `purchase_price` ❌ Should be `buy_price`
- `assignedToId` → `assigned_to_id` ❌ Should be `assigned_employee_id`
- `warrantyExpiry` → `warranty_expiry` ❌ Should be `warranty_expiry_date`
- Missing: `cpu`, `ram`, `storage`, `specs`, `out_of_box_os`, `life_span`

### 2. Custom Request Types Table Mismatches 🔴 CRITICAL

**Database Columns (actual):**
- `id`, `name`, `description`, `color`, `is_active`, `created_at`, `updated_at`, `priority`, `sla_hours`

**Code Expects:**
- `category` ❌ DOES NOT EXIST in database

### 3. Storage.ts Query Issues 🔴 CRITICAL

**Lines with column mismatches:**
- Line 889: `asset.buyPrice || asset.purchasePrice` - references non-existent `purchasePrice`
- Line 2009: References `category` column in `custom_request_types` that doesn't exist

## Root Cause Analysis

The schema file `shared/schema.ts` was rebuilt from scratch but doesn't accurately reflect the actual database structure. The database contains:

1. **Legacy column names** that differ from the new schema expectations
2. **Additional columns** not defined in the schema file  
3. **Missing columns** that the code expects but don't exist in DB

## Impact Assessment

### Currently Broken Features:
- ❌ Asset loading (purchase_price column error)
- ❌ Custom request types loading (category column error)
- ❌ Dashboard asset summary
- ❌ Asset management pages

### Working Features:
- ✅ User authentication
- ✅ Employee management  
- ✅ Basic ticket management
- ✅ Navigation and UI

## Required Fixes

### Priority 1: Assets Table
```sql
-- Either update database to match schema:
ALTER TABLE assets RENAME COLUMN buy_price TO purchase_price;
ALTER TABLE assets RENAME COLUMN assigned_employee_id TO assigned_to_id;
ALTER TABLE assets RENAME COLUMN warranty_expiry_date TO warranty_expiry;

-- OR update schema to match database:
-- Change purchasePrice → buyPrice in schema.ts
-- Change assignedToId → assignedEmployeeId in schema.ts  
-- Change warrantyExpiry → warrantyExpiryDate in schema.ts
```

### Priority 2: Custom Request Types
```sql
-- Add missing category column or remove from code queries
ALTER TABLE custom_request_types ADD COLUMN category VARCHAR(100);
```

### Priority 3: Update Storage.ts
- Fix column references in getAllAssets query
- Fix column references in getCustomRequestTypes query

## Recommendations

**Option A: Update Database** (Safer)
- Rename database columns to match new schema
- Add missing columns with sensible defaults
- Test thoroughly

**Option B: Update Schema File** (Faster)
- Modify schema.ts to match actual database columns
- Update TypeScript interfaces accordingly
- Update storage.ts queries

**Recommended: Option A** - Update database to match the new schema design for consistency with future deployments.

## Status: 🔴 BLOCKING ISSUES
Multiple core features are broken due to column mismatches.