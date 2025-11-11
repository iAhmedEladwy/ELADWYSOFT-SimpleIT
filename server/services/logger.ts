/**
 * System Logger Service
 * Hybrid logging: DB (ERROR/CRITICAL) + File (all levels) + Console (development)
 * For debugging, monitoring, and system enhancement
 */

import { db } from '../db';
import { systemLogs } from '@shared/schema';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

interface LogContext {
  userId?: number;
  requestId?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

class SystemLogger {
  private logsDir = join(process.cwd(), 'logs');
  private isDevelopment = process.env.NODE_ENV !== 'production';

  constructor() {
    // Ensure logs directory exists
    if (!existsSync(this.logsDir)) {
      mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * DEBUG - Detailed information for diagnosing problems
   * File only, not in DB
   */
  debug(module: string, message: string, context?: LogContext) {
    this.log('DEBUG', module, message, context, false);
  }

  /**
   * INFO - General informational messages
   * File only, not in DB
   */
  info(module: string, message: string, context?: LogContext) {
    this.log('INFO', module, message, context, false);
  }

  /**
   * WARN - Warning messages for potentially harmful situations
   * File only, not in DB
   */
  warn(module: string, message: string, context?: LogContext) {
    this.log('WARN', module, message, context, false);
  }

  /**
   * ERROR - Error events that might still allow the application to continue
   * Both DB and file
   */
  error(module: string, message: string, context?: LogContext) {
    this.log('ERROR', module, message, context, true);
  }

  /**
   * CRITICAL - Severe errors causing system instability
   * Both DB and file
   */
  critical(module: string, message: string, context?: LogContext) {
    this.log('CRITICAL', module, message, context, true);
  }

  /**
   * Internal logging method
   */
  private async log(
    level: LogLevel,
    module: string,
    message: string,
    context: LogContext = {},
    saveToDb: boolean
  ) {
    const timestamp = new Date();
    const { userId, requestId, metadata, error } = context;

    // Format log entry
    const logEntry = {
      timestamp,
      level,
      module,
      message,
      userId,
      requestId,
      metadata,
      stackTrace: error?.stack,
    };

    // 1. Console (development only)
    if (this.isDevelopment) {
      this.logToConsole(logEntry);
    }

    // 2. File (always)
    this.logToFile(logEntry);

    // 3. Database (ERROR and CRITICAL only)
    if (saveToDb) {
      await this.logToDatabase(logEntry);
    }
  }

  /**
   * Console logging with colors
   */
  private logToConsole(entry: any) {
    const colors: Record<LogLevel, string> = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      CRITICAL: '\x1b[35m', // Magenta
    };
    const reset = '\x1b[0m';
    const color = colors[entry.level as LogLevel] || reset;

    console.log(
      `${color}[${entry.timestamp.toISOString()}] [${entry.level}] [${entry.module}]${reset} ${entry.message}`,
      entry.metadata ? `\nMetadata: ${JSON.stringify(entry.metadata, null, 2)}` : '',
      entry.stackTrace ? `\nStack: ${entry.stackTrace}` : ''
    );
  }

  /**
   * File logging (rotating daily)
   */
  private logToFile(entry: any) {
    try {
      const date = entry.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = join(this.logsDir, `${date}.log`);

      const logLine = JSON.stringify({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      }) + '\n';

      appendFileSync(filename, logLine, 'utf8');
    } catch (error) {
      // Fallback if file logging fails
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Database logging for errors
   */
  private async logToDatabase(entry: any) {
    try {
      await db.insert(systemLogs).values({
        timestamp: entry.timestamp,
        level: entry.level,
        module: entry.module,
        message: entry.message,
        userId: entry.userId,
        requestId: entry.requestId,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        stackTrace: entry.stackTrace,
        resolved: false,
      });
    } catch (error) {
      // Don't throw - logging should never crash the app
      console.error('Failed to write to database log:', error);
    }
  }

  /**
   * Helper: Generate unique request ID
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper: Log HTTP request
   */
  logRequest(method: string, path: string, userId?: number, requestId?: string) {
    this.info('http', `${method} ${path}`, {
      userId,
      requestId,
      metadata: { method, path },
    });
  }

  /**
   * Helper: Log HTTP error
   */
  logHttpError(
    method: string,
    path: string,
    statusCode: number,
    error: Error,
    userId?: number,
    requestId?: string
  ) {
    this.error('http', `${method} ${path} - ${statusCode} ${error.message}`, {
      userId,
      requestId,
      metadata: { method, path, statusCode },
      error,
    });
  }
}

// Export singleton instance
export const logger = new SystemLogger();
