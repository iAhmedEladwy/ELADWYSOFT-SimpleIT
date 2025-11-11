import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { BackupService } from "./services/backupService";
import { BackupScheduler } from "./services/backupScheduler";
import { logger } from "./services/logger";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging and monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Generate unique request ID for tracing
  const requestId = logger.generateRequestId();
  (req as any).requestId = requestId;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);

      // System logging for API requests
      const user = (req as any).user;
      const userId = user?.id;

      // Log all API requests with context
      if (res.statusCode >= 400) {
        // Log errors and warnings
        const level = res.statusCode >= 500 ? 'error' : 'warn';
        logger[level]('http', `${req.method} ${path} - ${res.statusCode}`, {
          userId,
          requestId,
          metadata: {
            method: req.method,
            path,
            statusCode: res.statusCode,
            duration,
            query: req.query,
            ip: req.ip,
          },
        });
      } else if (duration > 2000) {
        // Log slow requests (>2s)
        logger.warn('performance', `Slow request: ${req.method} ${path} took ${duration}ms`, {
          userId,
          requestId,
          metadata: { method: req.method, path, duration },
        });
      } else {
        // Log normal requests at debug level
        logger.debug('http', `${req.method} ${path} - ${res.statusCode}`, {
          userId,
          requestId,
          metadata: { method: req.method, path, statusCode: res.statusCode, duration },
        });
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Initialize backup scheduler
  const backupService = new BackupService();
  const backupScheduler = new BackupScheduler(backupService);
  
  // Start the backup scheduler
  backupScheduler.start();
  console.log('Backup scheduler started');

  // Global error handler with logging
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const requestId = (req as any).requestId;
    const user = (req as any).user;

    // Log all errors to system logs
    logger.error('app', `${req.method} ${req.path} - ${status}: ${message}`, {
      userId: user?.id,
      requestId,
      metadata: {
        method: req.method,
        path: req.path,
        statusCode: status,
        query: req.query,
        body: req.body,
        ip: req.ip,
      },
      error: err,
    });

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on the configured port (default 5000)
  // this serves both the API and the client.
  const port = parseInt(process.env.PORT || '5000');
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
