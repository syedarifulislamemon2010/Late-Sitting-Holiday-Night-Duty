'use client';

import React from 'react';
import { CheckCircle, ChevronRight, X } from 'lucide-react';

interface BillSuggestionToastProps {
  suggestion: { ref: string; category: string } | null;
  onClose: () => void;
}

export default function BillSuggestionToast({
  suggestion,
  onClose
}: BillSuggestionToastProps) {
  if (!suggestion) return null;

  return (
    <div 
      className="fixed bottom-5 right-5 z-50 max-w-[420px] p-4 bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/40 border-emerald-200 dark:border-emerald-800 border rounded-2xl shadow-xl flex flex-col gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 font-sans"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
        <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 leading-relaxed">
          ✅ অফিস আদেশ সফলভাবে তৈরি হয়েছে। 💰 এখন বিল মেমো তৈরি করতে চান?
        </div>
        <button 
          onClick={onClose} 
          aria-label="নোটিফিকেশন বন্ধ করুন"
          className="text-slate-400 hover:text-slate-600 ml-auto p-1 rounded-lg shrink-0 cursor-pointer -mt-1 -mr-1"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex justify-end mt-1">
        <a 
          href={`/billing?orderRef=${encodeURIComponent(suggestion.ref)}&category=${encodeURIComponent(suggestion.category)}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
        >
          বিলিং পেজে যান <ChevronRight size={14} />
        </a>
      </div>
    </div>
  );
}
