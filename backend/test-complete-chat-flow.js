/**
 * Test Complete Chat Flow: Client → Hubungi Freelancer → Create Conversation
 * 
 * This simulates the exact flow when client clicks "Hubungi Freelancer" button
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api';

// Test users from database
const CLIENT_EMAIL = 'client1@example.com';
const CLIENT_PASSWORD = 'password123'; // Adjust if needed
const FREELANCER_ID = '3d801eac-dc52-4925-be5a-9d5fc00964f0'; // freelancer1@example.com

async function testChatFlow() {
  console.log('\n🚀 Testing Complete Chat Flow\n');
  console.log('━'.repeat(80));

  try {
    // STEP 1: Client Login
    console.log('\n📝 STEP 1: Client Login');
    console.log('   Email:', CLIENT_EMAIL);
    
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      email: CLIENT_EMAIL,
      password: CLIENT_PASSWORD
    });

    if (loginResponse.data.status !== 'success') {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    const token = loginResponse.data.data.token;
    const clientId = loginResponse.data.data.user.id;
    
    console.log('   ✅ Login successful');
    console.log('   Client ID:', clientId);
    console.log('   Token:', token.substring(0, 30) + '...');

    // STEP 2: Client clicks "Hubungi Freelancer" → Create Conversation
    console.log('\n💬 STEP 2: Create Conversation with Freelancer');
    console.log('   Client ID:', clientId);
    console.log('   Freelancer ID:', FREELANCER_ID);

    const createConvResponse = await axios.post(
      `${API_URL}/chat/conversations`,
      { user2_id: FREELANCER_ID },
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    if (createConvResponse.data.status !== 'success') {
      throw new Error('Create conversation failed: ' + createConvResponse.data.message);
    }

    const conversation = createConvResponse.data.data;
    
    console.log('   ✅ Conversation created/found');
    console.log('   Conversation ID:', conversation.id);
    console.log('   User1 ID:', conversation.user1_id);
    console.log('   User2 ID:', conversation.user2_id);
    console.log('   Created at:', conversation.created_at);

    // STEP 3: Fetch conversation details
    console.log('\n📋 STEP 3: Fetch Conversations List');

    const getConversationsResponse = await axios.get(
      `${API_URL}/chat/conversations`,
      { 
        headers: { 
          Authorization: `Bearer ${token}`
        } 
      }
    );

    console.log('   ✅ Fetched conversations');
    console.log('   Total conversations:', getConversationsResponse.data.data.length);
    
    if (getConversationsResponse.data.data.length > 0) {
      console.log('\n   📝 Conversations:');
      getConversationsResponse.data.data.forEach((conv, index) => {
        console.log(`      ${index + 1}. ID: ${conv.id}`);
        console.log(`         User1: ${conv.user1_id}`);
        console.log(`         User2: ${conv.user2_id}`);
        console.log(`         Last message: ${conv.pesan_terakhir || '(none)'}`);
        console.log('');
      });
    }

    // STEP 4: Send first message
    console.log('\n📨 STEP 4: Send First Message');

    const sendMessageResponse = await axios.post(
      `${API_URL}/chat/conversations/${conversation.id}/messages`,
      { 
        pesan: 'Halo, saya tertarik dengan layanan Anda!',
        tipe: 'text'
      },
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    if (sendMessageResponse.data.status !== 'success') {
      throw new Error('Send message failed: ' + sendMessageResponse.data.message);
    }

    const message = sendMessageResponse.data.data;
    
    console.log('   ✅ Message sent');
    console.log('   Message ID:', message.id);
    console.log('   Content:', message.pesan || message.isi_pesan);
    console.log('   Sent at:', message.created_at);

    // SUCCESS
    console.log('\n' + '━'.repeat(80));
    console.log('✅ ALL TESTS PASSED!');
    console.log('━'.repeat(80));
    console.log('\n🎉 Chat flow is working correctly!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.response) {
      console.error('\n📋 Response Details:');
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 500) {
        console.error('\n🔍 Server Error Details:');
        console.error('   This is a 500 Internal Server Error');
        console.error('   Check backend logs for more details');
        console.error('   Possible causes:');
        console.error('   - Invalid user IDs (not found in database)');
        console.error('   - Foreign key constraint violations');
        console.error('   - Missing authentication middleware');
        console.error('   - Database connection issues');
      }
    } else if (error.request) {
      console.error('\n📡 No response received from server');
      console.error('   Make sure backend is running on', API_URL);
    }
    
    console.log('\n');
    process.exit(1);
  }
}

// Run test
testChatFlow();
