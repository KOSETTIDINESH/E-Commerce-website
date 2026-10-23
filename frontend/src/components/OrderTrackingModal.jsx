import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Check,
  ShieldCheck,
  Search,
  ExternalLink,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function OrderTrackingModal({ initialOrderId, onClose, onResumePayment }) {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [orderIdInput, setOrderIdInput] = useState(initialOrderId || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myOrders, setMyOrders] = useState([]);

  const stages = [
    { key: 'Pending', label: 'Order Placed', desc: 'Awaiting simulated payment' },
    { key: 'Confirmed', label: 'Confirmed', desc: 'Demo payment confirmed' },
    { key: 'Processing', label: 'Processing', desc: 'Packed at Six Wings Atelier' },
    { key: 'Shipped', label: 'Shipped', desc: 'Handed over to courier' },
    { key: 'Delivered', label: 'Delivered', desc: 'Package delivered' }
  ];

  const fetchOrder = async (id) => {
    if (!id || !id.trim()) return;
    setLoading(true);
    setError('');
    try {
      // Pass user email or fallback guest email if needed
      const guestEmail = user ? user.email : 'alex@example.com';
      const res = await api.get(`/orders/${id.trim()}`, { email: guestEmail });
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setError(res.message || 'Order not found.');
      }
    } catch (err) {
      setError(err.message || 'Unable to locate order. Please check your order ID.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerHistory = async () => {
    try {
      const email = user ? user.email : 'alex@example.com';
      const res = await api.get('/orders/my-orders', { email });
      if (res.success && res.orders) {
        setMyOrders(res.orders);
        if (!initialOrderId && res.orders.length > 0) {
          setOrder(res.orders[0]);
          setOrderIdInput(res.orders[0].id);
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      fetchOrder(initialOrderId);
    }
    fetchCustomerHistory();
  }, [initialOrderId]);

  const getCurrentStageIndex = (status) => {
    if (status === 'Cancelled') return -1;
    const idx = stages.findIndex((s) => s.key.toLowerCase() === (status || 'pending').toLowerCase());
    return idx === -1 ? 0 : idx;
  };

  const currentStageIndex = order ? getCurrentStageIndex(order.order_status) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 text-left">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 my-6">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-amber-400" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                SIX WINGS LOGISTICS
              </span>
              <h2 className="text-base sm:text-lg font-black font-serif">
                Order Tracking & Timeline
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Order Switcher */}
        <div className="p-4 sm:p-6 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Order ID (e.g. SW-2026-XXXXX)..."
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrder(orderIdInput)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-950 bg-white"
            />
          </div>
          <button
            onClick={() => fetchOrder(orderIdInput)}
            disabled={loading}
            className="bg-zinc-950 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition"
          >
            {loading ? 'Locating...' : 'Track Order'}
          </button>
        </div>

        {/* Quick Order Tabs if multiple exist */}
        {myOrders.length > 1 && (
          <div className="px-6 py-2.5 bg-zinc-100/60 border-b border-zinc-200 flex items-center space-x-2 overflow-x-auto text-xs">
            <span className="text-[10px] uppercase font-bold text-zinc-500 whitespace-nowrap">
              Your Orders:
            </span>
            {myOrders.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setOrder(o);
                  setOrderIdInput(o.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
                  order && order.id === o.id
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                }`}
              >
                #{o.id} ({o.order_status})
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {order ? (
            <>
              {/* Order Meta Ribbon */}
              <div className="p-4 rounded-2xl bg-zinc-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Order Reference</p>
                  <p className="text-sm font-mono font-black text-amber-400">#{order.id}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Payment Status</p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded font-black text-[11px] uppercase ${
                      order.payment_status === 'paid'
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-amber-400 text-zinc-950'
                    }`}
                  >
                    {order.payment_status}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Demo Txn Ref</p>
                  <p className="font-mono text-zinc-200 text-xs">
                    {order.demo_transaction_ref || 'PENDING SIMULATION'}
                  </p>
                </div>

                {order.payment_verified && (
                  <div className="flex items-center space-x-1.5 bg-emerald-950/80 border border-emerald-500/60 px-3 py-1 rounded-xl text-emerald-300 font-bold text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Verified by Admin</span>
                  </div>
                )}
              </div>

              {/* Retry Unpaid Order Banner if unpaid/failed */}
              {order.payment_status !== 'paid' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-amber-900">
                      Payment is currently {order.payment_status.toUpperCase()}
                    </p>
                    <p className="text-amber-700 text-[11px]">
                      Complete the simulated payment to advance your order to Confirmed status.
                    </p>
                  </div>
                  <button
                    onClick={() => onResumePayment(order)}
                    className="bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Launch Payment Simulator</span>
                  </button>
                </div>
              )}

              {/* Visual Multi-Step Tracker */}
              <div className="py-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-6">
                  Shipment Progression
                </h4>

                <div className="relative flex justify-between items-start">
                  {/* Progress Line */}
                  <div className="absolute top-4 left-6 right-6 h-0.5 bg-zinc-200 -z-0">
                    <div
                      className="h-full bg-zinc-950 transition-all duration-500"
                      style={{
                        width: `${(currentStageIndex / (stages.length - 1)) * 100}%`
                      }}
                    />
                  </div>

                  {stages.map((stage, idx) => {
                    const isDone = idx <= currentStageIndex;
                    const isCurrent = idx === currentStageIndex;

                    return (
                      <div
                        key={stage.key}
                        className="flex flex-col items-center text-center relative z-10 w-20"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                            isDone
                              ? 'bg-zinc-950 text-white shadow-md'
                              : 'bg-zinc-100 text-zinc-400 border border-zinc-300'
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>

                        <span
                          className={`mt-2 text-[11px] font-bold ${
                            isCurrent
                              ? 'text-zinc-950 font-black'
                              : isDone
                              ? 'text-zinc-800'
                              : 'text-zinc-400'
                          }`}
                        >
                          {stage.label}
                        </span>
                        <span className="text-[9px] text-zinc-400 hidden sm:block leading-tight mt-0.5">
                          {stage.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items in this Order */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  Items in Shipment
                </h4>
                <div className="space-y-2">
                  {order.items &&
                    order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-12 h-14 object-cover rounded-lg bg-zinc-200"
                          />
                          <div>
                            <p className="font-bold text-zinc-900">{item.product_name}</p>
                            <p className="text-[11px] text-zinc-500">
                              Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-zinc-900">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            !loading && (
              <div className="py-12 text-center text-zinc-500 text-xs">
                Enter your Order ID above or select one from your orders list.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
