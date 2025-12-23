import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Fragments/Common/Navbar'
import Footer from '../../components/Fragments/Common/Footer'
import api from '../../utils/axiosConfig'
import { useToast } from '../../components/Fragments/Common/ToastProvider'

export default function FreelancerProfileEditPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const fotoProfilInputRef = useRef(null)
  const fotoLatarInputRef = useRef(null)
  const portfolioInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPortfolioModal, setShowPortfolioModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [portfolioToDelete, setPortfolioToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    nama_depan: '',
    nama_belakang: '',
    no_telepon: '',
    kota: '',
    provinsi: '',
    judul_profesi: '',
    deskripsi_lengkap: '',
    keahlian: [],
    bahasa: [],
    edukasi: [],
    lisensi: []
  })

  const [previewImages, setPreviewImages] = useState({
    fotoProfil: null,
    fotoLatar: null
  })

  const [uploadedFiles, setUploadedFiles] = useState({
    fotoProfil: null,
    fotoLatar: null
  })

  // Portfolio state - untuk modal sementara
  const [tempPortfolioFiles, setTempPortfolioFiles] = useState([])
  const [tempPortfolioPreviews, setTempPortfolioPreviews] = useState([])
  const [portfolioData, setPortfolioData] = useState({
    judul: '',
    deskripsi: ''
  })
  
  // Portfolio items yang sudah disimpan
  const [portfolioItems, setPortfolioItems] = useState([])

  // Temporary inputs for adding items
  const [newKeahlian, setNewKeahlian] = useState('')
  const [newBahasa, setNewBahasa] = useState('')
  const [newEdukasi, setNewEdukasi] = useState('')
  const [newLisensi, setNewLisensi] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/profile')

      if (response.data.success && response.data.data) {
        const profile = response.data.data
        let freelancerProfile = profile.freelancerProfile || profile.profil_freelancer || {}
        
        // Parse file_portfolio if it's a JSON string
        if (freelancerProfile.file_portfolio && typeof freelancerProfile.file_portfolio === 'string') {
          try {
            freelancerProfile = {
              ...freelancerProfile,
              file_portfolio: JSON.parse(freelancerProfile.file_portfolio)
            }
            console.log('✅ Parsed file_portfolio:', freelancerProfile.file_portfolio)
          } catch (e) {
            console.error('❌ Error parsing file_portfolio:', e)
            freelancerProfile.file_portfolio = []
          }
        } else {
          console.log('📦 file_portfolio type:', typeof freelancerProfile.file_portfolio, freelancerProfile.file_portfolio)
        }
        
        setFormData({
          nama_depan: profile.nama_depan || '',
          nama_belakang: profile.nama_belakang || '',
          no_telepon: profile.no_telepon || '',
          kota: profile.kota || '',
          provinsi: profile.provinsi || '',
          judul_profesi: freelancerProfile.judul_profesi || '',
          deskripsi_lengkap: freelancerProfile.deskripsi_lengkap || '',
          keahlian: freelancerProfile.keahlian || [],
          bahasa: freelancerProfile.bahasa || [],
          edukasi: freelancerProfile.edukasi || [],
          lisensi: freelancerProfile.lisensi || [],
          portfolio: freelancerProfile.file_portfolio || []
        })
        
        setPreviewImages({
          fotoProfil: profile.avatar ? `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${profile.avatar}` : null,
          fotoLatar: profile.foto_latar ? `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${profile.foto_latar}` : null
        })

        // Load existing portfolio items
        if (freelancerProfile.file_portfolio && Array.isArray(freelancerProfile.file_portfolio) && freelancerProfile.file_portfolio.length > 0) {
          const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000'

          // Convert existing portfolio to portfolio items format
          const existingItems = freelancerProfile.file_portfolio.map((item, idx) => {
            const imageUrl = item.url || item
            const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`
            
            return {
              id: `existing-${idx}`,
              judul: item.judul || item.filename || `Portfolio ${idx + 1}`,
              deskripsi: item.deskripsi || '',
              files: [], // Existing files already uploaded
              previews: [fullUrl],
              isExisting: true // Flag to indicate this is already uploaded
            }
          })
          setPortfolioItems(existingItems)
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Gagal memuat profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleImageChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      setError('')
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB')
        return
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError('Format file tidak didukung. Gunakan: JPG, PNG, GIF, atau WebP')
        return
      }

      setUploadedFiles(prev => ({ ...prev, [type]: file }))

      const reader = new FileReader()
      reader.onerror = () => {
        setError('Gagal membaca file. Coba file lain.')
        setUploadedFiles(prev => ({ ...prev, [type]: null }))
      }
      reader.onloadend = () => {
        try {
          setPreviewImages(prev => ({ ...prev, [type]: reader.result }))
        } catch (err) {
          setError('Gagal membuat preview. File mungkin corrupt.')
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('Terjadi kesalahan saat memproses gambar')
    }
  }

  const addKeahlian = () => {
    if (newKeahlian.trim()) {
      setFormData(prev => ({
        ...prev,
        keahlian: [...prev.keahlian, newKeahlian.trim()]
      }))
      setNewKeahlian('')
    }
  }

  const removeKeahlian = (index) => {
    setFormData(prev => ({
      ...prev,
      keahlian: prev.keahlian.filter((_, i) => i !== index)
    }))
  }

  const addBahasa = () => {
    if (newBahasa.trim()) {
      setFormData(prev => ({
        ...prev,
        bahasa: [...prev.bahasa, newBahasa.trim()]
      }))
      setNewBahasa('')
    }
  }

  const removeBahasa = (index) => {
    setFormData(prev => ({
      ...prev,
      bahasa: prev.bahasa.filter((_, i) => i !== index)
    }))
  }

  const addEdukasi = () => {
    if (newEdukasi.trim()) {
      setFormData(prev => ({
        ...prev,
        edukasi: [...prev.edukasi, newEdukasi.trim()]
      }))
      setNewEdukasi('')
    }
  }

  const removeEdukasi = (index) => {
    setFormData(prev => ({
      ...prev,
      edukasi: prev.edukasi.filter((_, i) => i !== index)
    }))
  }

  const addLisensi = () => {
    if (newLisensi.trim()) {
      setFormData(prev => ({
        ...prev,
        lisensi: [...prev.lisensi, newLisensi.trim()]
      }))
      setNewLisensi('')
    }
  }

  const removeLisensi = (index) => {
    setFormData(prev => ({
      ...prev,
      lisensi: prev.lisensi.filter((_, i) => i !== index)
    }))
  }

  const handlePortfolioChange = (e) => {
    console.log('📸 [handlePortfolioChange] File input changed')
    const files = Array.from(e.target.files)
    console.log('📁 Files selected:', files.length)

    if (files.length === 0) {
      console.log('⚠️ No files selected')
      return
    }

    try {
      setError('')

      // Validate files
      for (const file of files) {
        console.log(`🔍 Checking file: ${file.name}, size: ${file.size}, type: ${file.type}`)

        if (file.size > 5 * 1024 * 1024) {
          const errorMsg = 'Ukuran file maksimal 5MB per file'
          setError(errorMsg)
          toast.show(errorMsg, 'error')
          console.error('❌ File too large:', file.name)
          return
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
          const errorMsg = 'Format file tidak didukung. Gunakan: JPG, PNG, GIF, atau WebP'
          setError(errorMsg)
          toast.show(errorMsg, 'error')
          console.error('❌ Invalid file type:', file.type)
          return
        }
      }

      console.log('✅ All files validated')

      // Add to temp portfolio files (untuk modal)
      setTempPortfolioFiles(prev => {
        const updated = [...prev, ...files]
        console.log('📦 Updated tempPortfolioFiles:', updated.length)
        return updated
      })

      // Create previews
      files.forEach((file, idx) => {
        console.log(`📷 Creating preview for file ${idx + 1}:`, file.name)
        const reader = new FileReader()
        reader.onloadend = () => {
          console.log(`✅ Preview created for:`, file.name)
          setTempPortfolioPreviews(prev => [...prev, reader.result])
        }
        reader.onerror = () => {
          console.error('❌ Failed to read file:', file.name)
        }
        reader.readAsDataURL(file)
      })

      toast.show(`${files.length} gambar berhasil ditambahkan`, 'success')
    } catch (err) {
      console.error('❌ Error in handlePortfolioChange:', err)
      const errorMsg = 'Terjadi kesalahan saat memproses gambar portfolio'
      setError(errorMsg)
      toast.show(errorMsg, 'error')
    }
  }

  const removeTempPortfolio = (index) => {
    setTempPortfolioPreviews(prev => prev.filter((_, i) => i !== index))
    setTempPortfolioFiles(prev => prev.filter((_, i) => i !== index))
  }

  const openPortfolioModal = () => {
    setShowPortfolioModal(true)
    setPortfolioData({ judul: '', deskripsi: '' })
    setTempPortfolioFiles([])
    setTempPortfolioPreviews([])
  }

  const closePortfolioModal = () => {
    setShowPortfolioModal(false)
    setPortfolioData({ judul: '', deskripsi: '' })
    setTempPortfolioFiles([])
    setTempPortfolioPreviews([])
  }

  const savePortfolioItem = () => {
    console.log('🔍 [savePortfolioItem] Called')
    console.log('📝 Judul:', portfolioData.judul)
    console.log('📁 Files:', tempPortfolioFiles.length)

    if (!portfolioData.judul.trim()) {
      const errorMsg = 'Judul portfolio harus diisi'
      setError(errorMsg)
      toast.show(errorMsg, 'error')
      console.error('❌ Validation failed: Judul kosong')
      return
    }

    if (tempPortfolioFiles.length === 0) {
      const errorMsg = 'Minimal upload 1 gambar portfolio'
      setError(errorMsg)
      toast.show(errorMsg, 'error')
      console.error('❌ Validation failed: Tidak ada file')
      return
    }

    // Tambahkan ke list portfolio items
    const newItem = {
      id: Date.now(), // temporary ID
      judul: portfolioData.judul,
      deskripsi: portfolioData.deskripsi,
      files: tempPortfolioFiles,
      previews: tempPortfolioPreviews
    }

    console.log('✅ Portfolio item created:', newItem)
    setPortfolioItems(prev => [...prev, newItem])
    closePortfolioModal()
    setSuccess('Portfolio berhasil ditambahkan!')
    toast.show('Portfolio berhasil ditambahkan!', 'success')
    setTimeout(() => setSuccess(''), 3000)
  }

  const confirmDeletePortfolio = (item) => {
    setPortfolioToDelete(item)
    setShowDeleteConfirm(true)
  }

  const removePortfolioItem = async () => {
    if (!portfolioToDelete) return
    
    const itemToRemove = portfolioToDelete
    
    try {
      setDeleting(true)
      
      // If it's an existing portfolio (already in database), need to update backend
      if (itemToRemove?.isExisting) {
        // Get current portfolio
        const response = await api.get('/users/profile')
        if (response.data.success && response.data.data) {
          const profile = response.data.data
          let freelancerProfile = profile.freelancerProfile || profile.profil_freelancer || {}
          
          // Parse file_portfolio
          let currentPortfolio = freelancerProfile.file_portfolio || []
          if (typeof currentPortfolio === 'string') {
            currentPortfolio = JSON.parse(currentPortfolio)
          }
          
          // Remove the item (find by matching preview URL)
          const updatedPortfolio = currentPortfolio.filter(item => {
            const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000'
            const imageUrl = item.url || item
            const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`
            return !itemToRemove.previews.includes(fullUrl)
          })
          
          // Update backend
          const formData = new FormData()
          formData.append('file_portfolio', JSON.stringify(updatedPortfolio))
          
          await api.put('/users/freelancer-profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          
          setSuccess('Portfolio berhasil dihapus!')
          setTimeout(() => setSuccess(''), 3000)
        }
      }
      
      // Remove from local state
      setPortfolioItems(prev => prev.filter(item => item.id !== itemToRemove.id))
      
      // Close modal
      setShowDeleteConfirm(false)
      setPortfolioToDelete(null)
    } catch (err) {
      console.error('Error deleting portfolio:', err)
      setError('Gagal menghapus portfolio')
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const formDataToSend = new FormData()
      
      // User fields
      const namaLengkap = `${formData.nama_depan} ${formData.nama_belakang}`.trim()
      if (namaLengkap) formDataToSend.append('nama_lengkap', namaLengkap)
      if (formData.no_telepon) formDataToSend.append('no_telepon', formData.no_telepon)
      if (formData.kota) formDataToSend.append('kota', formData.kota)
      if (formData.provinsi) formDataToSend.append('provinsi', formData.provinsi)

      // Freelancer profile fields
      if (formData.judul_profesi) formDataToSend.append('judul_profesi', formData.judul_profesi)
      if (formData.deskripsi_lengkap) formDataToSend.append('deskripsi_lengkap', formData.deskripsi_lengkap)
      
      // Arrays as JSON
      if (formData.keahlian.length > 0) formDataToSend.append('keahlian', JSON.stringify(formData.keahlian))
      if (formData.bahasa.length > 0) formDataToSend.append('bahasa', JSON.stringify(formData.bahasa))
      if (formData.edukasi.length > 0) formDataToSend.append('edukasi', JSON.stringify(formData.edukasi))
      if (formData.lisensi.length > 0) formDataToSend.append('lisensi', JSON.stringify(formData.lisensi))

      // Files
      if (uploadedFiles.fotoProfil) formDataToSend.append('foto_profil', uploadedFiles.fotoProfil)
      if (uploadedFiles.fotoLatar) formDataToSend.append('foto_latar', uploadedFiles.fotoLatar)

      // Portfolio files - only send new portfolio items (not existing ones)
      const newPortfolioItems = portfolioItems.filter(item => !item.isExisting)
      if (newPortfolioItems.length > 0) {
        // Flatten: each file gets its own metadata
        const portfolioMetadata = []
        
        newPortfolioItems.forEach((item) => {
          item.files.forEach((file) => {
            formDataToSend.append('portfolio', file)
            // Add metadata for each file
            portfolioMetadata.push({
              judul: item.judul,
              deskripsi: item.deskripsi
            })
          })
        })
        
        // Send portfolio metadata as JSON (one metadata per file)
        formDataToSend.append('portfolio_metadata', JSON.stringify(portfolioMetadata))
      }

      const response = await api.put('/users/freelancer-profile', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      })

      if (response.data.success) {
        // Save success message to sessionStorage
        sessionStorage.setItem('profileUpdateMessage', JSON.stringify({
          message: 'Profile berhasil diperbarui!',
          type: 'success'
        }))
        
        // Navigate to profile page
        navigate('/profile', { replace: true })
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      const errorMessage = err?.response?.data?.message || 'Gagal memperbarui profile'
      
      // Show error toast immediately
      toast.show(errorMessage, 'error')
      
      setError(errorMessage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat profile...</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 font-medium flex items-center">
              <i className="fas fa-check-circle mr-2"></i>
              {success}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-arrow-left text-gray-600"></i>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Edit Profil</h1>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Photo Upload */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Foto Profil & Latar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Foto Profil</label>
                  <div className="flex flex-col items-center">
                    <div 
                      onClick={() => fotoProfilInputRef.current?.click()}
                      className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden bg-gray-50"
                    >
                      {previewImages.fotoProfil ? (
                        <img src={previewImages.fotoProfil} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <i className="fas fa-camera text-gray-400 text-2xl mb-2"></i>
                          <p className="text-xs text-gray-500">Foto Profil</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fotoProfilInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'fotoProfil')}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Foto Latar</label>
                  <div className="flex flex-col items-center">
                    <div 
                      onClick={() => fotoLatarInputRef.current?.click()}
                      className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden bg-gray-50"
                    >
                      {previewImages.fotoLatar ? (
                        <img src={previewImages.fotoLatar} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <i className="fas fa-image text-gray-400 text-2xl mb-2"></i>
                          <p className="text-xs text-gray-500">Foto Latar</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fotoLatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'fotoLatar')}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nama Lengkap</h2>
              <input
                type="text"
                value={`${formData.nama_depan || ''} ${formData.nama_belakang || ''}`.trim()}
                onChange={(e) => {
                  const names = e.target.value.split(' ')
                  setFormData(prev => ({
                    ...prev,
                    nama_depan: names[0] || '',
                    nama_belakang: names.slice(1).join(' ') || ''
                  }))
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nama lengkap"
              />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Nomor Telepon</h2>
                <input
                  type="tel"
                  name="no_telepon"
                  value={formData.no_telepon}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nomor Telepon"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Kota</h2>
                <input
                  type="text"
                  name="kota"
                  value={formData.kota}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Bandung"
                />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Provinsi</h2>
                <input
                  type="text"
                  name="provinsi"
                  value={formData.provinsi}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Jawa Barat"
                />
              </div>
            </div>

            {/* Gelar/Title */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Gelar</h2>
              <input
                type="text"
                name="judul_profesi"
                value={formData.judul_profesi}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contoh: UI/UX Designer, Web Developer"
              />
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Deskripsi</h2>
              <textarea
                name="deskripsi_lengkap"
                value={formData.deskripsi_lengkap}
                onChange={handleChange}
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Jelaskan keahlian dan pengalaman Anda..."
              />
            </div>

            {/* Keahlian */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Keahlian</h2>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newKeahlian}
                  onChange={(e) => setNewKeahlian(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeahlian())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tambah keahlian"
                />
                <button
                  type="button"
                  onClick={addKeahlian}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.keahlian.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2">
                    {skill}
                    <button type="button" onClick={() => removeKeahlian(idx)} className="hover:text-blue-900">
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Bahasa */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bahasa</h2>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newBahasa}
                  onChange={(e) => setNewBahasa(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBahasa())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tambah bahasa"
                />
                <button
                  type="button"
                  onClick={addBahasa}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.bahasa.map((lang, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2">
                    {lang}
                    <button type="button" onClick={() => removeBahasa(idx)} className="hover:text-gray-900">
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Edukasi */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Edukasi</h2>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newEdukasi}
                  onChange={(e) => setNewEdukasi(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEdukasi())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: S1 Desain Grafis - Universitas Indonesia"
                />
                <button
                  type="button"
                  onClick={addEdukasi}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              <div className="space-y-2">
                {formData.edukasi.map((edu, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-gray-700 text-sm">{edu}</span>
                    <button type="button" onClick={() => removeEdukasi(idx)} className="text-red-500 hover:text-red-700">
                      <i className="fas fa-times text-sm"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Lisensi */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lisensi</h2>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newLisensi}
                  onChange={(e) => setNewLisensi(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLisensi())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Adobe Certified Professional"
                />
                <button
                  type="button"
                  onClick={addLisensi}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              <div className="space-y-2">
                {formData.lisensi.map((lic, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-gray-700 text-sm">{lic}</span>
                    <button type="button" onClick={() => removeLisensi(idx)} className="text-red-500 hover:text-red-700">
                      <i className="fas fa-times text-sm"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Portofolio</h2>
                <button
                  type="button"
                  onClick={openPortfolioModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-plus"></i>
                  Tambah Portofolio
                </button>
              </div>

              {portfolioItems.length > 0 ? (
                <div className="space-y-4">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.judul}</h3>
                          {item.deskripsi && (
                            <p className="text-sm text-gray-600 mt-1">{item.deskripsi}</p>
                          )}
                          {item.isExisting && (
                            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              Sudah tersimpan
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => confirmDeletePortfolio(item)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                          title="Hapus Portfolio"
                        >
                          <i className="fas fa-trash text-sm"></i>
                          <span className="text-sm font-medium">Hapus</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {item.previews.map((preview, idx) => (
                          <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-200 border border-gray-300">
                            <img src={preview} alt={`${item.judul} ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <i className="fas fa-images text-gray-300 text-4xl mb-3"></i>
                  <p className="text-gray-500 text-sm">Belum ada portofolio</p>
                  <p className="text-gray-400 text-xs mt-1">Klik tombol "Tambah Portofolio" untuk menambahkan</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>

      <Footer />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && portfolioToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hapus Portfolio?</h3>
                <p className="text-sm text-gray-600">
                  {portfolioToDelete.isExisting 
                    ? 'Portfolio akan dihapus permanen dari database' 
                    : 'Portfolio akan dihapus dari daftar'}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Apakah Anda yakin ingin menghapus portfolio <strong>"{portfolioToDelete.judul}"</strong>?
              </p>
              
              {/* Preview */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg">
                {portfolioToDelete.previews.slice(0, 4).map((preview, idx) => (
                  <div key={idx} className="aspect-square rounded overflow-hidden bg-gray-200">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              
              {portfolioToDelete.isExisting && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 flex items-start gap-2">
                    <i className="fas fa-exclamation-circle mt-0.5"></i>
                    <span>Tindakan ini tidak dapat dibatalkan. Portfolio akan dihapus permanen.</span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setPortfolioToDelete(null)
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={removePortfolioItem}
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

      {/* Portfolio Modal */}
      {showPortfolioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Tambah Portofolio</h2>
              <button
                onClick={closePortfolioModal}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times text-gray-600"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Judul Portofolio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Portofolio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={portfolioData.judul}
                  onChange={(e) => setPortfolioData(prev => ({ ...prev, judul: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Website E-commerce Modern"
                  required
                />
              </div>

              {/* Deskripsi Portofolio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi Portofolio
                </label>
                <textarea
                  value={portfolioData.deskripsi}
                  onChange={(e) => setPortfolioData(prev => ({ ...prev, deskripsi: e.target.value }))}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Deskripsi Portofolio"
                />
              </div>

              {/* Upload Portofolio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gambar Portofolio <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => {
                    console.log('🖱️ Upload area clicked')
                    portfolioInputRef.current?.click()
                  }}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors bg-gray-50"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-6 text-gray-400">
                      <i className="fas fa-image text-4xl"></i>
                      <i className="fas fa-video text-4xl"></i>
                      <i className="fas fa-music text-4xl"></i>
                      <i className="fas fa-link text-4xl"></i>
                      <i className="fas fa-file text-4xl"></i>
                    </div>
                    <p className="text-gray-600 font-medium">Klik untuk upload gambar</p>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF, atau WebP (Max 5MB per file)</p>
                  </div>
                </div>
                <input
                  ref={portfolioInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePortfolioChange}
                  className="hidden"
                />
              </div>

              {/* Portfolio Previews */}
              {tempPortfolioPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {tempPortfolioPreviews.map((preview, idx) => (
                    <div key={idx} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                        <img 
                          src={preview} 
                          alt={`Portfolio ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTempPortfolio(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={closePortfolioModal}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={savePortfolioItem}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
