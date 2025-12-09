'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add jumlah_favorit column
    await queryInterface.addColumn('layanan', 'jumlah_favorit', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total number of favorites (global count across all users)',
      after: 'total_pesanan'
    });

    // Add index for better performance
    await queryInterface.addIndex('layanan', ['jumlah_favorit'], {
      name: 'idx_jumlah_favorit'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index
    await queryInterface.removeIndex('layanan', 'idx_jumlah_favorit');

    // Remove column
    await queryInterface.removeColumn('layanan', 'jumlah_favorit');
  }
};
