import React, { useState, useEffect } from 'react';
// Import konfigurasi API
import api from '../../../utils/axiosConfig'; 

// Sub-komponen Bintang
const StarRating = ({ currentRating, setRating }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex gap-1">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                const isActive = ratingValue <= (hover || currentRating);
                return (
                    <svg
                        key={index}
                        className="cursor-pointer transition-colors duration-200 w-8 h-8"
                        fill={isActive ? "#FBBF24" : "#E5E7EB"} 
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        onMouseEnter={() => setHover(ratingValue)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(ratingValue)}
                    >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                );
            })}
        </div>
    );
};

export default function ReviewModal({ isOpen, onClose, order }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRating(0); 
            setComment('');
            setIsSubmitting(false);
            setIsSuccess(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            alert("Mohon berikan penilaian bintang terlebih dahulu!");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Cek Data Order
            if (!order || !order.id) {
                throw new Error("ID Pesanan tidak ditemukan pada data.");
            }

            // 2. Siapkan Payload
            const payload = {
                pesanan_id: order.id,       
                rating: rating,             
                judul: order.title || order.judul || "Ulasan Pesanan", 
                komentar: comment,          
                gambar: []                
            };

            console.log("Mencoba mengirim data:", payload); 

            // 3. Kirim ke Backend
            const response = await api.post('/reviews', payload);

            console.log("Sukses:", response);
            setIsSuccess(true); 

        } catch (error) {
            console.error("ERROR DETAIL:", error);
            
            const pesanServer = error.response?.data?.message || error.message || "Unknown Error";
            const statusKode = error.response?.status || "-";

            alert(`GAGAL KIRIM ULASAN!\n\nKode: ${statusKode}\nPesan: ${pesanServer}\n\n(Cek Console F12 untuk detailnya)`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseFinal = () => {
        onClose();
        setTimeout(() => setIsSuccess(false), 300);
    };

    if (!isOpen || !order) return null;

    let freelancerName = "Freelancer";
    const f = order.freelancer;
    if (f && typeof f === 'object') {
        freelancerName = `${f.nama_depan || ''} ${f.nama_belakang || ''}`.trim();
    } else if (typeof f === 'string') {
        freelancerName = f;
    }

    const projectTitle = order.title || order.serviceName || order.judul || "Judul Proyek";
    const avatarUrl = "https://ui-avatars.com/api/?name=" + freelancerName.replace(" ", "+") + "&background=0D8ABC&color=fff&size=128";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm font-sans">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${isSuccess ? 'max-w-md' : 'max-w-xl'} overflow-hidden relative p-8 transition-all duration-300`}>
                
                {isSuccess ? (
                    <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">Ulasan telah<br />berhasil dikirim</h2>
                        <p className="text-gray-600 text-base mb-8">Terimakasih atas masukan Anda!</p>
                        <button onClick={handleCloseFinal} className="w-full py-3 bg-[#E2E8F0] hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-colors shadow-sm">Tutup</button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 leading-tight">Berikan Ulasan untuk<br />Freelancer Anda</h2>
                            </div>
                            <div className="flex items-center gap-1 text-blue-600 font-bold text-lg"><span>Skill Connect</span></div>
                        </div>

                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                            <img src={avatarUrl} alt={freelancerName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"/>
                            <div><h4 className="text-xl font-bold text-gray-900">{freelancerName}</h4></div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <h4 className="font-bold text-gray-900 text-lg mb-2">{projectTitle}</h4>
                                <div className="flex items-center gap-3">
                                    <StarRating currentRating={rating} setRating={setRating} />
                                    {rating > 0 && (
                                        <span className="text-sm text-gray-500 font-medium animate-in fade-in">
                                            {rating}.0 dari 5
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mb-6">
                                <textarea 
                                    rows={4} 
                                    className="w-full rounded-lg border-0 bg-gray-100 p-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none" 
                                    placeholder="Ceritakan pengalaman Anda bekerja dengan freelancer ini..." 
                                    value={comment} 
                                    onChange={(e) => setComment(e.target.value)} 
                                />
                            </div>

                            <div className="mt-4">
                                <button type="submit" className="w-full py-3 text-lg font-semibold rounded-lg bg-[#81A4F8] hover:bg-blue-600 text-white transition disabled:opacity-50" disabled={isSubmitting}>
                                    {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}