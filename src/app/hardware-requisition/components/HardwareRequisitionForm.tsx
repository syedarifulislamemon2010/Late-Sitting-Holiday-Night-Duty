'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlusCircle, Trash2, Save, RefreshCw, HardDrive, Calendar } from 'lucide-react';
import HardwareDatePicker from './HardwareDatePicker';
import { isNonWorkingDay } from '@/lib/leave-calculator';
import { HardwareItem, Employee, Cell, DEFAULT_HARDWARE_ITEMS } from '../types';

interface HardwareRequisitionFormProps {
  editingId: number | null;
  requisitionDate: string;
  setRequisitionDate: (d: string) => void;
  applicantName: string;
  setApplicantName: (n: string) => void;
  applicantDesignation: string;
  setApplicantDesignation: (d: string) => void;
  applicantCell: string;
  setApplicantCell: (c: string) => void;
  applicantId: string;
  setApplicantId: (id: string) => void;
  requisitionType: string;
  setRequisitionType: (t: string) => void;
  reason: string;
  setReason: (r: string) => void;
  items: HardwareItem[];
  employees: Employee[];
  cells: Cell[];
  isSubmitting: boolean;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: <K extends keyof HardwareItem>(id: string, field: K, val: HardwareItem[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}

export default function HardwareRequisitionForm({
  editingId,
  requisitionDate,
  setRequisitionDate,
  applicantName,
  setApplicantName,
  applicantDesignation,
  setApplicantDesignation,
  applicantCell,
  setApplicantCell,
  applicantId,
  setApplicantId,
  requisitionType,
  setRequisitionType,
  reason,
  setReason,
  items,
  employees,
  cells,
  isSubmitting,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onSubmit,
  onReset
}: HardwareRequisitionFormProps) {
  const handleEmployeeSelect = (empIdStr: string) => {
    if (!empIdStr) return;
    const emp = employees.find(e => e.id.toString() === empIdStr);
    if (emp) {
      setApplicantName(emp.name);
      setApplicantDesignation(emp.designation);
      setApplicantId(emp.bankId || '');
      if (emp.cell?.name) {
        setApplicantCell(emp.cell.name);
      }
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <HardDrive size={18} className="text-indigo-600" />
            <span>{editingId ? '📝 রিকুইজিশন সম্পাদনা' : '➕ নতুন হার্ডওয়্যার রিকুইজিশন তৈরি'}</span>
          </h2>
          {editingId && (
            <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold px-2.5 py-1 rounded-full">
              সম্পাদন মোড সক্রিয়
            </span>
          )}
        </div>

        {/* Section 1: Applicant Details */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              ১. আবেদনকারীর তথ্য ও তারিখ
            </h3>
            {employees.length > 0 && !editingId && (
              <div className="w-full sm:w-72">
                <select
                  onChange={e => handleEmployeeSelect(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl"
                >
                  <option value="">-- কর্মকর্তা তালিকা থেকে বেছে নিন --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id.toString()}>
                      {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                আবেদনের তারিখ*
              </label>
              <HardwareDatePicker
                value={requisitionDate}
                onChange={setRequisitionDate}
                isNonWorkingDay={isNonWorkingDay}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                আবেদনকারীর নাম*
              </label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={e => setApplicantName(e.target.value)}
                placeholder="उदा. জনাব মোঃ মনোয়ার হোসেন"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                পদবি (Designation)*
              </label>
              <input
                type="text"
                required
                value={applicantDesignation}
                onChange={e => setApplicantDesignation(e.target.value)}
                placeholder="उदा. সিনিয়র প্রিন্সিপাল অফিসার"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                শাখা / সেল (Cell / Department)*
              </label>
              <input
                type="text"
                required
                value={applicantCell}
                onChange={e => setApplicantCell(e.target.value)}
                placeholder="उदा. Development & Customization Cell"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                রিকুইজিশনের ধরন
              </label>
              <select
                value={requisitionType}
                onChange={e => setRequisitionType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium"
              >
                <option value="নতুন সরঞ্জাম বরাদ্দ">নতুন সরঞ্জাম বরাদ্দ (New Requisition)</option>
                <option value="মেরামত ও রক্ষণাবেক্ষণ">মেরামত ও রক্ষণাবেক্ষণ (Repair & Maintenance)</option>
                <option value="যন্ত্রাংশ প্রতিস্থাপন">যন্ত্রাংশ প্রতিস্থাপন (Replacement of Spare Parts)</option>
                <option value="অন্যান্য">অন্যান্য (Other)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                যৌক্তিকতা ও কারণ (Reason / Justification)*
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="उदा. অফিশিয়াল ডেভেলপমেন্ট ও টি-২৪ লাইভ কাজের জন্য প্রয়োজন"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Hardware Items List */}
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              ২. প্রয়োজনীয় হার্ডওয়্যার ও যন্ত্রাংশের বিবরণ
            </h3>
            <button
              type="button"
              onClick={onAddItem}
              className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <PlusCircle size={14} /> আইটেম যোগ করুন
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl items-center"
              >
                <div className="sm:col-span-1 flex items-center justify-center font-bold text-xs text-slate-400">
                  {idx + 1}.
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={item.itemType}
                    onChange={e => onUpdateItem(item.id, 'itemType', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {DEFAULT_HARDWARE_ITEMS.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <input
                    type="text"
                    required
                    placeholder="মডেল / স্পেসিফিকেশন (Description)"
                    value={item.itemDescription}
                    onChange={e => onUpdateItem(item.id, 'itemDescription', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={e => onUpdateItem(item.id, 'quantity', parseInt(e.target.value, 10) || 1)}
                    className="w-16 px-2 py-1.5 text-xs text-center font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                  <input
                    type="text"
                    value={item.unit}
                    onChange={e => onUpdateItem(item.id, 'unit', e.target.value)}
                    className="w-14 px-1.5 py-1.5 text-xs text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-end gap-2">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
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
