'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('layanan', 'sub_kategori_id', {
      type: Sequelize.UUID,
      allowNull: true, // Boleh null jika kategori tidak punya sub
      references: {
        model: 'sub_kategori',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'kategori_id' // Posisi kolom setelah kategori_id
    });

    await queryInterface.addIndex('layanan', ['sub_kategori_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('layanan', 'sub_kategori_id');
  }
};