import { Search } from 'lucide-react';

export default function FAQHero({ searchQuery, setSearchQuery }) {
  return (
    <section className="bg-gradient-to-b from-[#1D375B] to-[#0f1f36] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Pusat Bantuan
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Temukan jawaban untuk pertanyaan yang sering diajukan
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari pertanyaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border-0 focus:ring-2 focus:ring-blue-300 text-gray-900"
          />
        </div>
      </div>
    </section>
  );
}
