import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import { query, queryOne } from '../database/connection';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export interface SystemMetric {
  id: string;
  metric_type: 'cpu' | 'memory' | 'disk' | 'network' | 'application' | 'database';
  metric_name: string;
  value: number;
  unit: string;
  hostname: string;
  service_name?: string;
  metadata?: any;
  recorded_at: Date;
}

export interface SystemMetrics {
  cpu: {
    usage_percent: number;
    load_average: number[];
  };
  memory: {
    total_mb: number;
    used_mb: number;
    free_mb: number;
    usage_percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    free_gb: number;
    usage_percent: number;
  };
  network: {
    connections_active: number;
    requests_per_minute: number;
  };
  application: {
    uptime_seconds: number;
    response_time_avg_ms: number;
    error_rate_percent: number;
  };
  database: {
    connections_active: number;
    connections_max: number;
    query_time_avg_ms: number;
    queries_per_minute: number;
  };
}

export interface MetricsHistory {
  timestamp: Date;
  metrics: SystemMetrics;
}

export class SystemMetricsService {
  private hostname: string;
  private startTime: Date;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimes: number[] = [];
  private queryTimes: number[] = [];
  private queryCount: number = 0;

  constructor() {
    this.hostname = os.hostname();
    this.startTime = new Date();
    
    // Register globally for database connection tracking
    if (typeof global !== 'undefined') {
      (global as any).systemMetricsService = this;
    }
    
    // Start periodic metrics collection
    this.startPeriodicCollection();
  }

  /**
   * Start periodic metrics collection (every 5 minutes)
   */
  private startPeriodicCollection(): void {
    setInterval(async () => {
      try {
        await this.collectAndStoreMetrics();
      } catch (error) {
        logger.error('Failed to collect periodic metrics:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Collect current system metrics
   */
  async collectCurrentMetrics(): Promise<SystemMetrics> {
    try {
      const metrics: SystemMetrics = {
        cpu: await this.getCpuMetrics(),
        memory: this.getMemoryMetrics(),
        disk: await this.getDiskMetrics(),
        network: this.getNetworkMetrics(),
        application: this.getApplicationMetrics(),
        database: await this.getDatabaseMetrics()
      };

      return metrics;
    } catch (error) {
      logger.error('Failed to collect system metrics:', error);
      throw new AppError('Failed to collect system metrics', 500);
    }
  }

  /**
   * Get CPU metrics
   */
  private async getCpuMetrics(): Promise<SystemMetrics['cpu']> {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    // Calculate CPU usage (simplified)
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return {
      usage_percent: Math.max(0, Math.min(100, usage)),
      load_average: loadAvg
    };
  }

  /**
   * Get memory metrics
   */
  private getMemoryMetrics(): SystemMetrics['memory'] {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      total_mb: Math.round(totalMem / 1024 / 1024),
      used_mb: Math.round(usedMem / 1024 / 1024),
      free_mb: Math.round(freeMem / 1024 / 1024),
      usage_percent: Math.round((usedMem / totalMem) * 100)
    };
  }

  /**
   * Get disk metrics (simplified - process memory usage as proxy)
   */
  private async getDiskMetrics(): Promise<SystemMetrics['disk']> {
    const memUsage = process.memoryUsage();
    
    // This is a simplified implementation
    // In production, you'd want to use a library like 'node-disk-info'
    return {
      total_gb: 100, // Placeholder
      used_gb: Math.round(memUsage.heapUsed / 1024 / 1024 / 1024 * 100) / 100,
      free_gb: 90, // Placeholder
      usage_percent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    };
  }

  /**
   * Get network metrics
   */
  private getNetworkMetrics(): SystemMetrics['network'] {
    return {
      connections_active: this.getActiveConnections(),
      requests_per_minute: this.getRequestsPerMinute()
    };
  }

  /**
   * Get application metrics
   */
  private getApplicationMetrics(): SystemMetrics['application'] {
    const uptime = (Date.now() - this.startTime.getTime()) / 1000;
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;
    const errorRate = this.requestCount > 0 
      ? (this.errorCount / this.requestCount) * 100 
      : 0;

    return {
      uptime_seconds: Math.round(uptime),
      response_time_avg_ms: Math.round(avgResponseTime),
      error_rate_percent: Math.round(errorRate * 100) / 100
    };
  }

  /**
   * Get database metrics
   */
  private async getDatabaseMetrics(): Promise<SystemMetrics['database']> {
    try {
      // Get database connection info
      const connectionInfo = await this.getDatabaseConnectionInfo();
      const avgQueryTime = this.queryTimes.length > 0 
        ? this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length 
        : 0;

      return {
        connections_active: connectionInfo.active_connections,
        connections_max: connectionInfo.max_connections,
        query_time_avg_ms: Math.round(avgQueryTime),
        queries_per_minute: this.getQueriesPerMinute()
      };
    } catch (error) {
      logger.error('Failed to get database metrics:', error);
      return {
        connections_active: 0,
        connections_max: 0,
        query_time_avg_ms: 0,
        queries_per_minute: 0
      };
    }
  }

  /**
   * Get database connection information
   */
  private async getDatabaseConnectionInfo(): Promise<{
    active_connections: number;
    max_connections: number;
  }> {
    try {
      const result = await queryOne<any>(`
        SELECT 
          (SELECT COUNT(*) FROM information_schema.processlist) as active_connections,
          @@max_connections as max_connections
      `);
      
      return {
        active_connections: result?.active_connections || 0,
        max_connections: result?.max_connections || 0
      };
    } catch (error) {
      return { active_connections: 0, max_connections: 0 };
    }
  }

  /**
   * Store metrics in database
   */
  async storeMetric(
    type: SystemMetric['metric_type'],
    name: string,
    value: number,
    unit: string,
    serviceName?: string,
    metadata?: any
  ): Promise<void> {
    try {
      const id = uuidv4();
      const sql = `
        INSERT INTO system_metrics (
          id, metric_type, metric_name, value, unit, 
          hostname, service_name, metadata, recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      await query(sql, [
        id,
        type,
        name,
        value,
        unit,
        this.hostname,
        serviceName || null,
        metadata ? JSON.stringify(metadata) : null
      ]);

      logger.debug('Metric stored', { type, name, value, unit });
    } catch (error) {
      logger.error('Failed to store metric:', error);
      throw error;
    }
  }

  /**
   * Collect and store all current metrics
   */
  async collectAndStoreMetrics(): Promise<void> {
    try {
      const metrics = await this.collectCurrentMetrics();
      
      // Store CPU metrics
      await this.storeMetric('cpu', 'usage_percent', metrics.cpu.usage_percent, '%');
      await this.storeMetric('cpu', 'load_average_1m', metrics.cpu.load_average[0], 'load');
      
      // Store memory metrics
      await this.storeMetric('memory', 'usage_percent', metrics.memory.usage_percent, '%');
      await this.storeMetric('memory', 'used_mb', metrics.memory.used_mb, 'MB');
      
      // Store disk metrics
      await this.storeMetric('disk', 'usage_percent', metrics.disk.usage_percent, '%');
      
      // Store network metrics
      await this.storeMetric('network', 'active_connections', metrics.network.connections_active, 'count');
      await this.storeMetric('network', 'requests_per_minute', metrics.network.requests_per_minute, 'req/min');
      
      // Store application metrics
      await this.storeMetric('application', 'uptime_seconds', metrics.application.uptime_seconds, 'seconds');
      await this.storeMetric('application', 'response_time_avg_ms', metrics.application.response_time_avg_ms, 'ms');
      await this.storeMetric('application', 'error_rate_percent', metrics.application.error_rate_percent, '%');
      
      // Store database metrics
      await this.storeMetric('database', 'active_connections', metrics.database.connections_active, 'count');
      await this.storeMetric('database', 'query_time_avg_ms', metrics.database.query_time_avg_ms, 'ms');
      await this.storeMetric('database', 'queries_per_minute', metrics.database.queries_per_minute, 'queries/min');

      logger.info('System metrics collected and stored successfully');
    } catch (error) {
      logger.error('Failed to collect and store metrics:', error);
      throw error;
    }
  }

  /**
   * Get metrics history for a time range
   */
  async getMetricsHistory(
    startDate: Date,
    endDate: Date,
    metricType?: SystemMetric['metric_type']
  ): Promise<SystemMetric[]> {
    try {
      let sql = `
        SELECT 
          id, metric_type, metric_name, value, unit,
          hostname, service_name, metadata, recorded_at
        FROM system_metrics 
        WHERE recorded_at BETWEEN ? AND ?
      `;
      const params: any[] = [startDate, endDate];

      if (metricType) {
        sql += ' AND metric_type = ?';
        params.push(metricType);
      }

      sql += ' ORDER BY recorded_at DESC';

      const results = await query<any>(sql, params);
      
      return results.map(row => ({
        id: row.id,
        metric_type: row.metric_type,
        metric_name: row.metric_name,
        value: parseFloat(row.value),
        unit: row.unit,
        hostname: row.hostname,
        service_name: row.service_name,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        recorded_at: new Date(row.recorded_at)
      }));
    } catch (error) {
      logger.error('Failed to get metrics history:', error);
      throw new AppError('Failed to get metrics history', 500);
    }
  }

  /**
   * Get aggregated metrics for dashboard
   */
  async getAggregatedMetrics(timeRange: { start: Date; end: Date }): Promise<{
    current: SystemMetrics;
    averages: SystemMetrics;
    peaks: SystemMetrics;
  }> {
    try {
      const current = await this.collectCurrentMetrics();
      
      // Get historical data for averages and peaks
      const history = await this.getMetricsHistory(timeRange.start, timeRange.end);
      
      // Calculate averages and peaks
      const averages = this.calculateAverages(history);
      const peaks = this.calculatePeaks(history);

      return { current, averages, peaks };
    } catch (error) {
      logger.error('Failed to get aggregated metrics:', error);
      throw new AppError('Failed to get aggregated metrics', 500);
    }
  }

  /**
   * Calculate average metrics from history
   */
  private calculateAverages(history: SystemMetric[]): SystemMetrics {
    const cpuUsage = history.filter(m => m.metric_name === 'usage_percent' && m.metric_type === 'cpu');
    const memUsage = history.filter(m => m.metric_name === 'usage_percent' && m.metric_type === 'memory');
    const diskUsage = history.filter(m => m.metric_name === 'usage_percent' && m.metric_type === 'disk');
    
    return {
      cpu: {
        usage_percent: this.average(cpuUsage.map(m => m.value)),
        load_average: [0, 0, 0] // Simplified
      },
      memory: {
        total_mb: 0,
        used_mb: 0,
        free_mb: 0,
        usage_percent: this.average(memUsage.map(m => m.value))
      },
      disk: {
        total_gb: 0,
        used_gb: 0,
        free_gb: 0,
        usage_percent: this.average(diskUsage.map(m => m.value))
      },
      network: {
        connections_active: 0,
        requests_per_minute: 0
      },
      application: {
        uptime_seconds: 0,
        response_time_avg_ms: 0,
        error_rate_percent: 0
      },
      database: {
        connections_active: 0,
        connections_max: 0,
        query_time_avg_ms: 0,
        queries_per_minute: 0
      }
    };
  }

  /**
   * Calculate peak metrics from history
   */
  private calculatePeaks(history: SystemMetric[]): SystemMetrics {
    const cpuUsage = history.filter(m => m.metric_name === 'usage_percent' && m.metric_type === 'cpu');
    const memUsage = history.filter(m => m.metric_name === 'usage_percent' && m.metric_type === 'memory');
    const diskUsage = history.filter(m => m.metric_name === 'usage_percent' && m.metric_type === 'disk');
    
    return {
      cpu: {
        usage_percent: Math.max(...cpuUsage.map(m => m.value), 0),
        load_average: [0, 0, 0] // Simplified
      },
      memory: {
        total_mb: 0,
        used_mb: 0,
        free_mb: 0,
        usage_percent: Math.max(...memUsage.map(m => m.value), 0)
      },
      disk: {
        total_gb: 0,
        used_gb: 0,
        free_gb: 0,
        usage_percent: Math.max(...diskUsage.map(m => m.value), 0)
      },
      network: {
        connections_active: 0,
        requests_per_minute: 0
      },
      application: {
        uptime_seconds: 0,
        response_time_avg_ms: 0,
        error_rate_percent: 0
      },
      database: {
        connections_active: 0,
        connections_max: 0,
        query_time_avg_ms: 0,
        queries_per_minute: 0
      }
    };
  }

  /**
   * Helper methods for tracking
   */
  trackRequest(): void {
    this.requestCount++;
  }

  trackError(): void {
    this.errorCount++;
  }

  trackResponseTime(time: number): void {
    this.responseTimes.push(time);
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }
  }

  trackQueryTime(time: number): void {
    this.queryCount++;
    this.queryTimes.push(time);
    // Keep only last 100 query times
    if (this.queryTimes.length > 100) {
      this.queryTimes = this.queryTimes.slice(-100);
    }
  }

  /**
   * Helper methods
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private getActiveConnections(): number {
    // This would need to be implemented based on your server setup
    return Math.floor(Math.random() * 50) + 10; // Placeholder
  }

  private getRequestsPerMinute(): number {
    return Math.round(this.requestCount / ((Date.now() - this.startTime.getTime()) / 60000));
  }

  private getQueriesPerMinute(): number {
    return Math.round(this.queryCount / ((Date.now() - this.startTime.getTime()) / 60000));
  }

  /**
   * Clean up old metrics (keep last 30 days)
   */
  async cleanupOldMetrics(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const sql = 'DELETE FROM system_metrics WHERE recorded_at < ?';
      const result = await query(sql, [thirtyDaysAgo]);
      
      logger.info('Old metrics cleaned up', { deletedRows: result });
    } catch (error) {
      logger.error('Failed to cleanup old metrics:', error);
    }
  }
}

// Export singleton instance
export const systemMetricsService = new SystemMetricsService();