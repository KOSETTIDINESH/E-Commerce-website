const { v4: uuidv4 } = require('uuid');
const db = require('../db');

function calculateCartTotals(items) {
  let subtotal = 0;
  let totalOriginalPrice = 0;

  for (const item of items) {
    const itemSubtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
    subtotal += itemSubtotal;
    totalOriginalPrice += (Number(item.original_price || item.price) || 0) * (Number(item.quantity) || 1);
  }

  // Discount calculation
  const discount = Math.max(0, totalOriginalPrice - subtotal);
  
  // Delivery charge rule: Free delivery above ₹999, else ₹99
  const delivery_charge = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const total_amount = subtotal + delivery_charge;

  return {
    subtotal,
    total_original_price: totalOriginalPrice,
    discount,
    delivery_charge,
    total_amount,
    item_count: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  };
}

function getCartForUserOrSession(req) {
  const userId = req.user ? req.user.id : null;
  const sessionId = req.headers['x-session-id'] || req.query.sessionId || 'guest-session';

  let cart;
  if (userId) {
    cart = db.carts.findOne(c => c.user_id === userId);
  } else {
    cart = db.carts.findOne(c => c.session_id === sessionId);
  }

  if (!cart) {
    cart = db.carts.insert({
      id: `cart-${uuidv4().substring(0, 8)}`,
      user_id: userId,
      session_id: sessionId,
      items: []
    });
  }

  // If user just logged in and had a session cart, merge or link it
  if (userId && !cart.user_id) {
    cart = db.carts.update(cart.id, { user_id: userId });
  }

  return cart;
}

exports.getCart = async (req, res) => {
  try {
    const cart = getCartForUserOrSession(req);
    const enrichedItems = [];

    // Check live stock status for each item
    for (const item of cart.items) {
      const product = db.products.findById(item.product_id);
      const variant = db.product_variants.findOne(v => 
        v.product_id === item.product_id && 
        v.size === item.size && 
        v.color_name === item.color
      );

      const availableStock = variant ? variant.stock_quantity : (product ? 10 : 0);
      const isAvailable = availableStock >= item.quantity;

      enrichedItems.push({
        ...item,
        available_stock: availableStock,
        is_available: isAvailable,
        product_name: product ? product.name : item.product_name,
        product_image: product && product.images ? product.images[0] : item.product_image,
        price: product ? product.price : item.price,
        original_price: product ? product.original_price : item.original_price
      });
    }

    const totals = calculateCartTotals(enrichedItems);

    return res.json({
      success: true,
      cart_id: cart.id,
      items: enrichedItems,
      ...totals
    });
  } catch (err) {
    console.error('Get cart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, size, color, quantity = 1 } = req.body;

    if (!productId || !size || !color) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, size, and color are required.'
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than zero.' });
    }

    const product = db.products.findById(productId);
    if (!product || product.is_active === false) {
      return res.status(404).json({ success: false, message: 'Product is unavailable.' });
    }

    // Verify stock from variant
    const variant = db.product_variants.findOne(v => 
      v.product_id === productId && 
      v.size === size && 
      v.color_name.toLowerCase() === color.toLowerCase()
    );

    const availableStock = variant ? variant.stock_quantity : 20;

    const cart = getCartForUserOrSession(req);
    const existingIndex = cart.items.findIndex(i => 
      i.product_id === productId && i.size === size && i.color.toLowerCase() === color.toLowerCase()
    );

    const existingQty = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;
    const requestedTotalQty = existingQty + qty;

    if (requestedTotalQty > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} units available for size ${size} in ${color}. You currently have ${existingQty} in cart.`
      });
    }

    let updatedItems = [...cart.items];
    if (existingIndex > -1) {
      updatedItems[existingIndex].quantity = requestedTotalQty;
    } else {
      updatedItems.push({
        id: `item-${uuidv4().substring(0, 8)}`,
        product_id: productId,
        variant_id: variant ? variant.id : null,
        product_name: product.name,
        product_image: product.images && product.images[0] ? product.images[0] : '',
        size,
        color,
        price: product.price,
        original_price: product.original_price,
        quantity: qty
      });
    }

    db.carts.update(cart.id, { items: updatedItems });

    const totals = calculateCartTotals(updatedItems);
    return res.json({
      success: true,
      message: `${product.name} added to cart.`,
      cart_id: cart.id,
      items: updatedItems,
      ...totals
    });
  } catch (err) {
    console.error('Add to cart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity, 10);
    const cart = getCartForUserOrSession(req);

    const itemIndex = cart.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }

    let updatedItems = [...cart.items];

    if (qty <= 0) {
      updatedItems.splice(itemIndex, 1);
    } else {
      const item = updatedItems[itemIndex];
      // Stock check
      const variant = db.product_variants.findOne(v => 
        v.product_id === item.product_id && 
        v.size === item.size && 
        v.color_name.toLowerCase() === item.color.toLowerCase()
      );
      const stock = variant ? variant.stock_quantity : 20;

      if (qty > stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot increase quantity. Maximum available stock is ${stock}.`
        });
      }

      updatedItems[itemIndex].quantity = qty;
    }

    db.carts.update(cart.id, { items: updatedItems });
    const totals = calculateCartTotals(updatedItems);

    return res.json({
      success: true,
      message: 'Cart updated.',
      items: updatedItems,
      ...totals
    });
  } catch (err) {
    console.error('Update quantity error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = getCartForUserOrSession(req);

    const updatedItems = cart.items.filter(i => i.id !== itemId);
    db.carts.update(cart.id, { items: updatedItems });

    const totals = calculateCartTotals(updatedItems);
    return res.json({
      success: true,
      message: 'Item removed from cart.',
      items: updatedItems,
      ...totals
    });
  } catch (err) {
    console.error('Remove from cart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = getCartForUserOrSession(req);
    db.carts.update(cart.id, { items: [] });
    return res.json({
      success: true,
      message: 'Cart cleared.',
      items: [],
      subtotal: 0,
      total_amount: 0,
      item_count: 0
    });
  } catch (err) {
    console.error('Clear cart error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
