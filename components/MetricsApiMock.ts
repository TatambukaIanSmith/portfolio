/**
 * Mock API service for SystemMetrics components
 * Provides realistic system metrics data for development and testing
 */

interface MetricHistory {
  timestamp: number;
  value: number;
}

interface SystemMetrics {
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

interface HealthComponent {
  status: 'healthy' | 'warning' | 'critical';
  value: number;
  threshold: number;
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    cpu: HealthComponent;
    memory: HealthComponent;
    disk: HealthComponent;
    application: HealthComponent;
    database: HealthComponent;
  };
  uptime: number;
  timestamp: string;
}

class MetricsApiMock {
  private baseMetrics: SystemMetrics;
  private history: Map<string, MetricHistory[]> = new Map();
  private startTime: number = Date.now();

  constructor() {
    this.baseMetrics = {
      cpu: {
        usage_percent: 45.2,
        load_average: [1.2, 1.1, 0.9]
      },
      memory: {
        total_mb: 8192,
        used_mb: 4096,
        free_mb: 4096,
        usage_percent: 50.0
      },
      disk: {
        total_gb: 500,
        used_gb: 250,
        free_gb: 250,
        usage_percent: 50.0
      },
      network: {
        connections_active: 25,
        requests_per_minute: 150
      },
      application: {
        uptime_seconds: 86400,
        response_time_avg_ms: 120,
        error_rate_percent: 0.5
      },
      database: {
        connections_active: 8,
        connections_max: 20,
        query_time_avg_ms: 45,
        queries_per_minute: 300
      }
    };

    // Initialize history with some data points
    this.initializeHistory();
  }

  private initializeHistory() {
    const now = Date.now();
    const metrics = ['cpu', 'memory', 'disk', 'network', 'application', 'database'];
    
    metrics.forEach(metric => {
      const history: MetricHistory[] = [];
      for (let i = 60; i >= 0; i--) {
        const timestamp = now - (i * 60 * 1000); // Every minute for last hour
        let value = 0;
        
        switch (metric) {
          case 'cpu':
            value = 30 + Math.random() * 40 + Math.sin(i / 10) * 15;
            break;
          case 'memory':
            value = 40 + Math.random() * 30 + Math.sin(i / 15) * 10;
            break;
          case 'disk':
            value = 45 + Math.random() * 10 + i * 0.1; // Slowly increasing
            break;
          case 'network':
            value = 10 + Math.random() * 40 + Math.sin(i / 5) * 20;
            break;
          case 'application':
            value = 80 + Math.random() * 100 + Math.sin(i / 8) * 50;
            break;
          case 'database':
            value = 5 + Math.random() * 15 + Math.sin(i / 12) * 5;
            break;
        }
        
        history.push({ timestamp, value: Math.max(0, Math.min(100, value)) });
      }
      this.history.set(metric, history);
    });
  }

  private addVariation(baseValue: number, maxVariation: number = 5): number {
    const variation = (Math.random() - 0.5) * 2 * maxVariation;
    return Math.max(0, Math.min(100, baseValue + variation));
  }

  private updateHistory(metric: string, value: number) {
    const history = this.history.get(metric) || [];
    history.push({ timestamp: Date.now(), value });
    
    // Keep only last 100 points
    if (history.length > 100) {
      history.shift();
    }
    
    this.history.set(metric, history);
  }

  getCurrentMetrics(): { success: boolean; data: { metrics: SystemMetrics } } {
    // Add some realistic variations
    const currentMetrics: SystemMetrics = {
      cpu: {
        usage_percent: this.addVariation(this.baseMetrics.cpu.usage_percent, 10),
        load_average: this.baseMetrics.cpu.load_average.map(val => 
          this.addVariation(val, 0.3)
        )
      },
      memory: {
        ...this.baseMetrics.memory,
        usage_percent: this.addVariation(this.baseMetrics.memory.usage_percent, 8)
      },
      disk: {
        ...this.baseMetrics.disk,
        usage_percent: this.addVariation(this.baseMetrics.disk.usage_percent, 2)
      },
      network: {
        connections_active: Math.floor(this.addVariation(this.baseMetrics.network.connections_active, 10)),
        requests_per_minute: Math.floor(this.addVariation(this.baseMetrics.network.requests_per_minute, 50))
      },
      application: {
        uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
        response_time_avg_ms: this.addVariation(this.baseMetrics.application.response_time_avg_ms, 30),
        error_rate_percent: this.addVariation(this.baseMetrics.application.error_rate_percent, 0.3)
      },
      database: {
        ...this.baseMetrics.database,
        connections_active: Math.floor(this.addVariation(this.baseMetrics.database.connections_active, 3)),
        query_time_avg_ms: this.addVariation(this.baseMetrics.database.query_time_avg_ms, 15),
        queries_per_minute: Math.floor(this.addVariation(this.baseMetrics.database.queries_per_minute, 100))
      }
    };

    // Update history
    this.updateHistory('cpu', currentMetrics.cpu.usage_percent);
    this.updateHistory('memory', currentMetrics.memory.usage_percent);
    this.updateHistory('disk', currentMetrics.disk.usage_percent);
    this.updateHistory('network', currentMetrics.network.connections_active);
    this.updateHistory('application', currentMetrics.application.response_time_avg_ms);
    this.updateHistory('database', currentMetrics.database.connections_active);

    return {
      success: true,
      data: { metrics: currentMetrics }
    };
  }

  getHealthStatus(): { success: boolean; data: SystemHealth } {
    const current = this.getCurrentMetrics().data.metrics;
    
    const getHealthStatus = (value: number, warningThreshold: number, criticalThreshold: number): 'healthy' | 'warning' | 'critical' => {
      if (value >= criticalThreshold) return 'critical';
      if (value >= warningThreshold) return 'warning';
      return 'healthy';
    };

    const components = {
      cpu: {
        status: getHealthStatus(current.cpu.usage_percent, 70, 90),
        value: current.cpu.usage_percent,
        threshold: 70
      },
      memory: {
        status: getHealthStatus(current.memory.usage_percent, 80, 95),
        value: current.memory.usage_percent,
        threshold: 80
      },
      disk: {
        status: getHealthStatus(current.disk.usage_percent, 85, 95),
        value: current.disk.usage_percent,
        threshold: 85
      },
      application: {
        status: getHealthStatus(current.application.response_time_avg_ms, 500, 1000),
        value: current.application.response_time_avg_ms,
        threshold: 500
      },
      database: {
        status: getHealthStatus(current.database.query_time_avg_ms, 100, 200),
        value: current.database.query_time_avg_ms,
        threshold: 100
      }
    };

    // Determine overall health
    const statuses = Object.values(components).map(c => c.status);
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (statuses.includes('critical')) {
      overall = 'critical';
    } else if (statuses.includes('warning')) {
      overall = 'warning';
    }

    return {
      success: true,
      data: {
        overall,
        components,
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        timestamp: new Date().toISOString()
      }
    };
  }

  getHistory(period: '1h' | '6h' | '24h' | '7d' = '1h'): { 
    success: boolean; 
    data: { 
      history: {
        cpu: MetricHistory[];
        memory: MetricHistory[];
        disk: MetricHistory[];
        network: MetricHistory[];
        application: MetricHistory[];
        database: MetricHistory[];
      }
    }
  } {
    const now = Date.now();
    let cutoffTime = now;
    
    switch (period) {
      case '1h':
        cutoffTime = now - (60 * 60 * 1000);
        break;
      case '6h':
        cutoffTime = now - (6 * 60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
    }

    const filteredHistory: any = {};
    
    this.history.forEach((history, metric) => {
      filteredHistory[metric] = history.filter(point => point.timestamp >= cutoffTime);
    });

    return {
      success: true,
      data: { history: filteredHistory }
    };
  }

  getTrends(): {
    success: boolean;
    data: {
      trends: {
        cpu: 'up' | 'down' | 'stable';
        memory: 'up' | 'down' | 'stable';
        disk: 'up' | 'down' | 'stable';
        response_time: 'up' | 'down' | 'stable';
      };
      predictions: {
        cpu_next_hour: number;
        memory_next_hour: number;
        disk_full_estimate: string;
      };
    }
  } {
    const calculateTrend = (history: MetricHistory[]): 'up' | 'down' | 'stable' => {
      if (history.length < 2) return 'stable';
      
      const recent = history.slice(-10);
      const older = history.slice(-20, -10);
      
      const recentAvg = recent.reduce((sum, point) => sum + point.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, point) => sum + point.value, 0) / older.length;
      
      const diff = recentAvg - olderAvg;
      
      if (Math.abs(diff) < 2) return 'stable';
      return diff > 0 ? 'up' : 'down';
    };

    const cpuHistory = this.history.get('cpu') || [];
    const memoryHistory = this.history.get('memory') || [];
    const diskHistory = this.history.get('disk') || [];
    const appHistory = this.history.get('application') || [];

    const trends = {
      cpu: calculateTrend(cpuHistory),
      memory: calculateTrend(memoryHistory),
      disk: calculateTrend(diskHistory),
      response_time: calculateTrend(appHistory)
    };

    // Simple predictions based on current values and trends
    const current = this.getCurrentMetrics().data.metrics;
    const predictions = {
      cpu_next_hour: current.cpu.usage_percent + (trends.cpu === 'up' ? 5 : trends.cpu === 'down' ? -3 : 0),
      memory_next_hour: current.memory.usage_percent + (trends.memory === 'up' ? 3 : trends.memory === 'down' ? -2 : 0),
      disk_full_estimate: trends.disk === 'up' ? '2 weeks' : trends.disk === 'stable' ? '6 months' : 'Not applicable'
    };

    return {
      success: true,
      data: { trends, predictions }
    };
  }

  // Simulate API delay
  private async delay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods that simulate HTTP requests
  async fetchCurrentMetrics(): Promise<any> {
    await this.delay();
    return this.getCurrentMetrics();
  }

  async fetchHealthStatus(): Promise<any> {
    await this.delay();
    return this.getHealthStatus();
  }

  async fetchHistory(period?: '1h' | '6h' | '24h' | '7d'): Promise<any> {
    await this.delay(200);
    return this.getHistory(period);
  }

  async fetchTrends(): Promise<any> {
    await this.delay(150);
    return this.getTrends();
  }
}

// Export singleton instance
export const metricsApi = new MetricsApiMock();

// Export types for use in components
export type { SystemMetrics, SystemHealth, MetricHistory };