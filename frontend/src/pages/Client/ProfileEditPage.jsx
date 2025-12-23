import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Fragments/Common/Navbar'
import Footer from '../../components/Fragments/Common/Footer'
import api from '../../utils/axiosConfig'
import { useToast } from '../../components/Fragments/Common/ToastProvider'

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const fotoProfilInputRef = useRef(null)
  const fotoLatarInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    nama_depan: '',
    nama_belakang: '',
    no_telepon: '',
    bio: '',
    kota: '',
    provinsi: '',
    anggaran: '',
    tipe_proyek: ''
  })

  const [previewImages, setPreviewImages] = useState({
    fotoProfil: null,
    fotoLatar: null
  })

  const [uploadedFiles, setUploadedFiles] = useState({
    fotoProfil: null,
    fotoLatar: null
  })

  const [projectTypes, setProjectTypes] = useState([])
  const [newProjectType, setNewProjectType] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/profile')

      if (response.data.success && response.data.data) {
        const profile = response.data.data
        
        // Format anggaran untuk display
        const formattedAnggaran = profile.anggaran ? formatRupiahForInput(profile.anggaran) : ''
        
        setFormData({
          nama_depan: profile.nama_depan || '',
          nama_belakang: profile.nama_belakang || '',
          no_telepon: profile.no_telepon || '',
          bio: profile.bio || '',
          kota: profile.kota || '',
          provinsi: profile.provinsi || '',
          anggaran: formattedAnggaran,
          tipe_proyek: profile.tipe_proyek || ''
        })
        
        // Parse tipe proyek menjadi array
        if (profile.tipe_proyek) {
          setProjectTypes(profile.tipe_proyek.split(',').map(t => t.trim()).filter(Boolean))
        }
        
        // Set preview images dengan URL lengkap dari backend
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'
        setPreviewImages({
          fotoProfil: profile.avatar ? `${baseUrl}${profile.avatar}` : null,
          fotoLatar: profile.foto_latar ? `${baseUrl}${profile.foto_latar}` : null
        })
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Gagal memuat profile')
    } finally {
      setLoading(false)
    }
  }

  // Format angka ke format Rupiah untuk input
  const formatRupiahForInput = (value) => {
    if (!value) return ''
    
    // Jika sudah dalam format string dengan "Rp", extract angkanya
    let number = value
    if (typeof value === 'string') {
      number = value.replace(/[^0-9]/g, '')
    }
    
    if (!number || number === '0') return ''
    
    // Format dengan pemisah ribuan
    return new Intl.NumberFormat('id-ID').format(number)
  }

  // Parse Rupiah input ke angka
  const parseRupiahInput = (value) => {
    if (!value) return ''
    return value.replace(/[^0-9]/g, '')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Khusus untuk anggaran, format sebagai Rupiah
    if (name === 'anggaran') {
      const numericValue = parseRupiahInput(value)
      const formattedValue = formatRupiahForInput(numericValue)
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleAddProjectType = () => {
    if (newProjectType.trim() && !projectTypes.includes(newProjectType.trim())) {
      const updatedTypes = [...projectTypes, newProjectType.trim()]
      setProjectTypes(updatedTypes)
      setFormData(prev => ({
        ...prev,
        tipe_proyek: updatedTypes.join(', ')
      }))
      setNewProjectType('')
    }
  }

  const handleRemoveProjectType = (typeToRemove) => {
    const updatedTypes = projectTypes.filter(type => type !== typeToRemove)
    setProjectTypes(updatedTypes)
    setFormData(prev => ({
      ...prev,
      tipe_proyek: updatedTypes.join(', ')
    }))
  }

  const handleProjectTypeKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddProjectType()
    }
  }

  const handleImageChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      // Clear previous errors
      setError('')
      
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB')
        return
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError('Format file tidak didukung. Gunakan: JPG, PNG, GIF, atau WebP')
        return
      }

      // Simpan file untuk upload
      setUploadedFiles(prev => ({
        ...prev,
        [type]: file
      }))

      // Buat preview
      const reader = new FileReader()
      
      reader.onerror = () => {
        setError('Gagal membaca file. Coba file lain.')
        setUploadedFiles(prev => ({
          ...prev,
          [type]: null
        }))
      }
      
      reader.onloadend = () => {
        try {
          setPreviewImages(prev => ({
            ...prev,
            [type]: reader.result
          }))
        } catch (err) {
          console.error('Error setting preview:', err)
          setError('Gagal membuat preview. File mungkin corrupt.')
        }
      }
      
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Error handling image:', err)
      setError('Terjadi kesalahan saat memproses gambar')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Buat FormData untuk multipart/form-data
      const formDataToSend = new FormData()
      
      console.log('📤 Sending profile data:', formData)
      
      // Map nama_depan + nama_belakang -> nama_lengkap (backend expects this)
      const namaLengkap = `${formData.nama_depan || ''} ${formData.nama_belakang || ''}`.trim()
      if (namaLengkap) {
        formDataToSend.append('nama_lengkap', namaLengkap)
        console.log('  nama_lengkap:', namaLengkap)
      }
      
      // Send kota and provinsi separately (backend will handle them)
      if (formData.kota) {
        formDataToSend.append('kota', formData.kota)
        console.log('  kota:', formData.kota)
      }
      if (formData.provinsi) {
        formDataToSend.append('provinsi', formData.provinsi)
        console.log('  provinsi:', formData.provinsi)
      }
      
      // Tambahkan field lainnya
      if (formData.no_telepon) {
        formDataToSend.append('no_telepon', formData.no_telepon)
        console.log('  no_telepon:', formData.no_telepon)
      }
      if (formData.bio) {
        formDataToSend.append('bio', formData.bio)
        console.log('  bio:', formData.bio)
      }
      
      // Untuk anggaran, kirim angka murni tanpa format
      if (formData.anggaran) {
        const numericAnggaran = parseRupiahInput(formData.anggaran)
        formDataToSend.append('anggaran', numericAnggaran)
        console.log('  anggaran:', numericAnggaran)
      }
      
      if (formData.tipe_proyek) {
        formDataToSend.append('tipe_proyek', formData.tipe_proyek)
        console.log('  tipe_proyek:', formData.tipe_proyek)
      }

      // Tambahkan file jika ada
      if (uploadedFiles.fotoProfil) {
        formDataToSend.append('foto_profil', uploadedFiles.fotoProfil)
        console.log('  foto_profil:', uploadedFiles.fotoProfil.name)
      }
      if (uploadedFiles.fotoLatar) {
        formDataToSend.append('foto_latar', uploadedFiles.fotoLatar)
        console.log('  foto_latar:', uploadedFiles.fotoLatar.name)
      }

      const response = await api.put('/users/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout for large files
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
      
      // Better error messages
      let errorMessage = 'Gagal memperbarui profile'
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. File terlalu besar atau koneksi lambat.'
      } else if (err.response?.status === 413) {
        errorMessage = 'File terlalu besar. Maksimal 5MB.'
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || 'Data tidak valid'
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      // Show error toast immediately
      toast.show(errorMessage, 'error')
      
      setError(errorMessage)
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const fullName = `${formData.nama_depan} ${formData.nama_belakang}`.trim() || 'User'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 font-medium flex items-center">
              <i className="fas fa-check-circle mr-2"></i>
              {success}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </p>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                title="Kembali ke Profile"
              >
                <i className="fas fa-arrow-left text-gray-600"></i>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Edit Profil</h1>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Photo Upload Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Foto Profil & Latar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Foto Profil */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Foto Profil
                  </label>
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
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Klik untuk upload<br />Max 5MB
                    </p>
                  </div>
                </div>

                {/* Foto Latar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Foto Latar
                  </label>
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
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Klik untuk upload<br />Max 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nama Lengkap</h2>
              <input
                type="text"
                name="nama_lengkap"
                value={`${formData.nama_depan || ''} ${formData.nama_belakang || ''}`.trim()}
                onChange={(e) => {
                  const value = e.target.value
                  const names = value.split(' ')
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

            {/* Contact Information */}
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

            {/* Location - Separate Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Kota</h2>
                <input
                  type="text"
                  name="kota"
                  value={formData.kota || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Tanjung Pandan"
                />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Provinsi</h2>
                <input
                  type="text"
                  name="provinsi"
                  value={formData.provinsi || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Kepulauan Bangka Belitung"
                />
              </div>
            </div>

            {/* About Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tentang Kami</h2>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Jelaskan sedikit tentang diri Anda untuk membantu klien atau freelancer memahami kebutuhan dan pengalaman Anda. Sertakan proyek, partisipan, atau pencapaian yang relevan. Buatlah singkat dan padat berisi dan menarik!"
              />
            </div>

            {/* Project Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Anggaran Per Proyek</h2>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    Rp
                  </span>
                  <input
                    type="text"
                    name="anggaran"
                    value={formData.anggaran}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Contoh: 5.000.000</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipe Proyek</h2>
                <div className="relative">
                  <input
                    type="text"
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value)}
                    onKeyPress={handleProjectTypeKeyPress}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                    placeholder="Tambah tipe proyek"
                  />
                  <button
                    type="button"
                    onClick={handleAddProjectType}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <i className="fas fa-plus text-sm"></i>
                  </button>
                </div>
                
                {/* Display project types as tags */}
                {projectTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {projectTypes.map((type, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 flex items-center gap-2"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => handleRemoveProjectType(type)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
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
    </div>
  )
}
