import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from '../../components/Fragments/Admin/Sidebar'
import { Header } from '../../components/Fragments/Admin/Header'
import { DollarSign, Shield } from 'lucide-react'
import paymentService from '../../services/paymentService'
import { authService } from '../../services/authService'

export default function EscrowManagementPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [escrows, setEscrows] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [filter, setFilter] = useState('held')
  const [processing, setProcessing] = useState({})

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    setLoading(true)

    // Fetch escrows
    const escrowResult = await paymentService.getAllEscrows({
      status: filter === 'all' ? null : filter
    })

    if (escrowResult.success) {
      setEscrows(escrowResult.data.escrows || [])
    }

    // Fetch analytics
    const analyticsResult = await paymentService.getEscrowAnalytics()
    if (analyticsResult.success) {
      setAnalytics(analyticsResult.data)
    }

    setLoading(false)
  }

  const handleForceRelease = async (escrow) => {
    const reason = prompt('Masukkan alasan force release escrow:')
    if (!reason) return

    if (!window.confirm(`Yakin ingin force release escrow sebesar ${formatRupiah(escrow.jumlah_ditahan)} untuk order ${escrow.nomor_pesanan}?`)) {
      return
    }

    setProcessing(prev => ({ ...prev, [escrow.id]: true }))

    const currentUser = authService.getCurrentUser()
    if (!currentUser?.id) {
      alert('User tidak terautentikasi')
      setProcessing(prev => ({ ...prev, [escrow.id]: false }))
      return
    }

    const result = await paymentService.releaseEscrow(escrow.id, currentUser.id, reason)

    if (result.success) {
      alert('✅ Escrow berhasil dirilis!')
      fetchData()
    } else {
      alert(`❌ Gagal: ${result.message}`)
    }

    setProcessing(prev => ({ ...prev, [escrow.id]: false }))
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
      'held': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Ditahan' },
      'released': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Dirilis' },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Selesai' },
      'refunded': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Dikembalikan' },
      'disputed': { bg: 'bg-red-100', text: 'text-red-800', label: 'Sengketa' }
    }
    const config = configs[status] || configs['held']
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
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Escrow Management</h1>
          <p className="text-gray-600 mt-2">Kelola dana escrow yang ditahan untuk pesanan</p>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Escrow Aktif</h3>
              <p className="text-3xl font-bold text-gray-900">{analytics.active_escrow?.count || 0}</p>
              <p className="text-sm text-gray-500 mt-2">{formatRupiah(analytics.active_escrow?.total_amount || 0)}</p>
            </div>

            {analytics.breakdown_by_status?.map(item => (
              <div key={item.status} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2 capitalize">{item.status}</h3>
                <p className="text-3xl font-bold text-gray-900">{item.count}</p>
                <p className="text-sm text-gray-500 mt-2">{formatRupiah(item.total_amount || 0)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['held', 'released', 'completed', 'disputed', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm capitalize ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'held' ? 'Ditahan' :
               status === 'released' ? 'Dirilis' :
               status === 'completed' ? 'Selesai' :
               status === 'disputed' ? 'Sengketa' : 'Semua'}
            </button>
          ))}
        </div>

        {/* Escrow Table */}
        {loading ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : escrows.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-600">Tidak ada escrow</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Freelancer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fee</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {escrows.map(escrow => (
                    <tr key={escrow.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{formatDate(escrow.ditahan_pada)}</div>
                        {escrow.dirilis_pada && (
                          <div className="text-xs text-gray-500 mt-1">
                            Dirilis: {formatDate(escrow.dirilis_pada)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{escrow.order_title || 'N/A'}</div>
                        <div className="text-xs text-gray-500 font-mono">{escrow.nomor_pesanan}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="text-xs truncate max-w-[150px]">{escrow.client_email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="text-xs truncate max-w-[150px]">{escrow.freelancer_email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900">
                        {formatRupiah(escrow.jumlah_ditahan)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {formatRupiah(escrow.biaya_platform)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(escrow.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {escrow.status === 'held' && (
                          <button
                            onClick={() => handleForceRelease(escrow)}
                            disabled={processing[escrow.id]}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing[escrow.id] ? 'Memproses...' : 'Force Release'}
                          </button>
                        )}
                        {escrow.status === 'disputed' && (
                          <button
                            onClick={() => handleForceRelease(escrow)}
                            disabled={processing[escrow.id]}
                            className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
                          >
                            {processing[escrow.id] ? 'Memproses...' : 'Resolve & Release'}
                          </button>
                        )}
                        {escrow.status !== 'held' && escrow.status !== 'disputed' && (
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
    </div>
  )
}
