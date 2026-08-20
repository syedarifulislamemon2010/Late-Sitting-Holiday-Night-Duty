'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Holiday, LeaveRecord, getHolidayStatus, isDateDisabledForType } from '../types';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface EmployeeCalendarPickerProps {
  empId: number;
  empName: string;
  bankId: string | null;
  ym: string;
  selectedDates: string[];
  holidays: Holiday[];
  leaves: LeaveRecord[];
  dutyType: string;
  onAddDate: (empId: number, dateStr: string) => void;
  onRemoveDate: (empId: number, dateStr: string) => void;
  onClearMonth: (empId: number, ym: string) => void;
  onClearAllDates: (empId: number) => void;
  onPrevMonth: (empId: number) => void;
  onNextMonth: (empId: number) => void;
}

export default function EmployeeCalendarPicker({
  empId,
  bankId,
  ym,
  selectedDates,
  holidays,
  leaves,
  dutyType,
  onAddDate,
  onRemoveDate,
  onClearMonth,
  onClearAllDates,
  onPrevMonth,
  onNextMonth
}: EmployeeCalendarPickerProps) {
  const [yearStr, monthStr] = ym.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-indexed

  const lastDay = new Date(year, month, 0).getDate();
  const cells = [];

  for (let day = 1; day <= lastDay; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0: Sun, 5: Fri, 6: Sat
    const dayNamesBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
    const dayName = dayNamesBn[dayOfWeek];

    const isSelected = (selectedDates || []).includes(dateStr);
    const holidayStatus = getHolidayStatus(dateStr, holidays);

    cells.push({
      day,
      dateStr,
      dayName,
      dayOfWeek,
      isSelected,
      ...holidayStatus
    });
  }

  const banglaMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const banglaMonthLabel = `${banglaMonths[month - 1]} ${toBanglaDigits(yearStr)}`;
  const hasMonthSelections = (selectedDates || []).some(d => d.startsWith(ym));

  return (
    <div className="space-y-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 no-print flex-1 w-full min-w-0 font-sans select-none">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ডিউটি তারিখসমূহ:</span>
        {hasMonthSelections && (
          <button
            type="button"
            onClick={() => onClearMonth(empId, ym)}
            className="text-[10px] font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            এই মাসের সব মুছুন
          </button>
        )}
      </div>

      {/* Month Selector Bar */}
      <div className="flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
        <button
          type="button"
          onClick={() => onPrevMonth(empId)}
          className="p-1 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
          title="পূর্ববর্তী মাস"
        >
          <ChevronLeft size={15} />
        </button>

        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wide">
          {banglaMonthLabel}
        </span>

        <button
          type="button"
          onClick={() => onNextMonth(empId)}
          className="p-1 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
          title="পরবর্তী মাস"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Weekday headers with Red Friday & Saturday */}
      <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-xs py-0.5">
        <div className="text-slate-500 dark:text-slate-400">রবি</div>
        <div className="text-slate-500 dark:text-slate-400">সোম</div>
        <div className="text-slate-500 dark:text-slate-400">মঙ্গল</div>
        <div className="text-slate-500 dark:text-slate-400">বুধ</div>
        <div className="text-slate-500 dark:text-slate-400">বৃহ</div>
        <div className="text-red-500 font-extrabold">শুক্র</div>
        <div className="text-red-500 font-extrabold">শনি</div>
      </div>

      {/* Modern, compact rounded date boxes grid */}
      <div className="grid grid-cols-7 gap-1.5 font-sans">
        {/* Pad grid for initial day of month */}
        {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, idx) => (
          <div key={`pad-${idx}`} className="h-8.5 sm:h-9.5 w-full" />
        ))}

        {cells.map(c => {
          const isDisabled = isDateDisabledForType(c.isWorkingDay, dutyType);

          // Real-time leave conflict warning check
          const leaveConflict = bankId
            ? leaves.find(l => l.bankId === bankId && l.startDate <= c.dateStr && l.endDate >= c.dateStr)
            : null;

          const leaveTypeBn = leaveConflict
            ? leaveConflict.leaveType === 'CASUAL'
              ? 'নৈমিত্তিক ছুটি'
              : leaveConflict.leaveType === 'POST_FACTO'
                ? 'ঘটনাত্তোর নৈমিত্তিক'
                : 'কর্মস্থল ত্যাগসহ নৈমিত্তিক'
            : '';
          const leaveTooltip = leaveConflict
            ? `\n⚠️ ছুটি সংঘর্ষ: ${leaveTypeBn} (${leaveConflict.startDate.split('-').reverse().join('-')} হতে ${leaveConflict.endDate.split('-').reverse().join('-')})`
            : '';

          const tooltipText = `${c.dateStr} (${c.label})${isDisabled ? ' - এই ক্যাটাগরিতে ডিজেবল' : ''}${leaveTooltip}`;

          return (
            <button
              type="button"
              key={c.dateStr}
              disabled={isDisabled}
              title={tooltipText}
              onClick={() => {
                if (c.isSelected) {
                  onRemoveDate(empId, c.dateStr);
                } else {
                  onAddDate(empId, c.dateStr);
                }
              }}
              className={`relative h-8.5 sm:h-9.5 w-full rounded-lg transition-all duration-150 flex items-center justify-center text-xs sm:text-sm font-bold border ${
                c.isSelected
                  ? 'bg-indigo-600 text-white font-extrabold shadow-sm border-indigo-600 ring-2 ring-indigo-400/30 scale-102 cursor-pointer'
                  : isDisabled
                    ? c.isWeekend
                      ? 'bg-red-50/50 dark:bg-red-950/25 border-red-200/60 dark:border-red-900/40 text-red-500 dark:text-red-400 font-bold cursor-not-allowed'
                      : c.isGovtHoliday
                        ? 'bg-amber-50/60 dark:bg-amber-950/25 border-amber-200/60 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 font-bold cursor-not-allowed'
                        : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-400 dark:text-slate-500 font-semibold cursor-not-allowed'
                    : leaveConflict
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 cursor-pointer font-bold'
                      : !c.isWorkingDay
                        ? 'bg-red-50/40 dark:bg-red-950/30 border-red-200/80 dark:border-red-800/80 text-red-600 dark:text-red-400 font-bold hover:bg-red-100/70 cursor-pointer'
                        : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 shadow-2xs cursor-pointer font-bold'
              }`}
            >
              <span>{c.day}</span>
              {c.isGovtHoliday && (
                <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title={`সরকারি ছুটি: ${c.holidayName}`} />
              )}
              {leaveConflict && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2" title={`ছুটি সংঘর্ষ: ${leaveTypeBn}`}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected dates summary across all months */}
      {selectedDates && selectedDates.length > 0 && (
        <div className="pt-2 border-t border-dashed border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              মোট নির্বাচিত তারিখ: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold font-sans">{toBanglaDigits(selectedDates.length)}টি</span>
            </p>
            <button
              type="button"
              onClick={() => onClearAllDates(empId)}
              className="text-[9px] font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              সব তারিখ মুছুন
            </button>
          </div>

          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
            {[...selectedDates].sort().map(d => {
              const [y, m, dayNum] = d.split('-');
              const mIndex = parseInt(m, 10) - 1;
              const formatted = `${toBanglaDigits(parseInt(dayNum, 10).toString())} ${banglaMonths[mIndex]}`;
              return (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-[9px] font-bold shadow-2xs"
                >
                  {formatted}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveDate(empId, d);
                    }}
                    className="hover:text-red-500 cursor-pointer ml-0.5 text-xs font-bold"
                    title="তারিখটি বাদ দিন"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
