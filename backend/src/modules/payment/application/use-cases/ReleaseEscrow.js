/**
 * Release Escrow Use Case
 * Handle release dana dari escrow ke freelancer (client approve)
 */

const EscrowService = require('../../infrastructure/services/EscrowService');
const EscrowModel = require('../../infrastructure/models/EscrowModel');

// Order integration (update order status + history when escrow released)
const OrderModel = require('../../../order/infrastructure/models/OrderModel');
const OrderStatusHistoryModel = require('../../../order/infrastructure/models/OrderStatusHistoryModel');

class ReleaseEscrow {
  constructor() {
    this.escrowService = new EscrowService();
  }

  /**
   * Execute escrow release
   * @param {Object} dto - Release data
   * @returns {Promise<Object>} Release result
   */
  async execute(dto) {
    const { escrow_id, payment_id, user_id, reason, user_role } = dto;

    console.log(`[ESCROW RELEASE] Releasing escrow (escrow_id: ${escrow_id}, payment_id: ${payment_id}) by user ${user_id} (role: ${user_role})`);

    // 1. Validate escrow exists - support both escrow_id and payment_id
    let escrow;

    if (escrow_id) {
      // First, try to find by escrow_id
      escrow = await EscrowModel.findByPk(escrow_id);

      // If not found, the escrow_id might actually be a payment_id (frontend bug)
      if (!escrow) {
        console.log(`[ESCROW RELEASE] Escrow not found by escrow_id, trying as payment_id...`);
        escrow = await EscrowModel.findOne({
          where: { pembayaran_id: escrow_id }
        });
        if (escrow) {
          console.log(`[ESCROW RELEASE] Found escrow by treating escrow_id as payment_id: ${escrow.id}`);
        }
      }
    }

    // If still not found and payment_id is provided
    if (!escrow && payment_id) {
      console.log(`[ESCROW RELEASE] Trying with payment_id: ${payment_id}`);
      escrow = await EscrowModel.findOne({
        where: { pembayaran_id: payment_id }
      });
      if (escrow) {
        console.log(`[ESCROW RELEASE] Found escrow by payment_id: ${escrow.id}`);
      }
    }

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    console.log(`[ESCROW RELEASE] Using escrow: ${escrow.id}, status: ${escrow.status}`);

    // 2. Validate escrow is in held status
    if (escrow.status !== 'held') {
      throw new Error(`Cannot release escrow with status: ${escrow.status}`);
    }

    // 3. AUTHORIZATION VALIDATION - Verify user has permission to release
    // Fetch the order (we also need current status for history)
    const orderRecord = await OrderModel.findByPk(escrow.pesanan_id);
    if (!orderRecord) {
      throw new Error('Order not found for this escrow');
    }

    const { client_id } = orderRecord;

    // Role-based authorization checks
    if (user_role === 'freelancer') {
      // BLOCK: Freelancers cannot release escrow (conflict of interest)
      throw new Error('Freelancers are not authorized to release escrow. Only clients or admins can release funds.');
    } else if (user_role === 'client') {
      // ALLOW: Only if the client owns the order
      if (client_id !== user_id) {
        throw new Error('You are not authorized to release this escrow. Only the order owner can release funds.');
      }
      console.log(`[ESCROW RELEASE] Client ${user_id} releasing their own escrow (authorized)`);
    } else if (user_role === 'admin') {
      // ALLOW: Admins can force release any escrow
      console.log(`[ESCROW RELEASE] Admin ${user_id} force releasing escrow (authorized)`);
    } else {
      // DENY: Unknown or missing role
      throw new Error('Unauthorized: Invalid user role for escrow release');
    }

    // 4. Release escrow - use the actual escrow.id
    const releasedEscrow = await this.escrowService.releaseEscrow(
      escrow.id,
      user_id,
      reason
    );

    console.log(`[ESCROW RELEASE] Successfully released escrow ${escrow.id}`);
    console.log(
      `[ESCROW RELEASE] Net amount to freelancer: Rp ${parseFloat(releasedEscrow.jumlah_ditahan) - parseFloat(releasedEscrow.biaya_platform)}`
    );

    // 5. Integrasi Order: setelah escrow dirilis oleh client/admin, order dianggap selesai
    // Catat juga riwayat perubahan status supaya halaman detail order bisa menampilkan timeline.
    if (orderRecord.status !== 'selesai') {
      const fromStatus = orderRecord.status;
      const now = new Date();

      await orderRecord.update({
        status: 'selesai',
        // jangan override selesai_pada kalau sudah ada (freelancer sudah kirim hasil)
        selesai_pada: orderRecord.selesai_pada || now,
      });

      const safeRole = ['client', 'admin', 'system'].includes(user_role)
        ? user_role
        : 'system';

      await OrderStatusHistoryModel.create({
        pesanan_id: orderRecord.id,
        from_status: fromStatus,
        to_status: 'selesai',
        changed_by_user_id: user_id,
        changed_by_role: safeRole,
        reason:
          reason ||
          'Client menyetujui pekerjaan dan melepas dana escrow (pesanan selesai)',
        metadata: {
          source: 'escrow_release',
          escrow_id: releasedEscrow.id,
          pembayaran_id: releasedEscrow.pembayaran_id || escrow.pembayaran_id || payment_id,
          escrow_status: releasedEscrow.status,
          dirilis_pada: releasedEscrow.dirilis_pada,
        },
      });

      console.log(
        `[ESCROW RELEASE] Order ${orderRecord.id} status updated: ${fromStatus} -> selesai`
      );
    }

    return {
      success: true,
      escrow_id: releasedEscrow.id,
      status: releasedEscrow.status,
      jumlah_ditahan: parseFloat(releasedEscrow.jumlah_ditahan),
      biaya_platform: parseFloat(releasedEscrow.biaya_platform),
      jumlah_bersih:
        parseFloat(releasedEscrow.jumlah_ditahan) -
        parseFloat(releasedEscrow.biaya_platform),
      dirilis_pada: releasedEscrow.dirilis_pada,
      // extra info untuk FE (opsional)
      order_id: orderRecord.id,
      order_status: orderRecord.status,
      message: 'Escrow released successfully. Order marked as selesai.',
    };
  }
}

module.exports = ReleaseEscrow;
