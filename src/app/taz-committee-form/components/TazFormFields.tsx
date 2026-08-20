'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlusCircle, MinusCircle, Save, RefreshCw } from 'lucide-react';
import TazDatePicker from './TazDatePicker';
import { isNonWorkingDay } from '@/lib/leave-calculator';
import { Employee, Cell, Implementer, TazFormData } from '../types';

interface TazFormFieldsProps {
  formData: TazFormData;
  implementers: Implementer[];
  editingId: number | null;
  isSubmitting: boolean;
  employees: Employee[];
  cells: Cell[];
  onInputChange: (field: string, val: string | number) => void;
  onAddImplementer: () => void;
  onRemoveImplementer: (idx: number) => void;
  onUpdateImplementer: (idx: number, field: keyof Implementer, val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}

export default function TazFormFields({
  formData,
  implementers,
  editingId,
  isSubmitting,
  employees,
  cells,
  onInputChange,
  onAddImplementer,
  onRemoveImplementer,
  onUpdateImplementer,
  onSubmit,
  onReset
}: TazFormFieldsProps) {
  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {editingId ? '📝 তায কমিটি ফর্ম সম্পাদনা' : '➕ নতুন তায কমিটি ফর্ম তৈরি'}
          </h2>
          {editingId && (
            <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold px-2.5 py-1 rounded-full">
              সম্পাদন মোড সক্রিয়
            </span>
          )}
        </div>

        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            ১. সাধারণ তথ্য ও তারিখ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ফর্মের তারিখ (Date)*
              </label>
              <TazDatePicker
                value={formData.formDate}
                onChange={d => onInputChange('formDate', d)}
                isNonWorkingDay={isNonWorkingDay}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                রেফারেন্স নং (Reference No.)
              </label>
              <input
                type="text"
                value={formData.ref}
                onChange={e => onInputChange('ref', e.target.value)}
                placeholder="उदा. JB/ICT/TAZ/2026/01"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                প্যাক্স আইডি (PACS ID)*
              </label>
              <input
                type="text"
                required
                value={formData.pacsId}
                onChange={e => onInputChange('pacsId', e.target.value)}
                placeholder="उदा. PACS-84920"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                কাজের শিরোনাম (Title of Request)*
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => onInputChange('title', e.target.value)}
                placeholder="उदा. Customization of Monthly Loan Statement Routine"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                উদ্দেশ্য ও যৌক্তিকতা (Purpose)*
              </label>
              <input
                type="text"
                required
                value={formData.purpose}
                onChange={e => onInputChange('purpose', e.target.value)}
                placeholder="उदा. For fast extraction of T24 reports as requested by CAD"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Technical Details */}
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            ২. টেকনিক্যাল ও ডেভেলপমেন্ট বিবরণ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                অ্যাপ্লিকেশন নাম
              </label>
              <input
                type="text"
                value={formData.applicationName}
                onChange={e => onInputChange('applicationName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                রুটিন নাম (Routine Details)
              </label>
              <input
                type="text"
                value={formData.routineDetails}
                onChange={e => onInputChange('routineDetails', e.target.value)}
                placeholder="उदा. JB.LN.STMT.REP"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                সাবরুটিন নাম (Subroutine)
              </label>
              <input
                type="text"
                value={formData.subroutineDetails}
                onChange={e => onInputChange('subroutineDetails', e.target.value)}
                placeholder="उदा. JB.SUB.CALC.COMM"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Backend Access
              </label>
              <select
                value={formData.needBackendAccess}
                onChange={e => onInputChange('needBackendAccess', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Core FTP Access
              </label>
              <select
                value={formData.needCoreFtpAccess}
                onChange={e => onInputChange('needCoreFtpAccess', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Browser Access
              </label>
              <select
                value={formData.needBrowserAccess}
                onChange={e => onInputChange('needBrowserAccess', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                During Tx Hour
              </label>
              <select
                value={formData.duringTxHour}
                onChange={e => onInputChange('duringTxHour', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Implementers & Requester */}
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              ৩. বাস্তবায়নকারী দল (Implementers)
            </h3>
            <button
              type="button"
              onClick={onAddImplementer}
              className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <PlusCircle size={14} /> সদস্য যোগ করুন
            </button>
          </div>

          <div className="space-y-3">
            {implementers.map((imp, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <span className="text-xs font-bold text-slate-400">{idx + 1}.</span>
                <input
                  type="text"
                  required
                  placeholder="নাম (Name)"
                  value={imp.name}
                  onChange={e => onUpdateImplementer(idx, 'name', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <input
                  type="text"
                  required
                  placeholder="পদবি (Designation)"
                  value={imp.designation}
                  onChange={e => onUpdateImplementer(idx, 'designation', e.target.value)}
                  className="w-48 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="সংস্থা (Organization)"
                  value={imp.organization}
                  onChange={e => onUpdateImplementer(idx, 'organization', e.target.value)}
                  className="w-48 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                {implementers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveImplementer(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                  >
                    <MinusCircle size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                আবেদনকারীর নাম (Requester Name)*
              </label>
              <input
                type="text"
                required
                value={formData.requesterName}
                onChange={e => onInputChange('requesterName', e.target.value)}
                placeholder="उदा. জনাব মোঃ মনোয়ার হোসেন"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                আবেদনকারীর পদবি (Requester Designation)*
              </label>
              <input
                type="text"
                required
                value={formData.requesterDesignation}
                onChange={e => onInputChange('requesterDesignation', e.target.value)}
                placeholder="उदा. সিনিয়র প্রিন্সিপাল অফিসার"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={isSubmitting}
            className="text-xs"
          >
            <RefreshCw size={14} className="mr-1.5" /> রিসেট
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm cursor-pointer"
          >
            <Save size={14} className="mr-1.5" /> {editingId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
