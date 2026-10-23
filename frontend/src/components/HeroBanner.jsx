import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Truck, RefreshCw, Zap } from 'lucide-react';

export default function HeroBanner({ onShopNow, onExploreAnime, onSelectSampleProduct }) {
  return (
    <section className="relative bg-zinc-950 text-white overflow-hidden border-b border-zinc-800">
      {/* Background Graphic Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-full text-xs uppercase tracking-widest text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Autumn / Winter 2026 Drop</span>
              <span className="text-zinc-600">•</span>
              <span className="text-amber-400 font-bold">Limited Atelier Run</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-serif leading-[1.08] text-white">
              ELEVATE YOUR <br />
              <span className="italic font-light text-zinc-400">SILHOUETTE.</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed font-sans">
              Six Wings redefines modern luxury streetwear. Featuring architectural boxy cuts, 
              custom 280–400 GSM French terry cottons, and collector anime series drops.
            </p>

            {/* Test Sample Product Highlight Banner */}
            <div className="p-4 bg-zinc-900/80 border border-zinc-700/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    Testing Showcase Product
                  </p>
                  <p className="text-xs text-zinc-400">
                    Signature Oversized Tee • <span className="text-emerald-400 font-bold">₹799</span> (MRP ₹1,499)
                  </p>
                </div>
              </div>
              <button
                onClick={onSelectSampleProduct}
                className="w-full sm:w-auto text-xs bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-xl transition shadow-md flex items-center justify-center space-x-1"
              >
                <span>Instant Test Item (₹799)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onShopNow}
                className="bg-white text-zinc-950 font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-full hover:bg-zinc-200 transition tracking-wider uppercase flex items-center space-x-2 shadow-2xl"
              >
                <span>Explore Shop</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreAnime}
                className="bg-zinc-900 text-white border border-zinc-700 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full hover:bg-zinc-800 transition tracking-wider uppercase"
              >
                Anime Drop
              </button>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop"
                alt="Six Wings Signature Look"
                className="w-full h-[460px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 p-4 bg-zinc-950/80 backdrop-blur-md rounded-2xl border border-zinc-800 text-left">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                  FEATURED RUN
                </span>
                <h3 className="font-bold text-white text-base mt-0.5">
                  Signature Heavyweight Oversized Tee
                </h3>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-lg font-black text-white">₹799</span>
                    <span className="text-xs text-zinc-500 line-through">₹1,499</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                      47% OFF
                    </span>
                  </div>
                  <button
                    onClick={onSelectSampleProduct}
                    className="text-xs bg-white text-zinc-950 px-3 py-1.5 rounded-lg font-bold hover:bg-zinc-200 transition"
                  >
                    Quick Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 pt-8 border-t border-zinc-900 text-left">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
            <Truck className="w-5 h-5 text-zinc-300 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Free Express Shipping</p>
              <p className="text-[11px] text-zinc-400">On all orders above ₹999</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Simulated Payments</p>
              <p className="text-[11px] text-zinc-400">UPI & QR mock test flows</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Admin Verification</p>
              <p className="text-[11px] text-zinc-400">Audit trail & order tracker</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
            <RefreshCw className="w-5 h-5 text-zinc-300 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Live Stock Control</p>
              <p className="text-[11px] text-zinc-400">Real-time inventory sync</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
