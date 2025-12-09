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
    
    // Check for pending toast message after profile update
    const pendingMessage = sessionStorage.getItem('profileUpdateMessage')
    if (pendingMessage) {
      try {
        const { message, type } = JSON.parse(pendingMessage)
        // Show toast after a short delay
        setTimeout(() => {
          toast.show(message, type)
        }, 500)
        // Clear the message
        sessionStorage.removeItem('profileUpdateMessage')
      } catch (e) {
        console.error('Error showing pending toast:', e)
      }
    }
  }, [toast])

  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused - reloading profile...')
      loadProfile()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Reload profile when navigating back from edit page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page visible - reloading profile...')
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
      
      console.log('📥 Profile Response:', response.data)
      
      if (response.data.success && response.data.data) {
        const profileData = response.data.data
        console.log('👤 Profile Data:', profileData)
        console.log('📁 Freelancer Profile:', profileData.freelancerProfile || profileData.profil_freelancer)
        console.log('🖼️ Portfolio:', profileData.freelancerProfile?.file_portfolio || profileData.profil_freelancer?.file_portfolio)
        
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
      
      // Get current portfolio from profile
      const freelancerProfile = profile.freelancerProfile || profile.profil_freelancer || {}
      let currentPortfolio = freelancerProfile.file_portfolio || []
      
      // Parse if string
      if (typeof currentPortfolio === 'string') {
        currentPortfolio = JSON.parse(currentPortfolio)
      }
      
      // Remove selected portfolio
      const updatedPortfolio = currentPortfolio.filter((_, idx) => idx !== selectedPortfolio.index)
      
      // Send update to backend
      const formData = new FormData()
      formData.append('file_portfolio', JSON.stringify(updatedPortfolio))
      
      const response = await api.put('/users/freelancer-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data.success) {
        // Reload profile
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
          const reviews = reviewsResponse.data.data || []
          if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0)
            const avgRating = (totalRating / reviews.length).toFixed(1)
            reputasi = `${avgRating}/5`
          }
        }
      } catch (reviewErr) {
        console.log('Reviews not available')
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
  
  // Get freelancer profile and parse file_portfolio if it's a string
  let freelancerProfile = profile.freelancerProfile || profile.profil_freelancer || {}
  
  // Parse file_portfolio if it's a JSON string
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
          {/* Cover Image */}
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
              <button
                onClick={() => navigate(`/freelancer/${profile.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-full flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all hover:shadow-xl"
                title="Preview Public Profile"
              >
                <i className="fas fa-eye text-sm"></i>
                <span className="text-sm font-medium">Lihat Profil Publik</span>
              </button>
              <button
                onClick={() => navigate('/profile/edit')}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
                title="Edit Profile"
              >
                <i className="fas fa-pen text-gray-600 text-sm"></i>
              </button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-6">
            <div className="flex items-start -mt-16 mb-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                  {profile.avatar && (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${profile.avatar}?t=${Date.now()}`}
                      alt={fullName} 
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                </div>
              </div>

              <div className="ml-6 mt-20 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                    {freelancerProfile.judul_profesi && (
                      <p className="text-gray-600 mt-1">{freelancerProfile.judul_profesi}</p>
                    )}
                    <p className="text-gray-500 flex items-center mt-1">
                      <i className="fas fa-map-marker-alt mr-2 text-sm"></i>
                      {location}
                    </p>
                  </div>
                  
                  {/* Mobile Preview Button */}
                  <button
                    onClick={() => navigate(`/freelancer/${profile.id}`)}
                    className="lg:hidden px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all text-sm"
                  >
                    <i className="fas fa-eye"></i>
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Sidebar Left */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Card */}
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
                    {/* Email Verification - Always verified (OTP required during registration) */}
                    <div className="flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-600"></i>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm text-gray-900 truncate">{profile.email}</p>
                      </div>
                    </div>
                    
                    {/* Phone Verification - Show if phone number exists */}
                    {profile.no_telepon && (
                      <div className="flex items-center gap-2">
                        <i className="fas fa-check-circle text-green-600"></i>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Nomor HP</p>
                          <p className="text-sm text-gray-900">{profile.no_telepon}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bahasa */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Bahasa</h2>
              {freelancerProfile.bahasa && freelancerProfile.bahasa.length > 0 ? (
                <div className="space-y-2">
                  {freelancerProfile.bahasa.map((lang, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-700">
                      <i className="fas fa-language text-gray-400"></i>
                      <span>{lang}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Belum ada bahasa</p>
              )}
            </div>

            {/* Keahlian */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Keahlian</h2>
              {freelancerProfile.keahlian && freelancerProfile.keahlian.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {freelancerProfile.keahlian.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Belum ada keahlian</p>
              )}
            </div>

            {/* Edukasi */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Edukasi</h2>
              {freelancerProfile.edukasi && freelancerProfile.edukasi.length > 0 ? (
                <div className="space-y-3">
                  {freelancerProfile.edukasi.map((edu, idx) => (
                    <div key={idx} className="border-l-2 border-blue-500 pl-3">
                      <p className="font-medium text-gray-900 text-sm">{edu.institusi || edu}</p>
                      {edu.jurusan && <p className="text-xs text-gray-600 mt-1">{edu.jurusan}</p>}
                      {edu.tahun && <p className="text-xs text-gray-500 mt-1">{edu.tahun}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Belum ada edukasi</p>
              )}
            </div>

            {/* Lisensi */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Lisensi</h2>
              {freelancerProfile.lisensi && freelancerProfile.lisensi.length > 0 ? (
                <div className="space-y-3">
                  {freelancerProfile.lisensi.map((lic, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <i className="fas fa-certificate text-yellow-500 mt-1 text-sm"></i>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{lic.nama || lic}</p>
                        {lic.penerbit && <p className="text-xs text-gray-600 mt-1">{lic.penerbit}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Belum ada lisensi</p>
              )}
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Deskripsi Lengkap */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {freelancerProfile.judul_profesi || 'Deskripsi'}
              </h2>
              {freelancerProfile.deskripsi_lengkap ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {freelancerProfile.deskripsi_lengkap}
                </p>
              ) : (
                <p className="text-gray-500">
                  Belum ada deskripsi. Tambahkan deskripsi untuk menjelaskan keahlian dan pengalaman Anda.
                </p>
              )}
            </div>

            {/* Portfolio */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Portofolio</h2>
                <button
                  onClick={() => navigate('/profile/edit')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
                >
                  <i className="fas fa-plus"></i>
                  Tambah Portofolio
                </button>
              </div>
              
              {freelancerProfile.file_portfolio && Array.isArray(freelancerProfile.file_portfolio) && freelancerProfile.file_portfolio.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {freelancerProfile.file_portfolio.map((item, idx) => {
                    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000'
                    const imageUrl = item.url || item
                    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`
                    
                    return (
                      <div 
                        key={idx} 
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg transition-all cursor-pointer group relative"
                        onClick={() => {
                          setSelectedPortfolio({ ...item, url: fullUrl, index: idx })
                          setShowPortfolioModal(true)
                        }}
                      >
                        <img 
                          src={fullUrl} 
                          alt={item.filename || `Portfolio ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            console.error('Failed to load image:', fullUrl)
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
                          }}
                        />
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                          <i className="fas fa-search-plus text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></i>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <i className="fas fa-images text-gray-300 text-5xl mb-4"></i>
                  <p className="text-gray-500 mb-4">Belum ada portofolio</p>
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Tambah Portofolio Pertama
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hapus Portfolio?</h3>
                <p className="text-sm text-gray-600">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Apakah Anda yakin ingin menghapus portfolio <strong>"{selectedPortfolio?.judul || 'ini'}"</strong>?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeletePortfolio}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i>
                    Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Detail Modal */}
      {showPortfolioModal && selectedPortfolio && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPortfolioModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedPortfolio.judul || `Portfolio ${selectedPortfolio.index + 1}`}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                  title="Hapus Portfolio"
                >
                  <i className="fas fa-trash"></i>
                  <span className="text-sm font-medium">Hapus</span>
                </button>
                <button
                  onClick={() => setShowPortfolioModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times text-gray-600 text-xl"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Image */}
              <div className="mb-6 rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={selectedPortfolio.url} 
                  alt={selectedPortfolio.filename || 'Portfolio'}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>

              {/* Description */}
              {selectedPortfolio.deskripsi && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Deskripsi</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedPortfolio.deskripsi}
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <i className="fas fa-images mr-2"></i>
                  {selectedPortfolio.index + 1} dari {freelancerProfile.file_portfolio?.length || 0} portfolio
                </p>
              </div>
            </div>

            {/* Modal Footer - Navigation */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => {
                  const prevIndex = selectedPortfolio.index - 1
                  if (prevIndex >= 0) {
                    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000'
                    const prevItem = freelancerProfile.file_portfolio[prevIndex]
                    const imageUrl = prevItem.url || prevItem
                    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`
                    setSelectedPortfolio({ ...prevItem, url: fullUrl, index: prevIndex })
                  }
                }}
                disabled={selectedPortfolio.index === 0}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i className="fas fa-chevron-left"></i>
                Sebelumnya
              </button>

              <span className="text-sm text-gray-600">
                {selectedPortfolio.index + 1} / {freelancerProfile.file_portfolio?.length || 0}
              </span>

              <button
                onClick={() => {
                  const nextIndex = selectedPortfolio.index + 1
                  if (nextIndex < freelancerProfile.file_portfolio.length) {
                    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000'
                    const nextItem = freelancerProfile.file_portfolio[nextIndex]
                    const imageUrl = nextItem.url || nextItem
                    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`
                    setSelectedPortfolio({ ...nextItem, url: fullUrl, index: nextIndex })
                  }
                }}
                disabled={selectedPortfolio.index === (freelancerProfile.file_portfolio?.length || 0) - 1}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Selanjutnya
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
