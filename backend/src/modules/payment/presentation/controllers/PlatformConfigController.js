/**
 * Platform Config Controller
 * Handle platform configuration management
 */

const PlatformConfigModel = require('../../infrastructure/models/PlatformConfigModel');

class PlatformConfigController {
  /**
   * Get all platform configurations
   * GET /api/admin/platform-config
   */
  async getAllConfigs(req, res, next) {
    try {
      const configs = await PlatformConfigModel.findAll({
        order: [['category', 'ASC'], ['config_key', 'ASC']]
      });

      res.json({
        success: true,
        data: configs
      });
    } catch (error) {
      console.error('[PlatformConfigController] getAllConfigs error:', error);
      next(error);
    }
  }

  /**
   * Get configuration by category
   * GET /api/admin/platform-config/category/:category
   */
  async getConfigsByCategory(req, res, next) {
    try {
      const { category } = req.params;

      const configs = await PlatformConfigModel.findAll({
        where: { category },
        order: [['config_key', 'ASC']]
      });

      res.json({
        success: true,
        data: configs
      });
    } catch (error) {
      console.error('[PlatformConfigController] getConfigsByCategory error:', error);
      next(error);
    }
  }

  /**
   * Get single config value
   * GET /api/admin/platform-config/:key
   */
  async getConfig(req, res, next) {
    try {
      const { key } = req.params;

      const value = await PlatformConfigModel.getConfigValue(key);

      res.json({
        success: true,
        key,
        value
      });
    } catch (error) {
      console.error('[PlatformConfigController] getConfig error:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Update configuration value
   * PUT /api/admin/platform-config/:key
   * Body: { value: any }
   */
  async updateConfig(req, res, next) {
    try {
      const { key } = req.params;
      const { value } = req.body;

      if (value === undefined || value === null) {
        return res.status(400).json({
          success: false,
          message: 'Value is required'
        });
      }

      // Check if config exists
      const config = await PlatformConfigModel.findOne({
        where: { config_key: key }
      });

      if (!config) {
        return res.status(404).json({
          success: false,
          message: `Config key '${key}' not found`
        });
      }

      if (!config.is_editable) {
        return res.status(403).json({
          success: false,
          message: `Config key '${key}' is locked and cannot be edited`
        });
      }

      // Validate value based on data type
      if (config.data_type === 'number' && isNaN(parseFloat(value))) {
        return res.status(400).json({
          success: false,
          message: 'Value must be a valid number'
        });
      }

      if (config.data_type === 'boolean' && typeof value !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Value must be a boolean'
        });
      }

      // Update config
      await PlatformConfigModel.setConfigValue(key, value);

      // Get updated value
      const updatedValue = await PlatformConfigModel.getConfigValue(key);

      res.json({
        success: true,
        message: 'Configuration updated successfully',
        key,
        value: updatedValue
      });
    } catch (error) {
      console.error('[PlatformConfigController] updateConfig error:', error);
      next(error);
    }
  }

  /**
   * Get payment fee configurations (public endpoint)
   * GET /api/platform-config/fees
   */
  async getPaymentFees(req, res, next) {
    try {
      const platformFee = await PlatformConfigModel.getConfigValue('platform_fee_percentage');
      const gatewayFee = await PlatformConfigModel.getConfigValue('payment_gateway_fee_percentage');

      res.json({
        success: true,
        data: {
          platform_fee_percentage: platformFee,
          payment_gateway_fee_percentage: gatewayFee
        }
      });
    } catch (error) {
      console.error('[PlatformConfigController] getPaymentFees error:', error);
      // Return defaults if config not found
      res.json({
        success: true,
        data: {
          platform_fee_percentage: 5.0,
          payment_gateway_fee_percentage: 2.5
        }
      });
    }
  }
}

module.exports = new PlatformConfigController();
