export default function FAQContact() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Masih punya pertanyaan?
        </h2>
        <p className="text-gray-600 mb-8">
          Tim support kami siap membantu Anda
        </p>
        <a
          href="mailto:support@skillconnect.com"
          className="inline-flex items-center gap-2 bg-[#1D375B] text-white px-6 py-3 rounded-full hover:bg-[#0f1f36] font-medium transition-colors"
        >
          Hubungi Support
        </a>
      </div>
    </section>
  );
}
