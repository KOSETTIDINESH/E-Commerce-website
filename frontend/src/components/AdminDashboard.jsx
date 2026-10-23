import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  CheckCircle,
  TrendingUp,
  Package,
  CreditCard,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  RefreshCw,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function AdminDashboard({ onClose, onProductUpdated }) {
  const { user, isAdmin, loginAsDemoAdmin } = useAuth();
  const { showToast, fetchNotifications } = useNotification();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'payments' | 'orders' | 'products' | 'audit'
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState(null);

  // Payments verification
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [paymentSearch, setPaymentSearch] = useState('');

  // Orders
  const [orders, setOrders] = useState([]);
  const [orderFilterStatus, setOrderFilterStatus] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Products
  const [products, setProducts] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'oversized',
    price: 799,
    original_price: 1499,
    description: '',
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'],
    variants: [
      { size: 'S', color_name: 'Onyx Black', color_code: '#09090b', stock_quantity: 20 },
      { size: 'M', color_name: 'Onyx Black', color_code: '#09090b', stock_quantity: 25 },
      { size: 'L', color_name: 'Onyx Black', color_code: '#09090b', stock_quantity: 20 }
    ]
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);

  // Fetch functions
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.success) setStats(res.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await api.get('/admin/payments', { search: paymentSearch });
      if (res.success) setPaymentRecords(res.records || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/admin/orders', { status: orderFilterStatus, search: orderSearch });
      if (res.success) setOrders(res.orders || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProductsList = async () => {
    try {
      const res = await api.get('/products');
      if (res.success) setProducts(res.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs');
      if (res.success) setAuditLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshAll = () => {
    setLoading(true);
    Promise.all([fetchStats(), fetchPayments(), fetchOrders(), fetchProductsList(), fetchAuditLogs()]).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    if (isAdmin) {
      refreshAll();
    }
  }, [isAdmin, activeTab]);

  // Payment Verification action
  const handleVerifyPayment = async (orderId) => {
    try {
      const res = await api.post(`/admin/payments/${orderId}/verify`);
      if (res.success) {
        showToast('success', 'Demo Payment Verified', res.message);
        fetchPayments();
        fetchStats();
        fetchNotifications();
      }
    } catch (err) {
      showToast('error', 'Verification Error', err.message);
    }
  };

  // Update order status action
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/admin/orders/${orderId}/status`, {
        order_status: newStatus,
        note: `Updated to ${newStatus} in admin portal`
      });
      if (res.success) {
        showToast('success', 'Order Status Updated', `Order #${orderId} changed to ${newStatus}`);
        fetchOrders();
        fetchStats();
        fetchNotifications();
      }
    } catch (err) {
      showToast('error', 'Status Update Failed', err.message);
    }
  };

  // Delete product action
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.success) {
        showToast('info', 'Product Deleted', 'Product removed from catalog');
        fetchProductsList();
        if (onProductUpdated) onProductUpdated();
      }
    } catch (err) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  // Save product form
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct.id}`, productForm);
        if (res.success) {
          showToast('success', 'Product Updated', res.message);
        }
      } else {
        const res = await api.post('/products', productForm);
        if (res.success) {
          showToast('success', 'Product Created', res.message);
        }
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      fetchProductsList();
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showToast('error', 'Save Failed', err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-4 text-left">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-zinc-950 font-serif">Admin Authentication Required</h2>
          <p className="text-xs text-zinc-600">
            This management dashboard is strictly restricted to authorized Six Wings store administrators.
          </p>
          <div className="pt-4 space-y-2">
            <button
              onClick={loginAsDemoAdmin}
              className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs py-3 rounded-xl transition"
            >
              Sign In with 1-Click Demo Admin
            </button>
            <button
              onClick={onClose}
              className="w-full bg-zinc-100 text-zinc-700 text-xs py-2 rounded-xl"
            >
              Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/90 backdrop-blur-md flex flex-col text-left text-zinc-900 animate-in fade-in duration-200">
      {/* Top Admin Bar */}
      <header className="bg-zinc-950 text-white border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-zinc-950 font-black flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif font-black text-lg text-white">Six Wings Admin Atelier</h1>
              <span className="text-[10px] bg-amber-400 text-zinc-950 px-2 py-0.2 rounded font-bold uppercase">
                TEST DEMO PORTAL
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Logged in as: <span className="text-zinc-200 font-mono">{user ? user.email : ''}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={refreshAll}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition flex items-center space-x-1 text-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 flex space-x-6 text-xs uppercase tracking-wider font-bold text-zinc-400 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview Metrics' },
          { id: 'payments', label: 'Payment Verification' },
          { id: 'orders', label: 'Order Management' },
          { id: 'products', label: 'Product Catalog' },
          { id: 'audit', label: 'Audit Trail Logs' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`py-3.5 transition whitespace-nowrap border-b-2 ${
              activeTab === t.id
                ? 'border-amber-400 text-white'
                : 'border-transparent hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-zinc-100 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Simulated Revenue (Clearly distinguished from real sales!) */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-zinc-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Simulated Sales</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                      DEMO MODE
                    </span>
                  </div>
                  <p className="text-2xl font-black text-zinc-950">
                    ₹{stats ? stats.simulated_sales_amount : 0}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Simulated in-app UPI & QR volume
                  </p>
                </div>

                {/* Real Sales (Strictly 0.00 in demo) */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Real Sales</span>
                    <span className="text-[10px] bg-zinc-100 text-zinc-600 font-bold px-1.5 py-0.5 rounded">
                      SEPARATE LEDGER
                    </span>
                  </div>
                  <p className="text-2xl font-black text-zinc-400">
                    ₹{stats ? stats.real_sales_amount : 0}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    No real bank accounts connected
                  </p>
                </div>

                {/* Total Orders */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                    <Package className="w-4 h-4 text-zinc-400" />
                  </div>
                  <p className="text-2xl font-black text-zinc-950">
                    {stats ? stats.total_orders : 0}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    {stats ? stats.paid_orders_count : 0} paid transactions
                  </p>
                </div>

                {/* Pending Payment Verifications */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Pending Verify</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-black text-amber-600">
                    {stats ? stats.pending_verifications_count : 0}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Awaiting admin sign-off
                  </p>
                </div>
              </div>

              {/* Recent Orders table */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 mb-4">
                  Recent Orders & Transactions
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Payment</th>
                        <th className="pb-3">Demo Txn Ref</th>
                        <th className="pb-3">Order Status</th>
                        <th className="pb-3">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {stats && stats.recent_orders && stats.recent_orders.length > 0 ? (
                        stats.recent_orders.map((o) => (
                          <tr key={o.id} className="hover:bg-zinc-50 transition">
                            <td className="py-3 font-mono font-bold text-zinc-950">#{o.id}</td>
                            <td className="py-3 font-medium text-zinc-900">{o.customer_name}</td>
                            <td className="py-3 font-black text-zinc-950">₹{o.total_amount}</td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  o.payment_status === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {o.payment_status}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-[11px] text-zinc-600">
                              {o.demo_transaction_ref || 'N/A'}
                            </td>
                            <td className="py-3 font-semibold text-zinc-800">{o.order_status}</td>
                            <td className="py-3">
                              {o.payment_verified ? (
                                <span className="inline-flex items-center text-emerald-600 font-bold text-[11px]">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Verified
                                </span>
                              ) : o.payment_status === 'paid' ? (
                                <button
                                  onClick={() => handleVerifyPayment(o.id)}
                                  className="bg-amber-400 hover:bg-amber-300 text-zinc-950 text-[10px] font-bold px-2 py-1 rounded"
                                >
                                  Verify Now
                                </button>
                              ) : (
                                <span className="text-zinc-400 text-[11px]">Unpaid</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-zinc-400">
                            No orders recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAYMENT VERIFICATION (CRITICAL SECTION 5 SPEC) */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-zinc-950 font-serif">
                    Payment Verification Dashboard
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Inspect simulated demo transactions and mark records as verified for testing.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Order ID, txn ref..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              {/* Table displaying all required fields from spec */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                      <th className="pb-3">Order ID</th>
                      <th className="pb-3">Customer Name</th>
                      <th className="pb-3">Order Amount</th>
                      <th className="pb-3">Payment Method</th>
                      <th className="pb-3">Payment Status</th>
                      <th className="pb-3">Demo Txn Reference</th>
                      <th className="pb-3">Date & Time</th>
                      <th className="pb-3">Order Status</th>
                      <th className="pb-3 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {paymentRecords.length > 0 ? (
                      paymentRecords.map((r) => (
                        <tr key={r.order_id} className="hover:bg-zinc-50 transition">
                          <td className="py-3 font-mono font-bold text-zinc-950">#{r.order_id}</td>
                          <td className="py-3 font-medium text-zinc-900">{r.customer_name}</td>
                          <td className="py-3 font-black text-zinc-950">₹{r.order_amount}</td>
                          <td className="py-3 uppercase text-[10px] text-zinc-600 font-semibold">
                            {r.payment_method}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                r.payment_status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.payment_status}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-[11px] text-emerald-700 font-bold">
                            {r.demo_transaction_reference}
                          </td>
                          <td className="py-3 text-[11px] text-zinc-500">
                            {new Date(r.payment_date_time).toLocaleString()}
                          </td>
                          <td className="py-3 font-semibold text-zinc-800">{r.order_status}</td>
                          <td className="py-3 text-right">
                            {r.payment_verified ? (
                              <span className="inline-flex items-center text-emerald-600 font-bold text-[11px] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                Verified
                              </span>
                            ) : r.payment_status === 'paid' ? (
                              <button
                                onClick={() => handleVerifyPayment(r.order_id)}
                                className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-sm transition"
                              >
                                Mark as Verified
                              </button>
                            ) : (
                              <span className="text-zinc-400 text-[11px]">Unpaid</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-zinc-400">
                          No payment records found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDER MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-zinc-950 font-serif">
                    Order Management
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Advance order statuses: Pending → Confirmed → Processing → Shipped → Delivered
                  </p>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <select
                    value={orderFilterStatus}
                    onChange={(e) => setOrderFilterStatus(e.target.value)}
                    className="text-xs p-2 rounded-xl border border-zinc-300 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Search order ID or customer..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                    className="text-xs p-2 rounded-xl border border-zinc-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-zinc-950">#{o.id}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                          {o.order_status}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Payment: {o.payment_status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600">
                        Customer: <span className="font-semibold text-zinc-900">{o.customer_name}</span> ({o.customer_email}) • Phone: {o.customer_phone}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Address: {o.shipping_address}, {o.city}, {o.pin_code} • Total: <strong className="text-zinc-950">₹{o.total_amount}</strong>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 self-end md:self-center">
                      <span className="text-[11px] font-bold text-zinc-500">Update Status:</span>
                      <select
                        value={o.order_status}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        className="text-xs font-bold p-2 rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-950"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCT CATALOG MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-zinc-950 font-serif">
                    Product & Inventory Management
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Create, update, manage prices, sizes, stock quantities and images.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: '',
                      category: 'oversized',
                      price: 799,
                      original_price: 1499,
                      description: '',
                      images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'],
                      variants: [
                        { size: 'S', color_name: 'Onyx Black', color_code: '#09090b', stock_quantity: 20 },
                        { size: 'M', color_name: 'Onyx Black', color_code: '#09090b', stock_quantity: 25 },
                        { size: 'L', color_name: 'Onyx Black', color_code: '#09090b', stock_quantity: 20 }
                      ]
                    });
                    setIsProductModalOpen(true);
                  }}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col justify-between"
                  >
                    <div className="flex items-start space-x-3">
                      <img
                        src={p.images && p.images[0]}
                        alt={p.name}
                        className="w-16 h-20 object-cover rounded-lg bg-zinc-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">
                          {p.category}
                        </span>
                        <h4 className="font-bold text-zinc-950 text-xs truncate">{p.name}</h4>
                        <p className="text-xs font-black text-zinc-950 mt-1">₹{p.price}</p>
                        <p className="text-[11px] text-zinc-500">
                          Stock: {p.total_stock !== undefined ? p.total_stock : 'N/A'} units
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-200 flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setProductForm({
                            name: p.name,
                            category: p.category,
                            price: p.price,
                            original_price: p.original_price,
                            description: p.description,
                            images: p.images || [],
                            variants: p.variants || []
                          });
                          setIsProductModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-600 hover:text-zinc-950 rounded hover:bg-zinc-200"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT TRAIL LOGS */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-zinc-950 font-serif">
                Immutable Admin Audit Logs
              </h3>
              <p className="text-xs text-zinc-500">
                Full chronological audit trail of administrative modifications and payment verification actions.
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-amber-700">{log.action}</span>
                        <span className="text-zinc-400">•</span>
                        <span className="text-zinc-600">{log.admin_email}</span>
                        <span className="text-zinc-400">•</span>
                        <span className="font-mono text-[10px] text-zinc-400">ID: {log.entity_id}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {log.details ? JSON.stringify(log.details) : 'N/A'}
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                      {new Date(log.created_at || log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-zinc-950 text-base">
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full p-2 rounded-xl border border-zinc-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-zinc-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.original_price}
                    onChange={(e) => setProductForm({ ...productForm, original_price: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-zinc-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-2 rounded-xl border border-zinc-300"
                  >
                    <option value="oversized">Oversized</option>
                    <option value="anime">Anime</option>
                    <option value="hoodies">Hoodies</option>
                    <option value="shirts">Shirts</option>
                    <option value="jeans">Jeans</option>
                    <option value="jackets">Jackets</option>
                    <option value="women">Women</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={productForm.images[0] || ''}
                  onChange={(e) => setProductForm({ ...productForm, images: [e.target.value] })}
                  className="w-full p-2 rounded-xl border border-zinc-300"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-2 rounded-xl border border-zinc-300"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-zinc-950 text-white font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
