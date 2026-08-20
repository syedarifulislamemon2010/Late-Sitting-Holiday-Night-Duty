'use client';

import React from 'react';
import { Search, Filter, CheckCircle } from 'lucide-react';
import { Cell } from '../types';

interface LunchBillFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterCell: string;
  setFilterCell: (c: string) => void;
  filterType: string;
  setFilterType: (t: string) => void;
  cells: Cell[];
  showAdvancedFilters: boolean;
  deductionMode: 'manual' | 'flat' | 'designation';
  setDeductionMode: (m: 'manual' | 'flat' | 'designation') => void;
  flatDeductionRate: number;
  applyFlatRate: (rate: number) => void;
  designationRates: {
    SPO: number;
    PO: number;
    SO_IT: number;
    O_IT: number;
    EXEC: number;
  };
  applyDesignationRates: (field: keyof { SPO: number; PO: number; SO_IT: number; O_IT: number; EXEC: number }, val: number) => void;
  isAdmin: boolean;
}

export default function LunchBillFilters({
  searchQuery,
  setSearchQuery,
  filterCell,
  setFilterCell,
  filterType,
  setFilterType,
  cells,
  showAdvancedFilters,
  deductionMode,
  setDeductionMode,
  flatDeductionRate,
  applyFlatRate,
  designationRates,
  applyDesignationRates,
  isAdmin
}: LunchBillFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search & Basic Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="কর্মকর্তার নাম, পদবি বা ব্যাংক আইডি দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterCell}
              onChange={e => setFilterCell(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">সকল সেল ও এক্সিকিউটিভ</option>
              <option value="0">নির্বাহী কর্মকর্তাগণ (DGM/AGM)</option>
              {cells.map(c => (
                <option key={c.id} value={c.id.toString()}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">সকল কর্মকর্তা</option>
            <option value="officer">সেল কর্মকর্তাবৃন্দ</option>
            <option value="executive">এক্সিকিউটিভবৃন্দ</option>
          </select>
        </div>
      </div>

      {/* Advanced Deduction Controls Box */}
      {showAdvancedFilters && (
        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-indigo-100 dark:border-indigo-900/40">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
              অতিরিক্ত কর্তন ব্যবস্থাপনা (Additional Deductions):
            </span>
            
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="deductionMode"
                  checked={deductionMode === 'manual'}
                  onChange={() => setDeductionMode('manual')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                ম্যানুয়াল
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="deductionMode"
                  checked={deductionMode === 'flat'}
                  onChange={() => setDeductionMode('flat')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                সবার জন্য সমান
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="deductionMode"
                  checked={deductionMode === 'designation'}
                  onChange={() => setDeductionMode('designation')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                পদবি ভিত্তিক
              </label>
            </div>
          </div>

          {deductionMode === 'flat' && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">সমান কর্তনের পরিমাণ (টাকা):</span>
              <input
                type="number"
                min="0"
                value={flatDeductionRate}
                onChange={e => applyFlatRate(parseInt(e.target.value, 10) || 0)}
                className="w-24 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {deductionMode === 'designation' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Executive (DGM/AGM)</label>
                <input
                  type="number"
                  min="0"
                  value={designationRates.EXEC}
                  onChange={e => applyDesignationRates('EXEC', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">SPO</label>
                <input
                  type="number"
                  min="0"
                  value={designationRates.SPO}
                  onChange={e => applyDesignationRates('SPO', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">PO</label>
                <input
                  type="number"
                  min="0"
                  value={designationRates.PO}
                  onChange={e => applyDesignationRates('PO', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">SO (IT)</label>
                <input
                  type="number"
                  min="0"
                  value={designationRates.SO_IT}
                  onChange={e => applyDesignationRates('SO_IT', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Officer (IT)</label>
                <input
                  type="number"
                  min="0"
                  value={designationRates.O_IT}
                  onChange={e => applyDesignationRates('O_IT', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
