import React from 'react';
import { useNotification } from '../context/NotificationContext';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isInfo = t.type === 'info';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start p-4 rounded-xl shadow-2xl border text-sm transition-all duration-300 transform translate-y-0 ${
              isSuccess
                ? 'bg-zinc-950 text-white border-emerald-500/40 shadow-emerald-950/20'
                : isError
                ? 'bg-zinc-950 text-white border-rose-500/40 shadow-rose-950/20'
                : 'bg-zinc-950 text-white border-zinc-700 shadow-black/40'
            }`}
          >
            <div className="mr-3 mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <XCircle className="w-5 h-5 text-rose-400" />}
              {isInfo && <Info className="w-5 h-5 text-sky-400" />}
              {!isSuccess && !isError && !isInfo && <AlertCircle className="w-5 h-5 text-amber-400" />}
            </div>

            <div className="flex-1 mr-2">
              {t.title && <p className="font-semibold text-xs tracking-wider uppercase text-zinc-300">{t.title}</p>}
              <p className="mt-0.5 text-zinc-100 text-xs leading-relaxed">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
