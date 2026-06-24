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
  ShieldCheck
} from 'lucide-react';

// Custom Bangla digit converter
function toBanglaDigits(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
}

function getBanglaMonthLabel(yearMonth: string): string {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const monthNames = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const mIndex = parseInt(month, 10) - 1;
  return `${monthNames[mIndex]} ${toBanglaDigits(year)}`;
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

  const [filterType, setFilterType] = useState<'all' | 'month' | 'latest_bill'>('all');
  const [chosenMonth, setChosenMonth] = useState<string>('');

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
          const retrievedDuties = data.duties || [];
          setDuties(retrievedDuties);
          setLeaveBalance(data.leaveBalance || null);
          setIsEmployee(true);

          // Default chosenMonth to the most recent month in the duties list
          const months = Array.from(
            new Set(retrievedDuties.map((d: any) => d.date ? d.date.substring(0, 7) : null).filter(Boolean))
          ).sort().reverse() as string[];
          if (months.length > 0) {
            setChosenMonth(months[0]);
          }
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

  // Calculations for static top summaries (Current Month)
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // e.g. "2026-06"
  
  const currentMonthDuties = duties.filter(d => d.date && d.date.startsWith(currentMonthStr));
  const currentMonthCount = currentMonthDuties.length;
  
  const staticLateSittingCount = currentMonthDuties.filter(d => d.type === 'LATE_SITTING').length;
  const staticHolidayCount = currentMonthDuties.filter(d => d.type === 'HOLIDAY').length;
  const staticNightShiftCount = currentMonthDuties.filter(d => d.type === 'NIGHT_SHIFT').length;

  const pendingDuties = duties.filter(d => !d.orderRef);
  const pendingCount = pendingDuties.length;
  const pendingTotalAmount = pendingDuties.reduce((sum, d) => sum + (d.totalBill || 0), 0);

  const remainingLeave = leaveBalance?.remaining ?? 0;

  // Available unique months
  const availableMonths = Array.from(
    new Set(duties.map(d => d.date ? d.date.substring(0, 7) : null).filter(Boolean))
  ).sort().reverse() as string[];

  // Find the latest orderRef from the employee's duties
  const latestDutyWithRef = duties.find(d => d.orderRef);
  const latestBillRef = latestDutyWithRef?.orderRef || '';

  // Dynamic filter query resolution
  const filteredDuties = (() => {
    if (filterType === 'all') {
      return duties;
    }
    if (filterType === 'month') {
      const targetMonth = chosenMonth || (availableMonths[0] || currentMonthStr);
      return duties.filter(d => d.date && d.date.startsWith(targetMonth));
    }
    if (filterType === 'latest_bill') {
      if (!latestBillRef) return [];
      return duties.filter(d => d.orderRef === latestBillRef);
    }
    return duties;
  })();

  const filteredCount = filteredDuties.length;
  const lateSittingMonthDuties = filteredDuties.filter(d => d.type === 'LATE_SITTING');
  const lateSittingCount = lateSittingMonthDuties.length;
  const lateSittingAmount = lateSittingMonthDuties.reduce((sum, d) => sum + (d.totalBill || 0), 0);

  const holidayMonthDuties = filteredDuties.filter(d => d.type === 'HOLIDAY');
  const holidayCount = holidayMonthDuties.length;
  const holidayAmount = holidayMonthDuties.reduce((sum, d) => sum + (d.totalBill || 0), 0);

  const nightShiftMonthDuties = filteredDuties.filter(d => d.type === 'NIGHT_SHIFT');
  const nightShiftCount = nightShiftMonthDuties.length;
  const nightShiftAmount = nightShiftMonthDuties.reduce((sum, d) => sum + (d.totalBill || 0), 0);

  const totalAmountSum = lateSittingAmount + holidayAmount + nightShiftAmount;

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* Top Row: Quick Summaries (Current Month stats) */}
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
            <span className="p-2 rounded-lg bg-indigo-55 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Calendar size={18} />
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] font-bold">
            <span className="px-2 py-0.5 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 rounded-md border border-indigo-100/40 dark:border-indigo-900/30">
              লেট সিটিং: {toBanglaDigits(staticLateSittingCount)}
            </span>
            <span className="px-2 py-0.5 bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 rounded-md border border-sky-100/40 dark:border-sky-900/30">
              ছুটি: {toBanglaDigits(staticHolidayCount)}
            </span>
            <span className="px-2 py-0.5 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-100/40 dark:border-emerald-900/30">
              নাইট: {toBanglaDigits(staticNightShiftCount)}
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

      {/* Main Row: Personal Allowance Statement Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
        
        {/* Header containing Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-650 dark:text-indigo-400 shrink-0 animate-pulse" size={18} />
            <h3 className="font-extrabold text-slate-850 dark:text-slate-150 text-sm">
              ব্যক্তিগত ডিউটি ও ভাতার বিবরণী ({employee.name})
            </h3>
          </div>

          {/* Dynamic Segmented Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-[11px] font-bold font-sans">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                সর্বমোট
              </button>
              <button
                onClick={() => setFilterType('month')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === 'month'
                    ? 'bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                মাস ভিত্তিক
              </button>
              {latestBillRef && (
                <button
                  onClick={() => setFilterType('latest_bill')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === 'latest_bill'
                      ? 'bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  title={`লেটেস্ট বিল: ${latestBillRef}`}
                >
                  লেটেস্ট বিল
                </button>
              )}
            </div>

            {/* Dropdown for Month Selection */}
            {filterType === 'month' && availableMonths.length > 0 && (
              <select
                value={chosenMonth}
                onChange={(e) => setChosenMonth(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all font-sans cursor-pointer shadow-xs"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {getBanglaMonthLabel(m)}
                  </option>
                ))}
              </select>
            )}

            <Link 
              href="/my-portal" 
              className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center gap-0.5 group transition-colors pl-2"
            >
              আমার পোর্টাল
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Selected Bill Metadata Banner */}
        {filterType === 'latest_bill' && latestBillRef && (
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/30 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center justify-between font-sans animate-fade-in">
            <span>স্মারক রেফারেন্স: <span className="font-mono text-indigo-850 dark:text-indigo-300 font-black">{latestBillRef}</span></span>
            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 px-2.5 py-0.5 rounded-full font-bold">লেটেস্ট বিলের বিবরণী</span>
          </div>
        )}

        {/* Statement Grid */}
        <div className="grid grid-cols-1 gap-3.5 text-xs">
          
          {/* Row 1: Late Sitting */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-850">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Clock size={16} />
              </span>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">লেট সিটিং বিল (Snacks + Travel)</p>
                <p className="text-[10px] text-slate-405 dark:text-slate-500 mt-0.5">নাস্তা ৳১০০ + যাতায়াত ৳২০০ (৳৩০০/দিন)</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-8">
              <span className="px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] font-sans">
                {toBanglaDigits(lateSittingCount)} দিন
              </span>
              <span className="font-black text-slate-800 dark:text-slate-200 text-sm font-sans w-20 text-right">
                ৳{toBanglaDigits(lateSittingAmount.toLocaleString('en-US'))}/-
              </span>
            </div>
          </div>

          {/* Row 2: Holiday Duty */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-850">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shrink-0">
                <Award size={16} />
              </span>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">হলিডে ডিউটি বিল (Lunch + Travel)</p>
                <p className="text-[10px] text-slate-405 dark:text-slate-500 mt-0.5">দুপুরের খাবার ৳২৫০ + যাতায়াত ৳২৫০ (৳৫০০/দিন)</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-8">
              <span className="px-2.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 font-bold text-[10px] font-sans">
                {toBanglaDigits(holidayCount)} দিন
              </span>
              <span className="font-black text-slate-800 dark:text-slate-200 text-sm font-sans w-20 text-right">
                ৳{toBanglaDigits(holidayAmount.toLocaleString('en-US'))}/-
              </span>
            </div>
          </div>

          {/* Row 3: Night Shift */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-850">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck size={16} />
              </span>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">নাইট শিফট বিল (Dinner + Travel)</p>
                <p className="text-[10px] text-slate-405 dark:text-slate-500 mt-0.5">রাতের খাবার ৳৬০০ + যাতায়াত ৳৪০০ (৳১০০০/দিন)</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-8">
              <span className="px-2.5 py-0.5 rounded bg-emerald-55/65 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 font-bold text-[10px] font-sans">
                {toBanglaDigits(nightShiftCount)} দিন
              </span>
              <span className="font-black text-slate-800 dark:text-slate-200 text-sm font-sans w-20 text-right">
                ৳{toBanglaDigits(nightShiftAmount.toLocaleString('en-US'))}/-
              </span>
            </div>
          </div>

        </div>

        {/* Grand Total Row */}
        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {filterType === 'all' && 'অর্জিত সর্বমোট ব্যক্তিগত ডিউটি ও প্রদেয় ভাতা:'}
            {filterType === 'month' && `${getBanglaMonthLabel(chosenMonth || availableMonths[0])} মাসের ডিউটি ও প্রদেয় ভাতা:`}
            {filterType === 'latest_bill' && 'লেটেস্ট অফিস আদেশের আওতাধীন প্রদেয় ভাতা:'}
          </div>
          <div className="text-right flex items-center justify-end gap-6 text-xs font-sans">
            <span className="px-3 py-1 rounded-xl bg-indigo-650 text-white font-extrabold text-xs">
              {toBanglaDigits(filteredCount)} দিন
            </span>
            <span className="font-black text-indigo-650 dark:text-indigo-400 text-base">
              ৳{toBanglaDigits(totalAmountSum.toLocaleString('en-US'))}/- টাকা
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
