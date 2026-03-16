# Ian Smith Portfolio - Backend API

A robust TypeScript/Express.js backend API for Ian Smith's elite portfolio platform with MySQL database integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- XAMPP with MySQL running
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database setup:**
```bash
# Create database in phpMyAdmin or MySQL command line:
# CREATE DATABASE iansmith_portfolio;

# Import the database structure:
# Import backend/database_structure.sql in phpMyAdmin
```

4. **Test the setup:**
```bash
# Test database connection
npm run test:db

# Test Lead API functionality  
npm run test:leads

# Test server components
npm run test:server
```

5. **Start development server:**
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 📋 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Leads Management
- `POST /api/v1/leads` - Create new lead
- `GET /api/v1/leads` - Get leads (with filtering & pagination)
- `GET /api/v1/leads/:id` - Get lead by ID
- `PUT /api/v1/leads/:id` - Update lead
- `DELETE /api/v1/leads/:id` - Delete lead
- `GET /api/v1/leads/stats` - Get lead statistics
- `POST /api/v1/leads/:id/ai-analysis` - Update AI analysis
- `PATCH /api/v1/leads/bulk-update` - Bulk update leads

### Example Lead Creation:
```bash
curl -X POST http://localhost:3001/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com", 
    "message": "I need a website built",
    "type": "project"
  }'
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Application
NODE_ENV=development
PORT=3001

# Database (XAMPP MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=iansmith_portfolio
DB_USER=root
DB_PASSWORD=

# JWT Secrets (generate secure ones for production!)
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Google Gemini API (optional - for AI features)
GOOGLE_GEMINI_API_KEY=your-api-key-here
```

## 🧪 Testing

```bash
# Test database connection
npm run test:db

# Test Lead API functionality
npm run test:leads  

# Test server components
npm run test:server

# Run all tests
npm test
```

## 🗄️ Database Schema

The database includes 9 tables:
- `users` - Admin authentication
- `leads` - Contact form submissions & project inquiries  
- `analytics_events` - User interaction tracking
- `blog_articles` - Content management
- `projects` - Portfolio projects
- `sessions` - User sessions
- `settings` - Application configuration
- `media_files` - File upload management
- `api_logs` - API request logging

## 🤖 AI Integration

The backend integrates with Google Gemini AI for intelligent lead analysis:
- Automatic priority assessment (High/Medium/Low)
- Lead categorization (Web Development, Mobile App, etc.)
- Executive summary generation
- Fallback analysis when AI is unavailable

## 🔒 Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Input validation with Zod
- SQL injection prevention
- Error handling with stack trace hiding in production

## 📊 Logging & Monitoring

- Winston logger with structured logging
- Request/response logging
- Database query logging
- Health check endpoints
- Error tracking with context

## 🚀 Production Deployment

1. **Build the application:**
```bash
npm run build
```

2. **Set production environment variables**

3. **Start production server:**
```bash
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── database/        # Database connection & queries
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── validation/      # Input validation schemas
│   └── server.ts        # Main application entry point
├── database_structure.sql  # Database schema
└── package.json
```

## 🔗 Frontend Integration

This backend is designed to work with the React/TypeScript frontend. The Lead API replaces the current localStorage-based lead management with a robust database solution.

## 📝 Development Notes

- Uses TypeScript for type safety
- MySQL2 for database connectivity  
- Zod for runtime validation
- Winston for structured logging
- Express.js with security middleware
- UUID for unique identifiers
- Comprehensive error handling

## 🆘 Troubleshooting

**Database Connection Issues:**
- Ensure XAMPP MySQL service is running
- Check database credentials in .env
- Verify database exists and structure is imported

**Port Already in Use:**
- Change PORT in .env file
- Kill existing processes on port 3001

**AI Analysis Not Working:**
- Add GOOGLE_GEMINI_API_KEY to .env
- System falls back to keyword-based analysis without API key