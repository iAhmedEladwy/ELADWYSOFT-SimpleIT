# Phase 2 Implementation Guide: Server-Side Notification Triggers

## Overview
This guide outlines how to complete Phase 2 of the notification system by adding automated server-side triggers throughout the application.

## ✅ Completed
- [x] **Notification Service Created** (`server/services/notificationService.ts`)
- [x] **Ticket Assignment Notifications** - Triggers when ticket assigned
- [x] **Urgent Ticket Detection** - Special notifications for critical tickets
- [x] **Option 2 Implemented** - Unified hook usage between Bell and Dashboard

## 🔄 In Progress - Remaining Integration Points

### 1. Asset Check-Out/Check-In Notifications

**Location**: `server/routes.ts` - Lines with `createAssetTransaction()`

**Implementation**:
```typescript
// After creating transaction (around line 3163, 3402, 3691, 7462, 7531)
const transaction = await storage.createAssetTransaction(transactionData);

// Add notification
if (transaction.type === 'Check-Out' && transaction.employeeId) {
  const employee = await storage.getEmployee(transaction.employeeId);
  const asset = await storage.getAsset(transaction.assetId);
  
  if (employee?.userId) {
    await notificationService.notifyAssetTransaction({
      assetId: transaction.assetId,
      userId: employee.userId,
      assetName: asset?.name || 'Asset',
      transactionType: 'Check-Out',
    });
  }
}
```

**Estimated Time**: 30 minutes  
**Impact**: Employees get notified when assets are assigned to them

---

### 2. Asset Maintenance Notifications

**Location**: Search for maintenance scheduling endpoints

**Find Routes**:
```bash
grep -n "maintenance" server/routes.ts | grep "post\|put"
```

**Implementation**:
```typescript
// When maintenance is scheduled
await notificationService.notifyMaintenanceScheduled({
  assetId: maintenance.assetId,
  userId: employeeUserId, // Employee who has the asset
  assetName: asset.name,
  maintenanceDate: new Date(maintenance.scheduledDate),
  maintenanceType: maintenance.type,
});

// When maintenance is completed
await notificationService.notifyMaintenanceCompleted({
  assetId: maintenance.assetId,
  userId: employeeUserId,
  assetName: asset.name,
  maintenanceType: maintenance.type,
});
```

**Estimated Time**: 45 minutes  
**Impact**: Employees know when their assets need maintenance

---

### 3. Asset Upgrade Request Notifications

**Location**: Search for upgrade-related routes

**Find Routes**:
```bash
grep -n "upgrade" server/routes.ts | grep "post\|put"
```

**Implementation**:
```typescript
// When upgrade is requested (notify manager/admin)
const managers = await db.select()
  .from(schema.users)
  .where(eq(schema.users.role, 'manager'));

for (const manager of managers) {
  await notificationService.notifyUpgradeRequest({
    upgradeId: upgrade.id,
    managerId: manager.id,
    assetName: asset.name,
    requestedBy: requester.username,
    upgradeCost: upgrade.estimatedCost,
  });
}

// When upgrade is approved/rejected (notify requester)
await notificationService.notifyUpgradeDecision({
  upgradeId: upgrade.id,
  requesterId: upgrade.requestedByUserId,
  assetName: asset.name,
  approved: upgrade.status === 'approved',
  approvedBy: approver.username,
});
```

**Estimated Time**: 45 minutes  
**Impact**: Managers get upgrade requests, employees get approval status

---

### 4. Ticket Status Change Notifications

**Location**: Search for ticket update routes

**Find Routes**:
```bash
grep -n "updateTicket\|PUT.*tickets" server/routes.ts
```

**Implementation**:
```typescript
// When ticket status changes
if (oldTicket.status !== newTicket.status) {
  // Notify the person who created the ticket
  if (ticket.submittedById) {
    const employee = await storage.getEmployee(ticket.submittedById);
    if (employee?.userId) {
      await notificationService.notifyTicketStatusChange({
        ticketId: ticket.id,
        userId: employee.userId,
        oldStatus: oldTicket.status,
        newStatus: newTicket.status,
        ticketTitle: ticket.title,
      });
    }
  }
  
  // Notify the assigned user if different from submitter
  if (ticket.assignedToId && ticket.assignedToId !== ticket.submittedById) {
    await notificationService.notifyTicketStatusChange({
      ticketId: ticket.id,
      userId: ticket.assignedToId,
      oldStatus: oldTicket.status,
      newStatus: newTicket.status,
      ticketTitle: ticket.title,
    });
  }
}
```

**Estimated Time**: 30 minutes  
**Impact**: Users stay informed about ticket progress

---

### 5. Employee Onboarding/Offboarding Notifications

**Location**: Search for employee creation/update routes

**Find Routes**:
```bash
grep -n "createEmployee\|updateEmployee" server/routes.ts
```

**Implementation**:
```typescript
// When new employee is created with future start date
if (employee.startDate && new Date(employee.startDate) > new Date()) {
  // Notify HR/Admin users
  await notificationService.notifyByRole({
    role: 'admin',
    title: 'New Employee Onboarding',
    message: `${employee.name} starts on ${employee.startDate}. Prepare onboarding checklist.`,
    type: 'Employee',
    entityId: employee.id,
  });
}

// When employee status changes to "Terminated" or similar
if (employee.status === 'terminated' && employee.lastWorkingDay) {
  await notificationService.notifyEmployeeOffboarding({
    employeeId: employee.id,
    userId: manager.userId,
    employeeName: employee.name,
    lastDay: new Date(employee.lastWorkingDay),
  });
}
```

**Estimated Time**: 45 minutes  
**Impact**: Proactive HR and asset management

---

### 6. System Notifications for Updates

**Location**: Create new admin endpoint or scheduled job

**Implementation**:
```typescript
// After deploying new version
app.post("/api/system/notify-update", authenticateUser, requireRole(ROLES.ADMIN), async (req, res) => {
  const { title, message, targetRole } = req.body;
  
  if (targetRole) {
    await notificationService.notifyByRole({
      role: targetRole,
      title,
      message,
      type: 'System',
    });
  } else {
    const allUsers = await db.select().from(schema.users);
    await notificationService.notifySystem({
      userIds: allUsers.map(u => u.id),
      title,
      message,
    });
  }
  
  res.json({ message: 'Notifications sent' });
});
```

**Estimated Time**: 20 minutes  
**Impact**: Broadcast important system updates to users

---

## 📅 Scheduled Jobs (Future Enhancement)

### Notification Cleanup Job
**File**: Create `server/jobs/notificationCleanup.ts`

```typescript
import * as notificationService from '../services/notificationService';

export async function scheduleNotificationCleanup() {
  // Run daily at 2 AM
  setInterval(async () => {
    try {
      await notificationService.cleanupOldNotifications(30); // 30 days retention
      console.log('✓ Old notifications cleaned up');
    } catch (error) {
      console.error('✗ Notification cleanup failed:', error);
    }
  }, 24 * 60 * 60 * 1000); // Every 24 hours
}
```

### Overdue Ticket Reminders
```typescript
export async function sendOverdueTicketReminders() {
  const overdueTickets = await db.select()
    .from(schema.tickets)
    .where(
      and(
        eq(schema.tickets.status, 'Open'),
        lt(schema.tickets.dueDate, new Date())
      )
    );

  for (const ticket of overdueTickets) {
    if (ticket.assignedToId) {
      await notificationService.createNotification({
        userId: ticket.assignedToId,
        title: `⏰ Overdue: Ticket #${ticket.id}`,
        message: `Ticket "${ticket.title}" is overdue. Please update status.`,
        type: 'Ticket',
        entityId: ticket.id,
      });
    }
  }
}
```

---

## 🧪 Testing Checklist

After implementing each trigger, test:

### Ticket Assignment
- [ ] Assign a ticket to yourself - notification appears
- [ ] Assign an urgent ticket - special notification with emoji
- [ ] Username of assigner appears in notification

### Asset Operations
- [ ] Check out an asset - employee gets notification
- [ ] Check in an asset - notification sent
- [ ] Asset name appears correctly in notification

### Maintenance
- [ ] Schedule maintenance - employee notified
- [ ] Complete maintenance - employee notified
- [ ] Dates formatted correctly

### Upgrades
- [ ] Request upgrade - managers notified
- [ ] Approve upgrade - requester notified with ✅
- [ ] Reject upgrade - requester notified with ❌

### Ticket Status
- [ ] Change ticket status - both parties notified
- [ ] Status change reflected in notification text

### System
- [ ] Admin can send system-wide notification
- [ ] Role-based notifications work (only managers see manager notices)

---

## 📊 Performance Considerations

### Batch Notifications
When notifying multiple users (e.g., all managers):
```typescript
// Good: Use Promise.all for parallel execution
const notifications = managers.map(m => 
  notificationService.notifyUpgradeRequest({...})
);
await Promise.all(notifications);

// Bad: Sequential (slow for many users)
for (const manager of managers) {
  await notificationService.notifyUpgradeRequest({...});
}
```

### Error Handling
Always wrap notification calls in try-catch:
```typescript
try {
  await notificationService.notifyTicketAssignment({...});
} catch (error) {
  console.error('Notification failed (non-fatal):', error);
  // Don't fail the main operation if notification fails
}
```

### Database Indexes
Ensure notifications table has indexes:
```sql
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

---

## 🎯 Success Metrics

After completing Phase 2, you should have:

| Metric | Target |
|--------|--------|
| Notification Triggers | 10+ automated triggers |
| Coverage | All major user actions |
| Response Time | < 100ms per notification |
| Accuracy | 100% (no false notifications) |
| User Engagement | 70%+ notification click-through |

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All notification triggers tested manually
- [ ] Notification cleanup job scheduled
- [ ] Database indexes created
- [ ] Error logging enabled
- [ ] Notification rate limiting considered (prevent spam)
- [ ] User preferences for notification types (Phase 4 feature)

---

## 📝 Next: Phase 3 (Real-Time Notifications)

Once Phase 2 is complete, move to:
- WebSocket integration for instant delivery
- Browser push notifications
- Sound alerts for critical notifications
- Desktop notifications (PWA)

---

## 🔗 Related Files

- **Service**: `server/services/notificationService.ts`
- **Routes**: `server/routes/notifications.ts`
- **Main Routes**: `server/routes.ts`
- **Hook**: `client/src/hooks/use-notifications.ts`
- **Bell Component**: `client/src/components/notifications/NotificationBell.tsx`
- **Dashboard**: `client/src/components/dashboard/Notifications.tsx`

---

## 💡 Tips

1. **Start Small**: Implement one trigger at a time and test thoroughly
2. **Use Templates**: The service provides reusable templates - use them!
3. **Think User-First**: Every notification should answer "Why should I care?"
4. **Be Specific**: Include entity IDs so notifications link to relevant pages
5. **Don't Spam**: Only notify when action is truly needed

---

**Status**: Phase 2 Foundation Complete ✅  
**Next Action**: Implement remaining triggers (Sections 1-6 above)  
**Estimated Total Time**: 4-5 hours for complete Phase 2 implementation
