const privacySections = [
  {
    title: '1. Informasi yang Kami Kumpulkan',
    content: [
      {
        subtitle: 'Informasi yang Anda Berikan',
        items: [
          'Data pendaftaran: nama, email, nomor telepon, password',
          'Data profil: foto, bio, keahlian, portfolio',
          'Data pembayaran: informasi rekening bank untuk pencairan dana',
          'Konten yang Anda unggah: deskripsi layanan, gambar, dokumen'
        ]
      },
      {
        subtitle: 'Informasi yang Dikumpulkan Otomatis',
        items: [
          'Data penggunaan: halaman yang dikunjungi, fitur yang digunakan',
          'Data perangkat: jenis browser, sistem operasi, alamat IP',
          'Cookies dan teknologi pelacakan serupa',
          'Data lokasi umum berdasarkan alamat IP'
        ]
      }
    ]
  },
  {
    title: '2. Penggunaan Informasi',
    content: [
      {
        subtitle: 'Kami menggunakan informasi Anda untuk:',
        items: [
          'Menyediakan, memelihara, dan meningkatkan layanan platform',
          'Memproses transaksi dan mengirim notifikasi terkait',
          'Menghubungkan freelancer dengan client yang sesuai',
          'Mengirim informasi penting tentang layanan dan pembaruan',
          'Mendeteksi dan mencegah penipuan atau aktivitas mencurigakan',
          'Meningkatkan pengalaman pengguna melalui analisis data'
        ]
      }
    ]
  },
  {
    title: '3. Berbagi Informasi',
    content: [
      {
        subtitle: 'Kami dapat membagikan informasi Anda dengan:',
        items: [
          'Pengguna lain sesuai dengan pengaturan privasi profil Anda',
          'Penyedia layanan pihak ketiga yang membantu operasional platform',
          'Mitra pembayaran untuk memproses transaksi',
          'Pihak berwenang jika diwajibkan oleh hukum',
          'Pihak lain dengan persetujuan Anda'
        ]
      },
      {
        subtitle: 'Kami TIDAK akan:',
        items: [
          'Menjual data pribadi Anda kepada pihak ketiga',
          'Membagikan informasi sensitif tanpa persetujuan Anda',
          'Menggunakan data Anda untuk tujuan yang tidak disebutkan dalam kebijakan ini'
        ]
      }
    ]
  },
  {
    title: '4. Keamanan Data',
    content: [
      {
        subtitle: 'Langkah-langkah keamanan yang kami terapkan:',
        items: [
          'Enkripsi SSL/TLS untuk semua transmisi data',
          'Penyimpanan password dengan algoritma hashing yang aman',
          'Audit keamanan berkala',
          'Pembatasan akses karyawan ke data pribadi',
          'Pemantauan sistem 24/7 untuk mendeteksi ancaman'
        ]
      }
    ]
  },
  {
    title: '5. Hak Anda',
    content: [
      {
        subtitle: 'Sebagai pengguna, Anda memiliki hak untuk:',
        items: [
          'Mengakses data pribadi yang kami simpan tentang Anda',
          'Memperbarui atau mengoreksi informasi yang tidak akurat',
          'Meminta penghapusan akun dan data Anda',
          'Menolak penggunaan data untuk pemasaran',
          'Mengunduh salinan data Anda',
          'Mengajukan keluhan kepada otoritas perlindungan data'
        ]
      }
    ]
  },
  {
    title: '6. Cookies',
    content: [
      {
        subtitle: 'Kami menggunakan cookies untuk:',
        items: [
          'Menjaga sesi login Anda tetap aktif',
          'Mengingat preferensi Anda',
          'Menganalisis penggunaan platform',
          'Menyediakan konten yang dipersonalisasi'
        ]
      },
      {
        subtitle: 'Pengaturan Cookies:',
        items: [
          'Anda dapat mengatur browser untuk menolak cookies',
          'Beberapa fitur mungkin tidak berfungsi tanpa cookies',
          'Kami menggunakan cookies pihak ketiga untuk analitik'
        ]
      }
    ]
  },
  {
    title: '7. Penyimpanan Data',
    content: [
      {
        subtitle: 'Kebijakan retensi data:',
        items: [
          'Data akun aktif disimpan selama akun Anda aktif',
          'Data transaksi disimpan sesuai kewajiban hukum (minimal 5 tahun)',
          'Setelah penghapusan akun, data dihapus dalam 30 hari',
          'Backup data disimpan untuk periode terbatas untuk keperluan pemulihan'
        ]
      }
    ]
  },
  {
    title: '8. Transfer Data Internasional',
    content: [
      {
        subtitle: '',
        items: [
          'Data Anda mungkin disimpan di server yang berlokasi di luar Indonesia',
          'Kami memastikan penyedia layanan memenuhi standar perlindungan data yang memadai',
          'Transfer data dilakukan sesuai dengan peraturan yang berlaku'
        ]
      }
    ]
  },
  {
    title: '9. Kebijakan untuk Anak-anak',
    content: [
      {
        subtitle: '',
        items: [
          'Layanan kami tidak ditujukan untuk anak di bawah 18 tahun',
          'Kami tidak dengan sengaja mengumpulkan data dari anak-anak',
          'Jika kami mengetahui ada data anak yang terkumpul, kami akan segera menghapusnya'
        ]
      }
    ]
  },
  {
    title: '10. Perubahan Kebijakan',
    content: [
      {
        subtitle: '',
        items: [
          'Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu',
          'Perubahan signifikan akan diberitahukan melalui email atau notifikasi platform',
          'Penggunaan berkelanjutan setelah perubahan berarti Anda menyetujui kebijakan baru'
        ]
      }
    ]
  }
];

export default function PrivacyContent() {
  return (
    <section className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8 leading-relaxed">
            SkillConnect ("kami", "kita", atau "platform") berkomitmen untuk melindungi
            privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan,
            menggunakan, mengungkapkan, dan melindungi informasi pribadi Anda saat menggunakan
            layanan kami.
          </p>

          {privacySections.map((section, index) => (
            <div key={index} className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>
              {section.content.map((subsection, subIndex) => (
                <div key={subIndex} className="mb-4">
                  {subsection.subtitle && (
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {subsection.subtitle}
                    </h3>
                  )}
                  <ul className="space-y-2">
                    {subsection.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-600 flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
