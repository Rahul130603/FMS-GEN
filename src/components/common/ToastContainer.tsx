import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full"
    >
      {toasts.map((toast) => {
        let icon = <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />;
        let borderClass = 'border-emerald-200 bg-white';

        if (toast.type === 'error') {
          icon = <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />;
          borderClass = 'border-rose-200 bg-white';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />;
          borderClass = 'border-amber-200 bg-white';
        } else if (toast.type === 'info') {
          icon = <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />;
          borderClass = 'border-blue-200 bg-white';
        }

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border ${borderClass} transform transition-all duration-200 ease-out translate-y-0`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900">{toast.title}</h4>
              {toast.description && (
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
