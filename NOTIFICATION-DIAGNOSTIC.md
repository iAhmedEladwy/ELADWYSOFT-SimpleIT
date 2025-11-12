# Notification System Diagnostic

## Issues Reported
1. **Notifications not working anywhere**
2. **Service Worker errors not appearing in System Logs**

---

## Issue 1: Notifications Not Working

### Root Cause Analysis

#### Problem: Silent Failures in Notification Creation
The `createNotification()` function can return `null` if:
1. User has disabled the notification type in preferences
2. An error occurs during creation

**Current Code** (`server/routes/notifications.ts:141-203`):
```typescript
export async function createNotification(params: {
  userId: number;
  title: string;
  message: string;
  type: 'Asset' | 'Ticket' | 'System' | 'Employee';
  entityId?: number;
}) {
  try {
    // Check user's notification preferences
    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(schema.notificationPreferences.userId, params.userId)
    });

    // ... preference checking logic ...
    
    // Only create notification if user has it enabled
    if (!isEnabled) {
      return null; // ⚠️ SILENT FAILURE - No notification created
    }

    const [notification] = await db.insert(schema.notifications)
      .values({...})
      .returning();
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error); // ⚠️ Only console.error, no system log
    throw error;
  }
}
```

#### Issues Identified:

1. **No Error Logging**: Errors only go to `console.error`, not system logs
2. **Silent Null Returns**: When `isEnabled = false`, function returns `null` with no logging
3. **No Debugging Info**: Can't tell if notification was skipped vs. failed
4. **Preference Logic May Be Faulty**: Complex string matching could miss cases

### Diagnosis Steps:

```sql
-- Check if notification_preferences table has data
SELECT * FROM notification_preferences LIMIT 10;

-- Check if notifications table is receiving records
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- Check if any users have ALL notifications disabled
SELECT 
  user_id,
  ticket_assignments,
  ticket_status_changes,
  asset_assignments,
  maintenance_alerts,
  upgrade_requests,
  system_announcements,
  employee_changes
FROM notification_preferences
WHERE ticket_assignments = false 
  AND ticket_status_changes = false 
  AND asset_assignments = false;
```

---

## Issue 2: Service Worker Errors Not in System Logs

### Root Cause Analysis

#### Problem: Client-Side Errors Don't Reach Server

**Service Worker Error** (client-side JavaScript):
```
Failed to load 'http://localhost:5000/assets/index-tfqeYiza.js'
ServiceWorker intercepted the request and encountered an unexpected error
sw.js:91:9
```

This error occurs **in the browser** (client-side), NOT on the server.

#### Why It's Not in System Logs:

1. **System logs only capture server-side events** (Node.js/Express)
2. **Service Worker runs in browser** (client-side)
3. **No error reporting mechanism** from client to server

### Current Logging Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
│  - Service Worker errors (sw.js)                            │
│  - React component errors                                   │
│  - Network errors                                           │
│  - Console.log/error                                        │
│                                                              │
│  ❌ These do NOT reach server automatically                 │
└─────────────────────────────────────────────────────────────┘
                           ↕ (only HTTP requests)
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js)                         │
│  - HTTP request errors (4xx, 5xx)                           │
│  - Database errors                                          │
│  - Application errors                                       │
│  - Logger.error/warn/info                                   │
│                                                              │
│  ✅ These ARE logged to system_logs table                   │
└─────────────────────────────────────────────────────────────┘
```

### What Gets Logged Currently:

**✅ Logged to System Logs:**
- Server-side errors (Express error handler)
- HTTP 4xx/5xx responses
- Slow API requests (>2s)
- Database errors
- Notification creation failures (as `console.error`)

**❌ NOT Logged to System Logs:**
- Client-side JavaScript errors
- Service Worker errors
- React component errors
- Browser console errors
- PWA installation errors

---

## Solutions

### Solution 1: Fix Notification Logging

Add proper logging to `createNotification()` function:

```typescript
export async function createNotification(params: {
  userId: number;
  title: string;
  message: string;
  type: 'Asset' | 'Ticket' | 'System' | 'Employee';
  entityId?: number;
}) {
  try {
    // Check user's notification preferences
    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(schema.notificationPreferences.userId, params.userId)
    });

    // ... preference checking logic ...
    
    // Only create notification if user has it enabled
    if (!isEnabled) {
      // ✅ LOG: User has disabled this notification type
      logger.debug('notifications', `Notification skipped: User ${params.userId} disabled ${params.type}`, {
        userId: params.userId,
        metadata: { 
          type: params.type, 
          title: params.title,
          reason: 'User preference disabled'
        }
      });
      return null;
    }

    const [notification] = await db.insert(schema.notifications)
      .values({
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        entityId: params.entityId,
        isRead: false,
      })
      .returning();
    
    // ✅ LOG: Notification created successfully
    logger.info('notifications', `Notification created: ${params.title}`, {
      userId: params.userId,
      metadata: { 
        notificationId: notification.id,
        type: params.type,
        entityId: params.entityId 
      }
    });
    
    return notification;
  } catch (error) {
    // ✅ LOG: Error to system logs (not just console)
    logger.error('notifications', `Failed to create notification: ${params.title}`, {
      userId: params.userId,
      metadata: { type: params.type, title: params.title },
      error: error instanceof Error ? error : new Error(String(error))
    });
    throw error;
  }
}
```

### Solution 2: Add Client Error Reporting API

Create endpoint to receive client-side errors:

**Server** (`server/routes/systemLogs.ts`):
```typescript
// POST /api/system-logs/client-error
router.post('/client-error', async (req, res) => {
  try {
    const { message, stack, level, metadata } = req.body;
    const user = req.user as AuthUser;

    logger[level || 'error']('client', message, {
      userId: user?.id,
      metadata: {
        ...metadata,
        userAgent: req.headers['user-agent'],
        url: req.headers.referer,
      },
      error: stack ? new Error(stack) : undefined
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log client error' });
  }
});
```

**Client** (`client/src/lib/errorReporter.ts`):
```typescript
export function reportClientError(error: Error, context?: Record<string, any>) {
  // Send to server
  fetch('/api/system-logs/client-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      level: 'error',
      metadata: {
        ...context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }
    })
  }).catch(console.error);
}

// Service Worker error handler
self.addEventListener('error', (event) => {
  reportClientError(event.error, { source: 'service-worker' });
});
```

### Solution 3: Add Default Notification Preferences

Ensure all users have preferences initialized:

```typescript
// When user is created, initialize default preferences
await db.insert(schema.notificationPreferences).values({
  userId: newUser.id,
  ticketAssignments: true,      // ✅ Enabled by default
  ticketStatusChanges: true,    // ✅ Enabled by default
  assetAssignments: true,       // ✅ Enabled by default
  maintenanceAlerts: true,      // ✅ Enabled by default
  upgradeRequests: true,        // ✅ Enabled by default
  systemAnnouncements: true,    // ✅ Enabled by default
  employeeChanges: true,        // ✅ Enabled by default
});
```

---

## Testing Checklist

### Test Notifications:
- [ ] Create ticket with assignment → Check notifications table
- [ ] Change ticket status → Check notifications table
- [ ] Assign asset to employee → Check notifications table
- [ ] Check system logs for notification creation/skipping
- [ ] Verify notification preferences exist for test user
- [ ] Test with preferences disabled → Verify logged as "skipped"

### Test System Logs:
- [ ] Trigger 500 error → Check system_logs table
- [ ] Make slow API call (>2s) → Check system_logs for warning
- [ ] Make 404 request → Check system_logs
- [ ] Check if client errors appear (currently: NO)
- [ ] Check file logs in `logs/YYYY-MM-DD.log`

---

## Expected Behavior After Fixes

### Notifications:
✅ Every notification attempt is logged (created/skipped/failed)
✅ Errors are captured in system_logs table
✅ Can diagnose why notifications aren't appearing
✅ All users have default preferences

### System Logs:
✅ Server-side errors logged to system_logs table
✅ Client-side errors can be reported via API
✅ Service Worker errors can be captured and sent to server
✅ Complete audit trail of all system events
