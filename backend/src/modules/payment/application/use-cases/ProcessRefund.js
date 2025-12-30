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
        // Approve refund - set to 'processing' (waiting for freelancer to transfer)
        await refund.update({
          status: 'processing',
          diproses_pada: new Date(),
          catatan_admin: catatan_admin || null
        });

        // Note: Escrow status will be updated when freelancer actually transfers the money
        // For now, just mark the refund as approved and in processing state

        return {
          refund,
          message: 'Refund disetujui. Menunggu freelancer untuk mentransfer dana'
        };

      } else if (action === 'reject') {
        // Reject refund - set to 'failed'
        await refund.update({
          status: 'failed',
          diproses_pada: new Date(),
          catatan_admin: catatan_admin || null
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
