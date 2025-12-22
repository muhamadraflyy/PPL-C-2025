export default function PaymentCTA() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Siap Memulai?
        </h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Bergabunglah dengan ribuan client dan freelancer yang sudah mempercayai sistem pembayaran SkillConnect
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/services" className="bg-[#1D375B] text-white px-8 py-3 rounded-full hover:bg-[#0f1f36] font-medium transition-colors">
            Cari Layanan
          </a>
          <a href="/register/freelancer" className="bg-white text-[#1D375B] border border-[#1D375B] px-8 py-3 rounded-full hover:bg-gray-50 font-medium transition-colors">
            Daftar Freelancer
          </a>
        </div>
      </div>
    </section>
  );
}
