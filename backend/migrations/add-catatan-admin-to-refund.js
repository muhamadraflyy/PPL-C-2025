require('dotenv').config();
const { sequelize } = require('../src/shared/database/connection');

async function runMigration() {
  try {
    console.log('🔧 Starting migration: Add catatan_admin column to refund table...\n');

    // Step 1: Add catatan_admin column
    console.log('Step 1: Adding catatan_admin column...');
    try {
      await sequelize.query(`
        ALTER TABLE refund
        ADD COLUMN catatan_admin TEXT NULL
        COMMENT 'Admin notes when processing refund request (approve/reject)'
        AFTER selesai_pada
      `);
      console.log('✅ catatan_admin column added\n');
    } catch (err) {
      if (err.message.includes("Duplicate column name")) {
        console.log('ℹ️  catatan_admin column already exists (skipping)\n');
      } else {
        throw err;
      }
    }

    // Verification
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as total_refunds
      FROM refund
    `);
    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Total refund records: ${results[0].total_refunds}\n`);

    // Show updated table structure
    console.log('📋 Updated refund table structure:');
    const [columns] = await sequelize.query(`DESCRIBE refund`);
    console.table(columns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
