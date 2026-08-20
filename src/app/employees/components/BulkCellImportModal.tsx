'use client';

import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface BulkCellImportModalProps {
  isOpen: boolean;
  bulkCellError: string;
  bulkCellText: string;
  setBulkCellText: (val: string) => void;
  bulkCellImporting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function BulkCellImportModal({
  isOpen,
  bulkCellError,
  bulkCellText,
  setBulkCellText,
  bulkCellImporting,
  onClose,
  onSubmit
}: BulkCellImportModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-cell-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h3 id="bulk-cell-title" className="font-bold text-slate-850 dark:text-slate-100 text-base">
            সেল বাল্ক টেক্সট আপলোড (Bulk Import Cells)
          </h3>
          <button 
            onClick={onClose} 
            aria-label="বাল্ক সেল মডাল বন্ধ করুন"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {bulkCellError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              {bulkCellError}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="bulk_cell_file" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              CSV / Text ফাইল আপলোড করুন
            </label>
            <input
              id="bulk_cell_file"
              type="file"
              accept=".csv,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const text = event.target?.result as string;
                  setBulkCellText(text);
                };
                reader.readAsText(file);
              }}
              className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950/40 dark:file:text-indigo-300 hover:file:bg-indigo-100 transition-all cursor-pointer border border-dashed border-slate-300 dark:border-slate-800 p-2 rounded-xl bg-slate-50/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bulk_cell_text" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              সেলের নামসমূহ (প্রতি লাইনে একটি) *
            </label>
            <textarea
              id="bulk_cell_text"
              required
              rows={8}
              placeholder={`যেমন:\nR9\nR22\nJBNS\nCBS Integrated Development Cell`}
              value={bulkCellText}
              onChange={(e) => setBulkCellText(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 font-sans">
            <button
              type="button"
              onClick={onClose}
              aria-label="বাতিল করুন"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={bulkCellImporting}
              aria-label="সেলসমূহ ইম্পোর্ট করুন"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 cursor-pointer"
            >
              {bulkCellImporting ? "আমদানি হচ্ছে..." : "ইম্পোর্ট করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
