import express from 'express';
import { db } from '../db';
import { requireRole } from '../rbac';
import { ROLE_IDS } from '@shared/roles.config';
import { sql } from 'drizzle-orm';

const router = express.Router();

// Middleware to track API request performance
interface PerformanceEntry {
  endpoint: string;
  method: string;
  startTime: number;
  endTime?: number;
  responseTime?: number;
  statusCode?: number;
}

// In-memory performance tracking (last 1000 requests)
const performanceLog: PerformanceEntry[] = [];
const MAX_LOG_SIZE = 1000;

// Middleware to track request performance
export const performanceMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const entry: PerformanceEntry = {
    endpoint: req.path,
    method: req.method,
    startTime: Date.now()
  };

  const originalSend = res.send;
  res.send = function (data: any) {
    entry.endTime = Date.now();
    entry.responseTime = entry.endTime - entry.startTime;
    entry.statusCode = res.statusCode;

    // Add to log (circular buffer)
    if (performanceLog.length >= MAX_LOG_SIZE) {
      performanceLog.shift();
    }
    performanceLog.push(entry);

    return originalSend.call(this, data);
  };

  next();
};

// Helper function to calculate percentiles
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] || 0;
}

// Helper function to filter logs by time range
function filterByTimeRange(logs: PerformanceEntry[], range: string): PerformanceEntry[] {
  const now = Date.now();
  let cutoff = now;

  switch (range) {
    case '1h':
      cutoff = now - 60 * 60 * 1000;
      break;
    case '6h':
      cutoff = now - 6 * 60 * 60 * 1000;
      break;
    case '24h':
      cutoff = now - 24 * 60 * 60 * 1000;
      break;
    case '7d':
      cutoff = now - 7 * 24 * 60 * 60 * 1000;
      break;
    default:
      cutoff = now - 60 * 60 * 1000; // Default to 1 hour
  }

  return logs.filter(log => log.startTime >= cutoff);
}

// GET /api/developer-tools/performance - Get performance metrics
router.get('/performance', requireRole([ROLE_IDS.SUPER_ADMIN]), async (req, res) => {
  try {
    const range = (req.query.range as string) || '1h';
    const filteredLogs = filterByTimeRange(performanceLog, range);

    // Group by endpoint
    const endpointMap = new Map<string, PerformanceEntry[]>();
    filteredLogs.forEach(log => {
      const key = `${log.method} ${log.endpoint}`;
      if (!endpointMap.has(key)) {
        endpointMap.set(key, []);
      }
      endpointMap.get(key)!.push(log);
    });

    // Calculate endpoint metrics
    const endpoints = Array.from(endpointMap.entries()).map(([key, logs]) => {
      const responseTimes = logs.map(l => l.responseTime || 0);
      const errors = logs.filter(l => (l.statusCode || 0) >= 400).length;
      const [method, endpoint] = key.split(' ', 2);

      return {
        endpoint,
        method,
        avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
        totalRequests: logs.length,
        errorRate: (errors / logs.length) * 100,
        p50: calculatePercentile(responseTimes, 50),
        p95: calculatePercentile(responseTimes, 95),
        p99: calculatePercentile(responseTimes, 99)
      };
    }).sort((a, b) => b.avgResponseTime - a.avgResponseTime); // Sort by slowest first

    // Generate time-series data for trends
    const bucketSize = range === '1h' ? 5 * 60 * 1000 : 60 * 60 * 1000; // 5 min or 1 hour buckets
    const timeBuckets = new Map<number, PerformanceEntry[]>();
    
    filteredLogs.forEach(log => {
      const bucket = Math.floor(log.startTime / bucketSize) * bucketSize;
      if (!timeBuckets.has(bucket)) {
        timeBuckets.set(bucket, []);
      }
      timeBuckets.get(bucket)!.push(log);
    });

    const recentTrends = Array.from(timeBuckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, logs]) => {
        const responseTimes = logs.map(l => l.responseTime || 0);
        const errors = logs.filter(l => (l.statusCode || 0) >= 400).length;
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const requestsPerMinute = (logs.length / (bucketSize / 60000));

        return {
          timestamp: new Date(timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          avgResponseTime: Math.round(avgResponseTime),
          requestsPerMinute: Math.round(requestsPerMinute * 10) / 10, // One decimal place
          errorRate: (errors / logs.length) * 100
        };
      });

    // Simulate slow queries (in production, this would come from database query logs)
    // For now, we'll identify slow API endpoints as proxy for slow queries
    const slowQueries = endpoints
      .filter(e => e.avgResponseTime > 200 && e.endpoint.includes('/api/'))
      .slice(0, 5)
      .map(e => ({
        query: `API: ${e.method} ${e.endpoint}`,
        avgTime: e.avgResponseTime,
        executions: e.totalRequests
      }));

    // System metrics (simulated - in production, these would come from actual monitoring)
    const systemMetrics = {
      cpuUsage: Math.round(Math.random() * 30 + 20), // Simulated 20-50%
      memoryUsage: Math.round(Math.random() * 20 + 40), // Simulated 40-60%
      activeConnections: filteredLogs.filter(l => Date.now() - l.startTime < 60000).length,
      cacheHitRatio: Math.round(Math.random() * 10 + 85) // Simulated 85-95%
    };

    res.json({
      endpoints: endpoints.slice(0, 20), // Top 20 endpoints
      slowQueries,
      recentTrends,
      systemMetrics
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch performance metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/developer-tools/performance/endpoints - Get detailed endpoint metrics
router.get('/performance/endpoints', requireRole([ROLE_IDS.SUPER_ADMIN]), async (req, res) => {
  try {
    const range = (req.query.range as string) || '1h';
    const filteredLogs = filterByTimeRange(performanceLog, range);

    // Group by endpoint
    const endpointMap = new Map<string, PerformanceEntry[]>();
    filteredLogs.forEach(log => {
      const key = `${log.method} ${log.endpoint}`;
      if (!endpointMap.has(key)) {
        endpointMap.set(key, []);
      }
      endpointMap.get(key)!.push(log);
    });

    const endpointDetails = Array.from(endpointMap.entries()).map(([key, logs]) => {
      const responseTimes = logs.map(l => l.responseTime || 0);
      const errors = logs.filter(l => (l.statusCode || 0) >= 400);
      const [method, endpoint] = key.split(' ', 2);

      return {
        endpoint,
        method,
        totalRequests: logs.length,
        successfulRequests: logs.length - errors.length,
        failedRequests: errors.length,
        avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
        minResponseTime: Math.min(...responseTimes),
        maxResponseTime: Math.max(...responseTimes),
        p50: calculatePercentile(responseTimes, 50),
        p75: calculatePercentile(responseTimes, 75),
        p90: calculatePercentile(responseTimes, 90),
        p95: calculatePercentile(responseTimes, 95),
        p99: calculatePercentile(responseTimes, 99),
        errorRate: (errors.length / logs.length) * 100,
        statusCodes: logs.reduce((acc, log) => {
          const code = log.statusCode?.toString() || 'unknown';
          acc[code] = (acc[code] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    });

    res.json({ endpoints: endpointDetails });
  } catch (error) {
    console.error('Error fetching endpoint details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch endpoint details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/developer-tools/performance/reset - Reset performance logs (for testing)
router.post('/performance/reset', requireRole([ROLE_IDS.SUPER_ADMIN]), async (req, res) => {
  try {
    performanceLog.length = 0; // Clear the array
    res.json({ 
      success: true, 
      message: 'Performance logs cleared successfully' 
    });
  } catch (error) {
    console.error('Error resetting performance logs:', error);
    res.status(500).json({ 
      error: 'Failed to reset performance logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
