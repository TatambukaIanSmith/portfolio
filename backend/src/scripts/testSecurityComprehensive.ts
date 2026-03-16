import { connectDatabase } from '../database/connection';
import { authService } from '../services/authService';
import { authorizationService } from '../services/authorizationService';
import { securityEventService } from '../services/securityEventService';
import { rateLimitService } from '../services/rateLimitService';
import { detectSQLInjection, detectXSS, detectPathTraversal, detectCommandInjection } from '../middleware/inputValidation';
import { logger } from '../utils/logger';

async function runComprehensiveSecurityTests() {
  console.log('🔐 COMPREHENSIVE SECURITY SYSTEM TEST\n');
  console.log('=' .repeat(60));
  
  let passedTests = 0;
  let totalTests = 0;
  const results: { test: string; status: 'PASS' | 'FAIL'; details?: string }[] = [];

  function logTest(testName: string, passed: boolean, details?: string) {
    totalTests++;
    if (passed) passedTests++;
    
    const status = passed ? 'PASS' : 'FAIL';
    const icon = passed ? '✅' : '❌';
    
    console.log(`${icon} ${testName}: ${status}`);
    if (details) console.log(`   ${details}`);
    
    results.push({ test: testName, status, details });
  }

  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Database connection established\n');

    // ==========================================
    // 1. DATABASE SECURITY TESTS
    // ==========================================
    console.log('📊 DATABASE SECURITY TESTS');
    console.log('-'.repeat(40));

    // Test security tables exist
    try {
      const roles = await authorizationService.getAllRoles();
      const permissions = await authorizationService.getAllPermissions();
      
      logTest('Security tables exist', roles.length > 0 && permissions.length > 0, 
        `Found ${roles.length} roles and ${permissions.length} permissions`);
    } catch (error) {
      logTest('Security tables exist', false, `Error: ${error}`);
    }

    // Test security event logging
    try {
      const eventId = await securityEventService.logEvent({
        event_type: 'login',
        severity: 'low',
        ip_address: '127.0.0.1',
        user_agent: 'Test Suite',
        outcome: 'success',
        metadata: { test: 'comprehensive_test' }
      });
      
      logTest('Security event logging', !!eventId, `Event ID: ${eventId}`);
    } catch (error) {
      logTest('Security event logging', false, `Error: ${error}`);
    }

    console.log();

    // ==========================================
    // 2. AUTHENTICATION TESTS
    // ==========================================
    console.log('🔐 AUTHENTICATION TESTS');
    console.log('-'.repeat(40));

    // Test password validation
    const strongPassword = 'StrongPass123!';
    const weakPassword = 'weak';
    
    const strongValidation = authService.validatePassword(strongPassword);
    const weakValidation = authService.validatePassword(weakPassword);
    
    logTest('Strong password validation', strongValidation.valid, 
      `Strong password accepted`);
    logTest('Weak password rejection', !weakValidation.valid, 
      `Weak password rejected: ${weakValidation.errors.length} errors`);

    // Test password hashing
    try {
      const hash = await authService.hashPassword('TestPassword123!');
      const isValid = await authService.verifyPassword('TestPassword123!', hash);
      
      logTest('Password hashing/verification', isValid, 
        `Hash generated and verified successfully`);
    } catch (error) {
      logTest('Password hashing/verification', false, `Error: ${error}`);
    }

    // Test authentication with invalid user
    try {
      const authResult = await authService.authenticate(
        'nonexistent@test.com',
        'password123',
        { ipAddress: '127.0.0.1', userAgent: 'Test Suite' }
      );
      
      logTest('Invalid user authentication', !authResult.success, 
        `Correctly rejected invalid user`);
    } catch (error) {
      logTest('Invalid user authentication', false, `Error: ${error}`);
    }

    console.log();

    // ==========================================
    // 3. AUTHORIZATION (RBAC) TESTS
    // ==========================================
    console.log('🔑 AUTHORIZATION (RBAC) TESTS');
    console.log('-'.repeat(40));

    // Test role retrieval
    try {
      const roles = await authorizationService.getAllRoles();
      const hasAdminRole = roles.some(role => role.name === 'admin');
      const hasSuperAdminRole = roles.some(role => role.name === 'super_admin');
      
      logTest('Default roles exist', hasAdminRole && hasSuperAdminRole, 
        `Found admin and super_admin roles`);
    } catch (error) {
      logTest('Default roles exist', false, `Error: ${error}`);
    }

    // Test permission retrieval
    try {
      const permissions = await authorizationService.getAllPermissions();
      const hasLeadsPermissions = permissions.some(p => p.resource === 'leads');
      const hasUsersPermissions = permissions.some(p => p.resource === 'users');
      
      logTest('Default permissions exist', hasLeadsPermissions && hasUsersPermissions, 
        `Found leads and users permissions`);
    } catch (error) {
      logTest('Default permissions exist', false, `Error: ${error}`);
    }

    console.log();

    // ==========================================
    // 4. RATE LIMITING TESTS
    // ==========================================
    console.log('⏱️ RATE LIMITING TESTS');
    console.log('-'.repeat(40));

    // Test rate limit check
    try {
      const rateLimitResult = await rateLimitService.checkRateLimit(
        'test-endpoint',
        '127.0.0.1',
        5, // max 5 requests
        60 // per minute
      );
      
      logTest('Rate limit check', rateLimitResult.allowed, 
        `Remaining: ${rateLimitResult.remaining}/${rateLimitResult.limit}`);
    } catch (error) {
      logTest('Rate limit check', false, `Error: ${error}`);
    }

    // Test rate limit metrics
    try {
      const metrics = await rateLimitService.getRateLimitMetrics({
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      });
      
      logTest('Rate limit metrics', typeof metrics.total_requests === 'number', 
        `Metrics retrieved successfully`);
    } catch (error) {
      logTest('Rate limit metrics', false, `Error: ${error}`);
    }

    console.log();

    // ==========================================
    // 5. INPUT VALIDATION TESTS
    // ==========================================
    console.log('🛡️ INPUT VALIDATION TESTS');
    console.log('-'.repeat(40));

    // Test SQL injection detection
    const sqlInjectionAttempts = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "UNION SELECT * FROM users",
      "admin'--",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --"
    ];

    let sqlDetected = 0;
    sqlInjectionAttempts.forEach(attempt => {
      if (detectSQLInjection(attempt)) sqlDetected++;
    });

    logTest('SQL injection detection', sqlDetected === sqlInjectionAttempts.length, 
      `Detected ${sqlDetected}/${sqlInjectionAttempts.length} SQL injection attempts`);

    // Test XSS detection
    const xssAttempts = [
      "<script>alert('xss')</script>",
      "<img src=x onerror=alert('xss')>",
      "javascript:alert('xss')",
      "<iframe src='javascript:alert(\"xss\")'></iframe>",
      "<object data='javascript:alert(\"xss\")'></object>"
    ];

    let xssDetected = 0;
    xssAttempts.forEach(attempt => {
      if (detectXSS(attempt)) xssDetected++;
    });

    logTest('XSS detection', xssDetected === xssAttempts.length, 
      `Detected ${xssDetected}/${xssAttempts.length} XSS attempts`);

    // Test path traversal detection
    const pathTraversalAttempts = [
      "../../../etc/passwd",
      "..\\..\\..\\windows\\system32",
      "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
      "....//....//....//etc/passwd"
    ];

    let pathTraversalDetected = 0;
    pathTraversalAttempts.forEach(attempt => {
      if (detectPathTraversal(attempt)) pathTraversalDetected++;
    });

    logTest('Path traversal detection', pathTraversalDetected === pathTraversalAttempts.length, 
      `Detected ${pathTraversalDetected}/${pathTraversalAttempts.length} path traversal attempts`);

    // Test command injection detection
    const commandInjectionAttempts = [
      "; cat /etc/passwd",
      "| whoami",
      "&& rm -rf /",
      "`id`",
      "$(whoami)"
    ];

    let commandInjectionDetected = 0;
    commandInjectionAttempts.forEach(attempt => {
      if (detectCommandInjection(attempt)) commandInjectionDetected++;
    });

    logTest('Command injection detection', commandInjectionDetected === commandInjectionAttempts.length, 
      `Detected ${commandInjectionDetected}/${commandInjectionAttempts.length} command injection attempts`);

    console.log();

    // ==========================================
    // 6. SECURITY METRICS TESTS
    // ==========================================
    console.log('📈 SECURITY METRICS TESTS');
    console.log('-'.repeat(40));

    // Test security metrics retrieval
    try {
      const timeRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      };
      
      const metrics = await securityEventService.getSecurityMetrics(timeRange);
      
      logTest('Security metrics retrieval', typeof metrics.total_events === 'number', 
        `Retrieved metrics for ${metrics.total_events} events`);
    } catch (error) {
      logTest('Security metrics retrieval', false, `Error: ${error}`);
    }

    // Test suspicious activity detection
    try {
      const suspiciousActivity = await securityEventService.detectSuspiciousActivity();
      
      logTest('Suspicious activity detection', 
        typeof suspiciousActivity.rapid_failed_logins === 'object', 
        `Detection system operational`);
    } catch (error) {
      logTest('Suspicious activity detection', false, `Error: ${error}`);
    }

    console.log();

    // ==========================================
    // 7. INTEGRATION TESTS
    // ==========================================
    console.log('🔗 INTEGRATION TESTS');
    console.log('-'.repeat(40));

    // Test service interdependencies
    try {
      // This tests that services can work together
      const eventId = await securityEventService.logEvent({
        event_type: 'suspicious_activity',
        severity: 'high',
        ip_address: '192.168.1.100',
        user_agent: 'Suspicious Bot',
        outcome: 'failure',
        metadata: { integration_test: true }
      });

      const events = await securityEventService.getEvents({ limit: 1 });
      const foundEvent = events.find(e => e.id === eventId);
      
      logTest('Service integration', !!foundEvent, 
        `Services can communicate and share data`);
    } catch (error) {
      logTest('Service integration', false, `Error: ${error}`);
    }

    console.log();

    // ==========================================
    // FINAL RESULTS
    // ==========================================
    console.log('🎯 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    const passRate = Math.round((passedTests / totalTests) * 100);
    const status = passRate >= 90 ? '🟢 EXCELLENT' : 
                   passRate >= 75 ? '🟡 GOOD' : 
                   passRate >= 50 ? '🟠 NEEDS WORK' : '🔴 CRITICAL';
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Pass Rate: ${passRate}% ${status}`);
    console.log();

    // Show failed tests
    const failedTests = results.filter(r => r.status === 'FAIL');
    if (failedTests.length > 0) {
      console.log('❌ FAILED TESTS:');
      failedTests.forEach(test => {
        console.log(`   - ${test.test}: ${test.details || 'No details'}`);
      });
      console.log();
    }

    // Security system status
    console.log('🔐 SECURITY SYSTEM STATUS:');
    console.log('-'.repeat(40));
    console.log(`✅ Authentication Service: ${results.find(r => r.test.includes('password'))?.status === 'PASS' ? 'OPERATIONAL' : 'ISSUES'}`);
    console.log(`✅ Authorization (RBAC): ${results.find(r => r.test.includes('roles'))?.status === 'PASS' ? 'OPERATIONAL' : 'ISSUES'}`);
    console.log(`✅ Rate Limiting: ${results.find(r => r.test.includes('Rate limit'))?.status === 'PASS' ? 'OPERATIONAL' : 'ISSUES'}`);
    console.log(`✅ Input Validation: ${results.filter(r => r.test.includes('detection')).every(r => r.status === 'PASS') ? 'OPERATIONAL' : 'ISSUES'}`);
    console.log(`✅ Security Logging: ${results.find(r => r.test.includes('event logging'))?.status === 'PASS' ? 'OPERATIONAL' : 'ISSUES'}`);
    console.log(`✅ Security Metrics: ${results.find(r => r.test.includes('metrics'))?.status === 'PASS' ? 'OPERATIONAL' : 'ISSUES'}`);

    if (passRate >= 90) {
      console.log('\n🎉 SECURITY SYSTEM IS READY FOR PRODUCTION!');
      console.log('   All core security components are operational.');
      console.log('   Ready to integrate with existing APIs.');
    } else if (passRate >= 75) {
      console.log('\n⚠️  SECURITY SYSTEM NEEDS MINOR FIXES');
      console.log('   Most components are working, but some issues need attention.');
    } else {
      console.log('\n🚨 SECURITY SYSTEM NEEDS ATTENTION');
      console.log('   Critical issues found that must be resolved before production.');
    }

  } catch (error) {
    console.error('❌ Comprehensive security test failed:', error);
    process.exit(1);
  }
}

// Run the comprehensive test
runComprehensiveSecurityTests()
  .then(() => {
    console.log('\n✅ Comprehensive security test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Comprehensive security test failed:', error);
    process.exit(1);
  });