import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Fragments/Common/Navbar'
import Footer from '../../components/Fragments/Common/Footer'
import api from '../../utils/axiosConfig'
import { useToast } from '../../components/Fragments/Common/ToastProvider'

export default function ProfilePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalPekerjaan: 0,
    reputasi: '5/5',
    proyekAktif: 0
  })

  // Format number to Rupiah
  const formatRupiah = (value) => {
    if (!value) return 'Belum diisi'
    
    // If already formatted (contains "Rp"), return as is
    if (typeof value === 'string' && value.includes('Rp')) {
      return value
    }
    
    // If it's a number, format it
    const number = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) : value
    if (isNaN(number)) return value
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number)
  }

  useEffect(() => {
    // Always reload profile when component mounts
    loadProfile()
    loadStats()
    
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
  }, [toast]) // Empty dependency = run on mount
  
  // Also reload when window gains focus (user returns from edit)
  useEffect(() => {
    const handleFocus = () => {
      loadProfile()
      loadStats()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/profile')
      
      console.log('📥 Profile API Response:', response.data)
      
      if (response.data.success && response.data.data) {
        console.log('✅ Profile Data:', {
          nama_depan: response.data.data.nama_depan,
          nama_belakang: response.data.data.nama_belakang,
          kota: response.data.data.kota,
          provinsi: response.data.data.provinsi
        })
        setProfile(response.data.data)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Gagal memuat profile')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Load statistics from orders (my orders as client)
      const ordersResponse = await api.get('/orders/my')
      
      let totalPekerjaan = 0
      let proyekAktif = 0
      
      if (ordersResponse.data.success) {
        const orders = ordersResponse.data.data || []
        // Status: menunggu_pembayaran, dibayar, dikerjakan, menunggu_review, revisi, selesai, dispute, dibatalkan, refunded
        totalPekerjaan = orders.filter(o => o.status === 'selesai').length
        proyekAktif = orders.filter(o => ['menunggu_pembayaran', 'dibayar', 'dikerjakan', 'menunggu_review', 'revisi'].includes(o.status)).length
      }
      
      // Load rating from reviews
      let reputasi = '5/5'
      try {
        const reviewsResponse = await api.get('/reviews/my')
        if (reviewsResponse.data.success) {
          const reviews = reviewsResponse.data.data || []
          if (reviews.length > 0) {
            // Calculate average rating
            const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0)
            const avgRating = (totalRating / reviews.length).toFixed(1)
            reputasi = `${avgRating}/5`
          }
        }
      } catch (reviewErr) {
        console.log('Reviews endpoint not available, using default rating')
      }
      
      setStats({
        totalPekerjaan,
        reputasi,
        proyekAktif
      })
    } catch (err) {
      // Jika endpoint orders belum ada atau error, gunakan default stats
      console.log('Orders endpoint not available, using default stats')
      setStats({
        totalPekerjaan: 0,
        reputasi: '5/5',
        proyekAktif: 0
      })
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

  const fullName = `${profile.nama_depan || ''} ${profile.nama_belakang || ''}`.trim() || profile.email?.split('@')[0] || 'User'
  const location = [profile.kota, profile.provinsi].filter(Boolean).join(', ') || 'Bandung, Indonesia'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-32 relative overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-300"></div>
            
            {/* Image Layer (if exists) */}
            {profile.foto_latar && (
              <img 
                src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${profile.foto_latar}`} 
                alt="Cover" 
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  console.log('Cover image failed to load:', e.target.src)
                  e.target.style.display = 'none'
                }}
              />
            )}
            
            {/* Edit Button - Always on top */}
            <button
              onClick={() => navigate('/profile/edit')}
              className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors z-10"
              title="Edit Profile"
            >
              <i className="fas fa-pen text-gray-600 text-sm"></i>
            </button>
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-6">
            <div className="flex items-start -mt-12 mb-4">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden relative">
                  {/* Fallback Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Profile Image (if exists) */}
                  {profile.avatar && (
                    <img 
                      src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${profile.avatar}`} 
                      alt={fullName} 
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Profile image failed to load:', e.target.src)
                        e.target.style.display = 'none'
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Name and Location */}
              <div className="ml-6 mt-14">
                <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                <p className="text-gray-500 flex items-center mt-1">
                  <i className="fas fa-map-marker-alt mr-2 text-sm"></i>
                  {location}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.totalPekerjaan}</p>
                <p className="text-sm text-gray-500 mt-1">Total Pekerjaan</p>
              </div>
              <div className="text-center border-x border-gray-100">
                <p className="text-2xl font-bold text-gray-900">{stats.reputasi}</p>
                <p className="text-sm text-gray-500 mt-1">Reputasi</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.proyekAktif}</p>
                <p className="text-sm text-gray-500 mt-1">Proyek Aktif</p>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tentang Kami</h2>
          <p className="text-gray-700 leading-relaxed">
            {profile.bio || 'Kami adalah penerbit buku anak yang berfokus pada pendidikan dan nilai-nilai moral. Saat ini kami sedang mencari ilustrator penulis lepas untuk membantu kami membuat buku bergambar yang menarik dan berkualitas tinggi.'}
          </p>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Budget Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Anggaran Per Proyek</h2>
            <p className="text-gray-700 font-semibold mb-3">
              {profile.anggaran ? formatRupiah(profile.anggaran) : 'Belum diisi'}
            </p>
          </div>

          {/* Project Type Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tipe Proyek</h2>
            <div className="flex flex-wrap gap-2">
              {profile.tipe_proyek ? (
                profile.tipe_proyek.split(',').map((type, idx) => (
                  <span key={idx} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                    {type.trim()}
                  </span>
                ))
              ) : (
                <>
                  <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                    Ilustrasi Buku Anak
                  </span>
                  <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                    Desain Grafis
                  </span>
                  <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                    Animasi
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
