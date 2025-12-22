const termsSections = [
  {
    title: '1. Ketentuan Umum',
    content: [
      'Dengan mengakses dan menggunakan platform SkillConnect, Anda menyetujui untuk terikat dengan Syarat dan Ketentuan ini.',
      'SkillConnect berhak untuk mengubah, memodifikasi, menambah, atau menghapus bagian dari Syarat dan Ketentuan ini kapan saja.',
      'Pengguna bertanggung jawab untuk secara berkala memeriksa perubahan pada Syarat dan Ketentuan.',
      'Platform ini hanya boleh digunakan oleh pengguna yang berusia minimal 18 tahun atau telah mendapatkan persetujuan dari orang tua/wali.'
    ]
  },
  {
    title: '2. Akun Pengguna',
    content: [
      'Pengguna wajib memberikan informasi yang akurat, lengkap, dan terkini saat mendaftar.',
      'Pengguna bertanggung jawab untuk menjaga kerahasiaan password dan informasi akun.',
      'Pengguna bertanggung jawab atas semua aktivitas yang terjadi di akun mereka.',
      'SkillConnect berhak menangguhkan atau menghapus akun yang melanggar Syarat dan Ketentuan.'
    ]
  },
  {
    title: '3. Layanan Platform',
    content: [
      'SkillConnect menyediakan platform untuk menghubungkan freelancer dengan client.',
      'SkillConnect tidak bertanggung jawab atas kualitas layanan yang diberikan oleh freelancer.',
      'Semua transaksi antar pengguna dilakukan melalui sistem escrow SkillConnect.',
      'SkillConnect berhak mengenakan biaya layanan sesuai dengan ketentuan yang berlaku.'
    ]
  },
  {
    title: '4. Kewajiban Freelancer',
    content: [
      'Freelancer wajib memberikan layanan sesuai dengan deskripsi yang tercantum.',
      'Freelancer wajib menyelesaikan pekerjaan sesuai dengan tenggat waktu yang disepakati.',
      'Freelancer wajib menjaga komunikasi yang baik dengan client.',
      'Freelancer dilarang melakukan transaksi di luar platform SkillConnect.',
      'Freelancer wajib memastikan hasil kerja bebas dari plagiarisme dan pelanggaran hak cipta.'
    ]
  },
  {
    title: '5. Kewajiban Client',
    content: [
      'Client wajib memberikan brief yang jelas dan lengkap untuk setiap pesanan.',
      'Client wajib melakukan pembayaran sesuai dengan harga yang telah disepakati.',
      'Client wajib memberikan feedback yang konstruktif dan objektif.',
      'Client dilarang meminta kontak pribadi freelancer untuk transaksi di luar platform.'
    ]
  },
  {
    title: '6. Pembayaran dan Biaya',
    content: [
      'Semua pembayaran dilakukan melalui sistem pembayaran SkillConnect.',
      'Client membayar penuh di muka, dana akan ditahan dalam sistem escrow.',
      'Dana akan dilepaskan ke freelancer setelah client menyetujui hasil pekerjaan.',
      'Biaya layanan platform sebesar 7.5% dikenakan kepada freelancer dari setiap transaksi.',
      'Biaya payment gateway sebesar 2.5% ditanggung oleh platform.'
    ]
  },
  {
    title: '7. Penyelesaian Sengketa',
    content: [
      'Jika terjadi sengketa, pengguna diharapkan menyelesaikan secara kekeluargaan terlebih dahulu.',
      'Jika tidak tercapai kesepakatan, pengguna dapat mengajukan dispute melalui fitur yang disediakan.',
      'Tim SkillConnect akan meninjau dan memberikan keputusan berdasarkan bukti yang diberikan.',
      'Keputusan SkillConnect dalam penyelesaian sengketa bersifat final dan mengikat.'
    ]
  },
  {
    title: '8. Refund dan Pembatalan',
    content: [
      'Pembatalan pesanan dapat dilakukan sebelum freelancer memulai pekerjaan dengan refund penuh.',
      'Pembatalan setelah pekerjaan dimulai akan dikenakan biaya sesuai dengan progress pekerjaan.',
      'Refund akan diproses dalam waktu 3-7 hari kerja.',
      'SkillConnect berhak menolak refund jika terbukti ada penyalahgunaan.'
    ]
  },
  {
    title: '9. Konten dan Hak Kekayaan Intelektual',
    content: [
      'Pengguna mempertahankan hak atas konten yang mereka unggah ke platform.',
      'Dengan mengunggah konten, pengguna memberikan lisensi kepada SkillConnect untuk menampilkannya.',
      'Pengguna dilarang mengunggah konten yang melanggar hak cipta pihak lain.',
      'Hak atas hasil kerja berpindah ke client setelah pembayaran selesai, kecuali disepakati lain.'
    ]
  },
  {
    title: '10. Larangan',
    content: [
      'Dilarang menggunakan platform untuk aktivitas ilegal atau melanggar hukum.',
      'Dilarang menyebarkan konten yang mengandung SARA, pornografi, atau kekerasan.',
      'Dilarang melakukan spam atau penyalahgunaan fitur platform.',
      'Dilarang membuat akun palsu atau menggunakan identitas orang lain.',
      'Dilarang melakukan manipulasi rating atau review.'
    ]
  },
  {
    title: '11. Batasan Tanggung Jawab',
    content: [
      'SkillConnect tidak bertanggung jawab atas kerugian yang timbul dari penggunaan platform.',
      'SkillConnect tidak menjamin ketersediaan platform secara terus-menerus.',
      'SkillConnect tidak bertanggung jawab atas tindakan pengguna lain.',
      'Tanggung jawab maksimum SkillConnect terbatas pada jumlah biaya layanan yang dibayarkan.'
    ]
  },
  {
    title: '12. Hukum yang Berlaku',
    content: [
      'Syarat dan Ketentuan ini diatur oleh hukum Republik Indonesia.',
      'Setiap sengketa yang timbul akan diselesaikan melalui pengadilan yang berwenang di Indonesia.',
      'Jika ada ketentuan yang dianggap tidak berlaku, ketentuan lainnya tetap berlaku.'
    ]
  }
];

export default function TermsContent() {
  return (
    <section className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8 leading-relaxed">
            Selamat datang di SkillConnect. Syarat dan Ketentuan ini mengatur penggunaan Anda
            atas platform SkillConnect dan layanan yang kami sediakan. Mohon baca dengan seksama
            sebelum menggunakan layanan kami.
          </p>

          {termsSections.map((section, index) => (
            <div key={index} className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>
              <ul className="space-y-2">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-gray-600 flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
