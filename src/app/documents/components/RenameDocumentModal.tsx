'use client';

import React from 'react';
import { FileSignature, X } from 'lucide-react';

interface ManualDocument {
  id: number;
  name: string;
  fileType: string;
}

interface RenameDocumentModalProps {
  editingManualDoc: ManualDocument | null;
  editDocName: string;
  setEditDocName: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function RenameDocumentModal({
  editingManualDoc,
  editDocName,
  setEditDocName,
  onClose,
  onSubmit
}: RenameDocumentModalProps) {
  if (!editingManualDoc) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-doc-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 id="rename-doc-title" className="text-md font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileSignature size={18} className="text-indigo-500" />
            ফাইলের নাম পরিবর্তন করুন
          </h3>
          <button 
            onClick={onClose}
            aria-label="রিনেইম মডাল বন্ধ করুন"
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">ফাইলের বর্তমান নাম</label>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-900">
              {editingManualDoc.name}.{editingManualDoc.fileType}
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="renameInput" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">নতুন নাম</label>
            <input
              id="renameInput"
              type="text"
              required
              placeholder="ফাইলের নতুন নাম লিখুন"
              value={editDocName}
              onChange={(e) => setEditDocName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/30 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              aria-label="ফাইলের নতুন নাম সংরক্ষণ করুন"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              সংরক্ষণ করুন
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="বাতিল করুন"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              বাতিল
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
