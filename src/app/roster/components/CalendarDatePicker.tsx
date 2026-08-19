'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CalendarDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  isNonWorkingDay: (dateStr: string) => boolean;
  toBanglaDigits: (num: number | string) => string;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function CalendarDatePicker({
  value,
  onChange,
  isNonWorkingDay,
  toBanglaDigits,
  minDate,
  maxDate,
  placeholder = 'তারিখ নির্বাচন করুন',
  disabled = false
}: CalendarDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const val = value ? new Date(value) : new Date();
    return isNaN(val.getTime()) ? new Date() : val;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.calendar-picker-container')) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isOpen]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(selectedDateStr);
    setIsOpen(false);
  };

  const monthNamesBN = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const getDisplayDate = () => {
    if (!value) return placeholder;
    const parts = value.split('-');
    if (parts.length !== 3) return value;
    const [y, m, d] = parts;
    return `${toBanglaDigits(parseInt(d, 10).toString())}ই ${monthNamesBN[parseInt(m, 10) - 1]} ${toBanglaDigits(y)}`;
  };

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(<div key={`empty-${i}`} className="h-9 sm:h-10" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isWeekendOrHoliday = isNonWorkingDay(dateStr);
    
    let isOutOfRange = false;
    if (minDate && dateStr < minDate) isOutOfRange = true;
    if (maxDate && dateStr > maxDate) isOutOfRange = true;

    const isDisabled = isOutOfRange;
    const isSelected = value === dateStr;

    days.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={isDisabled}
        onClick={() => handleSelectDay(d)}
        className={`h-9 sm:h-10 rounded-xl transition-all duration-150 flex items-center justify-center text-xs sm:text-sm font-semibold border ${
          isSelected 
            ? 'bg-indigo-600 text-white font-extrabold shadow-sm border-indigo-600 ring-2 ring-indigo-400/30 scale-102 cursor-pointer' 
            : isWeekendOrHoliday 
              ? 'text-red-500 bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 cursor-pointer font-bold hover:bg-red-50/50' 
              : isOutOfRange
                ? 'text-slate-300 dark:text-slate-650 bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/30 cursor-not-allowed font-medium'
                : 'text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 shadow-2xs cursor-pointer'
        }`}
        title={isWeekendOrHoliday ? 'ছুটির দিন' : undefined}
      >
        {toBanglaDigits(d)}
      </button>
    );
  }

  return (
    <div className="relative calendar-picker-container font-sans w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-semibold text-left cursor-pointer transition-all disabled:bg-slate-100 disabled:dark:bg-slate-950 disabled:cursor-not-allowed flex items-center justify-between shadow-sm"
      >
        <span>{getDisplayDate()}</span>
        <span className="text-xs text-slate-400">📅</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-35 p-3.5 animate-in fade-in slide-in-from-top-1 duration-150 select-none">
          {/* Month Bar */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
              title="পূর্ববর্তী মাস"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              {monthNamesBN[month]} {toBanglaDigits(year)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
              title="পরবর্তী মাস"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs py-1 mb-1">
            <div className="text-slate-500 dark:text-slate-400">রবি</div>
            <div className="text-slate-500 dark:text-slate-400">সোম</div>
            <div className="text-slate-500 dark:text-slate-400">মঙ্গল</div>
            <div className="text-slate-500 dark:text-slate-400">বুধ</div>
            <div className="text-slate-500 dark:text-slate-400">বৃহ</div>
            <div className="text-red-500 font-extrabold">শুক্র</div>
            <div className="text-red-500 font-extrabold">শনি</div>
          </div>
          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>
        </div>
      )}
    </div>
  );
}
