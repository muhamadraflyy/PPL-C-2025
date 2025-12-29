require('dotenv').config();
const axios = require('axios');

const PORT = process.env.PORT || 5001;
const API_BASE = `http://localhost:${PORT}/api`;

// Target user: Lisvindanu
const TARGET_USER_ID = 'd3dbc82b-7f58-4344-8042-1b252d15784c';
const TARGET_EMAIL = 'lisvindanu015@gmail.com';

async function testMessageToLisvindanu() {
  try {
    console.log('🧪 Testing Message to Lisvindanu (Email Notification Test)\n');
    console.log('Target User ID:', TARGET_USER_ID);
    console.log('Target Email:', TARGET_EMAIL);
    console.log('=' .repeat(60));

    // 1. Login sebagai freelancer
    console.log('\n📝 Step 1: Login as freelancer...');
    const loginResponse = await axios.post(`${API_BASE}/users/login`, {
      email: 'testermodul4-freelancer@test.com',
      password: 'password123@!'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.data.token;
    const senderId = loginResponse.data.data.user.id;
    console.log('✅ Logged in as:', loginResponse.data.data.user.email);
    console.log('   Sender ID:', senderId);

    // 2. Create/Get conversation dengan Lisvindanu
    console.log('\n📝 Step 2: Create conversation with Lisvindanu...');
    const convResponse = await axios.post(
      `${API_BASE}/chat/conversations`,
      { user2_id: TARGET_USER_ID },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const conversationId = convResponse.data.data.id;
    console.log('✅ Conversation created/found:', conversationId);

    // 3. Send test message
    console.log('\n📝 Step 3: Sending test message...');
    const messageResponse = await axios.post(
      `${API_BASE}/chat/conversations/${conversationId}/messages`,
      {
        pesan: `🧪 Test Email Notification - ${new Date().toLocaleString()}`,
        tipe: 'text'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Message sent successfully!');
    console.log('   Message ID:', messageResponse.data.data.id);
    console.log('   Status:', messageResponse.data.data.status);

    // 4. Check result
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULT:');
    console.log('='.repeat(60));

    if (messageResponse.data.data.status === 'delivered') {
      console.log('✅ Lisvindanu is ONLINE');
      console.log('   - Message delivered via Socket.IO');
      console.log('   - Real-time notification sent');
      console.log('   - Email notification SKIPPED');
    } else {
      console.log('📧 Lisvindanu is OFFLINE');
      console.log('   - Message saved to database');
      console.log('   - Email notification SENT to:', TARGET_EMAIL);
      console.log('   - Check inbox for notification!');
    }

    console.log('\n💡 To test offline notification:');
    console.log('   1. Make sure Lisvindanu is NOT connected via Socket.IO');
    console.log('   2. Run this script again');
    console.log('   3. Check email:', TARGET_EMAIL);

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testMessageToLisvindanu();
