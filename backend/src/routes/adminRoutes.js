const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Strict Admin-only middleware
router.use(authenticate, requireAdmin);

// Dashboard metrics
router.get('/stats', adminController.getDashboardStats);

// Orders management
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// Payment verification dashboard
router.get('/payments', adminController.getPaymentVerificationList);
router.post('/payments/:orderId/verify', adminController.verifyPaymentRecord);

// Admin audit log
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
