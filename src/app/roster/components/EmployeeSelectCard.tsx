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

  return (
    <div
      className={`break-inside-avoid mb-3.5 inline-block w-full align-top border rounded-2xl transition-all duration-200 ${
        isChecked
          ? 'border-2 border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-sm p-4'
          : 'border border-indigo-200/90 dark:border-indigo-900/60 bg-white dark:bg-slate-900/80 hover:border-indigo-400 dark:hover:border-indigo-700 hover:shadow-xs p-3.5'
      }`}
    >
      {/* Card Header */}
      {!isChecked ? (
        /* Image 1 Unchecked / Simple Card Layout */
        <div
          onClick={() => onToggle(employee.id)}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-5 h-5 rounded-md border-2 border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 transition-colors">
            {/* Unchecked state */}
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
      ) : (
        /* Image 2 Checked / Expanded Header Layout */
        <div className="flex items-start justify-between gap-2.5 select-none pb-1">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            {/* Avatar circle */}
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              {initialLetter}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">
                  {formattedName}
                </h4>
                {employee.cell?.name && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                    {employee.cell.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight font-medium">
                {employee.designation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
      )}

      {/* Inline In-Card Calendar (Expands directly under employee name when checked) */}
      {isChecked && (
        <div className="animate-in fade-in duration-200">
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
      )}
    </div>
  );
}
