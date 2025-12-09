'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('pencairan_dana', 'bank_name', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Nama bank untuk transfer (BCA, BRI, Mandiri, dll)',
      after: 'metode_pencairan'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('pencairan_dana', 'bank_name');
  }
};
