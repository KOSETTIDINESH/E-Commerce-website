import React, { useState } from 'react';
import { ShoppingBag, Bell, User, Shield, Search, Menu, X, CheckCircle, ExternalLink, LogOut, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';

export default function Navbar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenAuth,
  onOpenAdmin,
  onOpenOrders
}) {
  const { user, isAdmin, logout, loginAsDemoCustomer, loginAsDemoAdmin } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'all', label: 'Shop All' },
    { id: 'oversized', label: 'Oversized Tees' },
    { id: 'anime', label: 'Anime Collection' },
    { id: 'hoodies', label: 'Hoodies' },
    { id: 'shirts', label: 'Shirts' },
    { id: 'jeans', label: 'Jeans' },
    { id: 'jackets', label: 'Jackets' },
    { id: 'men', label: 'Men' },
    { id: 'women', label: 'Women' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 text-white transition-all">
      {/* Test Mode Top Pill Bar */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-zinc-950 px-4 py-1.5 text-xs font-semibold tracking-wider flex items-center justify-between text-center select-none shadow-sm">
        <div className="hidden md:flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-zinc-950 animate-ping" />
          <span>PROJECT DEMONSTRATION MODE</span>
        </div>
        <div className="mx-auto flex items-center space-x-1.5 font-bold">
          <span className="bg-zinc-950 text-amber-400 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-widest">
            TEST MODE
          </span>
          <span>SIMULATED UPI & QR PAYMENTS — NO REAL MONEY TRANSFERRED</span>
        </div>
        <div className="hidden md:flex items-center space-x-3 text-[11px]">
          <span>Test Product: ₹799</span>
          <span className="opacity-40">|</span>
          <button
            onClick={loginAsDemoAdmin}
            className="hover:underline font-bold text-zinc-900"
          >
            Admin Access
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left: Mobile hamburger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-zinc-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('all')}>
            <div className="w-9 h-9 rounded-lg bg-white text-zinc-950 flex items-center justify-center font-black tracking-tighter text-lg shadow-inner">
              6W
            </div>
            <div>
              <span className="font-extrabold tracking-[0.25em] text-lg sm:text-xl font-serif">
                SIX WINGS
              </span>
              <span className="hidden sm:block text-[9px] tracking-[0.3em] text-zinc-400 font-sans uppercase">
                Atelier & Streetwear
              </span>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search oversized tees, anime drops, hoodies, jackets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Orders Tracking Shortcut */}
            <button
              onClick={onOpenOrders}
              className="text-xs text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition hidden sm:flex items-center space-x-1.5"
            >
              <span>Track Orders</span>
            </button>

            {/* Admin Dashboard Pill */}
            <button
              onClick={onOpenAdmin}
              className={`text-xs px-3 py-1.5 rounded-lg border transition flex items-center space-x-1.5 ${
                isAdmin
                  ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400'
                  : 'text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
              }`}
              title="Admin Management Dashboard"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-900 transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-zinc-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Box */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 text-xs z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                      In-App Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-amber-400 hover:underline text-[11px]"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-zinc-500 text-center py-6">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition ${
                            n.is_read
                              ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400'
                              : 'bg-zinc-800/60 border-zinc-700 text-white font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                              {n.title}
                            </span>
                            <span className="text-[9px] text-zinc-500">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-300 leading-snug">{n.message}</p>
                          {n.order_id && (
                            <span className="mt-1.5 inline-block text-[10px] bg-zinc-900 px-2 py-0.5 rounded text-zinc-400 font-mono">
                              #{n.order_id}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-white text-zinc-950 rounded-xl hover:bg-zinc-200 transition font-bold flex items-center space-x-2 shadow-sm"
              title="View Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">Bag</span>
              {itemCount > 0 && (
                <span className="bg-zinc-950 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Profile / Quick Login Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-900 border border-zinc-800 transition flex items-center space-x-1"
                title="Account"
              >
                <User className="w-5 h-5" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-3 text-xs z-50">
                  {user ? (
                    <div>
                      <div className="pb-3 border-b border-zinc-800">
                        <p className="font-bold text-white text-sm">{user.name}</p>
                        <p className="text-zinc-400 text-xs truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-amber-400">
                          {user.role}
                        </span>
                      </div>
                      <div className="py-2 space-y-1">
                        <button
                          onClick={() => {
                            onOpenOrders();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-zinc-200"
                        >
                          My Orders History
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              onOpenAdmin();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-amber-400 font-semibold"
                          >
                            Admin Dashboard
                          </button>
                        )}
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-rose-400 flex items-center space-x-1.5 mt-1"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-white mb-2">Welcome to Six Wings</p>
                      <button
                        onClick={() => {
                          onOpenAuth();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full bg-white text-zinc-950 font-bold py-2 rounded-lg hover:bg-zinc-200 transition text-center mb-2"
                      >
                        Sign In / Register
                      </button>
                      <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                          Quick Demo Sign-In
                        </p>
                        <button
                          onClick={() => {
                            loginAsDemoCustomer();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left text-xs px-2 py-1.5 rounded bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200"
                        >
                          Customer: <span className="text-zinc-400 font-mono">alex@example.com</span>
                        </button>
                        <button
                          onClick={() => {
                            loginAsDemoAdmin();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left text-xs px-2 py-1.5 rounded bg-zinc-800/80 hover:bg-zinc-800 text-amber-400 font-semibold"
                        >
                          Admin: <span className="text-zinc-400 font-mono">admin@sixwings.com</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="hidden lg:flex items-center space-x-8 py-3 border-t border-zinc-900 text-xs uppercase tracking-[0.18em] font-semibold text-zinc-400 overflow-x-auto scrollbar-none">
          {navLinks.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`hover:text-white transition whitespace-nowrap pb-1 relative ${
                activeTab === tab.id ? 'text-white font-bold' : ''
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-zinc-950 border-t border-zinc-800 px-4 py-4 space-y-3">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white"
          />
          <div className="grid grid-cols-2 gap-2 pt-2">
            {navLinks.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-lg text-xs tracking-wider uppercase ${
                  activeTab === tab.id ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
