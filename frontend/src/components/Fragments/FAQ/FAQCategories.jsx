const categories = [
  { id: 'all', label: 'Semua' },
  { id: 'general', label: 'Umum' },
  { id: 'client', label: 'Untuk Client' },
  { id: 'freelancer', label: 'Untuk Freelancer' },
  { id: 'payment', label: 'Pembayaran' },
  { id: 'account', label: 'Akun' }
];

export default function FAQCategories({ activeCategory, setActiveCategory }) {
  return (
    <section className="border-b border-gray-200 sticky top-0 bg-white z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[#1D375B] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export { categories };
