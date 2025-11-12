import { Router, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { BackupService } from "../services/backupService";

// Authenticated user type
interface AuthUser {
  id: number;
  username: string;
  role: string;
  employeeId?: number;
}

const router = Router();
const backupService = new BackupService();

// Backup file upload configuration (saves to disk)
const backupUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      // Create uploads directory if it doesn't exist
      fs.mkdir(uploadsDir, { recursive: true }).then(() => {
        cb(null, uploadsDir);
      }).catch(cb);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const originalName = file.originalname;
      const extension = path.extname(originalName);
      const baseName = path.basename(originalName, extension);
      cb(null, `${baseName}_${timestamp}${extension}`);
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for backup files
  fileFilter: (req, file, cb) => {
    // Accept only .sql files for backups
    if (file.mimetype === 'application/sql' || file.originalname.endsWith('.sql')) {
      cb(null, true);
    } else {
      cb(new Error('Only .sql backup files are allowed'));
    }
  }
});

/**
 * GET /api/admin/backups - Get list of backups
 * Admin only
 */
router.get('/backups', async (req: Request, res: Response) => {
  try {
    const backups = await backupService.getBackupList();
    res.json(backups);
  } catch (error) {
    console.error('Failed to get backup list:', error);
    res.status(500).json({ error: 'Failed to get backup list' });
  }
});

/**
 * POST /api/admin/backups - Create manual backup
 * Admin only
 */
router.post('/backups', async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    const userId = (req.user as AuthUser)?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await backupService.createManualBackup(userId, description);
    
    if (result.success) {
      res.json({ message: 'Backup created successfully', backupId: result.backupId });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Failed to create backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

/**
 * POST /api/admin/backups/restore/:backupId - Restore from backup
 * Admin only (note: actual route is /restore/:backupId due to legacy naming)
 */
router.post('/restore/:backupId', async (req: Request, res: Response) => {
  try {
    const backupId = parseInt(req.params.backupId);
    const userId = (req.user as AuthUser)?.id; 
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(backupId)) {
      return res.status(400).json({ error: 'Invalid backup ID' });
    }

    const result = await backupService.restoreFromBackup(backupId, userId);
    
    if (result.success) {
      res.json({ 
        message: 'Database restored successfully', 
        recordsRestored: result.recordsRestored 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Failed to restore backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

/**
 * DELETE /api/admin/backups/:id - Delete backup
 * Admin only
 */
router.delete('/backups/:id', async (req: Request, res: Response) => {
  try {
    const backupId = parseInt(req.params.id);
    
    if (isNaN(backupId)) {
      return res.status(400).json({ error: 'Invalid backup ID' });
    }

    const result = await backupService.deleteBackup(backupId);
    
    if (result.success) {
      res.json({ message: 'Backup deleted successfully' });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Failed to delete backup:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

/**
 * POST /api/admin/backups/restore-from-file - Restore from uploaded backup file
 * Admin only
 */
router.post('/backups/restore-from-file', backupUpload.single('backup'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No backup file uploaded' });
    }

    const user = req.user as AuthUser;
    const uploadedFilePath = req.file.path;

    console.log(`Restore from uploaded file requested by user ${user.id}: ${req.file.originalname}`);

    // Restore from the uploaded file
    const result = await backupService.restoreFromFile(uploadedFilePath, user.id);

    // Clean up uploaded file after processing
    try {
      await fs.unlink(uploadedFilePath);
    } catch (error) {
      console.warn('Could not delete uploaded file:', error);
    }

    if (result.success) {
      res.json({ 
        message: 'Database restored successfully from uploaded file',
        recordsRestored: result.recordsRestored || 0
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Failed to restore from uploaded file:', error);
    
    // Clean up uploaded file on error
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Could not delete uploaded file after error:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Failed to restore from uploaded file' });
  }
});

/**
 * GET /api/admin/backups/:id/download - Download backup file
 * Admin only
 */
router.get('/backups/:id/download', async (req: Request, res: Response) => {
  try {
    const backupId = parseInt(req.params.id);
    
    if (isNaN(backupId)) {
      return res.status(400).json({ error: 'Invalid backup ID' });
    }

    const result = await backupService.downloadBackup(backupId);
    
    if (result.success && result.filepath && result.filename) {
      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Type', 'application/sql');
      
      // Send file
      res.download(result.filepath, result.filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download backup file' });
          }
        }
      });
    } else {
      res.status(404).json({ error: result.error || 'Backup file not found' });
    }
  } catch (error) {
    console.error('Failed to download backup:', error);
    res.status(500).json({ error: 'Failed to download backup' });
  }
});

/**
 * GET /api/admin/restore-history - Get restore history
 * Admin only
 */
router.get('/restore-history', async (req: Request, res: Response) => {
  try {
    const history = await backupService.getRestoreHistory();
    res.json(history);
  } catch (error) {
    console.error('Failed to get restore history:', error);
    res.status(500).json({ error: 'Failed to get restore history' });
  }
});

/**
 * GET /api/admin/backup-jobs - Get all backup jobs
 * Admin only
 */
router.get('/backup-jobs', async (req: Request, res: Response) => {
  try {
    const jobs = await backupService.getBackupJobs();
    res.json(jobs);
  } catch (error) {
    console.error('Failed to get backup jobs:', error);
    res.status(500).json({ error: 'Failed to get backup jobs' });
  }
});

/**
 * POST /api/admin/backup-jobs - Create new backup job
 * Admin only
 */
router.post('/backup-jobs', async (req: Request, res: Response) => {
  try {
    const { name, description, schedule_type, schedule_value, is_enabled } = req.body;

    if (!name || !schedule_type) {
      return res.status(400).json({ error: 'Name and schedule_type are required' });
    }

    if (!['hourly', 'daily', 'weekly', 'monthly'].includes(schedule_type)) {
      return res.status(400).json({ error: 'Schedule type must be hourly, daily, weekly, or monthly' });
    }

    const result = await backupService.createBackupJob({
      name,
      description,
      schedule_type,
      schedule_value: schedule_value || 1,
      is_enabled: is_enabled !== false, // Default to true
    });

    if (result.success) {
      res.json({ message: 'Backup job created successfully', jobId: result.jobId });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Failed to create backup job:', error);
    res.status(500).json({ error: 'Failed to create backup job' });
  }
});

/**
 * PUT /api/admin/backup-jobs/:id - Update backup job
 * Admin only
 */
router.put('/backup-jobs/:id', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id);
    const { name, description, schedule_type, schedule_value, is_enabled } = req.body;

    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    if (schedule_type && !['hourly', 'daily', 'weekly', 'monthly'].includes(schedule_type)) {
      return res.status(400).json({ error: 'Schedule type must be hourly, daily, weekly, or monthly' });
    }

    const result = await backupService.updateBackupJob(jobId, {
      name,
      description,
      schedule_type,
      schedule_value,
      is_enabled
    });

    if (result.success) {
      res.json({ message: 'Backup job updated successfully' });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Failed to update backup job:', error);
    res.status(500).json({ error: 'Failed to update backup job' });
  }
});

/**
 * DELETE /api/admin/backup-jobs/:id - Delete backup job
 * Admin only
 */
router.delete('/backup-jobs/:id', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id);

    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const result = await backupService.deleteBackupJob(jobId);

    if (result.success) {
      res.json({ message: 'Backup job deleted successfully' });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Failed to delete backup job:', error);
    res.status(500).json({ error: 'Failed to delete backup job' });
  }
});

/**
 * POST /api/admin/backup-jobs/:id/run - Manually execute a backup job
 * Admin only
 */
router.post('/backup-jobs/:id/run', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id);

    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const result = await backupService.executeScheduledJob(jobId);

    if (result.success) {
      res.json({ 
        message: 'Backup job executed successfully', 
        backupId: result.backupId 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Failed to execute backup job:', error);
    res.status(500).json({ error: 'Failed to execute backup job' });
  }
});

/**
 * POST /api/admin/backup-jobs/:id/cleanup - Manually clean up old backups
 * Admin only
 */
router.post('/backup-jobs/:id/cleanup', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id);

    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const result = await backupService.cleanupOldBackups(jobId);

    if (result.success) {
      res.json({ 
        message: `Cleanup completed. Deleted ${result.deletedCount} old backup(s)`, 
        deletedCount: result.deletedCount 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Failed to cleanup backups:', error);
    res.status(500).json({ error: 'Failed to cleanup backups' });
  }
});

export default router;
