const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Initialize demo payment session
router.post('/initiate', paymentController.initiateSimulatedPayment);

// Execute simulated action: success / failed / cancelled
router.post('/simulate', paymentController.simulatePaymentAction);

// Get payment attempts for an order
router.get('/attempts/:orderId', paymentController.getPaymentAttempts);

module.exports = router;
