#!/usr/bin/env tsx

/**
 * Google Gemini AI Integration Test Script
 * 
 * This script tests the Google Gemini AI service integration
 * Run with: npx tsx src/scripts/testAI.ts
 */

import dotenv from 'dotenv';
import { AiService } from '../services/aiService';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testAIIntegration() {
  logger.info('🤖 Starting Google Gemini AI integration test...');
  
  try {
    // Initialize AI service
    const aiService = new AiService();
    
    // Check if AI is available
    if (!aiService.isAvailable()) {
      logger.warn('⚠️  Google Gemini API key not configured. Please add GOOGLE_GEMINI_API_KEY to your .env file');
      logger.info('📋 Setup instructions:');
      logger.info('   1. Visit https://aistudio.google.com/');
      logger.info('   2. Get your API key');
      logger.info('   3. Add GOOGLE_GEMINI_API_KEY=your_key_here to backend/.env');
      logger.info('   4. Restart the server');
      return;
    }

    logger.info('✅ Google Gemini AI service is available');

    // Test cases
    const testCases = [
      {
        name: 'High Priority Project Lead',
        data: {
          name: 'John Smith',
          email: 'john@techcorp.com',
          message: 'We need a complete SaaS platform built with Laravel and React. Budget is $50,000 and we need it completed within 3 months. This is urgent for our Q1 launch.',
          type: 'project' as const
        }
      },
      {
        name: 'Medium Priority Contact',
        data: {
          name: 'Sarah Johnson',
          email: 'sarah@startup.io',
          message: 'Hi Ian, I came across your portfolio and I\'m interested in discussing a potential web development project. Could we schedule a call?',
          type: 'contact' as const
        }
      },
      {
        name: 'Low Priority General Inquiry',
        data: {
          name: 'Mike Wilson',
          email: 'mike@example.com',
          message: 'Just wondering about your rates for small website projects. Nothing urgent, just exploring options.',
          type: 'contact' as const
        }
      }
    ];

    // Run tests
    for (const testCase of testCases) {
      logger.info(`📋 Testing: ${testCase.name}`);
      
      try {
        const analysis = await aiService.analyzeLead(
          testCase.data.name,
          testCase.data.email,
          testCase.data.message,
          testCase.data.type
        );

        logger.info('✅ AI Analysis Result:', {
          priority: analysis.priority,
          category: analysis.category,
          summary: analysis.summary
        });

        // Validate analysis structure
        if (!analysis.priority || !analysis.category || !analysis.summary) {
          logger.error('❌ Invalid analysis structure');
        } else if (!['High', 'Medium', 'Low'].includes(analysis.priority)) {
          logger.error('❌ Invalid priority value:', analysis.priority);
        } else {
          logger.info('✅ Analysis structure is valid');
        }

      } catch (error) {
        logger.error('❌ AI analysis failed for test case:', {
          testCase: testCase.name,
          error: error instanceof Error ? error.message : error
        });
      }

      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info('🎉 AI integration test completed successfully!');
    
  } catch (error) {
    logger.error('❌ AI integration test failed:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

// Run the test
testAIIntegration()
  .then(() => {
    logger.info('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  });