import React from 'react';
import { FaClock, FaSync, FaShieldAlt, FaHeadset, FaStar, FaRegStar } from 'react-icons/fa';

// Helper Warna & Label (TETAP SAMA)
const getStatusColor = (status) => {
  switch(status?.toLowerCase()) {
    case 'selesai': return 'bg-green-100 text-green-800 border-green-200';
    case 'dikerjakan': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'menunggu_pembayaran': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'dibatalkan': return 'bg-red-100 text-red-800 border-red-200';
    case 'dibayar': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const ClientOrderCard = ({ order, onClick, onReviewClick }) => {
  if (!order) return null;

  const getFreelancerName = () => {
      const f = order?.freelancer;
      if (f && typeof f === 'object') return `${f.nama_depan || ''} ${f.nama_belakang || ''}`;
      return f || order?.freelancerName || 'Unknown';
  };

  // Handler Klik Tombol Ulasan
  const handleReviewBtnClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onReviewClick) onReviewClick(order);
  };

  // LOGIKA PENTING: Cek apakah statusnya selesai
  const isCompleted = order?.status?.toLowerCase() === 'selesai';

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all mb-6 relative group">

      {/* Header & Harga (TIDAK BERUBAH) */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <div>
            <p className="text-sm text-gray-500 mb-1">Nomor Pesanan: {order?.orderId || order?.id}</p>
            <h4 onClick={onClick} className="font-bold text-gray-900 text-2xl mb-2 cursor-pointer hover:text-blue-600 transition-colors">
                {order?.title || order?.serviceName}
            </h4>
            <p className="text-sm text-gray-500 mb-1">Dibuat pada {order?.date || '-'}</p>
            <p className="text-sm text-gray-500">Freelancer: <span className="font-semibold text-gray-900">{getFreelancerName()}</span></p>
        </div>
        <div className="flex flex-col items-end">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase ${getStatusColor(order?.status)}`}>
                {order?.status}
            </span>
            <p className="text-sm text-gray-500 mt-2 text-right">Total: Rp {order?.totalPrice?.toLocaleString('id-ID') || 0}</p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-xs font-bold text-gray-500 mb-1 tracking-wider uppercase">HARGA</p>
        <h3 className="text-4xl font-extrabold text-blue-600 mb-2">Rp {order?.price?.toLocaleString('id-ID') || 0}</h3>
        <div className="flex items-center text-yellow-400 text-sm">
          <FaRegStar /><FaRegStar /><FaRegStar /><FaRegStar /><FaRegStar />
          <span className="text-gray-500 ml-2 font-medium">0.0 • 0 reviews</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6 mb-8 space-y-5">
         <div className="flex items-center gap-3 text-gray-700"><FaClock className="text-blue-500 text-lg" /> <span className="font-medium">Estimasi: {order?.workDuration}</span></div>
         <div className="flex items-center gap-3 text-gray-700"><FaSync className="text-blue-500 text-lg" /> <span className="font-medium">Revisi: {order?.revision}</span></div>
         <div className="flex items-center gap-3 text-gray-700"><FaShieldAlt className="text-blue-500 text-lg" /> <span className="font-medium">Pembayaran dilindungi platform</span></div>
         <div className="flex items-center gap-3 text-gray-700"><FaHeadset className="text-blue-500 text-lg" /> <span className="font-medium">Didukung customer servis 24/7</span></div>
      </div>

      {/* --- BAGIAN TOMBOL --- */}
      <div className="flex flex-col gap-3">
        {isCompleted ? (
          // JIKA SELESAI -> CEK APAKAH SUDAH DIREVIEW
          order.hasReview ? (
            // SUDAH DIREVIEW -> TOMBOL DISABLED/INFO
            <button
              type="button"
              disabled
              className="w-full py-4 bg-gray-200 text-gray-600 font-bold text-lg rounded-xl flex justify-center items-center gap-2 shadow-sm cursor-not-allowed"
            >
              <FaStar className="text-xl text-yellow-500" /> Sudah Diulas
            </button>
          ) : (
            // BELUM DIREVIEW -> TOMBOL HIJAU AKTIF
            <button
              type="button"
              onClick={handleReviewBtnClick}
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl flex justify-center items-center gap-2 shadow-sm transition-colors"
            >
              <FaStar className="text-xl" /> Berikan Ulasan
            </button>
          )
        ) : (
          // JIKA TIDAK SELESAI -> MUNCUL TOMBOL BIRU & GRAY (Default Teman)
          <>
            <button className="w-full py-4 bg-[#1E293B] hover:bg-[#0f172a] text-white font-bold text-lg rounded-xl transition-colors">
                Pesan Sekarang
            </button>
            <button className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-lg rounded-xl transition-colors border border-gray-200">
                Hubungi Freelancer
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default ClientOrderCard;