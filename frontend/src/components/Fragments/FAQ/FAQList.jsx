import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  // General
  {
    category: 'general',
    question: 'Apa itu SkillConnect?',
    answer: 'SkillConnect adalah platform marketplace yang menghubungkan freelancer berbakat dengan client yang membutuhkan layanan profesional. Kami menyediakan berbagai kategori layanan mulai dari desain, pengembangan web, penulisan konten, hingga konsultasi bisnis.'
  },
  {
    category: 'general',
    question: 'Bagaimana cara kerja SkillConnect?',
    answer: 'Client dapat mencari dan memesan layanan dari freelancer yang tersedia. Setelah pembayaran, freelancer akan mengerjakan pesanan sesuai dengan kesepakatan. Sistem escrow kami menjamin keamanan transaksi untuk kedua belah pihak.'
  },
  {
    category: 'general',
    question: 'Apakah SkillConnect tersedia di seluruh Indonesia?',
    answer: 'Ya! SkillConnect dapat diakses dari seluruh Indonesia. Freelancer dan client dari berbagai kota dapat bergabung dan bertransaksi di platform kami.'
  },
  // Client
  {
    category: 'client',
    question: 'Bagaimana cara memesan layanan?',
    answer: 'Cari layanan yang Anda butuhkan, pilih paket yang sesuai, lakukan pembayaran, dan tunggu freelancer mengerjakan pesanan Anda. Anda akan menerima notifikasi setiap ada update dari freelancer.'
  },
  {
    category: 'client',
    question: 'Bagaimana jika saya tidak puas dengan hasil pekerjaan?',
    answer: 'Anda dapat meminta revisi sesuai dengan jumlah revisi yang termasuk dalam paket. Jika masalah tidak terselesaikan, Anda dapat mengajukan dispute dan tim kami akan membantu menyelesaikannya.'
  },
  {
    category: 'client',
    question: 'Apakah ada biaya untuk client?',
    answer: 'Tidak ada biaya tambahan untuk client. Anda hanya membayar sesuai harga layanan yang tertera. Biaya platform ditanggung oleh freelancer.'
  },
  // Freelancer
  {
    category: 'freelancer',
    question: 'Bagaimana cara mendaftar sebagai freelancer?',
    answer: 'Klik tombol "Daftar Freelancer", lengkapi profil Anda termasuk keahlian, portfolio, dan informasi lainnya. Setelah profil lengkap, Anda dapat mulai membuat layanan.'
  },
  {
    category: 'freelancer',
    question: 'Berapa biaya layanan untuk freelancer?',
    answer: 'SkillConnect mengenakan biaya layanan sebesar 7.5% dari setiap transaksi yang berhasil. Biaya ini sudah termasuk biaya payment gateway.'
  },
  {
    category: 'freelancer',
    question: 'Bagaimana cara menarik saldo?',
    answer: 'Anda dapat menarik saldo kapan saja melalui menu "Tarik Saldo" di dashboard. Dana akan ditransfer ke rekening bank yang Anda daftarkan dalam 1-3 hari kerja.'
  },
  {
    category: 'freelancer',
    question: 'Apa yang harus saya lakukan jika client tidak merespons?',
    answer: 'Jika client tidak merespons dalam waktu yang ditentukan, sistem akan otomatis menyelesaikan pesanan dan melepaskan dana ke Anda setelah periode tertentu.'
  },
  // Payment
  {
    category: 'payment',
    question: 'Metode pembayaran apa saja yang tersedia?',
    answer: 'Kami menerima pembayaran melalui transfer bank (BCA, Mandiri, BNI, BRI), e-wallet (GoPay, OVO, DANA), QRIS, dan kartu kredit/debit (Visa, Mastercard).'
  },
  {
    category: 'payment',
    question: 'Apakah pembayaran saya aman?',
    answer: 'Ya, semua pembayaran dilindungi oleh sistem escrow. Dana Anda akan disimpan dengan aman dan hanya akan dilepaskan ke freelancer setelah Anda menyetujui hasil pekerjaan.'
  },
  {
    category: 'payment',
    question: 'Berapa lama proses refund?',
    answer: 'Proses refund membutuhkan waktu 3-7 hari kerja tergantung metode pembayaran yang digunakan. Anda akan menerima notifikasi ketika refund berhasil diproses.'
  },
  // Account
  {
    category: 'account',
    question: 'Bagaimana cara mengubah password?',
    answer: 'Masuk ke menu Profil > Edit Profil > Keamanan. Di sana Anda dapat mengubah password dengan memasukkan password lama dan password baru.'
  },
  {
    category: 'account',
    question: 'Bagaimana cara menghapus akun?',
    answer: 'Untuk menghapus akun, silakan hubungi tim support kami melalui email. Pastikan tidak ada transaksi yang sedang berjalan sebelum mengajukan penghapusan akun.'
  },
  {
    category: 'account',
    question: 'Apakah saya bisa menjadi client dan freelancer sekaligus?',
    answer: 'Ya! Anda dapat mendaftar sebagai freelancer dan tetap bisa memesan layanan sebagai client. Gunakan fitur "Ganti Role" di menu profil untuk beralih antara mode client dan freelancer.'
  }
];

export default function FAQList({ activeCategory, searchQuery }) {
  const [openFaq, setOpenFaq] = useState(null);

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Tidak ada pertanyaan yang sesuai dengan pencarian Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
