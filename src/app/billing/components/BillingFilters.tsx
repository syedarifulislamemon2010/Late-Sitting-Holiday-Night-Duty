import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { toBanglaDigits, getBanglaMonthYearLabel } from '@/lib/bengali-converter';
import { Cell } from '../types';

interface BillingFiltersProps {
  currentUser: any;
  cells: Cell[];
  selectedCell: string;
  setSelectedCell: (val: string) => void;
  selectedCategory: string;
  handleCategoryChange: (val: string) => void;
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
}

export default function BillingFilters({
  currentUser,
  cells,
  selectedCell,
  setSelectedCell,
  selectedCategory,
  handleCategoryChange,
  selectedMonth,
  setSelectedMonth
}: BillingFiltersProps) {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [currentPickerYear, setCurrentPickerYear] = useState(() => new Date().getFullYear());
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
      <div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base font-sans">বিলিং ও স্মারক ফিল্টার</h3>
        <p className="text-xs text-slate-400 mt-0.5 font-sans">মাসিক ভিউ ফিল্টার এবং আপ্যায়ন ভাতার হিসাব বিবরণী।</p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {/* Select Cell Filter */}
        <select
          value={selectedCell}
          onChange={(e) => setSelectedCell(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none cursor-pointer"
        >
          {(currentUser?.role === 'ADMIN' || (currentUser?.cells && currentUser.cells.length > 1)) && (
            <option value="all">সকল সেল (All Cells)</option>
          )}
          {cells
            .filter(c => currentUser?.role === 'ADMIN' || currentUser?.cells?.some((uc: any) => uc.id === c.id))
            .map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)
          }
        </select>

        {/* Select Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none cursor-pointer"
        >
          <option value="all">সকল ক্যাটাগরি (All Categories)</option>
          <option value="LATE_SITTING">Late Sitting (লেট সিটিং)</option>
          <option value="HOLIDAY">Holiday Duty (ছুটির দিনে)</option>
          <option value="NIGHT_SHIFT">Night Shift (রাত্রিকালীন)</option>
        </select>

        {/* Custom Modern Single-Month Picker */}
        <div className="relative" ref={monthPickerRef}>
          <button
            type="button"
            onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none transition-all shadow-sm cursor-pointer"
          >
            <Calendar size={13} className="text-indigo-500 shrink-0" />
            <span>{selectedMonth === 'all' ? 'সকল মাস' : (selectedMonth ? getBanglaMonthYearLabel(selectedMonth) : 'মাস নির্বাচন করুন')}</span>
            <svg
              className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isMonthPickerOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isMonthPickerOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Popover Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentPickerYear(prev => prev - 1)}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-sans">
                  {toBanglaDigits(currentPickerYear)} সাল
                </span>
                
                <button
                  type="button"
                  onClick={() => setCurrentPickerYear(prev => prev + 1)}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* All Months Option */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth('all');
                    setIsMonthPickerOpen(false);
                  }}
                  className={`w-full py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    selectedMonth === 'all'
                      ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-md hover:bg-indigo-700'
                      : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-900/50 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-100/50'
                  }`}
                >
                  সকল মাস (Show All Months)
                </button>
              </div>

              {/* Month Selection Grid */}
              <div className="grid grid-cols-3 gap-2 py-4">
                {['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'].map((mName, idx) => {
                  const ymStr = `${currentPickerYear}-${String(idx + 1).padStart(2, '0')}`;
                  const isSelected = selectedMonth === ymStr;
                  
                  return (
                    <button
                      type="button"
                      key={ymStr}
                      onClick={() => {
                        setSelectedMonth(ymStr);
                        setIsMonthPickerOpen(false);
                      }}
                      className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-md scale-102 hover:bg-indigo-700'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {mName}
                    </button>
                  );
                })}
              </div>

              {/* Popover Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    setSelectedMonth(`${today.getFullYear()}-${mm}`);
                    setIsMonthPickerOpen(false);
                  }}
                  className="text-[9px] font-bold text-indigo-500 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  চলতি মাস রিসেট
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsMonthPickerOpen(false)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                >
                  ঠিক আছে
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
