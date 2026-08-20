'use client';

import React, { useState, useEffect } from 'react';

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
    days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isWeekendOrHoliday = isNonWorkingDay(dateStr);
    
    let isOutOfRange = false;
    if (minDate && dateStr < minDate) isOutOfRange = true;
    if (maxDate && dateStr > maxDate) isOutOfRange = true;

    const isDisabled = isWeekendOrHoliday || isOutOfRange;
    const isSelected = value === dateStr;

    days.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={isDisabled}
        onClick={() => handleSelectDay(d)}
        className={`w-8 h-8 flex items-center justify-center text-xs rounded-xl transition-all ${
          isSelected 
            ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-500/30' 
            : isWeekendOrHoliday 
              ? 'text-rose-500 bg-rose-50/10 dark:bg-rose-950/5 cursor-not-allowed opacity-90 font-medium' 
              : isOutOfRange
                ? 'text-slate-400 dark:text-slate-600 bg-slate-50/5 dark:bg-slate-900/5 cursor-not-allowed font-medium'
                : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30 cursor-pointer font-black'
        }`}
        title={isWeekendOrHoliday ? 'ছুটির দিন (ডিজেবল)' : undefined}
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
        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-semibold text-left cursor-pointer transition-all disabled:bg-slate-100 disabled:dark:bg-slate-950 disabled:cursor-not-allowed flex items-center justify-between shadow-sm"
      >
        <span>{getDisplayDate()}</span>
        <span className="text-xs text-slate-400 dark:text-slate-400">📅</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-3 animate-in fade-in slide-in-from-top-1 duration-150 select-none">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-900 pb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer text-xs font-extrabold"
            >
              ◀
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {monthNamesBN[month]} {toBanglaDigits(year)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer text-xs font-extrabold"
            >
              ▶
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center mb-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>রবি</span>
            <span>সোম</span>
            <span>মঙ্গল</span>
            <span>বুধ</span>
            <span>বৃহ</span>
            <span className="text-rose-500 font-bold">শুক্র</span>
            <span className="text-rose-500 font-bold">শনি</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {days}
          </div>
        </div>
      )}
    </div>
  );
}
