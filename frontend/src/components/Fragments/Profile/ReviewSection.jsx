import React from 'react';
import ReviewCard from './ReviewCard';

// Data Dummy persis seperti di screenshot
const reviews = [
  {
    id: 1,
    name: "Albert",
    company: "Perusahaan Pemasaran Verizon",
    date: "Agustus 17, 2025",
    comment: "Pekerjaan yang bagus dengan komunikasi yang jelas dan pengiriman tepat waktu.",
    rating: 4.0,
  },
  {
    id: 2,
    name: "Jason S.",
    company: "Perusahaan Pemasaran Verizon",
    date: "Agustus 17, 2025",
    comment: "Seperti biasa, bekerja sama dengan Jason selalu menyenangkan, dan saya yakin akan mempekerjakannya lagi di masa depan!",
    rating: 5.0,
  }
];

const ReviewSection = () => {
  return (
    <div className="mt-8"> {/* Margin top agar berjarak dari elemen atasnya */}
      
      {/* Grid Cards - 2 Kolom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Pagination - Persis seperti screenshot */}
      <div className="flex items-center justify-end gap-2 text-sm font-medium text-gray-500">
        <button className="hover:text-gray-900 flex items-center gap-1 disabled:opacity-50 mr-4 text-gray-400">
          ← Sebelumnya
        </button>
        
        {/* Angka Pagination */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-900 text-white shadow-md transition-transform hover:scale-105">
            1
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            2
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            3
        </button>
        <span className="flex items-end px-1 pb-2">...</span>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            10
        </button>

        <button className="hover:text-gray-900 flex items-center gap-1 text-gray-800 font-bold ml-4">
          Selanjutnya →
        </button>
      </div>
    </div>
  );
};

export default ReviewSection;