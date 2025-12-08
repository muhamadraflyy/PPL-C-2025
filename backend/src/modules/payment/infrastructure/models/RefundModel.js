/**
 * Refund Sequelize Model
 * Maps to 'refund' table
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/database/connection');

const RefundModel = sequelize.define('refund', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  pembayaran_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'pembayaran',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  alasan: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  jumlah: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'jumlah_refund' // Maps to jumlah_refund column in DB
  },
  status: {
    type: DataTypes.ENUM('pending', 'disetujui', 'ditolak', 'processing', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  diajukan_pada: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'created_at' // Maps to created_at
  },
  disetujui_pada: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'diproses_pada' // Maps to diproses_pada
  },
  selesai_pada: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'selesai_pada' // Maps to selesai_pada
  },
  escrow_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'escrow',
      key: 'id'
    }
  },
  transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'refund',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['pembayaran_id'] },
    { fields: ['user_id'] },
    { fields: ['status'] }
  ]
});

module.exports = RefundModel;
