/**
 * Notification Model
 * Model untuk tabel 'notifikasi'
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/database/connection');

const NotificationModel = sequelize.define('notifikasi', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  tipe: {
    type: DataTypes.ENUM(
      'pesanan_baru',
      'pesanan_diterima',
      'pesanan_ditolak',
      'pesanan_selesai',
      'pembayaran_berhasil',
      'pesan_baru',
      'ulasan_baru'
    ),
    allowNull: false
  },
  judul: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  pesan: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  related_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID relasi (pesanan_id, pembayaran_id, pesan_id, ulasan_id)'
  },
  related_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tipe relasi (pesanan, pembayaran, pesan, ulasan)'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  dibaca_pada: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dikirim_via_email: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'notifikasi',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // No updated_at in migration
  underscored: true
});

module.exports = NotificationModel;
