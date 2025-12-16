import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../../components/Fragments/Common/Navbar'
import Footer from '../../components/Fragments/Common/Footer'
import ServiceCardItem from '../../components/Fragments/Service/ServiceCardItem'
import { bookmarkService } from '../../services/bookmarkService'

// ========================
// Helper URL media (thumbnail dari backend)
// ========================
const buildMediaUrl = (raw) => {
  // fallback ke asset FE
  const fallback = "/asset/layanan/Layanan.png";

  if (!raw) return fallback;

  const url = String(raw).trim();
  if (!url) return fallback;

  // Sudah absolute URL
  if (/^https?:\/\//i.test(url)) return url;

  // Asset lokal FE
  if (url.startsWith("/asset/") || url.startsWith("/assets/")) {
    return url;
  }

  // Base URL backend
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const backendBase =
    apiBase.replace(/\/api\/?$/, "") || "http://localhost:5000";

  // Hapus leading slash & prefix public/ kalau ada
  const cleanPath = url.replace(/^\/+/, "").replace(/^public\//, "");

  // Hasil akhir: http://localhost:5000/public/layanan/xxx.jpg
  return `${backendBase}/public/${cleanPath}`;
};

const BookmarkPage = () => {
  const navigate = useNavigate()
  const [bookmarkedServices, setBookmarkedServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        console.log('[BookmarkPage] Fetching bookmarks...')
        const res = await bookmarkService.getBookmarks()
        console.log('[BookmarkPage] Bookmarks response:', res)

        if (!res.success) {
          console.log('[BookmarkPage] Failed to get bookmarks:', res.message)
          setBookmarkedServices([])
          return
        }

        const rows = res.data || []
        console.log('[BookmarkPage] Bookmark rows:', rows)

        // Map bookmark data directly (backend already returns joined data with layanan details)
        const services = rows.map(bookmark => ({
          id: bookmark.layanan_id,
          slug: bookmark.slug,
          title: bookmark.judul,
          category: bookmark.nama_kategori || 'Kategori',
          freelancer: bookmark.freelancer_name || 'Unknown',
          rating: parseFloat(bookmark.rating_rata_rata) || 0,
          reviews: parseInt(bookmark.jumlah_rating) || 0,
          price: parseInt(bookmark.harga) || 0,
          favoriteCount: parseInt(bookmark.jumlah_favorit) || 0,
          thumbnail: bookmark.thumbnail,
          freelancerAvatar: bookmark.freelancer_avatar || bookmark.avatar,
          isBookmarked: true,
          isSaved: true
        })).filter(s => s.id) // Filter out invalid entries

        console.log('[BookmarkPage] Mapped services:', services)
        setBookmarkedServices(services)
      } catch (e) {
        console.error('[BookmarkPage] load error:', e)
        setBookmarkedServices([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleBookmarkToggle = (serviceId, isBookmarked) => {
    if (!isBookmarked) {
      setBookmarkedServices(prev => prev.filter(s => s.id !== serviceId))
    }
  }

  const handleServiceClick = (service) => {
    // Use slug as primary route, fallback to ID
    navigate(`/services/${service.slug || service.id}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-br from-[#D8E3F3] to-[#9DBBDD] border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <i className="fas fa-bookmark text-4xl text-[#4782BE]"></i>
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-[#4782BE] to-[#1D375B] bg-clip-text text-transparent">
                  Layanan Tersimpan
                </span>
              </h1>
            </div>
            <p className="text-neutral-700 text-lg max-w-2xl mx-auto">
              Lihat kembali layanan yang telah Anda bookmark untuk referensi di masa depan
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Services Count */}
        <div className="mb-6">
          <p className="text-neutral-600">
            Menampilkan <span className="font-semibold text-[#4782BE]">{bookmarkedServices.length}</span> layanan tersimpan
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-3xl text-[#4782BE]"></i>
          </div>
        )}

        {/* Services Grid */}
        {!loading && (bookmarkedServices.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {bookmarkedServices.map((service) => (
              <ServiceCardItem
                key={service.id}
                service={{ ...service, isBookmarked: true }}
                onClick={() => handleServiceClick(service)}
                onBookmarkToggle={handleBookmarkToggle}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📑</div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">Belum ada layanan tersimpan</h3>
            <p className="text-neutral-600 mb-6">
              Bookmark layanan favorit Anda untuk melihatnya kembali nanti
            </p>
            <button
              onClick={() => navigate('/services')}
              className="px-6 py-3 bg-gradient-to-r from-[#4782BE] to-[#1D375B] text-white rounded-full font-medium hover:shadow-lg transition-all duration-300"
            >
              Jelajahi Layanan
            </button>
          </motion.div>
        ))}
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default BookmarkPage
