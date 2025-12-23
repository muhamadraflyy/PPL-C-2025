'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('platform_config', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      config_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      config_value: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      category: {
        type: Sequelize.STRING(50),
        defaultValue: 'general',
        allowNull: false
      },
      data_type: {
        type: Sequelize.ENUM('string', 'number', 'boolean', 'json'),
        defaultValue: 'string',
        allowNull: false
      },
      is_editable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
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

    // Add indexes
    await queryInterface.addIndex('platform_config', ['config_key'], {
      name: 'idx_config_key'
    });

    await queryInterface.addIndex('platform_config', ['category'], {
      name: 'idx_category'
    });

    // Insert default configuration values
    await queryInterface.bulkInsert('platform_config', [
      {
        config_key: 'platform_fee_percentage',
        config_value: '5.0',
        description: 'Persentase biaya operasional platform (%)',
        category: 'payment',
        data_type: 'number',
        is_editable: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        config_key: 'payment_gateway_fee_percentage',
        config_value: '2.5',
        description: 'Persentase biaya payment gateway (%) - LOCKED',
        category: 'payment',
        data_type: 'number',
        is_editable: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        config_key: 'platform_name',
        config_value: 'SkillConnect',
        description: 'Nama platform',
        category: 'general',
        data_type: 'string',
        is_editable: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        config_key: 'platform_email',
        config_value: 'admin@skillconnect.com',
        description: 'Email platform',
        category: 'general',
        data_type: 'string',
        is_editable: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('platform_config');
  }
};
