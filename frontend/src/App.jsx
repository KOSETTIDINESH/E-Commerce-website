import React, { useState, useEffect, useCallback } from 'react';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import api from './services/api';

import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import PaymentSimulatorModal from './components/PaymentSimulatorModal';
import OrderSuccessModal from './components/OrderSuccessModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import ToastContainer from './components/ToastContainer';

import { Filter, SlidersHorizontal, ArrowUpDown, Sparkles, CheckCircle } from 'lucide-react';

function Storefront() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('new');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);
  const [successTxnRef, setSuccessTxnRef] = useState('');
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { addToCart } = useCart();

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 120);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products', {
        category: activeCategory,
        search: debouncedSearch,
        sort: sortBy
      });
      if (res.success) {
        setProducts(res.products || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedSearch, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Order Placed from Checkout
  const handleOrderPlaced = (order, paymentMethod) => {
    setIsCheckoutOpen(false);
    if (paymentMethod === 'cod') {
      setSuccessOrder(order);
      setSuccessTxnRef('COD-ORDER-ACCEPTED');
    } else {
      // Open Payment Simulator
      setActivePaymentOrder(order);
    }
  };

  // Handle Payment Simulation Success
  const handlePaymentSuccess = (updatedOrder, txnRef) => {
    setActivePaymentOrder(null);
    setSuccessOrder(updatedOrder);
    setSuccessTxnRef(txnRef);
  };

  // Handle Payment Simulation Failure or Cancel (allows retry from tracking or checkout)
  const handlePaymentFailure = (updatedOrder) => {
    // Keep activePaymentOrder open for user to review failure & retry
  };

  const handlePaymentCancelled = (updatedOrder) => {
    setActivePaymentOrder(null);
  };

  // Select test sample product priced at ₹799 directly
  const handleSelectSampleTestItem = async () => {
    const testItem = products.find((p) => p.price === 799) || products[0];
    if (testItem) {
      setSelectedProduct(testItem);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between text-zinc-950 font-sans selection:bg-zinc-950 selection:text-white">
      {/* Toast Alert System */}
      <ToastContainer />

      {/* Main Navigation */}
      <Navbar
        activeTab={activeCategory}
        setActiveTab={setActiveCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenOrders={() => setIsTrackingOpen(true)}
      />

      {/* Hero Banner with Editorial Aesthetic */}
      {activeCategory === 'all' && !searchQuery && (
        <HeroBanner
          onShopNow={() => {
            const el = document.getElementById('shop-catalog');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onExploreAnime={() => setActiveCategory('anime')}
          onSelectSampleProduct={handleSelectSampleTestItem}
        />
      )}

      {/* Main Catalog Section */}
      <main id="shop-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Catalog Filter & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
              EXPLORE CATALOG
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-950 font-serif capitalize">
              {activeCategory === 'all'
                ? 'All Silhouette Releases'
                : `${activeCategory} Collection`}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Showing {products.length} bespoke pieces
            </p>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center">
            <div className="flex items-center space-x-2 text-xs font-bold text-zinc-600">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-bold py-2 px-3 rounded-xl border border-zinc-300 bg-white focus:outline-none focus:border-zinc-950 shadow-xs"
            >
              <option value="new">Newest Releases</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse bg-zinc-200 aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-zinc-500 text-sm">No items found matching your filters.</p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="mt-4 text-xs font-bold underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Luxury Footer */}
      <footer className="bg-zinc-950 text-white border-t border-zinc-800 pt-16 pb-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-left text-xs">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-white text-zinc-950 flex items-center justify-center font-black">
                6W
              </div>
              <span className="font-extrabold tracking-[0.25em] text-lg font-serif">
                SIX WINGS
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Luxury streetwear atelier crafting architectural silhouettes, 280-400 GSM French terry cottons, and limited edition anime drops.
            </p>
            <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[11px] font-semibold">
              🧪 Demonstration E-Commerce Platform — College Project Ready
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-widest text-xs mb-3">
              Collections
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li><button onClick={() => setActiveCategory('oversized')} className="hover:text-white">Oversized T-Shirts</button></li>
              <li><button onClick={() => setActiveCategory('anime')} className="hover:text-white">Neo-Tokyo Anime Series</button></li>
              <li><button onClick={() => setActiveCategory('hoodies')} className="hover:text-white">400 GSM Fleece Hoodies</button></li>
              <li><button onClick={() => setActiveCategory('jeans')} className="hover:text-white">Carpenter Denim Jeans</button></li>
              <li><button onClick={() => setActiveCategory('jackets')} className="hover:text-white">Flight Bomber Jackets</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-widest text-xs mb-3">
              Testing Workflows
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li><button onClick={handleSelectSampleTestItem} className="hover:text-white">₹799 Test Sample Product</button></li>
              <li><button onClick={() => setIsTrackingOpen(true)} className="hover:text-white">Order Tracking Simulator</button></li>
              <li><button onClick={() => setIsAdminOpen(true)} className="hover:text-white text-amber-400 font-bold">Admin Verification Dashboard</button></li>
              <li><span className="text-zinc-500">Mock UPI Gateway: sixwings.demo@upi</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-widest text-xs mb-3">
              Project Disclaimer
            </h4>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              This software is designed for academic project demonstration. No real financial transactions, banking APIs, or live merchant gateways are active. All payments are securely simulated within the application sandbox.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500">
          <p>© 2026 SIX WINGS ATELIER. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-mono text-[10px] text-amber-400">
            TEST MODE: ACTIVE • SERVER: NODE.JS/EXPRESS • DB: RELATIONAL PERSISTENT
          </p>
        </div>
      </footer>

      {/* Cart Drawer Component */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutOpen(false)}
          onOrderPlaced={handleOrderPlaced}
        />
      )}

      {/* Simulated Payment Gateway Modal */}
      {activePaymentOrder && (
        <PaymentSimulatorModal
          order={activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          onPaymentCancelled={handlePaymentCancelled}
        />
      )}

      {/* Order Success Modal */}
      {successOrder && (
        <OrderSuccessModal
          order={successOrder}
          txnRef={successTxnRef}
          onClose={() => setSuccessOrder(null)}
          onTrackOrder={(id) => {
            setSuccessOrder(null);
            setTrackingOrderId(id);
            setIsTrackingOpen(true);
          }}
        />
      )}

      {/* Order Tracking Modal */}
      {isTrackingOpen && (
        <OrderTrackingModal
          initialOrderId={trackingOrderId}
          onClose={() => {
            setIsTrackingOpen(false);
            setTrackingOrderId(null);
          }}
          onResumePayment={(unpaidOrder) => {
            setIsTrackingOpen(false);
            setActivePaymentOrder(unpaidOrder);
          }}
        />
      )}

      {/* Admin Dashboard */}
      {isAdminOpen && (
        <AdminDashboard
          onClose={() => setIsAdminOpen(false)}
          onProductUpdated={fetchProducts}
        />
      )}

      {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal onClose={() => setIsAuthOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <Storefront />
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}
