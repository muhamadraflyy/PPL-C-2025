'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add user1_unread_count column
    await queryInterface.addColumn('percakapan', 'user1_unread_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Jumlah pesan belum dibaca untuk user1',
      after: 'pesan_terakhir_pada'
    });

    // Add user2_unread_count column
    await queryInterface.addColumn('percakapan', 'user2_unread_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Jumlah pesan belum dibaca untuk user2',
      after: 'user1_unread_count'
    });

    console.log('✅ Added unread count columns to percakapan table');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('percakapan', 'user1_unread_count');
    await queryInterface.removeColumn('percakapan', 'user2_unread_count');
  }
};
