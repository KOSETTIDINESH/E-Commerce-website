import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose }) {
  const { login, register, loginAsDemoCustomer, loginAsDemoAdmin } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const res = await login(formData.email, formData.password);
        if (res.success) {
          onClose();
        } else {
          setError(res.message);
        }
      } else {
        const res = await register(formData.name, formData.email, formData.password, formData.phone);
        if (res.success) {
          onClose();
        } else {
          setError(res.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 text-left">
      <div className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 my-6">
        {/* Header */}
        <div className="p-6 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              SIX WINGS ACCOUNT
            </span>
            <h2 className="text-lg font-black font-serif">
              {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-zinc-200 text-xs font-bold uppercase tracking-wider text-center">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-3 transition ${
              mode === 'login' ? 'border-b-2 border-zinc-950 text-zinc-950' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-3 transition ${
              mode === 'register' ? 'border-b-2 border-zinc-950 text-zinc-950' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            Register
          </button>
        </div>

        {/* 1-Click Demo Logins Banner */}
        <div className="bg-amber-50 p-4 border-b border-amber-200 space-y-2">
          <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Quick College Demo Access:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={async () => {
                await loginAsDemoCustomer();
                onClose();
              }}
              className="bg-white hover:bg-amber-100 text-zinc-900 font-bold text-[11px] p-2 rounded-xl border border-amber-200 transition text-center shadow-xs"
            >
              Demo Customer
            </button>
            <button
              type="button"
              onClick={async () => {
                await loginAsDemoAdmin();
                onClose();
              }}
              className="bg-zinc-950 hover:bg-zinc-800 text-amber-400 font-bold text-[11px] p-2 rounded-xl transition text-center shadow-xs"
            >
              Demo Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Alex Turner"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Mobile Phone (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-950"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg"
            >
              <span>{loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
