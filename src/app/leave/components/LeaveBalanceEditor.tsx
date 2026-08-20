'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface LeaveBalanceEditorProps {
  isAutoBalance: boolean;
  setIsAutoBalance: (val: boolean) => void;
  balanceLoading: boolean;
  casualTotal: string;
  setCasualTotal: (val: string) => void;
  casualUsed: string;
  setCasualUsed: (val: string) => void;
  ordinaryTotal: string;
  setOrdinaryTotal: (val: string) => void;
  ordinaryUsed: string;
  setOrdinaryUsed: (val: string) => void;
  specialTotal: string;
  setSpecialTotal: (val: string) => void;
  specialUsed: string;
  setSpecialUsed: (val: string) => void;
  validateAndSetTotal: (val: string, setTotal: (v: string) => void, usedVal: string, setUsed: (v: string) => void) => void;
  validateAndSetUsed: (val: string, setUsed: (v: string) => void, totalVal: string) => void;
}

export default function LeaveBalanceEditor({
  isAutoBalance,
  setIsAutoBalance,
  balanceLoading,
  casualTotal,
  setCasualTotal,
  casualUsed,
  setCasualUsed,
  ordinaryTotal,
  setOrdinaryTotal,
  ordinaryUsed,
  setOrdinaryUsed,
  specialTotal,
  setSpecialTotal,
  specialUsed,
  setSpecialUsed,
  validateAndSetTotal,
  validateAndSetUsed
}: LeaveBalanceEditorProps) {
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Settings size={16} className="text-indigo-600 dark:text-indigo-400" />
          ছুটির ব্যালেন্স শিট এডিটর
        </span>
      }
    >
      <div className="space-y-3.5 text-xs font-sans">
        <div className="backdrop-blur-sm bg-gradient-to-r from-indigo-50/40 to-teal-50/40 dark:from-indigo-950/20 dark:to-teal-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl p-3 flex flex-col gap-2 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔄</span>
              <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">অটো ব্যালেন্স ট্র্যাকিং</h4>
            </div>
            <button 
              type="button"
              onClick={() => setIsAutoBalance(!isAutoBalance)}
              aria-label="অটো ব্যালেন্স ট্র্যাকিং টগল করুন"
              aria-pressed={isAutoBalance}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${isAutoBalance ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span 
                className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform" 
                style={{ transform: isAutoBalance ? 'translateX(18px)' : 'translateX(4px)' }} 
              />
            </button>
          </div>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">আবেদনকারীর ব্যাংক আইডি অনুযায়ী স্বয়ংক্রিয়ভাবে ভোগকৃত ছুটি হিসাব করা হয়েছে</p>
          {balanceLoading && (
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
              <div className="h-full bg-indigo-500 w-1/3 rounded animate-[shimmer_1.5s_infinite] relative left-0" />
            </div>
          )}
        </div>

        {/* Row 1 Casual leaves */}
        <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-2">
          <p className="font-extrabold text-indigo-900 dark:text-indigo-400">নৈমিত্তিক ছুটি ব্যালেন্স:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="casualTotal" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">প্রাপ্তব্য:</label>
              <input 
                id="casualTotal"
                type="text" 
                value={casualTotal}
                onChange={(e) => validateAndSetTotal(e.target.value, setCasualTotal, casualUsed, setCasualUsed)}
                className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="casualUsed" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">ভোগকৃত (আগের):</label>
              <input 
                id="casualUsed"
                type="text" 
                value={casualUsed}
                onChange={(e) => validateAndSetUsed(e.target.value, setCasualUsed, casualTotal)}
                className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Row 2 Ordinary leaves */}
        <div className="p-3 bg-teal-50/20 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/50 rounded-xl space-y-2">
          <p className="font-extrabold text-teal-900 dark:text-teal-400">সাধারণ ছুটি ব্যালেন্স:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="ordinaryTotal" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">প্রাপ্তব্য:</label>
              <input 
                id="ordinaryTotal"
                type="text" 
                value={ordinaryTotal}
                onChange={(e) => validateAndSetTotal(e.target.value, setOrdinaryTotal, ordinaryUsed, setOrdinaryUsed)}
                className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="ordinaryUsed" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">ভোগকৃত:</label>
              <input 
                id="ordinaryUsed"
                type="text" 
                value={ordinaryUsed}
                onChange={(e) => validateAndSetUsed(e.target.value, setOrdinaryUsed, ordinaryTotal)}
                className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Row 3 Special leaves */}
        <div className="p-3 bg-purple-50/20 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-xl space-y-2">
          <p className="font-extrabold text-purple-900 dark:text-purple-400">বিশেষ ছুটি ব্যালেন্স:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="specialTotal" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">প্রাপ্তব্য:</label>
              <input 
                id="specialTotal"
                type="text" 
                value={specialTotal}
                onChange={(e) => validateAndSetTotal(e.target.value, setSpecialTotal, specialUsed, setSpecialUsed)}
                className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="specialUsed" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">ভোগকৃত:</label>
              <input 
                id="specialUsed"
                type="text" 
                value={specialUsed}
                onChange={(e) => validateAndSetUsed(e.target.value, setSpecialUsed, specialTotal)}
                className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-550"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
