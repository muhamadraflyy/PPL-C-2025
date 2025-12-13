import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../../../services/reviewService';

// Komponen Bintang (SVG Manual agar tidak error library)
const StarRating = ({ currentRating, setRating, label }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-gray-700 font-medium text-sm w-full sm:w-1/2">{label}</label>
            <div className="flex gap-1">
                {[...Array(5)].map((_, index) => {
                    const ratingValue = index + 1;
                    const isActive = ratingValue <= (hover || currentRating);
                    return (
                        <svg
                            key={index}
                            className="cursor-pointer transition-colors duration-200 w-6 h-6"
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
        </div>
    );
};

export default function ReviewModal({ isOpen, onClose, order }) {
    const queryClient = useQueryClient();
    const [ratings, setRatings] = useState({ quality: 0, communication: 0, timeliness: 0 });
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRatings({ quality: 0, communication: 0, timeliness: 0 });
            setComment('');
            setIsSubmitting(false);
            setIsSuccess(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (ratings.quality === 0 || ratings.communication === 0 || ratings.timeliness === 0) {
            alert("Mohon isi semua bintang!");
            return;
        }

        setIsSubmitting(true);

        try {
            // Calculate average rating from the 3 ratings
            const averageRating = Math.round((ratings.quality + ratings.communication + ratings.timeliness) / 3);

            // Prepare review data
            const reviewData = {
                pesanan_id: order.id,
                rating: averageRating,
                judul: `Review untuk ${order.title || 'pesanan'}`,
                komentar: comment || 'Tidak ada komentar',
            };

            // Call API to create review
            const result = await reviewService.createReview(reviewData);

            if (result.status === 'success') {
                setIsSuccess(true);
                // Invalidate orders query to refetch and show updated hasReview status
                queryClient.invalidateQueries(['orders']);
            } else {
                // If error is "already reviewed", invalidate query to update UI
                if (result.message && result.message.toLowerCase().includes('sudah pernah diulas')) {
                    queryClient.invalidateQueries(['orders']);
                    alert('Pesanan ini sudah pernah Anda ulas sebelumnya.');
                    onClose(); // Close modal
                } else {
                    alert(result.message || 'Gagal mengirim ulasan. Silakan coba lagi.');
                }
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Terjadi kesalahan saat mengirim ulasan. Silakan coba lagi.');
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
    } else if (typeof f === 'string') freelancerName = f;

    const avatarUrl = "https://ui-avatars.com/api/?name=" + freelancerName.replace(" ", "+") + "&background=0D8ABC&color=fff&size=128";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm font-sans">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${isSuccess ? 'max-w-md' : 'max-w-xl'} overflow-hidden relative p-8 transition-all duration-300`}>
                
                {isSuccess ? (
                    <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">Ulasan telah<br />berhasil dikirim</h2>
                        <p className="text-gray-600 text-base mb-8">Terimakasih masukannya!</p>
                        <button onClick={handleCloseFinal} className="w-full py-3 bg-[#E2E8F0] hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-colors shadow-sm">Tutup</button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        <div className="flex justify-between items-start mb-6">
                            <div><h2 className="text-2xl font-bold text-gray-900 leading-tight">Berikan Ulasan untuk<br />Freelancer Anda</h2></div>
                            <div className="flex items-center gap-1 text-blue-600 font-bold text-lg"><span>Skill Connect</span></div>
                        </div>
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                            <img src={avatarUrl} alt={freelancerName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"/>
                            <div><h4 className="text-xl font-bold text-gray-900">{freelancerName}</h4></div>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <h4 className="font-bold text-gray-900 text-lg mb-4">{order.title || 'Judul Pesanan'}</h4>
                                <div className="space-y-4">
                                    <StarRating label="Kualitas pekerjaan" currentRating={ratings.quality} setRating={(v) => setRatings({...ratings, quality: v})} />
                                    <StarRating label="Komunikasi" currentRating={ratings.communication} setRating={(v) => setRatings({...ratings, communication: v})} />
                                    <StarRating label="Ketaatan terhadap batas waktu" currentRating={ratings.timeliness} setRating={(v) => setRatings({...ratings, timeliness: v})} />
                                </div>
                            </div>
                            <div className="mb-6">
                                <textarea rows={4} className="w-full rounded-lg border-0 bg-gray-100 p-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Ceritakan pengalaman Anda..." value={comment} onChange={(e) => setComment(e.target.value)} />
                            </div>
                            <div className="mt-8">
                                <button type="submit" className="w-full py-3 text-lg font-semibold rounded-lg bg-[#81A4F8] hover:bg-blue-600 text-white transition" disabled={isSubmitting}>{isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}