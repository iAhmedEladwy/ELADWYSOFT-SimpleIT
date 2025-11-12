import { Router, type Request, type Response } from "express";
import { BackupService } from "../services/backupService";

const router = Router();
const backupService = new BackupService();

/**
 * GET /api/admin/system-health - Get system health metrics
 * Admin only
 * Returns database size, backup count, last backup time, and other health metrics
 */
router.get('/system-health', async (req: Request, res: Response) => {
  try {
    const healthMetrics = await backupService.getSystemHealth();
    res.json(healthMetrics);
  } catch (error) {
    console.error('Failed to get system health:', error);
    res.status(500).json({ error: 'Failed to get system health' });
  }
});

/**
 * GET /api/admin/system-overview - Get system overview statistics
 * Admin only
 */
router.get('/system-overview', async (req: Request, res: Response) => {
  try {
    const systemOverview = await backupService.getSystemOverview();
    res.json(systemOverview);
  } catch (error) {
    console.error('Failed to get system overview:', error);
    res.status(500).json({ error: 'Failed to get system overview' });
  }
});

export default router;
