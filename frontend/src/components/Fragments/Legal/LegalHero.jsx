export default function LegalHero({ title, lastUpdated = "Desember 2025" }) {
  return (
    <section className="bg-gradient-to-b from-[#1D375B] to-[#0f1f36] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {title}
        </h1>
        <p className="text-gray-300">
          Terakhir diperbarui: {lastUpdated}
        </p>
      </div>
    </section>
  );
}
