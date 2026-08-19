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

  return (
    <div
      className={`break-inside-avoid mb-3.5 inline-block w-full align-top border rounded-2xl transition-all duration-200 ${
        isChecked
          ? 'border-2 border-indigo-500 dark:border-indigo-400 bg-white dark:bg-slate-900 shadow-md ring-1 ring-indigo-500/20 p-3.5 sm:p-4'
          : 'border-indigo-200/70 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs p-3.5'
      }`}
    >
      {/* Card Header with Checkbox & Employee Details */}
      <div
        onClick={() => onToggle(employee.id)}
        className="flex items-start justify-between gap-2.5 cursor-pointer select-none pb-1"
      >
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div
            className={`w-4 h-4 border rounded flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
              isChecked
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            {isChecked && <Check size={10} strokeWidth={3} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">
                {employee.name}
              </h4>
              {employee.cell?.name && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                  {employee.cell.name}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight font-medium">
              {employee.designation}
            </p>
          </div>
        </div>

        {isChecked && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs whitespace-nowrap">
              {toBanglaDigits(datesCount)} দিন নির্বাচিত
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(employee.id);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              title="তালিকা থেকে বাদ দিন"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Inline In-Card Calendar (Expands directly under employee name when checked) */}
      {isChecked && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-200">
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
