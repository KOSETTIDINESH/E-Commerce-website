const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const db = require('../db');
const NotificationService = require('../services/notificationService');

const notificationService = new NotificationService(db);

function generateDemoTxnRef() {
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DEMO-TXN-${stamp}-${rand}`;
}

exports.initiateSimulatedPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    const order = db.orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Check if already paid
    if (order.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order is already marked as paid. Duplicate payment is not allowed.',
        order
      });
    }

    const idempotencyKey = `idem-${uuidv4()}`;

    // Record initiated attempt
    const attempt = db.payment_attempts.insert({
      id: `pay-${uuidv4().substring(0, 8)}`,
      order_id: order.id,
      payment_method: order.payment_method || 'upi_simulator',
      amount: order.total_amount,
      status: 'initiated',
      is_simulated: true, // DEMO MODE
      transaction_reference: null,
      demo_upi_id: config.DEMO_UPI_ID,
      idempotency_key: idempotencyKey,
      attempt_timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'Simulated payment session initialized.',
      demo_payment_details: {
        order_id: order.id,
        amount: order.total_amount,
        demo_upi_id: config.DEMO_UPI_ID,
        customer_name: order.customer_name,
        currency: 'INR',
        currency_symbol: '₹',
        disclaimer: 'DEMO PAYMENT — NO REAL MONEY TRANSFERRED',
        idempotency_key: idempotencyKey,
        attempt_id: attempt.id
      }
    });
  } catch (err) {
    console.error('Initiate payment error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.simulatePaymentAction = async (req, res) => {
  try {
    const { orderId, action, failureReason, idempotencyKey } = req.body;

    if (!orderId || !action) {
      return res.status(400).json({
        success: false,
        message: 'orderId and action ("success" | "failed" | "cancelled") are required.'
      });
    }

    const order = db.orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // 1. Prevent duplicate confirmation
    if (order.payment_status === 'paid') {
      return res.status(409).json({
        success: false,
        message: 'Duplicate payment prevented: This order has already been successfully paid and recorded.',
        order,
        demo_transaction_ref: order.demo_transaction_ref
      });
    }

    const now = new Date().toISOString();

    if (action === 'success') {
      const txnRef = generateDemoTxnRef();

      // Record successful simulated payment
      const paymentRecord = db.payment_attempts.insert({
        id: `pay-${uuidv4().substring(0, 8)}`,
        order_id: order.id,
        payment_method: order.payment_method || 'upi_simulator',
        amount: order.total_amount,
        status: 'success',
        is_simulated: true,
        transaction_reference: txnRef,
        demo_upi_id: config.DEMO_UPI_ID,
        idempotency_key: idempotencyKey || `idem-${uuidv4().substring(0, 8)}`,
        attempt_timestamp: now
      });

      // Update order state
      const updatedStatusHistory = [
        ...(order.status_history || []),
        {
          status: 'Confirmed',
          timestamp: now,
          note: `Demo payment confirmed via UPI Simulator. Reference: ${txnRef}`
        }
      ];

      const updatedOrder = db.orders.update(order.id, {
        payment_status: 'paid',
        order_status: 'Confirmed',
        demo_transaction_ref: txnRef,
        is_simulated: true,
        status_history: updatedStatusHistory
      });

      // Trigger notification
      await notificationService.notifyPaymentSuccess(updatedOrder, paymentRecord);

      return res.json({
        success: true,
        action: 'success',
        message: 'Simulated payment completed successfully.',
        disclaimer: 'DEMO PAYMENT — NO REAL MONEY TRANSFERRED',
        demo_transaction_ref: txnRef,
        order: updatedOrder
      });
    } else if (action === 'failed') {
      const reason = failureReason || 'Simulated transaction declined by user request.';

      db.payment_attempts.insert({
        id: `pay-${uuidv4().substring(0, 8)}`,
        order_id: order.id,
        payment_method: order.payment_method || 'upi_simulator',
        amount: order.total_amount,
        status: 'failed',
        is_simulated: true,
        failure_reason: reason,
        transaction_reference: null,
        demo_upi_id: config.DEMO_UPI_ID,
        idempotency_key: idempotencyKey || `idem-${uuidv4().substring(0, 8)}`,
        attempt_timestamp: now
      });

      const updatedStatusHistory = [
        ...(order.status_history || []),
        {
          status: 'Pending',
          timestamp: now,
          note: `Demo payment failed: ${reason}. Order kept unpaid for retry.`
        }
      ];

      const updatedOrder = db.orders.update(order.id, {
        payment_status: 'failed',
        status_history: updatedStatusHistory
      });

      await notificationService.notifyPaymentFailed(updatedOrder, reason);

      return res.json({
        success: false,
        action: 'failed',
        message: 'Simulated payment failed as requested. Order remains unpaid.',
        disclaimer: 'DEMO PAYMENT — NO REAL MONEY TRANSFERRED',
        order: updatedOrder,
        canRetry: true
      });
    } else if (action === 'cancelled') {
      db.payment_attempts.insert({
        id: `pay-${uuidv4().substring(0, 8)}`,
        order_id: order.id,
        payment_method: order.payment_method || 'upi_simulator',
        amount: order.total_amount,
        status: 'cancelled',
        is_simulated: true,
        failure_reason: 'User cancelled simulated payment flow.',
        transaction_reference: null,
        demo_upi_id: config.DEMO_UPI_ID,
        attempt_timestamp: now
      });

      const updatedStatusHistory = [
        ...(order.status_history || []),
        {
          status: 'Pending',
          timestamp: now,
          note: 'Demo payment cancelled by customer. Order kept unpaid for retry.'
        }
      ];

      const updatedOrder = db.orders.update(order.id, {
        payment_status: 'cancelled',
        status_history: updatedStatusHistory
      });

      await notificationService.notifyPaymentCancelled(updatedOrder);

      return res.json({
        success: false,
        action: 'cancelled',
        message: 'Simulated payment was cancelled. Order remains unpaid.',
        disclaimer: 'DEMO PAYMENT — NO REAL MONEY TRANSFERRED',
        order: updatedOrder,
        canRetry: true
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Unknown payment simulation action: "${action}". Must be "success", "failed", or "cancelled".`
      });
    }
  } catch (err) {
    console.error('Payment simulation error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getPaymentAttempts = async (req, res) => {
  try {
    const { orderId } = req.params;
    const attempts = db.payment_attempts.find(pa => pa.order_id === orderId);

    return res.json({
      success: true,
      count: attempts.length,
      attempts
    });
  } catch (err) {
    console.error('Get payment attempts error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
