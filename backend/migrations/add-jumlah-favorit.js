const { sequelize } = require('../src/shared/database/connection');

async function runMigration() {
  try {
    console.log('🔧 Starting migration: Add jumlah_favorit column to layanan table...\n');

    // Step 1: Add jumlah_favorit column
    console.log('Step 1: Adding jumlah_favorit column...');
    try {
      await sequelize.query(`
        ALTER TABLE layanan
        ADD COLUMN jumlah_favorit INT UNSIGNED NOT NULL DEFAULT 0
        COMMENT 'Total number of favorites (global count across all users)'
      `);
      console.log('✅ jumlah_favorit column added\n');
    } catch (err) {
      if (err.message.includes("Duplicate column name")) {
        console.log('ℹ️  jumlah_favorit column already exists (skipping)\n');
      } else {
        throw err;
      }
    }

    // Step 2: Create index for better performance
    console.log('Step 2: Adding index on jumlah_favorit...');
    try {
      await sequelize.query(`
        CREATE INDEX idx_jumlah_favorit ON layanan(jumlah_favorit)
      `);
      console.log('✅ Index on jumlah_favorit added\n');
    } catch (err) {
      if (err.message.includes("Duplicate key name")) {
        console.log('ℹ️  Index already exists (skipping)\n');
      } else {
        throw err;
      }
    }

    // Step 3: Initialize jumlah_favorit based on existing favorit table data
    console.log('Step 3: Initializing jumlah_favorit from existing data...');
    await sequelize.query(`
      UPDATE layanan l
      SET l.jumlah_favorit = (
        SELECT COUNT(*)
        FROM favorit f
        WHERE f.layanan_id = l.id
        AND f.type = 'favorite'
      )
    `);
    console.log('✅ jumlah_favorit initialized\n');

    // Verification
    const [results] = await sequelize.query(`
      SELECT
        COUNT(*) as total_layanan,
        SUM(jumlah_favorit) as total_favorit
      FROM layanan
    `);
    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Total layanan: ${results[0].total_layanan}`);
    console.log(`📊 Total favorites across all layanan: ${results[0].total_favorit}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
