import { Request, Response } from 'express';
import { LeadService } from '../services/leadService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { query, queryOne } from '../database/connection';

const leadService = new LeadService();

/**
 * Get lead pipeline analytics
 * GET /api/v1/analytics/leads
 */
export const getLeadAnalytics = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get basic lead stats
    const leadStats = await leadService.getLeadStats();

    // Get detailed analytics
    const detailedAnalytics = await leadService.getDetailedAnalytics();

    const analytics = {
      overview: {
        totalLeads: leadStats.total,
        recentLeads: leadStats.recentCount,
        conversionRate: detailedAnalytics.conversionRate,
        avgResponseTime: detailedAnalytics.avgResponseTime
      },
      pipeline: {
        byStatus: leadStats.byStatus,
        byPriority: leadStats.byPriority,
        byType: leadStats.byType,
        conversionFunnel: detailedAnalytics.conversionFunnel
      },
      sources: detailedAnalytics.sourceAnalytics,
      timeline: detailedAnalytics.timeAnalytics,
      aiInsights: detailedAnalytics.aiInsights,
      recentActivity: detailedAnalytics.recentActivity
    };

    res.json({
      success: true,
      data: analytics,
      message: 'Lead analytics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching lead analytics:', error);
    throw new AppError('Failed to fetch lead analytics', 500);
  }
});

/**
 * Get system metrics for dashboard
 * GET /api/v1/analytics/system
 */
export const getSystemMetrics = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Simulate system metrics (in a real app, these would come from monitoring tools)
    const metrics = {
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
        used_mb: Math.random() * 3000 + 2000, // 2-5GB
        free_mb: 0,
        usage_percent: 0
      },
      disk: {
        total_gb: 500,
        used_gb: Math.random() * 200 + 100, // 100-300GB
        free_gb: 0,
        usage_percent: 0
      },
      network: {
        connections_active: Math.floor(Math.random() * 50 + 10),
        requests_per_minute: Math.floor(Math.random() * 100 + 50)
      },
      application: {
        uptime_seconds: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400 * 7), // Up to 7 days
        response_time_avg_ms: Math.random() * 200 + 50,
        error_rate_percent: Math.random() * 2
      },
      database: {
        connections_active: Math.floor(Math.random() * 10 + 2),
        connections_max: 20,
        query_time_avg_ms: Math.random() * 50 + 10,
        queries_per_minute: Math.floor(Math.random() * 200 + 100)
      }
    };

    // Calculate derived values
    metrics.memory.free_mb = metrics.memory.total_mb - metrics.memory.used_mb;
    metrics.memory.usage_percent = (metrics.memory.used_mb / metrics.memory.total_mb) * 100;
    
    metrics.disk.free_gb = metrics.disk.total_gb - metrics.disk.used_gb;
    metrics.disk.usage_percent = (metrics.disk.used_gb / metrics.disk.total_gb) * 100;

    res.json({
      success: true,
      data: { metrics },
      message: 'System metrics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching system metrics:', error);
    throw new AppError('Failed to fetch system metrics', 500);
  }
});

/**
 * Get system health status
 * GET /api/v1/analytics/health
 */
export const getSystemHealth = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get current metrics first
    const metricsResponse = await getSystemMetrics(req, res);
    
    // For this implementation, we'll create a mock health response
    // In a real system, this would analyze actual metrics
    const health = {
      overall: 'healthy' as const,
      components: {
        cpu: { status: 'healthy' as const, value: 25, threshold: 80 },
        memory: { status: 'healthy' as const, value: 45, threshold: 85 },
        disk: { status: 'healthy' as const, value: 35, threshold: 90 },
        application: { status: 'healthy' as const, value: 120, threshold: 1000 },
        database: { status: 'healthy' as const, value: 25, threshold: 100 }
      },
      uptime: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400 * 7),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: health,
      message: 'System health retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching system health:', error);
    throw new AppError('Failed to fetch system health', 500);
  }
});

// Helper functions for analytics

async function getConversionFunnel() {
  const sql = `
    SELECT 
      status,
      COUNT(*) as count,
      ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM leads)), 2) as percentage
    FROM leads 
    GROUP BY status
    ORDER BY 
      CASE status 
        WHEN 'new' THEN 1 
        WHEN 'contacted' THEN 2 
        WHEN 'qualified' THEN 3 
        WHEN 'converted' THEN 4 
        WHEN 'closed' THEN 5 
      END
  `;
  
  return await query<{ status: string; count: number; percentage: number }>(sql);
}

async function getSourceAnalytics() {
  const sql = `
    SELECT 
      source,
      COUNT(*) as count,
      ROUND(AVG(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) * 100, 2) as conversion_rate
    FROM leads 
    GROUP BY source
    ORDER BY count DESC
  `;
  
  return await query<{ source: string; count: number; conversion_rate: number }>(sql);
}

async function getTimeAnalytics() {
  const sql = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as leads_count,
      COUNT(CASE WHEN type = 'project' THEN 1 END) as project_leads,
      COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_leads
    FROM leads 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `;
  
  return await query<{ 
    date: string; 
    leads_count: number; 
    project_leads: number; 
    high_priority_leads: number 
  }>(sql);
}

async function getAiInsights() {
  const sql = `
    SELECT 
      JSON_EXTRACT(ai_analysis, '$.category') as category,
      COUNT(*) as count,
      AVG(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) * 100 as conversion_rate
    FROM leads 
    WHERE ai_analysis IS NOT NULL
    GROUP BY JSON_EXTRACT(ai_analysis, '$.category')
    ORDER BY count DESC
  `;
  
  return await query<{ category: string; count: number; conversion_rate: number }>(sql);
}

async function getRecentActivity() {
  const sql = `
    SELECT 
      id, name, email, type, status, priority,
      JSON_EXTRACT(ai_analysis, '$.category') as category,
      created_at
    FROM leads 
    ORDER BY created_at DESC 
    LIMIT 10
  `;
  
  return await query<{
    id: string;
    name: string;
    email: string;
    type: string;
    status: string;
    priority: string;
    category: string;
    created_at: Date;
  }>(sql);
}

async function getConversionRate(): Promise<number> {
  const result = await queryOne<{ rate: number }>(`
    SELECT 
      ROUND(
        (COUNT(CASE WHEN status = 'converted' THEN 1 END) * 100.0 / COUNT(*)), 2
      ) as rate
    FROM leads
  `);
  
  return result?.rate || 0;
}

async function getAvgResponseTime(): Promise<number> {
  // This is a mock calculation - in reality you'd track actual response times
  const result = await queryOne<{ avg_hours: number }>(`
    SELECT 
      ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)), 1) as avg_hours
    FROM leads 
    WHERE status != 'new' AND updated_at > created_at
  `);
  
  return result?.avg_hours || 0;
}