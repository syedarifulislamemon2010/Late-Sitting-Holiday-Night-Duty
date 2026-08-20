'use client';

import React from 'react';
import { STRICT_DESIGNATIONS } from '../hooks/useEmployeePageData';

interface EmployeeAdvancedFiltersProps {
  show: boolean;
  filterDesignation: string;
  setFilterDesignation: (desig: string) => void;
  filterPhoneStatus: string;
  setFilterPhoneStatus: (status: string) => void;
  filterBankIdStatus: string;
  setFilterBankIdStatus: (status: string) => void;
  filterFileNoStatus: string;
  setFilterFileNoStatus: (status: string) => void;
  onReset?: () => void;
}

export default function EmployeeAdvancedFilters({
  show,
  filterDesignation,
  setFilterDesignation,
  filterPhoneStatus,
  setFilterPhoneStatus,
  filterBankIdStatus,
  setFilterBankIdStatus,
  filterFileNoStatus,
  setFilterFileNoStatus,
}: EmployeeAdvancedFiltersProps) {
  if (!show) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-slate-50/60 dark:bg-slate-900/30 animate-in fade-in">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">পদবী (Designation)</label>
        <select
          value={filterDesignation}
          onChange={(e) => setFilterDesignation(e.target.value)}
          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="ALL">সকল পদবী (All)</option>
          {STRICT_DESIGNATIONS.map(d => (
            <option key={d} value={d}>
              {d.replace(' (এসপিও)', '').replace(' (পিও)', '').replace(' (এসও-আইটি)', '').replace(' (ও-আইটি)', '')}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">মোবাইল নম্বর (Phone)</label>
        <select
          value={filterPhoneStatus}
          onChange={(e) => setFilterPhoneStatus(e.target.value)}
          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="ALL">সকল স্ট্যাটাস (All)</option>
          <option value="has_phone">নম্বর আছে (Has Phone)</option>
          <option value="no_phone">নম্বর নেই (Missing)</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ব্যাংক আইডি (Bank ID)</label>
        <select
          value={filterBankIdStatus}
          onChange={(e) => setFilterBankIdStatus(e.target.value)}
          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="ALL">সকল স্ট্যাটাস (All)</option>
          <option value="has_bank_id">আইডি আছে (Has Bank ID)</option>
          <option value="no_bank_id">আইডি নেই (Missing)</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">নথি নম্বর (File No)</label>
        <select
          value={filterFileNoStatus}
          onChange={(e) => setFilterFileNoStatus(e.target.value)}
          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="ALL">সকল স্ট্যাটাস (All)</option>
          <option value="has_file_no">নথি নম্বর আছে (Has File No)</option>
          <option value="no_file_no">নথি নম্বর নেই (Missing)</option>
        </select>
      </div>
    </div>
  );
}
