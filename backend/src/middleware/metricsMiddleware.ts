import { Request, Response, NextFunction } from 'express';
import { systemMetricsService } from '../services/systemMetricsService';
import { logger } from '../utils/logger';

/**
 * Middleware to track request metrics
 */
export const trackRequestMetrics = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Track the request
  systemMetricsService.trackRequest();
  
  // Override res.end to capture response time and status
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    // Track response time
    systemMetricsService.trackResponseTime(responseTime);
    
    // Track errors (4xx and 5xx status codes)
    if (res.statusCode >= 400) {
      systemMetricsService.trackError();
    }
    
    // Log metrics for monitoring
    logger.debug('Request metrics', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Middleware to track database query metrics
 */
export const trackDatabaseMetrics = () => {
  return (originalQuery: Function) => {
    return async (...args: any[]) => {
      const startTime = Date.now();
      
      try {
        const result = await originalQuery.apply(this, args);
        const queryTime = Date.now() - startTime;
        
        // Track query time
        systemMetricsService.trackQueryTime(queryTime);
        
        // Log slow queries (> 1000ms)
        if (queryTime > 1000) {
          logger.warn('Slow database query detected', {
            queryTime,
            query: typeof args[0] === 'string' ? args[0].substring(0, 100) : 'Unknown'
          });
        }
        
        return result;
      } catch (error) {
        const queryTime = Date.now() - startTime;
        systemMetricsService.trackQueryTime(queryTime);
        
        logger.error('Database query error', {
          queryTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          query: typeof args[0] === 'string' ? args[0].substring(0, 100) : 'Unknown'
        });
        
        throw error;
      }
    };
  };
};

/**
 * Middleware to add metrics headers to responses
 */
export const addMetricsHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Add server metrics to response headers (for monitoring tools)
  res.setHeader('X-Server-Hostname', require('os').hostname());
  res.setHeader('X-Server-Uptime', process.uptime());
  res.setHeader('X-Memory-Usage', JSON.stringify({
    rss: process.memoryUsage().rss,
    heapUsed: process.memoryUsage().heapUsed,
    heapTotal: process.memoryUsage().heapTotal
  }));
  
  next();
};

/**
 * Error tracking middleware
 */
export const trackErrorMetrics = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // Track application errors
  systemMetricsService.trackError();
  
  // Log error with context
  logger.error('Application error tracked', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next(error);
};