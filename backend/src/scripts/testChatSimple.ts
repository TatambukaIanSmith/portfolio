import { logger } from '../utils/logger';

async function testChatConnection() {
  console.log('🧪 Testing Chat Connection...\n');

  const serverUrl = 'http://localhost:3001';
  
  try {
    // Test basic server connection
    console.log('1. Testing server connection...');
    const response = await fetch(`${serverUrl}/api/health`);
    
    if (response.ok) {
      console.log('   ✅ Server is running and accessible');
    } else {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    // Test WebSocket endpoint
    console.log('\n2. Testing WebSocket availability...');
    const wsTest = await fetch(`${serverUrl}/socket.io/`);
    
    if (wsTest.status === 400) {
      // Socket.IO returns 400 for non-websocket requests, which is expected
      console.log('   ✅ Socket.IO endpoint is available');
    } else {
      console.log('   ⚠️  Socket.IO endpoint response:', wsTest.status);
    }

    console.log('\n🎉 Basic connectivity tests passed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the backend server: npm run dev');
    console.log('   2. Start the frontend: npm run dev (in root directory)');
    console.log('   3. Open browser and test the chat widget');
    console.log('   4. Check browser console for connection logs');

  } catch (error) {
    console.error('\n❌ Connection test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the server is running: npm run dev');
    console.log('   2. Check the port is correct (3001)');
    console.log('   3. Verify no firewall is blocking the connection');
    console.log('   4. Check the server logs for errors');
  }
}

// Run the test
if (require.main === module) {
  testChatConnection().catch(console.error);
}

export default testChatConnection;