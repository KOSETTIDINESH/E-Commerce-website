import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Lock,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

export default function PaymentSimulatorModal({
  order,
  onClose,
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentCancelled
}) {
  const { showToast, fetchNotifications } = useNotification();

  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [simulationState, setSimulationState] = useState('idle'); // 'idle' | 'success' | 'failed' | 'cancelled'
  const [errorMessage, setErrorMessage] = useState('');
  const [demoTxnRef, setDemoTxnRef] = useState('');
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const demoUpiId = 'sixwings.demo@upi';

  const copyUpiToClipboard = () => {
    navigator.clipboard.writeText(demoUpiId);
    setCopiedUpi(true);
    showToast('info', 'Copied', `Demo UPI ID copied: ${demoUpiId}`);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSimulateSuccess = async () => {
    if (isProcessing || hasConfirmed) return; // Prevent duplicate clicks
    setIsProcessing(true);
    setSimulationState('processing');

    try {
      const res = await api.post('/payments/simulate', {
        orderId: order.id,
        action: 'success',
        idempotencyKey: `idem-${Date.now()}`
      });

      if (res.success) {
        setHasConfirmed(true);
        setDemoTxnRef(res.demo_transaction_ref);
        setSimulationState('success');

        // Confetti explosion
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        showToast('success', 'Demo Payment Complete', `Ref: ${res.demo_transaction_ref}`);
        fetchNotifications();

        setTimeout(() => {
          onPaymentSuccess(res.order || order, res.demo_transaction_ref);
        }, 500);
      } else {
        setSimulationState('failed');
        setErrorMessage(res.message || 'Payment simulation failed.');
        showToast('error', 'Simulation Error', res.message);
      }
    } catch (err) {
      setSimulationState('failed');
      const msg = err.data && err.data.message ? err.data.message : err.message || 'Simulation encountered an error.';
      setErrorMessage(msg);
      showToast('error', 'Simulation Failed', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateFailure = async () => {
    if (isProcessing || hasConfirmed) return;
    setIsProcessing(true);
    setSimulationState('processing');

    try {
      const res = await api.post('/payments/simulate', {
        orderId: order.id,
        action: 'failed',
        failureReason: 'Customer triggered simulated bank decline test.'
      });

      setSimulationState('failed');
      setErrorMessage('Simulated transaction failed: Simulated bank network decline. Order remains unpaid.');
      showToast('error', 'Payment Failed', 'Order remains unpaid. You may retry anytime.');
      fetchNotifications();
      if (onPaymentFailure) onPaymentFailure(res.order || order);
    } catch (err) {
      setSimulationState('failed');
      setErrorMessage(err.message || 'Payment failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPayment = async () => {
    if (isProcessing || hasConfirmed) return;
    setIsProcessing(true);

    try {
      const res = await api.post('/payments/simulate', {
        orderId: order.id,
        action: 'cancelled'
      });

      setSimulationState('cancelled');
      showToast('info', 'Payment Cancelled', 'Simulated checkout was cancelled.');
      fetchNotifications();
      if (onPaymentCancelled) onPaymentCancelled(res.order || order);
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setSimulationState('idle');
    setErrorMessage('');
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-zinc-900 my-6 text-left">
        {/* CRITICAL PROMINENT DISCLAIMER BANNER */}
        <div className="bg-amber-400 text-zinc-950 px-4 py-2 text-center text-xs font-black tracking-widest uppercase flex items-center justify-center space-x-1.5 shadow-md">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>DEMO PAYMENT — NO REAL MONEY TRANSFERRED</span>
        </div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
              <Smartphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                IN-APP TEST GATEWAY
              </span>
              <h2 className="text-base sm:text-lg font-black font-serif">
                UPI & QR Payment Simulator
              </h2>
            </div>
          </div>

          {simulationState === 'idle' && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Amount & Order ID Bar */}
        <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between border-b border-zinc-800">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              Payable Amount
            </p>
            <p className="text-2xl font-black text-white tracking-tight">
              ₹{order ? order.total_amount : 0}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              Order ID
            </p>
            <p className="text-xs font-mono font-bold text-amber-400 bg-zinc-800 px-2.5 py-1 rounded-md">
              {order ? order.id : 'SW-2026-XXXX'}
            </p>
          </div>
        </div>

        {/* Simulator Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {simulationState === 'idle' && (
            <>
              {/* Simulated QR Code Representation */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <div className="relative p-3 bg-white rounded-xl shadow-md border border-zinc-200">
                  {/* Styled Dynamic Mock QR Graphic */}
                  <svg className="w-40 h-40 text-zinc-950" viewBox="0 0 100 100" fill="currentColor">
                    {/* Top-Left Finder */}
                    <rect x="5" y="5" width="28" height="28" rx="4" fill="currentColor" />
                    <rect x="9" y="9" width="20" height="20" rx="2" fill="white" />
                    <rect x="13" y="13" width="12" height="12" rx="2" fill="currentColor" />

                    {/* Top-Right Finder */}
                    <rect x="67" y="5" width="28" height="28" rx="4" fill="currentColor" />
                    <rect x="71" y="9" width="20" height="20" rx="2" fill="white" />
                    <rect x="75" y="13" width="12" height="12" rx="2" fill="currentColor" />

                    {/* Bottom-Left Finder */}
                    <rect x="5" y="67" width="28" height="28" rx="4" fill="currentColor" />
                    <rect x="9" y="71" width="20" height="20" rx="2" fill="white" />
                    <rect x="13" y="75" width="12" height="12" rx="2" fill="currentColor" />

                    {/* Random Dynamic Matrix Data Blocks */}
                    <rect x="38" y="10" width="6" height="6" />
                    <rect x="48" y="16" width="6" height="6" />
                    <rect x="38" y="26" width="12" height="6" />
                    <rect x="10" y="38" width="6" height="12" />
                    <rect x="24" y="44" width="8" height="8" />
                    <rect x="38" y="40" width="24" height="20" rx="2" fill="#2563eb" />
                    <text x="50" y="54" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">6W</text>
                    <rect x="68" y="38" width="8" height="8" />
                    <rect x="82" y="44" width="6" height="12" />
                    <rect x="38" y="66" width="8" height="8" />
                    <rect x="52" y="72" width="12" height="6" />
                    <rect x="70" y="68" width="14" height="6" />
                    <rect x="80" y="80" width="10" height="10" />
                  </svg>

                  {/* Sweep scan line effect */}
                  <div className="absolute inset-x-3 top-3 h-0.5 bg-amber-500 opacity-60 animate-bounce" />
                </div>

                <p className="mt-3 text-[11px] text-zinc-500 font-medium">
                  Scan simulation placeholder • Real UPI apps not connected
                </p>
              </div>

              {/* Clearly Labeled Demo UPI ID with Copy Button */}
              <div className="p-3.5 bg-zinc-100 rounded-2xl flex items-center justify-between border border-zinc-200">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    DEMO UPI ID:
                  </span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-zinc-900">
                    {demoUpiId}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={copyUpiToClipboard}
                  className="bg-white hover:bg-zinc-200 text-zinc-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-300 transition flex items-center space-x-1"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security & Non-PIN Guarantee Notice */}
              <div className="flex items-start space-x-2 text-[11px] text-zinc-500 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-zinc-800">Security Guarantee:</strong> This simulator never requests a UPI PIN, bank password, OTP, or credit/debit card credentials.
                </p>
              </div>

              {/* THREE SPECIFIED SIMULATION ACTION BUTTONS */}
              <div className="space-y-2.5 pt-2">
                {/* 1. Simulate Successful Payment */}
                <button
                  type="button"
                  disabled={isProcessing || hasConfirmed}
                  onClick={handleSimulateSuccess}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg active:scale-[0.99] disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Successful Payment</span>
                </button>

                {/* 2. Simulate Failed Payment */}
                <button
                  type="button"
                  disabled={isProcessing || hasConfirmed}
                  onClick={handleSimulateFailure}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm py-3 rounded-xl transition flex items-center justify-center space-x-2 shadow-md active:scale-[0.99] disabled:opacity-40"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Simulate Failed Payment</span>
                </button>

                {/* 3. Cancel Payment */}
                <button
                  type="button"
                  disabled={isProcessing || hasConfirmed}
                  onClick={handleCancelPayment}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs py-2.5 rounded-xl transition border border-zinc-300"
                >
                  Cancel Payment
                </button>
              </div>
            </>
          )}

          {/* Processing State */}
          {simulationState === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
              <h3 className="text-base font-extrabold text-zinc-900">
                Processing Simulated Transaction...
              </h3>
              <p className="text-xs text-zinc-500 max-w-xs">
                Communicating with in-app mock banking ledger. Verifying order #{order ? order.id : ''}...
              </p>
            </div>
          )}

          {/* Success State */}
          {simulationState === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-zinc-950 font-serif">
                Simulated Payment Successful!
              </h3>
              <div className="p-3 bg-zinc-100 rounded-xl font-mono text-xs text-zinc-800 border border-zinc-200">
                Demo Reference: <span className="font-bold text-emerald-600">{demoTxnRef}</span>
              </div>
              <p className="text-xs text-zinc-500">
                Updating database and redirecting to order confirmation...
              </p>
            </div>
          )}

          {/* Failed State with Retry */}
          {simulationState === 'failed' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-lg">
                <XCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-zinc-950">
                Simulated Payment Declined
              </h3>
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-200 max-w-sm">
                {errorMessage || 'Simulated transaction was declined. Your order remains unpaid.'}
              </p>
              <div className="flex gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs py-3 rounded-xl transition"
                >
                  Retry Payment Simulation
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs py-3 rounded-xl border border-zinc-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Cancelled State */}
          {simulationState === 'cancelled' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-base font-extrabold text-zinc-900">
                Payment Simulation Cancelled
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm">
                The payment simulation was cancelled by the user. The order is stored as unpaid and can be resumed anytime.
              </p>
              <div className="flex gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs py-3 rounded-xl transition"
                >
                  Retry Now
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs py-3 rounded-xl border border-zinc-300 transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
