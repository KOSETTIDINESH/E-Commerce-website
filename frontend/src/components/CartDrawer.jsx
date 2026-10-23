import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartDrawer({ onProceedToCheckout }) {
  const {
    items,
    subtotal,
    discount,
    deliveryCharge,
    totalAmount,
    itemCount,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart
  } = useCart();

  if (!isCartOpen) return null;

  const freeDeliveryThreshold = 999;
  const amountNeeded = Math.max(0, freeDeliveryThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between text-left">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-zinc-950" />
              <h2 className="text-base sm:text-lg font-black text-zinc-950 tracking-tight font-serif">
                Shopping Bag ({itemCount})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-100 text-xs">
            {amountNeeded > 0 ? (
              <div>
                <p className="text-zinc-600 mb-1.5">
                  Add <span className="font-bold text-zinc-950">₹{amountNeeded}</span> more for <span className="font-bold text-emerald-600">Free Express Delivery</span>
                </p>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-zinc-950 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center text-emerald-600 font-bold">
                <Truck className="w-4 h-4 mr-1.5" />
                <span>You've unlocked Free Express Shipping!</span>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-zinc-900 text-base">Your bag is empty</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  Explore our luxury heavyweight collection and anime editions to add to your wardrobe.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 bg-zinc-950 text-white text-xs font-bold px-6 py-3 rounded-full hover:bg-zinc-800 transition"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start space-x-4 p-3 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition bg-white"
                >
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-20 h-24 object-cover rounded-xl bg-zinc-100 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-zinc-950 text-xs sm:text-sm truncate">
                      {item.product_name}
                    </h4>

                    <div className="flex items-center space-x-2 mt-1 text-[11px] text-zinc-500">
                      <span className="bg-zinc-100 px-2 py-0.5 rounded font-mono font-medium text-zinc-700">
                        Size: {item.size}
                      </span>
                      <span className="bg-zinc-100 px-2 py-0.5 rounded font-medium text-zinc-700">
                        {item.color}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-black text-sm text-zinc-950">
                        ₹{item.price * item.quantity}
                      </span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-zinc-200 text-zinc-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-zinc-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-zinc-200 text-zinc-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-zinc-400 hover:text-rose-500 p-1 rounded transition"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-zinc-100 bg-zinc-50/50 space-y-3">
              <div className="space-y-1.5 text-xs text-zinc-600">
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
                    {deliveryCharge === 0 ? (
                      <span className="text-emerald-600 uppercase font-bold text-[10px]">FREE</span>
                    ) : (
                      `₹${deliveryCharge}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm font-black text-zinc-950">
                  <span>Total Payable</span>
                  <span className="text-base font-black">₹{totalAmount}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-xs sm:text-sm py-4 rounded-2xl flex items-center justify-center space-x-2 transition shadow-xl active:scale-[0.99]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-center text-zinc-400 font-medium">
                Simulated Test Payment Demo • Taxes & Shipping calculated
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
