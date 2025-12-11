import React from 'react';

const StarRating = ({ rating }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          viewBox="0 0 24 24"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
};

const ReviewCard = ({ review }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-full relative hover:shadow-md transition-shadow duration-200">
      {/* Bagian Atas: Avatar & Info */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Nama & Perusahaan */}
        <div className="flex-grow">
            <h4 className="font-bold text-gray-900 text-lg leading-tight">{review.name}</h4>
            <p className="text-gray-500 text-sm mt-1">{review.company}</p>
        </div>

        {/* Tanggal (Pojok Kanan Atas) */}
        <span className="text-gray-400 text-xs font-medium absolute top-6 right-6">
            {review.date}
        </span>
      </div>

      {/* Bagian Tengah: Komentar */}
      <div className="mb-6">
        <p className="text-gray-800 font-medium leading-relaxed text-sm">
          "{review.comment}"
        </p>
      </div>

      {/* Bagian Bawah: Rating & Tombol */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} />
          <span className="text-gray-900 font-bold text-sm ml-1">{review.rating.toFixed(1)}</span>
        </div>
        
        <button className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full transition-colors shadow-sm">
          Laporkan
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;