/**
 * GetOrderById Use Case
 * Ambil detail pesanan dan validasi akses (client/freelancer pemilik atau admin)
 *
 * Sekaligus menambahkan informasi:
 * - viewer: konteks peran pemanggil (client/freelancer/admin) terhadap pesanan ini
 * - timeline: riwayat status berbasis field tanggal + status pesanan & pembayaran
 */

/**
 * Bangun timeline sederhana berdasarkan informasi yang sudah tersedia di record pesanan.
 * Catatan: ini BUKAN audit history penuh; hanya derivasi dari field status + timestamp.
 */
function buildOrderTimeline(order) {
  const events = [];

  // 1. Order dibuat (selalu oleh client)
  if (order.created_at) {
    events.push({
      key: 'created',
      status: 'menunggu_pembayaran',
      label: 'Order dibuat',
      by: 'client',
      at: order.created_at,
    });
  }

  // 2. Pembayaran (jika ada record pembayaran berhasil)
  if (Array.isArray(order.pembayaran) && order.pembayaran.length > 0) {
    const successfulPayment = order.pembayaran.find((p) => p.status === 'berhasil');
    if (successfulPayment) {
      events.push({
        key: 'paid',
        status: 'dibayar',
        label: 'Pembayaran berhasil',
        by: 'client',
        at: successfulPayment.dibayar_pada
          || successfulPayment.created_at
          || successfulPayment.createdAt
          || order.created_at,
      });
    }
  }

  // 3. Order mulai dikerjakan (hanya bisa dari freelancer)
  if (order.status === 'dikerjakan' || order.status === 'menunggu_review' || order.status === 'selesai') {
    events.push({
      key: 'in_progress',
      status: 'dikerjakan',
      label: 'Order dikerjakan oleh freelancer',
      by: 'freelancer',
      // Tidak ada field khusus; gunakan updated_at sebagai pendekatan konservatif
      at: order.updated_at || order.updatedAt || order.created_at,
    });
  }

  // 4. Freelancer menandai selesai & menunggu review
  if (order.selesai_pada || order.status === 'menunggu_review') {
    events.push({
      key: 'waiting_review',
      status: 'menunggu_review',
      label: 'Freelancer mengirim hasil, menunggu review client',
      by: 'freelancer',
      at: order.selesai_pada || order.updated_at || order.updatedAt || order.created_at,
    });
  }

  // 5. Order selesai (anggap aksi dari sisi client / sistem)
  if (order.status === 'selesai') {
    events.push({
      key: 'completed',
      status: 'selesai',
      label: 'Order dinyatakan selesai',
      by: 'client',
      at: order.updated_at || order.updatedAt || order.selesai_pada || order.created_at,
    });
  }

  // 6. Order dibatalkan (bisa client atau freelancer; di sini kita tandai generic)
  if (order.status === 'dibatalkan') {
    events.push({
      key: 'cancelled',
      status: 'dibatalkan',
      label: 'Order dibatalkan',
      by: 'client/freelancer',
      at: order.updated_at || order.updatedAt || order.created_at,
    });
  }

  // Urutkan berdasarkan waktu
  return events
    .filter((e) => !!e.at)
    .sort((a, b) => new Date(a.at) - new Date(b.at));
}

class GetOrderById {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(orderId, requester) {
    if (!orderId) {
      const err = new Error('orderId is required');
      err.statusCode = 400;
      throw err;
    }
    if (!requester || !requester.userId) {
      const err = new Error('Unauthorized');
      err.statusCode = 401;
      throw err;
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    const isClient = order.client_id === requester.userId;
    const isFreelancer = order.freelancer_id === requester.userId;
    const isAdmin = requester.role === 'admin';
    const isOwner = isClient || isFreelancer;

    if (!isOwner && !isAdmin) {
      const err = new Error('Forbidden');
      err.statusCode = 403;
      throw err;
    }

    const viewer = {
      isClient,
      isFreelancer,
      isAdmin,
      role: isAdmin ? 'admin' : (isClient ? 'client' : 'freelancer'),
    };

    const timeline = buildOrderTimeline(order);
    const statusHistory = await this.orderRepository.getStatusHistory(orderId);

    return {
      success: true,
      data: {
        ...order,
        viewer,
        timeline,
        status_history: statusHistory,
      },
    };
  }
}

module.exports = GetOrderById;
