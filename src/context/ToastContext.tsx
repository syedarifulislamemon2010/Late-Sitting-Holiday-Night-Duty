'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500); // Auto close after 4.5 seconds
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
      
      {/* Toast Render Portal Panel */}
      <div className="no-print fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => {
          let icon = <Info className="text-blue-500" size={18} />;
          let containerClass = 'bg-white dark:bg-slate-900 border-blue-100 dark:border-blue-900/40 text-slate-800 dark:text-slate-200';
          
          if (toast.type === 'success') {
            icon = <CheckCircle2 className="text-emerald-500" size={18} />;
            containerClass = 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200';
          } else if (toast.type === 'error') {
            icon = <AlertCircle className="text-rose-500" size={18} />;
            containerClass = 'bg-white dark:bg-slate-900 border-rose-100 dark:border-rose-900/40 text-slate-800 dark:text-slate-200';
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle className="text-amber-500" size={18} />;
            containerClass = 'bg-white dark:bg-slate-900 border-amber-100 dark:border-amber-900/40 text-slate-800 dark:text-slate-200';
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border shadow-lg transform transition-all duration-200 animate-in slide-in-from-right-4 ease-premium ${containerClass}`}
              style={{
                animationDuration: '200ms',
                letterSpacing: 'normal'
              }}
            >
              <div className="shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
