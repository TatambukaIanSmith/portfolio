import dotenv from 'dotenv';
import { connectDatabase } from '../database/connection';
import { authService } from '../services/authService';

// Load environment variables
dotenv.config();

async function testLogin() {
  console.log('🔐 TESTING LOGIN FUNCTIONALITY\n');
  
  try {
    await connectDatabase();
    
    const email = 'admin@iansmith.dev';
    const password = 'AdminPass123!';
    
    console.log(`Testing login for: ${email}`);
    
    // Test authentication
    const result = await authService.authenticate(email, password, {
      ipAddress: '127.0.0.1',
      userAgent: 'Test Script'
    });
    
    console.log('Authentication result:', result);
    
    if (result.success) {
      console.log('✅ Login successful!');
      console.log(`   Token: ${result.token?.substring(0, 20)}...`);
      console.log(`   User: ${result.user?.email}`);
      console.log(`   Role: ${result.user?.role}`);
    } else {
      console.log('❌ Login failed!');
      console.log(`   Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLogin();