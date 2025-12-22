/**
 * Process Refund Use Case
 * Admin approve atau reject refund request
 */

const PaymentModel = require('../../infrastructure/models/PaymentModel');
const EscrowModel = require('../../infrastructure/models/EscrowModel');

class ProcessRefund {
  async execute({ refund_id, admin_id, action, catatan_admin }) {
    try {
      // Get refund request
      const RefundModel = PaymentModel.sequelize.models.refund;
      const refund = await RefundModel.findByPk(refund_id);

      if (!refund) {
        throw new Error('Refund request tidak ditemukan');
      }

      if (refund.status !== 'pending') {
        throw new Error('Refund sudah diproses sebelumnya');
      }

      if (action === 'approve') {
        // Approve refund - set to 'completed'
        await refund.update({
          status: 'completed',
          diproses_pada: new Date(),
          selesai_pada: new Date()
        });

        // Note: Payment status stays 'berhasil' - refund table tracks the refund
        // Release escrow if exists
        const escrow = await EscrowModel.findOne({
          where: { pembayaran_id: refund.pembayaran_id }
        });

        if (escrow) {
          await escrow.update({
            status: 'refunded',
            dirilis_pada: new Date()
          });
        }

        return {
          refund,
          message: 'Refund berhasil disetujui dan dana telah dikembalikan'
        };

      } else if (action === 'reject') {
        // Reject refund - set to 'failed'
        await refund.update({
          status: 'failed',
          diproses_pada: new Date()
        });

        // Restore escrow status if exists
        const escrow = await EscrowModel.findOne({
          where: { pembayaran_id: refund.pembayaran_id }
        });

        if (escrow && escrow.status === 'disputed') {
          await escrow.update({
            status: 'held'
          });
        }

        return {
          refund,
          message: 'Refund ditolak'
        };

      } else {
        throw new Error('Action tidak valid. Gunakan "approve" atau "reject"');
      }

    } catch (error) {
      console.error('[PROCESS REFUND] Error:', error);
      throw error;
    }
  }
}

module.exports = ProcessRefund;
