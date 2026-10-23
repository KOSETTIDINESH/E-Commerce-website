import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNotification } from './NotificationContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [totalOriginalPrice, setTotalOriginalPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { showToast } = useNotification();

  const updateStateFromResponse = (data) => {
    setItems(data.items || []);
    setSubtotal(data.subtotal || 0);
    setTotalOriginalPrice(data.total_original_price || data.subtotal || 0);
    setDiscount(data.discount || 0);
    setDeliveryCharge(data.delivery_charge !== undefined ? data.delivery_charge : 0);
    setTotalAmount(data.total_amount || 0);
    setItemCount(data.item_count || (data.items ? data.items.reduce((s, i) => s + (i.quantity || 1), 0) : 0));
  };

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/cart');
      if (res.success) {
        updateStateFromResponse(res);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, size, color, quantity = 1) => {
    setLoading(true);
    try {
      const res = await api.post('/cart/add', { productId, size, color, quantity });
      if (res.success) {
        updateStateFromResponse(res);
        showToast('success', 'Added to Cart', res.message || 'Product added to bag');
        setIsCartOpen(true);
        return { success: true };
      }
      showToast('error', 'Unable to Add', res.message);
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.message || 'Failed to add item';
      showToast('error', 'Stock Limit', msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await api.put(`/cart/item/${itemId}`, { quantity });
      if (res.success) {
        updateStateFromResponse(res);
        return { success: true };
      }
      showToast('error', 'Update Failed', res.message);
      return { success: false };
    } catch (err) {
      showToast('error', 'Stock Warning', err.message);
      return { success: false };
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await api.delete(`/cart/item/${itemId}`);
      if (res.success) {
        updateStateFromResponse(res);
        showToast('info', 'Item Removed', 'Product removed from your shopping bag');
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      showToast('error', 'Error', err.message);
      return { success: false };
    }
  };

  const clearCart = async () => {
    try {
      const res = await api.delete('/cart/clear');
      if (res.success) {
        updateStateFromResponse(res);
        return { success: true };
      }
    } catch (err) {
      console.error('Clear cart error:', err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        totalOriginalPrice,
        discount,
        deliveryCharge,
        totalAmount,
        itemCount,
        isCartOpen,
        setIsCartOpen,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
