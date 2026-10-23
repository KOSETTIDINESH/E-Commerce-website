const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'sixwings_super_secret_jwt_key_2026_fashion',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@sixwings.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@SixWings2026',
  DEMO_MODE: process.env.DEMO_MODE !== 'false',
  DEMO_UPI_ID: process.env.DEMO_UPI_ID || 'sixwings.demo@upi',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000'
};
