/**
 * Payment Controller
 * Handle HTTP requests untuk payment endpoints
 */

const CreatePayment = require('../../application/use-cases/CreatePayment');
const VerifyPayment = require('../../application/use-cases/VerifyPayment');
const ReleaseEscrow = require('../../application/use-cases/ReleaseEscrow');
const WithdrawFunds = require('../../application/use-cases/WithdrawFunds');
const RequestRefund = require('../../application/use-cases/RequestRefund');
const ProcessRefund = require('../../application/use-cases/ProcessRefund');
const RetryPayment = require('../../application/use-cases/RetryPayment');
const GetPendingWithdrawals = require('../../application/use-cases/GetPendingWithdrawals');
const AdminApproveWithdrawal = require('../../application/use-cases/AdminApproveWithdrawal');
const AdminRejectWithdrawal = require('../../application/use-cases/AdminRejectWithdrawal');
const PaymentModel = require('../../infrastructure/models/PaymentModel');
const EscrowModel = require('../../infrastructure/models/EscrowModel');
const WithdrawalModel = require('../../infrastructure/models/WithdrawalModel');
const OrderModel = require('../../../order/infrastructure/models/OrderModel');
const UserModel = require('../../../user/infrastructure/models/UserModel');
const MockPaymentGatewayService = require('../../infrastructure/services/MockPaymentGatewayService');
const InvoiceService = require('../../infrastructure/services/InvoiceService');
const EmailService = require('../../infrastructure/services/EmailService');
const { Sequelize } = require('sequelize');

class PaymentController {
  constructor() {
    this.createPaymentUseCase = new CreatePayment();
    this.verifyPaymentUseCase = new VerifyPayment();
    this.releaseEscrowUseCase = new ReleaseEscrow();
    this.withdrawFundsUseCase = new WithdrawFunds();
    this.requestRefundUseCase = new RequestRefund();
    this.processRefundUseCase = new ProcessRefund();
    this.retryPaymentUseCase = new RetryPayment();
    this.getPendingWithdrawalsUseCase = new GetPendingWithdrawals();
    this.adminApproveWithdrawalUseCase = new AdminApproveWithdrawal();
    this.adminRejectWithdrawalUseCase = new AdminRejectWithdrawal();
    this.mockGateway = new MockPaymentGatewayService();
    this.invoiceService = new InvoiceService();
    this.emailService = new EmailService();
  }

  /**
   * POST /api/payments/create
   * Create new payment
   */
  async createPayment(req, res) {
    try {
      const { pesanan_id, jumlah, metode_pembayaran, channel, order_title, customer_name, customer_email } = req.body;
      const user_id = req.user?.userId || req.user?.id || req.body.user_id;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // TEMPORARY WORKAROUND: Auto-create order if not exists
      // TODO: Remove this when order creation API is fully implemented by the team
      try {
        // Check if order exists
        const [existingOrder] = await PaymentModel.sequelize.query(
          'SELECT id FROM pesanan WHERE id = ? LIMIT 1',
          {
            replacements: [pesanan_id],
            type: Sequelize.QueryTypes.SELECT
          }
        );

        if (!existingOrder) {
          console.log('[PAYMENT] Order not found, creating minimal order for payment...');

          // Create minimal order for payment to work
          const nomor_pesanan = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
          const harga = parseFloat(jumlah) / 1.1; // Reverse calculate (total / 1.1)
          const biaya_platform = parseFloat(jumlah) - harga;
          const waktu_pengerjaan = 7; // Default 7 days
          const tenggat_waktu = new Date();
          tenggat_waktu.setDate(tenggat_waktu.getDate() + waktu_pengerjaan);

          // Get a freelancer_id (temporary: use any freelancer, ideally from service)
          const [anyFreelancer] = await PaymentModel.sequelize.query(
            "SELECT id FROM users WHERE role = 'freelancer' LIMIT 1",
            { type: Sequelize.QueryTypes.SELECT }
          );

          const freelancer_id = anyFreelancer ? anyFreelancer.id : user_id;

          // Get a real layanan_id from database to satisfy foreign key constraint
          const [anyLayanan] = await PaymentModel.sequelize.query(
            "SELECT id FROM layanan LIMIT 1",
            { type: Sequelize.QueryTypes.SELECT }
          );

          if (!anyLayanan) {
            throw new Error('No services found in database. Please create at least one service first.');
          }

          await PaymentModel.sequelize.query(
            `INSERT INTO pesanan (
              id, nomor_pesanan, client_id, freelancer_id, layanan_id,
              judul, deskripsi, harga, biaya_platform, total_bayar,
              waktu_pengerjaan, tenggat_waktu, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            {
              replacements: [
                pesanan_id,
                nomor_pesanan,
                user_id, // client_id
                freelancer_id,
                anyLayanan.id, // Use real layanan_id
                order_title || 'Payment Order',
                `Temporary order created for payment. Customer: ${customer_name || 'N/A'}`,
                harga,
                biaya_platform,
                jumlah,
                waktu_pengerjaan,
                tenggat_waktu,
                'menunggu_pembayaran'
              ]
            }
          );

          console.log('[PAYMENT] Minimal order created:', pesanan_id);
        }
      } catch (dbError) {
        console.error('[PAYMENT] Database error:', dbError);
        throw new Error('Failed to create order: ' + dbError.message);
      }

      // Fetch user data from database for Midtrans customer details
      const [userData] = await PaymentModel.sequelize.query(
        "SELECT email, nama_depan, nama_belakang, no_telepon FROM users WHERE id = ? LIMIT 1",
        {
          replacements: [user_id],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      const customerName = userData 
        ? `${userData.nama_depan || ""} ${userData.nama_belakang || ""}`.trim()
        : (customer_name || "Customer");
      
      const customerEmail = userData?.email || customer_email || "customer@example.com";
      const customerPhone = userData?.no_telepon || "";

      // Now create payment
      const result = await this.createPaymentUseCase.execute({
        pesanan_id,
        user_id,
        jumlah,
        metode_pembayaran,
        channel,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        order_title: order_title || "SkillConnect Service"
      });

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: result
      });
    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Create payment error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/payments/webhook
   * Handle webhook dari payment gateway
   */
  async handleWebhook(req, res) {
    try {
      const webhookData = req.body;

      const result = await this.verifyPaymentUseCase.execute(webhookData);

      res.status(200).json(result);
    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Webhook error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/:id
   * Get payment details
   */
  async getPaymentById(req, res) {
    try {
      const { id } = req.params;

      const payment = await PaymentModel.findByPk(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get payment error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/check-status/:transactionId
   * Check payment status from Midtrans API and update database
   * Note: transactionId can be either transaction_id or payment id (UUID)
   */
  async checkPaymentStatus(req, res) {
    try {
      const { transactionId } = req.params;

      // Try to find payment by transaction_id first, then by id (UUID)
      const { Op } = require('sequelize');
      const payment = await PaymentModel.findOne({
        where: {
          [Op.or]: [
            { transaction_id: transactionId },
            { id: transactionId }
          ]
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Query real-time status from Midtrans API if using midtrans gateway
      if (payment.payment_gateway === 'midtrans') {
        try {
          console.log(`[PAYMENT CONTROLLER] Checking status from Midtrans for: ${transactionId}`);

          const MidtransService = require('../../infrastructure/services/MidtransService');
          const midtransService = new MidtransService();

          const midtransStatus = await midtransService.getPaymentStatus(transactionId);
          console.log(`[PAYMENT CONTROLLER] Midtrans status:`, midtransStatus);

          // Update database if status changed
          if (midtransStatus.status !== payment.status) {
            console.log(`[PAYMENT CONTROLLER] Updating status from ${payment.status} to ${midtransStatus.status}`);

            payment.status = midtransStatus.status;

            // If payment successful, set paid date and generate invoice
            if (midtransStatus.status === 'berhasil') {
              payment.dibayar_pada = new Date();
              if (!payment.nomor_invoice) {
                const date = new Date();
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const uniqueId = payment.id.substring(0, 8).toUpperCase();
                payment.nomor_invoice = `INV/${year}/${month}/${uniqueId}`;
              }

              // Create escrow if not exists
              const EscrowService = require('../../infrastructure/services/EscrowService');
              const escrowService = new EscrowService();

              try {
                await escrowService.createEscrow({
                  pembayaran_id: payment.id,
                  pesanan_id: payment.pesanan_id,
                  jumlah_ditahan: parseFloat(payment.jumlah),
                  biaya_platform: parseFloat(payment.biaya_platform)
                });
                console.log(`[PAYMENT CONTROLLER] Escrow created for payment ${payment.id}`);
              } catch (escrowError) {
                // Escrow might already exist
                console.log(`[PAYMENT CONTROLLER] Escrow creation note:`, escrowError.message);
              }

              // Update order status to 'dibayar' when payment is successful
              const SequelizeOrderRepository = require('../../../order/infrastructure/repositories/SequelizeOrderRepository');
              const { sequelize } = require('../../../../shared/database/connection');
              const orderRepository = new SequelizeOrderRepository(sequelize);

              try {
                await orderRepository.updateStatus(payment.pesanan_id, 'dibayar');
                console.log(`[PAYMENT CONTROLLER] Order status updated to 'dibayar' for order: ${payment.pesanan_id}`);
              } catch (orderError) {
                console.error(`[PAYMENT CONTROLLER] Failed to update order status:`, orderError);
                // Continue processing even if order update fails
              }
            }

            await payment.save();
          }
        } catch (midtransError) {
          console.error('[PAYMENT CONTROLLER] Failed to check Midtrans status:', midtransError);
          // Continue with database status if Midtrans API fails
        }
      }

      // Determine redirect URL based on status
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      let redirectUrl = '';

      switch (payment.status) {
        case 'berhasil':
        case 'paid':
        case 'success':
        case 'settlement':
          redirectUrl = `${frontendUrl}/payment/success?order_id=${payment.transaction_id}&transaction_id=${payment.external_id || payment.transaction_id}&gross_amount=${payment.jumlah}`;
          break;
        case 'menunggu':
        case 'pending':
          redirectUrl = `${frontendUrl}/payment/pending?order_id=${payment.transaction_id}&transaction_id=${payment.external_id || payment.transaction_id}&gross_amount=${payment.jumlah}`;
          break;
        case 'kadaluarsa':
        case 'expired':
          redirectUrl = `${frontendUrl}/payment/expired?order_id=${payment.transaction_id}&transaction_id=${payment.external_id || payment.transaction_id}&gross_amount=${payment.jumlah}`;
          break;
        case 'gagal':
        case 'failed':
        case 'deny':
        case 'cancel':
        default:
          redirectUrl = `${frontendUrl}/payment/error?order_id=${payment.transaction_id}&transaction_id=${payment.external_id || payment.transaction_id}&gross_amount=${payment.jumlah}&message=${encodeURIComponent(payment.keterangan || 'Payment failed')}`;
          break;
      }

      res.status(200).json({
        success: true,
        data: {
          payment_id: payment.id,
          transaction_id: payment.transaction_id,
          status: payment.status,
          redirect_url: redirectUrl,
          amount: payment.jumlah,
          created_at: payment.created_at
        }
      });
    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Check payment status error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/order/:orderId
   * Get payment by order ID
   */
  async getPaymentByOrderId(req, res) {
    try {
      const { orderId } = req.params;

      const payment = await PaymentModel.findOne({
        where: { pesanan_id: orderId }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found for this order'
        });
      }

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get payment by order error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/payments/escrow/release
   * Release escrow (client approve)
   */
  async releaseEscrow(req, res) {
    try {
      const { escrow_id, payment_id, reason } = req.body;
      const user_id = req.user?.userId || req.user?.id || req.body.user_id;
      const user_role = req.user?.role;

      // Validate user_id and role are present
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      if (!user_role) {
        return res.status(403).json({
          success: false,
          message: 'User role not found in token. Please login again.'
        });
      }

      // Validate that at least one of escrow_id or payment_id is provided
      if (!escrow_id && !payment_id) {
        return res.status(400).json({
          success: false,
          message: 'Either escrow_id or payment_id is required'
        });
      }

      const result = await this.releaseEscrowUseCase.execute({
        escrow_id,
        payment_id,
        user_id,
        user_role,
        reason
      });

      res.status(200).json({
        success: true,
        message: 'Escrow released successfully',
        data: result
      });
    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Release escrow error:', error);

      // Return 403 for authorization errors, 400 for other errors
      const statusCode = error.message.includes('not authorized') || error.message.includes('Unauthorized')
        ? 403
        : 400;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/escrow/:id
   * Get escrow details
   */
  async getEscrowById(req, res) {
    try {
      const { id } = req.params;

      const escrow = await EscrowModel.findByPk(id);

      if (!escrow) {
        return res.status(404).json({
          success: false,
          message: 'Escrow not found'
        });
      }

      res.status(200).json({
        success: true,
        data: escrow
      });
    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get escrow error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/escrow
   * Get all escrow records (Admin only)
   */
  async getAllEscrows(req, res) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      const userRole = req.user?.role;

      // Admin-only endpoint
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can access all escrow records'
        });
      }

      const where = {};
      if (status) {
        where.status = status;
      }

      // Get escrows with related order and payment data
      const escrows = await EscrowModel.sequelize.query(
        `SELECT
          e.*,
          p.transaction_id,
          p.jumlah as payment_amount,
          o.nomor_pesanan,
          o.judul as order_title,
          o.client_id,
          o.freelancer_id,
          u_client.email as client_email,
          u_freelancer.email as freelancer_email
        FROM escrow e
        INNER JOIN pembayaran p ON e.pembayaran_id = p.id
        INNER JOIN pesanan o ON e.pesanan_id = o.id
        LEFT JOIN users u_client ON o.client_id = u_client.id
        LEFT JOIN users u_freelancer ON o.freelancer_id = u_freelancer.id
        ${status ? 'WHERE e.status = ?' : ''}
        ORDER BY e.created_at DESC
        LIMIT ? OFFSET ?`,
        {
          replacements: status ? [status, parseInt(limit), parseInt(offset)] : [parseInt(limit), parseInt(offset)],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      const total = await EscrowModel.count({ where });

      res.status(200).json({
        success: true,
        data: {
          escrows,
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get all escrows error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/payments/withdraw
   * Create withdrawal request (freelancer)
   */
  async createWithdrawal(req, res) {
    try {
      const {
        escrow_id,
        jumlah,
        bank_name,
        bank_account_number,
        bank_account_name,
        catatan,
        metode_pembayaran_id,
        metode_pencairan,
        nomor_rekening,
        nama_pemilik
      } = req.body;
      const freelancer_id = req.user?.id || req.body.freelancer_id;

      // NEW: Flexible withdrawal based on requested amount
      const requestedAmount = parseFloat(jumlah);

      if (!requestedAmount || requestedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Jumlah penarikan harus lebih dari 0'
        });
      }

      if (requestedAmount < 50000) {
        return res.status(400).json({
          success: false,
          message: 'Minimum penarikan adalah Rp 50,000'
        });
      }

      // Setup associations if not already defined
      if (!EscrowModel.associations.pembayaran) {
        EscrowModel.belongsTo(PaymentModel, { foreignKey: 'pembayaran_id', as: 'pembayaran' });
      }
      if (!PaymentModel.associations.pesanan) {
        PaymentModel.belongsTo(OrderModel, { foreignKey: 'pesanan_id', as: 'pesanan' });
      }

      // Find all available escrows for the freelancer (FIFO)
      const availableEscrows = await EscrowModel.findAll({
        where: {
          status: 'released'
        },
        include: [{
          model: PaymentModel,
          as: 'pembayaran',
          required: true,
          include: [{
            model: OrderModel,
            as: 'pesanan',
            required: true,
            where: {
              freelancer_id: freelancer_id
            }
          }]
        }],
        order: [['dirilis_pada', 'ASC']] // FIFO - first released, first withdrawn
      });

      if (availableEscrows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada saldo yang tersedia untuk ditarik'
        });
      }

      // Calculate total available balance
      const totalAvailable = availableEscrows.reduce((sum, escrow) => {
        return sum + parseFloat(escrow.jumlah_ditahan);
      }, 0);

      console.log(`[WITHDRAWAL] Freelancer ${freelancer_id} - Available balance: Rp ${totalAvailable}`);
      console.log(`[WITHDRAWAL] Requested amount: Rp ${requestedAmount}`);

      if (requestedAmount > totalAvailable) {
        return res.status(400).json({
          success: false,
          message: `Jumlah melebihi saldo tersedia. Saldo Anda: Rp ${totalAvailable.toLocaleString('id-ID')}`
        });
      }

      // Select escrows to cover the requested amount (FIFO)
      let remainingAmount = requestedAmount;
      const selectedEscrows = [];

      for (const escrow of availableEscrows) {
        if (remainingAmount <= 0) break;

        const escrowAmount = parseFloat(escrow.jumlah_ditahan);
        const amountToTake = Math.min(escrowAmount, remainingAmount);

        selectedEscrows.push({
          escrow_id: escrow.id,
          escrow_amount: escrowAmount,
          withdrawal_amount: amountToTake
        });

        remainingAmount -= amountToTake;
      }

      console.log(`[WITHDRAWAL] Selected ${selectedEscrows.length} escrow(s) to cover withdrawal`);

      // Create withdrawal records (1 per escrow)
      const createdWithdrawals = [];

      for (const selected of selectedEscrows) {
        const result = await this.withdrawFundsUseCase.execute({
          escrow_id: selected.escrow_id,
          freelancer_id,
          metode_pembayaran_id: metode_pembayaran_id || null,
          metode_pencairan: metode_pencairan || 'transfer_bank',
          bank_name: bank_name,
          nomor_rekening: nomor_rekening || bank_account_number,
          nama_pemilik: nama_pemilik || bank_account_name,
          requested_amount: selected.withdrawal_amount, // Pass the partial amount
          is_partial: selected.withdrawal_amount < selected.escrow_amount
        });

        createdWithdrawals.push(result);
      }

      // Calculate totals
      const totalGross = createdWithdrawals.reduce((sum, w) => sum + w.jumlah, 0);
      const totalFee = createdWithdrawals.reduce((sum, w) => sum + w.biaya_platform, 0);
      const totalNet = createdWithdrawals.reduce((sum, w) => sum + w.jumlah_bersih, 0);

      res.status(201).json({
        success: true,
        message: selectedEscrows.length > 1
          ? `Withdrawal request created (${selectedEscrows.length} transaksi)`
          : 'Withdrawal request created successfully',
        data: {
          withdrawal_count: createdWithdrawals.length,
          total_gross: totalGross,
          total_fee: totalFee,
          total_net: totalNet,
          withdrawals: createdWithdrawals,
          status: 'pending',
          message: 'Permintaan penarikan sedang menunggu persetujuan admin'
        }
      });
    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Create withdrawal error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/withdrawals/:id
   * Get withdrawal details
   */
  async getWithdrawalById(req, res) {
    try {
      const { id } = req.params;

      const withdrawal = await WithdrawalModel.findByPk(id, { raw: true });

      if (!withdrawal) {
        return res.status(404).json({
          success: false,
          message: 'Withdrawal not found'
        });
      }

      // Map field names to match frontend expectations
      const mappedWithdrawal = {
        ...withdrawal,
        bank_account_number: withdrawal.nomor_rekening,
        bank_account_name: withdrawal.nama_pemilik,
        // Sequelize with raw:true returns camelCase dates even with underscored:true
        created_at: withdrawal.createdAt ? new Date(withdrawal.createdAt).toISOString() : null,
        updated_at: withdrawal.updatedAt ? new Date(withdrawal.updatedAt).toISOString() : null,
        dicairkan_pada: withdrawal.dicairkan_pada ? new Date(withdrawal.dicairkan_pada).toISOString() : null
      };

      res.status(200).json({
        success: true,
        data: mappedWithdrawal
      });
    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get withdrawal error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/payments/mock/trigger-success
   * Manual trigger payment success (TESTING ONLY)
   */
  async mockTriggerSuccess(req, res) {
    try {
      const { transaction_id } = req.body;

      const payment = await PaymentModel.findOne({
        where: { transaction_id }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Trigger success webhook
      const webhookData = await this.mockGateway.triggerPaymentSuccess(
        transaction_id,
        parseFloat(payment.total_bayar)
      );

      // Process webhook
      await this.verifyPaymentUseCase.execute(webhookData);

      res.status(200).json({
        success: true,
        message: 'Payment success triggered',
        data: { transaction_id, status: 'berhasil' }
      });
    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Mock trigger success error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/payments/mock/trigger-failure
   * Manual trigger payment failure (TESTING ONLY)
   */
  async mockTriggerFailure(req, res) {
    try {
      const { transaction_id, reason } = req.body;

      const payment = await PaymentModel.findOne({
        where: { transaction_id }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Trigger failure webhook
      const webhookData = await this.mockGateway.triggerPaymentFailure(
        transaction_id,
        parseFloat(payment.total_bayar),
        reason
      );

      // Process webhook
      await this.verifyPaymentUseCase.execute(webhookData);

      res.status(200).json({
        success: true,
        message: 'Payment failure triggered',
        data: { transaction_id, status: 'gagal', reason }
      });
    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Mock trigger failure error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/:id/invoice
   * Get atau generate invoice PDF
   */
  async getInvoice(req, res) {
    try {
      const { id } = req.params;

      // Fetch payment data
      const payment = await PaymentModel.findByPk(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Check if invoice already exists
      let invoicePath;
      if (this.invoiceService.invoiceExists(payment.id, payment.nomor_invoice)) {
        invoicePath = this.invoiceService.getInvoicePath(payment.id, payment.nomor_invoice);
      } else {
        // Fetch order and user data separately
        let orderData = {};
        let userData = {};

        if (payment.pesanan_id) {
          const order = await OrderModel.findByPk(payment.pesanan_id);
          if (order) {
            orderData = {
              judul: order.judul,
              deskripsi: order.deskripsi
            };

            // Fetch client data
            if (order.client_id) {
              const client = await UserModel.findByPk(order.client_id);
              if (client) {
                userData = {
                  nama: client.nama_depan + (client.nama_belakang ? ' ' + client.nama_belakang : ''),
                  email: client.email,
                  no_hp: client.no_telepon
                };
              }
            }
          }
        }

        // Generate new invoice with complete data
        invoicePath = await this.invoiceService.generateInvoice(payment.toJSON(), orderData, userData);
      }

      // Send file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=INV-${payment.nomor_invoice || payment.id}.pdf`);
      res.sendFile(invoicePath);

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get invoice error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/payments/:id/send-invoice
   * Generate dan kirim invoice via email
   */
  async sendInvoice(req, res) {
    try {
      const { id } = req.params;
      const { email } = req.body;

      const payment = await PaymentModel.findByPk(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Generate invoice if not exists
      let invoicePath;
      if (this.invoiceService.invoiceExists(payment.id, payment.nomor_invoice)) {
        invoicePath = this.invoiceService.getInvoicePath(payment.id, payment.nomor_invoice);
      } else {
        invoicePath = await this.invoiceService.generateInvoice(payment);
      }

      // Send email with invoice
      const targetEmail = email || payment.email || 'customer@example.com';
      await this.emailService.sendPaymentSuccessEmail(targetEmail, payment, invoicePath);

      res.status(200).json({
        success: true,
        message: 'Invoice sent successfully',
        data: { email: targetEmail }
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Send invoice error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/analytics/summary
   * Get payment analytics summary
   */
/**
 * ROLE-BASED ANALYTICS METHODS
 * Add these methods to PaymentController.js
 */

  /**
   * GET /api/payments/analytics/summary
   * Get payment analytics summary (ROLE-BASED)
   * - Admin: sees all data
   * - Freelancer: sees only their earnings
   * - Client: sees only their spending
   */
  async getAnalyticsSummary(req, res) {
    try {
      const { start_date, end_date, period = '30d' } = req.query;
      const userId = req.user?.userId || req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User ID and role required'
        });
      }

      // Calculate date range
      let startDate, endDate;
      if (start_date && end_date) {
        startDate = new Date(start_date);
        endDate = new Date(end_date);
      } else {
        endDate = new Date();
        startDate = new Date();
        const days = parseInt(period.replace('d', '')) || 30;
        startDate.setDate(startDate.getDate() - days);
      }

      // Build WHERE clause based on role
      let whereClause = {
        created_at: {
          [Sequelize.Op.between]: [startDate, endDate]
        }
      };

      // Role-based filtering
      if (userRole === 'freelancer') {
        // Freelancer sees payments for their orders (where they are the freelancer)
        // Need to join with pesanan table
        const [freelancerPayments] = await PaymentModel.sequelize.query(
          `SELECT
            COUNT(p.id) as total_payments,
            SUM(CASE WHEN p.status IN ('berhasil', 'paid', 'success', 'settlement') THEN 1 ELSE 0 END) as success_payments,
            SUM(CASE WHEN p.status IN ('berhasil', 'paid', 'success', 'settlement') THEN p.jumlah ELSE 0 END) as total_revenue,
            SUM(CASE WHEN p.status IN ('berhasil', 'paid', 'success', 'settlement') THEN p.biaya_platform ELSE 0 END) as total_platform_fee
          FROM pembayaran p
          INNER JOIN pesanan o ON p.pesanan_id = o.id
          WHERE o.freelancer_id = ?
            AND p.created_at >= ? AND p.created_at < DATE_ADD(?, INTERVAL 1 DAY)`,
          {
            replacements: [userId, startDate, endDate],
            type: Sequelize.QueryTypes.SELECT
          }
        );

        return res.status(200).json({
          success: true,
          data: {
            summary: {
              total_payments: parseInt(freelancerPayments.total_payments || 0),
              success_payments: parseInt(freelancerPayments.success_payments || 0),
              total_revenue: parseFloat(freelancerPayments.total_revenue || 0),
              total_platform_fee: parseFloat(freelancerPayments.total_platform_fee || 0),
              net_earnings: parseFloat(freelancerPayments.total_revenue || 0) - parseFloat(freelancerPayments.total_platform_fee || 0)
            },
            period: {
              start: startDate.toISOString().split('T')[0],
              end: endDate.toISOString().split('T')[0]
            },
            role: 'freelancer'
          }
        });

      } else if (userRole === 'client') {
        // Client sees payments for their orders (where they are the client)
        const [clientPayments] = await PaymentModel.sequelize.query(
          `SELECT
            COUNT(p.id) as total_payments,
            SUM(CASE WHEN p.status IN ('berhasil', 'paid', 'success', 'settlement') THEN 1 ELSE 0 END) as success_payments,
            SUM(CASE WHEN p.status IN ('berhasil', 'paid', 'success', 'settlement') THEN p.total_bayar ELSE 0 END) as total_spent
          FROM pembayaran p
          INNER JOIN pesanan o ON p.pesanan_id = o.id
          WHERE o.client_id = ?
            AND p.created_at >= ? AND p.created_at < DATE_ADD(?, INTERVAL 1 DAY)`,
          {
            replacements: [userId, startDate, endDate],
            type: Sequelize.QueryTypes.SELECT
          }
        );

        return res.status(200).json({
          success: true,
          data: {
            summary: {
              total_payments: parseInt(clientPayments.total_payments || 0),
              success_payments: parseInt(clientPayments.success_payments || 0),
              total_spent: parseFloat(clientPayments.total_spent || 0)
            },
            period: {
              start: startDate.toISOString().split('T')[0],
              end: endDate.toISOString().split('T')[0]
            },
            role: 'client'
          }
        });
      }

      // ADMIN: sees all data (existing logic)
      const totalPayments = await PaymentModel.count({ where: whereClause });

      const successPayments = await PaymentModel.count({
        where: {
          ...whereClause,
          status: ['berhasil', 'paid', 'success', 'settlement']
        }
      });

      const revenueResult = await PaymentModel.findAll({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_revenue'],
          [Sequelize.fn('SUM', Sequelize.col('biaya_platform')), 'total_platform_fee'],
          [Sequelize.fn('SUM', Sequelize.col('total_bayar')), 'total_gross']
        ],
        where: {
          ...whereClause,
          status: ['berhasil', 'paid', 'success', 'settlement']
        },
        raw: true
      });

      const totalRevenue = parseFloat(revenueResult[0]?.total_revenue || 0);
      const totalPlatformFee = parseFloat(revenueResult[0]?.total_platform_fee || 0);
      const totalGross = parseFloat(revenueResult[0]?.total_gross || 0);

      const paymentMethods = await PaymentModel.findAll({
        attributes: [
          'metode_pembayaran',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_amount']
        ],
        where: {
          ...whereClause,
          status: ['berhasil', 'paid', 'success', 'settlement']
        },
        group: ['metode_pembayaran'],
        raw: true
      });

      const dailyTransactions = await PaymentModel.findAll({
        attributes: [
          [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          [Sequelize.fn('SUM', Sequelize.col('total_bayar')), 'total_amount']
        ],
        where: {
          ...whereClause,
          status: ['berhasil', 'paid', 'success', 'settlement']
        },
        group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
        order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']],
        raw: true
      });

      const statusBreakdown = await PaymentModel.findAll({
        attributes: [
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: whereClause,
        group: ['status'],
        raw: true
      });

      res.status(200).json({
        success: true,
        data: {
          summary: {
            total_payments: totalPayments,
            success_payments: successPayments,
            failed_payments: totalPayments - successPayments,
            success_rate: totalPayments > 0 ? ((successPayments / totalPayments) * 100).toFixed(2) + '%' : '0%',
            total_revenue: totalRevenue,
            total_platform_fee: totalPlatformFee,
            total_gross: totalGross
          },
          period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          },
          payment_methods: paymentMethods,
          daily_transactions: dailyTransactions,
          status_breakdown: statusBreakdown,
          role: 'admin'
        }
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get analytics error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/analytics/escrow
   * Get escrow analytics (ROLE-BASED)
   */
  async getEscrowAnalytics(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      let whereClause = {};

      // Role-based filtering
      if (userRole === 'freelancer') {
        // Get escrow for freelancer's orders
        const freelancerOrders = await PaymentModel.sequelize.query(
          'SELECT id FROM pesanan WHERE freelancer_id = ?',
          {
            replacements: [userId],
            type: Sequelize.QueryTypes.SELECT
          }
        );
        const orderIds = freelancerOrders.map(o => o.id);
        if (orderIds.length === 0) {
          return res.status(200).json({
            success: true,
            data: {
              active_escrow: { count: 0, total_amount: 0 },
              breakdown_by_status: [],
              role: 'freelancer'
            }
          });
        }
        whereClause.pesanan_id = { [Sequelize.Op.in]: orderIds };
      } else if (userRole === 'client') {
        // Get escrow for client's orders
        const clientOrders = await PaymentModel.sequelize.query(
          'SELECT id FROM pesanan WHERE client_id = ?',
          {
            replacements: [userId],
            type: Sequelize.QueryTypes.SELECT
          }
        );
        const orderIds = clientOrders.map(o => o.id);
        if (orderIds.length === 0) {
          return res.status(200).json({
            success: true,
            data: {
              active_escrow: { count: 0, total_amount: 0 },
              breakdown_by_status: [],
              role: 'client'
            }
          });
        }
        whereClause.pesanan_id = { [Sequelize.Op.in]: orderIds };
      }

      // Get escrow stats with role filter
      const escrowStats = await EscrowModel.findAll({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_count'],
          [Sequelize.fn('SUM', Sequelize.col('jumlah_ditahan')), 'total_amount']
        ],
        where: {
          ...whereClause,
          status: 'ditahan'
        },
        raw: true
      });

      const escrowByStatus = await EscrowModel.findAll({
        attributes: [
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          [Sequelize.fn('SUM', Sequelize.col('jumlah_ditahan')), 'total_amount']
        ],
        where: whereClause,
        group: ['status'],
        raw: true
      });

      res.status(200).json({
        success: true,
        data: {
          active_escrow: {
            count: parseInt(escrowStats[0]?.total_count || 0),
            total_amount: parseFloat(escrowStats[0]?.total_amount || 0)
          },
          breakdown_by_status: escrowByStatus,
          role: userRole
        }
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get escrow analytics error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/analytics/withdrawals
   * Get withdrawal analytics (ROLE-BASED)
   */
  async getWithdrawalAnalytics(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      let whereClause = {};

      // Only freelancers and admins can see withdrawals
      if (userRole === 'freelancer') {
        whereClause.freelancer_id = userId;
      } else if (userRole === 'client') {
        return res.status(403).json({
          success: false,
          message: 'Clients cannot access withdrawal analytics'
        });
      }

      const withdrawalStats = await WithdrawalModel.findAll({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_count'],
          [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_amount']
        ],
        where: whereClause,
        raw: true
      });

      const withdrawalByStatus = await WithdrawalModel.findAll({
        attributes: [
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_amount']
        ],
        where: whereClause,
        group: ['status'],
        raw: true
      });

      const pendingWithdrawals = await WithdrawalModel.findAll({
        where: {
          ...whereClause,
          status: 'pending'
        },
        limit: 10,
        order: [['created_at', 'DESC']]
      });

      // Transform breakdown_by_status array into individual status objects
      const statusData = {
        pending: { count: 0, total_amount: 0 },
        processing: { count: 0, total_amount: 0 },
        completed: { count: 0, total_amount: 0 },
        failed: { count: 0, total_amount: 0 }
      };

      withdrawalByStatus.forEach(item => {
        if (statusData[item.status]) {
          statusData[item.status] = {
            count: parseInt(item.count) || 0,
            total_amount: parseFloat(item.total_amount) || 0
          };
        }
      });

      res.status(200).json({
        success: true,
        data: {
          ...statusData,  // Spread pending, processing, completed, failed
          total: {
            count: parseInt(withdrawalStats[0]?.total_count || 0),
            total_amount: parseFloat(withdrawalStats[0]?.total_amount || 0)
          },
          pending_withdrawals: userRole === 'admin' ? pendingWithdrawals : [],
          role: userRole
        }
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get withdrawal analytics error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/analytics/freelancer-earnings
   * Get freelancer earnings analytics (NEW ENDPOINT)
   */
  async getFreelancerEarnings(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const userRole = req.user?.role;
      const { start_date, end_date } = req.query;

      // Only freelancers and admins can access
      if (userRole !== 'freelancer' && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only freelancers can access earnings data'
        });
      }

      // If admin, can view any freelancer's earnings via query param
      const freelancerId = userRole === 'admin' && req.query.freelancer_id
        ? req.query.freelancer_id
        : userId;

      // Date range
      const endDate = end_date ? new Date(end_date) : new Date();
      const startDate = start_date ? new Date(start_date) : new Date(endDate.getFullYear(), 0, 1); // Start of year

      // Get earnings data
      const [earningsData] = await PaymentModel.sequelize.query(
        `SELECT
          COUNT(DISTINCT p.id) as total_orders,
          SUM(CASE WHEN p.status IN ('berhasil', 'paid', 'success', 'settlement') THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN p.status IN ('berhasil', 'paid', 'success', 'settlement') THEN p.jumlah ELSE 0 END) as total_earned,
          SUM(CASE WHEN p.status IN ('berhasil', 'paid', 'success', 'settlement') THEN p.biaya_platform ELSE 0 END) as platform_fees,
          AVG(CASE WHEN p.status IN ('berhasil', 'paid', 'success', 'settlement') THEN p.jumlah ELSE NULL END) as average_order_value
        FROM pembayaran p
        INNER JOIN pesanan o ON p.pesanan_id = o.id
        WHERE o.freelancer_id = ?
          AND p.created_at >= ? AND p.created_at < DATE_ADD(?, INTERVAL 1 DAY)`,
        {
          replacements: [freelancerId, startDate, endDate],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      // Get pending escrow
      const [escrowData] = await PaymentModel.sequelize.query(
        `SELECT
          COUNT(e.id) as pending_count,
          SUM(e.jumlah_ditahan) as pending_amount
        FROM escrow e
        INNER JOIN pesanan o ON e.pesanan_id = o.id
        WHERE o.freelancer_id = ?
          AND e.status = 'ditahan'`,
        {
          replacements: [freelancerId],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      // Get withdrawn amount
      const [withdrawnData] = await WithdrawalModel.findAll({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_withdrawn']
        ],
        where: {
          freelancer_id: freelancerId,
          status: 'completed'
        },
        raw: true
      });

      const totalEarned = parseFloat(earningsData.total_earned || 0);
      const platformFees = parseFloat(earningsData.platform_fees || 0);
      const pendingEscrow = parseFloat(escrowData.pending_amount || 0);
      const totalWithdrawn = parseFloat(withdrawnData[0]?.total_withdrawn || 0);
      const availableBalance = totalEarned - platformFees - pendingEscrow - totalWithdrawn;

      // Monthly earnings breakdown
      const monthlyEarnings = await PaymentModel.sequelize.query(
        `SELECT
          DATE_FORMAT(p.created_at, '%Y-%m') as month,
          COUNT(p.id) as orders,
          SUM(p.jumlah) as earnings
        FROM pembayaran p
        INNER JOIN pesanan o ON p.pesanan_id = o.id
        WHERE o.freelancer_id = ?
          AND p.status IN ('berhasil', 'paid', 'success', 'settlement')
          AND p.created_at >= ? AND p.created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY DATE_FORMAT(p.created_at, '%Y-%m')
        ORDER BY month ASC`,
        {
          replacements: [freelancerId, startDate, endDate],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      // Disable caching for analytics
      res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.status(200).json({
        success: true,
        data: {
          summary: {
            total_orders: parseInt(earningsData.total_orders || 0),
            completed_orders: parseInt(earningsData.completed_orders || 0),
            total_earned: totalEarned,
            platform_fees: platformFees,
            net_earnings: totalEarned - platformFees,
            average_order_value: parseFloat(earningsData.average_order_value || 0)
          },
          balance: {
            pending_escrow: pendingEscrow,
            available_balance: Math.max(0, availableBalance),
            total_withdrawn: totalWithdrawn
          },
          monthly_earnings: monthlyEarnings,
          period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          }
        }
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get freelancer earnings error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/analytics/client-spending
   * Get client spending analytics (NEW ENDPOINT)
   */
  async getClientSpending(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const userRole = req.user?.role;
      const { start_date, end_date } = req.query;

      // Only clients and admins can access
      if (userRole !== 'client' && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only clients can access spending data'
        });
      }

      // If admin, can view any client's spending via query param
      const clientId = userRole === 'admin' && req.query.client_id
        ? req.query.client_id
        : userId;

      // Date range
      const endDate = end_date ? new Date(end_date) : new Date();
      const startDate = start_date ? new Date(start_date) : new Date(endDate.getFullYear(), 0, 1);

      // Get spending data
      const [spendingData] = await PaymentModel.sequelize.query(
        `SELECT
          COUNT(DISTINCT p.id) as total_orders,
          SUM(CASE WHEN p.status = 'berhasil' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN o.status = 'dikerjakan' OR o.status = 'menunggu_review' THEN 1 ELSE 0 END) as active_orders,
          SUM(CASE WHEN p.status = 'berhasil' THEN p.total_bayar ELSE 0 END) as total_spent,
          AVG(CASE WHEN p.status = 'berhasil' THEN p.total_bayar ELSE NULL END) as average_order_value
        FROM pembayaran p
        INNER JOIN pesanan o ON p.pesanan_id = o.id
        WHERE o.client_id = ?
          AND p.created_at >= ? AND p.created_at < DATE_ADD(?, INTERVAL 1 DAY)`,
        {
          replacements: [clientId, startDate, endDate],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      // Get refunds
      const [refundData] = await PaymentModel.sequelize.query(
        `SELECT
          COUNT(r.id) as total_refunds,
          SUM(r.jumlah_refund) as total_refunded
        FROM refund r
        INNER JOIN pembayaran p ON r.pembayaran_id = p.id
        INNER JOIN pesanan o ON p.pesanan_id = o.id
        WHERE o.client_id = ?
          AND r.status = 'completed'`,
        {
          replacements: [clientId],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      // Monthly spending breakdown
      const monthlySpending = await PaymentModel.sequelize.query(
        `SELECT
          DATE_FORMAT(p.created_at, '%Y-%m') as month,
          COUNT(p.id) as orders,
          SUM(p.total_bayar) as spent
        FROM pembayaran p
        INNER JOIN pesanan o ON p.pesanan_id = o.id
        WHERE o.client_id = ?
          AND p.status = 'berhasil'
          AND p.created_at >= ? AND p.created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY DATE_FORMAT(p.created_at, '%Y-%m')
        ORDER BY month ASC`,
        {
          replacements: [clientId, startDate, endDate],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      // Disable caching for analytics
      res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.status(200).json({
        success: true,
        data: {
          summary: {
            total_orders: parseInt(spendingData.total_orders || 0),
            completed_orders: parseInt(spendingData.completed_orders || 0),
            active_orders: parseInt(spendingData.active_orders || 0),
            total_spent: parseFloat(spendingData.total_spent || 0),
            average_order_value: parseFloat(spendingData.average_order_value || 0),
            total_refunds: parseInt(refundData.total_refunds || 0),
            total_refunded: parseFloat(refundData.total_refunded || 0),
            success_rate: spendingData.total_orders > 0 ? Math.round((spendingData.completed_orders / spendingData.total_orders) * 100) : 0
          },
          monthly_spending: monthlySpending,
          period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          }
        }
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get client spending error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/balance
   * Get user balance (for freelancers)
   */
  async getUserBalance(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const userRole = req.user?.role;

      if (userRole !== 'freelancer') {
        return res.status(403).json({
          success: false,
          message: 'Only freelancers have balance'
        });
      }

      // Get total earned
      const [earnedData] = await PaymentModel.sequelize.query(
        `SELECT SUM(p.jumlah) as total, SUM(p.biaya_platform) as fees
        FROM pembayaran p
        INNER JOIN pesanan o ON p.pesanan_id = o.id
        WHERE o.freelancer_id = ? AND p.status IN ('berhasil', 'paid', 'success', 'settlement')`,
        {
          replacements: [userId],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      // Get pending escrow (held)
      const [escrowHeldData] = await PaymentModel.sequelize.query(
        `SELECT SUM(e.jumlah_ditahan) as amount
        FROM escrow e
        INNER JOIN pesanan o ON e.pesanan_id = o.id
        WHERE o.freelancer_id = ? AND e.status = 'held'`,
        {
          replacements: [userId],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      // Get released escrow (available to withdraw)
      const [escrowReleasedData] = await PaymentModel.sequelize.query(
        `SELECT SUM(e.jumlah_ditahan) as amount
        FROM escrow e
        INNER JOIN pesanan o ON e.pesanan_id = o.id
        WHERE o.freelancer_id = ? AND e.status = 'released'`,
        {
          replacements: [userId],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      // Get withdrawn
      const [withdrawnData] = await WithdrawalModel.findAll({
        attributes: [[Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total']],
        where: { freelancer_id: userId, status: 'completed' },
        raw: true
      });

      const totalEarned = parseFloat(earnedData.total || 0);
      const platformFees = parseFloat(earnedData.fees || 0);
      const pendingEscrow = parseFloat(escrowHeldData.amount || 0);
      const releasedEscrow = parseFloat(escrowReleasedData.amount || 0);
      const withdrawn = parseFloat(withdrawnData?.total || 0); // FIX: withdrawnData is already first element

      // Available balance = released escrow only
      // When withdrawal is completed, escrow moves from 'released' to 'completed'
      // So withdrawn amount is already NOT in releasedEscrow
      const available = releasedEscrow;

      // Disable caching for analytics
      res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.status(200).json({
        success: true,
        data: {
          total_earned: totalEarned,
          platform_fees: platformFees,
          pending_escrow: pendingEscrow,
          total_withdrawn: withdrawn,
          available_balance: available
        }
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get balance error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/payments/:id/refund
   * Request refund untuk payment
   */
  async requestRefund(req, res) {
    try {
      const { id } = req.params;
      const { alasan, jumlah_refund } = req.body;
      const user_id = req.user?.userId || req.user?.id || req.body.user_id;

      const result = await this.requestRefundUseCase.execute({
        pembayaran_id: id,
        user_id,
        alasan,
        jumlah_refund
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: result.refund
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Request refund error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/payments/refund/:id/process
   * Admin approve/reject refund request
   */
  async processRefund(req, res) {
    try {
      const { id } = req.params;
      const { action, catatan_admin } = req.body;
      const admin_id = req.user?.id || req.body.admin_id;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action harus "approve" atau "reject"'
        });
      }

      const result = await this.processRefundUseCase.execute({
        refund_id: id,
        admin_id,
        action,
        catatan_admin
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.refund
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Process refund error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/refunds
   * Get all refund requests (admin)
   */
  async getAllRefunds(req, res) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      // Build WHERE clause for status filter
      const statusFilter = status ? `WHERE r.status = :status` : '';

      // Raw SQL query with JOINs to get all related data
      const query = `
        SELECT
          r.id,
          r.pembayaran_id,
          r.user_id,
          r.alasan,
          r.jumlah_refund as jumlah,
          r.status,
          r.created_at,
          r.diproses_pada,
          r.selesai_pada,
          r.catatan_admin,
          u.email as user_email,
          u.nama_depan as user_nama_depan,
          u.nama_belakang as user_nama_belakang,
          p.id as payment_id,
          p.total_bayar,
          p.status as payment_status,
          ps.id as pesanan_id,
          ps.judul as pesanan_judul,
          l.id as layanan_id,
          l.judul as layanan_judul,
          l.slug as layanan_slug
        FROM refund r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN pembayaran p ON r.pembayaran_id = p.id
        LEFT JOIN pesanan ps ON p.pesanan_id = ps.id
        LEFT JOIN layanan l ON ps.layanan_id = l.id
        ${statusFilter}
        ORDER BY r.created_at DESC
        LIMIT :limit OFFSET :offset
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM refund r
        ${statusFilter}
      `;

      const replacements = status
        ? { status, limit: parseInt(limit), offset: parseInt(offset) }
        : { limit: parseInt(limit), offset: parseInt(offset) };

      const refunds = await PaymentModel.sequelize.query(query, {
        replacements,
        type: PaymentModel.sequelize.QueryTypes.SELECT
      });

      const countResult = await PaymentModel.sequelize.query(countQuery, {
        replacements: status ? { status } : {},
        type: PaymentModel.sequelize.QueryTypes.SELECT
      });

      const total = countResult[0]?.total || 0;

      // Transform flat results into nested structure for frontend compatibility
      const formattedRefunds = Array.isArray(refunds) ? refunds : [refunds];
      const transformedRefunds = formattedRefunds.filter(r => r).map(r => ({
        id: r.id,
        pembayaran_id: r.pembayaran_id,
        user_id: r.user_id,
        alasan: r.alasan,
        jumlah: parseFloat(r.jumlah),
        status: r.status,
        created_at: r.created_at,
        diproses_pada: r.diproses_pada,
        selesai_pada: r.selesai_pada,
        catatan_admin: r.catatan_admin,
        user: {
          id: r.user_id,
          email: r.user_email,
          nama_depan: r.user_nama_depan,
          nama_belakang: r.user_nama_belakang
        },
        pembayaran: {
          id: r.payment_id,
          total_bayar: parseFloat(r.total_bayar),
          status: r.payment_status,
          pesanan: {
            id: r.pesanan_id,
            judul: r.pesanan_judul,
            layanan: {
              id: r.layanan_id,
              judul: r.layanan_judul,
              slug: r.layanan_slug
            }
          }
        }
      }));

      res.status(200).json({
        success: true,
        data: {
          refunds: transformedRefunds,
          total: parseInt(total) || 0,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get refunds error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/payments/:id/retry
   * Retry failed payment
   */
  async retryPayment(req, res) {
    try {
      const { id } = req.params;
      const { metode_pembayaran, channel } = req.body;

      const result = await this.retryPaymentUseCase.execute({
        pembayaran_id: id,
        metode_pembayaran,
        channel
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          old_payment_id: result.old_payment.id,
          new_payment_id: result.new_payment.id,
          payment_url: result.payment_url,
          retry_count: result.retry_count,
          transaction_id: result.new_payment.transaction_id
        }
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Retry payment error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/payments/refund/request
   * Request refund - alternative endpoint with payment_id in body
   */
  async requestRefundAlt(req, res) {
    try {
      const { payment_id, alasan, reason, jumlah_refund, amount } = req.body;
      const user_id = req.user?.userId || req.user?.id;

      if (!payment_id) {
        return res.status(400).json({
          success: false,
          message: 'payment_id is required'
        });
      }

      // Support both 'alasan' and 'reason', 'jumlah_refund' and 'amount'
      const refundReason = alasan || reason;
      const refundAmount = jumlah_refund || amount;

      const result = await this.requestRefundUseCase.execute({
        pembayaran_id: payment_id,
        user_id,
        alasan: refundReason,
        jumlah_refund: refundAmount
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: result.refund
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Request refund error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/payments/withdrawal/history
   * Get user's withdrawal history
   */
  async getWithdrawalHistory(req, res) {
    try {
      const user_id = req.user?.userId || req.user?.id;
      const { status, limit = 50, offset = 0, page } = req.query;

      const where = { freelancer_id: user_id };
      if (status) {
        where.status = status;
      }

      const WithdrawalModel = require('../../infrastructure/models/WithdrawalModel');

      // Calculate offset from page if provided
      const actualLimit = parseInt(limit);
      const actualOffset = page ? (parseInt(page) - 1) * actualLimit : parseInt(offset);

      const withdrawals = await WithdrawalModel.findAll({
        where,
        limit: actualLimit,
        offset: actualOffset,
        order: [['created_at', 'DESC']],
        raw: true
      });

      // Get total count for pagination
      const totalCount = await WithdrawalModel.count({ where });

      // Map field names to match frontend expectations
      const mappedWithdrawals = withdrawals.map(w => {
        return {
          ...w,
          bank_account_number: w.nomor_rekening,
          bank_account_name: w.nama_pemilik,
          // Sequelize with raw:true returns camelCase dates even with underscored:true
          created_at: w.createdAt ? new Date(w.createdAt).toISOString() : null,
          updated_at: w.updatedAt ? new Date(w.updatedAt).toISOString() : null,
          dicairkan_pada: w.dicairkan_pada ? new Date(w.dicairkan_pada).toISOString() : null
        };
      });

      res.status(200).json({
        success: true,
        data: {
          withdrawals: mappedWithdrawals,
          totalPages: Math.ceil(totalCount / actualLimit),
          totalItems: totalCount,
          currentPage: page ? parseInt(page) : Math.floor(actualOffset / actualLimit) + 1
        },
        pagination: {
          limit: actualLimit,
          offset: actualOffset,
          total: totalCount
        }
      });

    } catch (error) {
      console.error('[PAYMENT CONTROLLER] Get withdrawal history error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/admin/payments/withdrawals
   * Get all withdrawals for admin (with filters)
   */
  async adminGetWithdrawals(req, res) {
    try {
      const { status, limit, offset } = req.query;

      const result = await this.getPendingWithdrawalsUseCase.execute({
        status,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('[ADMIN] Get withdrawals error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/admin/payments/withdrawals/:id/approve
   * Admin approves withdrawal and transfers funds
   */
  async adminApproveWithdrawal(req, res) {
    try {
      const { id } = req.params;
      const { bukti_transfer, catatan } = req.body;
      const admin_id = req.user?.userId || req.user?.id;

      if (!admin_id) {
        return res.status(401).json({
          success: false,
          message: 'Admin authentication required'
        });
      }

      if (!bukti_transfer) {
        return res.status(400).json({
          success: false,
          message: 'Bukti transfer wajib diupload'
        });
      }

      const result = await this.adminApproveWithdrawalUseCase.execute({
        withdrawal_id: id,
        admin_id,
        bukti_transfer,
        catatan
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('[ADMIN] Approve withdrawal error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/admin/payments/withdrawals/:id/reject
   * Admin rejects withdrawal
   */
  async adminRejectWithdrawal(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const admin_id = req.user?.userId || req.user?.id;

      if (!admin_id) {
        return res.status(401).json({
          success: false,
          message: 'Admin authentication required'
        });
      }

      if (!reason || reason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Alasan penolakan harus diisi'
        });
      }

      const result = await this.adminRejectWithdrawalUseCase.execute({
        withdrawal_id: id,
        admin_id,
        reason
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('[ADMIN] Reject withdrawal error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = PaymentController;
