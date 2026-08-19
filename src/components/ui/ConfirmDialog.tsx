'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title = 'আপনি কি নিশ্চিত?',
  description,
  confirmText = 'হ্যাঁ, নিশ্চিত করুন',
  cancelText = 'বাতিল',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
    },
    warning: {
      iconBg: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
    },
    primary: {
      iconBg: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
      confirmBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
    }
  };

  const style = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div className={`p-3 rounded-2xl shrink-0 ${style.iconBg}`}>
            <AlertTriangle size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="font-bold text-base text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="বন্ধ করুন"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label={cancelText}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            aria-label={confirmText}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 ${style.confirmBtn}`}
          >
            {isLoading ? 'প্রক্রিয়াধীন...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
