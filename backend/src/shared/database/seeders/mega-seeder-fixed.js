require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { sequelize } = require('../connection');

async function megaSeed() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('🚀 Starting MEGA seed - 10 Freelancers + 50 Services...');

    // =============================
    // CREATE 10 FREELANCERS
    // =============================
    console.log('→ Creating 10 freelancers...');
    
    const freelancerIds = [];
    const freelancers = [];
    const profiles = [];

    const skills = [
      'UI/UX Designer', 'Full Stack Developer', 'Mobile Developer',
      'Graphic Designer', 'Content Writer', 'Video Editor',
      'Digital Marketer', 'Data Analyst', 'WordPress Developer',
      'SEO Specialist'
    ];

    const cities = [
      { kota: 'Jakarta', provinsi: 'DKI Jakarta' },
      { kota: 'Bandung', provinsi: 'Jawa Barat' },
      { kota: 'Surabaya', provinsi: 'Jawa Timur' },
      { kota: 'Yogyakarta', provinsi: 'DI Yogyakarta' },
      { kota: 'Denpasar', provinsi: 'Bali' },
      { kota: 'Medan', provinsi: 'Sumatera Utara' },
      { kota: 'Semarang', provinsi: 'Jawa Tengah' },
      { kota: 'Malang', provinsi: 'Jawa Timur' },
      { kota: 'Tangerang', provinsi: 'Banten' },
      { kota: 'Bekasi', provinsi: 'Jawa Barat' }
    ];

    const firstNames = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gilang', 'Hana', 'Irfan', 'Joko'];
    const lastNames = ['Pratama', 'Santoso', 'Wijaya', 'Kusuma', 'Permadi', 'Saputra', 'Wibowo', 'Ramadan', 'Setiawan', 'Nugroho'];

    for (let i = 1; i <= 10; i++) {
      const id = uuidv4();
      freelancerIds.push(id);
      const city = cities[i - 1];
      
      freelancers.push({
        id,
        email: `freelancer${i + 20}@skillconnect.com`,
        password: await bcrypt.hash('Freelancer@2024!', 10),
        role: 'freelancer',
        nama_depan: firstNames[i - 1],
        nama_belakang: lastNames[i - 1],
        no_telepon: `08${1000000000 + Math.floor(Math.random() * 8999999999)}`,
        kota: city.kota,
        provinsi: city.provinsi,
        bio: `Professional ${skills[i - 1]} dengan pengalaman ${Math.floor(Math.random() * 5) + 2} tahun di industri teknologi.`,
        is_active: true,
        is_verified: true,
        email_verified_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      profiles.push({
        id: uuidv4(),
        user_id: id,
        judul_profesi: skills[i - 1],
        keahlian: JSON.stringify([
          skills[i - 1],
          'Problem Solving',
          'Team Work',
          'Communication'
        ]),
        bahasa: JSON.stringify(['Indonesia', 'English']),
        edukasi: JSON.stringify([{
          institusi: 'Universitas Indonesia',
          jurusan: 'Information Technology',
          tahun: 2015 + Math.floor(Math.random() * 7)
        }]),
        deskripsi_lengkap: `Saya adalah ${skills[i - 1]} profesional dengan dedikasi tinggi dalam memberikan layanan terbaik.`,
        total_pekerjaan_selesai: Math.floor(Math.random() * 45) + 5,
        rating_rata_rata: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1),
        total_ulasan: Math.floor(Math.random() * 42) + 3,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Insert freelancers
    await queryInterface.bulkInsert('users', freelancers);
    await queryInterface.bulkInsert('profil_freelancer', profiles);
    console.log('✅ Created 10 freelancers with profiles');

    // =============================
    // CREATE 50 SERVICES
    // =============================
    console.log('→ Creating 50 services...');

    // Get existing categories
    const [kategoris] = await sequelize.query('SELECT id, nama FROM kategori');
    if (kategoris.length === 0) {
      console.log('❌ No categories found! Please seed categories first.');
      process.exit(1);
    }

    const layanan = [];
    const serviceTypes = [
      { judul: 'Website Company Profile', desc: 'modern dan responsif', price: [1500000, 3000000] },
      { judul: 'E-Commerce Website', desc: 'lengkap dengan payment gateway', price: [3000000, 8000000] },
      { judul: 'Landing Page', desc: 'conversion-oriented', price: [1000000, 2500000] },
      { judul: 'Web Application', desc: 'custom sesuai kebutuhan', price: [5000000, 15000000] },
      { judul: 'WordPress Development', desc: 'theme customization', price: [2000000, 5000000] },
      { judul: 'Android App', desc: 'native development', price: [5000000, 12000000] },
      { judul: 'iOS App', desc: 'Swift development', price: [6000000, 15000000] },
      { judul: 'Flutter App', desc: 'cross-platform', price: [4000000, 10000000] },
      { judul: 'Logo Design', desc: 'professional branding', price: [500000, 2000000] },
      { judul: 'UI/UX Design', desc: 'user-centered design', price: [2000000, 5000000] }
    ];

    const adjectives = ['Premium', 'Professional', 'Modern', 'Elegant', 'Creative', 'Innovative', 'Custom', 'Responsive', 'Dynamic', 'Exclusive'];

    for (let i = 0; i < 50; i++) {
      const serviceType = serviceTypes[i % serviceTypes.length];
      const freelancerId = freelancerIds[i % 10];
      const kategori = kategoris[i % kategoris.length];
      const adjective = adjectives[i % adjectives.length];
      
      const price = Math.floor(Math.random() * (serviceType.price[1] - serviceType.price[0]) + serviceType.price[0]);
      const judul = `${serviceType.judul} ${adjective}`;
      const slug = judul.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Math.random().toString(36).substring(2, 8);

      layanan.push({
        id: uuidv4(),
        freelancer_id: freelancerId,
        kategori_id: kategori.id,
        judul,
        slug,
        deskripsi: `Jasa ${serviceType.judul} ${serviceType.desc}. Saya menawarkan layanan berkualitas tinggi dengan hasil memuaskan.`,
        harga: price,
        waktu_pengerjaan: Math.floor(Math.random() * 27) + 3,
        batas_revisi: Math.floor(Math.random() * 4) + 1,
        thumbnail: 'https://via.placeholder.com/400x300',
        gambar: JSON.stringify([
          'https://via.placeholder.com/800x600',
          'https://via.placeholder.com/800x600',
          'https://via.placeholder.com/800x600'
        ]),
        status: 'aktif',
        rating_rata_rata: (Math.random() * (5.0 - 3.5) + 3.5).toFixed(2),
        jumlah_rating: Math.floor(Math.random() * 100),
        total_pesanan: Math.floor(Math.random() * 200),
        jumlah_dilihat: Math.floor(Math.random() * 1000),
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Insert layanan
    await queryInterface.bulkInsert('layanan', layanan);
    console.log('✅ Created 50 services');

    console.log('🎉 MEGA seed completed successfully!');
    console.log('📊 Summary:');
    console.log('   - 10 new freelancers: freelancer11@skillconnect.com to freelancer20@skillconnect.com');
    console.log('   - Password: Freelancer@2024!');
    console.log('   - 50 new services across categories');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Run seeder
megaSeed();
