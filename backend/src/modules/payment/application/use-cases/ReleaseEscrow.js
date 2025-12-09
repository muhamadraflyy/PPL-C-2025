/**
 * Release Escrow Use Case
 * Handle release dana dari escrow ke freelancer (client approve)
 */

const EscrowService = require('../../infrastructure/services/EscrowService');
const EscrowModel = require('../../infrastructure/models/EscrowModel');

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
    // Fetch the order to get client_id and freelancer_id
    const [orderData] = await EscrowModel.sequelize.query(
      'SELECT client_id, freelancer_id FROM pesanan WHERE id = ? LIMIT 1',
      {
        replacements: [escrow.pesanan_id],
        type: EscrowModel.sequelize.QueryTypes.SELECT
      }
    );

    if (!orderData) {
      throw new Error('Order not found for this escrow');
    }

    const { client_id, freelancer_id } = orderData;

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
    const releasedEscrow = await this.escrowService.releaseEscrow(escrow.id, user_id);

    console.log(`[ESCROW RELEASE] Successfully released escrow ${escrow.id}`);
    console.log(`[ESCROW RELEASE] Net amount to freelancer: Rp ${parseFloat(releasedEscrow.jumlah_ditahan) - parseFloat(releasedEscrow.biaya_platform)}`);

    // Integration points for other modules:
    // - Order module: Update order status to 'selesai'
    // - Notification module: Send notification to freelancer
    // - Freelancer can now withdraw funds via /api/payments/withdraw

    return {
      success: true,
      escrow_id: releasedEscrow.id,
      status: releasedEscrow.status,
      jumlah_ditahan: parseFloat(releasedEscrow.jumlah_ditahan),
      biaya_platform: parseFloat(releasedEscrow.biaya_platform),
      jumlah_bersih: parseFloat(releasedEscrow.jumlah_ditahan) - parseFloat(releasedEscrow.biaya_platform),
      dirilis_pada: releasedEscrow.dirilis_pada,
      message: 'Escrow released successfully. Freelancer can now withdraw funds.'
    };
  }
}

module.exports = ReleaseEscrow;
