const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../db');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = db.users.findById(decoded.id);
    if (!user) {
      req.user = null;
      return next();
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };
    next();
  } catch (err) {
    req.user = null;
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.'
    });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.'
    });
  }
  next();
}

function requireOrderOwnerOrAdmin(req, res, next) {
  const orderId = req.params.id || req.params.orderId || req.body.orderId;
  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID is required.' });
  }

  const order = db.orders.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  // If order was placed anonymously by guest, check customer email or allow tracking with order ID
  // But if order is linked to a user account, strictly enforce ownership!
  if (req.user) {
    if (req.user.role === 'admin' || order.user_id === req.user.id || order.customer_email.toLowerCase() === req.user.email.toLowerCase()) {
      req.order = order;
      return next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to view or manage this order.'
      });
    }
  }

  // If unauthenticated guest request, allow only if customer email matches query param or tracking header
  const guestEmail = req.query.email || req.headers['x-guest-email'];
  if (guestEmail && guestEmail.toLowerCase() === order.customer_email.toLowerCase()) {
    req.order = order;
    return next();
  }

  // Otherwise return 401/403
  return res.status(401).json({
    success: false,
    message: 'Authentication required or invalid customer credentials for this order.'
  });
}

module.exports = {
  authenticate,
  requireAuth,
  requireAdmin,
  requireOrderOwnerOrAdmin
};
