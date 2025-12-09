import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../../components/Fragments/Common/Navbar'
import StatusBadge from '../../components/Elements/Common/StatusBadge'
import PriceText from '../../components/Elements/Text/PriceText'
import OrderTimeline from '../../components/Fragments/Order/OrderTimeline'
import FreelancerOrderActions from '../../components/Fragments/Order/FreelancerOrderActions'
import Footer from '../../components/Fragments/Common/Footer'
import { orderService } from '../../services/orderService'
import { authService } from '../../services/authService'
import paymentService from '../../services/paymentService'
import { buildMediaUrl } from '../../utils/mediaUrl'
import { Download } from 'lucide-react'

// Normalisasi berbagai bentuk payload riwayat status/timeline yang dikirim BE
const normalizeStatusHistory = (raw = []) => {
  if (!Array.isArray(raw)) return []

  const mapped = raw.map((item) => {
    const from = item.from ?? item.from_status ?? item.old_status ?? null
    const to = item.to ?? item.to_status ?? item.status ?? item.new_status ?? null
    const note = item.note ?? item.label ?? item.metadata?.note ?? item.metadata?.message ?? null
    const reason = item.reason ?? item.metadata?.reason ?? null
    const changedBy = item.changedBy ?? item.changed_by ?? item.changed_by_user_id ?? item.user_id ?? item.by ?? null
    const changedByRole = item.changedByRole ?? item.changed_by_role ?? item.role ?? item.by ?? null
    const metadata = item.metadata ?? {}
    const changedAt =
      item.changedAt ??
      item.changed_at ??
      item.created_at ??
      item.updated_at ??
      item.updatedAt ??
      item.at ??
      null

    return {
      id: item.id ?? item.key ?? `${to}-${changedAt ?? Math.random()}`,
      from,
      to,
      note,
      reason,
      changedBy,
      changedByRole,
      metadata,
      changedAt,
    }
  })

  return mapped
    .filter((item) => item.to && item.changedAt)
    .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
}

const OrderDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refundAmount, setRefundAmount] = useState(0)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null })
  const [infoModal, setInfoModal] = useState({ open: false, title: '', message: '' })

  const openConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({ open: true, title, message, onConfirm })
  }

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, title: '', message: '', onConfirm: null })
  }

  const openInfoModal = (title, message) => {
    setInfoModal({ open: true, title, message })
  }

  const closeInfoModal = () => {
    setInfoModal({ open: false, title: '', message: '' })
  }

  const formatFileSize = (size) => {
    if (!size || Number.isNaN(Number(size))) return ''

    const bytes = Number(size)
    if (bytes < 1024) return `${bytes} B`

    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`

    const mb = kb / 1024
    return `${mb.toFixed(2)} MB`
  }

  const normalizeAttachments = (attachments = []) => {
    if (!Array.isArray(attachments)) return []

    return attachments
      .filter(Boolean)
      .map((item, idx) => {
        if (typeof item === 'string') {
          const filename = item.split('/').pop() || `lampiran-${idx + 1}`
          return {
            name: filename,
            url: item,
            size: ''
          }
        }

        const name =
          item.name ||
          item.filename ||
          item.originalname ||
          (item.url ? item.url.split('/').pop() : '') ||
          `lampiran-${idx + 1}`

        // Hindari nilai URL dummy seperti '#' yang akan menghasilkan /public/#
        const rawUrl = item.url || item.path || ''
        const sanitizedUrl = rawUrl === '#' ? '' : rawUrl

        return {
          name,
          url: sanitizedUrl,
          size: item.size || item.filesize || item.fileSize || ''
        }
      })
  }

  const loadOrder = async () => {
    setLoading(true)
    setError('')
    const res = await orderService.getOrderById(id)

    if (res?.success === false) {
      setError(res?.message || 'Gagal memuat detail pesanan')
      setOrder(null)
      setLoading(false)
      return
    }

    // Ambil payload fleksibel
    const o = res?.data?.order || res?.data || res

    // Ambil sumber riwayat status/timeline dari berbagai bentuk field
    const rawStatusHistory =
      o?.statusHistory ||
      o?.history ||
      o?.timeline ||
      o?.status_history ||
      []

    const normalizedHistory = normalizeStatusHistory(rawStatusHistory)

    // Normalisasi ke bentuk yang dipakai UI saat ini
    const normalized = o
      ? {
          id: o.id ?? o.order_id ?? id,
          nomor_pesanan: o.nomor_pesanan ?? o.order_number ?? o.nomor ?? `#${id}`,
          judul: o.judul ?? o.title ?? 'Detail Pesanan',
          status: o.status ?? 'unknown',
          harga: o.harga ?? o.price ?? 0,
          biaya_platform: o.biaya_platform ?? o.platform_fee ?? 0,
          total_bayar: o.total_bayar ?? o.total ?? 0,
          waktu_pengerjaan: o.waktu_pengerjaan ?? o.duration_days ?? 0,
          deskripsi: o.deskripsi ?? o.description ?? '',
          catatan_client: o.catatan_client ?? o.client_note ?? '',
          catatan_freelancer:
            o.catatan_freelancer ??
            o.freelancer_note ??
            o.note_for_client ??
            o.metadata?.note_for_client ??
            '',
          lampiran_client: normalizeAttachments(o.lampiran_client ?? o.client_attachments ?? []),
          lampiran_freelancer: normalizeAttachments(o.lampiran_freelancer ?? o.freelancer_attachments ?? []),
          tenggat_waktu: o.tenggat_waktu ?? o.deadline ?? o.due_date ?? null,
          // Client normalization
          client:
            o.client ||
            o.client_user ||
            o.clientProfile || {
              id: o.client_id ?? o.clientId ?? o.client?.id,
              nama_depan: o.client_first_name || '',
              nama_belakang: o.client_last_name || '',
              email: o.client_email || ''
            },
          // Freelancer normalization
          freelancer:
            o.freelancer ||
            o.freelancer_user ||
            o.freelancerProfile ||
            (o.freelancer_id || o.freelancerId || o.freelancer?.id
              ? {
                  id: o.freelancer_id ?? o.freelancerId ?? o.freelancer?.id,
                  nama_depan: o.freelancer_first_name || o.freelancer?.nama_depan || '',
                  nama_belakang: o.freelancer_last_name || o.freelancer?.nama_belakang || '',
                  email: o.freelancer_email || o.freelancer?.email || ''
                }
              : null),
          client_id: o.client_id ?? o.clientId ?? o.client?.id,
          freelancer_id: o.freelancer_id ?? o.freelancerId ?? o.freelancer?.id,
          statusHistory: normalizedHistory,
          payment_id: o.payment_id ?? o.paymentId ?? o.pembayaran_id ?? null,
          escrow_id: o.escrow_id ?? o.escrowId ?? null,
          refund_status: o.refund_status ?? o.refundStatus ?? null,
          refund_reason: o.refund_reason ?? o.refundReason ?? null
        }
      : null

    setOrder(normalized)
    setLoading(false)
  }

  useEffect(() => {
    if (id) {
      loadOrder()
    }
  }, [id])

  // Real API handlers
  const handleAccept = () => {
    if (actionLoading) return

    openConfirmModal(
      'Terima Pesanan',
      'Apakah Anda yakin ingin menerima pesanan ini?',
      async () => {
        setActionLoading(true)
        try {
          const result = await orderService.acceptOrder(id)

          if (result.success) {
            openInfoModal('Berhasil', 'Pesanan berhasil diterima.')
            await loadOrder() // Reload order data
          } else {
            openInfoModal('Gagal', `Gagal menerima pesanan: ${result.message}`)
          }
        } catch (err) {
          console.error('Error accepting order:', err)
          openInfoModal('Terjadi Kesalahan', 'Terjadi kesalahan saat menerima pesanan. Silakan coba lagi.')
        } finally {
          setActionLoading(false)
          closeConfirmModal()
        }
      }
    )
  }

  const handleReject = async (reason) => {
    if (actionLoading) return

    if (!reason || reason.trim() === '') {
      openInfoModal('Validasi', 'Harap masukkan alasan penolakan.')
      return
    }

    setActionLoading(true)
    try {
      const result = await orderService.cancelOrder(id, reason)

      if (result.success) {
        openInfoModal('Berhasil', 'Pesanan berhasil ditolak.')
        await loadOrder() // Reload order data
      } else {
        openInfoModal('Gagal', `Gagal menolak pesanan: ${result.message}`)
      }
    } catch (err) {
      console.error('Error rejecting order:', err)
      openInfoModal('Terjadi Kesalahan', 'Terjadi kesalahan saat menolak pesanan. Silakan coba lagi.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async (data) => {
    if (actionLoading) return

    setActionLoading(true)
    try {
      // Kirim file asli ke backend, backend yang akan membentuk URL publik
      const result = await orderService.completeOrder(
        id,
        data.files,
        data.note,
      )

      if (result.success) {
        openInfoModal('Berhasil', 'Pesanan berhasil diselesaikan.')
        await loadOrder() // Reload order data
      } else {
        openInfoModal('Gagal', `Gagal menyelesaikan pesanan: ${result.message}`)
      }
    } catch (err) {
      console.error('Error completing order:', err)
      openInfoModal('Terjadi Kesalahan', 'Terjadi kesalahan saat menyelesaikan pesanan. Silakan coba lagi.')
    } finally {
      setActionLoading(false)
    }
  }

  // Release Escrow - Client approves completed work
  const handleReleaseEscrow = () => {
    openConfirmModal(
      'Release Payment',
      'Apakah Anda yakin ingin melepas dana escrow ke freelancer? Dana akan segera ditransfer.',
      async () => {
        setProcessingPayment(true)
        try {
          // Get escrow ID from order (assuming order has escrow_id or payment_id)
          const escrowId = order.escrow_id || order.payment_id
          if (!escrowId) {
            openInfoModal('Data Tidak Lengkap', 'Escrow ID tidak ditemukan untuk order ini.')
            return
          }

          // Get current user ID
          const currentUser = authService.getCurrentUser()
          if (!currentUser?.id) {
            openInfoModal('Autentikasi', 'User tidak terautentikasi. Silakan login kembali.')
            return
          }

          const result = await paymentService.releaseEscrow(escrowId, currentUser.id, 'Order completed successfully')
          if (result.success) {
            openInfoModal('Berhasil', 'Dana escrow berhasil dirilis ke freelancer.')
            await loadOrder()
          } else {
            openInfoModal('Gagal', `Gagal merilis escrow: ${result.message}`)
          }
        } catch (err) {
          console.error('Error releasing escrow:', err)
          openInfoModal('Terjadi Kesalahan', 'Terjadi kesalahan saat merilis escrow. Silakan coba lagi.')
        } finally {
          setProcessingPayment(false)
          closeConfirmModal()
        }
      }
    )
  }

  // Request Refund - Client requests refund
  const handleRequestRefund = async () => {
    if (!refundReason.trim()) {
      openInfoModal('Validasi', 'Harap masukkan alasan refund.')
      return
    }

    setProcessingPayment(true)
    try {
      const result = await paymentService.requestRefund({
        payment_id: order.payment_id,
        reason: refundReason,
        amount: refundAmount || order.total_bayar
      })

      if (result.success) {
        openInfoModal('Berhasil', 'Permintaan refund berhasil diajukan. Tim kami akan segera memprosesnya.')
        setShowRefundModal(false)
        setRefundReason('')
        setRefundAmount(0)
        await loadOrder()
      } else {
        openInfoModal('Gagal', `Gagal mengajukan refund: ${result.message}`)
      }
    } catch (err) {
      console.error('Error requesting refund:', err)
      openInfoModal('Terjadi Kesalahan', 'Terjadi kesalahan saat mengajukan refund. Silakan coba lagi.')
    } finally {
      setProcessingPayment(false)
    }
  }

  // Download Invoice
  const handleDownloadInvoice = async () => {
    setProcessingPayment(true)
    try {
      const paymentId = order.payment_id
      if (!paymentId) {
        openInfoModal('Data Tidak Lengkap', 'Payment ID tidak ditemukan untuk order ini.')
        return
      }

      const result = await paymentService.getInvoicePDF(paymentId)
      if (result.success) {
        // Create blob and download
        const url = window.URL.createObjectURL(new Blob([result.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `Invoice-${order.nomor_pesanan}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } else {
        openInfoModal('Gagal', result.message || 'Gagal mengunduh invoice.')
      }
    } catch (err) {
      console.error('Error downloading invoice:', err)
      openInfoModal('Terjadi Kesalahan', 'Terjadi kesalahan saat mengunduh invoice. Silakan coba lagi.')
    } finally {
      setProcessingPayment(false)
    }
  }

  // Send Invoice via Email
  const handleSendInvoiceEmail = async () => {
    const email = prompt('Masukkan alamat email:')
    if (!email) return

    setProcessingPayment(true)
    try {
      const result = await paymentService.sendInvoiceEmail(order.payment_id, email)
      if (result.success) {
        openInfoModal('Berhasil', 'Invoice berhasil dikirim ke email.')
      } else {
        openInfoModal('Gagal', result.message || 'Gagal mengirim invoice.')
      }
    } catch (err) {
      console.error('Error sending invoice:', err)
      openInfoModal('Terjadi Kesalahan', 'Terjadi kesalahan saat mengirim invoice. Silakan coba lagi.')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-700">Memuat detail pesanan...</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Gagal Memuat Pesanan</h2>
          <p className="text-gray-600 mb-4">{error || `Order dengan ID "${id}" tidak ditemukan.`}</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Daftar Pesanan
          </button>
        </div>
      </div>
    )
  }

  const currentUser = authService.getCurrentUser()
  const isFreelancer = currentUser?.id === order.freelancer_id || currentUser?.role === 'freelancer'
  const isClient = currentUser?.id === order.client_id || currentUser?.role === 'client'

  // Use actual status history from order or empty array
  const statusHistory = order.statusHistory && order.statusHistory.length > 0
    ? order.statusHistory
    : []

  // Force display freelancer info from currently logged-in freelancer
  const freelancerDisplay =
    currentUser?.role === 'freelancer'
      ? {
          nama_depan:
            currentUser.firstName ||
            currentUser.nama_depan ||
            currentUser.first_name ||
            (currentUser.name ? String(currentUser.name).split(' ')[0] : ''),
          nama_belakang:
            currentUser.lastName ||
            currentUser.nama_belakang ||
            currentUser.last_name ||
            (currentUser.name ? String(currentUser.name).split(' ').slice(1).join(' ') : ''),
          email: currentUser.email || ''
        }
      : (order.freelancer || null)

  const freelancerName = (() => {
    const combined =
      [freelancerDisplay?.nama_depan, freelancerDisplay?.nama_belakang]
        .filter(Boolean)
        .join(' ')
    if (combined) return combined
    if (currentUser?.name) return currentUser.name
    if (currentUser?.fullName) return currentUser.fullName
    if (freelancerDisplay?.email) return String(freelancerDisplay.email).split('@')[0]
    return 'Freelancer'
  })()

  const freelancerInitials = (() => {
    const parts = String(freelancerName).trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'F'
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  })()

  const handleDownloadClientAttachment = async (file) => {
    try {
      if (!file?.url) {
        openInfoModal('File Tidak Tersedia', 'File lampiran tidak memiliki URL valid untuk diunduh.')
        return
      }

      const urlToFetch = buildMediaUrl(file.url || '')
      const response = await fetch(urlToFetch)
      if (!response.ok) {
        throw new Error('Gagal mengunduh lampiran')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name || 'lampiran'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading client attachment:', err)
      openInfoModal('Terjadi Kesalahan', 'Gagal mengunduh lampiran. Silakan coba lagi.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Back button */}
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar Pesanan
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - Col span 2 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order header */}
            <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{order.judul}</h1>
                  <p className="text-gray-600 text-sm">Order #{order.nomor_pesanan}</p>
                  {freelancerDisplay && (
                    <p className="text-gray-500 text-sm mt-1">
                      Freelancer: {freelancerName}
                    </p>
                  )}
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Harga Layanan</p>
                  <PriceText amount={order.harga} size="md" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Biaya Platform</p>
                  <PriceText amount={order.biaya_platform} size="md" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Bayar</p>
                  <PriceText amount={order.total_bayar} size="lg" className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Waktu Pengerjaan</p>
                  <p className="font-semibold text-gray-900">{order.waktu_pengerjaan} hari</p>
                </div>
              </div>
            </div>

            {/* Order details */}
            <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detail Pesanan</h2>

              {order.deskripsi && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Deskripsi</h3>
                  <p className="text-gray-900">{order.deskripsi}</p>
                </div>
              )}

              {order.catatan_client && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Catatan Client</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-line">{order.catatan_client}</p>
                  </div>
                </div>
              )}

              {order.lampiran_client && order.lampiran_client.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Lampiran Client</h3>
                  <div className="space-y-2">
                    {order.lampiran_client.map((file, idx) => (
                      <a
                        key={idx}
                        href={buildMediaUrl(file.url)}
                        onClick={(e) => {
                          e.preventDefault()
                          handleDownloadClientAttachment(file)
                        }}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <div className="flex-1">
                          <span className="text-gray-900 font-medium">{file.name}</span>
                          {file.size ? (
                            <span className="text-gray-500 text-sm ml-2">({formatFileSize(file.size)})</span>
                          ) : null}
                        </div>
                        <Download className="w-5 h-5 text-gray-700 ml-3 flex-shrink-0" strokeWidth={2.25} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {order.lampiran_freelancer && order.lampiran_freelancer.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Hasil Pekerjaan Freelancer</h3>
                  <div className="space-y-2">
                    {order.lampiran_freelancer.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url ? buildMediaUrl(file.url) : '#'}
                        onClick={(e) => {
                          e.preventDefault()
                          handleDownloadClientAttachment(file)
                        }}
                        className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                      >
                        <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <span className="text-gray-900 font-medium">{file.name}</span>
                          {file.size ? (
                            <span className="text-gray-500 text-sm ml-2">({formatFileSize(file.size)})</span>
                          ) : null}
                        </div>
                        <Download className="w-5 h-5 text-green-700 ml-3 flex-shrink-0" strokeWidth={2.25} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {order.catatan_freelancer && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Catatan Freelancer</h3>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-gray-900 whitespace-pre-line">{order.catatan_freelancer}</p>
                  </div>
                </div>
              )}

              {order.tenggat_waktu && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tenggat Waktu</h3>
                  <p className="text-gray-900 font-medium">
                    {new Date(order.tenggat_waktu).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Riwayat Status</h2>
              {statusHistory.length > 0 ? (
                <OrderTimeline statusHistory={statusHistory} />
              ) : (
                <p className="text-gray-500 text-sm">Belum ada riwayat status</p>
              )}
            </div>
          </div>

          {/* Sidebar - Col span 1 */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client info */}
            {order.client && (
              <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Client</h3>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-4">
                    {order.client.nama_depan?.charAt(0)}{order.client.nama_belakang?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{order.client.nama_depan} {order.client.nama_belakang}</p>
                    <p className="text-sm text-gray-600">{order.client.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Freelancer info */}
            {freelancerDisplay && (
              <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Freelancer</h3>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold mr-4">
                    {freelancerInitials}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{freelancerName}</p>
                    <p className="text-sm text-gray-600">{freelancerDisplay.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Freelancer actions */}
            {isFreelancer && (
              <FreelancerOrderActions
                order={order}
                onAccept={handleAccept}
                onReject={handleReject}
                onComplete={handleComplete}
                loading={actionLoading}
                showInfo={(title, message) => openInfoModal(title, message)}
              />
            )}

            {/* Client actions */}
            {isClient && order.status === 'menunggu_pembayaran' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
                <h3 className="font-semibold text-lg mb-2">Pembayaran</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Silakan lakukan pembayaran untuk memproses pesanan Anda.
                </p>
                <button
                  onClick={() => navigate(`/payment/${order.id}?amount=${order.total_bayar}&description=${encodeURIComponent(order.judul)}`)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Bayar Sekarang
                </button>
              </div>
            )}

            {/* Release Escrow - Client */}
            {isClient && (order.status === 'selesai' || order.status === 'menunggu_review') && (
              <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
                <h3 className="font-semibold text-lg mb-2">Release Payment</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Pekerjaan telah selesai. Lepas dana escrow ke freelancer?
                </p>
                <button
                  onClick={handleReleaseEscrow}
                  disabled={processingPayment}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment ? 'Memproses...' : 'Release Payment'}
                </button>
              </div>
            )}

            {/* Request Refund - Client */}
            {isClient && ['dibayar', 'dikerjakan', 'dispute'].includes(order.status) && (
              <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
                <h3 className="font-semibold text-lg mb-2">Refund</h3>
                {order.refund_status === 'pending' || order.refund_status === 'processing' ? (
                  <div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                      <p className="text-sm font-medium text-yellow-800 mb-1">
                        🕐 Refund Sedang Diproses
                      </p>
                      <p className="text-xs text-yellow-700">
                        Permintaan refund Anda sedang dievaluasi oleh tim admin dan akan disampaikan ke freelancer. Kami akan memberitahu Anda segera setelah ada keputusan.
                      </p>
                    </div>
                    {order.refund_reason && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Alasan:</span> {order.refund_reason}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Ada masalah dengan pesanan ini?
                    </p>
                    <button
                      onClick={() => {
                        setRefundAmount(order.total_bayar)
                        setShowRefundModal(true)
                      }}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Request Refund
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Invoice Download - Client & Freelancer */}
            {(isClient || isFreelancer) && order.payment_id && ['dibayar', 'dikerjakan', 'menunggu_review', 'revisi', 'selesai'].includes(order.status) && (
              <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
                <h3 className="font-semibold text-lg mb-2">Invoice</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download bukti pembayaran Anda
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleDownloadInvoice}
                    disabled={processingPayment}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {processingPayment ? 'Downloading...' : 'Download Invoice PDF'}
                  </button>
                  <button
                    onClick={handleSendInvoiceEmail}
                    disabled={processingPayment}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Kirim ke Email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">

          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Request Refund</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Refund
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  max={order.total_bayar}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={`Max: Rp ${order.total_bayar.toLocaleString('id-ID')}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan Refund <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Jelaskan alasan Anda meminta refund..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRefundModal(false)
                    setRefundReason('')
                    setRefundAmount(0)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={processingPayment}
                >
                  Batal
                </button>
                <button
                  onClick={handleRequestRefund}
                  disabled={processingPayment || !refundReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment ? 'Memproses...' : 'Ajukan Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {infoModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{infoModal.title || 'Informasi'}</h3>
            <p className="text-gray-700 mb-6">{infoModal.message}</p>
            <div className="flex justify-end">
              <button
                onClick={closeInfoModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{confirmModal.title || 'Konfirmasi'}</h3>
            <p className="text-gray-700 mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (typeof confirmModal.onConfirm === 'function') {
                    confirmModal.onConfirm()
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default OrderDetailPage
