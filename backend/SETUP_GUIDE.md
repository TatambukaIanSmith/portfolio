# 🚀 Backend Setup Guide - XAMPP MySQL

## Prerequisites

1. **XAMPP** installed and running
2. **Node.js** (v18 or higher)
3. **npm** or **yarn**

## Step 1: Database Setup

### 1.1 Start XAMPP Services
- Open XAMPP Control Panel
- Start **Apache** and **MySQL** services

### 1.2 Create Database
1. Open **phpMyAdmin** (http://localhost/phpmyadmin)
2. Click "New" to create a new database
3. Name it: `iansmith_portfolio`
4. Set Collation to: `utf8mb4_unicode_ci`
5. Click "Create"

### 1.3 Import Database Structure
1. Select your `iansmith_portfolio` database
2. Click the "SQL" tab
3. Copy and paste the contents of `database_structure.sql`
4. Click "Go" to execute

**OR** you can run this command in MySQL command line:
```sql
CREATE DATABASE iansmith_portfolio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iansmith_portfolio;
-- Then paste the contents of database_structure.sql
```

## Step 2: Backend Configuration

### 2.1 Install Dependencies
```bash
cd backend
npm install
```

### 2.2 Environment Setup
1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` file with your settings:
```env
# Database Configuration (XAMPP MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=iansmith_portfolio
DB_USER=root
DB_PASSWORD=

# JWT Configuration (GENERATE SECURE SECRETS!)
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-at-least-32-characters-long

# Google Gemini API (Optional)
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key
```

### 2.3 Generate JWT Secrets
You can generate secure JWT secrets using Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Step 3: Test the Setup

### 3.1 Start the Backend Server
```bash
npm run dev
```

You should see:
```
🚀 Server running on port 3001
📊 Environment: development
✅ MySQL Database connected successfully
📊 Database: iansmith_portfolio on localhost:3306
```

### 3.2 Test Database Connection
Visit: http://localhost:3001/api/health

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": {
      "status": "healthy",
      "message": "MySQL Database connection is healthy"
    }
  }
}
```

## Step 4: Verify Database Tables

In phpMyAdmin, check that these tables were created:
- ✅ `users`
- ✅ `leads`
- ✅ `analytics_events`
- ✅ `blog_articles`
- ✅ `projects`
- ✅ `sessions`
- ✅ `settings`
- ✅ `media_files`
- ✅ `api_logs`

## Step 5: Default Admin User

A default admin user is created with:
- **Email**: `admin@iansmith.dev`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change this password immediately in production!

## Common Issues & Solutions

### Issue: "Access denied for user 'root'@'localhost'"
**Solution**: 
1. In phpMyAdmin, go to User accounts
2. Edit the 'root' user
3. Set a password or ensure it matches your `.env` file

### Issue: "Database connection failed"
**Solution**:
1. Ensure XAMPP MySQL is running
2. Check database name exists in phpMyAdmin
3. Verify credentials in `.env` file

### Issue: "Port 3001 already in use"
**Solution**: Change the PORT in `.env` file to another port (e.g., 3002)

## Next Steps

Once the backend is running successfully:

1. **Test API Endpoints**: Use Postman or similar to test endpoints
2. **Connect Frontend**: Update your React app to use the backend API
3. **Migrate Data**: Run the data migration to move localStorage data to MySQL
4. **Deploy**: Follow deployment guide for production setup

## Database Schema Overview

### Core Tables:
- **leads**: Contact form submissions and project inquiries
- **analytics_events**: User interaction tracking
- **blog_articles**: Content management for blog posts
- **users**: Admin authentication
- **projects**: Portfolio project data

### Support Tables:
- **sessions**: User session management
- **settings**: Application configuration
- **media_files**: File upload tracking
- **api_logs**: API request logging

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linting
npm run lint

# Database migration (future feature)
npm run migrate
```

## Security Notes

1. **Change default passwords** before production
2. **Use strong JWT secrets** (64+ characters)
3. **Enable HTTPS** in production
4. **Regular database backups**
5. **Monitor API logs** for suspicious activity

---

🎉 **Your backend is now ready!** The next step is to connect your React frontend to use these APIs instead of localStorage.