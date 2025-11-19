/**
 * Notification Cleanup Scheduler
 * Automatically removes old read notifications based on retention policy
 * Uses native Node.js setInterval instead of node-cron
 */

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
  
  // Run daily cleanup at 2:00 AM (check every hour)
  dailyCleanupInterval: 60 * 60 * 1000, // 1 hour in milliseconds
  
  // Run snooze processing every 5 minutes
  snoozeProcessingInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
  
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
      dailyCleanupInterval: `${CLEANUP_CONFIG.dailyCleanupInterval / 1000 / 60} minutes`,
      snoozeProcessingInterval: `${CLEANUP_CONFIG.snoozeProcessingInterval / 1000 / 60} minutes`,
      retentionDays: CLEANUP_CONFIG.retentionDays,
    }
  });

  // Helper to check if it's 2:00 AM (cleanup time)
  const isCleanupTime = () => {
    const now = new Date();
    return now.getHours() === 2 && now.getMinutes() < 60;
  };

  let lastCleanupDate: string | null = null;

  // Schedule daily cleanup check (runs every hour, executes at 2 AM)
  const cleanupTask = setInterval(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Only run at 2 AM and once per day
    if (isCleanupTime() && lastCleanupDate !== today) {
      try {
        await cleanupOldNotifications();
        lastCleanupDate = today;
      } catch (error) {
        console.error('Scheduled notification cleanup failed:', error);
      }
    }
  }, CLEANUP_CONFIG.dailyCleanupInterval);

  // Schedule snooze processing and batching every 5 minutes
  const snoozeTask = setInterval(async () => {
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
  }, CLEANUP_CONFIG.snoozeProcessingInterval);

  logger.info('notifications', 'Notification cleanup scheduler started successfully', {
    userId: 0,
    metadata: {
      dailyCleanupCheck: 'Every hour (executes at 2 AM)',
      snoozeProcessing: 'Every 5 minutes'
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
