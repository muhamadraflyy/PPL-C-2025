/**
 * Platform Config Routes
 * Routes for platform configuration management
 */

const express = require('express');
const router = express.Router();
const PlatformConfigController = require('../controllers/PlatformConfigController');
const authMiddleware = require('../../../../shared/middleware/authMiddleware');
const adminMiddleware = require('../../../../shared/middleware/adminMiddleware');

// Public endpoint - Get payment fees
router.get('/fees', PlatformConfigController.getPaymentFees);

// Admin only routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Get all configurations
router.get('/', PlatformConfigController.getAllConfigs);

// Get configurations by category
router.get('/category/:category', PlatformConfigController.getConfigsByCategory);

// Get single configuration
router.get('/:key', PlatformConfigController.getConfig);

// Update configuration
router.put('/:key', PlatformConfigController.updateConfig);

module.exports = router;
