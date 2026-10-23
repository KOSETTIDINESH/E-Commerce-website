import React, { useState } from 'react';
import { X, ShieldCheck, QrCode, CreditCard, Banknote, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

export default function CheckoutModal({ onClose, onOrderPlaced }) {
  const { user } = useAuth();
  const { items, subtotal, discount, deliveryCharge, totalAmount, clearCart } = useCart();
  const { showToast } = useNotification();

  const [formData, setFormData] = useState({
    customer_name: user ? user.name : '',
    customer_email: user ? user.email : '',
    customer_phone: user && user.phone ? user.phone : '',
    shipping_address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pin_code: '560001',
    order_notes: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('upi_simulator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // One-click demo filler for fast evaluation
  const handleAutofillDemo = () => {
    setFormData({
      customer_name: user ? user.name : 'Alex Turner',
      customer_email: user ? user.email : 'alex@example.com',
      customer_phone: '9876543210',
      shipping_address: '42, Indiranagar 100ft Road, Atelier Heights',
      city: 'Bengaluru',
      state: 'Karnataka',
      pin_code: '560038',
      order_notes: 'Please leave at reception with security if not available.'
    });
    setValidationError('');
    showToast('info', 'Demo Data Applied', 'Pre-filled customer shipping details');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.customer_name.trim()) {
      setValidationError('Customer full name is required.');
      return;
    }
    if (!formData.customer_email.trim() || !formData.customer_email.includes('@')) {
      setValidationError('A valid email address is required.');
      return;
    }
    const cleanPhone = formData.customer_phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!formData.shipping_address.trim()) {
      setValidationError('Delivery street address is required.');
      return;
    }
    const cleanPin = formData.pin_code.replace(/[^0-9]/g, '');
    if (cleanPin.length < 5 || cleanPin.length > 6) {
      setValidationError('Please enter a valid postal PIN code.');
      return;
    }

    if (items.length === 0) {
      setValidationError('Your shopping bag is empty. Please add items to checkout.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        customer_phone: cleanPhone,
        pin_code: cleanPin,
        payment_method: paymentMethod,
        items
      };

      const res = await api.post('/orders', payload);

      if (res.success && res.order) {
        showToast('success', 'Order Initiated', `Order #${res.order.id} placed!`);
        clearCart();
        onOrderPlaced(res.order, paymentMethod);
      } else {
        setValidationError(res.message || 'Unable to place order. Please try again.');
      }
    } catch (err) {
      setValidationError(err.message || 'Error occurred while creating order.');
      showToast('error', 'Checkout Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 my-6 text-left">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-950 text-white">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              SIX WINGS ATELIER
            </span>
            <h2 className="text-lg sm:text-xl font-black font-serif">Checkout & Order Placement</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Fast Fill Banner */}
        <div className="bg-amber-50 px-6 py-2.5 border-b border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-amber-900 font-semibold">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Fast College Project Demo Evaluation:</span>
          </div>
          <button
            type="button"
            onClick={handleAutofillDemo}
            className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-3 py-1 rounded-lg transition text-xs shadow-sm"
          >
            1-Click Autofill Demo Customer
          </button>
        </div>

        {validationError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {validationError}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Customer & Delivery Details */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 border-b pb-2">
                1. Delivery Address
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="customer_name"
                    required
                    value={formData.customer_name}
                    onChange={handleChange}
                    placeholder="Alex Turner"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    name="customer_phone"
                    required
                    value={formData.customer_phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="customer_email"
                  required
                  value={formData.customer_email}
                  onChange={handleChange}
                  placeholder="alex@example.com"
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Street Address *</label>
                <textarea
                  name="shipping_address"
                  required
                  rows={2}
                  value={formData.shipping_address}
                  onChange={handleChange}
                  placeholder="Apartment, suite, unit, building, street..."
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950 transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">State *</label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    name="pin_code"
                    required
                    value={formData.pin_code}
                    onChange={handleChange}
                    placeholder="560001"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Order Notes (Optional)
                </label>
                <input
                  type="text"
                  name="order_notes"
                  value={formData.order_notes}
                  onChange={handleChange}
                  placeholder="e.g. Please ring door bell or leave with gate keeper"
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950 transition"
                />
              </div>

              {/* Payment Method Selector */}
              <div className="pt-3">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 border-b pb-2 mb-3">
                  2. Payment Method (Test Mode)
                </h3>

                <div className="space-y-2">
                  <label
                    onClick={() => setPaymentMethod('upi_simulator')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                      paymentMethod === 'upi_simulator'
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-md'
                        : 'border-zinc-200 hover:border-zinc-400 bg-white text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-bold text-xs sm:text-sm">UPI Simulator (Recommended)</p>
                        <p className={`text-[11px] ${paymentMethod === 'upi_simulator' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          Simulated in-app UPI payment with instant success/failure testing
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400 text-zinc-950">
                      TEST
                    </span>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('test_qr')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                      paymentMethod === 'test_qr'
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-md'
                        : 'border-zinc-200 hover:border-zinc-400 bg-white text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <QrCode className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-bold text-xs sm:text-sm">Test QR Payment</p>
                        <p className={`text-[11px] ${paymentMethod === 'test_qr' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          Scan dynamic simulated QR code in sandbox mode
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400 text-zinc-950">
                      MOCK
                    </span>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                      paymentMethod === 'cod'
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-md'
                        : 'border-zinc-200 hover:border-zinc-400 bg-white text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Banknote className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-bold text-xs sm:text-sm">Cash on Delivery</p>
                        <p className={`text-[11px] ${paymentMethod === 'cod' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          Pay with cash upon package delivery
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 bg-zinc-50 p-5 sm:p-6 rounded-2xl border border-zinc-200 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 border-b pb-2 mb-3">
                  Order Summary
                </h3>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5 truncate mr-2">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-10 h-12 object-cover rounded-lg bg-zinc-200 shrink-0"
                        />
                        <div className="truncate">
                          <p className="font-bold text-zinc-900 truncate">{item.product_name}</p>
                          <p className="text-[10px] text-zinc-500">
                            {item.size} • {item.color} • Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-zinc-900 shrink-0">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200 space-y-1.5 text-xs text-zinc-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-zinc-900">₹{subtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount</span>
                      <span>- ₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="font-semibold text-zinc-900">
                      {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-300 text-base font-black text-zinc-950">
                    <span>Total Amount</span>
                    <span>₹{totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="mt-6 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-xs sm:text-sm py-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-xl active:scale-[0.99] disabled:opacity-40"
                >
                  <span>
                    {isSubmitting
                      ? 'Creating Order...'
                      : paymentMethod === 'cod'
                      ? 'Confirm Cash On Delivery Order'
                      : 'Place Order & Launch Payment Simulator'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300/80 text-[10px] text-amber-900 text-center font-bold">
                  ⚠️ TEST ENVIRONMENT: NO REAL MONEY IS CHARGED
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
