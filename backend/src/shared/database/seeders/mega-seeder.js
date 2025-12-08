require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { sequelize } = require('../connection');
const faker = require('@faker-js/faker').faker;
faker.locale = 'id_ID';

async function megaSeed() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('🚀 Starting MEGA seed - 10 Freelancers + 50 Services...');

    // Generate data arrays
    const freelancerIds = [];
    const freelancers = [];
    const profiles = [];
    const layananIds = [];
    const layanan = [];

    // Kategori yang existing (harus cek dulu dari DB)
    const [kategoris] = await sequelize.query('SELECT id, nama FROM kategori');
    const [subkategoris] = await sequelize.query('SELECT id, nama, id_kategori FROM sub_kategori');
    
    if (kategoris.length === 0) {
      console.log('❌ No categories found! Please seed categories first.');
      process.exit(1);
    }

    // =============================
    // CREATE 10 FREELANCERS
    // =============================
    console.log('→ Creating 10 freelancers...');
    
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

    for (let i = 1; i <= 10; i++) {
      const id = uuidv4();
      freelancerIds.push(id);
      const city = cities[i - 1];
      
      freelancers.push({
        id,
        email: `freelancer${i + 10}@skillconnect.com`,
        password: await bcrypt.hash('Freelancer@2024!', 10),
        role: 'freelancer',
        nama_depan: faker.person.firstName(),
        nama_belakang: faker.person.lastName(),
        no_telepon: `08${faker.string.numeric(10)}`,
        kota: city.kota,
        provinsi: city.provinsi,
        bio: `Professional ${skills[i - 1]} dengan pengalaman ${faker.number.int({ min: 2, max: 8 })} tahun di industri teknologi.`,
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
          institusi: faker.company.name() + ' University',
          jurusan: 'Information Technology',
          tahun: faker.number.int({ min: 2015, max: 2022 })
        }]),
        deskripsi_lengkap: `Saya adalah ${skills[i - 1]} profesional dengan dedikasi tinggi. ${faker.lorem.paragraph()}`,
        total_pekerjaan_selesai: faker.number.int({ min: 5, max: 50 }),
        rating_rata_rata: faker.number.float({ min: 4.0, max: 5.0, precision: 0.1 }),
        total_ulasan: faker.number.int({ min: 3, max: 45 }),
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

    const serviceTypes = [
      // Web Development
      { title: 'Website Company Profile', desc: 'modern dan responsif', price: [1500000, 3000000] },
      { title: 'E-Commerce Website', desc: 'lengkap dengan payment gateway', price: [3000000, 8000000] },
      { title: 'Landing Page', desc: 'conversion-oriented', price: [1000000, 2500000] },
      { title: 'Web Application', desc: 'custom sesuai kebutuhan', price: [5000000, 15000000] },
      { title: 'WordPress Development', desc: 'theme customization', price: [2000000, 5000000] },
      
      // Mobile Development
      { title: 'Android App', desc: 'native development', price: [5000000, 12000000] },
      { title: 'iOS App', desc: 'Swift development', price: [6000000, 15000000] },
      { title: 'Flutter App', desc: 'cross-platform', price: [4000000, 10000000] },
      { title: 'React Native App', desc: 'hybrid mobile app', price: [4500000, 11000000] },
      
      // Design
      { title: 'Logo Design', desc: 'professional branding', price: [500000, 2000000] },
      { title: 'UI/UX Design', desc: 'user-centered design', price: [2000000, 5000000] },
      { title: 'Graphic Design', desc: 'visual communication', price: [750000, 2500000] },
      { title: 'Packaging Design', desc: 'product packaging', price: [1500000, 4000000] },
      { title: 'Social Media Design', desc: 'content creation', price: [500000, 1500000] },
      
      // Digital Marketing
      { title: 'SEO Optimization', desc: 'organic traffic boost', price: [1000000, 3000000] },
      { title: 'Google Ads Campaign', desc: 'PPC management', price: [1500000, 5000000] },
      { title: 'Social Media Marketing', desc: 'engagement strategy', price: [2000000, 6000000] },
      { title: 'Content Marketing', desc: 'content strategy', price: [1500000, 4000000] },
      { title: 'Email Marketing', desc: 'campaign management', price: [1000000, 2500000] },
      
      // Content Creation
      { title: 'Article Writing', desc: 'SEO-friendly content', price: [200000, 800000] },
      { title: 'Video Editing', desc: 'professional editing', price: [500000, 2000000] },
      { title: 'Animation', desc: '2D/3D animation', price: [2000000, 8000000] },
      { title: 'Photography', desc: 'product photography', price: [1000000, 3500000] },
      { title: 'Copywriting', desc: 'persuasive copy', price: [500000, 1500000] }
    ];

    for (let i = 0; i < 50; i++) {
      const serviceType = serviceTypes[i % serviceTypes.length];
      const freelancerId = freelancerIds[i % 10];
      const kategori = kategoris[i % kategoris.length];
      const subkategoriList = subkategoris.filter(s => s.id_kategori === kategori.id);
      const subkategori = subkategoriList.length > 0 
        ? subkategoriList[i % subkategoriList.length] 
        : null;
      
      const price = faker.number.int({ 
        min: serviceType.price[0], 
        max: serviceType.price[1] 
      });

      const title = `${serviceType.title} ${faker.commerce.productAdjective()}`;
      const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');

      layanan.push({
        id: uuidv4(),
        freelancer_id: freelancerId,
        id_kategori: kategori.id,
        subid_kategori: subkategori ? subkategori.id : null,
        title,
        slug: `${slug}-${faker.string.alphanumeric(6)}`,
        deskripsi: `Jasa ${serviceType.title} ${serviceType.desc}. ${faker.lorem.paragraph()}`,
        harga: price,
        waktu_pengerjaan: faker.number.int({ min: 3, max: 30 }),
        batas_revisi: faker.number.int({ min: 1, max: 5 }),
        tags: JSON.stringify([
          serviceType.title.toLowerCase(),
          kategori.nama.toLowerCase(),
          'professional'
        ]),
        galeri: JSON.stringify([
          'https://via.placeholder.com/800x600',
          'https://via.placeholder.com/800x600',
          'https://via.placeholder.com/800x600'
        ]),
        is_verified: true,
        status: 'active',
        rating_rata_rata: faker.number.float({ min: 3.5, max: 5.0, precision: 0.1 }),
        jumlah_rating: faker.number.int({ min: 0, max: 100 }),
        total_pesanan: faker.number.int({ min: 0, max: 200 }),
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Insert layanan
    await queryInterface.bulkInsert('layanan', layanan);
    console.log('✅ Created 50 services');

    console.log('🎉 MEGA seed completed successfully!');
    console.log('📊 Summary:');
    console.log('   - 10 new freelancers with profiles');
    console.log('   - 50 new services across categories');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Run seeder
megaSeed();
