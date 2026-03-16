# 🚀 Quick Start Guide

## Step 1: Install Dependencies
```bash
cd backend
npm install
```

## Step 2: Set Up Database

### Option A: Using phpMyAdmin (Recommended)
1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin: http://localhost/phpmyadmin
3. Click "New" to create database
4. Name: `iansmith_portfolio`
5. Collation: `utf8mb4_unicode_ci`
6. Click "Create"
7. Select the database, go to "SQL" tab
8. Copy and paste contents of `database_structure.sql`
9. Click "Go"

### Option B: Using MySQL Command Line
```bash
mysql -u root -p
CREATE DATABASE iansmith_portfolio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iansmith_portfolio;
SOURCE database_structure.sql;
EXIT;
```

## Step 3: Test Database Connection
```bash
npm run test:db
```

You should see:
```
✅ Database exists
✅ Connection pool created successfully
✅ Health check passed
✅ Query successful. Found 9 tables
🎉 All database tests passed successfully!
```

## Step 4: Start the Server
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

## Step 5: Test Health Endpoint
Open: http://localhost:3001/api/health

Should return:
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

## Troubleshooting

### ❌ "ECONNREFUSED" Error
**Problem**: Can't connect to MySQL
**Solution**: 
1. Open XAMPP Control Panel
2. Start MySQL service
3. Check if port 3306 is available

### ❌ "ER_ACCESS_DENIED_ERROR" 
**Problem**: Wrong credentials
**Solution**: 
1. Check `.env` file credentials
2. In phpMyAdmin, go to User accounts
3. Verify root user settings

### ❌ "ER_BAD_DB_ERROR"
**Problem**: Database doesn't exist
**Solution**: Create database in phpMyAdmin first

### ❌ "No tables found"
**Problem**: Database structure not imported
**Solution**: Import `database_structure.sql` in phpMyAdmin

## Next Steps

Once everything is working:
1. ✅ Database connection established
2. ✅ Health check passing
3. ✅ Server running on port 3001

**Ready to implement Lead Management API!** 🎉