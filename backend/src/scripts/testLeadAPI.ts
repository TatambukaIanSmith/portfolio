#!/usr/bin/env tsx

/**
 * Lead API Test Script
 * 
 * This script tests the Lead API endpoints
 * Run with: npx tsx src/scripts/testLeadAPI.ts
 */

import dotenv from 'dotenv';
import { connectDatabase, closeDatabase } from '../database/connection';
import { LeadService } from '../services/leadService';
import { AiService } from '../services/aiService';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testLeadAPI() {
  logger.info('🧪 Starting Lead API test...');
  
  try {
    // Step 1: Connect to database
    logger.info('📋 Step 1: Connecting to database...');
    await connectDatabase();
    logger.info('✅ Database connected');

    // Step 2: Initialize services
    logger.info('📋 Step 2: Initializing services...');
    const leadService = new LeadService();
    const aiService = new AiService();
    
    logger.info(`✅ Services initialized (AI available: ${aiService.isAvailable()})`);

    // Step 3: Test lead creation
    logger.info('📋 Step 3: Testing lead creation...');
    const testLead = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      message: 'I need help building a modern web application with React and Node.js. Budget is around $5000.',
      type: 'project' as const,
      projectType: 'Web Application',
      budget: '$5000',
      source: 'test'
    };

    const createdLead = await leadService.createLead(testLead);
    logger.info('✅ Lead created successfully', { leadId: createdLead.id });

    // Step 4: Test AI analysis (if available)
    if (aiService.isAvailable()) {
      logger.info('📋 Step 4: Testing AI analysis...');
      const aiAnalysis = await aiService.analyzeLead(
        testLead.name,
        testLead.email,
        testLead.message,
        testLead.type
      );
      
      await leadService.updateAiAnalysis(createdLead.id, aiAnalysis);
      logger.info('✅ AI analysis completed', aiAnalysis);
    } else {
      logger.info('⚠️  Step 4: Skipping AI analysis (API key not provided)');
    }

    // Step 5: Test lead retrieval
    logger.info('📋 Step 5: Testing lead retrieval...');
    const retrievedLead = await leadService.getLeadById(createdLead.id);
    
    if (retrievedLead) {
      logger.info('✅ Lead retrieved successfully');
    } else {
      throw new Error('Failed to retrieve lead');
    }

    // Step 6: Test lead update
    logger.info('📋 Step 6: Testing lead update...');
    const updatedLead = await leadService.updateLead(createdLead.id, {
      status: 'contacted',
      priority: 'high'
    });
    
    logger.info('✅ Lead updated successfully', {
      status: updatedLead.status,
      priority: updatedLead.priority
    });

    // Step 7: Test lead listing with filters
    logger.info('📋 Step 7: Testing lead listing...');
    const leadsList = await leadService.getLeads({
      type: 'project',
      status: 'contacted'
    }, 1, 10);
    
    logger.info('✅ Leads listed successfully', {
      total: leadsList.total,
      count: leadsList.leads.length
    });

    // Step 8: Test lead statistics
    logger.info('📋 Step 8: Testing lead statistics...');
    const stats = await leadService.getLeadStats();
    logger.info('✅ Lead statistics retrieved', stats);

    // Step 9: Clean up test data
    logger.info('📋 Step 9: Cleaning up test data...');
    await leadService.deleteLead(createdLead.id);
    logger.info('✅ Test lead deleted');

    logger.info('🎉 All Lead API tests passed successfully!');
    
  } catch (error) {
    logger.error('❌ Lead API test failed:', {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    throw error;
  } finally {
    // Clean up
    await closeDatabase();
    logger.info('🔄 Database connection closed');
  }
}

// Run the test
testLeadAPI()
  .then(() => {
    logger.info('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  });