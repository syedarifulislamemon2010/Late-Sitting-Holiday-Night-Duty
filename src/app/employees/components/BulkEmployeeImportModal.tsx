'use client';

import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Cell } from '../types';

interface BulkEmployeeImportModalProps {
  isOpen: boolean;
  bulkError: string;
  bulkEmpCellId: string;
  setBulkEmpCellId: (val: string) => void;
  bulkEmpText: string;
  setBulkEmpText: (val: string) => void;
  bulkImporting: boolean;
  isImageImportLoading: boolean;
  cells: Cell[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}

export default function BulkEmployeeImportModal({
  isOpen,
  bulkError,
  bulkEmpCellId,
  setBulkEmpCellId,
  bulkEmpText,
  setBulkEmpText,
  bulkImporting,
  isImageImportLoading,
  cells,
  onClose,
  onSubmit,
  onPaste
}: BulkEmployeeImportModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-emp-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h3 id="bulk-emp-title" className="font-bold text-slate-850 dark:text-slate-100 text-base">
            কর্মকর্তা বাল্ক টেক্সট আপলোড (Bulk Import)
          </h3>
          <button 
            onClick={onClose} 
            aria-label="বাল্ক ইম্পোর্ট মডাল বন্ধ করুন"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {bulkError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              {bulkError}
            </div>
          )}

          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-xs space-y-1">
            <p className="font-bold text-indigo-700 dark:text-indigo-400">💡 ক্লিপবোর্ড ইমেজ ইম্পোর্ট (Clipboard Image Import):</p>
            <p className="text-slate-600 dark:text-slate-400 leading-normal">
              কর্মকর্তাদের নামের তালিকা সম্বলিত কোনো ইমেজ কপি করা থাকলে সরাসরি এই টেক্সটবক্সে পেস্ট (<kbd className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded shadow-xs text-[10px] font-sans font-bold border border-slate-200 dark:border-slate-700">Ctrl + V</kbd>) করুন! কৃত্রিম বুদ্ধিমত্তা স্বয়ংক্রিয়ভাবে টেক্সট হিসেবে রূপান্তর করে দেবে।
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bulk_emp_cell_id" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">১. সেল সিলেক্ট করুন (ঐচ্ছিক)</label>
            <select
              id="bulk_emp_cell_id"
              value={bulkEmpCellId}
              onChange={(e) => setBulkEmpCellId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-bold"
            >
              <option value="">সেল নির্বাচন করুন (Select Cell)</option>
              {cells.map((c) => (
                <option key={c.id} value={c.id.toString()}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bulk_cell_file" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              অথবা CSV / Text ফাইল আপলোড করুন
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
                  setBulkEmpText(text);
                };
                reader.readAsText(file);
              }}
              className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950/40 dark:file:text-indigo-300 hover:file:bg-indigo-100 transition-all cursor-pointer border border-dashed border-slate-300 dark:border-slate-800 p-2 rounded-xl bg-slate-50/20"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="bulk_emp_text" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                ২. কর্মকর্তার নাম ও পদবী (প্রতি লাইনে একজন) *
              </label>
              {isImageImportLoading && (
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 border border-indigo-600 border-t-transparent rounded-full animate-spin inline-block" />
                  ... বিশ্লেষণ করা হচ্ছে ...
                </span>
              )}
            </div>
            <textarea
              id="bulk_emp_text"
              required
              rows={8}
              placeholder={`যেমন (হেডার সহ অথবা ছাড়া):\nনাম,পদবী,ব্যাংক আইডি,নথি নং,মোবাইল নম্বর,সেল\nজনাব মোঃ আশরাফুল ইসলাম,সিনিয়র অফিসার,026799,SO(Com)-026799,01712345678,CBS Integrated Development Cell`}
              value={bulkEmpText}
              onChange={(e) => setBulkEmpText(e.target.value)}
              onPaste={onPaste}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 leading-relaxed"
              disabled={isImageImportLoading}
            />
            <p className="text-[10px] text-slate-400">
              প্যাটার্ন: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-bold">নাম,পদবী,ব্যাংক আইডি,নথি নং,মোবাইল নম্বর,সেল</code>
            </p>
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
              disabled={bulkImporting || isImageImportLoading}
              aria-label="কর্মকর্তাবৃন্দ ইম্পোর্ট করুন"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 cursor-pointer"
            >
              {bulkImporting ? 'আমদানি হচ্ছে...' : 'ইম্পোর্ট করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
