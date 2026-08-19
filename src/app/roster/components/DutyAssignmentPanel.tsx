'use client';

import React, { useMemo } from 'react';
import { 
  AlertCircle, 
  Calendar, 
  Check, 
  ChevronLeft, 
  Lock, 
  Search 
} from 'lucide-react';
import { 
  Cell, 
  Employee, 
  Holiday, 
  User, 
  Duty, 
  checkIsWorkingDay 
} from '../types';
import EmployeeSelectCard from './EmployeeSelectCard';
import CalendarDatePicker from './CalendarDatePicker';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { sortEmployeesBySeniority } from '@/lib/seniority';
import dynamic from 'next/dynamic';

const RosterOCRImport = dynamic(() => import('./RosterOCRImport'), { ssr: false });

interface DutyAssignmentPanelProps {
  currentUser: User | null;
  cells: Cell[];
  employees: Employee[];
  holidays: Holiday[];
  leaves: any[];
  entryMode: 'EMPLOYEE_WISE' | 'DATE_WISE';
  setEntryMode: (mode: 'EMPLOYEE_WISE' | 'DATE_WISE') => void;
  assignmentForm: {
    type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' | '';
    date: string;
    description: string;
    selectedEmployeeIds: number[];
  };
  setAssignmentForm: React.Dispatch<React.SetStateAction<{
    selectedEmployeeIds: number[];
    type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' | '';
    date: string;
    description: string;
  }>>;
  opt1CellId: string;
  setOpt1CellId: (id: string) => void;
  opt1SearchQuery: string;
  setOpt1SearchQuery: (q: string) => void;
  opt1Assignments: Record<number, string[]>;
  setOpt1Assignments: React.Dispatch<React.SetStateAction<Record<number, string[]>>>;
  opt1ViewedMonths: Record<number, string>;
  setOpt1ViewedMonths: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  formSearchQuery: string;
  setFormSearchQuery: (q: string) => void;
  formCellFilter: string;
  setFormCellFilter: (id: string) => void;
  submitting: boolean;
  errorMessage: string;
  preConflicts: Array<{ date: string; type: string; message: string }>;
  editingDuty: Duty | null;
  editingDuties: Duty[];
  isEditingArchive: boolean;
  isRosterDirty: boolean;
  isAssignmentPrimary: boolean;
  onFocusPanel: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleCancelEdit: () => void;
  handleCancelRosterEdit: () => void;
  handleBulkDutyImport: (importedDuties: any[]) => void;
  isSubmitDisabled: () => boolean;
}

export default function DutyAssignmentPanel({
  currentUser,
  cells,
  employees,
  holidays,
  leaves,
  entryMode,
  setEntryMode,
  assignmentForm,
  setAssignmentForm,
  opt1CellId,
  setOpt1CellId,
  opt1SearchQuery,
  setOpt1SearchQuery,
  opt1Assignments,
  setOpt1Assignments,
  opt1ViewedMonths,
  setOpt1ViewedMonths,
  formSearchQuery,
  setFormSearchQuery,
  formCellFilter,
  setFormCellFilter,
  submitting,
  errorMessage,
  preConflicts,
  editingDuty,
  editingDuties,
  isEditingArchive,
  isRosterDirty,
  isAssignmentPrimary,
  onFocusPanel,
  handleSubmit,
  handleCancelEdit,
  handleCancelRosterEdit,
  handleBulkDutyImport,
  isSubmitDisabled
}: DutyAssignmentPanelProps) {
  // Option 1 toggle employee
  const handleOpt1EmployeeToggle = (empId: number) => {
    setOpt1Assignments(prev => {
      const next = { ...prev };
      if (empId in next) {
        delete next[empId];
      } else {
        next[empId] = [];
      }
      return next;
    });
  };

  const handleOpt1AddDate = (empId: number, dateStr: string) => {
    setOpt1Assignments(prev => {
      const current = prev[empId] || [];
      if (!current.includes(dateStr)) {
        return { ...prev, [empId]: [...current, dateStr].sort() };
      }
      return prev;
    });
  };

  const handleOpt1RemoveDate = (empId: number, dateStr: string) => {
    setOpt1Assignments(prev => {
      const current = prev[empId] || [];
      return { ...prev, [empId]: current.filter(d => d !== dateStr) };
    });
  };

  const handleOpt1ClearMonth = (empId: number, ym: string) => {
    setOpt1Assignments(prev => {
      const current = prev[empId] || [];
      return { ...prev, [empId]: current.filter(d => !d.startsWith(ym)) };
    });
  };

  const handleOpt1ClearAllDates = (empId: number) => {
    setOpt1Assignments(prev => ({
      ...prev,
      [empId]: []
    }));
  };

  const getEmployeeViewedMonth = (empId: number) => {
    if (opt1ViewedMonths[empId]) return opt1ViewedMonths[empId];
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  };

  const handlePrevMonth = (empId: number) => {
    const currentYM = getEmployeeViewedMonth(empId);
    const [year, month] = currentYM.split('-').map(Number);
    const newDate = new Date(year, month - 2, 1);
    const newYM = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setOpt1ViewedMonths(prev => ({ ...prev, [empId]: newYM }));
  };

  const handleNextMonth = (empId: number) => {
    const currentYM = getEmployeeViewedMonth(empId);
    const [year, month] = currentYM.split('-').map(Number);
    const newDate = new Date(year, month, 1);
    const newYM = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setOpt1ViewedMonths(prev => ({ ...prev, [empId]: newYM }));
  };

  const selectAllOpt1Employees = (list: Employee[]) => {
    setOpt1Assignments(prev => {
      const next = { ...prev };
      list.forEach(emp => {
        if (!(emp.id in next)) {
          next[emp.id] = [];
        }
      });
      return next;
    });
  };

  const deselectAllOpt1Employees = () => {
    setOpt1Assignments({});
  };

  // Option 2 employee toggle
  const handleEmployeeToggle = (empId: number) => {
    const current = [...assignmentForm.selectedEmployeeIds];
    const index = current.indexOf(empId);
    if (index === -1) {
      current.push(empId);
    } else {
      current.splice(index, 1);
    }
    setAssignmentForm({ ...assignmentForm, selectedEmployeeIds: current });
  };

  const selectAllFilteredEmployees = (list: Employee[]) => {
    const ids = list.map(e => e.id);
    const set = new Set([...assignmentForm.selectedEmployeeIds, ...ids]);
    setAssignmentForm({ ...assignmentForm, selectedEmployeeIds: Array.from(set) });
  };

  const deselectAllFilteredEmployees = () => {
    setAssignmentForm({ ...assignmentForm, selectedEmployeeIds: [] });
  };

  // Option 2 filtered employees
  const filteredFormEmployees = useMemo(() => {
    const list = employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(formSearchQuery.toLowerCase()) || 
                            emp.designation.toLowerCase().includes(formSearchQuery.toLowerCase());
      const matchesCell = formCellFilter === 'all' || emp.cellId.toString() === formCellFilter;
      return matchesSearch && matchesCell;
    });
    return sortEmployeesBySeniority(list);
  }, [employees, formSearchQuery, formCellFilter]);

  // Option 1 filtered employees
  const allowedCellIds = currentUser?.role === 'ADMIN'
    ? cells.map(c => c.id)
    : currentUser?.cells?.map(c => c.id) || [];

  const cellFilteredEmployees = employees.filter(emp => 
    opt1CellId === 'all' 
      ? allowedCellIds.includes(emp.cellId) 
      : emp.cellId.toString() === opt1CellId
  );

  const filteredOpt1List = cellFilteredEmployees.filter(emp => {
    if (!opt1SearchQuery.trim()) return true;
    const q = opt1SearchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      (emp.designation && emp.designation.toLowerCase().includes(q)) ||
      (emp.bankId && emp.bankId.toLowerCase().includes(q))
    );
  });

  const filteredOpt1Employees = sortEmployeesBySeniority(filteredOpt1List);
  const selectedEmployeeIds = Object.keys(opt1Assignments).map(Number);

  return (
    <div 
      tabIndex={0}
      onClick={() => {
        if (!isAssignmentPrimary) {
          onFocusPanel();
        }
      }}
      onFocusCapture={() => {
        if (!isAssignmentPrimary) {
          onFocusPanel();
        }
      }}
      className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 transition-all duration-500 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 select-none ${
        isAssignmentPrimary 
          ? 'w-full xl:w-[70%] space-y-6 opacity-100' 
          : 'w-full xl:w-[30%] space-y-3 xl:hover:border-blue-300 opacity-50 blur-[0.5px] scale-[0.99]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
            {editingDuty ? 'ডিউটি তথ্য আপডেট' : isEditingArchive ? 'আর্কাইভ অর্ডার আপডেট' : 'ডিউটি অ্যাসাইনমেন্ট প্যানেল'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">ডিউটি রোস্টার ও অফিস আদেশ জেনারেটর।</p>
        </div>
        {!isAssignmentPrimary && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFocusPanel();
            }}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <ChevronLeft size={14} className="animate-pulse" />
            প্যানেল বড় করুন
          </button>
        )}
      </div>

      {/* Body Wrapper */}
      <div className={`space-y-6 transition-all duration-500 ${!isAssignmentPrimary ? 'pointer-events-none select-none' : ''}`}>
        {/* Entry Mode Switcher */}
        {!isEditingArchive && !editingDuty && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEntryMode('EMPLOYEE_WISE')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                entryMode === 'EMPLOYEE_WISE'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Calendar size={13} />
              অপশন ১: সেল ও কর্মকর্তা ভিত্তিক (মাল্টিপল ডেট)
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('DATE_WISE')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                entryMode === 'DATE_WISE'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Check size={13} />
              অপশন ২: তারিখ ভিত্তিক (মাল্টিপল কর্মকর্তা)
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs flex items-center gap-2 animate-pulse">
              <AlertCircle size={14} />
              {errorMessage}
            </div>
          )}

          {/* 1. Duty Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">১. ডিউটির ক্যাটাগরি</label>
            <select
              value={assignmentForm.type}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, type: e.target.value as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' | '' })}
              className="w-full h-11 px-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            >
              <option value="">সিলেক্ট করুন</option>
              <option value="LATE_SITTING">Late Sitting (লেট সিটিং)</option>
              <option value="HOLIDAY">Holiday Duty (ছুটির দিনে)</option>
              <option value="NIGHT_SHIFT">Night Shift (রাত্রীকালীন ডিউটি)</option>
            </select>
          </div>

          {preConflicts.length > 0 && entryMode === 'EMPLOYEE_WISE' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-1">
              {preConflicts.map((conf, i) => (
                <div key={i} className="flex items-start gap-2 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 text-xs text-amber-800 dark:text-amber-200">
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-500" />
                  <span className="font-semibold">{conf.message}</span>
                </div>
              ))}
            </div>
          )}

          {!assignmentForm.type ? (
            <div className="p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 text-center space-y-2 mt-4">
              <Lock className="mx-auto text-slate-400 dark:text-slate-500 animate-bounce" size={20} />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">কর্মকর্তা ও তারিখ নির্বাচন লকড</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                কর্মকর্তা ও তারিখ সমূহ নির্বাচন করতে অনুগ্রহ করে প্রথমে উপরে ডিউটির ক্যাটাগরি সিলেক্ট করুন।
              </p>
            </div>
          ) : (
            <>
              {/* Mode Specific Layouts */}
              {entryMode === 'EMPLOYEE_WISE' ? (
                /* ========================================================
                   OPTION 1: Cell & Employee wise (Multi-date picker)
                   ======================================================== */
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">৩. সেল সিলেক্ট করুন</label>
                    <select
                      value={opt1CellId}
                      onChange={(e) => setOpt1CellId(e.target.value)}
                      className="w-full h-11 px-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                    >
                      {(currentUser?.role === 'ADMIN' || (currentUser?.cells && currentUser.cells.length > 1)) && (
                        <option value="all">সকল সেল (All Cells)</option>
                      )}
                      {cells
                        .filter(c => currentUser?.role === 'ADMIN' || currentUser?.cells?.some(uc => uc.id === c.id))
                        .map(c => (
                          <option key={c.id} value={c.id.toString()}>{c.name}</option>
                        ))}
                    </select>
                  </div>

                  {/* 4. Single Unified Section with Inline In-Card Calendar Masonry Flow */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        ৪. কর্মকর্তা ও ডিউটি তারিখসমূহ নির্বাচন করুন ({toBanglaDigits(selectedEmployeeIds.length)} জন নির্বাচিত)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => selectAllOpt1Employees(filteredOpt1Employees)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 transition-colors cursor-pointer"
                        >
                          সব সিলেক্ট করুন
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllOpt1Employees}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                        >
                          সব বাদ দিন
                        </button>
                      </div>
                    </div>

                    {/* Dot / Indicator Legend */}
                    <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/50 dark:border-slate-800/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                        <span>🟡 সরকারি ছুটি</span>
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block ring-2 ring-amber-400/50" />
                        <span>🟠 (পালস) ছুটি সংঘর্ষ (hover করে বিস্তারিত দেখুন)</span>
                      </span>
                    </div>

                    {/* Option 1 Internal Employee Search */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="কর্মকর্তার নাম দিয়ে খুঁজুন..."
                        value={opt1SearchQuery}
                        onChange={(e) => setOpt1SearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    
                    {/* Masonry Columns Layout Container for In-Card Inline Calendars */}
                    <div className={`w-full ${
                      isAssignmentPrimary 
                        ? 'columns-1 sm:columns-2 lg:columns-3 gap-3.5' 
                        : 'columns-1 gap-3.5'
                    }`}>
                      {filteredOpt1Employees.length > 0 ? (
                        filteredOpt1Employees.map(emp => (
                          <EmployeeSelectCard
                            key={emp.id}
                            employee={emp}
                            isChecked={emp.id in opt1Assignments}
                            selectedDates={opt1Assignments[emp.id] || []}
                            viewedMonth={getEmployeeViewedMonth(emp.id)}
                            holidays={holidays}
                            leaves={leaves}
                            dutyType={assignmentForm.type}
                            onToggle={handleOpt1EmployeeToggle}
                            onAddDate={handleOpt1AddDate}
                            onRemoveDate={handleOpt1RemoveDate}
                            onClearMonth={handleOpt1ClearMonth}
                            onClearAllDates={handleOpt1ClearAllDates}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                          />
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-6 col-span-full">এই সেলের অধীনে কোনো কর্মকর্তা পাওয়া যায়নি।</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ========================================================
                   OPTION 2: Date wise (Multi-employee checkboxes)
                   ======================================================== */
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                  {/* Duty Date Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">৩. ডিউটির তারিখ</label>
                    <CalendarDatePicker 
                      value={assignmentForm.date}
                      onChange={(d) => setAssignmentForm({ ...assignmentForm, date: d })}
                      isNonWorkingDay={(d) => !checkIsWorkingDay(d, holidays)}
                      toBanglaDigits={toBanglaDigits}
                      placeholder="ডিউটির তারিখ নির্বাচন..."
                    />
                    {assignmentForm.date && (() => {
                      const isWorking = checkIsWorkingDay(assignmentForm.date, holidays);
                      const isLateSitting = assignmentForm.type === 'LATE_SITTING';
                      const isHoliday = assignmentForm.type === 'HOLIDAY';
                      
                      if (isLateSitting && !isWorking) {
                        return (
                          <p className="text-[11px] font-bold text-red-500 mt-1.5 flex items-center gap-1.5 bg-red-50 p-2 rounded-lg border border-red-100/50">
                            <AlertCircle size={12} />
                            উক্ত তারিখটি ছুটির দিন/সাপ্তাহিক ছুটি হওয়ায় লেট সিটিং ডিউটি এন্ট্রি করা যাবে না!
                          </p>
                        );
                      }
                      if (isHoliday && isWorking) {
                        return (
                          <p className="text-[11px] font-bold text-red-500 mt-1.5 flex items-center gap-1.5 bg-red-50 p-2 rounded-lg border border-red-100/50">
                            <AlertCircle size={12} />
                            উক্ত তারিখটি কর্মদিবস হওয়ায় সরকারি ছুটির ডিউটি এন্ট্রি করা যাবে না!
                          </p>
                        );
                      }
                      
                      const matchedHoliday = holidays.find(h => h.date === assignmentForm.date);
                      const isWeekend = !isWorking && !matchedHoliday;
                      if (matchedHoliday) {
                        return (
                          <p className="text-[11px] font-bold text-amber-600 mt-1.5 flex items-center gap-1.5 bg-amber-50 p-2 rounded-lg border border-amber-100/50">
                            <AlertCircle size={12} />
                            সরকারি ছুটি: {matchedHoliday.name}
                          </p>
                        );
                      }
                      if (isWeekend) {
                        return (
                          <p className="text-[11px] font-bold text-red-550 mt-1.5 flex items-center gap-1.5 bg-red-50/40 p-2 rounded-lg border border-red-100/20">
                            <AlertCircle size={12} />
                            সাপ্তাহিক ছুটি
                          </p>
                        );
                      }
                      return null;
                    })()}
                    
                    {preConflicts.length > 0 && entryMode === 'DATE_WISE' && (
                      <div className="mt-2 space-y-1.5 animate-in slide-in-from-top-1">
                        {preConflicts.map((conf, i) => (
                          <div key={i} className="flex items-start gap-2 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 text-xs text-amber-800 dark:text-amber-200">
                            <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-500" />
                            <span className="font-semibold">{conf.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Officer Selector Multi-select checkboxes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        ৪. কর্মকর্তা নির্বাচন করুন ({assignmentForm.selectedEmployeeIds.length} জন সিলেক্টেড)
                      </label>
                    </div>
                    
                    {/* Internal search inside form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="খুঁজুন..."
                        value={formSearchQuery}
                        onChange={(e) => setFormSearchQuery(e.target.value)}
                        className="flex-1 h-9 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                      />
                      <select
                        value={formCellFilter}
                        onChange={(e) => setFormCellFilter(e.target.value)}
                        className="h-9 px-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-800 dark:text-slate-100"
                      >
                        <option value="all">সকল সেল</option>
                        {cells.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                      </select>
                    </div>

                    {/* Mass actions for quick selection */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => selectAllFilteredEmployees(filteredFormEmployees)}
                        className="flex-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        সব সিলেক্ট করুন
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllFilteredEmployees}
                        className="flex-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        সব বাদ দিন
                      </button>
                    </div>

                    {/* Officers Checkboxes scrollbox */}
                    <div className={`border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/10 grid gap-3 ${
                      isAssignmentPrimary 
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                        : 'grid-cols-1'
                    }`}>
                      {(() => {
                        const isWorking = assignmentForm.date ? checkIsWorkingDay(assignmentForm.date, holidays) : true;
                        const isLateSitting = assignmentForm.type === 'LATE_SITTING';
                        const isHoliday = assignmentForm.type === 'HOLIDAY';
                        const isBlocked = (isLateSitting && !isWorking) || (isHoliday && isWorking);
                        
                        if (isBlocked) {
                          return (
                            <div className="p-8 text-center text-red-500/80 font-bold italic text-xs col-span-full">
                              নির্বাচিত তারিখটি এই ডিউটি ক্যাটাগরির জন্য উপযুক্ত নয়। উপযুক্ত তারিখ বেছে নিন।
                            </div>
                          );
                        }
                        
                        if (!assignmentForm.date) {
                          return (
                            <div className="p-8 text-center text-slate-400 italic text-xs col-span-full">
                              অনুগ্রহ করে প্রথমে উপরে তারিখ সিলেক্ট করুন।
                            </div>
                          );
                        }

                        return filteredFormEmployees.length > 0 ? (
                          filteredFormEmployees.map(emp => {
                            const isChecked = assignmentForm.selectedEmployeeIds.includes(emp.id);
                            return (
                              <div 
                                key={emp.id} 
                                onClick={() => handleEmployeeToggle(emp.id)}
                                className={`border rounded-xl p-3 cursor-pointer transition-all duration-250 hover:shadow-md dark:hover:shadow-blue-950/20 flex items-center justify-between gap-3 ${
                                  isChecked 
                                    ? 'border-blue-500/40 dark:border-blue-400/40 bg-blue-50/10 dark:bg-blue-950/10 shadow-sm' 
                                    : 'border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 hover:border-slate-350 dark:hover:border-slate-650'
                                }`}
                              >
                                <div className="flex items-start gap-3 w-full min-w-0">
                                  <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors mt-0.5 shrink-0 ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                                    {isChecked && <Check size={10} strokeWidth={3} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{emp.name}</p>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">{emp.designation}</p>
                                    {emp.cell?.name && (
                                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1.5 font-sans">{emp.cell.name}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-[11px] text-center text-slate-400 py-4 col-span-full">কর্মকর্তা পাওয়া যায়নি</p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {editingDuty ? (
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || isSubmitDisabled()}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-semibold transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                  >
                    {submitting ? 'আপডেট হচ্ছে...' : 'ডিউটি আপডেট করুন'}
                  </button>
                </div>
              ) : (
                isEditingArchive ? (
                  <div className="flex gap-3 mt-4 font-sans">
                    <button
                      type="button"
                      onClick={handleCancelRosterEdit}
                      className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-750 text-sm font-bold transition-all shadow-sm border border-slate-250 cursor-pointer"
                    >
                      বাতিল করুন
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || isSubmitDisabled() || !isRosterDirty}
                      className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-bold transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                    >
                      {submitting ? 'সংরক্ষণ হচ্ছে...' : 'সেভ করুন'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || isSubmitDisabled()}
                    className={`w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold transition-all mt-4 select-none ${
                      submitting || isSubmitDisabled()
                        ? 'bg-slate-200 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300/40 dark:border-slate-700/40 shadow-none'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg cursor-pointer font-extrabold'
                    }`}
                  >
                    {submitting ? 'সংরক্ষণ হচ্ছে...' : 'ডিউটি অ্যাসাইন করুন'}
                  </button>
                )
              )}
            </>
          )}
        </form>
        {!editingDuty && !isEditingArchive && (
          <div className="mt-6 border-t border-slate-105 pt-6">
            <RosterOCRImport
              cellId={parseInt(opt1CellId) || (cells && cells[0] ? cells[0].id : 7)}
              dutyType={(assignmentForm.type || 'LATE_SITTING') as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT'}
              onImportConfirmed={handleBulkDutyImport}
              disabled={!assignmentForm.type}
            />
          </div>
        )}
      </div>
    </div>
  );
}
