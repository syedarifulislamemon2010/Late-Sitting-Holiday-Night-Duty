'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar,
  Clock,
  Briefcase,
  AlertCircle,
  Building2,
  Users,
  CalendarCheck,
  Receipt,
  FileText,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
  ChevronRight,
  Info,
  DollarSign,
  Compass,
  CalendarPlus,
  UserPlus
} from 'lucide-react';

// Custom Bangla digit converter
function toBanglaDigits(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
}

const MONTH_NAMES = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const WEEKDAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];

// Days in each month of 2026
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Start day of week (0 = Sunday, 1 = Monday, etc.) for each month in 2026:
// 2026-01-01 is a Thursday (4)
const MONTH_START_DAYS = [4, 0, 0, 3, 5, 1, 3, 6, 2, 4, 0, 2];

// Default 2026 Bangladesh public holidays
const DEFAULT_2026_HOLIDAYS = [
  { date: '2026-02-04', name: 'পবিত্র শবে বরাত' },
  { date: '2026-02-21', name: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস' },
  { date: '2026-03-17', name: 'পবিত্র শবে কদর' },
  { date: '2026-03-19', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-20', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-21', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-22', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-23', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-26', name: 'স্বাধীনতা ও জাতীয় দিবস' },
  { date: '2026-04-14', name: 'বাংলা নববর্ষ (পহেলা বৈশাখ)' },
  { date: '2026-05-01', name: 'মে দিবস ও বুদ্ধ পূর্ণিমা' },
  { date: '2026-05-25', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-26', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-27', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-28', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-29', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-30', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-31', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-06-26', name: 'পবিত্র আশুরা' },
  { date: '2026-07-01', name: 'ব্যাংক ছুটির দিন (অর্ধ-বার্ষিকী)' },
  { date: '2026-08-05', name: 'জুলাই গণঅভ্যুত্থান দিবস' },
  { date: '2026-08-26', name: 'পবিত্র ঈদে মিলাদুন্নবী (সা.)' },
  { date: '2026-09-04', name: 'শুভ জন্মাষ্টমী' },
  { date: '2026-10-20', name: 'দূর্গাপূজা (মহা নবমী)' },
  { date: '2026-10-21', name: 'দূর্গাপূজা (বিজয়া দশমী)' },
  { date: '2026-12-16', name: 'বিজয় দিবস' },
  { date: '2026-12-25', name: 'যীশু খ্রীষ্টের জন্মদিন (বড় দিন)' },
  { date: '2026-12-31', name: 'ব্যাংক ছুটির দিন (বার্ষিকী)' },
];

export default function Dashboard() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);

  // Initialize selected month to current month if in year 2026
  useEffect(() => {
    const today = new Date();
    if (today.getFullYear() === 2026) {
      setSelectedMonth(today.getMonth());
    } else {
      setSelectedMonth(0); // default to Jan
    }

    async function loadStats() {
      try {
        const holidayRes = await fetch('/api/holidays');
        const holidaysData = await holidayRes.json();
        setHolidays(Array.isArray(holidaysData) ? holidaysData : []);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Combine default 2026 holidays with any user-configured database holidays
  let allHolidays = [...DEFAULT_2026_HOLIDAYS];
  holidays.forEach((h: any) => {
    if (h.isWorkingDay) {
      allHolidays = allHolidays.filter(dh => dh.date !== h.date);
    } else {
      if (h.date.startsWith('2026') && !allHolidays.some(dh => dh.date === h.date)) {
        allHolidays.push({ date: h.date, name: h.name });
      }
    }
  });
  allHolidays.sort((a, b) => a.date.localeCompare(b.date));

  // Determine upcoming holidays relative to today's date
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingHolidaysList = allHolidays.filter(h => h.date >= todayStr).slice(0, 5);
  const finalUpcomingHolidays = upcomingHolidaysList.length > 0 ? upcomingHolidaysList : allHolidays.slice(0, 5);

  // Calculate calendar elements for the selected month of 2026
  const daysInMonth = DAYS_IN_MONTH[selectedMonth];
  const startDay = MONTH_START_DAYS[selectedMonth];
  
  const slots: { day: number | null; dateStr: string | null; isHoliday: boolean; holidayName: string | null; isWeekend: boolean }[] = [];
  
  // Empty padding cells before the 1st of the month
  for (let i = 0; i < startDay; i++) {
    slots.push({ day: null, dateStr: null, isHoliday: false, holidayName: null, isWeekend: false });
  }
  
  // Fill in active calendar slots
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `2026-${(selectedMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Check if weekend (Friday=5, Saturday=6 in Bangladesh)
    const d = new Date(2026, selectedMonth, day);
    const dayOfWeek = d.getDay();
    
    // Default weekends in Bangladesh (Friday and Saturday)
    let isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    
    // Override May 23rd (Saturday) to be a working day (not weekend)
    if (dateStr === '2026-05-23') {
      isWeekend = false;
    }
    
    // Override weekend if marked as working day in the database
    const dbHol = holidays.find(h => h.date === dateStr);
    if (dbHol && dbHol.isWorkingDay) {
      isWeekend = false;
    }
    
    const hol = allHolidays.find(h => h.date === dateStr);
    const isHoliday = !!hol;
    const holidayName = hol ? hol.name : null;
    
    slots.push({ day, dateStr, isHoliday, holidayName, isWeekend });
  }

  // Filter holidays of the active month
  const selectedMonthHolidays = allHolidays.filter(h => {
    const parts = h.date.split('-');
    return parts[0] === '2026' && parseInt(parts[1], 10) === (selectedMonth + 1);
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[450px] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-[450px] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Title & Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-wide font-sans flex items-center gap-3">
            <Compass className="text-indigo-600 animate-spin-slow" size={28} />
            লেট সিটিং, সরকারি ছুটি ও রাত্রীকালীন ডিউটি পোর্টাল
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            জনতা ব্যাংক পিএলসি. এর অনলাইন ব্যাংকিং ডিপার্টমেন্টের ডিউটি ও আপ্যায়ন ব্যয়ের রিয়েল-টাইম সারসংক্ষেপ।
          </p>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Section (Interactive Calendar & Month Picker) - Spans 2 columns */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Beautiful Month Picker Tabs */}
          <div className="glass-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <Calendar className="text-indigo-600" size={18} />
                ২০২৬ সালের সরকারি ছুটির ক্যালেন্ডার
              </h3>
              <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold rounded-full font-sans">
                ২০২৬ সাল
              </span>
            </div>
            
            {/* Month Selection Buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {MONTH_NAMES.map((name, idx) => (
                <button
                  key={name}
                  onClick={() => setSelectedMonth(idx)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                    selectedMonth === idx
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.03]'
                      : 'bg-slate-50/70 hover:bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 dark:text-slate-400'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Interactive Grid Calendar */}
            <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/20">
              
              {/* Month Name and Summary Header */}
              <div className="text-center pb-4">
                <h4 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-200">
                  {MONTH_NAMES[selectedMonth]} ২০২৬
                </h4>
                <p className="font-sans mt-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4">
                  <span className="text-red-500 font-extrabold text-base sm:text-lg">
                    মোট সরকারি ছুটি: {toBanglaDigits(selectedMonthHolidays.length)} টি
                  </span>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base sm:text-lg">
                    ওয়ার্কিং ডে {toBanglaDigits(slots.filter(s => s.day !== null && !s.isWeekend && !s.isHoliday).length)} দিন
                  </span>
                </p>
              </div>

              {/* Day-of-week Headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-[10px] uppercase text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                {WEEKDAYS.map((w, index) => (
                  <div key={w} className={index === 5 || index === 6 ? 'text-rose-500' : ''}>
                    {w}
                  </div>
                ))}
              </div>

              {/* Calendar Slots */}
              <div className="grid grid-cols-7 gap-1.5 mt-2.5">
                {slots.map((slot, idx) => {
                  if (slot.day === null) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }

                  let cellClass = 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-850 hover:bg-slate-50/60 dark:hover:bg-slate-850/60';
                  let holidayDot = false;

                  if (slot.isHoliday) {
                    cellClass = 'bg-rose-500 text-white font-extrabold shadow-sm scale-[1.02] border border-rose-600 hover:bg-rose-600 shadow-rose-500/10 cursor-pointer relative group';
                  } else if (slot.isWeekend) {
                    cellClass = 'bg-rose-50/40 dark:bg-rose-950/10 text-rose-600 dark:text-rose-455 font-bold border border-rose-100/50 dark:border-rose-950/20';
                  }

                  return (
                    <div
                      key={`day-${slot.day}`}
                      title={slot.holidayName || (slot.isWeekend ? 'সাপ্তাহিক ছুটি' : '')}
                      className={`aspect-square rounded-xl text-xs flex flex-col items-center justify-center transition-all relative ${cellClass}`}
                    >
                      <span className="font-sans font-bold text-sm">
                        {slot.day}
                      </span>
                      {slot.isHoliday && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white animate-pulse" />
                      )}
                      
                      {/* Hover Tooltip for Holidays */}
                      {slot.isHoliday && slot.holidayName && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 hidden group-hover:block bg-slate-900 text-white text-[9px] leading-relaxed p-2 rounded-lg text-center z-10 shadow-lg font-sans font-bold">
                          {slot.holidayName}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            {/* List of Holidays for Selected Month */}
            {selectedMonthHolidays.length > 0 ? (
              <div className="pt-2 space-y-2">
                <p className="text-xs font-bold text-slate-500">ছুটির বিবরণীসমূহ:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedMonthHolidays.map(h => (
                    <div key={h.date} className="flex items-center gap-2 p-2 bg-rose-50/30 dark:bg-rose-950/5 border border-rose-100/30 dark:border-rose-950/10 rounded-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350">
                        {toBanglaDigits(new Date(h.date).getDate())} তারিখ: {h.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic pt-2">এই মাসে সাধারণ সরকারি কোনো ছুটি নেই।</p>
            )}

          </div>

          {/* Quick Actions Panel */}
          <div className="glass-card p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                <TrendingUp className="text-indigo-600" size={20} />
                ঝটপট অ্যাডমিন অ্যাকশন
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 font-sans">
              <Link href="/roster" className="p-4 rounded-2xl bg-indigo-50/30 hover:bg-indigo-50 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/20 text-center flex flex-col items-center gap-3 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none group-hover:scale-110 transition-transform">
                  <CalendarPlus size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">ডিউটি দিন</h4>
                  <p className="text-[9px] text-slate-400 mt-1">রপ্তানি ও ছুটি ডিউটি</p>
                </div>
              </Link>

              <Link href="/employees" className="p-4 rounded-2xl bg-emerald-50/30 hover:bg-emerald-50 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 border border-emerald-100/40 dark:border-emerald-900/20 text-center flex flex-col items-center gap-3 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-none group-hover:scale-110 transition-transform">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">কর্মকর্তা যুক্ত</h4>
                  <p className="text-[9px] text-slate-400 mt-1">নতুন ডেটাবেজ এন্ট্রি</p>
                </div>
              </Link>

              <Link href="/billing" className="p-4 rounded-2xl bg-amber-50/30 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 border border-amber-100/40 dark:border-amber-900/20 text-center flex flex-col items-center gap-3 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-200 dark:shadow-none group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">বিল নোট তৈরি</h4>
                  <p className="text-[9px] text-slate-400 mt-1">আপ্যায়ন বিল শিট</p>
                </div>
              </Link>

              <Link href="/roster" className="p-4 rounded-2xl bg-sky-50/30 hover:bg-sky-50 dark:bg-sky-950/10 dark:hover:bg-sky-950/20 border border-sky-100/40 dark:border-sky-900/20 text-center flex flex-col items-center gap-3 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-200 dark:shadow-none group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-sky-900 dark:text-sky-200">রোস্টার ও জেনারেট</h4>
                  <p className="text-[9px] text-slate-400 mt-1">অফিস আদেশ ডাউনলোড</p>
                </div>
              </Link>

              <Link href="/lunch-bill" className="p-4 rounded-2xl bg-rose-50/30 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 border border-rose-100/40 dark:border-rose-900/20 text-center flex flex-col items-center gap-3 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200 dark:shadow-none group-hover:scale-110 transition-transform">
                  <Receipt size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">লাঞ্চ বিল শিট</h4>
                  <p className="text-[9px] text-slate-400 mt-1">খাবার ভাতার হিসাব</p>
                </div>
              </Link>
            </div>
          </div>

        </div>

        {/* Right Section (Upcoming Holidays & approved Rate Cards) - Spans 1 column */}
        <div className="space-y-8">
          
          {/* Upcoming Configuration Public Holidays */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">আসন্ন সরকারি ছুটি</h3>
                <p className="text-[9px] text-slate-400 mt-0.5 font-medium">পরবর্তী ক্যালেন্ডার ছুটির দিনসমূহ।</p>
              </div>
              <span className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-rose-500 animate-pulse">
                <CalendarCheck size={14} />
              </span>
            </div>
            
            {finalUpcomingHolidays.length > 0 ? (
              <div className="space-y-3 font-sans">
                {finalUpcomingHolidays.map((holiday: any) => {
                  const dateObj = new Date(holiday.date);
                  return (
                    <div key={holiday.date} className="flex items-center gap-3 hover:bg-slate-50/55 dark:hover:bg-slate-850/30 p-2 rounded-xl transition-colors">
                      <div className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-455 font-bold text-center shrink-0 border border-rose-100 dark:border-rose-900/30 w-12 shadow-xs">
                        <p className="text-xs leading-none tracking-tight">
                          {toBanglaDigits(dateObj.getDate())}
                        </p>
                        <p className="text-[8px] leading-none mt-1 font-bold">
                          {dateObj.toLocaleDateString('bn-BD', { month: 'short' })}
                        </p>
                      </div>
                      <div className="leading-tight">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{holiday.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 tracking-wide mt-1">
                          {toBanglaDigits(dateObj.toLocaleDateString('bn-BD', { weekday: 'long' }))} ({toBanglaDigits(holiday.date)})
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400">আসন্ন ছুটির কোনো দিন পাওয়া যায়নি।</p>
              </div>
            )}
          </div>

          {/* Approved Janata Bank Rates Guideline Card Block */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">আপ্যায়ন বিল ও যাতায়াত ভাতা রেট</h3>
                <p className="text-[9px] text-slate-400 mt-0.5 font-medium">জনতা ব্যাংক পিএলসি. এর অনুমোদিত নির্দেশিকা।</p>
              </div>
              <span className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-amber-500">
                <Info size={14} />
              </span>
            </div>

            <div className="space-y-4 font-sans">
              
              {/* Late Sitting (৳300) */}
              <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-indigo-700 dark:text-indigo-400 text-xs">Late Sitting (লেট সিটিং)</h4>
                  <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">৳৩০০</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1 leading-normal">
                  <p className="flex justify-between font-bold"><span>• সান্ধ্যকালীন নাস্তা:</span> <span>৳১০০</span></p>
                  <p className="flex justify-between font-bold"><span>• যাতায়াত ভাতা:</span> <span>৳২০০</span></p>
                  <div className="h-px bg-indigo-100/30 my-1" />
                  <p className="text-[9px] text-rose-500 leading-normal font-bold">কর্মদিবসে সন্ধ্যা ০৭:০০ টার পর দায়িত্ব পালনের ক্ষেত্রে প্রযোজ্য।</p>
                </div>
              </div>

              {/* Holiday Duty (৳500) */}
              <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-emerald-700 dark:text-emerald-400 text-xs">Holiday Duty (সরকারি ছুটি)</h4>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">৳৫০০</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1 leading-normal">
                  <p className="flex justify-between font-bold"><span>• দুপুরের খাবার:</span> <span>৳২৫০</span></p>
                  <p className="flex justify-between font-bold"><span>• যাতায়াত ভাতা:</span> <span>৳২৫০</span></p>
                  <div className="h-px bg-emerald-100/30 my-1" />
                  <p className="text-[9px] text-emerald-600 leading-normal font-bold">শুক্রবার, শনিবার ও অন্যান্য সরকারি ছুটির দিনগুলোতে ডিউটি।</p>
                </div>
              </div>

              {/* Night Shift (৳1000) */}
              <div className="p-4 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-rose-700 dark:text-rose-455 text-xs">Night Shift (রাত্রীকালীন ডিউটি)</h4>
                  <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">৳১,০০০</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1 leading-normal">
                  <p className="flex justify-between font-bold"><span>• রাতের খাবার (ডিনার):</span> <span>৳৬০০</span></p>
                  <p className="flex justify-between font-bold"><span>• যাতায়াত ভাতা:</span> <span>৳৪০০</span></p>
                  <div className="h-px bg-rose-100/30 my-1" />
                  <p className="text-[9px] text-rose-600 dark:text-rose-455 leading-normal font-black font-sans">রিপোর্ট এর ডাটা এক্সট্রাকশন, ডাটা আপ্লোড এবং ডাউনলোড ডিউটি।</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
