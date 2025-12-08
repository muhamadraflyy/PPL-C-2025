const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/database/connection');

const OrderStatusHistoryModel = sequelize.define('pesanan_status_history', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  pesanan_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  from_status: {
    type: DataTypes.ENUM(
      'menunggu_pembayaran',
      'dibayar',
      'dikerjakan',
      'menunggu_review',
      'revisi',
      'selesai',
      'dispute',
      'dibatalkan',
      'refunded'
    ),
    allowNull: true,
  },
  to_status: {
    type: DataTypes.ENUM(
      'menunggu_pembayaran',
      'dibayar',
      'dikerjakan',
      'menunggu_review',
      'revisi',
      'selesai',
      'dispute',
      'dibatalkan',
      'refunded'
    ),
    allowNull: false,
  },
  changed_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  changed_by_role: {
    type: DataTypes.ENUM('client', 'freelancer', 'admin', 'system'),
    allowNull: false,
    defaultValue: 'system',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'pesanan_status_history',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['pesanan_id'] },
    { fields: ['to_status'] },
    { fields: ['created_at'] },
  ],
});

module.exports = OrderStatusHistoryModel;
