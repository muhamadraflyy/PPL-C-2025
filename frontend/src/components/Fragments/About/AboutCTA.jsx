export default function AboutCTA() {
  return (
    <section className="py-20 bg-gradient-to-b from-[#1D375B] to-[#0f1f36]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Siap Memulai Perjalanan Anda?
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Bergabunglah dengan ribuan freelancer yang telah sukses membangun karir impian mereka
        </p>
        <a href="/register/freelancer" className="inline-block bg-white text-[#1D375B] px-10 py-4 rounded-full hover:bg-gray-100 font-semibold text-lg transition-colors">
          Daftar Gratis Sekarang
        </a>
      </div>
    </section>
  );
}
