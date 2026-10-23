const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const NotificationService = require('../services/notificationService');

const notificationService = new NotificationService(db);

exports.getDashboardStats = async (req, res) => {
  try {
    const orders = db.orders.find();
    const products = db.products.find();
    const users = db.users.find();
    const paymentAttempts = db.payment_attempts.find();

    const totalOrders = orders.length;

    // Strict separation of simulated vs real sales
    let simulatedSales = 0;
    let realSales = 0;
    let paidOrdersCount = 0;
    let pendingVerificationsCount = 0;

    for (const order of orders) {
      if (order.payment_status === 'paid') {
        paidOrdersCount++;
        if (order.is_simulated) {
          simulatedSales += (Number(order.total_amount) || 0);
        } else {
          realSales += (Number(order.total_amount) || 0);
        }
      }
      if (order.payment_status === 'paid' && !order.payment_verified) {
        pendingVerificationsCount++;
      }
    }

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);

    const recentTransactions = [...paymentAttempts]
      .filter(pa => pa.status === 'success')
      .sort((a, b) => new Date(b.attempt_timestamp) - new Date(a.attempt_timestamp))
      .slice(0, 8);

    return res.json({
      success: true,
      stats: {
        total_orders: totalOrders,
        paid_orders_count: paidOrdersCount,
        pending_verifications_count: pendingVerificationsCount,
        simulated_sales_amount: simulatedSales,
        real_sales_amount: realSales,
        total_revenue_note: 'All current sales are DEMO / SIMULATED test orders (no real currency transferred)',
        total_products: products.length,
        total_customers: users.filter(u => u.role === 'customer').length,
        recent_orders: recentOrders,
        recent_transactions: recentTransactions
      }
    });
  } catch (err) {
    console.error('Get stats error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, search, isSimulated } = req.query;
    let orders = db.orders.find();

    if (status && status !== 'all') {
      orders = orders.filter(o => o.order_status.toLowerCase() === status.toLowerCase());
    }

    if (paymentStatus && paymentStatus !== 'all') {
      orders = orders.filter(o => o.payment_status.toLowerCase() === paymentStatus.toLowerCase());
    }

    if (isSimulated !== undefined && isSimulated !== 'all') {
      const isSim = isSimulated === 'true';
      orders = orders.filter(o => Boolean(o.is_simulated) === isSim);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      orders = orders.filter(o => 
        o.id.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        (o.demo_transaction_ref && o.demo_transaction_ref.toLowerCase().includes(q))
      );
    }

    // Attach items
    const enriched = orders.map(order => {
      const items = db.order_items.find(oi => oi.order_id === order.id);
      return {
        ...order,
        items_count: items.reduce((s, i) => s + (i.quantity || 1), 0),
        items
      };
    });

    enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      success: true,
      count: enriched.length,
      orders: enriched
    });
  } catch (err) {
    console.error('Get all orders error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, note } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed: ${validStatuses.join(', ')}`
      });
    }

    const order = db.orders.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const oldStatus = order.order_status;
    const now = new Date().toISOString();

    const updatedStatusHistory = [
      ...(order.status_history || []),
      {
        status: order_status,
        timestamp: now,
        note: note || `Status updated from ${oldStatus} to ${order_status} by admin (${req.user.email})`
      }
    ];

    const updated = db.orders.update(id, {
      order_status,
      status_history: updatedStatusHistory
    });

    // Record admin audit log
    db.admin_audit_logs.insert({
      id: `log-${uuidv4().substring(0, 8)}`,
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'UPDATE_ORDER_STATUS',
      entity_type: 'order',
      entity_id: id,
      details: { oldStatus, newStatus: order_status, note },
      ip_address: req.ip || '127.0.0.1'
    });

    // Notify customer
    await notificationService.notifyOrderStatusUpdated(updated, oldStatus, order_status);

    return res.json({
      success: true,
      message: `Order status updated to ${order_status}.`,
      order: updated
    });
  } catch (err) {
    console.error('Update order status error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getPaymentVerificationList = async (req, res) => {
  try {
    const { search, paymentStatus, verifiedStatus } = req.query;

    let orders = db.orders.find();

    if (paymentStatus && paymentStatus !== 'all') {
      orders = orders.filter(o => o.payment_status.toLowerCase() === paymentStatus.toLowerCase());
    }

    if (verifiedStatus === 'verified') {
      orders = orders.filter(o => o.payment_verified === true);
    } else if (verifiedStatus === 'unverified') {
      orders = orders.filter(o => !o.payment_verified);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      orders = orders.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        (o.demo_transaction_ref && o.demo_transaction_ref.toLowerCase().includes(q))
      );
    }

    // Map to required fields:
    // Order ID, Customer name, Order amount, Payment method, Payment status, Demo transaction reference, Payment date & time, Order status, Verification status
    const paymentRecords = orders.map(order => {
      const successfulAttempt = db.payment_attempts.findOne(
        pa => pa.order_id === order.id && pa.status === 'success'
      );

      return {
        order_id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        order_amount: order.total_amount,
        payment_method: order.payment_method || 'upi_simulator',
        payment_status: order.payment_status,
        demo_transaction_reference: order.demo_transaction_ref || (successfulAttempt ? successfulAttempt.transaction_reference : null) || 'N/A',
        payment_date_time: successfulAttempt ? successfulAttempt.attempt_timestamp : order.created_at,
        order_status: order.order_status,
        payment_verified: Boolean(order.payment_verified),
        payment_verified_at: order.payment_verified_at,
        payment_verified_by: order.payment_verified_by,
        is_simulated: Boolean(order.is_simulated)
      };
    });

    paymentRecords.sort((a, b) => new Date(b.payment_date_time) - new Date(a.payment_date_time));

    return res.json({
      success: true,
      count: paymentRecords.length,
      records: paymentRecords
    });
  } catch (err) {
    console.error('Get payment verification list error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.verifyPaymentRecord = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = db.orders.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot verify an unpaid order. Payment simulation must succeed first.'
      });
    }

    const now = new Date().toISOString();
    const updated = db.orders.update(order.id, {
      payment_verified: true,
      payment_verified_at: now,
      payment_verified_by: req.user.email
    });

    // Record to admin audit log
    db.admin_audit_logs.insert({
      id: `log-${uuidv4().substring(0, 8)}`,
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'VERIFY_PAYMENT',
      entity_type: 'order',
      entity_id: order.id,
      details: {
        amount: order.total_amount,
        demo_transaction_ref: order.demo_transaction_ref,
        verified_by: req.user.email
      },
      ip_address: req.ip || '127.0.0.1'
    });

    // Notify customer
    await notificationService.notifyPaymentVerified(updated, req.user.email);

    return res.json({
      success: true,
      message: `Demo transaction ${order.demo_transaction_ref || order.id} has been marked as verified for testing.`,
      order: updated
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = db.admin_audit_logs.find();
    logs.sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp));

    return res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
