/**
 * Platform Config Sequelize Model
 * Maps to 'platform_config' table
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/database/connection');

const PlatformConfigModel = sequelize.define('platform_config', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  config_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  config_value: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'general',
    allowNull: false
  },
  data_type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    defaultValue: 'string',
    allowNull: false
  },
  is_editable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'platform_config',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

/**
 * Helper method to get config value by key
 * @param {string} key - Config key
 * @returns {Promise<any>} - Config value (parsed according to data_type)
 */
PlatformConfigModel.getConfigValue = async function(key) {
  const config = await this.findOne({ where: { config_key: key } });

  if (!config) {
    throw new Error(`Config key '${key}' not found`);
  }

  const value = config.config_value;

  // Parse value based on data_type
  switch (config.data_type) {
    case 'number':
      return parseFloat(value);
    case 'boolean':
      return value === 'true' || value === '1';
    case 'json':
      return JSON.parse(value);
    default:
      return value;
  }
};

/**
 * Helper method to set config value by key
 * @param {string} key - Config key
 * @param {any} value - Config value
 * @returns {Promise<boolean>} - Success status
 */
PlatformConfigModel.setConfigValue = async function(key, value) {
  const config = await this.findOne({ where: { config_key: key } });

  if (!config) {
    throw new Error(`Config key '${key}' not found`);
  }

  if (!config.is_editable) {
    throw new Error(`Config key '${key}' is not editable`);
  }

  // Convert value to string for storage
  let stringValue;
  if (config.data_type === 'json') {
    stringValue = JSON.stringify(value);
  } else {
    stringValue = String(value);
  }

  await config.update({ config_value: stringValue });
  return true;
};

module.exports = PlatformConfigModel;
