# Database Schema Comparison Report

## Executive Summary
**CRITICAL FINDINGS**: Your shared/schema.ts is INCOMPLETE compared to your working Replit database.

**Status**: ❌ **SCHEMA MISMATCH** - Multiple missing tables and columns detected

---

## Database Analysis Results

### 📊 **Tables in Replit Database: 25 tables**
### 📁 **Tables in schema.ts: ~15 tables** (incomplete definitions)

---

## ❌ **MISSING TABLES IN SCHEMA.TS**

The following tables exist in your working Replit database but are **MISSING** from your schema.ts file:

1. **`asset_upgrades`** - Complete upgrade management system (43 columns)
2. **`upgrade_history`** - Upgrade tracking and history
3. **`changes_log`** - System change management
4. **`ticket_comments`** - Ticket comment system
5. **`ticket_history`** - Ticket change tracking
6. **`notifications`** - User notification system
7. **`password_reset_tokens`** - Password reset functionality
8. **`security_questions`** - Security question system

---

## ⚠️ **INCOMPLETE TABLE DEFINITIONS**

### `custom_request_types` - Missing columns:
- `color` (VARCHAR(7) DEFAULT '#3B82F6')
- `is_active` (BOOLEAN DEFAULT true)
- `priority` (VARCHAR(20) DEFAULT 'Medium')
- `sla_hours` (INTEGER DEFAULT 24)

### `assets` - Missing columns:
- `cpu` (VARCHAR(200))
- `ram` (VARCHAR(100)) 
- `storage` (VARCHAR(200))

### `employees` - Extra columns in database:
- `name` (VARCHAR(100))
- `email` (VARCHAR(100))
- `phone` (VARCHAR(20))
- `position` (VARCHAR(100))

### `tickets` - Missing advanced columns:
- `merged_into_id` (INTEGER REFERENCES tickets(id))
- Plus several other workflow columns

---

## 🔧 **ENUM MISMATCHES**

Your schema.ts enums don't match the database:

**Database Enums:**
- `maintenance_type`: ['Preventive', 'Corrective', 'Emergency']
- `upgrade_priority`: ['Low', 'Medium', 'High', 'Critical']
- `upgrade_risk`: ['Low', 'Medium', 'High']
- `upgrade_status`: ['Planned', 'In Progress', 'Completed', 'Cancelled', 'Failed']
- `notification_type`: ['info', 'warning', 'error', 'success']

**Missing from schema.ts:**
- All upgrade-related enums
- Notification type enum

---

## 📋 **ACTION ITEMS TO FIX SCHEMA MISMATCH**

### 1. **IMMEDIATE**: Update shared/schema.ts
- Add all missing tables with complete column definitions
- Add missing enum types
- Update existing table definitions with missing columns

### 2. **CRITICAL**: Missing table definitions needed:
```typescript
// Missing critical tables:
export const assetUpgrades = pgTable(...)
export const upgradeHistory = pgTable(...)
export const ticketComments = pgTable(...)
export const ticketHistory = pgTable(...)
export const notifications = pgTable(...)
export const passwordResetTokens = pgTable(...)
export const securityQuestions = pgTable(...)
export const changesLog = pgTable(...)
```

### 3. **UPDATE**: Incomplete definitions
- `customRequestTypes` - add color, isActive, priority, slaHours
- `assets` - add cpu, ram, storage columns
- `tickets` - add mergedIntoId and other missing fields

---

## 🎯 **NEXT STEPS**

1. ✅ **COMPLETED**: Exported complete working database schema to `database-schema-export.sql`
2. ⏳ **PENDING**: Update `shared/schema.ts` with missing tables and columns
3. ⏳ **PENDING**: Commit and push complete schema to GitHub
4. ⏳ **PENDING**: Test local deployment with updated schema

---

## 📁 **Files Created**

- `database-schema-export.sql` - Complete PostgreSQL schema export
- `setup-ubuntu-environment.sh` - Ubuntu deployment script with latest versions
- `schema-comparison-report.md` - This analysis report

---

## ⚡ **Impact Analysis**

**Why your local deployment has schema mismatches:**
- Missing 8+ critical tables
- Incomplete column definitions in existing tables
- Missing enum types causing type errors
- Missing foreign key relationships

**Resolution:** Update schema.ts to match the complete working database structure exported from Replit.