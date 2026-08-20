'use client';

import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Cell, Employee } from '../types';

const STRICT_DESIGNATIONS = [
  'সিনিয়র প্রিন্সিপাল অফিসার (এসপিও)',
  'প্রিন্সিপাল অফিসার (পিও)',
  'সিনিয়র অফিসার-আইটি (এসও-আইটি)',
  'অফিসার-আইটি (ও-আইটি)'
];

interface EmployeeFormModalProps {
  isOpen: boolean;
  editingEmp: Employee | null;
  empForm: {
    name: string;
    nameEn: string;
    designation: string;
    designationEn: string;
    bankId: string;
    fileNo: string;
    mobile: string;
    cellId: string;
  };
  setEmpForm: React.Dispatch<React.SetStateAction<{
    name: string;
    nameEn: string;
    designation: string;
    designationEn: string;
    bankId: string;
    fileNo: string;
    mobile: string;
    cellId: string;
  }>>;
  formSelectableCells: Cell[];
  isSelfEditingOnly: boolean;
  errorMessage: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EmployeeFormModal({
  isOpen,
  editingEmp,
  empForm,
  setEmpForm,
  formSelectableCells,
  isSelfEditingOnly,
  errorMessage,
  onClose,
  onSubmit
}: EmployeeFormModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emp-form-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h3 id="emp-form-title" className="font-bold text-slate-850 dark:text-slate-100 text-base">
            {editingEmp ? 'কর্মকর্তার তথ্য সম্পাদনা' : 'নতুন কর্মকর্তা যোগ করুন'}
          </h3>
          <button 
            onClick={onClose} 
            aria-label="মডাল বন্ধ করুন"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="emp_name" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">কর্মকর্তার নাম *</label>
            <input
              id="emp_name"
              type="text"
              required
              placeholder="যেমন: জনাব মোঃ আশরাফুল ইসলাম"
              value={empForm.name}
              onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="emp_nameEn" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ইংরেজি নাম (Name in English)</label>
            <input
              id="emp_nameEn"
              type="text"
              placeholder="যেমন: Md. Ashraful Islam"
              value={empForm.nameEn}
              onChange={(e) => setEmpForm({ ...empForm, nameEn: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="emp_designation" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">পদবী (বাংলা) *</label>
            <select
              id="emp_designation"
              value={empForm.designation}
              disabled={isSelfEditingOnly}
              onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 ${isSelfEditingOnly ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900/60' : ''}`}
            >
              {STRICT_DESIGNATIONS.map((desig) => (
                <option key={desig} value={desig}>{desig}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="emp_designationEn" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ইংরেজি পদবী (Designation in English)</label>
            <input
              id="emp_designationEn"
              type="text"
              placeholder="যেমন: Senior Officer (IT)"
              value={empForm.designationEn}
              onChange={(e) => setEmpForm({ ...empForm, designationEn: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="emp_bankId" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ব্যাংক আইডি *</label>
            <input
              id="emp_bankId"
              type="text"
              required
              disabled={isSelfEditingOnly}
              placeholder="যেমন: 026799"
              value={empForm.bankId}
              onChange={(e) => setEmpForm({ ...empForm, bankId: e.target.value })}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 tabular-nums ${isSelfEditingOnly ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900/60' : ''}`}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="emp_fileNo" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">নথি নম্বর (File No) *</label>
            <input
              id="emp_fileNo"
              type="text"
              required
              disabled={isSelfEditingOnly}
              placeholder="যেমন: SO(Com)-026799"
              value={empForm.fileNo}
              onChange={(e) => setEmpForm({ ...empForm, fileNo: e.target.value })}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-mono ${isSelfEditingOnly ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900/60' : ''}`}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="emp_mobile" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">মোবাইল নম্বর</label>
            <input
              id="emp_mobile"
              type="text"
              placeholder="যেমন: 017XXXXXXXX"
              value={empForm.mobile || ''}
              onChange={(e) => setEmpForm({ ...empForm, mobile: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-sans tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="emp_cellId" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">সেল সিলেক্ট করুন *</label>
            <select
              id="emp_cellId"
              value={empForm.cellId}
              disabled={isSelfEditingOnly}
              onChange={(e) => setEmpForm({ ...empForm, cellId: e.target.value })}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-bold ${isSelfEditingOnly ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900/60' : ''}`}
            >
              {formSelectableCells.map((c) => (
                <option key={c.id} value={c.id.toString()}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              aria-label="ফর্ম বাতিল করুন"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              aria-label="কর্মকর্তা সংরক্ষণ করুন"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 cursor-pointer"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
