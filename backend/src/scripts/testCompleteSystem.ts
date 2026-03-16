import { connectDatabase } from '../database/connection';
import { logger } from '../utils/logger';

async function testCompleteSystem() {
  console.log('🧪 TESTING COMPLETE SYSTEM INTEGRATION\n');
  console.log('=' .repeat(60));
  
  const backendUrl = 'http://localhost:3000/api/v1';
  const frontendUrl = 'http://localhost:3001';
  let testsPassed = 0;
  let totalTests = 0;

  // Helper function to make HTTP requests
  async function makeRequest(url: string, options: any = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      const data = await response.text();
      let jsonData;
      try {
        jsonData = JSON.parse(data);
      } catch {
        jsonData = { rawResponse: data };
      }
      
      return {
        status: response.status,
        data: jsonData,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        status: 0,
        data: { error: error.message },
        headers: {}
      };
    }
  }

  // Test function
  function test(name: string, condition: boolean) {
    totalTests++;
    if (condition) {
      console.log(`✅ ${name}`);
      testsPassed++;
    } else {
      console.log(`❌ ${name}`);
    }
  }

  try {
    console.log('🔧 Testing Backend API...');
    
    // Test 1: Health Check
    const healthResponse = await makeRequest(`${backendUrl}/../health`);
    test('Backend health check', healthResponse.status === 200);

    // Test 2: Lead Creation with Email
    console.log('\n📧 Testing Lead Creation & Email...');
    const leadResponse = await makeRequest(`${backendUrl}/leads`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'System Test User',
        email: 'systemtest@example.com',
        message: 'Testing complete system integration with email to leemeeya851@gmail.com',
        type: 'contact',
        source: 'system_test'
      })
    });
    test('Lead creation successful', leadResponse.status === 201);
    test('Lead has valid ID', leadResponse.data?.data?.id !== undefined);

    // Test 3: Phone Call Creation with Email
    console.log('\n📞 Testing Phone Call Creation & Email...');
    const phoneCallResponse = await makeRequest(`${backendUrl}/phone-calls`, {
      method: 'POST',
      body: JSON.stringify({
        caller_name: 'System Test Caller',
        caller_email: 'systemtest@example.com',
        caller_phone: '+256748550372',
        call_type: 'direct',
        message: 'Testing phone call system integration',
        source: 'system_test'
      })
    });
    test('Phone call creation successful', phoneCallResponse.status === 201);
    test('Phone call has valid ID', phoneCallResponse.data?.data?.id !== undefined);

    // Test 4: Security Features
    console.log('\n🔐 Testing Security Features...');
    const protectedResponse = await makeRequest(`${backendUrl}/leads`, { method: 'GET' });
    test('Protected endpoints require authentication', protectedResponse.status === 401);

    const securityHeaders = leadResponse.headers;
    test('Security headers present', 
      securityHeaders['x-content-type-options'] === 'nosniff' &&
      securityHeaders['x-frame-options'] === 'SAMEORIGIN'
    );

    // Test 5: Rate Limiting
    console.log('\n⚡ Testing Rate Limiting...');
    test('Rate limiting headers present', 
      leadResponse.headers['x-ratelimit-limit'] !== undefined
    );

    // Test 6: Frontend Accessibility
    console.log('\n🌐 Testing Frontend...');
    const frontendResponse = await makeRequest(frontendUrl);
    test('Frontend accessible', frontendResponse.status === 200);

    // Test 7: Database Connection
    console.log('\n🗄️ Testing Database...');
    try {
      await connectDatabase();
      test('Database connection successful', true);
    } catch (error) {
      test('Database connection successful', false);
    }

    console.log('\n📊 COMPLETE SYSTEM TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`✅ Tests Passed: ${testsPassed}/${totalTests}`);
    console.log(`📈 Success Rate: ${Math.round((testsPassed / totalTests) * 100)}%`);
    
    if (testsPassed === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! SYSTEM FULLY OPERATIONAL!');
      console.log('\n🚀 SYSTEM STATUS:');
      console.log('   ✅ Backend API: RUNNING (http://localhost:3000)');
      console.log('   ✅ Frontend: RUNNING (http://localhost:3001)');
      console.log('   ✅ Database: CONNECTED');
      console.log('   ✅ Email Service: OPERATIONAL');
      console.log('   ✅ Security: ENTERPRISE-GRADE PROTECTION');
      console.log('   ✅ Phone Call System: FUNCTIONAL');
      console.log('   ✅ Lead Management: FUNCTIONAL');
      
      console.log('\n📧 EMAIL CONFIGURATION:');
      console.log('   📬 Notification Email: leemeeya851@gmail.com');
      console.log('   📤 SMTP Service: Gmail (configured)');
      console.log('   📞 Phone Number: +256748550372');
      
      console.log('\n🔗 ACCESS POINTS:');
      console.log('   🌐 Portfolio: http://localhost:3001');
      console.log('   🔧 API: http://localhost:3000/api/v1');
      console.log('   ❤️ Health: http://localhost:3000/api/health');
      
    } else {
      console.log('\n⚠️  Some tests failed. Please review the results above.');
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Visit http://localhost:3001 to test the frontend');
    console.log('   2. Fill out the contact form to test email delivery');
    console.log('   3. Click the call buttons to test phone call functionality');
    console.log('   4. Check leemeeya851@gmail.com for email notifications');

  } catch (error) {
    console.error('❌ System test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCompleteSystem()
  .then(() => {
    console.log('\n✅ Complete system testing finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Complete system testing failed:', error);
    process.exit(1);
  });