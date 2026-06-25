'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar,
  CalendarCheck,
  Info,
  Compass,
  BarChart3,
  TrendingUp,
  X,
  Loader2,
  Building2,
  Sparkles
} from 'lucide-react';

import MyDutySummaryCard from './components/MyDutySummaryCard';

// Custom Bangla digit converter
function toBanglaDigits(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
}

const MONTH_NAMES = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const WEEKDAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

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

interface Holiday {
  date: string;
  name: string;
  isWorkingDay?: boolean;
}

export default function DashboardPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const today = new Date();
    return today.getFullYear() === 2026 ? today.getMonth() : 0;
  });

  const [activeChart, setActiveChart] = useState<'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' | null>(null);
  const [cellWiseData, setCellWiseData] = useState<{ name: string; count: number }[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<{ name: string; count: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [recentModules, setRecentModules] = useState<{ title: string; url: string }[]>([]);

  const loadRecentModules = () => {
    const stored = localStorage.getItem('recentModules');
    if (stored) {
      try {
        setRecentModules(JSON.parse(stored));
      } catch {
        setRecentModules([]);
      }
    } else {
      setRecentModules([]);
    }
  };

  useEffect(() => {
    loadRecentModules();
    window.addEventListener('storage', loadRecentModules);
    return () => window.removeEventListener('storage', loadRecentModules);
  }, []);

  useEffect(() => {
    if (!activeChart) return;

    async function fetchChartData() {
      setChartLoading(true);
      try {
        const res = await fetch(`/api/duties?type=${activeChart}`);
        if (res.ok) {
          const list = await res.json();
          
          const cellsMap: Record<string, number> = {};
          const monthlyCounts = Array(12).fill(0);

          list.forEach((duty: any) => {
            const cellName = duty.employee?.cell?.name || 'অন্যান্য';
            cellsMap[cellName] = (cellsMap[cellName] || 0) + 1;

            if (duty.date) {
              const monthIndex = new Date(duty.date).getMonth();
              if (monthIndex >= 0 && monthIndex < 12) {
                monthlyCounts[monthIndex]++;
              }
            }
          });

          const cellData = Object.keys(cellsMap).map(name => ({
            name,
            count: cellsMap[name]
          })).sort((a, b) => b.count - a.count);

          const trendData = MONTH_NAMES.map((name, idx) => ({
            name: name.substring(0, 3),
            count: monthlyCounts[idx]
          }));

          setCellWiseData(cellData);
          setMonthlyTrend(trendData);
        }
      } catch (err) {
        console.error('Analytics aggregation error:', err);
      } finally {
        setChartLoading(false);
      }
    }

    fetchChartData();
  }, [activeChart]);

  useEffect(() => {
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
  holidays.forEach((h: Holiday) => {
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
  const upcomingHolidaysList = allHolidays.filter(h => h.date >= todayStr).slice(0, 12);
  const finalUpcomingHolidays = upcomingHolidaysList.length > 0 ? upcomingHolidaysList : allHolidays.slice(0, 12);

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
          <h1 className="app-page-title text-slate-800 dark:text-slate-100 tracking-wide font-sans flex items-center gap-3">
            <Compass className="text-indigo-600 animate-spin-slow" size={28} />
            লেট সিটিং, ছুটির দিনে ও রাত্রীকালীন ডিউটি পোর্টাল
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            জনতা ব্যাংক পিএলসি. এর অনলাইন ব্যাংকিং ডিপার্টমেন্টের ডিউটি ও আপ্যায়ন ব্যয়ের রিয়েল-টাইম সারসংক্ষেপ।
          </p>

          {/* Navigation Intelligence Layer (Recently Visited) */}
          {recentModules.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] font-bold text-slate-400 font-sans">
              <span className="flex items-center gap-1">
                <Sparkles size={11} className="text-indigo-500 shrink-0" />
                <span>সাম্প্রতিক কার্যক্রম:</span>
              </span>
              {recentModules.map((mod, idx) => (
                <Link 
                  key={idx} 
                  href={mod.url}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-850/60 hover:bg-indigo-55/60 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 border border-slate-200/50 dark:border-slate-800/70 rounded-xl transition-all font-semibold"
                >
                  {mod.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Personal Summary Card Widget */}
      <MyDutySummaryCard />

      {/* Styled Quick Access Section */}
      <div className="bg-slate-50/40 dark:bg-slate-900/10 rounded-2xl p-6 border border-gray-200/50 dark:border-slate-800/80">
        <h2
          className="font-bold text-gray-700 dark:text-slate-300 mb-4 text-base"
          style={{ fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif" }}
        >
          দ্রুত অ্যাক্সেস
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "রোস্টার", href: "/roster" },
            { label: "বিলিং", href: "/billing" },
            { label: "কর্মকর্তা", href: "/employees" },
            { label: "ছুটি", href: "/leave" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-center py-3 px-4 bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-sm font-medium text-slate-750 dark:text-slate-300 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors shadow-xs"
              style={{ fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif" }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
        
        {/* Left Section (Interactive Calendar & Month Picker) - Spans 2 columns */}
        <div className="xl:col-span-2 flex flex-col">
          
          {/* Beautiful Month Picker Tabs */}
          <div className="glass-card p-5 rounded-2xl space-y-4 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <Calendar className="text-indigo-650" size={18} />
                ২০২৬ সালের সরকারি ছুটির ক্যালেন্ডার
              </h3>
              <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold rounded-full font-sans">
                ২০২৬ সাল
              </span>
            </div>
            
            {/* Month Selection Buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 w-full">
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
            <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/20 w-full">
              
              {/* Month Name and Summary Header */}
              <div className="text-center pb-4">
                <h4 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-200">
                  {MONTH_NAMES[selectedMonth]} ২০২৬
                </h4>
                <p className="font-sans mt-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4">
                  <span className="text-red-505 font-extrabold text-base sm:text-lg">
                    মোট সরকারি ছুটি: {toBanglaDigits(selectedMonthHolidays.length)} টি
                  </span>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base sm:text-lg">
                    মোট কার্যদিবস: {toBanglaDigits(slots.filter(s => s.day !== null && !s.isWeekend && !s.isHoliday).length)} দিন
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

                  const isToday = slot.dateStr === todayStr;
                  let cellClass = 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/60';

                  if (slot.isHoliday) {
                    cellClass = 'bg-rose-500 text-white font-extrabold shadow-sm scale-[1.02] border border-rose-600 hover:bg-rose-600 shadow-rose-500/10 cursor-pointer relative group';
                  } else if (slot.isWeekend) {
                    cellClass = 'bg-rose-50/40 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-100/50 dark:border-rose-950/20';
                  }

                  if (isToday) {
                    cellClass += ' ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900';
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
                      {isToday && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-650 dark:bg-indigo-400" />
                      )}
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
                    <div key={h.date} className="flex items-center gap-2 p-2 bg-rose-50/30 dark:bg-rose-955/5 border border-rose-100/30 dark:border-rose-950/10 rounded-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
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

        </div>

        {/* Right Section (Upcoming Holidays & approved Rate Cards) - Spans 1 column */}
        <div className="flex flex-col">
          
          {/* Upcoming Configuration Public Holidays */}
          <div className="glass-card p-6 rounded-2xl space-y-4 flex-1">
            <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3 flex justify-between items-center">
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
                {finalUpcomingHolidays.map((holiday: Holiday) => {
                  const dateObj = new Date(holiday.date);
                  return (
                    <div key={holiday.date} className="flex items-center gap-4 hover:bg-slate-50/55 dark:hover:bg-slate-800/30 p-3 rounded-2xl transition-colors border border-slate-100/40 dark:border-slate-800/20 bg-white/40 dark:bg-slate-900/10 shadow-xs">
                      <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold text-center shrink-0 border border-rose-100 dark:border-rose-900/30 w-14 shadow-sm">
                        <p className="text-sm sm:text-base leading-none tracking-tight">
                          {toBanglaDigits(dateObj.getDate())}
                        </p>
                        <p className="text-[9px] sm:text-[10px] leading-none mt-1.5 font-bold">
                          {MONTH_NAMES[dateObj.getMonth()]}
                        </p>
                      </div>
                      <div className="leading-normal space-y-1">
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{holiday.name}</p>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 tracking-wide">
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

        </div>

      </div>

      {/* Approved Janata Bank Rates Guideline Card Block (Full Width) */}
      <div className="glass-card p-6 rounded-2xl space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
              <Info className="text-amber-500" size={20} />
              আপ্যায়ন বিল ও যাতায়াত ভাতা রেট
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium font-sans">জনতা ব্যাংক পিএলসি. এর অনুমোদিত নির্দেশিকা। কার্ডে ক্লিক করে অ্যানালিটিক্স দেখুন।</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          
          {/* Late Sitting (৳300) */}
          <div 
            onClick={() => setActiveChart(activeChart === 'LATE_SITTING' ? null : 'LATE_SITTING')}
            className={`p-5 bg-indigo-50/20 dark:bg-indigo-950/10 border rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all select-none ${
              activeChart === 'LATE_SITTING' ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-sm' : 'border-indigo-100/50 dark:border-indigo-900/20'
            }`}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-indigo-100/30 pb-2">
                <h4 className="font-extrabold text-indigo-700 dark:text-indigo-400 text-sm">Late Sitting (লেট সিটিং)</h4>
                <span className="text-xs font-bold text-indigo-650 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-100/60 dark:border-indigo-900/40 shadow-xs">৳৩০০</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                <p className="flex justify-between"><span>• নাস্তা ভাতা:</span> <span className="font-bold">৳১০০</span></p>
                <p className="flex justify-between"><span>• যাতায়াত ভাতা:</span> <span className="font-bold">৳২০০</span></p>
              </div>
            </div>
            <p className="text-[10px] text-rose-500 leading-normal font-bold pt-2 border-t border-dashed border-indigo-100/20">কর্মদিবসে অফিস ছুটির পর দায়িত্ব পালনের ক্ষেত্রে প্রযোজ্য।</p>
          </div>

          {/* Holiday Duty (৳500) */}
          <div 
            onClick={() => setActiveChart(activeChart === 'HOLIDAY' ? null : 'HOLIDAY')}
            className={`p-5 bg-emerald-50/20 dark:bg-emerald-955/10 border rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all select-none ${
              activeChart === 'HOLIDAY' ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-sm' : 'border-emerald-100/50 dark:border-emerald-900/20'
            }`}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-100/30 pb-2">
                <h4 className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">Holiday Duty (সরকারি ছুটি)</h4>
                <span className="text-xs font-bold text-emerald-650 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-100/60 dark:border-emerald-900/40 shadow-xs">৳৫০০</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                <p className="flex justify-between"><span>• দুপুরের খাবার:</span> <span className="font-bold">৳২৫০</span></p>
                <p className="flex justify-between"><span>• যাতায়াত ভাতা:</span> <span className="font-bold">৳২৫০</span></p>
              </div>
            </div>
            <p className="text-[10px] text-emerald-600 leading-normal font-bold pt-2 border-t border-dashed border-emerald-100/20">শুক্রবার, শনিবার ও সরকারি ছুটির দিনগুলোতে ডিউটি।</p>
          </div>

          {/* Night Shift (৳1000) */}
          <div 
            onClick={() => setActiveChart(activeChart === 'NIGHT_SHIFT' ? null : 'NIGHT_SHIFT')}
            className={`p-5 bg-rose-50/20 dark:bg-rose-955/10 border rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all select-none ${
              activeChart === 'NIGHT_SHIFT' ? 'ring-2 ring-rose-500 border-rose-500 shadow-sm' : 'border-rose-100/50 dark:border-rose-900/20'
            }`}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-rose-100/30 pb-2">
                <h4 className="font-extrabold text-rose-700 dark:text-rose-400 text-sm">Night Shift (রাত্রীকালীন ডিউটি)</h4>
                <span className="text-xs font-bold text-rose-650 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-100/60 dark:border-rose-900/40 shadow-xs">৳১,০০০</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                <p className="flex justify-between"><span>• রাতের খাবার (ডিনার):</span> <span className="font-bold">৳৬০০</span></p>
                <p className="flex justify-between"><span>• যাতায়াত ভাতা:</span> <span className="font-bold">৳৪০০</span></p>
              </div>
            </div>
            <p className="text-[10px] text-rose-600 dark:text-rose-400 leading-normal font-black pt-2 border-t border-dashed border-rose-100/20">রিপোর্ট এর ডাটা এক্সট্রাকশন, ডাটা আপ্লোড এবং ডাউনলোড ডিউটি।</p>
          </div>

        </div>
      </div>

      {/* Drill-down Analytics Panel */}
      {activeChart && (
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in slide-in-from-bottom-4 duration-300 font-sans">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-indigo-650" size={20} />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                {activeChart === 'LATE_SITTING' ? 'লেট সিটিং ডিউটি' : activeChart === 'HOLIDAY' ? 'ছুটির দিন ডিউটি' : 'রাত্রীকালীন ডিউটি'} বিশ্লেষণ ও ট্রেন্ড
              </h3>
            </div>
            <button 
              onClick={() => setActiveChart(null)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655 rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {chartLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="animate-spin text-indigo-505" size={28} />
              <p className="text-xs text-slate-500 font-medium">অ্যানালিটিক্স লোড হচ্ছে...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Cell Split (Bar Chart) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={13} className="text-indigo-500 shrink-0" />
                  <span>সেল ভিত্তিক ডিউটি বিভাজন (Cell Split)</span>
                </h4>
                {cellWiseData.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6">কোনো ডিউটি রেকর্ড পাওয়া যায়নি।</p>
                ) : (
                  <div className="space-y-3">
                    {cellWiseData.slice(0, 5).map((item, idx) => {
                      const maxVal = Math.max(...cellWiseData.map(c => c.count)) || 1;
                      const percentage = (item.count / maxVal) * 100;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                            <span>{item.name}</span>
                            <span className="font-sans font-bold">{toBanglaDigits(item.count)} টি</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-650 dark:bg-indigo-400 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Monthly Trend (Line Graph SVG) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-emerald-500 shrink-0" />
                  <span>মাসিক ট্রেন্ড গ্রাফ (Monthly Trend)</span>
                </h4>
                
                {monthlyTrend.length === 0 || Math.max(...monthlyTrend.map(t => t.count)) === 0 ? (
                  <div className="w-full h-40 border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/30 dark:bg-slate-950/10 flex items-center justify-center text-slate-400 italic text-xs">
                    কোনো ড্যাটা পাওয়া যায়নি
                  </div>
                ) : (
                  <div className="w-full h-40 border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/30 dark:bg-slate-955/10 p-4 relative">
                    {(() => {
                      const maxCount = Math.max(...monthlyTrend.map(t => t.count)) || 1;
                      const points = monthlyTrend.map((t, idx) => {
                        const x = (idx / 11) * 220 + 20; 
                        const y = 80 - (t.count / maxCount) * 60; 
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <svg viewBox="0 0 260 100" className="w-full h-full overflow-visible">
                          <line x1="20" y1="20" x2="240" y2="20" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800" />
                          <line x1="20" y1="50" x2="240" y2="50" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800" />
                          <line x1="20" y1="80" x2="240" y2="80" stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-slate-800" />

                          {points && (
                            <>
                              <polyline
                                fill="none"
                                stroke="#4f46e5"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={points}
                              />
                              {monthlyTrend.map((t, idx) => {
                                const x = (idx / 11) * 220 + 20;
                                const y = 80 - (t.count / maxCount) * 60;
                                return (
                                  <g key={idx} className="group/dot cursor-pointer">
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r="2.5"
                                      fill="#4f46e5"
                                      className="hover:r-4 transition-all"
                                    />
                                  </g>
                                );
                              })}
                            </>
                          )}
                          
                          {monthlyTrend.filter((_, i) => i % 2 === 0).map((t, idx) => {
                            const originalIdx = idx * 2;
                            const x = (originalIdx / 11) * 220 + 20;
                            return (
                              <text 
                                key={idx} 
                                x={x} 
                                y="92" 
                                textAnchor="middle" 
                                className="text-[6px] font-bold fill-slate-400 font-sans"
                              >
                                {t.name}
                              </text>
                            );
                          })}
                        </svg>
                      );
                    })()}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
