import { Router } from 'express';
import { db } from '../db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';
import { authenticateUser, requireRole } from '../rbac';

const router = Router();

// Define AuthUser type
interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  employeeId?: number;
}

// Role constants
const ROLES = {
  ADMIN: 4,
  MANAGER: 3,
  AGENT: 2,
  EMPLOYEE: 1
};

/**
 * GET /api/notifications
 * Get all notifications for the current user
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const user = req.user as AuthUser;
    
    const userNotifications = await db.select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, user.id))
      .orderBy(schema.notifications.createdAt);

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
router.post('/mark-read', authenticateUser, async (req, res) => {
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
router.delete('/:id', authenticateUser, async (req, res) => {
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
router.post('/', authenticateUser, requireRole(ROLES.ADMIN), async (req, res) => {
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

export default router;
