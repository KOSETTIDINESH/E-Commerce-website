import React from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, Package, Printer, Share2 } from 'lucide-react';

export default function OrderSuccessModal({ order, txnRef, onClose, onTrackOrder }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 text-left">
      <div className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 my-6">
        {/* Success Header */}
        <div className="bg-zinc-950 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
            ORDER CONFIRMED
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-serif mt-1">
            Thank You for Your Order!
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Your simulated order has been registered in the database.
          </p>

          <div className="mt-4 inline-block bg-amber-400/90 text-zinc-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            DEMO PAYMENT — NO REAL MONEY TRANSFERRED
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Reference Codes */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Order ID
              </span>
              <span className="font-mono font-bold text-zinc-900 text-sm">
                #{order.id}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Demo Transaction Ref
              </span>
              <span className="font-mono font-bold text-emerald-600 text-xs truncate block">
                {txnRef || order.demo_transaction_ref || 'DEMO-TXN-PENDING'}
              </span>
            </div>
          </div>

          {/* Delivery & Payment Details */}
          <div className="space-y-2 text-xs text-zinc-600 border-b pb-4">
            <div className="flex justify-between">
              <span className="text-zinc-500">Customer Name:</span>
              <span className="font-semibold text-zinc-900">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Delivery Address:</span>
              <span className="font-semibold text-zinc-900 text-right max-w-xs truncate">
                {order.shipping_address}, {order.city}, {order.pin_code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Payment Status:</span>
              <span className="font-bold text-emerald-600 uppercase text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                {order.payment_status === 'paid' ? 'Paid (Simulated)' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Order Status:</span>
              <span className="font-bold text-zinc-900">{order.order_status}</span>
            </div>
            <div className="flex justify-between pt-2 text-sm font-black text-zinc-950">
              <span>Total Paid:</span>
              <span>₹{order.total_amount}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => onTrackOrder(order.id)}
              className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg"
            >
              <Package className="w-4 h-4" />
              <span>Track Order Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs py-3 rounded-xl transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
