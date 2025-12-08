import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Fragments/Common/Navbar'
import Button from '../../components/Elements/Buttons/Button'
import paymentService from '../../services/paymentService'

export default function WithdrawalHistoryPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [withdrawals, setWithdrawals] = useState([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  })
  const [filter, setFilter] = useState('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchWithdrawals()
  }, [pagination.currentPage, filter])

  const fetchWithdrawals = async () => {
    setLoading(true)
    const params = {
      page: pagination.currentPage,
      limit: pagination.limit
    }

    if (filter !== 'all') {
      params.status = filter
    }

    const result = await paymentService.getWithdrawalHistory(params)
    if (result.success) {
      setWithdrawals(result.data.withdrawals || [])
      setPagination(prev => ({
        ...prev,
        totalPages: result.data.totalPages || 1,
        totalItems: result.data.totalItems || 0
      }))
    }
    setLoading(false)
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }))
  }

  const handleViewDetail = (withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setShowDetailModal(true)
  }

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusConfig = (status) => {
    const configs = {
      'pending': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Menunggu Persetujuan',
        icon: '⏳'
      },
      'processing': {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Sedang Diproses',
        icon: '⚙️'
      },
      'completed': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Berhasil',
        icon: '✅'
      },
      'rejected': {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Ditolak',
        icon: '❌'
      }
    }
    return configs[status] || configs['pending']
  }

  const filterOptions = [
    { value: 'all', label: 'Semua Status', count: null },
    { value: 'pending', label: 'Menunggu', count: null },
    { value: 'processing', label: 'Diproses', count: null },
    { value: 'completed', label: 'Berhasil', count: null },
    { value: 'rejected', label: 'Ditolak', count: null }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Riwayat Penarikan</h1>
              <p className="text-gray-600 mt-2">Lihat semua riwayat penarikan dana Anda</p>
            </div>

            <Button
              variant="primary"
              onClick={() => navigate('/freelancer/withdrawal/create')}
            >
              + Penarikan Baru
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filterOptions.map(option => (
              <button
                key={option.value}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  filter === option.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  setFilter(option.value)
                  setPagination(prev => ({ ...prev, currentPage: 1 }))
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        ) : withdrawals.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 font-medium mb-2">Belum Ada Penarikan</p>
            <p className="text-sm text-gray-500 mb-4">
              {filter === 'all'
                ? 'Anda belum pernah melakukan penarikan dana'
                : `Tidak ada penarikan dengan status "${filterOptions.find(o => o.value === filter)?.label}"`
              }
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/freelancer/withdrawal/create')}
            >
              Buat Penarikan Pertama
            </Button>
          </div>
        ) : (
          /* Withdrawal Table */
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jumlah
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {withdrawals.map((withdrawal) => {
                      const statusConfig = getStatusConfig(withdrawal.status)
                      return (
                        <tr key={withdrawal.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(withdrawal.created_at).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(withdrawal.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatRupiah(withdrawal.jumlah)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{withdrawal.bank_name}</div>
                            <div className="text-xs text-gray-500 font-mono">
                              {withdrawal.bank_account_number}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                              <span className="mr-1">{statusConfig.icon}</span>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleViewDetail(withdrawal)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Lihat Detail
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {withdrawals.map((withdrawal) => {
                  const statusConfig = getStatusConfig(withdrawal.status)
                  return (
                    <div key={withdrawal.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">
                            {formatRupiah(withdrawal.jumlah)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(withdrawal.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          <span className="mr-1">{statusConfig.icon}</span>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        <p>{withdrawal.bank_name}</p>
                        <p className="font-mono text-xs">{withdrawal.bank_account_number}</p>
                        <p className="text-xs">{withdrawal.bank_account_name}</p>
                      </div>
                      <button
                        onClick={() => handleViewDetail(withdrawal)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Lihat Detail →
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Menampilkan <span className="font-medium">{withdrawals.length}</span> dari{' '}
                  <span className="font-medium">{pagination.totalItems}</span> penarikan
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>

                  <div className="flex gap-1">
                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const page = index + 1
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            pagination.currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Detail Penarikan</h3>
                  <p className="text-sm text-gray-500 mt-1">ID: {selectedWithdrawal.id}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Status Badge */}
              {(() => {
                const statusConfig = getStatusConfig(selectedWithdrawal.status)
                return (
                  <div className={`p-4 rounded-lg mb-6 ${statusConfig.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{statusConfig.icon}</span>
                      <div>
                        <p className={`font-semibold ${statusConfig.text}`}>{statusConfig.label}</p>
                        {selectedWithdrawal.admin_notes && (
                          <p className={`text-sm ${statusConfig.text} mt-1`}>
                            Catatan: {selectedWithdrawal.admin_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Jumlah Penarikan</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatRupiah(selectedWithdrawal.jumlah)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Pengajuan</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedWithdrawal.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Informasi Rekening</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bank</span>
                      <span className="text-sm font-medium text-gray-900">{selectedWithdrawal.bank_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nomor Rekening</span>
                      <span className="text-sm font-mono font-medium text-gray-900">{selectedWithdrawal.bank_account_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nama Pemilik</span>
                      <span className="text-sm font-medium text-gray-900">{selectedWithdrawal.bank_account_name}</span>
                    </div>
                  </div>
                </div>

                {selectedWithdrawal.catatan && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Catatan Anda</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedWithdrawal.catatan}
                    </p>
                  </div>
                )}

                {selectedWithdrawal.processed_at && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500">
                      Diproses pada: {new Date(selectedWithdrawal.processed_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
