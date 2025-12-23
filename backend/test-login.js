require('dotenv').config();
const axios = require('axios');

const PORT = process.env.PORT || 5001;
const API_BASE = `http://localhost:${PORT}/api`;

async function login() {
  try {
    // Login user 1 (client)
    console.log('Logging in user 1...');
    const user1 = await axios.post(`${API_BASE}/users/login`, {
      email: 'testermodul4-client@test.com',
      password: 'password123@!'
    });

    console.log('User 1 response:', JSON.stringify(user1.data, null, 2));

    // Login user 2 (freelancer)
    console.log('\nLogging in user 2...');
    const user2 = await axios.post(`${API_BASE}/users/login`, {
      email: 'testermodul4-freelancer@test.com',
      password: 'password123@!'
    });

    console.log('User 2 response:', JSON.stringify(user2.data, null, 2));

    if (user1.data.success && user2.data.success) {
      console.log('\n╔════════════════════════════════════════════════════════════════╗');
      console.log('║            USER 1 (CLIENT - BLUE THEME)                       ║');
      console.log('╠════════════════════════════════════════════════════════════════╣');
      console.log('  Email:', user1.data.data.user.email);
      console.log('  ID:', user1.data.data.user.id);
      console.log('  Role:', user1.data.data.user.role);
      console.log('  Token:');
      console.log('  ' + user1.data.data.token);
      console.log('╚════════════════════════════════════════════════════════════════╝\n');

      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║         USER 2 (FREELANCER - PINK THEME)                      ║');
      console.log('╠════════════════════════════════════════════════════════════════╣');
      console.log('  Email:', user2.data.data.user.email);
      console.log('  ID:', user2.data.data.user.id);
      console.log('  Role:', user2.data.data.user.role);
      console.log('  Token:');
      console.log('  ' + user2.data.data.token);
      console.log('╚════════════════════════════════════════════════════════════════╝');
    }

  } catch (error) {
    console.error('Login error:', JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

login();
