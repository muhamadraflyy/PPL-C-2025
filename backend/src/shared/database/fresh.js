/**
 * Database Fresh Script
 * Drop semua tabel, jalankan migration, dan seeder
 *
 * Usage: npm run db:fresh
 */

require('dotenv').config();
const { sequelize } = require('./connection');
const { runMigrations } = require('./migrations');

async function dropAllTables() {
  console.log('\n🗑️  Dropping all tables...');

  try {
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'skillconnect'}'
    `);

    // Drop each table
    for (const row of tables) {
      const tableName = row.TABLE_NAME;
      console.log(`   Dropping: ${tableName}`);
      await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ All tables dropped!\n');
  } catch (err) {
    console.error('❌ Error dropping tables:', err.message);
    throw err;
  }
}

async function runSeeders() {
  console.log('\n🌱 Running seeders...');

  const bcrypt = require('bcrypt');
  const { v4: uuidv4 } = require('uuid');

  try {
    // Seed Users
    const password = await bcrypt.hash('Password123!', 10);
    const users = [
      { id: uuidv4(), email: 'admin@skillconnect.com', password, role: 'admin', nama_depan: 'Admin', nama_belakang: 'SkillConnect', kota: 'Jakarta', provinsi: 'DKI Jakarta' },
      { id: uuidv4(), email: 'client@skillconnect.com', password, role: 'client', nama_depan: 'John', nama_belakang: 'Doe', kota: 'Bandung', provinsi: 'Jawa Barat' },
      { id: uuidv4(), email: 'client2@skillconnect.com', password, role: 'client', nama_depan: 'Alice', nama_belakang: 'Johnson', kota: 'Yogyakarta', provinsi: 'DI Yogyakarta' },
      { id: uuidv4(), email: 'freelancer@skillconnect.com', password, role: 'freelancer', nama_depan: 'Jane', nama_belakang: 'Smith', kota: 'Surabaya', provinsi: 'Jawa Timur' },
      { id: uuidv4(), email: 'freelancer2@skillconnect.com', password, role: 'freelancer', nama_depan: 'Bob', nama_belakang: 'Williams', kota: 'Semarang', provinsi: 'Jawa Tengah' },
    ];

    for (const user of users) {
      await sequelize.query(`
        INSERT INTO users (id, email, password, role, nama_depan, nama_belakang, kota, provinsi, is_active, is_verified, email_verified_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW(), NOW())
      `, { replacements: [user.id, user.email, user.password, user.role, user.nama_depan, user.nama_belakang, user.kota, user.provinsi] });
    }
    console.log('   ✅ Users seeded (5 users)');

    // Seed Kategori
    const kategoris = [
      { nama: 'Pengembangan Website', slug: 'pengembangan-website', deskripsi: 'Layanan pengembangan website profesional' },
      { nama: 'Pengembangan Aplikasi Mobile', slug: 'pengembangan-aplikasi-mobile', deskripsi: 'Pembuatan aplikasi mobile Android dan iOS' },
      { nama: 'UI/UX Design', slug: 'ui-ux-design', deskripsi: 'Desain antarmuka dan pengalaman pengguna' },
      { nama: 'Data Science & Machine Learning', slug: 'data-science-machine-learning', deskripsi: 'Analisis data dan implementasi ML' },
      { nama: 'Cybersecurity & Testing', slug: 'cybersecurity-testing', deskripsi: 'Layanan keamanan siber dan pengujian' },
      { nama: 'Copy Writing', slug: 'copy-writing', deskripsi: 'Penulisan konten kreatif dan persuasif' },
    ];

    for (const kat of kategoris) {
      await sequelize.query(`
        INSERT INTO kategori (id, nama, slug, deskripsi, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, NOW(), NOW())
      `, { replacements: [uuidv4(), kat.nama, kat.slug, kat.deskripsi] });
    }
    console.log('   ✅ Kategori seeded (6 categories)');

    // Get freelancer IDs and kategori IDs
    const [freelancers] = await sequelize.query('SELECT id FROM users WHERE role = "freelancer"');
    const [categories] = await sequelize.query('SELECT id, nama FROM kategori');

    // Seed Layanan
    const layanans = [
      { judul: 'Website Company Profile', slug: 'website-company-profile-' + Date.now(), harga: 5000000, waktu: 14 },
      { judul: 'Landing Page Optimization', slug: 'landing-page-optimization-' + Date.now(), harga: 3500000, waktu: 7 },
      { judul: 'E-Commerce Website', slug: 'ecommerce-website-' + Date.now(), harga: 15000000, waktu: 30 },
      { judul: 'Mobile App Development', slug: 'mobile-app-development-' + Date.now(), harga: 20000000, waktu: 45 },
      { judul: 'UI/UX Design System', slug: 'ui-ux-design-system-' + Date.now(), harga: 8000000, waktu: 21 },
      { judul: 'Data Analytics Dashboard', slug: 'data-analytics-dashboard-' + Date.now(), harga: 12000000, waktu: 28 },
    ];

    for (let i = 0; i < layanans.length; i++) {
      const l = layanans[i];
      const freelancerId = freelancers[i % freelancers.length].id;
      const kategoriId = categories[i % categories.length].id;

      await sequelize.query(`
        INSERT INTO layanan (id, freelancer_id, kategori_id, judul, slug, deskripsi, harga, waktu_pengerjaan, batas_revisi, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 3, 'aktif', NOW(), NOW())
      `, { replacements: [uuidv4(), freelancerId, kategoriId, l.judul, l.slug, 'Layanan profesional ' + l.judul, l.harga, l.waktu] });
    }
    console.log('   ✅ Layanan seeded (6 services)');

    // Seed Pesanan
    const [clients] = await sequelize.query('SELECT id FROM users WHERE role = "client"');
    const [services] = await sequelize.query('SELECT id, freelancer_id, judul, harga, waktu_pengerjaan FROM layanan LIMIT 3');

    const statuses = ['dibayar', 'dikerjakan', 'selesai'];
    for (let i = 0; i < services.length; i++) {
      const s = services[i];
      const clientId = clients[i % clients.length].id;
      const biayaPlatform = s.harga * 0.1;
      const totalBayar = parseFloat(s.harga) + biayaPlatform;

      await sequelize.query(`
        INSERT INTO pesanan (id, nomor_pesanan, client_id, freelancer_id, layanan_id, judul, deskripsi, harga, biaya_platform, total_bayar, waktu_pengerjaan, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          uuidv4(),
          'ORD-' + Date.now() + '-' + (i + 1),
          clientId,
          s.freelancer_id,
          s.id,
          s.judul,
          'Pesanan untuk ' + s.judul,
          s.harga,
          biayaPlatform,
          totalBayar,
          s.waktu_pengerjaan || 7,
          statuses[i]
        ]
      });
    }
    console.log('   ✅ Pesanan seeded (3 orders)');

    console.log('\n✅ All seeders completed!\n');
  } catch (err) {
    console.error('❌ Error running seeders:', err.message);
    throw err;
  }
}

async function fresh() {
  console.log('🔄 Starting database fresh...\n');
  console.log('━'.repeat(50));

  try {
    // Step 1: Drop all tables
    await dropAllTables();

    // Step 2: Run migrations
    console.log('📦 Running migrations...');
    await runMigrations();

    // Step 3: Run seeders
    await runSeeders();

    console.log('━'.repeat(50));
    console.log('\n🎉 Database fresh completed successfully!\n');
    console.log('📋 Test Credentials (password: Password123!):');
    console.log('━'.repeat(50));
    console.log('👤 Admin:      admin@skillconnect.com');
    console.log('👤 Client:     client@skillconnect.com');
    console.log('👤 Client 2:   client2@skillconnect.com');
    console.log('👤 Freelancer: freelancer@skillconnect.com');
    console.log('👤 Freelancer: freelancer2@skillconnect.com');
    console.log('━'.repeat(50));
    console.log('\n▶️  Run: npm run dev\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Database fresh failed:', err.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fresh();
}

module.exports = { fresh, dropAllTables, runSeeders };
