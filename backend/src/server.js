const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const config = require('./config/env');
const db = require('./db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// High-performance gzip/deflate compression
app.use(compression());

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'x-guest-email']
}));
app.use(express.json({ limit: '2mb' }));

// Fast Response Time Monitor
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    if (durationMs > 200) {
      console.warn(`⚡ [SLOW API] ${req.method} ${req.path} - ${durationMs.toFixed(1)}ms`);
    }
  });
  next();
});

// Health check endpoint with zero overhead
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    brand: 'Six Wings',
    version: '1.0.0',
    mode: config.DEMO_MODE ? 'TEST / SIMULATION MODE' : 'PRODUCTION',
    demo_upi_id: config.DEMO_UPI_ID,
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// High-speed static asset serving with browser cache headers
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const fs = require('fs');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, {
    maxAge: '1d',
    etag: true,
    immutable: false
  }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Centralized Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`
===========================================================
  SIX WINGS — HIGH PERFORMANCE FASHION E-COMMERCE
  Server running on http://localhost:${PORT}
  Compression: ENABLED (gzip)
  Storage Engine: High-Speed In-Memory + Async Batched Persistence
  Simulation Mode: ${config.DEMO_MODE ? 'ENABLED (TEST TRANSACTIONS ONLY)' : 'DISABLED'}
-----------------------------------------------------------
  DEMO CREDENTIALS FOR TESTING:
  - Admin:    ${config.ADMIN_EMAIL}  /  ${config.ADMIN_PASSWORD}
  - Customer: alex@example.com       /  Customer@123
===========================================================
  `);
});

module.exports = app;
