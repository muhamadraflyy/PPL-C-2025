import React, { useState } from 'react';
import { FileText, Search, DollarSign, ChevronDown } from 'lucide-react';

export default function HowToWork() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Apakah gratis untuk bergabung sebagai freelancer?",
      answer: "Ya, 100% gratis! Buat profil, cari pekerjaan, dan kelola proyek Anda tanpa biaya di awal. Anda hanya membayar biaya layanan 10% dari penghasilan yang Anda dapatkan dari klien."
    },
    {
      question: "Bisakah saya mengembangkan karir di platform ini?",
      answer: "Tentu saja! Banyak profesional sukses yang memulai karir freelance mereka di sini. Baik Anda pemula atau ahli berpengalaman, komunitas kami yang terdiri dari lebih dari 12 juta freelancer siap mendukung perjalanan karir Anda."
    },
    {
      question: "Apa keuntungan menjadi freelancer di platform ini?",
      answer: "Anda akan mendapatkan kebebasan dan fleksibilitas untuk menjadi bos bagi diri sendiri. Nikmati kesempatan bekerja dengan klien dari seluruh dunia, atur jadwal Anda sendiri, dan kembangkan bisnis sesuai passion Anda."
    },
    {
      question: "Apakah platform ini cocok untuk membangun bisnis?",
      answer: "Sangat cocok! Kami mendukung para profesional untuk berkembang. Anda bisa berkolaborasi dengan freelancer berbakat lainnya, membangun tim, dan mengembangkan agensi Anda sendiri. Ini bisa jadi langkah tepat untuk bisnis Anda."
    },
    {
      question: "Proyek apa saja yang bisa saya temukan?",
      answer: "Beragam! Dari proyek jangka pendek hingga jangka panjang, dengan sistem pembayaran yang mudah. Anda bisa menemukan proyek dari perusahaan teknologi besar hingga startup inovatif."
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl max-w-7xl mx-auto mt-8 mb-16 h-[500px]">
        <img 
          src="/assets/bekerja.jpg" 
          alt="Professional working"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
        <div className="relative p-12 h-full flex flex-col justify-center max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Bekerja sesuai<br />keinginan Anda
          </h1>
          <p className="text-white text-lg mb-8 leading-relaxed">
            Temukan pekerjaan yang tepat untuk Anda,<br />
            dengan klien berkualitas di marketplace terbaik.
          </p>
          <div>
            <a href='/register/freelancer' className="bg-gradient-to-b from-[#1D375B] to-[#0f1f36] text-white px-8 py-3 rounded-full hover:opacity-90 font-medium transition-opacity">
              Mulai Sekarang
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-12 py-12 sm:px-6 lg:px-8 mb-24 bg-gradient-to-b from-[#1D375B] to-[#0f1f36] rounded-xl">
        <h2 className="text-4xl font-bold text-white mb-16">Cara Kerjanya</h2>
        
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <div className="mb-6">
              <FileText className="w-12 h-12 text-white" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              Buat profil Anda<br />(100% Gratis)
            </h3>
            <p className="text-white mb-4">
              Tampilkan keahlian dan pengalaman Anda dalam beberapa menit saja. Buat profil yang menarik dengan portofolio,  dan skill untuk memperlihatkan di antara jutaan freelancer lainnya.
            </p>
            <a href="#" className="text-blue-300 font-medium hover:underline">Buat profil</a>
          </div>

          <div>
            <div className="mb-6">
              <Search className="w-12 h-12 text-white" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              Jelajahi cara<br />menghasilkan
            </h3>
            <p className="text-white mb-4">
              Telusuri ribuan proyek di Talent Marketplace™ yang sesuai dengan keahlian Anda. Biarkan klien menemukan Anda melalui produk yang anda promosikan. Pilihan ada di tangan Anda.
            </p>
          </div>

          <div>
            <div className="mb-6">
              <DollarSign className="w-12 h-12 text-white" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              Dibayar dengan<br />aman
            </h3>
            <p className="text-white mb-4">
              Pilih metode pembayaran favorit Anda dan bekerja dengan tenang. Semua pembayaran dijamin aman melalui sistem escrow kami. Fokus pada pekerjaan, biarkan kami yang mengurus keamanan transaksi.
            </p>
          </div>
        </div>
      </section>

      {/* Explore Ways to Earn */}
      <section className="max-w-7xl mx-auto mb-24">
        <h2 className="text-3xl font-bold text-gray-900 mb-16">Jelajahi berbagai cara menghasilkan</h2>
        
        {/* Find Your Next Opportunity */}
        <div className="bg-gradient-to-b from-[#1D375B] to-[#0f1f36] rounded-3xl p-12 mb-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-4xl font-bold text-white mb-6">
              Temukan peluang<br />terbaik Anda
            </h3>
            <p className="text-white mb-8 leading-relaxed">
              Cari proyek di Talent Marketplace™. Tentukan rate Anda, dan tunjukkan mengapa Anda kandidat terbaik. Berikan sentuhan unik yang membuat klien memilih Anda.
            </p>
            <a href='/services' className="bg-blue-300 text-gray-900 hover:text-white px-6 py-3 rounded-full hover:bg-blue-400 font-medium">
              Cari pekerjaan
            </a>
          </div>
          <div>
            <img 
              src="/assets/bekerja2.jpg" 
              alt="Person working on laptop"
              className="rounded-2xl shadow-lg w-full"
            />
          </div>
        </div>

        {/* Sell What You Do Best */}
        <div className="bg-gradient-to-b from-[#1D375B] to-[#0f1f36] rounded-3xl p-12 grid md:grid-cols-2 gap-12 items-center">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <img 
                src="/assets/copywriting.jpg" 
                alt="Blog Posts"
                className="rounded-lg mb-3 w-full h-32 object-cover"
              />
              <p className="text-sm text-gray-700 mb-1">Copywriting</p>
              <p className="font-semibold text-gray-900">Artikel Blog</p>
              <p className="text-sm text-gray-700">Mulai Rp 3.500.000</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <img 
                src="/assets/design.jpg" 
                alt="Design Website"
                className="rounded-lg mb-3 w-full h-32 object-cover"
              />
              <p className="text-sm text-gray-700 mb-1">Web Design</p>
              <p className="font-semibold text-gray-900">Website WordPress</p>
              <p className="text-sm text-gray-700">Mulai Rp 4.200.000</p>
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-white mb-6">
              Jual keahlian<br />terbaik Anda
            </h3>
            <p className="text-white mb-8 leading-relaxed">
              Buat Project Catalog™ gratis dan pamerkan layanan Anda. Buat paket layanan yang mudah ditemukan klien, mulai dari desain, coding, hingga konten. Klien tinggal pilih, bayar, dan proyek dimulai!
            </p>
            <a href='/services' className="bg-blue-300 text-gray-900 px-6 py-3 rounded-full hover:bg-blue-400 hover:text-white font-medium">
              Lihat katalog Produk
            </a>
          </div>
        </div>
      </section>

      {/* How Payments Work */}
      <section className="bg-gradient-to-b from-[#1D375B] to-[#0f1f36] max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 mb-24 rounded-xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img 
              src="/assets/payment.jpg" 
              alt="Team meeting"
              className="rounded-3xl shadow-lg w-full"
            />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-white mb-8">Cara kerja pembayaran</h2>
            <p className="text-white mb-8">
              Semua pekerjaan dan pembayaran Anda dikelola dengan aman di platform kami.
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Semua dalam satu tempat</h3>
                <p className="text-white">
                  Kontrak, pembayaran, dan komunikasi semuanya terpusat dalam satu platform untuk pengalaman yang praktis dan efisien.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Pilih metode pembayaran Anda</h3>
                <p className="text-white">
                  Gunakan metode yang paling nyaman untuk Anda—transfer bank lokal, QRIS, Visa dan Metode Pembayaran lainnya.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Tanpa biaya sampai pekerjaan selesai</h3>
                <p className="text-white mb-4">
                  Anda hanya membayar biaya layanan 10% dari penghasilan yang Anda dapatkan. Tanpa biaya tersembunyi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gradient-to-b from-[#1D375B] to-[#0f1f36] max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 mb-24 rounded-xl">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-white sticky top-8">
              Pertanyaan yang<br />sering diajukan
            </h2>
          </div>
          
          <div className="md:col-span-2 space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-start text-left"
                >
                  <h3 className="text-xl font-semibold text-white pr-4">
                    {faq.question}
                  </h3>
                  <ChevronDown 
                    className={`w-6 h-6 text-white flex-shrink-0 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="mt-4">
                    <p className="text-white leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}