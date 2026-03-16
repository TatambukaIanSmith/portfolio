#!/usr/bin/env tsx

/**
 * Database Connection Test Script
 * 
 * This script tests the MySQL database connection independently
 * Run with: npx tsx src/scripts/testConnection.ts
 */

import dotenv from 'dotenv';
import { connectDatabase, checkDatabaseHealth, checkDatabaseExists, closeDatabase } from '../database/connection';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
  logger.info('🧪 Starting database connection test...');
  
  try {
    // Step 1: Check if database exists
    logger.info('📋 Step 1: Checking if database exists...');
    const dbExists = await checkDatabaseExists();
    
    if (!dbExists) {
      logger.warn('⚠️  Database does not exist. Please create it first:');
      logger.warn(`   1. Open phpMyAdmin (http://localhost/phpmyadmin)`);
      logger.warn(`   2. Create database: ${process.env.DB_NAME || 'iansmith_portfolio'}`);
      logger.warn(`   3. Import the database_structure.sql file`);
      return;
    }
    
    logger.info('✅ Database exists');

    // Step 2: Test connection
    logger.info('📋 Step 2: Testing database connection...');
    const pool = await connectDatabase();
    logger.info('✅ Connection pool created successfully');

    // Step 3: Health check
    logger.info('📋 Step 3: Running health check...');
    const health = await checkDatabaseHealth();
    
    if (health.status === 'healthy') {
      logger.info('✅ Health check passed');
      logger.info('📊 Health details:', health.details);
    } else {
      logger.error('❌ Health check failed:', health);
      return;
    }

    // Step 4: Test basic query
    logger.info('📋 Step 4: Testing basic query...');
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute('SHOW TABLES');
      logger.info(`✅ Query successful. Found ${Array.isArray(rows) ? rows.length : 0} tables`);
      
      if (Array.isArray(rows) && rows.length > 0) {
        logger.info('📋 Available tables:');
        rows.forEach((row: any) => {
          const tableName = Object.values(row)[0];
          logger.info(`   - ${tableName}`);
        });
      } else {
        logger.warn('⚠️  No tables found. Please import database_structure.sql');
      }
    } finally {
      connection.release();
    }

    logger.info('🎉 All database tests passed successfully!');
    
  } catch (error) {
    logger.error('❌ Database test failed:', {
      message: error instanceof Error ? error.message : error,
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      sqlState: (error as any)?.sqlState,
    });
    
    // Provide helpful error messages
    if ((error as any)?.code === 'ECONNREFUSED') {
      logger.error('💡 Solution: Make sure XAMPP MySQL service is running');
    } else if ((error as any)?.code === 'ER_ACCESS_DENIED_ERROR') {
      logger.error('💡 Solution: Check your database credentials in .env file');
    } else if ((error as any)?.code === 'ER_BAD_DB_ERROR') {
      logger.error('💡 Solution: Create the database in phpMyAdmin first');
    }
  } finally {
    // Clean up
    await closeDatabase();
    logger.info('🔄 Database connection closed');
  }
}

// Run the test
testDatabaseConnection()
  .then(() => {
    logger.info('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  });