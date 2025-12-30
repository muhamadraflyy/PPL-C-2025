require('dotenv').config();
const axios = require('axios');

// Force localhost to IPv4
const PORT = 5000;
const API_BASE = `http://127.0.0.1:${PORT}/api`;

async function testChat() {
  try {
    // Login untuk mendapatkan token
    console.log('📝 Logging in...');
    console.log('   API URL:', `${API_BASE}/users/login`);
    const loginResponse = await axios.post(`${API_BASE}/users/login`, {
      email: 'testermodul4-client@test.com',
      password: 'password123@!'
    }).catch(err => {
      console.error('   Login request failed:', err.code || err.message);
      throw err;
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user.id;
    console.log('✅ Login successful');
    console.log('   User ID:', userId);
    console.log('   Token:', token.substring(0, 30) + '...');

    // Test 1: Get Conversations
    console.log('\n📬 Testing GET /api/chat/conversations...');
    try {
      const conversationsResponse = await axios.get(`${API_BASE}/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Conversations response:', JSON.stringify(conversationsResponse.data, null, 2));
    } catch (error) {
      console.error('❌ Error getting conversations:');
      console.error('   Status:', error.response?.status);
      console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('   Message:', error.message);
      if (error.response?.status === 500) {
        console.error('   Stack:', error.response?.data?.stack);
      }
    }

    // Test 2: Create Conversation
    console.log('\n💬 Testing POST /api/chat/conversations...');
    try {
      const createConvResponse = await axios.post(`${API_BASE}/chat/conversations`, {
        otherUserId: '550e8400-e29b-41d4-a716-446655440000' // Dummy UUID
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Create conversation response:', JSON.stringify(createConvResponse.data, null, 2));
    } catch (error) {
      console.error('❌ Error creating conversation:');
      console.error('   Status:', error.response?.status);
      console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testChat();
