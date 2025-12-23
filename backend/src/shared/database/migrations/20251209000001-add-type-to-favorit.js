'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add type column
    await queryInterface.addColumn('favorit', 'type', {
      type: Sequelize.ENUM('favorite', 'bookmark'),
      allowNull: false,
      defaultValue: 'favorite',
      comment: 'Type: favorite (public like) or bookmark (private save)',
      after: 'layanan_id'
    });

    // Drop old unique constraint
    await queryInterface.removeConstraint('favorit', 'unique_user_layanan');

    // Add new unique constraint with type
    await queryInterface.addConstraint('favorit', {
      fields: ['user_id', 'layanan_id', 'type'],
      type: 'unique',
      name: 'unique_user_layanan_type'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop new constraint
    await queryInterface.removeConstraint('favorit', 'unique_user_layanan_type');

    // Add back old constraint
    await queryInterface.addConstraint('favorit', {
      fields: ['user_id', 'layanan_id'],
      type: 'unique',
      name: 'unique_user_layanan'
    });

    // Remove type column
    await queryInterface.removeColumn('favorit', 'type');
  }
};
