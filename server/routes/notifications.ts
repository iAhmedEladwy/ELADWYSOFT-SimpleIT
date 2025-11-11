import { Router } from 'express';
import { db } from '../db';
import * as schema from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { requireRole, ROLES } from '../rbac';
import * as notificationService from '../services/notificationService';

const router = Router();

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
 */
router.get('/', async (req, res) => {
  try {
    const user = req.user as AuthUser;
    
    // Parse pagination params
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    
    const userNotifications = await db.select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, user.id))
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

    // Update notifications to mark as read
    await db.update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.userId, user.id));

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
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
      .where(eq(schema.notifications.id, notificationId));

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
}) {
  try {
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
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
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
