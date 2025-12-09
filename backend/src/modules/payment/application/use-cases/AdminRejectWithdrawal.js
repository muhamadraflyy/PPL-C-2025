/**
 * Admin Reject Withdrawal Use Case
 * Admin rejects withdrawal request
 */

const WithdrawalService = require('../../infrastructure/services/WithdrawalService');

class AdminRejectWithdrawal {
  constructor() {
    this.withdrawalService = new WithdrawalService();
  }

  /**
   * Execute admin rejection
   * @param {Object} dto - Rejection data
   * @returns {Promise<Object>} Rejection result
   */
  async execute(dto) {
    const { withdrawal_id, admin_id, reason } = dto;

    console.log(`[ADMIN REJECTION] Rejecting withdrawal ${withdrawal_id} by admin ${admin_id}`);
    console.log(`[ADMIN REJECTION] Reason: ${reason}`);

    if (!reason || reason.trim() === '') {
      throw new Error('Alasan penolakan harus diisi');
    }

    // Reject withdrawal
    const withdrawal = await this.withdrawalService.failWithdrawal(withdrawal_id, reason);

    console.log(`[ADMIN REJECTION] Withdrawal ${withdrawal_id} rejected`);

    return {
      success: true,
      withdrawal_id: withdrawal.id,
      status: withdrawal.status,
      catatan: withdrawal.catatan,
      message: 'Withdrawal berhasil ditolak'
    };
  }
}

module.exports = AdminRejectWithdrawal;
