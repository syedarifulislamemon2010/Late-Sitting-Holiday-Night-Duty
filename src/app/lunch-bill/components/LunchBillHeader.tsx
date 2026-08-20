'use client';

import React from 'react';
import { 
  Printer, 
  Save, 
  Loader2, 
  Eye, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Calendar 
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface LunchBillHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  isMonthPickerOpen: boolean;
  setIsMonthPickerOpen: (open: boolean) => void;
  currentPickerYear: number;
  setCurrentPickerYear: (fn: (y: number) => number) => void;
  monthPickerRef: React.RefObject<HTMLDivElement | null>;
  workingDays: number;
  handleWorkingDaysChange: (val: string) => void;
  isAutoWorkingDays: boolean;
  setIsAutoWorkingDays: (val: boolean) => void;
  workingDaysLoading: boolean;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenPreview: () => void;
  onSave: () => void;
  onPrint: () => void;
  saving: boolean;
  generating: boolean;
}

export default function LunchBillHeader({
  selectedMonth,
  setSelectedMonth,
  isMonthPickerOpen,
  setIsMonthPickerOpen,
  currentPickerYear,
  setCurrentPickerYear,
  monthPickerRef,
  workingDays,
  handleWorkingDaysChange,
  isAutoWorkingDays,
  setIsAutoWorkingDays,
  workingDaysLoading,
  showAdvancedFilters,
  setShowAdvancedFilters,
  onOpenPreview,
  onSave,
  onPrint,
  saving,
  generating
}: LunchBillHeaderProps) {
  const monthNames = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const getBanglaMonthName = (monthStr: string): string => {
    if (!monthStr || !monthStr.includes('-')) return '';
    const [year, month] = monthStr.split('-');
    const idx = parseInt(month, 10) - 1;
    return `${monthNames[idx]} ${toBanglaDigits(year)}`;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 lg:p-6 rounded-2xl shadow-sm">
      <div className="space-y-1">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>দুপুরের খাবারের বিল বিবরণী (Lunch Bill)</span>
        </h1>
        <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
          কর্মকর্তাদের দুপুরের খাবার ভাতা বিল প্রস্তুত, অটো ক্যালকুলেশন ও প্রিন্ট ফরম্যাট।
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Bengali Month Picker */}
        <div className="relative" ref={monthPickerRef}>
          <button
            type="button"
            onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs lg:text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
          >
            <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>{getBanglaMonthName(selectedMonth) || 'মাস নির্বাচন করুন'}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {isMonthPickerOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCurrentPickerYear(y => y - 1)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {toBanglaDigits(currentPickerYear)} খ্রিষ্টাব্দ
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPickerYear(y => y + 1)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {monthNames.map((name, idx) => {
                  const mStr = `${currentPickerYear}-${String(idx + 1).padStart(2, '0')}`;
                  const isSelected = selectedMonth === mStr;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(mStr);
                        setIsMonthPickerOpen(false);
                      }}
                      className={`px-2 py-2 text-xs font-semibold rounded-xl transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Working Days */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>কার্যদিবস:</span>
          {workingDaysLoading ? (
            <Loader2 size={14} className="animate-spin text-indigo-600" />
          ) : (
            <input
              type="number"
              min="0"
              max="31"
              value={workingDays}
              onChange={e => handleWorkingDaysChange(e.target.value)}
              className="w-12 text-center font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-0.5 text-xs text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          )}
          <span>দিন</span>
        </div>

        {/* Advanced Filters Button */}
        <button
          type="button"
          onClick={() => setShowAdvancedFilters(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            showAdvancedFilters
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Sliders size={14} />
          <span>কর্তন সেটিংস</span>
          {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Save Draft Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs lg:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>সংরক্ষণ</span>
        </button>

        {/* Print / Preview Button */}
        <button
          type="button"
          onClick={onPrint}
          disabled={generating}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs lg:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
          <span>প্রিন্ট / PDF</span>
        </button>
      </div>
    </div>
  );
}
