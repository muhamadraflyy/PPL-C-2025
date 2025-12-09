/**
 * Sequelize Order Repository Implementation
 *
 * Implementasi konkrit dari OrderRepository menggunakan Sequelize ORM.
 * Dokumentasi Sequelize: https://sequelize.org/docs/v6/
 */

const Order = require('../../domain/entities/Order');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

class SequelizeOrderRepository {
  constructor(sequelize) {
    this.sequelize = sequelize;
    // Pastikan model Pesanan terdaftar
    this.OrderModel = this.sequelize.models.pesanan || require('../models/OrderModel');
    // Model riwayat status pesanan
    this.OrderStatusHistoryModel =
      this.sequelize.models.pesanan_status_history || require('../models/OrderStatusHistoryModel');

    const { DataTypes } = require('sequelize');
    // Related models (lightweight definitions if not present)
    this.UserModel = this.sequelize.models.User || this.sequelize.define('User', {
      id: { type: DataTypes.UUID, primaryKey: true },
      nama_depan: DataTypes.STRING,
      nama_belakang: DataTypes.STRING,
      avatar: DataTypes.STRING
    }, { tableName: 'users', timestamps: false });

    this.LayananModel = this.sequelize.models.Layanan || this.sequelize.define('Layanan', {
      id: { type: DataTypes.UUID, primaryKey: true },
      judul: DataTypes.STRING,
      thumbnail: DataTypes.STRING,
      harga: DataTypes.DECIMAL(10, 2)
    }, { tableName: 'layanan', timestamps: false });

    // Associations (define once)
    if (!this.OrderModel.associations.client) {
      this.OrderModel.belongsTo(this.UserModel, { foreignKey: 'client_id', as: 'client' });
    }
    if (!this.OrderModel.associations.layanan) {
      this.OrderModel.belongsTo(this.LayananModel, { foreignKey: 'layanan_id', as: 'layanan' });
    }
  }

  async create(orderData) {
    const result = await this.OrderModel.create(orderData);
    return result.get({ plain: true });
  }

  async findById(id) {
    // Lazy-require Payment model and set association once
    const PaymentModel = this.sequelize.models.pembayaran || require('../../../payment/infrastructure/models/PaymentModel');
    const RefundModel = this.sequelize.models.refund || require('../../../payment/infrastructure/models/RefundModel');
    const EscrowModel = this.sequelize.models.escrow || require('../../../payment/infrastructure/models/EscrowModel');

    if (!this.OrderModel.associations.pembayaran) {
      this.OrderModel.hasMany(PaymentModel, { foreignKey: 'pesanan_id', as: 'pembayaran' });
    }
    if (!PaymentModel.associations.refund) {
      PaymentModel.hasMany(RefundModel, { foreignKey: 'pembayaran_id', as: 'refund' });
    }
    if (!this.OrderModel.associations.escrow) {
      this.OrderModel.hasMany(EscrowModel, { foreignKey: 'pesanan_id', as: 'escrow' });
    }

    const result = await this.OrderModel.findByPk(id, {
      attributes: [
        'id', 'nomor_pesanan', 'judul', 'deskripsi', 'catatan_client',
        'lampiran_client', 'lampiran_freelancer',
        'status', 'harga', 'biaya_platform', 'total_bayar', 'waktu_pengerjaan',
        'tenggat_waktu', 'dikirim_pada', 'selesai_pada',
        'client_id', 'freelancer_id', 'layanan_id', 'created_at', 'updated_at'
      ],
      include: [
        {
          model: this.UserModel,
          as: 'client',
          attributes: ['id', 'nama_depan', 'nama_belakang', 'avatar']
        },
        {
          model: this.LayananModel,
          as: 'layanan',
          attributes: ['id', 'judul', 'thumbnail', 'harga']
        },
        {
          model: PaymentModel,
          as: 'pembayaran',
          attributes: [
            'id', 'transaction_id', 'nomor_invoice', 'invoice_url',
            'metode_pembayaran', 'channel', 'payment_gateway',
            'jumlah', 'biaya_platform', 'total_bayar', 'status',
            'dibayar_pada', 'kadaluarsa_pada', 'created_at'
          ],
          include: [
            {
              model: RefundModel,
              as: 'refund',
              attributes: ['id', 'alasan', 'jumlah', 'status', 'created_at'],
              required: false
            }
          ]
        },
        {
          model: EscrowModel,
          as: 'escrow',
          attributes: ['id', 'pembayaran_id', 'status', 'jumlah_ditahan', 'biaya_platform', 'dirilis_pada', 'created_at'],
          required: false
        }
      ]
    });

    if (!result) return null;

    const plainResult = result.get({ plain: true });

    // Normalisasi lampiran client/freelancer: DB menyimpan array URL sederhana,
    // tapi API mengembalikan objek { url, name, size } agar FE bisa menampilkan nama & ukuran file.
    const mapUrlsToMeta = (value) => {
      if (!value) return [];

      const urls = Array.isArray(value) ? value : [value];

      return urls
        .map((url) => {
          if (!url || typeof url !== 'string') return null;

          let size = null;
          try {
            if (url.startsWith('/public/')) {
              const filePath = path.join(process.cwd(), url.replace(/^\/+/, ''));
              if (fs.existsSync(filePath)) {
                const stat = fs.statSync(filePath);
                size = typeof stat.size === 'number' ? stat.size : null;
              }
            }
          } catch (e) {
            // Abaikan error baca file; size tetap null
          }

          const name = url.split('/').pop() || 'lampiran';

          return { url, name, size };
        })
        .filter(Boolean);
    };

    plainResult.lampiran_client = mapUrlsToMeta(plainResult.lampiran_client);
    plainResult.lampiran_freelancer = mapUrlsToMeta(plainResult.lampiran_freelancer);

    // Add flat payment_id from the first successful payment
    if (plainResult.pembayaran && plainResult.pembayaran.length > 0) {
      const successfulPayment = plainResult.pembayaran.find(p => p.status === 'berhasil');
      if (successfulPayment) {
        plainResult.payment_id = successfulPayment.id;
        plainResult.pembayaran_id = successfulPayment.id;

        // Add refund status if exists
        if (successfulPayment.refund && successfulPayment.refund.length > 0) {
          const activeRefund = successfulPayment.refund.find(r => ['pending', 'processing'].includes(r.status));
          if (activeRefund) {
            plainResult.refund_status = activeRefund.status;
            plainResult.refund_reason = activeRefund.alasan;
            plainResult.refund_amount = activeRefund.jumlah;
            plainResult.refund_id = activeRefund.id;
          }
        }
      }
    }

    // Add flat escrow_id and escrow_status from the escrow
    if (plainResult.escrow && plainResult.escrow.length > 0) {
      // Get the most recent escrow (could be held or released)
      const activeEscrow = plainResult.escrow[plainResult.escrow.length - 1];
      if (activeEscrow) {
        plainResult.escrow_id = activeEscrow.id;
        plainResult.escrow_status = activeEscrow.status;
        plainResult.escrow_amount = activeEscrow.jumlah_ditahan;
        plainResult.escrow_released_at = activeEscrow.dirilis_pada;
      }
    }

    return plainResult;
  }

  async findByUserId(userId, filters = {}) {
    const page = Math.max(parseInt(filters.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(filters.limit || '10', 10), 1), 100);
    const offset = (page - 1) * limit;

    const where = { client_id: userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.created_from || filters.created_to) {
      where.created_at = {};
      if (filters.created_from) where.created_at[Op.gte] = new Date(filters.created_from);
      if (filters.created_to) where.created_at[Op.lte] = new Date(filters.created_to);
    }

    if (filters.q) {
      where[Op.or] = [
        { nomor_pesanan: { [Op.like]: `%${filters.q}%` } },
        { judul: { [Op.like]: `%${filters.q}%` } }
      ];
    }

    const allowedSort = new Set(['created_at', 'total_bayar', 'harga', 'status', 'tenggat_waktu']);
    const sortBy = allowedSort.has(filters.sortBy) ? filters.sortBy : 'created_at';
    const sortOrder = (filters.sortOrder || 'DESC').toString().toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Lazy-require freelancer User model and Payment model
    const FreelancerModel = this.sequelize.models.User || this.UserModel;
    if (!this.OrderModel.associations.freelancer) {
      this.OrderModel.belongsTo(FreelancerModel, { foreignKey: 'freelancer_id', as: 'freelancer' });
    }

    const PaymentModel = this.sequelize.models.pembayaran || require('../../../payment/infrastructure/models/PaymentModel');
    if (!this.OrderModel.associations.pembayaran) {
      this.OrderModel.hasMany(PaymentModel, { foreignKey: 'pesanan_id', as: 'pembayaran' });
    }

    const result = await this.OrderModel.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      attributes: [
        'id', 'nomor_pesanan', 'judul', 'status', 'total_bayar', 'harga',
        'waktu_pengerjaan', 'tenggat_waktu', 'created_at', 'updated_at',
        'client_id', 'freelancer_id', 'layanan_id'
      ],
      include: [
        {
          model: FreelancerModel,
          as: 'freelancer',
          attributes: ['id', 'nama_depan', 'nama_belakang', 'avatar']
        },
        {
          model: this.LayananModel,
          as: 'layanan',
          attributes: ['id', 'judul', 'thumbnail', 'harga']
        },
        {
          model: PaymentModel,
          as: 'pembayaran',
          attributes: ['id', 'status'],
          required: false
        }
      ]
    });

    // Add flat payment_id to each order
    const rows = result.rows.map(row => {
      const plain = row.get({ plain: true });
      if (plain.pembayaran && plain.pembayaran.length > 0) {
        const successfulPayment = plain.pembayaran.find(p => p.status === 'berhasil');
        if (successfulPayment) {
          plain.payment_id = successfulPayment.id;
          plain.pembayaran_id = successfulPayment.id;
        }
      }
      // Remove pembayaran array from list view to reduce payload
      delete plain.pembayaran;
      return plain;
    });

    return { count: result.count, rows };
  }

  async findByPenyediaId(penyediaId, filters = {}) {
    const { Op } = require('sequelize');

    const page = Math.max(parseInt(filters.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(filters.limit || '10', 10), 1), 100);
    const offset = (page - 1) * limit;

    const where = { freelancer_id: penyediaId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.created_from || filters.created_to) {
      where.created_at = {};
      if (filters.created_from) where.created_at[Op.gte] = new Date(filters.created_from);
      if (filters.created_to) where.created_at[Op.lte] = new Date(filters.created_to);
    }

    if (filters.q) {
      where[Op.or] = [
        { nomor_pesanan: { [Op.like]: `%${filters.q}%` } },
        { judul: { [Op.like]: `%${filters.q}%` } }
      ];
    }

    const allowedSort = new Set(['created_at', 'total_bayar', 'harga', 'status', 'tenggat_waktu']);
    const sortBy = allowedSort.has(filters.sortBy) ? filters.sortBy : 'created_at';
    const sortOrder = (filters.sortOrder || 'DESC').toString().toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Lazy-require Payment model
    const PaymentModel = this.sequelize.models.pembayaran || require('../../../payment/infrastructure/models/PaymentModel');
    if (!this.OrderModel.associations.pembayaran) {
      this.OrderModel.hasMany(PaymentModel, { foreignKey: 'pesanan_id', as: 'pembayaran' });
    }

    const result = await this.OrderModel.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      attributes: [
        'id', 'nomor_pesanan', 'judul', 'status', 'total_bayar', 'harga',
        'waktu_pengerjaan', 'tenggat_waktu', 'created_at', 'updated_at',
        'client_id', 'freelancer_id', 'layanan_id'
      ],
      include: [
        {
          model: this.UserModel,
          as: 'client',
          attributes: ['id', 'nama_depan', 'nama_belakang', 'avatar']
        },
        {
          model: this.LayananModel,
          as: 'layanan',
          attributes: ['id', 'judul', 'thumbnail', 'harga']
        },
        {
          model: PaymentModel,
          as: 'pembayaran',
          attributes: ['id', 'status'],
          required: false
        }
      ]
    });

    // Add flat payment_id to each order
    const rows = result.rows.map(row => {
      const plain = row.get({ plain: true });
      if (plain.pembayaran && plain.pembayaran.length > 0) {
        const successfulPayment = plain.pembayaran.find(p => p.status === 'berhasil');
        if (successfulPayment) {
          plain.payment_id = successfulPayment.id;
          plain.pembayaran_id = successfulPayment.id;
        }
      }
      // Remove pembayaran array from list view to reduce payload
      delete plain.pembayaran;
      return plain;
    });

    return { count: result.count, rows };
  }

  async findByServiceId(serviceId, filters = {}) {
    const where = { layanan_id: serviceId };

    if (filters.status) {
      where.status = filters.status;
    }

    const result = await this.OrderModel.findAll({
      where,
      attributes: [
        'id', 'nomor_pesanan', 'judul', 'status', 'total_bayar',
        'created_at', 'client_id', 'freelancer_id', 'layanan_id'
      ]
    });

    return result.map(r => r.get({ plain: true }));
  }

  async updateStatus(id, status) {
    await this.OrderModel.update(
      { status },
      { where: { id } }
    );

    return await this.findById(id);
  }

  async cancel(id, reason) {
    await this.OrderModel.update(
      {
        status: 'dibatalkan'
      },
      { where: { id } }
    );

    return await this.findById(id);
  }

  async update(id, orderData) {
    await this.OrderModel.update(orderData, { where: { id } });
    return await this.findById(id);
  }

  async addStatusHistory({
    pesanan_id,
    from_status = null,
    to_status,
    changed_by_user_id = null,
    changed_by_role = 'system',
    reason = null,
    metadata = null,
  }) {
    const record = await this.OrderStatusHistoryModel.create({
      pesanan_id,
      from_status,
      to_status,
      changed_by_user_id,
      changed_by_role,
      reason,
      metadata,
    });

    return record.get({ plain: true });
  }

  async getStatusHistory(orderId) {
    const rows = await this.OrderStatusHistoryModel.findAll({
      where: { pesanan_id: orderId },
      order: [['created_at', 'ASC']],
    });

    return rows.map((row) => row.get({ plain: true }));
  }
}

module.exports = SequelizeOrderRepository;
