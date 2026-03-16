#!/usr/bin/env tsx

/**
 * Server Startup Test Script
 * 
 * This script starts the server and tests basic functionality
 * Run with: npx tsx src/scripts/startServer.ts
 */

import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testServerStartup() {
  logger.info('🚀 Testing server startup...');
  
  try {
    // Import and start the server
    const app = await import('../server');
    
    logger.info('✅ Server imported successfully');
    logger.info('🎉 Server should be running on port 3001');
    logger.info('📋 Available endpoints:');
    logger.info('   - GET  /api/health - Health check');
    logger.info('   - POST /api/v1/leads - Create lead');
    logger.info('   - GET  /api/v1/leads - List leads');
    logger.info('   - GET  /api/v1/leads/:id - Get lead by ID');
    logger.info('   - PUT  /api/v1/leads/:id - Update lead');
    logger.info('   - DELETE /api/v1/leads/:id - Delete lead');
    logger.info('   - GET  /api/v1/leads/stats - Lead statistics');
    logger.info('');
    logger.info('💡 Test the API with:');
    logger.info('   curl http://localhost:3001/api/health');
    logger.info('');
    logger.info('🛑 Press Ctrl+C to stop the server');
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the test
testServerStartup();