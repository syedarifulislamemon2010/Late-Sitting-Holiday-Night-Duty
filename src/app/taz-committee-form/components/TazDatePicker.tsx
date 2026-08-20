'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDatePickerProps } from '../types';

export default function TazDatePicker({ value, onChange, isNonWorkingDay }: CalendarDatePickerProps) {
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
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handleSelectDay = (day: number) => {
    const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(selectedDateStr);
    setIsOpen(false);
  };

  const monthNamesEN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDisplayDate = () => {
    if (!value) return 'Select Date';
    const [y, m, d] = value.split('-');
    return `${parseInt(d, 10)} ${monthNamesEN[parseInt(m, 10) - 1]} ${y}`;
  };

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isWeekendOrHoliday = isNonWorkingDay(dateStr);
    const isSelected = value === dateStr;

    days.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={isWeekendOrHoliday}
        onClick={() => handleSelectDay(d)}
        className={`w-8 h-8 flex items-center justify-center text-xs rounded-xl transition-all ${
          isSelected 
            ? 'bg-indigo-600 text-white font-bold' 
            : isWeekendOrHoliday 
              ? 'text-rose-500 bg-rose-50/10 cursor-not-allowed opacity-40' 
              : 'text-slate-700 hover:bg-slate-100 cursor-pointer font-bold dark:text-slate-200 dark:hover:bg-slate-800'
        }`}
      >
        {d}
      </button>
    );
  }

  return (
    <div className="relative calendar-picker-container w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-left cursor-pointer transition-all flex items-center justify-between shadow-sm text-sm"
      >
        <span>{getDisplayDate()}</span>
        <span className="text-xs">📅</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-3 select-none">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-900 pb-2">
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 dark:text-slate-400 cursor-pointer text-xs"
            >
              ◀
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {monthNamesEN[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 dark:text-slate-400 cursor-pointer text-xs"
            >
              ▶
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center mb-1 text-[10px] font-bold text-slate-500">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span className="text-rose-500">Fri</span>
            <span className="text-rose-500">Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">{days}</div>
        </div>
      )}
    </div>
  );
}
