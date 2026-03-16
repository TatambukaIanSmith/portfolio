# SystemMetrics Integration Guide

This guide shows you how to integrate the complete SystemMetrics suite into your application.

## 🚀 Quick Start

### 1. Basic Integration

```tsx
import SystemMetrics from './components/SystemMetrics';

function App() {
  return (
    <div className="p-6">
      <SystemMetrics apiUrl="/api/v1" />
    </div>
  );
}
```

### 2. Advanced Monitoring

```tsx
import SystemMetricsAdvanced from './components/SystemMetricsAdvanced';

function MonitoringPage() {
  return (
    <SystemMetricsAdvanced 
      apiUrl="/api/v1"
      options={{
        showTrends: true,
        showHistory: true,
        showPredictions: true,
        enableExport: true
      }}
    />
  );
}
```

### 3. Complete Dashboard

```tsx
import SystemDashboard from './components/SystemDashboard';

function DashboardPage() {
  return <SystemDashboard />;
}
```

## 📋 Component Overview

### SystemMetrics (Basic)
- **Purpose**: Standard system monitoring with interactive configuration
- **Features**: Real-time metrics, configurable display, notifications
- **Best for**: General monitoring, embedded dashboards

### SystemMetricsAdvanced
- **Purpose**: Enhanced monitoring with analytics
- **Features**: Historical data, trends, predictions, export functionality
- **Best for**: Detailed analysis, performance monitoring

### SystemDashboard
- **Purpose**: Complete monitoring solution
- **Features**: Multiple layouts, theme switching, performance insights
- **Best for**: Dedicated monitoring pages, admin panels

### SystemMetricsShowcase
- **Purpose**: Interactive demonstration
- **Features**: Live examples, code samples, feature comparison
- **Best for**: Documentation, demos, testing

## 🔧 API Requirements

### Required Endpoints

#### GET /api/v1/metrics/current
```json
{
  "success": true,
  "data": {
    "metrics": {
      "cpu": {
        "usage_percent": 45.2,
        "load_average": [1.2, 1.1, 0.9]
      },
      "memory": {
        "total_mb": 8192,
        "used_mb": 4096,
        "free_mb": 4096,
        "usage_percent": 50.0
      },
      "disk": {
        "total_gb": 500,
        "used_gb": 250,
        "free_gb": 250,
        "usage_percent": 50.0
      },
      "network": {
        "connections_active": 25,
        "requests_per_minute": 150
      },
      "application": {
        "uptime_seconds": 86400,
        "response_time_avg_ms": 120,
        "error_rate_percent": 0.5
      },
      "database": {
        "connections_active": 8,
        "connections_max": 20,
        "query_time_avg_ms": 45,
        "queries_per_minute": 300
      }
    }
  }
}
```

#### GET /api/v1/metrics/health
```json
{
  "success": true,
  "data": {
    "overall": "healthy",
    "components": {
      "cpu": { "status": "healthy", "value": 45.2, "threshold": 70 },
      "memory": { "status": "warning", "value": 85.1, "threshold": 80 },
      "disk": { "status": "healthy", "value": 50.0, "threshold": 85 },
      "application": { "status": "healthy", "value": 120, "threshold": 500 },
      "database": { "status": "healthy", "value": 45, "threshold": 100 }
    },
    "uptime": 86400,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

#### GET /api/v1/metrics/history?period=1h (Advanced only)
```json
{
  "success": true,
  "data": {
    "history": {
      "cpu": [
        { "timestamp": 1704067200000, "value": 45.2 },
        { "timestamp": 1704067260000, "value": 47.1 }
      ],
      "memory": [
        { "timestamp": 1704067200000, "value": 50.0 },
        { "timestamp": 1704067260000, "value": 52.3 }
      ]
    }
  }
}
```

#### GET /api/v1/metrics/trends (Advanced only)
```json
{
  "success": true,
  "data": {
    "trends": {
      "cpu": "up",
      "memory": "stable",
      "disk": "up",
      "response_time": "down"
    },
    "predictions": {
      "cpu_next_hour": 48.5,
      "memory_next_hour": 52.0,
      "disk_full_estimate": "2 weeks"
    }
  }
}
```

## 🎨 Styling & Theming

### CSS Classes
The components use Tailwind CSS classes. Ensure you have Tailwind configured:

```css
/* Required Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Custom Themes
```tsx
<SystemMetrics 
  options={{
    colorScheme: 'dark', // 'default' | 'dark' | 'minimal'
    displayMode: 'compact', // 'grid' | 'list' | 'compact'
  }}
/>
```

### Theme Customization
```css
/* Custom theme variables */
:root {
  --metrics-primary: #3b82f6;
  --metrics-success: #10b981;
  --metrics-warning: #f59e0b;
  --metrics-error: #ef4444;
}
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px - Single column, compact mode
- **Tablet**: 768px - 1023px - Two columns, adaptive layout
- **Desktop**: 1024px+ - Full grid layout, all features

### Mobile Optimization
```tsx
<SystemMetrics 
  options={{
    displayMode: 'list', // Better for mobile
    compactMode: true,
    visibleMetrics: {
      cpu: true,
      memory: true,
      disk: false, // Hide on mobile
      network: false,
      application: true,
      database: false
    }
  }}
/>
```

## 🔔 Notifications

### Browser Notifications
```tsx
<SystemMetrics 
  options={{
    enableNotifications: true
  }}
/>
```

### Custom Alert Handling
```tsx
<SystemMetricsAdvanced 
  onAlert={(alert) => {
    // Custom alert handling
    console.log('System alert:', alert);
    
    // Send to external service
    fetch('/api/alerts', {
      method: 'POST',
      body: JSON.stringify(alert)
    });
    
    // Show custom notification
    showCustomNotification(alert);
  }}
/>
```

## 📊 Data Export

### Automatic Export
```tsx
<SystemMetricsAdvanced 
  options={{
    enableExport: true
  }}
  onExport={(data) => {
    // Handle exported data
    console.log('Exported metrics:', data);
    
    // Send to analytics service
    analytics.track('metrics_exported', data);
  }}
/>
```

### Manual Export
```tsx
const exportMetrics = async () => {
  const response = await fetch('/api/v1/metrics/export');
  const data = await response.json();
  
  // Create download
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'metrics-export.json';
  a.click();
};
```

## 🔧 Configuration Options

### Complete Options Reference

```tsx
interface SystemMetricsOptions {
  // Refresh Settings
  refreshInterval?: number;        // 5000-300000ms
  autoRefresh?: boolean;          // true/false

  // Display Settings
  displayMode?: 'grid' | 'list' | 'compact';
  colorScheme?: 'default' | 'dark' | 'minimal';
  compactMode?: boolean;

  // Visibility Options
  showHealthStatus?: boolean;
  showUptime?: boolean;
  showLastUpdated?: boolean;

  // Notifications
  enableNotifications?: boolean;

  // Metric Visibility
  visibleMetrics?: {
    cpu?: boolean;
    memory?: boolean;
    disk?: boolean;
    network?: boolean;
    application?: boolean;
    database?: boolean;
  };

  // Alert Thresholds
  thresholds?: {
    cpu?: { warning: number; critical: number };
    memory?: { warning: number; critical: number };
    disk?: { warning: number; critical: number };
    responseTime?: { warning: number; critical: number };
  };
}

interface AdvancedOptions extends SystemMetricsOptions {
  // Advanced Features
  showTrends?: boolean;
  showHistory?: boolean;
  showPredictions?: boolean;
  historyPeriod?: '1h' | '6h' | '24h' | '7d';
  chartType?: 'line' | 'area' | 'bar';
  enableExport?: boolean;
  enableAlerts?: boolean;
  fullscreenMode?: boolean;
  autoScale?: boolean;
}
```

## 🚀 Performance Optimization

### Lazy Loading
```tsx
import { lazy, Suspense } from 'react';

const SystemMetrics = lazy(() => import('./components/SystemMetrics'));

function App() {
  return (
    <Suspense fallback={<div>Loading metrics...</div>}>
      <SystemMetrics apiUrl="/api/v1" />
    </Suspense>
  );
}
```

### Memoization
```tsx
import { memo } from 'react';

const MemoizedSystemMetrics = memo(SystemMetrics);

function Dashboard() {
  return (
    <MemoizedSystemMetrics 
      apiUrl="/api/v1"
      options={stableOptions} // Use stable reference
    />
  );
}
```

### Optimized Refresh
```tsx
<SystemMetrics 
  options={{
    refreshInterval: 60000, // Longer intervals for better performance
    autoRefresh: true,
    visibleMetrics: {
      // Only show essential metrics
      cpu: true,
      memory: true,
      disk: false,
      network: false,
      application: true,
      database: false
    }
  }}
/>
```

## 🧪 Testing

### Mock API Service
```tsx
import { metricsApi } from './components/MetricsApiMock';

// Use mock service for development/testing
const isDevelopment = process.env.NODE_ENV === 'development';

function App() {
  return (
    <SystemMetrics 
      apiUrl={isDevelopment ? '/mock-api' : '/api/v1'}
    />
  );
}
```

### Unit Testing
```tsx
import { render, screen } from '@testing-library/react';
import SystemMetrics from './SystemMetrics';

test('renders system metrics', () => {
  render(<SystemMetrics apiUrl="/api/v1" />);
  expect(screen.getByText('System Metrics')).toBeInTheDocument();
});
```

## 🔍 Troubleshooting

### Common Issues

1. **No data displayed**
   - Check API endpoint availability
   - Verify CORS settings
   - Check browser console for errors

2. **Notifications not working**
   - Ensure HTTPS connection
   - Check browser notification permissions
   - Verify notification settings

3. **Performance issues**
   - Increase refresh interval
   - Reduce visible metrics
   - Use compact display mode

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('systemMetrics_debug', 'true');

// View debug information
console.log('SystemMetrics Debug Info:', {
  config: /* current config */,
  metrics: /* current metrics */,
  health: /* health status */
});
```

## 📚 Additional Resources

- [Component API Reference](./SystemMetrics_README.md)
- [Advanced Features Guide](./ADVANCED_FEATURES.md)
- [Customization Examples](./CUSTOMIZATION_EXAMPLES.md)
- [Performance Best Practices](./PERFORMANCE_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.