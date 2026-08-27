'use client';

import React from 'react';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { Employee } from '../types';

interface EmployeeProfileModalProps {
  employee: Employee | null;
  onClose: () => void;
  onEdit: (emp: Employee) => void;
  canEdit: boolean;
}

const extractNickname = (nameStr: string): string => {
  const clean = nameStr.trim();
  if (clean.toLowerCase().includes('admin') || clean.includes('এডমিন')) return 'Admin';
  if (clean.includes('অভিজিৎ')) return 'অভিজিৎ';
  if (clean.includes('জোবায়ের')) return 'জোবায়ের';
  if (clean.includes('মনোয়ার')) return 'মনোয়ার';
  if (clean.includes('প্রদীপ্ত')) return 'প্রদীপ্ত';
  if (clean.includes('মারুফ')) return 'মারুফ';
  if (clean.includes('ইমন')) return 'ইমন';
  if (clean.includes('কিবরিয়া') || clean.includes('কিবর')) return 'কিবরিয়া';
  if (clean.includes('সাইফ')) return 'সাইফ';
  if (clean.includes('দেবাশীষ')) return 'দেবাশীষ';
  if (clean.includes('শাহিন')) return 'শাহিন';
  if (clean.includes('সৈকত')) return 'সৈকত';
  if (clean.includes('বাহার')) return 'বাহার';
  if (clean.includes('রিয়াজ')) return 'রিয়াজ';
  if (clean.includes('রবিউল')) return 'রবিউল';
  if (clean.includes('হাদীউজ্জামান') || clean.includes('বাপ্পী')) return 'বাপ্পী';
  if (clean.includes('আরিফুল ইসলাম') || clean.includes('আরিফুল')) return 'আরিফুল';
  if (clean.includes('রাশেদ')) return 'রাশেদ';
  if (clean.includes('জাকির')) return 'জাকির';
  if (clean.includes('ফাতিহ') || clean.includes('ফাহিম')) return 'ফাহিম';
  if (clean.includes('মিঠুন')) return 'মিঠুন';
  if (clean.includes('ইমরান')) return 'ইমরান';
  if (clean.includes('শায়েখুজ্জামান') || clean.includes('মাহমুদ')) return 'মাহমুদ';
  if (clean.includes('শাহাদাত')) return 'শাহাদাত';
  if (clean.includes('পারভেজ') || clean.includes('হাবিব')) return 'পারভেজ';

  const parts = clean.split(/\s+/);
  if (parts.length === 0) return 'ইউজার';
  const prefixes = ['জনাব', 'জনাবা', 'মুhammad', 'muhammad', 'মুহাম্মদ', 'মোহাম্মদ', 'মোহাম্মাদ', 'মো', 'মোঃ', 'মোহা', 'শ্রী', 'ডা', 'ডাঃ', 'ড', 'ডক্টর', 'মহম্মদ', 'মিসেস', 'মিস', 'এসএম', 'সৈয়দ', 'সৈয়দ'];
  for (let i = 0; i < parts.length; i++) {
    const word = parts[i];
    const cleanedWord = word.replace(/[.,:;ঃ()]/g, '').trim();
    if (!prefixes.includes(cleanedWord) && cleanedWord.length > 0) {
      return cleanedWord;
    }
  }
  return parts[0] || 'ইউজার';
};

export default function EmployeeProfileModal({
  employee,
  onClose,
  onEdit,
  canEdit
}: EmployeeProfileModalProps) {
  if (!employee) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-sans"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="emp-profile-title"
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-28 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-950 relative flex items-end justify-center border-b border-indigo-500/20">
          <div className="absolute -bottom-10 w-20 h-20 rounded-full border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-base font-black shadow-xl ring-2 ring-indigo-500/20">
            {extractNickname(employee.name)}
          </div>
        </div>

        <div className="pt-14 pb-8 px-6 text-center space-y-6">
          <div>
            <h4 id="emp-profile-title" className="font-extrabold text-slate-850 dark:text-slate-50 text-lg leading-tight">
              {employee.name}
            </h4>
            {employee.nameEn && (
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                {employee.nameEn}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">পদবী</span>
              <p className="text-xs font-bold text-slate-850 dark:text-slate-150">{employee.designation}</p>
              {employee.designationEn && (
                <p className="text-[11px] font-semibold text-slate-500 font-sans">{employee.designationEn}</p>
              )}
            </div>
            <div className="p-3 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">সেল</span>
              <p className="text-xs font-bold text-slate-850 dark:text-slate-150">{employee.cell?.name || 'তথ্য নেই'}</p>
            </div>
            <div className="p-3 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">ব্যাংক আইডি</span>
              <p className={`text-xs font-sans tabular-nums ${employee.bankId ? 'font-bold text-slate-850 dark:text-slate-150' : 'italic text-slate-400 dark:text-slate-600'}`}>
                {employee.bankId || 'প্রদান করা হয়নি'}
              </p>
            </div>
            <div className="p-3 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">ব্যক্তিগত নথি নং</span>
              <p className={`text-xs font-mono ${employee.fileNo ? 'font-bold text-slate-850 dark:text-slate-150' : 'italic text-slate-400 dark:text-slate-600'}`}>
                {employee.fileNo || 'প্রদান করা হয়নি'}
              </p>
            </div>
            <div className="p-3 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1.5 col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">মোবাইল নম্বর</span>
              <p className={`text-xs font-sans tabular-nums ${employee.mobile ? 'font-bold text-slate-850 dark:text-slate-150' : 'italic text-slate-400 dark:text-slate-600'}`}>
                {employee.mobile ? toBanglaDigits(employee.mobile) : 'প্রদান করা হয়নি'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="প্রোফাইল মডাল বন্ধ করুন"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
            >
              বন্ধ করুন
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  const emp = employee;
                  onClose();
                  onEdit(emp);
                }}
                aria-label="কর্মকর্তার তথ্য সম্পাদনা করুন"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm shadow-indigo-500/20"
              >
                সম্পাদনা করুন
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
