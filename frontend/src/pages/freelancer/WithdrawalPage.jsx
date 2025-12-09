import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Fragments/Common/Navbar'
import Button from '../../components/Elements/Buttons/Button'
import paymentService from '../../services/paymentService'

export default function WithdrawalPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Balance data
  const [balance, setBalance] = useState({
    pending_escrow: 0,
    available_balance: 0,
    total_withdrawn: 0,
    total_earned: 0
  })

  // Form data
  const [formData, setFormData] = useState({
    jumlah: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    catatan: ''
  })

  // Recent withdrawals
  const [recentWithdrawals, setRecentWithdrawals] = useState([])

  // Fetch balance on mount
  useEffect(() => {
    fetchBalance()
    fetchRecentWithdrawals()
  }, [])

  const fetchBalance = async () => {
    setLoadingBalance(true)
    const result = await paymentService.getUserBalance()
    if (result.success) {
      setBalance(result.data)
    }
    setLoadingBalance(false)
  }

  const fetchRecentWithdrawals = async () => {
    const result = await paymentService.getWithdrawalHistory({ limit: 5 })
    if (result.success) {
      setRecentWithdrawals(result.data.withdrawals || [])
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (!formData.jumlah || parseFloat(formData.jumlah) <= 0) {
      setError('Jumlah penarikan harus lebih dari 0')
      return
    }

    if (parseFloat(formData.jumlah) < 50000) {
      setError('Minimum penarikan adalah Rp 50.000')
      return
    }

    if (parseFloat(formData.jumlah) > balance.available_balance) {
      setError('Jumlah melebihi saldo tersedia')
      return
    }

    if (!formData.bank_name || !formData.bank_account_number || !formData.bank_account_name) {
      setError('Semua field bank wajib diisi')
      return
    }

    setLoading(true)

    try {
      const result = await paymentService.createWithdrawal({
        jumlah: parseFloat(formData.jumlah),
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        bank_account_name: formData.bank_account_name,
        catatan: formData.catatan
      })

      if (result.success) {
        setSuccess(true)
        // Reset form
        setFormData({
          jumlah: '',
          bank_name: '',
          bank_account_number: '',
          bank_account_name: '',
          catatan: ''
        })
        // Refresh balance and history
        fetchBalance()
        fetchRecentWithdrawals()

        // Show success message then redirect after 2 seconds
        setTimeout(() => {
          navigate('/withdrawal/history')
        }, 2000)
      } else {
        setError(result.message || 'Gagal membuat permintaan penarikan')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memproses penarikan')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu' },
      'processing': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Diproses' },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Selesai' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' },
      'failed': { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' }
    }
    const config = statusConfig[status] || statusConfig['pending']
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Penarikan Dana</h1>
          <p className="text-gray-600 mt-2">Cairkan saldo Anda ke rekening bank</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              className="pb-4 px-1 border-b-2 border-blue-500 font-medium text-blue-600 whitespace-nowrap"
            >
              <svg className="w-5 h-5 inline-block mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tarik Dana
            </button>
            <button
              onClick={() => navigate('/withdrawal/history')}
              className="pb-4 px-1 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap transition-colors"
            >
              <svg className="w-5 h-5 inline-block mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Riwayat Penarikan
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="text-blue-900 font-medium">✅ Permintaan Penarikan Berhasil Diajukan!</p>
                <p className="text-blue-700">Permintaan Anda sedang menunggu persetujuan admin. Admin akan memproses dan mengirimkan bukti transfer dalam 1-3 hari kerja. Anda akan menerima notifikasi setelah dana ditransfer.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="text-red-900 font-medium">Error</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Withdrawal Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Form Penarikan</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Penarikan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">Rp</span>
                    <input
                      type="number"
                      name="jumlah"
                      value={formData.jumlah}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="50000"
                      max={balance.available_balance}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum: Rp 50.000 • Maksimum: {formatRupiah(balance.available_balance)}
                  </p>
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Bank <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loading}
                  >
                    <option value="">Pilih Bank</option>
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BNI">BNI</option>
                    <option value="BRI">BRI</option>
                    <option value="CIMB Niaga">CIMB Niaga</option>
                    <option value="Permata">Permata</option>
                    <option value="Danamon">Danamon</option>
                    <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                    <option value="BTN">BTN</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Rekening <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={handleInputChange}
                    placeholder="1234567890"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Pemilik Rekening <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bank_account_name"
                    value={formData.bank_account_name}
                    onChange={handleInputChange}
                    placeholder="NAMA SESUAI REKENING"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500">Pastikan nama sesuai dengan rekening bank</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    name="catatan"
                    value={formData.catatan}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Tambahkan catatan jika diperlukan..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || balance.available_balance === 0}
                  className="w-full"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    'Ajukan Penarikan'
                  )}
                </Button>
              </form>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="text-blue-900 font-medium mb-1">ℹ️ Informasi Penarikan</p>
                    <ul className="text-blue-700 space-y-1 list-disc list-inside">
                      <li>Minimum penarikan: Rp 50.000</li>
                      <li><strong>Penarikan akan diproses oleh admin</strong> dalam 1-3 hari kerja</li>
                      <li>Admin akan mengirimkan bukti transfer setelah dana ditransfer</li>
                      <li>Tidak ada biaya administrasi untuk penarikan</li>
                      <li>Pastikan data rekening sudah benar sebelum submit</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Balance & Recent Withdrawals */}
          <div className="lg:col-span-1 space-y-6">
            {/* Balance Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Saldo Anda</h3>

              {loadingBalance ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Available Balance */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700 mb-1">Saldo Tersedia</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatRupiah(balance.available_balance)}
                    </p>
                  </div>

                  {/* Pending Escrow */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Dana Escrow</span>
                    <span className="font-semibold text-gray-900">
                      {formatRupiah(balance.pending_escrow)}
                    </span>
                  </div>

                  {/* Total Earned */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Total Pendapatan</span>
                    <span className="font-semibold text-gray-900">
                      {formatRupiah(balance.total_earned)}
                    </span>
                  </div>

                  {/* Total Withdrawn */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Total Ditarik</span>
                    <span className="font-semibold text-gray-900">
                      {formatRupiah(balance.total_withdrawn)}
                    </span>
                  </div>
                </div>
              )}

              {/* View History Button */}
              <button
                onClick={() => navigate('/withdrawal/history')}
                className="w-full mt-4 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Lihat Riwayat Lengkap
              </button>
            </div>

            {/* Recent Withdrawals */}
            {recentWithdrawals.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Penarikan Terakhir</h3>

                <div className="space-y-3">
                  {recentWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-gray-900">
                          {formatRupiah(withdrawal.jumlah)}
                        </span>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      <p className="text-xs text-gray-600">
                        {withdrawal.bank_name} • {withdrawal.bank_account_number}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(withdrawal.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
