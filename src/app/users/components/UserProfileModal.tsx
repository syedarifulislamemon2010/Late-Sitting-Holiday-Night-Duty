'use client';

import React from 'react';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface User {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
  mobile?: string | null;
  cells: { id: number; name: string }[];
}

interface Employee {
  id: number;
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  cell?: { id: number; name: string };
}

interface UserProfileModalProps {
  profileUser: User | null;
  employees: Employee[];
  onClose: () => void;
  onEdit: (user: User) => void;
}

const extractNickname = (nameStr: string): string => {
  const clean = nameStr.trim();
  if (clean.includes('মনোয়ার')) return 'মনোয়ার';
  if (clean.includes('প্রদীপ্ত')) return 'প্রদীপ্ত';
  if (clean.includes('মারুফ')) return 'মারুফ';
  if (clean.includes('জোবায়ের')) return 'জোবায়ের';
  if (clean.includes('ইমন')) return 'ইমন';
  if (clean.includes('কিবরিয়া') || clean.includes('কিবর')) return 'কিবরিয়া';
  if (clean.includes('সাইফ')) return 'সাইফ';
  if (clean.includes('দেবাশীষ')) return 'দেবাশীষ';
  if (clean.includes('শাহিন')) return 'শাহিন';
  if (clean.includes('সৈকত')) return 'সৈকত';
  if (clean.includes('বাহার')) return 'বাহার';
  if (clean.includes('রিয়াজ')) return 'রিয়াজ';
  if (clean.includes('রবিউল')) return 'রবিউল';
  if (clean.includes('বাপ্পী') || clean.includes('হাদীউজ্জামান')) return 'বাপ্পী';
  if (clean.includes('আরিফুল ইসলাম')) return 'আরিফ';
  if (clean.includes('রাশেদ')) return 'রাশেদ';
  if (clean.includes('জাকির')) return 'জাকির';
  if (clean.includes('ফাতিহ')) return 'ফাতিহ';

  const parts = clean.split(/\s+/);
  return parts[0] ? parts[0].substring(0, 10) : 'ইউ';
};

export default function UserProfileModal({
  profileUser,
  employees,
  onClose,
  onEdit
}: UserProfileModalProps) {
  if (!profileUser) return null;

  const emp = employees.find(
    (e) => e.bankId && e.bankId.trim().toLowerCase() === profileUser.username.trim().toLowerCase()
  );

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-sans"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-title"
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-28 bg-gradient-to-r from-indigo-500 to-violet-600 relative flex items-end justify-center">
          <div className="absolute -bottom-10 px-3 h-20 min-w-20 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-extrabold shadow-md">
            {extractNickname(profileUser.name)}
          </div>
        </div>

        <div className="pt-14 pb-8 px-6 text-center space-y-6">
          <div>
            <h4 id="user-profile-title" className="font-extrabold text-slate-800 dark:text-slate-50 text-lg leading-tight">
              {(profileUser.name || '').replace(/^(জনাব|জনাবা)\s+/, '').trim()}
            </h4>
            <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-1 font-mono">@{profileUser.username}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">ইউজার রোল</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {profileUser.role === 'ADMIN' ? 'সুপার এডমিন' : 'সাধারণ ইউজার'}
              </p>
            </div>
            <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">ব্যাংক আইডি</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{profileUser.username}</p>
            </div>

            {emp && (
              <>
                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">পদবী</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{emp.designation}</p>
                </div>
                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ব্যক্তিগত নথি নং</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{emp.fileNo || 'নেই'}</p>
                </div>
                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">সেল</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{emp.cell?.name || 'নেই'}</p>
                </div>
              </>
            )}

            <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">মোবাইল নম্বর</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans tabular-nums">
                {profileUser.mobile ? toBanglaDigits(profileUser.mobile) : 'যুক্ত করা হয়নি'}
              </p>
            </div>

            <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">প্রবেশাধিকার প্রাপ্ত সেলসমূহ</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {profileUser.role === 'ADMIN' ? (
                  <span className="text-xs font-bold text-rose-600">সব সেল (সুপার এডমিন হিসেবে অ্যাক্সেস)</span>
                ) : profileUser.cells.length > 0 ? (
                  profileUser.cells.map(c => (
                    <span 
                      key={c.id} 
                      className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold"
                    >
                      {c.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-amber-600">কোনো সেল অ্যাসাইন করা নেই</span>
                )}
              </div>
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
            <button
              type="button"
              onClick={() => {
                const u = profileUser;
                onClose();
                onEdit(u);
              }}
              aria-label="ইউজার তথ্য সম্পাদনা করুন"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              সম্পাদনা করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
