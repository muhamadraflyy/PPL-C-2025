const stats = [
  { value: '10K+', label: 'Freelancer Aktif' },
  { value: '50K+', label: 'Proyek Selesai' },
  { value: '98%', label: 'Tingkat Kepuasan' },
  { value: '24/7', label: 'Support' }
];

export default function AboutStats() {
  return (
    <section className="py-12 bg-white -mt-12 relative z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#1D375B] mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
