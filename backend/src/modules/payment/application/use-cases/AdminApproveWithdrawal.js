/**
 * Admin Approve Withdrawal Use Case
 * Admin processes and approves withdrawal request
 */

const WithdrawalService = require('../../infrastructure/services/WithdrawalService');

class AdminApproveWithdrawal {
  constructor() {
    this.withdrawalService = new WithdrawalService();
  }

  /**
   * Execute admin approval
   * @param {Object} dto - Approval data
   * @returns {Promise<Object>} Approval result
   */
  async execute(dto) {
    const { withdrawal_id, admin_id, bukti_transfer, catatan } = dto;

    console.log(`[ADMIN APPROVAL] Processing withdrawal ${withdrawal_id} by admin ${admin_id}`);

    // Start processing
    await this.withdrawalService.processWithdrawal(withdrawal_id, admin_id);

    // Complete with proof
    const withdrawal = await this.withdrawalService.completeWithdrawal(
      withdrawal_id,
      bukti_transfer
    );

    // Add notes if provided
    if (catatan) {
      const WithdrawalModel = require('../../infrastructure/models/WithdrawalModel');
      await WithdrawalModel.update(
        { catatan },
        { where: { id: withdrawal_id } }
      );
    }

    console.log(`[ADMIN APPROVAL] Withdrawal ${withdrawal_id} approved and completed`);

    return {
      success: true,
      withdrawal_id: withdrawal.id,
      status: withdrawal.status,
      bukti_transfer: withdrawal.bukti_transfer,
      dicairkan_pada: withdrawal.dicairkan_pada,
      message: 'Withdrawal berhasil disetujui dan dana ditransfer'
    };
  }
}

module.exports = AdminApproveWithdrawal;
