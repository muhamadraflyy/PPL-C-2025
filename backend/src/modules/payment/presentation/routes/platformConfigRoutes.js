/**
 * Platform Config Routes
 * Routes for platform configuration management
 */

const express = require('express');
const router = express.Router();
const PlatformConfigController = require('../controllers/PlatformConfigController');
const { authenticate } = require('../../../auth/middleware/authMiddleware');
const { authorize } = require('../../../auth/middleware/roleMiddleware');

// Public endpoint - Get payment fees
router.get('/fees', PlatformConfigController.getPaymentFees);

// Admin only routes
router.use(authenticate);
router.use(authorize('admin'));

// Get all configurations
router.get('/', PlatformConfigController.getAllConfigs);

// Get configurations by category
router.get('/category/:category', PlatformConfigController.getConfigsByCategory);

// Get single configuration
router.get('/:key', PlatformConfigController.getConfig);

// Update configuration
router.put('/:key', PlatformConfigController.updateConfig);

module.exports = router;
