/**
 * Smart Notification Batching Service
 * Groups similar notifications to reduce noise and improve UX
 */

import { db } from '../db';
import { notifications } from '@shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export interface BatchCriteria {
  userId: number;
  type: 'Asset' | 'Ticket' | 'System' | 'Employee';
  category?: string;
  timeWindowMinutes?: number; // Default: 5 minutes
}

export interface BatchedNotification {
  batchId: string;
  count: number;
  type: string;
  category: string;
  title: string;
  message: string;
  latestTimestamp: Date;
  notificationIds: number[];
}

/**
 * Check if notifications should be batched together
 */
export function shouldBatch(notif1: any, notif2: any, timeWindowMinutes: number = 5): boolean {
  // Must be same user
  if (notif1.userId !== notif2.userId) return false;

  // Must be same type and category
  if (notif1.type !== notif2.type || notif1.category !== notif2.category) return false;

  // Must be within time window
  const time1 = new Date(notif1.createdAt).getTime();
  const time2 = new Date(notif2.createdAt).getTime();
  const diffMinutes = Math.abs(time1 - time2) / (1000 * 60);
  
  if (diffMinutes > timeWindowMinutes) return false;

  // Additional criteria based on type
  switch (notif1.type) {
    case 'Ticket':
      // Batch ticket assignments to same user
      return notif1.message.includes('assigned') && notif2.message.includes('assigned');
    
    case 'Asset':
      // Batch asset assignments or status changes
      return (
        (notif1.message.includes('assigned') && notif2.message.includes('assigned')) ||
        (notif1.message.includes('maintenance') && notif2.message.includes('maintenance'))
      );
    
    case 'System':
      // Batch system announcements
      return notif1.category === notif2.category;
    
    default:
      return false;
  }
}

/**
 * Generate batch title based on notification count and type
 */
export function generateBatchTitle(notifications: any[], language: 'English' | 'Arabic' = 'English'): string {
  const count = notifications.length;
  const type = notifications[0].type;
  const category = notifications[0].category;

  const templates = {
    English: {
      ticket_assignments: `${count} Tickets Assigned to You`,
      asset_assignments: `${count} Assets Assigned to You`,
      ticket_status: `${count} Ticket Status Updates`,
      maintenance: `${count} Maintenance Alerts`,
      system: `${count} System Announcements`,
      default: `${count} New Notifications`,
    },
    Arabic: {
      ticket_assignments: `تم تعيين ${count} تذاكر لك`,
      asset_assignments: `تم تعيين ${count} أصول لك`,
      ticket_status: `${count} تحديثات حالة التذكرة`,
      maintenance: `${count} تنبيهات صيانة`,
      system: `${count} إعلانات النظام`,
      default: `${count} إشعارات جديدة`,
    }
  };

  const langTemplates = templates[language];
  
  // Determine which template to use
  if (type === 'Ticket' && category === 'assignments') {
    return langTemplates.ticket_assignments;
  } else if (type === 'Asset' && category === 'assignments') {
    return langTemplates.asset_assignments;
  } else if (type === 'Ticket' && category === 'status_changes') {
    return langTemplates.ticket_status;
  } else if (category === 'maintenance') {
    return langTemplates.maintenance;
  } else if (type === 'System') {
    return langTemplates.system;
  } else {
    return langTemplates.default;
  }
}

/**
 * Generate batch message with summary
 */
export function generateBatchMessage(notifications: any[], language: 'English' | 'Arabic' = 'English'): string {
  const count = notifications.length;
  const type = notifications[0].type;

  // Extract key information from first few notifications
  const preview = notifications.slice(0, 3).map(n => {
    // Extract ticket IDs or asset names from messages
    const ticketMatch = n.message.match(/ticket\s+(\S+)/i);
    const assetMatch = n.message.match(/asset\s+"([^"]+)"/i);
    
    if (ticketMatch) return ticketMatch[1];
    if (assetMatch) return assetMatch[1];
    return n.title;
  });

  const remaining = count - preview.length;
  
  if (language === 'Arabic') {
    const items = preview.join('، ');
    const more = remaining > 0 ? ` و ${remaining} آخرين` : '';
    return `${items}${more}`;
  } else {
    const items = preview.join(', ');
    const more = remaining > 0 ? ` and ${remaining} more` : '';
    return `${items}${more}`;
  }
}

/**
 * Batch similar notifications for a user
 */
export async function batchNotificationsForUser(
  userId: number,
  timeWindowMinutes: number = 5
): Promise<BatchedNotification[]> {
  try {
    // Get recent unread notifications for user
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeWindowMinutes);

    const recentNotifications = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          gte(notifications.createdAt, cutoffTime),
          sql`${notifications.batchId} IS NULL` // Not already batched
        )
      )
      .orderBy(notifications.createdAt);

    if (recentNotifications.length < 2) {
      return []; // Not enough notifications to batch
    }

    // Group notifications into batches
    const batches: Map<string, any[]> = new Map();

    for (const notif of recentNotifications) {
      let batchKey: string | null = null;

      // Try to find existing batch this notification belongs to
      for (const [key, batch] of batches.entries()) {
        if (shouldBatch(notif, batch[0], timeWindowMinutes)) {
          batchKey = key;
          break;
        }
      }

      // Create new batch if no match found
      if (!batchKey) {
        batchKey = `${notif.type}_${notif.category}_${Date.now()}`;
      }

      // Add to batch
      if (!batches.has(batchKey)) {
        batches.set(batchKey, []);
      }
      batches.get(batchKey)!.push(notif);
    }

    // Generate batch summaries
    const batchedResults: BatchedNotification[] = [];

    for (const [key, notifGroup] of batches.entries()) {
      // Only batch if we have 2+ similar notifications
      if (notifGroup.length >= 2) {
        const batchId = randomUUID();
        
        // Update notifications with batch ID
        const notifIds = notifGroup.map(n => n.id);
        await db.update(notifications)
          .set({ batchId })
          .where(sql`${notifications.id} = ANY(${notifIds})`);

        batchedResults.push({
          batchId,
          count: notifGroup.length,
          type: notifGroup[0].type,
          category: notifGroup[0].category,
          title: generateBatchTitle(notifGroup),
          message: generateBatchMessage(notifGroup),
          latestTimestamp: new Date(Math.max(...notifGroup.map(n => new Date(n.createdAt).getTime()))),
          notificationIds: notifIds,
        });
      }
    }

    return batchedResults;
  } catch (error) {
    console.error('Error batching notifications:', error);
    return [];
  }
}

/**
 * Get batched notifications for display
 */
export async function getBatchedNotifications(userId: number): Promise<any[]> {
  try {
    // Get all notifications for user, grouped by batch
    const userNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);

    // Separate batched and individual notifications
    const batchedMap: Map<string, any[]> = new Map();
    const individual: any[] = [];

    for (const notif of userNotifications) {
      if (notif.batchId) {
        if (!batchedMap.has(notif.batchId)) {
          batchedMap.set(notif.batchId, []);
        }
        batchedMap.get(notif.batchId)!.push(notif);
      } else {
        individual.push(notif);
      }
    }

    // Convert batches to display format
    const batched = Array.from(batchedMap.values()).map(group => {
      const allRead = group.every(n => n.isRead);
      const latestTimestamp = new Date(Math.max(...group.map(n => new Date(n.createdAt).getTime())));

      return {
        id: `batch_${group[0].batchId}`,
        batchId: group[0].batchId,
        isBatch: true,
        count: group.length,
        userId: group[0].userId,
        type: group[0].type,
        category: group[0].category,
        priority: group[0].priority,
        title: generateBatchTitle(group),
        message: generateBatchMessage(group),
        isRead: allRead,
        createdAt: latestTimestamp,
        notifications: group, // Include individual notifications for expansion
      };
    });

    // Combine and sort by timestamp
    const combined = [...individual, ...batched].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return combined;
  } catch (error) {
    console.error('Error getting batched notifications:', error);
    throw error;
  }
}

/**
 * Auto-batch notifications on a schedule
 * Run this periodically (e.g., every 5 minutes)
 */
export async function autoBatchNotifications(): Promise<void> {
  try {
    // Get all users with unread notifications
    const usersWithNotifs = await db.select({
      userId: notifications.userId,
    })
      .from(notifications)
      .where(
        and(
          eq(notifications.isRead, false),
          sql`${notifications.batchId} IS NULL`
        )
      )
      .groupBy(notifications.userId);

    // Batch notifications for each user
    for (const { userId } of usersWithNotifs) {
      if (userId) {
        await batchNotificationsForUser(userId, 5);
      }
    }
  } catch (error) {
    console.error('Auto-batch failed:', error);
  }
}
