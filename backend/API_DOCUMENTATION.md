# 📚 Ian Smith Backend API Documentation

## Base URL
```
http://localhost:3001/api/v1
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true|false,
  "data": <response-data>,
  "message": "Response message",
  "error": "Error message (if success is false)"
}
```

---

## 🏥 Health Check

### GET /api/health
Check the health status of the API and database.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": {
      "status": "healthy",
      "message": "MySQL Database connection is healthy",
      "details": {
        "responseTime": "5ms",
        "connectionLimit": 20
      }
    }
  }
}
```

---

## 👥 Leads Management

### POST /api/v1/leads
Create a new lead from contact form submission.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I need help with my website",
  "type": "contact", // "contact" or "project"
  "projectType": "Web Development", // optional
  "budget": "$5000", // optional
  "source": "website", // optional
  "timestamp": 1640995200000 // optional, defaults to current time
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "message": "I need help with my website",
    "type": "contact",
    "status": "new",
    "priority": "medium",
    "source": "website",
    "timestamp": 1640995200000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Lead created successfully"
}
```

### GET /api/v1/leads
Get all leads with filtering and pagination.

**Query Parameters:**
- `type`: "contact" | "project"
- `status`: "new" | "contacted" | "qualified" | "converted" | "closed"
- `priority`: "low" | "medium" | "high"
- `source`: string
- `dateFrom`: YYYY-MM-DD
- `dateTo`: YYYY-MM-DD
- `search`: string (searches name, email, message)
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)

**Example:**
```
GET /api/v1/leads?type=project&status=new&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leads": [...],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "message": "Leads retrieved successfully"
}
```

### GET /api/v1/leads/:id
Get a specific lead by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "message": "I need help with my website",
    "type": "contact",
    "status": "new",
    "priority": "medium",
    "source": "website",
    "aiAnalysis": {
      "priority": "Medium",
      "summary": "Contact inquiry regarding web development with medium priority.",
      "category": "Web Development"
    },
    "timestamp": 1640995200000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Lead retrieved successfully"
}
```

### PUT /api/v1/leads/:id
Update a lead.

**Request Body:**
```json
{
  "status": "contacted",
  "priority": "high",
  "name": "Updated Name", // optional
  "email": "updated@example.com", // optional
  "message": "Updated message", // optional
  "projectType": "Mobile App", // optional
  "budget": "$10000" // optional
}
```

### DELETE /api/v1/leads/:id
Delete a lead.

**Response:**
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

### POST /api/v1/leads/:id/ai-analysis
Update AI analysis for a lead.

**Request Body:**
```json
{
  "priority": "High",
  "summary": "Urgent project inquiry with specific requirements",
  "category": "Web Development"
}
```

### GET /api/v1/leads/stats
Get lead statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": {
      "new": 45,
      "contacted": 30,
      "qualified": 25,
      "converted": 35,
      "closed": 15
    },
    "byPriority": {
      "low": 50,
      "medium": 70,
      "high": 30
    },
    "byType": {
      "contact": 90,
      "project": 60
    },
    "recentCount": 12
  },
  "message": "Lead statistics retrieved successfully"
}
```

### PATCH /api/v1/leads/bulk-update
Bulk update multiple leads.

**Request Body:**
```json
{
  "leadIds": ["uuid1", "uuid2", "uuid3"],
  "updates": {
    "status": "contacted",
    "priority": "high"
  }
}
```

---

## 📊 Analytics (Coming Soon)

### POST /api/v1/analytics/events
Track user interaction events.

### GET /api/v1/analytics
Get analytics data with filtering.

---

## 📝 Content Management (Coming Soon)

### GET /api/v1/content/articles
Get blog articles.

### POST /api/v1/content/articles
Create a new blog article.

---

## 🔐 Authentication (Coming Soon)

### POST /api/v1/auth/login
Admin login.

### POST /api/v1/auth/refresh
Refresh JWT token.

---

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Invalid or missing token |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource doesn't exist |
| 422  | Unprocessable Entity - Validation failed |
| 500  | Internal Server Error |
| 503  | Service Unavailable - Database connection failed |

## Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## 🧪 Testing the API

### Using curl

**Create a lead:**
```bash
curl -X POST http://localhost:3001/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "This is a test message",
    "type": "contact"
  }'
```

**Get all leads:**
```bash
curl http://localhost:3001/api/v1/leads
```

**Get lead statistics:**
```bash
curl http://localhost:3001/api/v1/leads/stats
```

### Using the test script
```bash
npm run test:leads
```

---

## 🔧 Development Notes

1. **AI Analysis**: Requires `GOOGLE_GEMINI_API_KEY` environment variable
2. **Database**: Uses MySQL with connection pooling
3. **Validation**: All inputs are validated using Zod schemas
4. **Logging**: Comprehensive logging with Winston
5. **Error Handling**: Centralized error handling with custom error types
6. **Security**: Rate limiting, CORS, and input sanitization

---

## 🚀 Next Steps

1. **Authentication System**: JWT-based admin authentication
2. **Analytics API**: User interaction tracking
3. **Content Management**: Blog and project management
4. **File Uploads**: Media file handling
5. **Real-time Features**: WebSocket integration
6. **Email Integration**: Automated notifications

---

## 📊 System Metrics Management

### GET /api/v1/metrics/current
Get current real-time system metrics.

**Authentication:** Admin required

**Response:**
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
        "usage_percent": 50
      },
      "disk": {
        "total_gb": 500,
        "used_gb": 250,
        "free_gb": 250,
        "usage_percent": 50
      },
      "network": {
        "connections_active": 25,
        "requests_per_minute": 120
      },
      "application": {
        "uptime_seconds": 86400,
        "response_time_avg_ms": 150,
        "error_rate_percent": 0.5
      },
      "database": {
        "connections_active": 5,
        "connections_max": 20,
        "query_time_avg_ms": 25,
        "queries_per_minute": 200
      }
    },
    "timestamp": "2024-01-01T00:00:00.000Z",
    "hostname": "server-01"
  },
  "message": "Current system metrics retrieved successfully"
}
```

### GET /api/v1/metrics/history
Get historical metrics data with optional filtering.

**Authentication:** Admin required

**Query Parameters:**
- `start` (optional): Start date (ISO string)
- `end` (optional): End date (ISO string)
- `hours` (optional): Hours back from now (alternative to start/end)
- `type` (optional): Metric type filter (`cpu`, `memory`, `disk`, `network`, `application`, `database`)

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "uuid-here",
        "metric_type": "cpu",
        "metric_name": "usage_percent",
        "value": 45.2,
        "unit": "%",
        "hostname": "server-01",
        "service_name": null,
        "metadata": null,
        "recorded_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "timeRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-02T00:00:00.000Z"
    },
    "metricType": "cpu",
    "recordCount": 1440
  },
  "message": "Metrics history retrieved successfully"
}
```

### GET /api/v1/metrics/dashboard
Get aggregated metrics for dashboard display.

**Authentication:** Admin required

**Query Parameters:**
- `hours` (optional): Hours back from now (default: 24)

**Response:**
```json
{
  "success": true,
  "data": {
    "current": {
      "cpu": { "usage_percent": 45.2, "load_average": [1.2, 1.1, 0.9] },
      "memory": { "total_mb": 8192, "used_mb": 4096, "free_mb": 4096, "usage_percent": 50 }
    },
    "averages": {
      "cpu": { "usage_percent": 42.1, "load_average": [0, 0, 0] },
      "memory": { "total_mb": 0, "used_mb": 0, "free_mb": 0, "usage_percent": 48.5 }
    },
    "peaks": {
      "cpu": { "usage_percent": 78.9, "load_average": [0, 0, 0] },
      "memory": { "total_mb": 0, "used_mb": 0, "free_mb": 0, "usage_percent": 85.2 }
    },
    "timeRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-02T00:00:00.000Z",
      "hours": 24
    },
    "timestamp": "2024-01-02T00:00:00.000Z"
  },
  "message": "Dashboard metrics retrieved successfully"
}
```

### GET /api/v1/metrics/health
Get system health summary with status indicators.

**Authentication:** Admin required

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": "healthy",
    "components": {
      "cpu": {
        "status": "healthy",
        "value": 45.2,
        "threshold": 70
      },
      "memory": {
        "status": "warning",
        "value": 82.1,
        "threshold": 80
      },
      "disk": {
        "status": "healthy",
        "value": 50.0,
        "threshold": 85
      },
      "application": {
        "status": "healthy",
        "value": 0.5,
        "threshold": 1
      },
      "database": {
        "status": "healthy",
        "value": 5,
        "threshold": 14
      }
    },
    "uptime": 86400,
    "timestamp": "2024-01-02T00:00:00.000Z"
  },
  "message": "System health: healthy"
}
```

### GET /api/v1/metrics/stats
Get metrics collection statistics.

**Authentication:** Admin required

**Query Parameters:**
- `hours` (optional): Hours back from now (default: 24)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRecords": 8640,
    "timeRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-02T00:00:00.000Z",
      "hours": 24
    },
    "metricTypes": {
      "cpu": 1440,
      "memory": 1440,
      "disk": 1440,
      "network": 1440,
      "application": 1440,
      "database": 1440
    },
    "oldestRecord": "2024-01-01T00:00:00.000Z",
    "newestRecord": "2024-01-02T00:00:00.000Z",
    "hostname": "server-01"
  },
  "message": "Metrics statistics retrieved successfully"
}
```

### POST /api/v1/metrics/collect
Force immediate metrics collection.

**Authentication:** Super Admin required

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-02T00:00:00.000Z",
    "message": "Metrics collection completed"
  },
  "message": "Metrics collected and stored successfully"
}
```

### DELETE /api/v1/metrics/cleanup
Clean up old metrics (keeps last 30 days).

**Authentication:** Super Admin required

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-02T00:00:00.000Z",
    "message": "Old metrics cleaned up (kept last 30 days)"
  },
  "message": "Metrics cleanup completed successfully"
}
```

**Rate Limiting:**
- Metrics endpoints: 30 requests per minute
- Action endpoints (collect/cleanup): 5 requests per 5 minutes

**Health Status Thresholds:**
- CPU: Warning >70%, Critical >90%
- Memory: Warning >80%, Critical >90%
- Disk: Warning >85%, Critical >95%
- Application Error Rate: Warning >1%, Critical >5%
- Database Connections: Warning >70% of max, Critical >90% of max