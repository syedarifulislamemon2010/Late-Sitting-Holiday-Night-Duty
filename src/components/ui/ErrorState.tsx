'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'ডাটা লোড করতে সমস্যা হয়েছে',
  message = 'সার্ভার থেকে তথ্য সংগ্রহ করতে ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  onRetry,
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`w-full py-10 px-4 flex flex-col items-center justify-center text-center rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">
        {title}
      </h3>
      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-sm">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          aria-label="পুনরায় চেষ্টা করুন"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw size={13} />
          পুনরায় চেষ্টা করুন
        </button>
      )}
    </div>
  );
}
