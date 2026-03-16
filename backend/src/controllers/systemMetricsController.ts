import { Request, Response } from 'express';
import { systemMetricsService } from '../services/systemMetricsService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Validation schemas
const timeRangeSchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  hours: z.string().transform(Number).pipe(z.number().min(1).max(168)).optional() // Max 1 week
});

const metricTypeSchema = z.object({
  type: z.enum(['cpu', 'memory', 'disk', 'network', 'application', 'database']).optional()
});

/**
 * Get current system metrics
 * GET /api/v1/metrics/current
 */
export const getCurrentMetrics = asyncHandler(async (req: Request, res: Response) => {
  const metrics = await systemMetricsService.collectCurrentMetrics();
  
  logger.info('Current system metrics retrieved');
  
  res.json({
    success: true,
    data: {
      metrics,
      timestamp: new Date(),
      hostname: require('os').hostname()
    },
    message: 'Current system metrics retrieved successfully'
  });
});

/**
 * Get metrics history
 * GET /api/v1/metrics/history
 */
export const getMetricsHistory = asyncHandler(async (req: Request, res: Response) => {
  // Validate query parameters
  const timeParams = timeRangeSchema.parse(req.query);
  const typeParams = metricTypeSchema.parse(req.query);
  
  // Calculate time range
  let startDate: Date;
  let endDate: Date = new Date();
  
  if (timeParams.start && timeParams.end) {
    startDate = new Date(timeParams.start);
    endDate = new Date(timeParams.end);
  } else if (timeParams.hours) {
    startDate = new Date(Date.now() - timeParams.hours * 60 * 60 * 1000);
  } else {
    // Default to last 24 hours
    startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  }
  
  const history = await systemMetricsService.getMetricsHistory(
    startDate,
    endDate,
    typeParams.type
  );
  
  logger.info('Metrics history retrieved', { 
    startDate, 
    endDate, 
    type: typeParams.type,
    recordCount: history.length 
  });
  
  res.json({
    success: true,
    data: {
      history,
      timeRange: { start: startDate, end: endDate },
      metricType: typeParams.type,
      recordCount: history.length
    },
    message: 'Metrics history retrieved successfully'
  });
});

/**
 * Get aggregated metrics for dashboard
 * GET /api/v1/metrics/dashboard
 */
export const getDashboardMetrics = asyncHandler(async (req: Request, res: Response) => {
  // Validate query parameters
  const timeParams = timeRangeSchema.parse(req.query);
  
  // Calculate time range (default to last 24 hours)
  const hours = timeParams.hours || 24;
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  const endDate = new Date();
  
  const aggregatedMetrics = await systemMetricsService.getAggregatedMetrics({
    start: startDate,
    end: endDate
  });
  
  logger.info('Dashboard metrics retrieved', { hours, recordCount: aggregatedMetrics });
  
  res.json({
    success: true,
    data: {
      ...aggregatedMetrics,
      timeRange: { start: startDate, end: endDate, hours },
      timestamp: new Date()
    },
    message: 'Dashboard metrics retrieved successfully'
  });
});

/**
 * Force metrics collection
 * POST /api/v1/metrics/collect
 */
export const forceMetricsCollection = asyncHandler(async (req: Request, res: Response) => {
  await systemMetricsService.collectAndStoreMetrics();
  
  logger.info('Forced metrics collection completed');
  
  res.json({
    success: true,
    data: {
      timestamp: new Date(),
      message: 'Metrics collection completed'
    },
    message: 'Metrics collected and stored successfully'
  });
});

/**
 * Get system health summary
 * GET /api/v1/metrics/health
 */
export const getSystemHealth = asyncHandler(async (req: Request, res: Response) => {
  const currentMetrics = await systemMetricsService.collectCurrentMetrics();
  
  // Determine health status based on thresholds
  const health = {
    overall: 'healthy' as 'healthy' | 'warning' | 'critical',
    components: {
      cpu: {
        status: currentMetrics.cpu.usage_percent > 90 ? 'critical' : 
                currentMetrics.cpu.usage_percent > 70 ? 'warning' : 'healthy',
        value: currentMetrics.cpu.usage_percent,
        threshold: 70
      },
      memory: {
        status: currentMetrics.memory.usage_percent > 90 ? 'critical' : 
                currentMetrics.memory.usage_percent > 80 ? 'warning' : 'healthy',
        value: currentMetrics.memory.usage_percent,
        threshold: 80
      },
      disk: {
        status: currentMetrics.disk.usage_percent > 95 ? 'critical' : 
                currentMetrics.disk.usage_percent > 85 ? 'warning' : 'healthy',
        value: currentMetrics.disk.usage_percent,
        threshold: 85
      },
      application: {
        status: currentMetrics.application.error_rate_percent > 5 ? 'critical' : 
                currentMetrics.application.error_rate_percent > 1 ? 'warning' : 'healthy',
        value: currentMetrics.application.error_rate_percent,
        threshold: 1
      },
      database: {
        status: currentMetrics.database.connections_active > (currentMetrics.database.connections_max * 0.9) ? 'critical' : 
                currentMetrics.database.connections_active > (currentMetrics.database.connections_max * 0.7) ? 'warning' : 'healthy',
        value: currentMetrics.database.connections_active,
        threshold: Math.round(currentMetrics.database.connections_max * 0.7)
      }
    },
    uptime: currentMetrics.application.uptime_seconds,
    timestamp: new Date()
  };
  
  // Determine overall health
  const componentStatuses = Object.values(health.components).map(c => c.status);
  if (componentStatuses.includes('critical')) {
    health.overall = 'critical';
  } else if (componentStatuses.includes('warning')) {
    health.overall = 'warning';
  }
  
  logger.info('System health check completed', { 
    overall: health.overall,
    criticalComponents: componentStatuses.filter(s => s === 'critical').length
  });
  
  res.json({
    success: true,
    data: health,
    message: `System health: ${health.overall}`
  });
});

/**
 * Clean up old metrics
 * DELETE /api/v1/metrics/cleanup
 */
export const cleanupMetrics = asyncHandler(async (req: Request, res: Response) => {
  await systemMetricsService.cleanupOldMetrics();
  
  logger.info('Metrics cleanup completed');
  
  res.json({
    success: true,
    data: {
      timestamp: new Date(),
      message: 'Old metrics cleaned up (kept last 30 days)'
    },
    message: 'Metrics cleanup completed successfully'
  });
});

/**
 * Get metrics summary statistics
 * GET /api/v1/metrics/stats
 */
export const getMetricsStats = asyncHandler(async (req: Request, res: Response) => {
  const timeParams = timeRangeSchema.parse(req.query);
  
  // Calculate time range (default to last 24 hours)
  const hours = timeParams.hours || 24;
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  const endDate = new Date();
  
  // Get all metrics for the time range
  const allMetrics = await systemMetricsService.getMetricsHistory(startDate, endDate);
  
  // Calculate statistics
  const stats = {
    totalRecords: allMetrics.length,
    timeRange: { start: startDate, end: endDate, hours },
    metricTypes: {
      cpu: allMetrics.filter(m => m.metric_type === 'cpu').length,
      memory: allMetrics.filter(m => m.metric_type === 'memory').length,
      disk: allMetrics.filter(m => m.metric_type === 'disk').length,
      network: allMetrics.filter(m => m.metric_type === 'network').length,
      application: allMetrics.filter(m => m.metric_type === 'application').length,
      database: allMetrics.filter(m => m.metric_type === 'database').length
    },
    oldestRecord: allMetrics.length > 0 ? allMetrics[allMetrics.length - 1].recorded_at : null,
    newestRecord: allMetrics.length > 0 ? allMetrics[0].recorded_at : null,
    hostname: require('os').hostname()
  };
  
  logger.info('Metrics statistics retrieved', { 
    totalRecords: stats.totalRecords,
    hours 
  });
  
  res.json({
    success: true,
    data: stats,
    message: 'Metrics statistics retrieved successfully'
  });
});