const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Create / place order
router.post('/', orderController.createOrder);

// Customer order history
router.get('/my-orders', orderController.getCustomerOrders);

// Track or get single order (with customer isolation check)
router.get('/:id', orderController.getOrderById);

module.exports = router;
