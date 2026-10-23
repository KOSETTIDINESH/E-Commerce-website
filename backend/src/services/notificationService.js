const { v4: uuidv4 } = require('uuid');

/**
 * Notification Service Abstraction
 * Handles dispatching notifications across multiple channels:
 * - In-App Notification Store (persisted to database)
 * - Development Console Logger
 * - Future pluggable adapters (Email / SMS / WhatsApp)
 */
class NotificationService {
  constructor(db) {
    this.db = db;
    this.adapters = {
      // Future pluggable channels:
      email: null,
      sms: null,
      whatsapp: null
    };
  }

  /**
   * Send notification to user or admin
   * @param {Object} payload
   * @param {string} payload.userId - User ID or 'admin' or 'all'
   * @param {string} payload.type - Type of event
   * @param {string} payload.title - Short title
   * @param {string} payload.message - Notification body
   * @param {string} [payload.orderId] - Optional associated order ID
   * @param {Object} [payload.metadata] - Extra metadata (e.g. txnRef, amount)
   */
  async notify({ userId, type, title, message, orderId = null, metadata = {} }) {
    // 1. Persist in-app notification in database
    const notification = this.db.notifications.insert({
      id: `notif-${uuidv4().substring(0, 8)}`,
      user_id: userId,
      order_id: orderId,
      type,
      title,
      message,
      metadata,
      is_read: false,
      created_at: new Date().toISOString()
    });

    // 2. Dev console logging with clear demo tag
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n🔔 [IN-APP NOTIFICATION | ${timestamp}]`);
    console.log(`   To: ${userId} | Type: ${type}`);
    console.log(`   Title: ${title}`);
    console.log(`   Message: ${message}`);
    if (orderId) console.log(`   Order ID: ${orderId}`);
    if (metadata && Object.keys(metadata).length > 0) {
      console.log(`   Metadata:`, JSON.stringify(metadata));
    }
    console.log(`   Note: This is a demo in-app notification (No actual SMS/Email sent).\n`);

    // 3. Extensible hooks for future real channels
    if (this.adapters.email) {
      // Would call email adapter here if configured
    }
    if (this.adapters.sms) {
      // Would call SMS adapter here if configured
    }
    if (this.adapters.whatsapp) {
      // Would call WhatsApp adapter here if configured
    }

    return notification;
  }

  // Pre-configured notification triggers
  async notifyOrderPlaced(order) {
    // Notify customer
    await this.notify({
      userId: order.user_id,
      type: 'order_placed',
      title: 'Order Placed Successfully',
      message: `Your order #${order.id} for ₹${order.total_amount} has been placed. Please complete your payment simulation.`,
      orderId: order.id,
      metadata: { totalAmount: order.total_amount, status: order.order_status }
    });

    // Notify admin
    await this.notify({
      userId: 'admin',
      type: 'order_placed',
      title: 'New Order Received',
      message: `New order #${order.id} placed by ${order.customer_name} for ₹${order.total_amount}.`,
      orderId: order.id,
      metadata: { customerEmail: order.customer_email, totalAmount: order.total_amount }
    });
  }

  async notifyPaymentSuccess(order, paymentAttempt) {
    await this.notify({
      userId: order.user_id,
      type: 'payment_success',
      title: 'Demo Payment Succeeded',
      message: `Your simulated payment of ₹${paymentAttempt.amount} for Order #${order.id} was successful! Ref: ${paymentAttempt.transaction_reference}.`,
      orderId: order.id,
      metadata: { txnRef: paymentAttempt.transaction_reference, amount: paymentAttempt.amount }
    });

    await this.notify({
      userId: 'admin',
      type: 'payment_success',
      title: 'Demo Payment Received',
      message: `Demo payment verified for Order #${order.id}. Ref: ${paymentAttempt.transaction_reference}.`,
      orderId: order.id,
      metadata: { txnRef: paymentAttempt.transaction_reference, amount: paymentAttempt.amount }
    });
  }

  async notifyPaymentFailed(order, reason) {
    await this.notify({
      userId: order.user_id,
      type: 'payment_failed',
      title: 'Demo Payment Failed',
      message: `Simulated payment for Order #${order.id} was not completed: ${reason || 'User triggered failure'}. You can retry anytime.`,
      orderId: order.id,
      metadata: { reason }
    });
  }

  async notifyPaymentCancelled(order) {
    await this.notify({
      userId: order.user_id,
      type: 'payment_cancelled',
      title: 'Demo Payment Cancelled',
      message: `Simulated payment for Order #${order.id} was cancelled. Your order remains unpaid.`,
      orderId: order.id
    });
  }

  async notifyOrderStatusUpdated(order, oldStatus, newStatus) {
    await this.notify({
      userId: order.user_id,
      type: 'status_updated',
      title: `Order Status: ${newStatus}`,
      message: `Your order #${order.id} status changed from ${oldStatus} to ${newStatus}.`,
      orderId: order.id,
      metadata: { oldStatus, newStatus }
    });
  }

  async notifyPaymentVerified(order, adminEmail) {
    await this.notify({
      userId: order.user_id,
      type: 'order_verified',
      title: 'Order Payment Verified by Admin',
      message: `Six Wings Admin (${adminEmail}) has officially verified your demo payment for Order #${order.id}.`,
      orderId: order.id
    });
  }
}

module.exports = NotificationService;
