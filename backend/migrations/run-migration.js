const { sequelize } = require('../src/shared/database/connection');

async function runMigration() {
  try {
    console.log('🔧 Starting migration: Add type column to favorit table...\n');

    // Step 1: Add type column
    console.log('Step 1: Adding type column...');
    try {
      await sequelize.query(`
        ALTER TABLE favorit
        ADD COLUMN type ENUM('favorite', 'bookmark') NOT NULL DEFAULT 'favorite'
        COMMENT 'Type: favorite (public like) or bookmark (private save)'
      `);
      console.log('✅ Type column added\n');
    } catch (err) {
      if (err.message.includes("Duplicate column name")) {
        console.log('ℹ️  Type column already exists (skipping)\n');
      } else {
        throw err;
      }
    }

    // Step 2: Drop old unique constraint (if exists)
    console.log('Step 2: Dropping old unique constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE favorit DROP INDEX unique_user_layanan
      `);
      console.log('✅ Old unique constraint dropped\n');
    } catch (err) {
      if (err.message.includes("check that it exists")) {
        console.log('ℹ️  Old unique constraint does not exist (skipping)\n');
      } else {
        throw err;
      }
    }

    // Step 3: Add new unique constraint
    console.log('Step 3: Adding new unique constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE favorit
        ADD CONSTRAINT unique_user_layanan_type UNIQUE (user_id, layanan_id, type)
      `);
      console.log('✅ New unique constraint added\n');
    } catch (err) {
      if (err.message.includes("Duplicate key name")) {
        console.log('ℹ️  Unique constraint already exists (skipping)\n');
      } else {
        throw err;
      }
    }

    // Step 4: Add index on type column
    console.log('Step 4: Adding index on type column...');
    try {
      await sequelize.query(`
        ALTER TABLE favorit ADD INDEX idx_type (type)
      `);
      console.log('✅ Index on type column added\n');
    } catch (err) {
      if (err.message.includes("Duplicate key name")) {
        console.log('ℹ️  Index already exists (skipping)\n');
      } else {
        throw err;
      }
    }

    // Verification
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as total_records FROM favorit
    `);
    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Total records in favorit table: ${results[0].total_records}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
