/**
 * Test Real Email Data - Create actual lead and verify email
 * This script creates a real lead and sends email to verify real data is used
 */

import { connectDatabase } from '../database/connection';
import { logger } from '../utils/logger';
import { LeadService } from '../services/leadService';
import { emailService } from '../services/emailService';

async function testRealEmailData() {
  try {
    // Initialize database connection
    await connectDatabase();
    
    // Initialize email service
    emailService.initialize();
    
    if (!emailService.isAvailable()) {
      logger.error('❌ Email service not available. Check SMTP configuration.');
      return;
    }
    
    // Initialize services
    const leadService = new LeadService();
    
    logger.info('🧪 Creating real lead with actual user data...');

    // Create a real lead with detailed information
    const realLead = await leadService.createLead({
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techstartup.com',
      message: 'Hi Ian! I found your portfolio through a colleague\'s recommendation. We\'re a growing fintech startup looking to rebuild our legacy system with modern Laravel architecture. Our current system handles about 10,000 transactions daily, but we\'re experiencing performance bottlenecks and security concerns. We need someone with your expertise in full-stack development to help us scale. The project involves API development, database optimization, and implementing real-time features. We\'re particularly interested in your experience with the TALL stack. Could we schedule a call to discuss our requirements in detail?',
      type: 'project',
      projectType: 'Fintech Platform Rebuild',
      budget: '$25,000 - $50,000',
      source: 'colleague_referral'
    });

    logger.info('✅ Real lead created successfully:', {
      id: realLead.id,
      name: realLead.name,
      email: realLead.email,
      type: realLead.type,
      projectType: realLead.projectType,
      budget: realLead.budget,
      messageLength: realLead.message.length
    });

    logger.info('📧 Email notification should have been sent to leemeeya851@gmail.com');
    logger.info('🔍 Please check your Gmail inbox for the notification email');
    logger.info('✅ The email should contain:');
    logger.info('   - Name: Sarah Johnson');
    logger.info('   - Email: sarah.johnson@techstartup.com');
    logger.info('   - Project Type: Fintech Platform Rebuild');
    logger.info('   - Budget: $25,000 - $50,000');
    logger.info('   - Full message about fintech startup and TALL stack');
    logger.info('   - Reply-to should be set to sarah.johnson@techstartup.com');

    // Verify the lead was stored correctly
    const retrievedLead = await leadService.getLeadById(realLead.id);
    if (retrievedLead) {
      logger.info('✅ Lead data verified in database:', {
        storedName: retrievedLead.name,
        storedEmail: retrievedLead.email,
        storedProjectType: retrievedLead.projectType,
        storedBudget: retrievedLead.budget,
        messagePreview: retrievedLead.message.substring(0, 100) + '...'
      });
    }

    logger.info('🎉 Real email data test completed!');
    logger.info('💡 The email you receive should contain ALL the real user data shown above');

  } catch (error) {
    logger.error('❌ Real email data test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testRealEmailData()
    .then(() => {
      logger.info('✅ Real email data test completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Real email data test failed:', error);
      process.exit(1);
    });
}

export { testRealEmailData };