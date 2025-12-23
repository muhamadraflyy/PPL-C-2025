export default function AboutMission() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src="/assets/bekerja2.jpg"
              alt="Our mission"
              className="rounded-2xl shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Tentang SkillConnect
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              SkillConnect didirikan dengan visi untuk memberdayakan freelancer Indonesia
              dan menghubungkan mereka dengan peluang kerja yang berkualitas. Kami percaya
              bahwa setiap orang memiliki keahlian unik yang dapat memberikan nilai.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Platform kami dirancang untuk memberikan pengalaman terbaik bagi freelancer
              dan client. Dengan sistem escrow yang aman, proses pembayaran yang transparan,
              dan dukungan tim yang responsif, kami berkomitmen untuk menjadi partner
              terpercaya dalam perjalanan karir Anda.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Bergabunglah dengan ribuan freelancer sukses yang telah membangun karir
              impian mereka bersama SkillConnect.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
