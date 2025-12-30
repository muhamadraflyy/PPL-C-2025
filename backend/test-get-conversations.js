require('dotenv').config();
const { sequelize } = require('./src/shared/database/connection');
const SequelizeConversationRepository = require('./src/modules/chat/infrastructure/repositories/SequelizeConversationRepository');

async function testGetConversations() {
  try {
    console.log('\n🔍 Testing GET Conversations\n');

    const userId = '0f69e036-9c18-4a3b-8bce-f98081fb9513'; // Admin user from logs
    
    const repo = new SequelizeConversationRepository(sequelize);
    
    console.log('📝 Calling findByUserId with includeOtherUser: true');
    const conversations = await repo.findByUserId(userId, {
      page: 1,
      limit: 20,
      order: 'DESC',
      includeOtherUser: true
    });

    console.log('\n✅ Result:', conversations.length, 'conversations');
    
    if (conversations.length > 0) {
      console.log('\n📋 First conversation details:');
      const conv = conversations[0];
      console.log('ID:', conv.id);
      console.log('user1_id:', conv.user1_id);
      console.log('user2_id:', conv.user2_id);
      console.log('user1 object:', conv.user1);
      console.log('user2 object:', conv.user2);
      console.log('pesan_terakhir:', conv.pesan_terakhir);
      
      // Test the getUnreadCountFor method
      console.log('\n🔢 Unread count for', userId, ':', conv.getUnreadCountFor(userId));
      
      // Test otherUser logic
      const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;
      console.log('\n👤 Other user:', otherUser);
      
      if (otherUser) {
        console.log('   ✅ Other user ID:', otherUser.id);
        console.log('   ✅ Other user name:', otherUser.nama_depan, otherUser.nama_belakang);
      } else {
        console.log('   ❌ OTHER USER IS UNDEFINED!');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testGetConversations();
