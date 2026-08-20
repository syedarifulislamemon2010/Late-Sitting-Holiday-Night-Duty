'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
}

export default function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300 select-none font-sans">
      <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
        <span className="font-sans text-indigo-600 dark:text-indigo-400 text-sm font-extrabold">{toBanglaDigits(selectedCount)}</span> জন কর্মকর্তা নির্বাচিত
      </div>
      <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClearSelection}
          aria-label="সিলেকশন বাতিল করুন"
          className="px-3.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          বাতিল করুন
        </button>
        <button
          type="button"
          onClick={onBulkDelete}
          aria-label="নির্বাচিত সকল কর্মকর্তা মুছুন"
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950/35 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <Trash2 size={13} />
          নির্বাচিত মুছুন
        </button>
      </div>
    </div>
  );
}
