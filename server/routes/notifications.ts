import { Router } from 'express';
import { db } from '../db';
import * as schema from '@shared/schema';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { requireRole, ROLES } from '../rbac';
import * as notificationService from '../services/notificationService';
import notificationPreferencesRouter from './notificationPreferences';
import { logger } from '../services/logger';

const router = Router();

// Mount preferences subrouter
router.use('/', notificationPreferencesRouter);

// Define AuthUser type
interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  employeeId?: number;
}


/**
 * GET /api/notifications
 * Get all notifications for the current user
 * Query params:
 *   - limit: number of notifications to return (default: 50, max: 100)
 *   - offset: number of notifications to skip (default: 0)
 *   - since: timestamp to get notifications created after (ISO string)
 *   - unreadOnly: return only unread notifications (boolean)
 */
router.get('/', async (req, res) => {
  try {
    const user = req.user as AuthUser;
    
    // Parse pagination params
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const since = req.query.since as string;
    const unreadOnly = req.query.unreadOnly === 'true';
    
    // Build where conditions
    let whereConditions: any[] = [eq(schema.notifications.userId, user.id)];
    
    // Add timestamp filter if provided
    if (since) {
      whereConditions.push(
        sql`${schema.notifications.createdAt} > ${since}`
      );
    }
    
    // Add unread filter if requested
    if (unreadOnly) {
      whereConditions.push(eq(schema.notifications.isRead, false));
    }
    
    const userNotifications = await db.select()
      .from(schema.notifications)
      .where(and(...whereConditions))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(userNotifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * POST /api/notifications/mark-read
 * Mark notification(s) as read
 */
router.post('/mark-read', async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ error: 'notificationIds array is required' });
    }

    // Update only the specified notifications
    await db.update(schema.notifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(
        and(
          eq(schema.notifications.userId, user.id),
          inArray(schema.notifications.id, notificationIds)
        )
      );

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

/**
 * DELETE /api/notifications/clear-all
 * Clear (delete) all notifications for the current user
 */
router.delete('/clear-all', async (req, res) => {
  try {
    const user = req.user as AuthUser;

    // Delete all notifications for the current user
    const result = await db.delete(schema.notifications)
      .where(eq(schema.notifications.userId, user.id));

    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Failed to clear all notifications:', error);
    res.status(500).json({ error: 'Failed to clear all notifications' });
  }
});

/**
 * POST /api/notifications/:id/snooze
 * Snooze a notification until a specific time
 */
router.post('/:id/snooze', async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const notificationId = parseInt(req.params.id);
    const { snoozeUntil, minutes } = req.body;

    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    let snoozedUntil: Date;

    if (snoozeUntil) {
      // Use provided timestamp
      snoozedUntil = new Date(snoozeUntil);
    } else if (minutes) {
      // Calculate based on minutes from now
      snoozedUntil = new Date();
      snoozedUntil.setMinutes(snoozedUntil.getMinutes() + minutes);
    } else {
      return res.status(400).json({ error: 'snoozeUntil or minutes is required' });
    }

    // Update notification with snooze time
    await db.update(schema.notifications)
      .set({ snoozedUntil })
      .where(
        and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.userId, user.id)
        )
      );

    res.json({ 
      message: 'Notification snoozed',
      snoozedUntil 
    });
  } catch (error) {
    console.error('Failed to snooze notification:', error);
    res.status(500).json({ error: 'Failed to snooze notification' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete (dismiss) a notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    // Delete notification (only if it belongs to the user)
    await db.delete(schema.notifications)
      .where(
        and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.userId, user.id)
        )
      );

    res.json({ message: 'Notification dismissed' });
  } catch (error) {
    console.error('Failed to dismiss notification:', error);
    res.status(500).json({ error: 'Failed to dismiss notification' });
  }
});

/**
 * POST /api/notifications
 * Create a new notification (Admin only)
 */
router.post('/', requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const { userId, title, message, type, entityId } = req.body;

    if (!userId || !title || !message || !type) {
      return res.status(400).json({ error: 'userId, title, message, and type are required' });
    }

    const [notification] = await db.insert(schema.notifications)
      .values({
        userId,
        title,
        message,
        type,
        entityId,
        isRead: false
      })
      .returning();

    res.json(notification);
  } catch (error) {
    console.error('Failed to create notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

/**
 * Helper function to create a notification
 * Can be used by other route modules
 */
export async function createNotification(params: {
  userId: number;
  title: string;
  message: string;
  type: 'Asset' | 'Ticket' | 'System' | 'Employee';
  entityId?: number;
  priority?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category?: 'assignments' | 'status_changes' | 'maintenance' | 'approvals' | 'announcements' | 'reminders' | 'alerts';
}) {
  try {
    // Check user's notification preferences
    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(schema.notificationPreferences.userId, params.userId)
    });

    // Check Do Not Disturb mode
    if (prefs && prefs.dndEnabled && prefs.dndStartTime && prefs.dndEndTime) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

      // Check if current day is in DND days (if specified)
      const dndDays = (prefs.dndDays as number[]) || [];
      const isDndDay = dndDays.length === 0 || dndDays.includes(currentDay);

      if (isDndDay) {
        const start = prefs.dndStartTime;
        const end = prefs.dndEndTime;

        // Handle DND time range (supports overnight ranges like 22:00-08:00)
        let isInDndPeriod = false;
        if (start <= end) {
          // Same day range (e.g., 09:00-17:00)
          isInDndPeriod = currentTime >= start && currentTime <= end;
        } else {
          // Overnight range (e.g., 22:00-08:00)
          isInDndPeriod = currentTime >= start || currentTime <= end;
        }

        if (isInDndPeriod && params.priority !== 'critical') {
          logger.debug('notifications', `Notification blocked by DND: User ${params.userId}`, {
            userId: params.userId,
            metadata: { 
              type: params.type,
              title: params.title,
              currentTime,
              dndStart: start,
              dndEnd: end,
              reason: 'Do Not Disturb active'
            }
          });
          return null; // Block notification during DND (except critical)
        }
      }
    }

    // Determine if this notification type is enabled
    let isEnabled = true; // Default to enabled if no preferences set
    
    if (prefs) {
      // Map notification type to preference field
      const message = params.message.toLowerCase();
      const title = params.title.toLowerCase();
      
      if (params.type === 'Ticket' && (message.includes('assigned') || title.includes('assigned'))) {
        isEnabled = prefs.ticketAssignments;
      } else if (params.type === 'Ticket' && (message.includes('status') || title.includes('status'))) {
        isEnabled = prefs.ticketStatusChanges;
      } else if (params.type === 'Asset' && (message.includes('assigned') || message.includes('checked') || title.includes('assigned'))) {
        isEnabled = prefs.assetAssignments;
      } else if (params.type === 'Asset' && (message.includes('maintenance') || title.includes('maintenance'))) {
        isEnabled = prefs.maintenanceAlerts;
      } else if (message.includes('upgrade') || title.includes('upgrade')) {
        isEnabled = prefs.upgradeRequests;
      } else if (params.type === 'System') {
        isEnabled = prefs.systemAnnouncements;
      } else if (params.type === 'Employee') {
        isEnabled = prefs.employeeChanges;
      }
    }

    // Only create notification if user has it enabled
    if (!isEnabled) {
      // Log skipped notification for debugging
      logger.debug('notifications', `Notification skipped: User ${params.userId} disabled ${params.type}`, {
        userId: params.userId,
        metadata: { 
          type: params.type, 
          title: params.title,
          message: params.message,
          reason: 'User preference disabled'
        }
      });
      return null; // User has disabled this notification type
    }

    const [notification] = await db.insert(schema.notifications)
      .values({
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        entityId: params.entityId,
        priority: params.priority || 'medium',
        category: params.category || 'alerts',
        isRead: false,
      })
      .returning();
    
    // Log successful notification creation
    logger.info('notifications', `Notification created: ${params.title}`, {
      userId: params.userId,
      metadata: { 
        notificationId: notification.id,
        type: params.type,
        entityId: params.entityId,
        title: params.title
      }
    });
    
    return notification;
  } catch (error) {
    // Log error to system logs (not just console)
    logger.error('notifications', `Failed to create notification: ${params.title}`, {
      userId: params.userId,
      metadata: { 
        type: params.type, 
        title: params.title,
        message: params.message 
      },
      error: error instanceof Error ? error : new Error(String(error))
    });
    throw error;
  }
}

/**
 * POST /api/notifications/broadcast
 * System broadcast notification endpoint (Admin only)
 * Send notifications to all users or specific role
 */
router.post('/broadcast', requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const { title, message, targetRole, notificationType } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    
    const type = (notificationType || 'System') as 'Asset' | 'Ticket' | 'System' | 'Employee';
    
    if (targetRole && targetRole !== 'all') {
      // Notify specific role
      await notificationService.notifyByRole({
        role: targetRole,
        title,
        message,
        type,
      });
      
      res.json({ 
        message: `Notification sent to all users with role: ${targetRole}`,
        targetRole,
        title
      });
    } else {
      // Notify all users
      const allUsers = await db.select().from(schema.users);
      const userIds = allUsers.map((u: any) => u.id);
      
      await notificationService.notifySystem({
        userIds,
        title,
        message,
      });
      
      res.json({ 
        message: `Notification sent to all ${userIds.length} users`,
        userCount: userIds.length,
        title
      });
    }
  } catch (error) {
    console.error('Failed to broadcast notification:', error);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
});

export default router;
