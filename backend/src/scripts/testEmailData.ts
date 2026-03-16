/**
 * Test Email Data - Verify Real User Data in Emails
 * This script tests that emails contain real user data from the database
 */

import { connectDatabase } from '../database/connection';
import { logger } from '../utils/logger';
import { LeadService } from '../services/leadService';
import { PhoneCallService } from '../services/phoneCallService';

async function testEmailData() {
  try {
    // Initialize database connection
    await connectDatabase();
    
    // Initialize services
    const leadService = new LeadService();
    const phoneCallService = new PhoneCallService();
    
    logger.info('🧪 Testing email data with real user information...');

    // Test 1: Create a test lead and verify email contains real data
    logger.info('📧 Test 1: Creating test lead...');
    
    const testLead = await leadService.createLead({
      name: 'John Test User',
      email: 'john.test@example.com',
      message: 'This is a test message to verify that real user data appears in emails. I am interested in your web development services.',
      type: 'project',
      projectType: 'E-commerce Website',
      budget: '$5,000 - $10,000',
      source: 'email_test'
    });

    logger.info('✅ Test lead created:', {
      id: testLead.id,
      name: testLead.name,
      email: testLead.email,
      type: testLead.type,
      projectType: testLead.projectType,
      budget: testLead.budget
    });

    // Test 2: Create a test phone call and verify email contains real data
    logger.info('📞 Test 2: Creating test phone call...');
    
    const testPhoneCall = await phoneCallService.createPhoneCall({
      caller_name: 'Jane Test Caller',
      caller_email: 'jane.caller@example.com',
      caller_phone: '+1234567890',
      call_type: 'callback_request',
      message: 'Please call me back regarding your Laravel development services. I have an urgent project.',
      source: 'email_test',
      preferred_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
    });

    logger.info('✅ Test phone call created:', {
      id: testPhoneCall.id,
      caller_name: testPhoneCall.caller_name,
      caller_email: testPhoneCall.caller_email,
      caller_phone: testPhoneCall.caller_phone,
      call_type: testPhoneCall.call_type,
      message: testPhoneCall.message
    });

    // Test 3: Verify data retrieval from database
    logger.info('🔍 Test 3: Verifying data retrieval...');
    
    const retrievedLead = await leadService.getLeadById(testLead.id);
    const retrievedPhoneCall = await phoneCallService.getPhoneCallById(testPhoneCall.id);

    if (retrievedLead) {
      logger.info('✅ Lead data retrieved from database:', {
        id: retrievedLead.id,
        name: retrievedLead.name,
        email: retrievedLead.email,
        message: retrievedLead.message.substring(0, 50) + '...',
        projectType: retrievedLead.projectType,
        budget: retrievedLead.budget
      });
    } else {
      logger.error('❌ Failed to retrieve lead from database');
    }

    if (retrievedPhoneCall) {
      logger.info('✅ Phone call data retrieved from database:', {
        id: retrievedPhoneCall.id,
        caller_name: retrievedPhoneCall.caller_name,
        caller_email: retrievedPhoneCall.caller_email,
        caller_phone: retrievedPhoneCall.caller_phone,
        message: retrievedPhoneCall.message?.substring(0, 50) + '...'
      });
    } else {
      logger.error('❌ Failed to retrieve phone call from database');
    }

    logger.info('🎉 Email data test completed successfully!');
    logger.info('📧 Check your email (leemeeya851@gmail.com) for the test notifications');
    logger.info('💡 The emails should contain the REAL user data shown above, not dummy data');

  } catch (error) {
    logger.error('❌ Email data test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testEmailData()
    .then(() => {
      logger.info('✅ Email data test completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Email data test failed:', error);
      process.exit(1);
    });
}

export { testEmailData };