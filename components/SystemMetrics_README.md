# SystemMetrics Component

A fully interactive and configurable system monitoring dashboard component with real-time controls and multiple display modes.

## 🚀 Features

### Interactive Configuration Panel
- **Real-time Controls**: Configure the component without code changes
- **Live Preview**: See changes instantly as you adjust settings
- **Quick Presets**: One-click configurations for common use cases
- **Persistent Settings**: Configuration changes apply immediately

### Display Options
- **Grid Layout**: Traditional card-based layout (default)
- **List Layout**: Horizontal list format for compact displays
- **Compact Layout**: Minimal space usage with essential metrics
- **Responsive Design**: Automatically adapts to screen size

### Theme Support
- **Default Theme**: Clean, professional appearance
- **Dark Theme**: Perfect for monitoring dashboards
- **Minimal Theme**: Clean, distraction-free interface

### Smart Features
- **Auto-refresh**: Configurable refresh intervals (5s to 5min)
- **Browser Notifications**: Alerts for critical system issues
- **Health Status**: Visual indicators for system health
- **Metric Visibility**: Show/hide individual metrics
- **Custom Thresholds**: Set warning and critical levels

## 📋 Usage

### Basic Implementation
```tsx
import SystemMetrics from './components/SystemMetrics';

function Dashboard() {
  return (
    <SystemMetrics apiUrl="/api/v1" />
  );
}
```

### With Configuration Options
```tsx
<SystemMetrics 
  apiUrl="/api/v1"
  options={{
    refreshInterval: 15000,
    displayMode: 'compact',
    colorScheme: 'dark',
    enableNotifications: true,
    visibleMetrics: {
      cpu: true,
      memory: true,
      disk: false,
      network: false,
      application: true,
      database: true
    }
  }}
/>
```

### Monitoring Dashboard Setup
```tsx
<SystemMetrics 
  apiUrl="/api/v1"
  options={{
    refreshInterval: 5000,
    enableNotifications: true,
    colorScheme: 'dark',
    thresholds: {
      cpu: { warning: 60, critical: 80 },
      memory: { warning: 75, critical: 90 },
      disk: { warning: 80, critical: 95 }
    }
  }}
/>
```

## ⚙️ Configuration Options

### SystemMetricsOptions Interface

```typescript
interface SystemMetricsOptions {
  // Refresh Settings
  refreshInterval?: number;        // Milliseconds (5000-300000)
  autoRefresh?: boolean;          // Enable/disable auto-refresh

  // Display Settings
  displayMode?: 'grid' | 'list' | 'compact';
  colorScheme?: 'default' | 'dark' | 'minimal';
  compactMode?: boolean;          // Additional space saving

  // Visibility Options
  showHealthStatus?: boolean;     // Show overall health indicator
  showUptime?: boolean;          // Display system uptime
  showLastUpdated?: boolean;     // Show last refresh time

  // Notifications
  enableNotifications?: boolean;  // Browser notifications for alerts

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
```

## 🎛️ Interactive Controls

### Configuration Panel
Click the "Options" button in the component header to access:

1. **Display Settings**
   - Layout mode selection
   - Color scheme picker
   - Compact mode toggle

2. **Refresh Settings**
   - Auto-refresh toggle
   - Refresh interval selector
   - Notification preferences

3. **Metric Visibility**
   - Individual metric toggles
   - Show/hide specific components

4. **Display Options**
   - Health status visibility
   - Uptime display
   - Last updated timestamp

5. **Alert Thresholds**
   - Custom warning levels
   - Critical alert thresholds
   - Per-metric configuration

6. **Quick Presets**
   - Default Setup
   - Compact Dashboard
   - Monitoring Mode

## 📱 Responsive Behavior

### Desktop (1024px+)
- Full grid layout with all metrics visible
- Complete configuration panel
- Detailed metric information

### Tablet (768px - 1023px)
- Adaptive grid layout (2 columns)
- Condensed configuration options
- Essential metrics prioritized

### Mobile (< 768px)
- Single column layout
- Compact mode automatically enabled
- Touch-friendly controls

## 🔔 Notification System

### Browser Notifications
- Automatic permission request
- Critical alert notifications
- Customizable notification content
- Respects user preferences

### Visual Indicators
- Color-coded health status
- Status icons for each metric
- Real-time status updates

## 🎨 Theming

### Default Theme
- Clean white background
- Blue accent colors
- Professional appearance

### Dark Theme
- Dark gray backgrounds
- High contrast text
- Reduced eye strain

### Minimal Theme
- Minimal visual elements
- Focus on data
- Clean typography

## 📊 Metrics Displayed

### CPU Metrics
- Usage percentage
- Load average
- Health status indicator

### Memory Metrics
- Usage percentage
- Used/Total memory
- Health status indicator

### Disk Metrics
- Usage percentage
- Used/Free space
- Health status indicator

### Network Metrics
- Active connections
- Requests per minute
- Connection status

### Application Metrics
- Response time
- Error rate
- Health status indicator

### Database Metrics
- Active connections
- Query performance
- Health status indicator

## 🔧 API Requirements

The component expects the following API endpoints:

### GET /api/v1/metrics/current
Returns current system metrics:
```json
{
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
      }
      // ... other metrics
    }
  }
}
```

### GET /api/v1/metrics/health
Returns system health status:
```json
{
  "data": {
    "overall": "healthy",
    "components": {
      "cpu": { "status": "healthy", "value": 45.2, "threshold": 80 },
      "memory": { "status": "warning", "value": 85.1, "threshold": 80 }
    },
    "uptime": 86400,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## 🚀 Getting Started

1. **Import the component**:
   ```tsx
   import SystemMetrics from './components/SystemMetrics';
   ```

2. **Add to your dashboard**:
   ```tsx
   <SystemMetrics apiUrl="/api/v1" />
   ```

3. **Configure via UI**:
   - Click "Options" button
   - Adjust settings in real-time
   - Use quick presets for common setups

4. **Customize programmatically** (optional):
   ```tsx
   <SystemMetrics 
     apiUrl="/api/v1"
     options={{ colorScheme: 'dark', refreshInterval: 10000 }}
   />
   ```

## 🎯 Use Cases

### Development Dashboard
- Real-time system monitoring during development
- Quick health checks
- Performance optimization

### Production Monitoring
- 24/7 system surveillance
- Critical alert notifications
- Performance trend analysis

### Client Presentations
- Clean, professional interface
- Customizable appearance
- Real-time data display

### Mobile Monitoring
- Responsive design
- Touch-friendly controls
- Essential metrics focus

## 🔍 Troubleshooting

### Common Issues

1. **No data displayed**
   - Check API endpoint availability
   - Verify CORS settings
   - Check browser console for errors

2. **Notifications not working**
   - Ensure HTTPS connection
   - Check browser notification permissions
   - Verify notification settings in component

3. **Performance issues**
   - Increase refresh interval
   - Reduce visible metrics
   - Use compact display mode

### Debug Mode
Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('systemMetrics_debug', 'true');
```

## 📝 License

This component is part of the Ian Smith Portfolio project and follows the same licensing terms.