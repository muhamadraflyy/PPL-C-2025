require('dotenv').config();
const { sequelize } = require('./src/shared/database/connection');

async function checkUserPasswords() {
  try {
    const [users] = await sequelize.query(`
      SELECT id, email, role, password
      FROM users
      WHERE email IN ('client1@example.com', 'freelancer1@example.com', 'admin@skillconnect.com')
    `);

    console.log('\n👥 User Credentials Check\n');
    console.log('━'.repeat(100));
    
    users.forEach((user) => {
      const isHashed = user.password.startsWith('$2');
      console.log(`Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Password: ${user.password.substring(0, 30)}...`);
      console.log(`  Is Bcrypt Hashed: ${isHashed ? '✅ Yes' : '❌ No (plaintext!)'}`);
      console.log('');
    });
    
    console.log('━'.repeat(100));
    console.log('\n💡 For testing, try these credentials:');
    console.log('   Email: client1@example.com');
    console.log('   Password: password123 (or check database if different)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUserPasswords();
