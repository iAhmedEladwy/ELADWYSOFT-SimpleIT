import { Router } from 'express';
import { db } from '../db';
import { systemLogs } from '@shared/schema';
import { desc, and, eq, gte, lte, like, or, sql } from 'drizzle-orm';
import { requirePermission, PERMISSIONS } from '../rbac';

const router = Router();

interface AuthUser {
  id: number;
  username: string;
  role: string;
}

/**
 * GET /api/system-logs
 * Get system logs with filtering (Super Admin only)
 * Query params:
 *   - level: Filter by log level (DEBUG, INFO, WARN, ERROR, CRITICAL)
 *   - module: Filter by module name
 *   - search: Search in message
 *   - startDate: Filter logs after this date
 *   - endDate: Filter logs before this date
 *   - resolved: Filter by resolved status (true/false)
 *   - limit: Number of logs to return (default: 100, max: 1000)
 *   - offset: Number of logs to skip (default: 0)
 */
router.get('/', requirePermission(PERMISSIONS.SYSTEM_LOGS), async (req, res) => {
  try {
    const {
      level,
      module,
      search,
      startDate,
      endDate,
      resolved,
      limit = '100',
      offset = '0',
    } = req.query;

    // Build filter conditions
    const conditions = [];

    if (level) {
      conditions.push(eq(systemLogs.level, level as any));
    }

    if (module) {
      conditions.push(eq(systemLogs.module, module as string));
    }

    if (search) {
      conditions.push(like(systemLogs.message, `%${search}%`));
    }

    if (startDate) {
      conditions.push(gte(systemLogs.timestamp, new Date(startDate as string)));
    }

    if (endDate) {
      conditions.push(lte(systemLogs.timestamp, new Date(endDate as string)));
    }

    if (resolved !== undefined) {
      conditions.push(eq(systemLogs.resolved, resolved === 'true'));
    }

    // Parse pagination
    const limitNum = Math.min(parseInt(limit as string) || 100, 1000);
    const offsetNum = parseInt(offset as string) || 0;

    // Query logs
    const logs = await db.select()
      .from(systemLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(systemLogs.timestamp))
      .limit(limitNum)
      .offset(offsetNum);

    // Get total count for pagination
    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(systemLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({
      logs,
      total: Number(count),
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({ error: 'Failed to fetch system logs' });
  }
});

/**
 * GET /api/system-logs/stats
 * Get log statistics (Super Admin only)
 */
router.get('/stats', requirePermission(PERMISSIONS.SYSTEM_LOGS), async (req, res) => {
  try {
    // Count by level
    const levelStats = await db.select({
      level: systemLogs.level,
      count: sql<number>`count(*)`,
    })
      .from(systemLogs)
      .groupBy(systemLogs.level);

    // Count by module
    const moduleStats = await db.select({
      module: systemLogs.module,
      count: sql<number>`count(*)`,
    })
      .from(systemLogs)
      .groupBy(systemLogs.module)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Recent errors (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [{ recentErrors }] = await db.select({
      recentErrors: sql<number>`count(*)`,
    })
      .from(systemLogs)
      .where(and(
        gte(systemLogs.timestamp, oneDayAgo),
        or(
          eq(systemLogs.level, 'ERROR'),
          eq(systemLogs.level, 'CRITICAL')
        )
      ));

    // Unresolved errors
    const [{ unresolvedErrors }] = await db.select({
      unresolvedErrors: sql<number>`count(*)`,
    })
      .from(systemLogs)
      .where(and(
        eq(systemLogs.resolved, false),
        or(
          eq(systemLogs.level, 'ERROR'),
          eq(systemLogs.level, 'CRITICAL')
        )
      ));

    res.json({
      levelStats,
      moduleStats,
      recentErrors: Number(recentErrors),
      unresolvedErrors: Number(unresolvedErrors),
    });
  } catch (error) {
    console.error('Error fetching log statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * PUT /api/system-logs/:id/resolve
 * Mark a log as resolved (Super Admin only)
 */
router.put('/:id/resolve', requirePermission(PERMISSIONS.SYSTEM_LOGS), async (req, res) => {
  try {
    const logId = parseInt(req.params.id);

    const [updated] = await db.update(systemLogs)
      .set({ resolved: true })
      .where(eq(systemLogs.id, logId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error resolving log:', error);
    res.status(500).json({ error: 'Failed to resolve log' });
  }
});

/**
 * DELETE /api/system-logs/cleanup
 * Delete old logs (Super Admin only)
 * Body: { days: number } - Delete logs older than X days
 */
router.delete('/cleanup', requirePermission(PERMISSIONS.SYSTEM_LOGS), async (req, res) => {
  try {
    const { days = 90 } = req.body;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await db.delete(systemLogs)
      .where(lte(systemLogs.timestamp, cutoffDate))
      .returning();

    res.json({
      message: `Deleted ${result.length} logs older than ${days} days`,
      deleted: result.length,
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({ error: 'Failed to cleanup logs' });
  }
});

export default router;
