import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/organisms/Navbar'
import Button from '../../components/atoms/Button'
import paymentService from '../../services/paymentService'

export default function AdminRefundManagementPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refunds, setRefunds] = useState([])
  const [filter, setFilter] = useState('pending')
  const [processing, setProcessing] = useState({})

  useEffect(() => {
    fetchRefunds()
  }, [filter])

  const fetchRefunds = async () => {
    setLoading(true)
    const result = await paymentService.getAllRefunds({ status: filter === 'all' ? null : filter })
    if (result.success) {
      setRefunds(result.data.refunds || [])
    }
    setLoading(false)
  }

  const handleProcessRefund = async (refundId, action, notes = '') => {
    if (!notes && action === 'rejected') {
      notes = prompt('Masukkan alasan penolakan:')
      if (!notes) return
    }

    setProcessing(prev => ({ ...prev, [refundId]: true }))

    const result = await paymentService.processRefund(refundId, {
      status: action,
      admin_notes: notes
    })

    if (result.success) {
      alert(`Refund berhasil ${action === 'approved' ? 'disetujui' : 'ditolak'}`)
      fetchRefunds()
    } else {
      alert(result.message || 'Gagal memproses refund')
    }

    setProcessing(prev => ({ ...prev, [refundId]: false }))
  }

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status) => {
    const configs = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu' },
      'approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Disetujui' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' },
      'processing': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Diproses' },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Selesai' }
    }
    const config = configs[status] || configs['pending']
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Refund Management</h1>
          <p className="text-gray-600 mt-2">Kelola permintaan refund dari pengguna</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['pending', 'approved', 'rejected', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : refunds.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-600">Tidak ada refund request</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alasan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {refunds.map(refund => (
                  <tr key={refund.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(refund.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{refund.order_id || refund.payment_id}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatRupiah(refund.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {refund.reason}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(refund.status)}</td>
                    <td className="px-6 py-4">
                      {refund.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProcessRefund(refund.id, 'approved')}
                            disabled={processing[refund.id]}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleProcessRefund(refund.id, 'rejected')}
                            disabled={processing[refund.id]}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Tolak
                          </button>
                        </div>
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
  )
}
