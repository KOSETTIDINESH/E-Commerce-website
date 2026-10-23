const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const NotificationService = require('../services/notificationService');

const notificationService = new NotificationService(db);

function generateOrderId() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `SW-${year}-${randomSuffix}`;
}

exports.createOrder = async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      city,
      state,
      pin_code,
      order_notes,
      payment_method = 'upi_simulator',
      items: clientItems
    } = req.body;

    // 1. Validate inputs
    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !city || !state || !pin_code) {
      return res.status(400).json({
        success: false,
        message: 'All delivery fields (name, email, phone, address, city, state, PIN code) are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address provided.' });
    }

    // Clean phone validation (at least 10 digits)
    const cleanPhone = customer_phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number.' });
    }

    // Clean PIN code validation (5 or 6 digits)
    const cleanPin = pin_code.replace(/[^0-9]/g, '');
    if (cleanPin.length < 5 || cleanPin.length > 6) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 6-digit postal PIN code.' });
    }

    // 2. Fetch items (from payload or fallback to cart)
    let orderItemsData = clientItems;
    if (!orderItemsData || orderItemsData.length === 0) {
      const userId = req.user ? req.user.id : null;
      const sessionId = req.headers['x-session-id'] || req.query.sessionId;
      const cart = userId ? db.carts.findOne(c => c.user_id === userId) : db.carts.findOne(c => c.session_id === sessionId);
      if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Your shopping cart is empty. Please add items to checkout.' });
      }
      orderItemsData = cart.items;
    }

    // 3. Server-side stock verification and authoritative price calculation
    let calculatedSubtotal = 0;
    let calculatedTotalOriginal = 0;
    const validatedOrderItems = [];

    for (const item of orderItemsData) {
      const product = db.products.findById(item.product_id);
      if (!product || product.is_active === false) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.product_name || item.product_id}" is no longer available.`
        });
      }

      // Check variant stock
      const variant = db.product_variants.findOne(v =>
        v.product_id === item.product_id &&
        v.size === item.size &&
        v.color_name.toLowerCase() === item.color.toLowerCase()
      );

      const availableStock = variant ? variant.stock_quantity : 10;
      const requestedQty = Number(item.quantity) || 1;

      if (availableStock < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name} (${item.size}, ${item.color}). Requested: ${requestedQty}, In Stock: ${availableStock}.`
        });
      }

      const itemPrice = Number(product.price);
      const itemOriginalPrice = Number(product.original_price || product.price);
      const itemTotal = itemPrice * requestedQty;

      calculatedSubtotal += itemTotal;
      calculatedTotalOriginal += itemOriginalPrice * requestedQty;

      validatedOrderItems.push({
        id: `orditem-${uuidv4().substring(0, 8)}`,
        product_id: product.id,
        variant_id: variant ? variant.id : null,
        product_name: product.name,
        product_image: product.images && product.images[0] ? product.images[0] : '',
        size: item.size,
        color: item.color,
        price: itemPrice,
        original_price: itemOriginalPrice,
        quantity: requestedQty,
        item_total: itemTotal
      });
    }

    const discount = Math.max(0, calculatedTotalOriginal - calculatedSubtotal);
    const delivery_charge = calculatedSubtotal >= 999 ? 0 : 99;
    const total_amount = calculatedSubtotal + delivery_charge;

    // 4. Create Order
    const orderId = generateOrderId();
    const userId = req.user ? req.user.id : (customer_email === 'alex@example.com' ? 'usr-demo-02' : `guest-${uuidv4().substring(0, 8)}`);

    const newOrder = db.orders.insert({
      id: orderId,
      user_id: userId,
      customer_name,
      customer_email: customer_email.toLowerCase(),
      customer_phone,
      shipping_address,
      city,
      state,
      pin_code: cleanPin,
      order_notes: order_notes || '',
      subtotal: calculatedSubtotal,
      discount,
      delivery_charge,
      total_amount,
      payment_method, // 'upi_simulator' | 'test_qr' | 'cod'
      payment_status: payment_method === 'cod' ? 'unpaid' : 'unpaid',
      order_status: 'Pending',
      is_simulated: true, // Clearly marks simulated testing mode
      demo_transaction_ref: null,
      payment_verified: false,
      payment_verified_at: null,
      payment_verified_by: null,
      status_history: [
        { status: 'Pending', timestamp: new Date().toISOString(), note: 'Order placed, awaiting demo payment simulation' }
      ]
    });

    // 5. Insert order items
    for (const oi of validatedOrderItems) {
      db.order_items.insert({
        ...oi,
        order_id: orderId
      });

      // Deduct inventory stock
      if (oi.variant_id) {
        const v = db.product_variants.findById(oi.variant_id);
        if (v) {
          const newStock = Math.max(0, v.stock_quantity - oi.quantity);
          db.product_variants.update(v.id, { stock_quantity: newStock });
        }
      }
    }

    // 6. Clear user cart
    const userCart = db.carts.findOne(c => c.user_id === userId || (req.headers['x-session-id'] && c.session_id === req.headers['x-session-id']));
    if (userCart) {
      db.carts.update(userCart.id, { items: [] });
    }

    // 7. Dispatch notification
    await notificationService.notifyOrderPlaced(newOrder);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      order: {
        ...newOrder,
        items: validatedOrderItems
      }
    });
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = db.orders.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Strict customer isolation check:
    // If user is authenticated, they can only view if admin or order belongs to them.
    if (req.user) {
      if (req.user.role !== 'admin' && order.user_id !== req.user.id && order.customer_email.toLowerCase() !== req.user.email.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You cannot view other customers\' private order details.'
        });
      }
    } else {
      // Unauthenticated query: require matching customer email
      const checkEmail = req.query.email || req.headers['x-guest-email'];
      if (!checkEmail || checkEmail.toLowerCase() !== order.customer_email.toLowerCase()) {
        return res.status(401).json({
          success: false,
          message: 'Please provide the customer email associated with this order to view tracking details.'
        });
      }
    }

    const items = db.order_items.find(oi => oi.order_id === order.id);
    const paymentAttempts = db.payment_attempts.find(pa => pa.order_id === order.id);

    return res.json({
      success: true,
      order: {
        ...order,
        items,
        payment_attempts: paymentAttempts
      }
    });
  } catch (err) {
    console.error('Get order error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getCustomerOrders = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const userEmail = req.user ? req.user.email.toLowerCase() : (req.query.email ? req.query.email.toLowerCase() : null);

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, message: 'Authentication or email required to view order history.' });
    }

    let customerOrders = [];
    if (userId) {
      customerOrders = db.orders.find(o => o.user_id === userId || o.customer_email.toLowerCase() === userEmail);
    } else {
      customerOrders = db.orders.find(o => o.customer_email.toLowerCase() === userEmail);
    }

    // Enrich orders with their items
    const enriched = customerOrders.map(order => {
      const items = db.order_items.find(oi => oi.order_id === order.id);
      return {
        ...order,
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
    console.error('Get customer orders error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
