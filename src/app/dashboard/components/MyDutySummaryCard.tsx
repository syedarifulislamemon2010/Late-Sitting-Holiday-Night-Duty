'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  Banknote, 
  CalendarCheck,
  Sparkles,
  ChevronRight,
  Award,
  ShieldCheck,
  User,
  Phone,
  FileText
} from 'lucide-react';

// Custom Bangla digit converter
function toBanglaDigits(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
}

function getShortName(fullName: string): string {
  if (!fullName) return '';
  const clean = fullName.replace(/^(জনাব|জনাবা|মো:||মোঃ)\s+/, '').trim();
  if (clean.includes('রিয়াজুল')) return 'রিয়াজ';
  if (clean.includes('বাহার')) return 'বাহার';
  if (clean.includes('দেবাশীষ')) return 'দেবাশীষ';
  const parts = clean.split(/\s+/);
  return parts[0] || '';
}

interface Duty {
  id: number;
  type: string;
  date: string;
  totalBill: number;
  orderRef?: string | null;
}

interface LeaveBalance {
  total: number;
  used: number;
  remaining: number;
}

interface Employee {
  id: number;
  name: string;
  designation: string;
  bankId: string;
  cellName: string;
  fileNo?: string | null;
  mobile?: string | null;
}

export default function MyDutySummaryCard() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmployee, setIsEmployee] = useState(false);

  useEffect(() => {
    async function loadSummaryData() {
      try {
        const res = await fetch('/api/my-portal');
        if (!res.ok) {
          setIsEmployee(false);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.employee) {
          setEmployee(data.employee);
          setDuties(data.duties || []);
          setLeaveBalance(data.leaveBalance || null);
          setIsEmployee(true);
        }
      } catch (err) {
        console.error('Error fetching personal summary:', err);
        setIsEmployee(false);
      } finally {
        setLoading(false);
      }
    }
    loadSummaryData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!isEmployee || !employee) {
    return null;
  }

  // Calculations for metrics
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // e.g. "2026-06"
  
  const currentMonthDuties = duties.filter(d => d.date && d.date.startsWith(currentMonthStr));
  const currentMonthCount = currentMonthDuties.length;
  
  const lateSittingMonthDuties = currentMonthDuties.filter(d => d.type === 'LATE_SITTING');
  const lateSittingCount = lateSittingMonthDuties.length;
  const lateSittingAmount = lateSittingMonthDuties.reduce((sum, d) => sum + (d.totalBill || 0), 0);

  const holidayMonthDuties = currentMonthDuties.filter(d => d.type === 'HOLIDAY');
  const holidayCount = holidayMonthDuties.length;
  const holidayAmount = holidayMonthDuties.reduce((sum, d) => sum + (d.totalBill || 0), 0);

  const nightShiftMonthDuties = currentMonthDuties.filter(d => d.type === 'NIGHT_SHIFT');
  const nightShiftCount = nightShiftMonthDuties.length;
  const nightShiftAmount = nightShiftMonthDuties.reduce((sum, d) => sum + (d.totalBill || 0), 0);

  const pendingDuties = duties.filter(d => !d.orderRef);
  const pendingCount = pendingDuties.length;
  const pendingTotalAmount = pendingDuties.reduce((sum, d) => sum + (d.totalBill || 0), 0);

  const remainingLeave = leaveBalance?.remaining ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch font-sans">
      
      {/* Left Column: Profile Card (ড্যাশবোর্ড প্রোফাইল) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
        
        {/* Banner with avatar placement */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 h-28 relative">
          <div className="absolute left-1/2 -bottom-10 -translate-x-1/2 w-20 h-20 rounded-full bg-white dark:bg-slate-900 p-1 flex items-center justify-center shadow-md">
            <div className="w-full h-full rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
              <span className="font-extrabold text-indigo-700 dark:text-indigo-400 text-sm font-sans tracking-wide">
                {getShortName(employee.name)}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="pt-12 pb-5 px-5 space-y-4">
          <div className="text-center">
            <h4 className="font-extrabold text-slate-850 dark:text-slate-100 text-base leading-tight">
              {employee.name}
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">
              ব্যক্তিগত ড্যাশবোর্ড পরিচিতি
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Box 1: designation */}
            <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 space-y-0.5">
              <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[8px]">পদবী</p>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                {employee.designation}
              </p>
            </div>
            {/* Box 2: cell */}
            <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 space-y-0.5">
              <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[8px]">সেল</p>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                {employee.cellName}
              </p>
            </div>
            {/* Box 3: bank ID & file number */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 space-y-0.5">
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[8px]">ব্যাংক আইডি</p>
                <p className="font-extrabold text-slate-850 dark:text-slate-200 text-xs font-mono">
                  {employee.bankId}
                </p>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 space-y-0.5">
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[8px]">ব্যক্তিগত নথি নং</p>
                <p className="font-extrabold text-slate-850 dark:text-slate-200 text-xs break-all">
                  {employee.fileNo || 'প্রদান করা হয়নি'}
                </p>
              </div>
            </div>
            {/* Box 4: mobile number */}
            <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 space-y-0.5">
              <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[8px]">মোবাইল নম্বর</p>
              <p className="font-extrabold text-slate-850 dark:text-slate-200 text-xs">
                {employee.mobile || 'প্রদান করা হয়নি'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Duty Statement & Summaries (ব্যক্তিগত ডিউটি ও ভাতার বিবরণী) */}
      <div className="lg:col-span-2 flex flex-col justify-between gap-6">
        
        {/* KPI Summaries Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Current Month Duties */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">চলতি মাসের ডিউটি</p>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {toBanglaDigits(currentMonthCount)} টি
                </p>
              </div>
              <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Calendar size={18} />
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] font-bold">
              <span className="px-2 py-0.5 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 rounded-md border border-indigo-100/40 dark:border-indigo-900/30">
                লেট সিটিং: {toBanglaDigits(lateSittingCount)}
              </span>
              <span className="px-2 py-0.5 bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 rounded-md border border-sky-100/40 dark:border-sky-900/30">
                ছুটি: {toBanglaDigits(holidayCount)}
              </span>
              <span className="px-2 py-0.5 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-100/40 dark:border-emerald-900/30">
                নাইট: {toBanglaDigits(nightShiftCount)}
              </span>
            </div>
          </div>

          {/* Card 2: Pending/Unbilled Bill */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">অমীমাংসিত (অ-বিল্ড) ডিউটি</p>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {toBanglaDigits(pendingCount)} টি
                </p>
              </div>
              <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
                <Clock size={18} />
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Banknote size={12} className="text-emerald-500" />
                <span>প্রাক্কলিত ভাতা:</span>
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-sans font-extrabold">
                ৳{toBanglaDigits(pendingTotalAmount.toLocaleString('bn-BD'))}
              </span>
            </div>
          </div>

          {/* Card 3: Remaining Casual Leave */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">অবশিষ্ট নৈমিত্তিক ছুটি</p>
                <p className="text-xl font-black text-rose-600 dark:text-rose-450 mt-1">
                  {toBanglaDigits(remainingLeave)} দিন
                </p>
              </div>
              <span className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 shrink-0">
                <CalendarCheck size={18} />
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-normal">
              * স্টেশন ত্যাগ ও ঘটনোত্তর আবেদন এই ছুটির হিসাবের অন্তর্ভুক্ত।
            </div>
          </div>
        </div>

        {/* Categories Allowance Statement Sheet */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-600 dark:text-indigo-400 shrink-0" size={16} />
                <h3 className="font-extrabold text-slate-800 dark:text-slate-150 text-xs sm:text-sm">
                  ব্যক্তিগত ডিউটি ও ভাতার বিবরণী (চলতি মাস)
                </h3>
              </div>
              <Link 
                href="/my-portal" 
                className="text-[10px] sm:text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center gap-0.5 group transition-colors"
              >
                আমার পোর্টাল
                <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Statement Grid */}
            <div className="mt-4 space-y-3 text-xs">
              
              {/* Row 1: Late Sitting */}
              <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-850">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Clock size={16} />
                  </span>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">লেট সিটিং বিল (Snacks + Travel)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">নাস্তা ৳১০০ + যাতায়াত ৳২০০ (৳৩০০/দিন)</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                    {toBanglaDigits(lateSittingCount)} দিন
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm font-sans w-16 text-right">
                    ৳{toBanglaDigits(lateSittingAmount.toLocaleString('en-US'))}/-
                  </span>
                </div>
              </div>

              {/* Row 2: Holiday Duty */}
              <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-850">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shrink-0">
                    <Award size={16} />
                  </span>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">হলিডে ডিউটি বিল (Lunch + Travel)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">দুপুরের খাবার ৳২৫০ + যাতায়াত ৳২৫০ (৳৫০০/দিন)</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 font-bold text-[10px]">
                    {toBanglaDigits(holidayCount)} দিন
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm font-sans w-16 text-right">
                    ৳{toBanglaDigits(holidayAmount.toLocaleString('en-US'))}/-
                  </span>
                </div>
              </div>

              {/* Row 3: Night Shift */}
              <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-850">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <ShieldCheck size={16} />
                  </span>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">নাইট শিফট বিল (Dinner + Travel)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">রাতের খাবার ৳৬০০ + যাতায়াত ৳৪০০ (৳১০০০/দিন)</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                    {toBanglaDigits(nightShiftCount)} দিন
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm font-sans w-16 text-right">
                    ৳{toBanglaDigits(nightShiftAmount.toLocaleString('en-US'))}/-
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Grand Total Row */}
          <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 flex items-center justify-between">
            <div className="text-xs font-black text-slate-800 dark:text-slate-150">
              সর্বমোট অর্জিত ডিউটি ও প্রদেয় ভাতা:
            </div>
            <div className="text-right flex items-center gap-6 text-xs">
              <span className="px-2.5 py-0.5 rounded bg-indigo-600 text-white font-extrabold">
                {toBanglaDigits(currentMonthCount)} দিন
              </span>
              <span className="font-black text-indigo-650 dark:text-indigo-400 text-base font-sans">
                ৳{toBanglaDigits((lateSittingAmount + holidayAmount + nightShiftAmount).toLocaleString('en-US'))}/- টাকা
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
