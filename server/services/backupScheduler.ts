import { BackupService } from './backupService';

export class BackupScheduler {
  private backupService: BackupService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(backupService: BackupService) {
    this.backupService = backupService;
  }

  /**
   * Start the backup scheduler
   * Checks for due jobs every minute
   */
  start() {
    if (this.isRunning) {
      console.log('Backup scheduler is already running');
      return;
    }

    console.log('Starting backup scheduler...');
    this.isRunning = true;

    // Check for due jobs every minute
    this.intervalId = setInterval(async () => {
      await this.checkAndExecuteDueJobs();
    }, 60 * 1000); // 60 seconds

    console.log('Backup scheduler started');
  }

  /**
   * Stop the backup scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('Backup scheduler is not running');
      return;
    }

    console.log('Stopping backup scheduler...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('Backup scheduler stopped');
  }

  /**
   * Check for due backup jobs and execute them
   */
  private async checkAndExecuteDueJobs() {
    try {
      const dueJobs = await this.backupService.getDueJobs();
      
      if (dueJobs.length > 0) {
        console.log(`Found ${dueJobs.length} due backup job(s)`);
        
        for (const job of dueJobs) {
          console.log(`Executing scheduled backup job: ${job.name} (${job.schedule})`);
          
          const result = await this.backupService.executeScheduledJob(job.id);
          
          if (result.success) {
            console.log(`Successfully executed backup job: ${job.name}, Backup ID: ${result.backupId}`);
          } else {
            console.error(`Failed to execute backup job: ${job.name}, Error: ${result.error}`);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for due backup jobs:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextCheck: this.isRunning ? new Date(Date.now() + 60000) : null
    };
  }

  /**
   * Manually trigger a check for due jobs (for testing)
   */
  async triggerCheck() {
    console.log('Manually triggering backup job check...');
    await this.checkAndExecuteDueJobs();
  }
}