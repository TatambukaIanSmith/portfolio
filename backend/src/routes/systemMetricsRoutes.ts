import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

/**
 * GET /api/v1/metrics/current
 * Returns current system metrics (mock data)
 */
router.get('/current', (req: Request, res: Response) => {
  try {
    const mockMetrics = {
      success: true,
      data: {
        metrics: {
          cpu: {
            usage_percent: Math.random() * 30 + 20, // 20-50%
            load_average: [
              Math.random() * 2 + 0.5,
              Math.random() * 2 + 0.5,
              Math.random() * 2 + 0.5
            ]
          },
          memory: {
            total_mb: 8192,
            used_mb: Math.random() * 3000 + 2000, // 2-5GB used
            free_mb: 0, // Will be calculated
            usage_percent: 0 // Will be calculated
          },
          disk: {
            total_gb: 500,
            used_gb: Math.random() * 200 + 100, // 100-300GB used
            free_gb: 0, // Will be calculated
            usage_percent: 0 // Will be calculated
          },
          network: {
            connections_active: Math.floor(Math.random() * 50 + 10), // 10-60 connections
            requests_per_minute: Math.floor(Math.random() * 200 + 50) // 50-250 req/min
          },
          application: {
            uptime_seconds: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400 * 7), // Up to 7 days
            response_time_avg_ms: Math.random() * 200 + 50, // 50-250ms
            error_rate_percent: Math.random() * 2 // 0-2% error rate
          },
          database: {
            connections_active: Math.floor(Math.random() * 10 + 2), // 2-12 connections
            connections_max: 100,
            query_time_avg_ms: Math.random() * 50 + 10, // 10-60ms
            queries_per_minute: Math.floor(Math.random() * 500 + 100) // 100-600 queries/min
          }
        }
      }
    };

    // Calculate derived values
    const metrics = mockMetrics.data.metrics;
    
    // Memory calculations
    metrics.memory.free_mb = metrics.memory.total_mb - metrics.memory.used_mb;
    metrics.memory.usage_percent = (metrics.memory.used_mb / metrics.memory.total_mb) * 100;
    
    // Disk calculations
    metrics.disk.free_gb = metrics.disk.total_gb - metrics.disk.used_gb;
    metrics.disk.usage_percent = (metrics.disk.used_gb / metrics.disk.total_gb) * 100;

    res.json(mockMetrics);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system metrics'
    });
  }
});

/**
 * GET /api/v1/metrics/health
 * Returns system health status (mock data)
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    // Generate realistic health data
    const cpuUsage = Math.random() * 30 + 20;
    const memoryUsage = Math.random() * 40 + 30;
    const diskUsage = Math.random() * 50 + 20;
    const responseTime = Math.random() * 200 + 50;
    const dbQueryTime = Math.random() * 50 + 10;

    const getHealthStatus = (value: number, warningThreshold: number, criticalThreshold: number) => {
      if (value >= criticalThreshold) return 'critical';
      if (value >= warningThreshold) return 'warning';
      return 'healthy';
    };

    const cpuStatus = getHealthStatus(cpuUsage, 70, 90);
    const memoryStatus = getHealthStatus(memoryUsage, 80, 95);
    const diskStatus = getHealthStatus(diskUsage, 85, 95);
    const appStatus = getHealthStatus(responseTime, 500, 1000);
    const dbStatus = getHealthStatus(dbQueryTime, 100, 200);

    // Overall status is the worst individual status
    const statuses = [cpuStatus, memoryStatus, diskStatus, appStatus, dbStatus];
    let overallStatus = 'healthy';
    if (statuses.includes('critical')) overallStatus = 'critical';
    else if (statuses.includes('warning')) overallStatus = 'warning';

    const mockHealth = {
      success: true,
      data: {
        overall: overallStatus,
        components: {
          cpu: {
            status: cpuStatus,
            value: cpuUsage,
            threshold: 70
          },
          memory: {
            status: memoryStatus,
            value: memoryUsage,
            threshold: 80
          },
          disk: {
            status: diskStatus,
            value: diskUsage,
            threshold: 85
          },
          application: {
            status: appStatus,
            value: responseTime,
            threshold: 500
          },
          database: {
            status: dbStatus,
            value: dbQueryTime,
            threshold: 100
          }
        },
        uptime: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400 * 7), // Up to 7 days
        timestamp: new Date().toISOString()
      }
    };

    res.json(mockHealth);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch health status'
    });
  }
});

export default router;