/**
 * Notification Cleanup Scheduler
 * Automatically removes old read notifications based on retention policy
 */

import cron from 'node-cron';
import { db } from '../db';
import { notifications } from '@shared/schema';
import { and, eq, sql, lt } from 'drizzle-orm';
import { logger } from './logger';
import { autoBatchNotifications } from './notificationBatchingService';

/**
 * Configuration for notification cleanup
 */
const CLEANUP_CONFIG = {
  // How many days to retain read notifications (default: 30)
  retentionDays: parseInt(process.env.NOTIFICATION_RETENTION_DAYS || '30'),
  
  // Cron schedule: Run daily at 2:00 AM
  // Format: second minute hour day month weekday
  schedule: '0 2 * * *',
  
  // Whether cleanup is enabled (can be disabled via env var)
  enabled: process.env.NOTIFICATION_CLEANUP_ENABLED !== 'false',
};

/**
 * Clean up old read notifications
 * Deletes notifications that are:
 * - Marked as read
 * - Older than retention period
 */
export async function cleanupOldNotifications() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.retentionDays);

    logger.info('notifications', `Starting notification cleanup (retention: ${CLEANUP_CONFIG.retentionDays} days)`, {
      userId: 0, // System operation
      metadata: { cutoffDate: cutoffDate.toISOString() }
    });

    // Delete old read notifications
    const result = await db.delete(notifications)
      .where(
        and(
          eq(notifications.isRead, true),
          lt(notifications.createdAt, cutoffDate)
        )
      );

    const deletedCount = result.rowCount || 0;

    logger.info('notifications', `Notification cleanup completed: ${deletedCount} notifications removed`, {
      userId: 0,
      metadata: { 
        deletedCount,
        retentionDays: CLEANUP_CONFIG.retentionDays,
        cutoffDate: cutoffDate.toISOString()
      }
    });

    return { success: true, deletedCount };
  } catch (error) {
    logger.error('notifications', 'Notification cleanup failed', {
      userId: 0,
      metadata: {},
      error: error instanceof Error ? error : new Error(String(error))
    });
    
    throw error;
  }
}

/**
 * Clean up snoozed notifications that have passed their snooze time
 */
export async function processSnoozedNotifications() {
  try {
    const now = new Date();

    logger.debug('notifications', 'Processing snoozed notifications', {
      userId: 0,
      metadata: { currentTime: now.toISOString() }
    });

    // Find snoozed notifications that should now be active
    const snoozedNotifs = await db.select()
      .from(notifications)
      .where(
        and(
          sql`${notifications.snoozedUntil} IS NOT NULL`,
          lt(notifications.snoozedUntil, now)
        )
      );

    if (snoozedNotifs.length === 0) {
      logger.debug('notifications', 'No snoozed notifications to process', {
        userId: 0,
        metadata: {}
      });
      return { success: true, processedCount: 0 };
    }

    // Clear snoozedUntil and mark as unread for notifications that should be active
    for (const notif of snoozedNotifs) {
      await db.update(notifications)
        .set({ 
          snoozedUntil: null,
          isRead: false // Mark as unread so user sees it again
        })
        .where(eq(notifications.id, notif.id));
    }

    logger.info('notifications', `Processed ${snoozedNotifs.length} snoozed notifications`, {
      userId: 0,
      metadata: { processedCount: snoozedNotifs.length }
    });

    return { success: true, processedCount: snoozedNotifs.length };
  } catch (error) {
    logger.error('notifications', 'Failed to process snoozed notifications', {
      userId: 0,
      metadata: {},
      error: error instanceof Error ? error : new Error(String(error))
    });
    
    return { success: false, processedCount: 0 };
  }
}

/**
 * Start the notification cleanup scheduler
 */
export function startNotificationCleanupScheduler() {
  if (!CLEANUP_CONFIG.enabled) {
    logger.info('notifications', 'Notification cleanup scheduler disabled', {
      userId: 0,
      metadata: { reason: 'NOTIFICATION_CLEANUP_ENABLED=false' }
    });
    return null;
  }

  logger.info('notifications', 'Starting notification cleanup scheduler', {
    userId: 0,
    metadata: {
      schedule: CLEANUP_CONFIG.schedule,
      retentionDays: CLEANUP_CONFIG.retentionDays,
    }
  });

  // Schedule daily cleanup at 2:00 AM
  const cleanupTask = cron.schedule(CLEANUP_CONFIG.schedule, async () => {
    try {
      await cleanupOldNotifications();
    } catch (error) {
      console.error('Scheduled notification cleanup failed:', error);
    }
  });

  // Schedule snooze processing and batching every 5 minutes
  const snoozeTask = cron.schedule('*/5 * * * *', async () => {
    logger.debug('notifications', 'Running snoozed notifications processing and batching', {
      userId: 0,
      metadata: { time: new Date().toISOString() }
    });
    
    try {
      await processSnoozedNotifications();
    } catch (error) {
      console.error('Snoozed notification processing failed:', error);
    }
    
    // Auto-batch notifications for all users
    try {
      await autoBatchNotifications();
      logger.debug('notifications', 'Auto-batching completed', {
        userId: 0,
        metadata: { time: new Date().toISOString() }
      });
    } catch (error) {
      logger.error('notifications', 'Auto-batching failed', {
        userId: 0,
        metadata: {},
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  });

  logger.info('notifications', 'Notification cleanup scheduler started successfully', {
    userId: 0,
    metadata: {
      dailyCleanup: CLEANUP_CONFIG.schedule,
      snoozeProcessing: '*/5 * * * *'
    }
  });

  return { cleanupTask, snoozeTask };
}

/**
 * Get cleanup statistics
 */
export async function getCleanupStats() {
  try {
    const totalNotifications = await db.select({ count: sql<number>`count(*)` })
      .from(notifications);

    const readNotifications = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.isRead, true));

    const snoozedNotifications = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(sql`${notifications.snoozedUntil} IS NOT NULL`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.retentionDays);

    const eligibleForCleanup = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.isRead, true),
          lt(notifications.createdAt, cutoffDate)
        )
      );

    return {
      total: totalNotifications[0].count,
      read: readNotifications[0].count,
      snoozed: snoozedNotifications[0].count,
      eligibleForCleanup: eligibleForCleanup[0].count,
      retentionDays: CLEANUP_CONFIG.retentionDays,
      cutoffDate,
    };
  } catch (error) {
    logger.error('notifications', 'Failed to get cleanup stats', {
      userId: 0,
      metadata: {},
      error: error instanceof Error ? error : new Error(String(error))
    });
    throw error;
  }
}
