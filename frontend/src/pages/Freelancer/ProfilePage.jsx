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
  
  // Data Dummy Reviews (Sesuai Screenshot Anda)
  const dummyReviews = [
    {
      id: 1,
      name: "Albert",
      role: "Perusahaan Pemasaran Verizon",
      date: "Agustus 17, 2025",
      rating: 4.0,
      comment: "Pekerjaan yang bagus dengan komunikasi yang jelas dan pengiriman tepat waktu.",
      avatar: null // Default avatar
    },
    {
      id: 2,
      name: "Jason S.",
      role: "Perusahaan Pemasaran Verizon",
      date: "Agustus 17, 2025",
      rating: 5.0,
      comment: "“Seperti biasa, bekerja sama dengan Jason selalu menyenangkan, dan saya yakin akan mempekerjakannya lagi di masa depan!”",
      avatar: null 
    }
  ]

  const [reviews, setReviews] = useState(dummyReviews) 

  const [stats, setStats] = useState({
    totalPekerjaan: 0,
    reputasi: '5/5',
    verifikasi: false
  })
  
  const [selectedPortfolio, setSelectedPortfolio] = useState(null)
  const [showPortfolioModal, setShowPortfolioModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadProfile()
    
    const pendingMessage = sessionStorage.getItem('profileUpdateMessage')
    if (pendingMessage) {
      try {
        const { message, type } = JSON.parse(pendingMessage)
        setTimeout(() => {
          toast.show(message, type)
        }, 500)
        sessionStorage.removeItem('profileUpdateMessage')
      } catch (e) {
        console.error('Error showing pending toast:', e)
      }
    }
  }, [toast])

  useEffect(() => {
    const handleFocus = () => {
      loadProfile()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProfile()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/profile')
      
      if (response.data.success && response.data.data) {
        const profileData = response.data.data
        setProfile(profileData)
        await loadStats(profileData)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Gagal memuat profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePortfolio = async () => {
    if (!selectedPortfolio) return

    try {
      setDeleting(true)
      const freelancerProfile = profile.freelancerProfile || profile.profil_freelancer || {}
      let currentPortfolio = freelancerProfile.file_portfolio || []
      
      if (typeof currentPortfolio === 'string') {
        currentPortfolio = JSON.parse(currentPortfolio)
      }
      
      const updatedPortfolio = currentPortfolio.filter((_, idx) => idx !== selectedPortfolio.index)
      
      const formData = new FormData()
      formData.append('file_portfolio', JSON.stringify(updatedPortfolio))
      
      const response = await api.put('/users/freelancer-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data.success) {
        await loadProfile()
        setShowPortfolioModal(false)
        setShowDeleteConfirm(false)
        setSelectedPortfolio(null)
      }
    } catch (err) {
      console.error('Error deleting portfolio:', err)
      setError('Gagal menghapus portfolio')
    } finally {
      setDeleting(false)
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
      
      let reputasi = '5/5'
      try {
        const reviewsResponse = await api.get('/reviews/my')
        if (reviewsResponse.data.success) {
          const reviewsData = reviewsResponse.data.data || []
          
          // Jika API kosong, tetap pakai dummy (untuk demo)
          if(reviewsData.length > 0) {
             setReviews(reviewsData)
             const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0)
             const avgRating = (totalRating / reviewsData.length).toFixed(1)
             reputasi = `${avgRating}/5`
          } else {
             // Kalo kosong pake dummy default (Albert & Jason)
             setReviews(dummyReviews)
          }
        }
      } catch (reviewErr) {
        console.log('Reviews not available, using dummy')
        setReviews(dummyReviews)
      }
      
      setStats({
        totalPekerjaan,
        reputasi,
        verifikasi: profileData?.is_verified || false
      })
    } catch (err) {
      console.log('Stats not available')
    }
  }

  // Helper Render Bintang (Sesuai Desain Kuning)
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <i 
        key={i} 
        className={`fas fa-star text-lg ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      ></i>
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600">{error || 'Profile tidak ditemukan'}</p>
        </div>
      </div>
    )
  }

  const fullName = `${profile.nama_depan || ''} ${profile.nama_belakang || ''}`.trim() || 'User'
  const location = [profile.kota, profile.provinsi].filter(Boolean).join(', ') || 'Indonesia'
  
  let freelancerProfile = profile.freelancerProfile || profile.profil_freelancer || {}
  
  if (freelancerProfile.file_portfolio && typeof freelancerProfile.file_portfolio === 'string') {
    try {
      freelancerProfile = {
        ...freelancerProfile,
        file_portfolio: JSON.parse(freelancerProfile.file_portfolio)
      }
    } catch (e) {
      console.error('Error parsing file_portfolio:', e)
      freelancerProfile.file_portfolio = []
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="h-40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-300"></div>
            {profile.foto_latar && (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${profile.foto_latar}?t=${Date.now()}`}
                alt="Cover" 
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button onClick={() => navigate(`/freelancer/${profile.id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-full flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all hover:shadow-xl">
                <i className="fas fa-eye text-sm"></i><span className="text-sm font-medium">Lihat Profil Publik</span>
              </button>
              <button onClick={() => navigate('/profile/edit')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors">
                <i className="fas fa-pen text-gray-600 text-sm"></i>
              </button>
            </div>
          </div>

          <div className="px-8 pb-6">
            <div className="flex items-start -mt-16 mb-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                  {profile.avatar && (
                    <img src={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${profile.avatar}?t=${Date.now()}`} alt={fullName} className="absolute inset-0 w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                  )}
                </div>
              </div>
              <div className="ml-6 mt-20 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                    {freelancerProfile.judul_profesi && <p className="text-gray-600 mt-1">{freelancerProfile.judul_profesi}</p>}
                    <p className="text-gray-500 flex items-center mt-1"><i className="fas fa-map-marker-alt mr-2 text-sm"></i>{location}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Detail Pekerjaan</h2>
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Total Pekerjaan</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalPekerjaan}</p>
                </div>
                <div className="pb-4 border-b border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Reputasi</p>
                  <p className="text-xl font-bold text-gray-900">{stats.reputasi}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Verifikasi</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2"><i className="fas fa-check-circle text-green-600"></i><div className="flex-1 min-w-0"><p className="text-xs text-gray-500">Email</p><p className="text-sm text-gray-900 truncate">{profile.email}</p></div></div>
                    {profile.no_telepon && <div className="flex items-center gap-2"><i className="fas fa-check-circle text-green-600"></i><div className="flex-1 min-w-0"><p className="text-xs text-gray-500">Nomor HP</p><p className="text-sm text-gray-900">{profile.no_telepon}</p></div></div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Bahasa</h2>
              {freelancerProfile.bahasa?.length > 0 ? (
                <div className="space-y-2">{freelancerProfile.bahasa.map((lang, idx) => (<div key={idx} className="flex items-center gap-2 text-gray-700"><i className="fas fa-language text-gray-400"></i><span>{lang}</span></div>))}</div>
              ) : <p className="text-gray-500 text-sm">Belum ada bahasa</p>}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Keahlian</h2>
              {freelancerProfile.keahlian?.length > 0 ? (
                <div className="flex flex-wrap gap-2">{freelancerProfile.keahlian.map((skill, idx) => (<span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">{skill}</span>))}</div>
              ) : <p className="text-gray-500 text-sm">Belum ada keahlian</p>}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Edukasi</h2>
              {freelancerProfile.edukasi?.length > 0 ? (
                freelancerProfile.edukasi.map((edu, idx) => (<div key={idx} className="mb-2 border-l-2 border-blue-500 pl-3"><p className="font-medium text-gray-900 text-sm">{edu.institusi}</p><p className="text-xs text-gray-500">{edu.tahun}</p></div>))
              ) : <p className="text-gray-500 text-sm">Belum ada edukasi</p>}
            </div>
          </div>

          {/* Right Content */}
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
                  <i className="fas fa-images text-gray-300 text-5xl mb-4"></i>
                  <p className="text-gray-500 mb-4">Belum ada portofolio</p>
                  <button onClick={() => navigate('/profile/edit')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Tambah Portofolio Pertama</button>
                </div>
              )}
            </div>

            {/* --- SECTION ULASAN (CARD SESUAI SS) --- */}
            {/* Background container sama dengan konten utama (gray-50), jadi tidak perlu kotak putih pembungkus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col justify-between">
                    
                    {/* Header: Avatar, Nama, Tanggal */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                          {review.avatar ? (
                            <img src={review.avatar} alt={review.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            review.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{review.name}</h4>
                          <p className="text-sm text-gray-500">{review.role}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>

                    {/* Komentar */}
                    <p className="text-gray-800 font-medium mb-4 leading-relaxed">
                      {review.comment}
                    </p>

                    {/* Footer: Bintang, Nilai, Tombol Laporkan */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-400">
                          {renderStars(review.rating)}
                        </div>
                        <span className="font-bold text-gray-900">{review.rating.toFixed(1)}</span>
                      </div>
                      
                      <button className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors">
                        Laporkan
                      </button>
                    </div>

                  </div>
                ))}
            </div>
            
            {/* Pagination Dummy (Sesuai SS) */}
            <div className="flex justify-end items-center gap-4 mt-4 text-sm text-gray-600">
                <button className="flex items-center gap-1 hover:text-gray-900"><i className="fas fa-arrow-left"></i> Sebelumnya</button>
                <div className="flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center bg-gray-800 text-white rounded font-bold">1</span>
                    <span className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer">2</span>
                    <span className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer">3</span>
                    <span>...</span>
                    <span className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer">10</span>
                </div>
                <button className="flex items-center gap-1 hover:text-gray-900">Selanjutnya <i className="fas fa-arrow-right"></i></button>
            </div>

          </div>
        </div>
      </div>

      <Footer />

      {/* Modals Tetap Ada */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Portfolio?</h3>
            <p className="text-gray-700 mb-6">Apakah Anda yakin ingin menghapus portfolio ini?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 border rounded-lg">Batal</button>
              <button onClick={handleDeletePortfolio} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">{deleting ? '...' : 'Hapus'}</button>
            </div>
          </div>
        </div>
      )}

      {showPortfolioModal && selectedPortfolio && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowPortfolioModal(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPortfolioModal(false)} className="absolute top-4 right-4 text-gray-600"><i className="fas fa-times text-xl"></i></button>
            <img src={selectedPortfolio.url} alt="Portfolio" className="w-full h-auto max-h-[70vh] object-contain rounded mb-4" />
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{selectedPortfolio.judul}</h2>
                <button onClick={() => setShowDeleteConfirm(true)} className="text-red-600 px-3 py-1 hover:bg-red-50 rounded"><i className="fas fa-trash mr-2"></i>Hapus</button>
            </div>
            <p className="text-gray-700 mt-2">{selectedPortfolio.deskripsi}</p>
          </div>
        </div>
      )}
    </div>
  )
}