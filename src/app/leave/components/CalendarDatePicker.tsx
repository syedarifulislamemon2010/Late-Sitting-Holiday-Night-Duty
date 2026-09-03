'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

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
  const containerRef = useRef<HTMLDivElement>(null);

  const getInitialDate = () => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return new Date(y, m, d);
        }
      }
    }
    return new Date();
  };

  const [currentDate, setCurrentDate] = useState<Date>(getInitialDate);

  // Sync currentDate when value changes externally
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          setCurrentDate(new Date(y, m, d));
        }
      }
    }
  }, [value]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Close when clicking outside using mousedown for reliability
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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

    const isDisabled = isWeekendOrHoliday || isOutOfRange;
    const isSelected = value === dateStr;
    const isToday = todayStr === dateStr;

    days.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={isDisabled}
        onClick={() => handleSelectDay(d)}
        className={`h-9 sm:h-10 rounded-xl transition-all duration-150 flex items-center justify-center text-xs sm:text-sm font-semibold border relative ${
          isSelected 
            ? 'calendar-day-selected ring-2 ring-indigo-400/30 scale-102 cursor-pointer z-10' 
            : isWeekendOrHoliday 
              ? 'calendar-day-holiday cursor-not-allowed font-medium' 
              : isOutOfRange
                ? 'calendar-day-disabled font-medium'
                : 'calendar-day-normal hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/40 font-bold shadow-2xs cursor-pointer'
        } ${isToday && !isSelected ? 'ring-1.5 ring-indigo-500/50 font-extrabold' : ''}`}
        style={
          isSelected
            ? { backgroundColor: '#4f46e5', color: '#ffffff', borderColor: '#4f46e5' }
            : isWeekendOrHoliday
              ? { color: '#f43f5e', backgroundColor: '#fff1f2', borderColor: '#fecdd3' }
              : isOutOfRange
                ? { color: '#94a3b8', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }
                : undefined
        }
        title={isWeekendOrHoliday ? 'ছুটির দিন / সরকারি ছুটি (আবেদনযোগ্য নয়)' : isOutOfRange ? 'অনুমোদিত তারিখের বাইরে (ডিজেবল)' : isToday ? 'আজকের দিন' : undefined}
      >
        <span>{toBanglaDigits(d)}</span>
        {isToday && !isSelected && (
          <span className="absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full" />
        )}
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative calendar-picker-container font-sans w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-semibold text-left cursor-pointer transition-all disabled:bg-slate-100 disabled:dark:bg-slate-950 disabled:cursor-not-allowed flex items-center justify-between shadow-sm hover:border-slate-300 dark:hover:border-slate-700"
      >
        <span className={value ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}>
          {getDisplayDate()}
        </span>
        <CalendarIcon size={16} className="text-slate-400 dark:text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-3.5 animate-in fade-in slide-in-from-top-1 duration-150 select-none">
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
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                {monthNamesBN[month]} {toBanglaDigits(year)}
              </span>
            </div>
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
            <div className="text-rose-500 font-extrabold" style={{ color: '#f43f5e' }}>শুক্র</div>
            <div className="text-rose-500 font-extrabold" style={{ color: '#f43f5e' }}>শনি</div>
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
