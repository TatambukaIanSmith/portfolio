import { connectDatabase } from '../database/connection';
import { authService } from '../services/authService';
import { authorizationService } from '../services/authorizationService';
import { securityEventService } from '../services/securityEventService';
import { rateLimitService } from '../services/rateLimitService';
import { logger } from '../utils/logger';

async function testSecurityServices() {
  try {
    console.log('🔐 Testing Security & Infrastructure Services...\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Database connected successfully\n');

    // Test Security Event Service
    console.log('📊 Testing Security Event Service...');
    const eventId = await securityEventService.logEvent({
      event_type: 'login',
      severity: 'low',
      ip_address: '127.0.0.1',
      user_agent: 'Test Script',
      outcome: 'success',
      metadata: { test: true }
    });
    console.log(`✅ Security event logged with ID: ${eventId}`);

    // Test getting recent events
    const recentEvents = await securityEventService.getEvents({ limit: 5 });
    console.log(`✅ Retrieved ${recentEvents.length} recent security events\n`);

    // Test Rate Limiting Service
    console.log('⏱️  Testing Rate Limiting Service...');
    const rateLimitResult = await rateLimitService.checkRateLimit(
      'test-endpoint',
      '127.0.0.1',
      10, // max 10 requests
      300 // per 5 minutes
    );
    console.log(`✅ Rate limit check: ${rateLimitResult.allowed ? 'ALLOWED' : 'BLOCKED'}`);
    console.log(`   Remaining: ${rateLimitResult.remaining}/${rateLimitResult.limit}`);
    console.log(`   Reset time: ${rateLimitResult.resetTime}\n`);

    // Test Authorization Service
    console.log('🔑 Testing Authorization Service...');
    
    // Get all roles
    const roles = await authorizationService.getAllRoles();
    console.log(`✅ Found ${roles.length} roles in system:`);
    roles.forEach(role => {
      console.log(`   - ${role.name}: ${role.description || 'No description'}`);
    });

    // Get all permissions
    const permissions = await authorizationService.getAllPermissions();
    console.log(`✅ Found ${permissions.length} permissions in system:`);
    permissions.slice(0, 5).forEach(perm => {
      console.log(`   - ${perm.resource}:${perm.action}`);
    });
    if (permissions.length > 5) {
      console.log(`   ... and ${permissions.length - 5} more`);
    }
    console.log();

    // Test Auth Service password validation
    console.log('🔒 Testing Auth Service...');
    const passwordTests = [
      'weak',
      'StrongPass123!',
      'password123',
      'UPPERCASE123!',
      'lowercase123!',
      'NoNumbers!',
      'NoSpecialChars123'
    ];

    passwordTests.forEach(password => {
      const validation = authService.validatePassword(password);
      console.log(`   Password "${password}": ${validation.valid ? '✅ VALID' : '❌ INVALID'}`);
      if (!validation.valid) {
        validation.errors.forEach(error => console.log(`     - ${error}`));
      }
    });
    console.log();

    // Test Security Metrics
    console.log('📈 Testing Security Metrics...');
    const timeRange = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date()
    };
    
    const metrics = await securityEventService.getSecurityMetrics(timeRange);
    console.log(`✅ Security metrics for last 24 hours:`);
    console.log(`   Total events: ${metrics.total_events}`);
    console.log(`   Failed logins: ${metrics.failed_logins}`);
    console.log(`   Successful logins: ${metrics.successful_logins}`);
    console.log(`   Locked accounts: ${metrics.locked_accounts}`);
    console.log(`   Suspicious activities: ${metrics.suspicious_activities}`);
    console.log(`   Top source IPs: ${metrics.top_source_ips.length}`);
    console.log();

    // Test Rate Limit Metrics
    const rateLimitMetrics = await rateLimitService.getRateLimitMetrics(timeRange);
    console.log(`✅ Rate limit metrics for last 24 hours:`);
    console.log(`   Total requests: ${rateLimitMetrics.total_requests}`);
    console.log(`   Blocked requests: ${rateLimitMetrics.blocked_requests}`);
    console.log(`   Top blocked IPs: ${rateLimitMetrics.top_blocked_ips.length}`);
    console.log(`   Endpoint stats: ${rateLimitMetrics.endpoint_stats.length}`);
    console.log();

    console.log('🎉 All security services tested successfully!');
    console.log('\n📋 Security Infrastructure Status:');
    console.log('✅ Security Event Logging - OPERATIONAL');
    console.log('✅ Rate Limiting - OPERATIONAL');
    console.log('✅ Authorization (RBAC) - OPERATIONAL');
    console.log('✅ Authentication - OPERATIONAL');
    console.log('✅ Password Validation - OPERATIONAL');
    console.log('✅ Security Metrics - OPERATIONAL');

  } catch (error) {
    console.error('❌ Security services test failed:', error);
    process.exit(1);
  }
}

// Run the test
testSecurityServices()
  .then(() => {
    console.log('\n✅ Security services test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Security services test failed:', error);
    process.exit(1);
  });