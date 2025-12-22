export default function AboutHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-gradient-to-b from-[#1D375B] to-[#0f1f36] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Bergabung dengan<br />Komunitas Freelancer<br />Terbaik Indonesia
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                SkillConnect menghubungkan talenta terbaik dengan peluang tak terbatas.
                Wujudkan potensi Anda bersama kami.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="/register/freelancer" className="bg-white text-[#1D375B] px-8 py-3 rounded-full hover:bg-gray-100 font-medium text-center transition-colors">
                  Daftar Sekarang
                </a>
                <a href="/services" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full hover:bg-white/10 font-medium text-center transition-colors">
                  Lihat Layanan
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="/assets/bekerja.jpg"
                alt="Working together"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
