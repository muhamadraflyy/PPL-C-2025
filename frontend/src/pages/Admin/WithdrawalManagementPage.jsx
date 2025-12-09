import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from '../../components/Fragments/Admin/Sidebar'
import { Header } from '../../components/Fragments/Admin/Header'
import { DollarSign, Shield, Wallet } from 'lucide-react'
import paymentService from '../../services/paymentService'

export default function WithdrawalManagementPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [withdrawals, setWithdrawals] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [processing, setProcessing] = useState({})
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [buktiTransfer, setBuktiTransfer] = useState('')
  const [catatan, setCatatan] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    setLoading(true)

    // Fetch withdrawals
    const withdrawalResult = await paymentService.adminGetWithdrawals({
      status: filter === 'all' ? null : filter
    })

    if (withdrawalResult.success) {
      setWithdrawals(withdrawalResult.withdrawals || [])
    }

    // Fetch analytics
    const analyticsResult = await paymentService.getWithdrawalAnalytics()
    if (analyticsResult.success) {
      setAnalytics(analyticsResult.data)
    }

    setLoading(false)
  }

  const handleApprove = (withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setShowApproveModal(true)
    setBuktiTransfer('')
    setCatatan('')
  }

  const handleReject = (withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setShowRejectModal(true)
    setRejectReason('')
  }

  const submitApproval = async () => {
    if (!buktiTransfer.trim()) {
      alert('URL Bukti transfer wajib diisi!')
      return
    }

    if (!window.confirm(`Yakin ingin approve withdrawal sebesar ${formatRupiah(selectedWithdrawal.jumlah_bersih)}?`)) {
      return
    }

    setProcessing(prev => ({ ...prev, [selectedWithdrawal.id]: true }))

    const result = await paymentService.adminApproveWithdrawal(selectedWithdrawal.id, {
      bukti_transfer: buktiTransfer,
      catatan: catatan
    })

    if (result.success) {
      alert('✅ Withdrawal berhasil diapprove!')
      setShowApproveModal(false)
      fetchData()
    } else {
      alert(`❌ Gagal: ${result.message}`)
    }

    setProcessing(prev => ({ ...prev, [selectedWithdrawal.id]: false }))
  }

  const submitRejection = async () => {
    if (!rejectReason.trim()) {
      alert('Alasan penolakan wajib diisi!')
      return
    }

    if (!window.confirm(`Yakin ingin reject withdrawal sebesar ${formatRupiah(selectedWithdrawal.jumlah_bersih)}?`)) {
      return
    }

    setProcessing(prev => ({ ...prev, [selectedWithdrawal.id]: true }))

    const result = await paymentService.adminRejectWithdrawal(selectedWithdrawal.id, {
      reason: rejectReason
    })

    if (result.success) {
      alert('✅ Withdrawal berhasil ditolak!')
      setShowRejectModal(false)
      fetchData()
    } else {
      alert(`❌ Gagal: ${result.message}`)
    }

    setProcessing(prev => ({ ...prev, [selectedWithdrawal.id]: false }))
  }

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const configs = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu' },
      'processing': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Diproses' },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Selesai' },
      'failed': { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' }
    }
    const config = configs[status] || configs['pending']
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeMenu="transactions" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex gap-1">
            <button
              onClick={() => navigate('/admin/transactions')}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                location.pathname === '/admin/transactions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <DollarSign size={18} />
              Transaksi
            </button>
            <button
              onClick={() => navigate('/admin/escrow')}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                location.pathname === '/admin/escrow'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Shield size={18} />
              Escrow
            </button>
            <button
              onClick={() => navigate('/admin/withdrawals')}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                location.pathname === '/admin/withdrawals'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Wallet size={18} />
              Penarikan
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Withdrawal Management</h1>
            <p className="text-gray-600 mt-2">Kelola permintaan penarikan dana freelancer</p>
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Menunggu Approval</h3>
                <p className="text-3xl font-bold text-yellow-600">{analytics.pending?.count || 0}</p>
                <p className="text-sm text-gray-500 mt-2">{formatRupiah(analytics.pending?.total_amount || 0)}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Sedang Diproses</h3>
                <p className="text-3xl font-bold text-blue-600">{analytics.processing?.count || 0}</p>
                <p className="text-sm text-gray-500 mt-2">{formatRupiah(analytics.processing?.total_amount || 0)}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Selesai</h3>
                <p className="text-3xl font-bold text-green-600">{analytics.completed?.count || 0}</p>
                <p className="text-sm text-gray-500 mt-2">{formatRupiah(analytics.completed?.total_amount || 0)}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Ditolak</h3>
                <p className="text-3xl font-bold text-red-600">{analytics.failed?.count || 0}</p>
                <p className="text-sm text-gray-500 mt-2">{formatRupiah(analytics.failed?.total_amount || 0)}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Penarikan</h3>
                <p className="text-3xl font-bold text-gray-900">{analytics.total?.count || 0}</p>
                <p className="text-sm text-gray-500 mt-2">{formatRupiah(analytics.total?.total_amount || 0)}</p>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {['pending', 'processing', 'completed', 'failed', 'all'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm capitalize ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status === 'pending' ? 'Menunggu' :
                 status === 'processing' ? 'Diproses' :
                 status === 'completed' ? 'Selesai' :
                 status === 'failed' ? 'Ditolak' : 'Semua'}
              </button>
            ))}
          </div>

          {/* Withdrawal Table */}
          {loading ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <p className="text-gray-600">Tidak ada permintaan penarikan</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Freelancer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah Kotor</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fee Platform</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah Bersih</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {withdrawals.map(withdrawal => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>{formatDate(withdrawal.created_at)}</div>
                          {withdrawal.dicairkan_pada && (
                            <div className="text-xs text-gray-500 mt-1">
                              Selesai: {formatDate(withdrawal.dicairkan_pada)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {withdrawal.freelancer?.nama_depan} {withdrawal.freelancer?.nama_belakang}
                          </div>
                          <div className="text-xs text-gray-500">{withdrawal.freelancer?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{withdrawal.bank_name}</div>
                          <div className="text-xs text-gray-500 font-mono">{withdrawal.nomor_rekening}</div>
                          <div className="text-xs text-gray-500">{withdrawal.nama_pemilik}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">
                          {formatRupiah(withdrawal.jumlah)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-red-600">
                          -{formatRupiah(withdrawal.biaya_platform)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-green-600">
                          {formatRupiah(withdrawal.jumlah_bersih)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(withdrawal.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {withdrawal.status === 'pending' && (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleApprove(withdrawal)}
                                disabled={processing[withdrawal.id]}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processing[withdrawal.id] ? 'Memproses...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleReject(withdrawal)}
                                disabled={processing[withdrawal.id]}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {withdrawal.status === 'completed' && withdrawal.bukti_transfer && (
                            <a
                              href={withdrawal.bukti_transfer}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 text-sm hover:underline"
                            >
                              Lihat Bukti
                            </a>
                          )}
                          {(withdrawal.status === 'processing' || withdrawal.status === 'failed') && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Approve Withdrawal</h3>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {selectedWithdrawal.freelancer?.nama_depan} {selectedWithdrawal.freelancer?.nama_belakang}
              </p>
              <p className="text-xs text-blue-700 mt-1">{selectedWithdrawal.freelancer?.email}</p>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Bank:</span>
                  <span className="font-medium text-blue-900">{selectedWithdrawal.bank_name} - {selectedWithdrawal.nomor_rekening}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-blue-700">A/N:</span>
                  <span className="font-medium text-blue-900">{selectedWithdrawal.nama_pemilik}</span>
                </div>
                <div className="flex justify-between text-lg mt-3 pt-3 border-t border-blue-200">
                  <span className="font-semibold text-blue-900">Transfer:</span>
                  <span className="font-bold text-green-600">{formatRupiah(selectedWithdrawal.jumlah_bersih)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Bukti Transfer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={buktiTransfer}
                  onChange={(e) => setBuktiTransfer(e.target.value)}
                  placeholder="https://example.com/bukti-transfer.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Upload bukti transfer ke storage dan paste URL-nya di sini</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows="3"
                  placeholder="Catatan untuk freelancer..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={processing[selectedWithdrawal.id]}
              >
                Batal
              </button>
              <button
                onClick={submitApproval}
                disabled={processing[selectedWithdrawal.id] || !buktiTransfer.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing[selectedWithdrawal.id] ? 'Memproses...' : 'Approve & Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Withdrawal</h3>

            <div className="mb-4 p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-900">
                {selectedWithdrawal.freelancer?.nama_depan} {selectedWithdrawal.freelancer?.nama_belakang}
              </p>
              <p className="text-xs text-red-700 mt-1">{selectedWithdrawal.freelancer?.email}</p>
              <div className="mt-3 pt-3 border-t border-red-200">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-red-900">Jumlah:</span>
                  <span className="font-bold text-red-600">{formatRupiah(selectedWithdrawal.jumlah_bersih)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows="4"
                placeholder="Jelaskan alasan penolakan withdrawal..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={processing[selectedWithdrawal.id]}
              >
                Batal
              </button>
              <button
                onClick={submitRejection}
                disabled={processing[selectedWithdrawal.id] || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing[selectedWithdrawal.id] ? 'Memproses...' : 'Reject Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
