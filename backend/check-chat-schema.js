require('dotenv').config();
const { sequelize } = require('./src/shared/database/connection');

async function checkChatSchema() {
  try {
    console.log('\n🔍 Checking percakapan table structure...\n');
    
    // Get table structure
    const [columns] = await sequelize.query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_KEY,
        COLUMN_DEFAULT,
        EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'percakapan'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📋 Columns:');
    console.log('━'.repeat(100));
    columns.forEach((col) => {
      console.log(`   ${col.COLUMN_NAME.padEnd(20)} | ${col.DATA_TYPE.padEnd(15)} | ${col.COLUMN_KEY ? `[${col.COLUMN_KEY}]` : ''} ${col.EXTRA || ''}`);
    });
    console.log('━'.repeat(100));

    // Check foreign keys
    const [foreignKeys] = await sequelize.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'percakapan'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    console.log('\n🔗 Foreign Keys:');
    console.log('━'.repeat(100));
    if (foreignKeys.length > 0) {
      foreignKeys.forEach((fk) => {
        console.log(`   ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('   ⚠️  No foreign keys found!');
    }
    console.log('━'.repeat(100));

    // Check indexes
    const [indexes] = await sequelize.query(`
      SELECT 
        INDEX_NAME,
        COLUMN_NAME,
        NON_UNIQUE,
        SEQ_IN_INDEX
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'percakapan'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `);

    console.log('\n📑 Indexes:');
    console.log('━'.repeat(100));
    indexes.forEach((idx) => {
      const type = idx.NON_UNIQUE === 0 ? '[UNIQUE]' : '';
      console.log(`   ${idx.INDEX_NAME.padEnd(30)} | ${idx.COLUMN_NAME.padEnd(20)} | ${type}`);
    });
    console.log('━'.repeat(100));

    // Check sample data
    const [count] = await sequelize.query('SELECT COUNT(*) as total FROM percakapan');
    console.log(`\n📊 Total Conversations: ${count[0].total}\n`);

    // Check users table for testing
    const [users] = await sequelize.query(`
      SELECT id, email, role
      FROM users
      LIMIT 5
    `);

    console.log('👥 Sample Users (for testing):');
    console.log('━'.repeat(100));
    users.forEach((user) => {
      console.log(`   ID: ${user.id} | Email: ${user.email.padEnd(30)} | Role: ${user.role}`);
    });
    console.log('━'.repeat(100));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkChatSchema();
