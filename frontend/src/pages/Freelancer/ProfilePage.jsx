import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Fragments/Common/Navbar'
import Footer from '../../components/Fragments/Common/Footer'
import api from '../../utils/axiosConfig'
import { useToast } from '../../components/Fragments/Common/ToastProvider'

export default function FreelancerProfilePage() {
  const navigate = useNavigate()
  const toast = useToast()
  
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // State Data
  const [reviews, setReviews] = useState([]) 
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [stats, setStats] = useState({ totalPekerjaan: 0, reputasi: '5/5', verifikasi: false })
  
  // State Modal Portfolio
  const [selectedPortfolio, setSelectedPortfolio] = useState(null)
  const [showPortfolioModal, setShowPortfolioModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // State Modal Report
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedReviewId, setSelectedReviewId] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)

  const reportReasons = [
    "Penilaian mengandung kata-kata kasar atau penghinaan",
    "Penilaian mengandung unsur fanatik",
    "Penilaian bersifat spam",
    "Penilaian menyebarkan informasi pribadi",
    "Penilaian mengandung promosi atau iklan tanpa izin",
    "Penilaian tidak sesuai dengan pengalaman sebenarnya",
    "Penilaian mengandung ujaran kebencian atau diskriminasi",
    "Penilaian menyesatkan atau berisi informasi palsu",
    "Lainnya"
  ]

  useEffect(() => {
    loadProfile()
    
    // Cek pesan update profil (jika ada dari halaman edit)
    const pendingMessage = sessionStorage.getItem('profileUpdateMessage')
    if (pendingMessage) {
      try {
        const { message, type } = JSON.parse(pendingMessage)
        setTimeout(() => { toast.show(message, type) }, 500)
        sessionStorage.removeItem('profileUpdateMessage')
      } catch (e) { console.error(e) }
    }
  }, [toast])

  // Auto-refresh saat tab aktif kembali
  useEffect(() => {
    const handleFocus = () => loadProfile()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/profile')
      
      if (response.data.success && response.data.data) {
        const userData = response.data.data
        console.log("🆔 ID Login:", userData.id)
        setProfile(userData)
        await loadStats(userData)
        
        // Load Review setelah kita punya ID User
        if (userData.id) {
          await loadReviews(userData.id)
        }
      }
    } catch (err) {
      setError('Gagal memuat profile')
    } finally {
      setLoading(false)
    }
  }

  // === LOGIKA INTEGRASI REVIEW (UTAMA & CADANGAN) ===
  const loadReviews = async (freelancerId) => {
    setReviewsLoading(true)
    try {
      // CARA 1: Endpoint Utama (Sesuai dokumentasi/backend Anda)
      console.log("🚀 Mencoba endpoint review spesifik...")
      const response = await api.get(`/reviews/freelancer/${freelancerId}`) 
      
      // Cek apakah ada data items (sesuai JSON yang Anda kirim)
      if (response.data.success && response.data.data?.items) {
        processReviews(response.data.data.items)
      } else {
        // Jika sukses tapi kosong, atau format beda, lempar ke catch untuk coba cara 2
        throw new Error("Data review kosong atau format berbeda")
      }

    } catch (err) {
      console.warn("⚠️ Endpoint utama gagal/kosong, mencoba jalur cadangan...", err)
      
      // CARA 2: Endpoint Cadangan (Ambil Semua & Filter Manual)
      try {
        const fallbackResponse = await api.get('/reviews')
        let allReviews = []
        
        // Handle format data yang mungkin berbeda
        if (Array.isArray(fallbackResponse.data.data)) {
          allReviews = fallbackResponse.data.data
        } else if (fallbackResponse.data.data?.items) {
          allReviews = fallbackResponse.data.data.items
        }

        // Filter: Hanya ambil review yang ditujukan untuk ID freelancer ini
        const myReviews = allReviews.filter(r => r.penerima_ulasan_id === freelancerId)
        
        if (myReviews.length > 0) {
          console.log("✅ Berhasil memuat ulasan via jalur cadangan!")
          processReviews(myReviews)
        } else {
          setReviews([])
        }
      } catch (fallbackErr) {
        console.error("❌ Gagal total memuat ulasan:", fallbackErr)
        setReviews([])
      }
    } finally {
      setReviewsLoading(false)
    }
  }

  // Helper untuk memformat data review agar sesuai tampilan
  const processReviews = (rawData) => {
    const mapped = rawData.map(r => ({
      id: r.id,
      name: "Client SkillConnect", // Default name (backend belum join user client)
      role: r.judul || "Client Terverifikasi",
      date: new Date(r.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
      rating: Number(r.rating),
      comment: r.komentar,
      avatar: null 
    }))
    setReviews(mapped)
  }

  const handleDeletePortfolio = async () => {
    if (!selectedPortfolio) return
    try {
      setDeleting(true)
      const freelancerProfile = profile.freelancerProfile || profile.profil_freelancer || {}
      let currentPortfolio = freelancerProfile.file_portfolio || []
      if (typeof currentPortfolio === 'string') currentPortfolio = JSON.parse(currentPortfolio)
      
      const updatedPortfolio = currentPortfolio.filter((_, idx) => idx !== selectedPortfolio.index)
      const formData = new FormData()
      formData.append('file_portfolio', JSON.stringify(updatedPortfolio))
      
      const response = await api.put('/users/freelancer-profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (response.data.success) {
        await loadProfile()
        setShowPortfolioModal(false)
        setShowDeleteConfirm(false)
        setSelectedPortfolio(null)
      }
    } catch (err) { setError('Gagal menghapus portfolio') } finally { setDeleting(false) }
  }

  const handleOpenReport = (reviewId) => {
    setSelectedReviewId(reviewId)
    setReportReason('')
    setShowReportModal(true)
  }

  const handleSubmitReport = async () => {
    if (!reportReason) {
      toast.show("Pilih alasan pelaporan terlebih dahulu", "error")
      return
    }
    try {
      setSubmittingReport(true)
      // Simulasi API call (ganti endpoint ini jika sudah ada fitur report di backend)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.show("Laporan berhasil dikirim. Kami akan meninjaunya.", "success")
      setShowReportModal(false)
    } catch (err) {
      toast.show("Gagal mengirim laporan", "error")
    } finally {
      setSubmittingReport(false)
    }
  }

  const loadStats = async (profileData) => {
    try {
      const ordersResponse = await api.get('/orders/incoming')
      let totalPekerjaan = 0
      if (ordersResponse.data.success) {
        const orders = ordersResponse.data.data || []
        totalPekerjaan = orders.filter(o => o.status === 'selesai').length
      }
      setStats({
        totalPekerjaan,
        reputasi: profileData.rating_rata_rata ? `${Number(profileData.rating_rata_rata).toFixed(1)}/5` : '5/5',
        verifikasi: profileData?.is_verified || false
      })
    } catch (err) { console.log('Stats not available') }
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <i key={i} className={`fas fa-star text-lg ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}></i>
    ))
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex justify-center items-center">Loading...</div>
  if (error || !profile) return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-red-500">{error || 'Error'}</div>

  const fullName = `${profile.nama_depan || ''} ${profile.nama_belakang || ''}`.trim() || 'User'
  const location = [profile.kota, profile.provinsi].filter(Boolean).join(', ') || 'Indonesia'
  
  // Normalisasi data freelancer profile
  let freelancerProfile = profile.freelancerProfile || profile.profil_freelancer || {}
  if (freelancerProfile.file_portfolio && typeof freelancerProfile.file_portfolio === 'string') {
    try { freelancerProfile = { ...freelancerProfile, file_portfolio: JSON.parse(freelancerProfile.file_portfolio) } } 
    catch (e) { freelancerProfile.file_portfolio = [] }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Profile */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="h-40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-300"></div>
            {profile.foto_latar && <img src={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${profile.foto_latar}?t=${Date.now()}`} alt="Cover" className="absolute inset-0 w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button onClick={() => navigate(`/freelancer/${profile.id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-full flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all"><i className="fas fa-eye text-sm"></i><span className="text-sm font-medium">Lihat Profil Publik</span></button>
              <button onClick={() => navigate('/profile/edit')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"><i className="fas fa-pen text-gray-600 text-sm"></i></button>
            </div>
          </div>
          <div className="px-8 pb-6">
            <div className="flex items-start -mt-16 mb-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">{fullName.charAt(0).toUpperCase()}</div>
                  {profile.avatar && <img src={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${profile.avatar}?t=${Date.now()}`} alt={fullName} className="absolute inset-0 w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />}
                </div>
              </div>
              <div className="ml-6 mt-20 flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                {freelancerProfile.judul_profesi && <p className="text-gray-600 mt-1">{freelancerProfile.judul_profesi}</p>}
                <p className="text-gray-500 flex items-center mt-1"><i className="fas fa-map-marker-alt mr-2 text-sm"></i>{location}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Detail Pekerjaan</h2>
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100"><p className="text-sm text-gray-500 mb-1">Total Pekerjaan</p><p className="text-xl font-bold text-gray-900">{stats.totalPekerjaan}</p></div>
                <div className="pb-4 border-b border-gray-100"><p className="text-sm text-gray-500 mb-1">Reputasi</p><p className="text-xl font-bold text-gray-900">{stats.reputasi}</p></div>
                <div><p className="text-sm text-gray-500 mb-2">Verifikasi</p><div className="space-y-3"><div className="flex items-center gap-2"><i className="fas fa-check-circle text-green-600"></i><div className="flex-1 min-w-0"><p className="text-xs text-gray-500">Email</p><p className="text-sm text-gray-900 truncate">{profile.email}</p></div></div>{profile.no_telepon && <div className="flex items-center gap-2"><i className="fas fa-check-circle text-green-600"></i><div className="flex-1 min-w-0"><p className="text-xs text-gray-500">Nomor HP</p><p className="text-sm text-gray-900">{profile.no_telepon}</p></div></div>}</div></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6"><h2 className="text-lg font-bold text-gray-900 mb-4">Bahasa</h2>{freelancerProfile.bahasa?.length > 0 ? <div className="space-y-2">{freelancerProfile.bahasa.map((l,i)=><div key={i} className="flex items-center gap-2 text-gray-700"><i className="fas fa-language text-gray-400"></i><span>{l}</span></div>)}</div> : <p className="text-gray-500 text-sm">Belum ada bahasa</p>}</div>
            <div className="bg-white rounded-2xl shadow-sm p-6"><h2 className="text-lg font-bold text-gray-900 mb-4">Keahlian</h2>{freelancerProfile.keahlian?.length > 0 ? <div className="flex flex-wrap gap-2">{freelancerProfile.keahlian.map((s,i)=><span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">{s}</span>)}</div> : <p className="text-gray-500 text-sm">Belum ada keahlian</p>}</div>
            <div className="bg-white rounded-2xl shadow-sm p-6"><h2 className="text-lg font-bold text-gray-900 mb-4">Edukasi</h2>{freelancerProfile.edukasi?.length > 0 ? freelancerProfile.edukasi.map((e,i)=><div key={i} className="mb-2 border-l-2 border-blue-500 pl-3"><p className="font-medium text-gray-900 text-sm">{e.institusi}</p><p className="text-xs text-gray-500">{e.tahun}</p></div>) : <p className="text-gray-500 text-sm">Belum ada edukasi</p>}</div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{freelancerProfile.judul_profesi || 'Deskripsi'}</h2>
              {freelancerProfile.deskripsi_lengkap ? <p className="text-gray-700 leading-relaxed whitespace-pre-line">{freelancerProfile.deskripsi_lengkap}</p> : <p className="text-gray-500">Belum ada deskripsi.</p>}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Portofolio</h2>
                <button onClick={() => navigate('/profile/edit')} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"><i className="fas fa-plus"></i>Tambah Portofolio</button>
              </div>
              {freelancerProfile.file_portfolio?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {freelancerProfile.file_portfolio.map((item, idx) => {
                    const fullUrl = item.url?.startsWith('http') ? item.url : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${item.url || item}`
                    return (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg transition-all cursor-pointer group relative" onClick={() => { setSelectedPortfolio({ ...item, url: fullUrl, index: idx }); setShowPortfolioModal(true) }}>
                        <img src={fullUrl} alt="Portfolio" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=No+Image'} />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <i className="fas fa-images text-gray-300 text-5xl mb-4"></i><p className="text-gray-500 mb-4">Belum ada portofolio</p>
                  <button onClick={() => navigate('/profile/edit')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Tambah Portofolio Pertama</button>
                </div>
              )}
            </div>

            {/* SECTION REVIEW */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Ulasan & Rating</h2>
              {reviewsLoading ? (
                <div className="text-center py-8 text-gray-500">Memuat ulasan...</div>
              ) : reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col justify-between">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                            {review.avatar ? <img src={review.avatar} alt={review.name} className="w-full h-full object-cover" /> : review.name.charAt(0).toUpperCase()}
                          </div>
                          <div><h4 className="font-bold text-gray-900 text-lg">{review.name}</h4><p className="text-sm text-gray-500">{review.role}</p></div>
                        </div>
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                      <p className="text-gray-800 font-medium mb-4 leading-relaxed line-clamp-3">"{review.comment}"</p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2"><div className="flex text-yellow-400">{renderStars(review.rating)}</div><span className="font-bold text-gray-900">{review.rating.toFixed(1)}</span></div>
                        {/* Tombol Laporkan */}
                        <button onClick={() => handleOpenReport(review.id)} className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors">Laporkan</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                  <i className="fas fa-star text-gray-300 text-4xl mb-3"></i><p className="text-gray-500 font-medium">Belum ada ulasan</p><p className="text-gray-400 text-sm mt-1">Selesaikan pekerjaan untuk mendapatkan ulasan pertama Anda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* MODAL LAPORKAN */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center"><h3 className="text-xl font-bold text-gray-900">Laporkan Review</h3><button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fas fa-times text-xl"></i></button></div>
            <div className="px-6 py-4"><p className="font-bold text-gray-900 mb-4 text-base">Pilih Alasan</p><div className="space-y-3">{reportReasons.map((reason, index) => (<label key={index} className="flex items-start gap-3 cursor-pointer group"><div className="relative flex items-center mt-0.5"><input type="radio" name="reportReason" value={reason} checked={reportReason === reason} onChange={(e) => setReportReason(e.target.value)} className="peer sr-only" /><div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-blue-600 peer-checked:border-[6px] transition-all bg-white"></div></div><span className="text-gray-700 text-sm group-hover:text-gray-900">{reason}</span></label>))}</div></div>
            <div className="px-6 py-4 border-t border-gray-50 bg-gray-50 flex justify-center"><button onClick={handleSubmitReport} disabled={submittingReport || !reportReason} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200">{submittingReport ? 'Mengirim...' : 'Kirim laporan'}</button></div>
          </div>
        </div>
      )}

      {/* Existing Modals */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><i className="fas fa-exclamation-triangle text-red-600 text-xl"></i></div><h3 className="text-lg font-bold text-gray-900">Hapus Portfolio?</h3></div>
            <p className="text-gray-700 mb-6">Apakah Anda yakin ingin menghapus portfolio <strong>"{selectedPortfolio?.judul || 'ini'}"</strong>?</p>
            <div className="flex gap-3"><button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Batal</button><button onClick={handleDeletePortfolio} disabled={deleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">{deleting ? '...' : 'Hapus'}</button></div>
          </div>
        </div>
      )}

      {showPortfolioModal && selectedPortfolio && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowPortfolioModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between z-10"><h2 className="text-xl font-bold">{selectedPortfolio.judul || 'Portfolio'}</h2><div className="flex gap-2"><button onClick={() => setShowDeleteConfirm(true)} className="text-red-600 px-3 py-1 hover:bg-red-50 rounded"><i className="fas fa-trash"></i></button><button onClick={() => setShowPortfolioModal(false)} className="text-gray-600 px-2 hover:bg-gray-100 rounded"><i className="fas fa-times"></i></button></div></div>
            <div className="p-6"><img src={selectedPortfolio.url} alt="Portfolio" className="w-full h-auto max-h-[60vh] object-contain rounded bg-gray-100 mb-6" /><h3 className="font-semibold mb-2">Deskripsi</h3><p className="text-gray-700">{selectedPortfolio.deskripsi || '-'}</p></div>
          </div>
        </div>
      )}
    </div>
  )
}