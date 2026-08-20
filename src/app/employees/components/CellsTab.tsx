'use client';

import React from 'react';
import { Download, Plus, Edit2, Trash2 } from 'lucide-react';
import { Cell } from '../types';
import { UserProfile } from '@/context/ProfileContext';

interface CellsTabProps {
  cells: Cell[];
  currentUser: UserProfile | null | undefined;
  exportCellsToCSV: () => void;
  onOpenBulkCellModal: () => void;
  onOpenNewCellModal: () => void;
  onStartEditCell: (cell: Cell) => void;
  onDeleteCell: (cell: Cell) => void;
}

export default function CellsTab({
  cells,
  currentUser,
  exportCellsToCSV,
  onOpenBulkCellModal,
  onOpenNewCellModal,
  onStartEditCell,
  onDeleteCell
}: CellsTabProps) {
  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
            মোট সেল: {cells.length} টি
          </span>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
          <button
            type="button"
            onClick={exportCellsToCSV}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            <Download size={15} />
            <span>সেলসমূহ এক্সপোর্ট</span>
          </button>
          
          {currentUser?.role === 'ADMIN' && (
            <>
              <button
                type="button"
                onClick={onOpenBulkCellModal}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer shadow-xs"
              >
                <Plus size={15} />
                <span>বাল্ক সেল আপলোড</span>
              </button>
              
              <button
                type="button"
                onClick={onOpenNewCellModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                <Plus size={15} />
                <span>নতুন সেল (Cell) যোগ করুন</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cells List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cells.map((cell) => (
          <div key={cell.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{cell.name}</h3>
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 rounded-lg text-xs font-bold font-sans">
                  {cell._count?.employees || 0} জন কর্মরত
                </span>
              </div>
              {cell.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {cell.description}
                </p>
              )}
            </div>

            {currentUser?.role === 'ADMIN' && (
              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onStartEditCell(cell)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                  title="সম্পাদনা"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCell(cell)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
