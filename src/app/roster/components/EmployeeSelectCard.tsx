'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { Employee, Holiday } from '../types';
import EmployeeCalendarPicker from './EmployeeCalendarPicker';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface EmployeeSelectCardProps {
  employee: Employee;
  isChecked: boolean;
  selectedDates: string[];
  viewedMonth: string;
  holidays: Holiday[];
  leaves: any[];
  dutyType: string;
  onToggle: (empId: number) => void;
  onAddDate: (empId: number, dateStr: string) => void;
  onRemoveDate: (empId: number, dateStr: string) => void;
  onClearMonth: (empId: number, ym: string) => void;
  onClearAllDates: (empId: number) => void;
  onPrevMonth: (empId: number) => void;
  onNextMonth: (empId: number) => void;
}

export default function EmployeeSelectCard({
  employee,
  isChecked,
  selectedDates,
  viewedMonth,
  holidays,
  leaves,
  dutyType,
  onToggle,
  onAddDate,
  onRemoveDate,
  onClearMonth,
  onClearAllDates,
  onPrevMonth,
  onNextMonth
}: EmployeeSelectCardProps) {
  const datesCount = selectedDates?.length || 0;

  const formattedName = employee.name.startsWith('জনাব') || employee.name.startsWith('জনাবা') || employee.name.startsWith('ডাঃ') || employee.name.startsWith('ড.')
    ? employee.name
    : `জনাব ${employee.name}`;

  const initialLetter = (formattedName.replace(/^(জনাব|জনাবা|ডাঃ|ড\.)\s*/, '') || formattedName).trim().charAt(0) || 'জ';

  if (!isChecked) {
    /* =========================================================================
       Image 1: Unchecked Compact Employee Card in 3-Column Left-to-Right Grid
       ========================================================================= */
    return (
      <div
        onClick={() => onToggle(employee.id)}
        className="border border-indigo-200/90 dark:border-indigo-900/60 bg-white dark:bg-slate-900/90 rounded-2xl p-3.5 flex items-center gap-3 transition-all hover:border-indigo-400 hover:shadow-xs cursor-pointer select-none w-full"
      >
        <div className="w-5 h-5 rounded-md border-2 border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0">
          {/* Empty unchecked checkbox */}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug break-words">
            {formattedName}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight font-medium">
            {employee.designation}
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================================
     Image 2: Checked Full-Width Card with Spacious Inline Month Calendar
     ========================================================================= */
  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-3 w-full border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 shadow-sm transition-all animate-in fade-in duration-200">
      {/* Top Header Row (Matching Image 2) */}
      <div className="flex items-start justify-between gap-3 select-none pb-1">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Avatar initial circle */}
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
            {initialLetter}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">
                {formattedName}
              </h4>
              {employee.cell?.name && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0 inline-flex items-center">
                  {employee.cell.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight font-medium">
              {employee.designation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 whitespace-nowrap">
            {toBanglaDigits(datesCount)} দিন নির্বাচিত
          </span>
          <button
            type="button"
            onClick={() => onToggle(employee.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            title="তালিকা থেকে বাদ দিন"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Spacious Inline Month Calendar (Matching Image 2) */}
      <EmployeeCalendarPicker
        empId={employee.id}
        empName={employee.name}
        bankId={employee.bankId}
        ym={viewedMonth}
        selectedDates={selectedDates}
        holidays={holidays}
        leaves={leaves}
        dutyType={dutyType}
        onAddDate={onAddDate}
        onRemoveDate={onRemoveDate}
        onClearMonth={onClearMonth}
        onClearAllDates={onClearAllDates}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
    </div>
  );
}
