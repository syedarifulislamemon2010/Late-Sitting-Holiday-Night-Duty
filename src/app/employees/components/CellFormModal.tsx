'use client';

import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Cell } from '../types';

interface CellFormModalProps {
  isOpen: boolean;
  editingCell: Cell | null;
  cellForm: { name: string; description: string };
  setCellForm: React.Dispatch<React.SetStateAction<{ name: string; description: string }>>;
  errorMessage: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CellFormModal({
  isOpen,
  editingCell,
  cellForm,
  setCellForm,
  errorMessage,
  onClose,
  onSubmit
}: CellFormModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cell-form-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h3 id="cell-form-title" className="font-bold text-slate-850 dark:text-slate-100 text-base">
            {editingCell ? 'সেল তথ্য সম্পাদনা' : 'নতুন সেল (Cell) যোগ করুন'}
          </h3>
          <button 
            onClick={onClose} 
            aria-label="সেল মডাল বন্ধ করুন"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="cell_name" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">সেলের নাম *</label>
            <input
              id="cell_name"
              type="text"
              required
              placeholder="যেমন: R9, R22, JBNS ইত্যাদি"
              value={cellForm.name}
              onChange={(e) => setCellForm({ ...cellForm, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
              aria-label="সেল সংরক্ষণ করুন"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 cursor-pointer"
            >
              সেল সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
