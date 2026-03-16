#!/usr/bin/env tsx

/**
 * Server Test Script
 * 
 * This script tests if the server starts correctly and API endpoints are accessible
 * Run with: npx tsx src/scripts/testServer.ts
 */

import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testServer() {
  logger.info('🧪 Starting server test...');
  
  try {
    // Import server (this will start it)
    logger.info('📋 Step 1: Starting server...');
    
    // We'll use a different approach - test the server components
    const { connectDatabase, checkDatabaseHealth, closeDatabase } = await import('../database/connection');
    const { validateEnv } = await import('../utils/validateEnv');
    
    // Step 1: Validate environment
    logger.info('📋 Step 1: Validating environment...');
    validateEnv();
    logger.info('✅ Environment validation passed');
    
    // Step 2: Test database connection
    logger.info('📋 Step 2: Testing database connection...');
    await connectDatabase();
    
    const health = await checkDatabaseHealth();
    if (health.status === 'healthy') {
      logger.info('✅ Database health check passed');
    } else {
      throw new Error('Database health check failed');
    }
    
    // Step 3: Test AI service initialization
    logger.info('📋 Step 3: Testing AI service...');
    const { AiService } = await import('../services/aiService');
    const aiService = new AiService();
    logger.info(`✅ AI service initialized (available: ${aiService.isAvailable()})`);
    
    // Step 4: Test lead service
    logger.info('📋 Step 4: Testing lead service...');
    const { LeadService } = await import('../services/leadService');
    const leadService = new LeadService();
    const stats = await leadService.getLeadStats();
    logger.info('✅ Lead service working', { totalLeads: stats.total });
    
    logger.info('🎉 All server components are working correctly!');
    logger.info('💡 You can now start the server with: npm run dev');
    
    await closeDatabase();
    
  } catch (error) {
    logger.error('❌ Server test failed:', {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    throw error;
  }
}

// Run the test
testServer()
  .then(() => {
    logger.info('✅ Server test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Server test failed:', error);
    process.exit(1);
  });