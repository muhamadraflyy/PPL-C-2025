'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pesanan_status_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Primary key UUID'
      },
      pesanan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'pesanan',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Relasi ke pesanan.id'
      },
      from_status: {
        type: Sequelize.ENUM(
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
        comment: 'Status sebelum perubahan (null saat order pertama kali dibuat)'
      },
      to_status: {
        type: Sequelize.ENUM(
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
        comment: 'Status sesudah perubahan'
      },
      changed_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User yang melakukan perubahan status (bisa client / freelancer / admin)' 
      },
      changed_by_role: {
        type: Sequelize.ENUM('client', 'freelancer', 'admin', 'system'),
        allowNull: false,
        defaultValue: 'system',
        comment: 'Peran yang mengubah status untuk pesanan ini'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Alasan perubahan status (jika ada)'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Payload tambahan (misal: source, requestId, dsb)'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('pesanan_status_history', ['pesanan_id']);
    await queryInterface.addIndex('pesanan_status_history', ['created_at']);
    await queryInterface.addIndex('pesanan_status_history', ['to_status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pesanan_status_history');
  }
};
