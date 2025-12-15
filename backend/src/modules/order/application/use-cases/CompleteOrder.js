/**
 * Complete Order Use Case
 *
 * Use case untuk freelancer menandai pesanan sebagai selesai.
 * Setelah selesai, order akan menunggu review dari client.
 *
 * Steps:
 * 1. Validasi order exist dan status 'dikerjakan'
 * 2. Validasi yang request adalah freelancer pemilik
 * 3. Update status jadi 'menunggu_review'
 * 4. Set tanggal selesai
 * 5. Return updated order
 */

class CompleteOrder {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(orderId, userId, lampiranFreelancer = [], catatanFreelancer = null) {
    // Validasi order exist
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      const error = new Error('Order tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }

    // Validasi ownership
    if (order.freelancer_id !== userId) {
      const error = new Error('Anda tidak memiliki akses untuk menyelesaikan order ini');
      error.statusCode = 403;
      throw error;
    }

    // Validasi status harus 'dikerjakan'
    if (order.status !== 'dikerjakan') {
      const error = new Error(`Order dengan status ${order.status} tidak dapat diselesaikan. Pastikan order sedang dikerjakan.`);
      error.statusCode = 400;
      throw error;
    }

    const fromStatus = order.status;

    const now = new Date();

    // Hanya simpan URL ke DB (seperti lampiran_client) untuk menjaga struktur simpel
    const freelancerAttachmentUrls = Array.isArray(lampiranFreelancer)
      ? lampiranFreelancer
          .map((att) => (att && typeof att.url === 'string' ? att.url : null))
          .filter(Boolean)
      : [];

    // Update status jadi 'menunggu_review', set tanggal kirim & simpan lampiran hasil
    const updatedOrder = await this.orderRepository.update(orderId, {
      status: 'menunggu_review',
      dikirim_pada: now,
      selesai_pada: now,
      // Simpan ke kolom JSON lampiran_freelancer di tabel pesanan sebagai array URL sederhana
      lampiran_freelancer: freelancerAttachmentUrls,
    });

    // Catat riwayat perubahan status (work completed, waiting review)
    await this.orderRepository.addStatusHistory({
      pesanan_id: order.id,
      from_status: fromStatus,
      to_status: 'menunggu_review',
      changed_by_user_id: userId,
      changed_by_role: 'freelancer',
      reason: 'Freelancer menandai order selesai dan mengirim hasil ke client',
      metadata: catatanFreelancer
        ? {
            note_for_client: catatanFreelancer,
          }
        : null,
    });

    return updatedOrder;
  }
}

module.exports = CompleteOrder;
