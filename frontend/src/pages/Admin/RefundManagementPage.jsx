import { useState, useEffect } from 'react'
import { Sidebar } from '../../components/Fragments/Admin/Sidebar'
import { Header } from '../../components/Fragments/Admin/Header'
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import api from '../../utils/axiosConfig'

export default function RefundManagementPage() {
  const [loading, setLoading] = useState(true)
  const [refunds, setRefunds] = useState([])
  const [filter, setFilter] = useState('pending')
  const [processing, setProcessing] = useState({})
  const [selectedRefund, setSelectedRefund] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState('') // 'approve' or 'reject'
  const [catatan, setCatatan] = useState('')

  useEffect(() => {
    fetchRefunds()
  }, [filter])

  const fetchRefunds = async () => {
    setLoading(true)
    try {
      const response = await api.get('/payments/refunds', {
        params: { status: filter === 'all' ? null : filter }
      })

      if (response.data.success) {
        setRefunds(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching refunds:', error)
    }
    setLoading(false)
  }

  const openModal = (refund, action) => {
    setSelectedRefund(refund)
    setModalAction(action)
    setShowModal(true)
    setCatatan('')
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedRefund(null)
    setModalAction('')
    setCatatan('')
  }

  const handleProcess = async () => {
    if (!selectedRefund) return

    if (modalAction === 'reject' && !catatan.trim()) {
      alert('Catatan penolakan wajib diisi!')
      return
    }

    const confirmText = modalAction === 'approve'
      ? `Yakin approve refund sebesar ${formatRupiah(selectedRefund.jumlah)}?`
      : `Yakin reject refund sebesar ${formatRupiah(selectedRefund.jumlah)}?`

    if (!window.confirm(confirmText)) return

    setProcessing(prev => ({ ...prev, [selectedRefund.id]: true }))

    try {
      const response = await api.put(`/payments/refund/${selectedRefund.id}/process`, {
        action: modalAction,
        catatan_admin: catatan || null
      })

      if (response.data.success) {
        alert(`✅ Refund berhasil ${modalAction === 'approve' ? 'disetujui' : 'ditolak'}!`)
        closeModal()
        fetchRefunds()
      } else {
        alert(`❌ Gagal: ${response.data.message}`)
      }
    } catch (error) {
      console.error('Error processing refund:', error)
      alert(`❌ Terjadi kesalahan: ${error.response?.data?.message || error.message}`)
    }

    setProcessing(prev => ({ ...prev, [selectedRefund.id]: false }))
  }

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    }

    const labels = {
      pending: 'Menunggu',
      processing: 'Diproses',
      completed: 'Selesai',
      failed: 'Ditolak'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="flex h-screen bg-[#DBE2EF]">
      <Sidebar activeMenu="refunds" />

      <div className="flex-1 overflow-auto">
        <Header />

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Refund</h1>
            <p className="text-gray-600 mt-1">Kelola permintaan refund dari client</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex gap-2">
              {['all', 'pending', 'processing', 'completed', 'failed'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === status
                      ? 'bg-[#4782BE] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Refunds Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[#4782BE]" />
                <p className="text-gray-600">Memuat data refund...</p>
              </div>
            ) : refunds.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-600">Tidak ada refund request</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pembayaran ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jumlah
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alasan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {refunds.map((refund) => (
                      <tr key={refund.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {refund.pembayaran_id?.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {refund.user_id?.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatRupiah(refund.jumlah || refund.jumlah_refund)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {refund.alasan}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(refund.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(refund.created_at || refund.diajukan_pada)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {refund.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => openModal(refund, 'approve')}
                                disabled={processing[refund.id]}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <CheckCircle size={16} />
                                Approve
                              </button>
                              <button
                                onClick={() => openModal(refund, 'reject')}
                                disabled={processing[refund.id]}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <XCircle size={16} />
                                Reject
                              </button>
                            </div>
                          )}
                          {refund.status !== 'pending' && (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {modalAction === 'approve' ? 'Approve Refund' : 'Reject Refund'}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Jumlah Refund:</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatRupiah(selectedRefund.jumlah || selectedRefund.jumlah_refund)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Alasan Client:</p>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                  {selectedRefund.alasan}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan Admin {modalAction === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={modalAction === 'approve' ? 'Catatan tambahan (opsional)' : 'Jelaskan alasan penolakan...'}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleProcess}
                disabled={processing[selectedRefund.id]}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  modalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing[selectedRefund.id]
                  ? 'Memproses...'
                  : modalAction === 'approve' ? 'Approve Refund' : 'Reject Refund'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
