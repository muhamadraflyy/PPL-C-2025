/**
 * Request Refund Use Case
 * Handle refund requests untuk pembayaran
 */

const PaymentModel = require('../../infrastructure/models/PaymentModel');
const EscrowModel = require('../../infrastructure/models/EscrowModel');
const RefundModel = require('../../infrastructure/models/RefundModel');
const { v4: uuidv4 } = require('uuid');

class RequestRefund {
  async execute({ pembayaran_id, user_id, alasan, jumlah_refund }) {
    try {
      // Get payment
      const payment = await PaymentModel.findByPk(pembayaran_id);

      if (!payment) {
        throw new Error('Payment tidak ditemukan');
      }

      // Validasi status pembayaran
      // Status: 'berhasil' = paid/success, 'menunggu' = pending, 'gagal' = failed, 'kadaluarsa' = expired
      if (!['berhasil', 'paid', 'success', 'settlement'].includes(payment.status)) {
        throw new Error('Payment belum dibayar atau sudah direfund');
      }

      // Get escrow record first (required for refund)
      const escrow = await EscrowModel.findOne({
        where: { pembayaran_id }
      });

      if (!escrow) {
        throw new Error('Escrow tidak ditemukan untuk payment ini');
      }

      // Check if already refunded
      const existingRefund = await RefundModel.findOne({
        where: {
          pembayaran_id,
          status: ['pending', 'processing']
        }
      });

      if (existingRefund) {
        throw new Error('Refund request sudah ada untuk payment ini');
      }

      // Default refund amount = payment amount
      const refundAmount = jumlah_refund || payment.jumlah;

      // Validasi jumlah refund
      if (refundAmount > payment.jumlah) {
        throw new Error('Jumlah refund tidak boleh lebih dari jumlah pembayaran');
      }

      // Create refund record
      const refund = await RefundModel.create({
        id: uuidv4(),
        pembayaran_id,
        escrow_id: escrow.id,
        user_id,
        alasan,
        jumlah: refundAmount,
        status: 'pending'
      });

      // Escrow status: 'held' = ditahan, 'released' = dirilis, 'refunded' = dikembalikan
      if (escrow.status === 'held') {
        await escrow.update({
          status: 'disputed'
        });
      }

      return {
        refund,
        message: 'Refund request berhasil dibuat. Menunggu persetujuan admin.'
      };

    } catch (error) {
      console.error('[REQUEST REFUND] Error:', error);
      throw error;
    }
  }
}

module.exports = RequestRefund;
