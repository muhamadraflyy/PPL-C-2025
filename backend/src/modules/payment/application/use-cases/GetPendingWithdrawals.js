/**
 * Get Pending Withdrawals Use Case
 * Get all pending withdrawals for admin review
 */

const WithdrawalService = require('../../infrastructure/services/WithdrawalService');
const WithdrawalModel = require('../../infrastructure/models/WithdrawalModel');

class GetPendingWithdrawals {
  constructor() {
    this.withdrawalService = new WithdrawalService();
  }

  /**
   * Execute get pending withdrawals
   * @param {Object} dto - Query parameters
   * @returns {Promise<Object>} Withdrawals list
   */
  async execute(dto = {}) {
    const { status, limit = 50, offset = 0 } = dto;

    console.log(`[ADMIN] Fetching withdrawals (status: ${status || 'all'})`);

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    // Setup association if not already defined
    const { sequelize } = require('../../../../shared/database/connection');
    const UserModel = sequelize.models.User || sequelize.models.users;

    if (UserModel && !WithdrawalModel.associations.freelancer) {
      WithdrawalModel.belongsTo(UserModel, {
        foreignKey: 'freelancer_id',
        as: 'freelancer'
      });
    }

    // Get withdrawals with freelancer info
    const withdrawals = await WithdrawalModel.findAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']], // Changed to DESC to show newest first
      include: UserModel ? [
        {
          model: UserModel,
          as: 'freelancer',
          attributes: ['id', 'nama_depan', 'nama_belakang', 'email'],
          required: false
        }
      ] : []
    });

    const count = await WithdrawalModel.count({ where });

    console.log(`[ADMIN] Found ${withdrawals.length} withdrawals out of ${count} total`);

    return {
      success: true,
      withdrawals: withdrawals.map(w => w.toJSON()),
      total: count,
      limit,
      offset
    };
  }
}

module.exports = GetPendingWithdrawals;
