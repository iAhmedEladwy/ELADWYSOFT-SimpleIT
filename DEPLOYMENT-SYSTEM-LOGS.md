# System Logging & Super Admin Deployment Guide

## Overview
This guide covers the deployment of the **System Logging** feature with **Super Admin** role (Access Level 5) in your virtual environment.

---

## 📦 What Was Implemented

### 1. Super Admin Role (Access Level 5)
- New role tier above regular Admin
- Access to developer tools (System Logs)
- Hidden from regular admin interface

### 2. System Logs Feature
- **Hybrid Logging**: Database (errors) + File (all levels) + Console (development)
- **Log Levels**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **Daily Rotating Files**: Stored in `logs/YYYY-MM-DD.log`
- **Database Table**: `system_logs` for error tracking and resolution

### 3. Files Modified/Created
```
shared/schema.ts                          (Updated: +17 lines)
server/services/logger.ts                 (New: 194 lines)
server/rbac.ts                            (Updated: +7 lines)
server/routes/systemLogs.ts               (New: 206 lines)
server/routes.ts                          (Updated: +6 lines)
client/src/pages/SystemLogs.tsx           (New: 505 lines)
client/src/App.tsx                        (Updated: +11 lines)
client/src/components/layout/Sidebar.tsx  (Updated: +30 lines)
```

---

## 🗄️ Database Migration

### Step 1: Push Schema Changes to Database
On your **virtual environment** server, run:

```bash
cd /path/to/SimpleIT
npm run db:push
```

This will create:
- ✅ Access level enum value `'5'`
- ✅ Role enum value `'super_admin'`
- ✅ Log level enum: `DEBUG`, `INFO`, `WARN`, `ERROR`, `CRITICAL`
- ✅ `system_logs` table (11 fields)
- ✅ `notification_preferences` table (from Phase 3)

### Step 2: Verify Database Changes
Connect to PostgreSQL and verify:

```sql
-- Check enums
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'access_level'
);
-- Should include: 1, 2, 3, 4, 5

SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'role'
);
-- Should include: employee, agent, manager, admin, super_admin

-- Check system_logs table
\d system_logs
-- Should show: id, timestamp, level, module, message, user_id, request_id, metadata, stack_trace, resolved, created_at
```

---

## 👤 Creating Super Admin User

### ⚡ Quick Start (Automatic - Recommended)
The migration script **automatically creates** a Super Admin user:

```bash
# Run the migration script - it creates user "dev" automatically
psql -U your_user -d simpleit -f scripts/migrate-system-logs.sql
```

**Default Credentials:**
- **Username**: `dev`
- **Password**: `SuperDev@2025!`
- **⚠️ IMPORTANT**: Change this password immediately after first login!

The script will:
- ✅ Create user "dev" if it doesn't exist
- ✅ Promote existing "dev" user to Super Admin if found
- ✅ Display credentials after completion

### Option 1: Promote Existing Admin User (SQL)
```sql
-- Replace user_id with your admin user ID (e.g., 1)
UPDATE users 
SET role = 'super_admin', access_level = '5' 
WHERE id = 1;
```

### Option 2: Create Custom Super Admin User (SQL)
First, generate a password hash:
```bash
# Generate bcrypt hash for your password
node scripts/generate-password-hash.js "YourStrongPassword123!"
```

Then insert the user:
```sql
INSERT INTO users (username, full_name, email, password_hash, role, access_level, is_active)
VALUES (
  'your_username',
  'Your Full Name',
  'you@example.com',
  '$2a$10$...',  -- Use bcrypt hash of your password
  'super_admin',
  '5',
  true
);
```

### Option 3: Via Application (Future Enhancement)
Add a UI toggle in Admin Console to promote users to Super Admin (requires additional implementation).

---

## 🚀 Accessing System Logs

### Step 1: Login as Super Admin
1. Login with a user account that has `role = 'super_admin'`
2. Navigate to Dashboard
3. Open sidebar (Admin Console section)

### Step 2: Reveal Hidden Menu
**Triple-click** the version text at the bottom of the sidebar:
- Version text: "SimpleIT v0.4.7" (bottom of sidebar)
- On third click, **System Logs** menu item appears
- Menu item has yellow "DEV" badge
- Located under "System Health" in Admin Console submenu

### Step 3: Access System Logs Page
- Click **System Logs** menu item
- URL: `/admin-console/system-logs`
- Protected by `super_admin` role guard (404 for non-super admins)

---

## 📊 Using System Logs Interface

### Statistics Dashboard (Top Cards)
1. **Total Logs**: Count of all log entries
2. **Errors (24h)**: ERROR/CRITICAL logs in last 24 hours
3. **Unresolved Issues**: Logs marked as unresolved
4. **Top Modules**: Most active modules by log count

### Filters
- **Level**: Filter by DEBUG, INFO, WARN, ERROR, CRITICAL
- **Module**: Filter by specific module name (e.g., 'auth', 'api', 'backup')
- **Search**: Search in log messages
- **Date Range**: Start date / End date
- **Status**: All / Resolved / Unresolved
- **Limit**: 50, 100, 250, 500, 1000 records
- **Auto-refresh**: Toggle 30-second auto-refresh

### Actions
- **Refresh**: Manual refresh of log data
- **Export CSV**: Download logs as CSV file
- **Cleanup Old Logs**: Delete logs older than 90 days
- **Mark Resolved**: Mark individual logs as fixed (changes resolved flag)

---

## 🛠️ Developer Usage - Logger Service

### Importing the Logger
```typescript
import { logger } from '@/services/logger';
```

### Logging Methods

#### 1. DEBUG (Development only, File + Console)
```typescript
logger.debug('module-name', 'Debug message', { additionalData: 'value' });
```

#### 2. INFO (General information, File + Console)
```typescript
logger.info('auth', 'User login successful', { userId: 123, username: 'john' });
```

#### 3. WARN (Warning conditions, File + Console)
```typescript
logger.warn('api', 'Deprecated API endpoint used', { endpoint: '/old-api' });
```

#### 4. ERROR (Errors, File + Console + Database)
```typescript
logger.error('auth', 'Login failed', { username: 'john', error: err.message });
```

#### 5. CRITICAL (Critical failures, File + Console + Database)
```typescript
logger.critical('backup', 'Backup failed catastrophically', { error: err.stack });
```

### Helper Methods

#### Log HTTP Requests
```typescript
logger.logRequest(req, res);
// Captures: method, URL, status, IP, user agent, duration
```

#### Log HTTP Errors
```typescript
logger.logHttpError(req, error);
// Captures: request details + error stack trace
```

#### Generate Request IDs
```typescript
const requestId = logger.generateRequestId();
// Returns: UUID for tracking related logs
```

---

## 📁 File Logging Structure

### Log File Location
```
SimpleIT/
└── logs/
    ├── 2025-11-11.log
    ├── 2025-11-12.log
    └── 2025-11-13.log
```

### Log File Format
```
[2025-11-11T14:23:45.123Z] [INFO] [auth] User login successful
  Metadata: {"userId":123,"username":"john"}

[2025-11-11T14:24:12.456Z] [ERROR] [api] Database connection failed
  Metadata: {"host":"localhost","port":5432}
  Stack: Error: ECONNREFUSED
    at Socket.connect (net.js:...)
```

### Log Rotation
- **Daily rotation**: New file created at midnight
- **No automatic deletion**: Old files remain until manual cleanup
- **Database cleanup**: Use "Cleanup Old Logs" button (default 90 days)

---

## 🔒 Security & Permissions

### RBAC Configuration
```typescript
// server/rbac.ts
PERMISSIONS.SYSTEM_LOGS = 'system:logs'

ROLE_PERMISSIONS[ROLES.SUPER_ADMIN] = [
  // ... all admin permissions
  PERMISSIONS.SYSTEM_LOGS  // Exclusive to Super Admin
]
```

### Route Protection
```typescript
// All system logs API routes protected:
requirePermission(PERMISSIONS.SYSTEM_LOGS)

// UI Route protected:
<RoleGuard allowedRoles={['super_admin']}>
  <SystemLogs />
</RoleGuard>
```

### Hidden UI Access
- Regular admins **cannot see** System Logs menu
- Triple-click trigger only works for `super_admin` role
- Direct URL access blocked by RoleGuard (404 error)

---

## 🧪 Testing System Logs

### 1. Trigger Test Logs
Run in browser console or server terminal:
```typescript
// In server code or route handler:
import { logger } from './services/logger';

logger.debug('test', 'Debug test message');
logger.info('test', 'Info test message');
logger.warn('test', 'Warning test message');
logger.error('test', 'Error test message', { testData: 123 });
logger.critical('test', 'Critical test message');
```

### 2. Verify Logs
- **Console**: Check terminal for colored output (dev mode)
- **File**: Check `logs/YYYY-MM-DD.log` for all levels
- **Database**: Check System Logs UI for ERROR/CRITICAL only

### 3. Test Filters
- Filter by level (ERROR)
- Search for "test"
- Check date range filters
- Test resolved/unresolved toggle

### 4. Test Actions
- Mark a log as resolved → Should show green badge
- Export CSV → Download should contain all visible logs
- Cleanup old logs → Confirm deletion count

---

## 🔄 Migration from console.log

### Find Console Statements
```bash
# Search for console.log usage
grep -r "console\.log" server/
grep -r "console\.error" server/
```

### Replace Gradually
**Priority areas:**
1. Authentication routes (`server/routes.ts` lines 545-655)
2. Error handlers (`server/middleware/error-handler.ts`)
3. API endpoints (asset, employee, ticket routes)
4. Background jobs (backup scheduler, notification service)

**Replacement patterns:**
```typescript
// Before:
console.log('User logged in:', userId);

// After:
logger.info('auth', 'User logged in', { userId });

// Before:
console.error('Database error:', error);

// After:
logger.error('database', 'Database error', { error: error.message, stack: error.stack });
```

---

## 🚨 Troubleshooting

### Issue: Triple-click not working
**Solution**: 
- Ensure logged in as `super_admin` role
- Click version text (not logo)
- Wait 500ms between clicks
- Check browser console for errors

### Issue: System Logs page shows 404
**Solution**:
- Verify user role is `super_admin` in database
- Check route is mounted in `App.tsx`
- Verify `RoleGuard` includes `'super_admin'`

### Issue: Logs not appearing in database
**Solution**:
- Check `system_logs` table exists: `SELECT * FROM system_logs;`
- Only ERROR and CRITICAL logs go to database
- Check file logs to verify logger is working
- Verify `db.ts` connection is active

### Issue: Cannot create logs directory
**Solution**:
```bash
# Create logs directory manually
mkdir -p /path/to/SimpleIT/logs
chmod 755 /path/to/SimpleIT/logs
```

### Issue: Permission denied when accessing /admin-console/system-logs
**Solution**:
- Verify `PERMISSIONS.SYSTEM_LOGS` exists in `rbac.ts`
- Check `ROLE_PERMISSIONS[ROLES.SUPER_ADMIN]` includes `SYSTEM_LOGS`
- Restart server after RBAC changes

---

## 📝 Next Steps (Optional Enhancements)

1. **Replace console.log throughout codebase** (60+ occurrences)
2. **Add logger middleware** to auto-log all HTTP requests
3. **Email alerts** for CRITICAL logs to developers
4. **Log search indexing** for faster searches (ElasticSearch integration)
5. **Log analytics dashboard** with charts and trends
6. **Export to external logging services** (Sentry, LogRocket)
7. **Add UI toggle** in Admin Console to promote users to Super Admin

---

## 📚 Summary

✅ **Super Admin role** (level 5) created
✅ **System Logs database table** added
✅ **Hybrid logger service** implemented
✅ **System Logs API** with 4 endpoints
✅ **System Logs UI page** with filters and statistics
✅ **Hidden access trigger** (triple-click version)
✅ **Navigation integrated** with role guards

### Deployment Checklist:
- [ ] Run `npm run db:push` on virtual environment
- [ ] Create/promote Super Admin user via SQL
- [ ] Login as Super Admin
- [ ] Triple-click version text to reveal menu
- [ ] Access System Logs page
- [ ] Test logging, filters, and actions
- [ ] Verify file logs in `logs/` directory
- [ ] Start replacing console.log with logger (gradual)

**Your system logging infrastructure is ready for production! 🎉**
