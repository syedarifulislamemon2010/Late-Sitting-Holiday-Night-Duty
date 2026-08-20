'use client';
import logger from '@/lib/logger';

import { useState, useEffect, useMemo } from 'react';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { DEFAULT_2026_HOLIDAYS } from '@/constants/holidays';
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
  Sparkles,
  Check
} from 'lucide-react';

import MyDutySummaryCard from './components/MyDutySummaryCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';













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

interface Holiday {
  date: string;
  name: string;
  isWorkingDay?: boolean;
}

export default function DashboardPage() {
  const { showToast } = useToast();
  const { lang, t, formatNumber, formatMonthYear, getWeekdays } = useLanguage();
  const isEn = lang === 'en';

  const dutyOptions = [
    { value: 'LATE_SITTING', label: isEn ? 'Late Sitting' : 'লেট সিটিং', icon: '⏰', activeColor: 'bg-amber-500 text-white', hoverColor: 'hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' },
    { value: 'HOLIDAY', label: isEn ? 'Holiday Duty' : 'হলিডে', icon: '📅', activeColor: 'bg-rose-500 text-white', hoverColor: 'hover:bg-rose-50 dark:hover:bg-rose-955/20 text-rose-650 dark:text-rose-450 border-rose-200 dark:border-rose-900/50' },
    { value: 'NIGHT_SHIFT', label: isEn ? 'Night Shift' : 'নাইট শিফট', icon: '🌙', activeColor: 'bg-purple-500 text-white', hoverColor: 'hover:bg-purple-50 dark:hover:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50' },
  ];
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<any>(null);
  const [isEmployee, setIsEmployee] = useState(false);
  const [myDuties, setMyDuties] = useState<any[]>([]);

  const [showHolidayReminder, setShowHolidayReminder] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (user.role === 'ADMIN') setIsAdmin(true);
    } catch {}
  }, []);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [formDutyType, setFormDutyType] = useState('LATE_SITTING');
  const [savingDuties, setSavingDuties] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
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

          list.forEach((duty: { employee?: { cell?: { name?: string } }; date?: string }) => {
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
        logger.error('Analytics aggregation error:', err);
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

        const portalRes = await fetch('/api/my-portal');
        if (portalRes.ok) {
          const portalData = await portalRes.json();
          if (portalData.employee) {
            setEmployee(portalData.employee);
            setIsEmployee(true);
          }
          if (Array.isArray(portalData.duties)) {
            setMyDuties(portalData.duties);
          }
        }
      } catch (err) {
        logger.error('Error fetching dashboard stats:', err);
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

  const checkIsHolidayOrWeekend = (dateStr: string): boolean => {
    const foundSlot = slots.find(s => s.dateStr === dateStr);
    if (foundSlot) {
      return foundSlot.isHoliday || foundSlot.isWeekend;
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay();
    let isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    if (dateStr === '2026-05-23') {
      isWeekend = false;
    }
    const dbHol = holidays.find(h => h.date === dateStr);
    if (dbHol && dbHol.isWorkingDay) {
      isWeekend = false;
    }
    const hol = allHolidays.some(h => h.date === dateStr);
    return isWeekend || hol;
  };

  useEffect(() => {
    if (selectedDates.length > 0) {
      const isLateSittingDisabled = selectedDates.some(date => checkIsHolidayOrWeekend(date));
      const isHolidayDisabled = selectedDates.some(date => !checkIsHolidayOrWeekend(date));
      
      setFormDutyType(prev => {
        if (prev === 'LATE_SITTING' && isLateSittingDisabled) {
          return isHolidayDisabled ? 'NIGHT_SHIFT' : 'HOLIDAY';
        }
        if (prev === 'HOLIDAY' && isHolidayDisabled) {
          return isLateSittingDisabled ? 'NIGHT_SHIFT' : 'LATE_SITTING';
        }
        return prev;
      });
    }
  }, [selectedDates]);

  const handleDateClick = (dateStr: string) => {
    if (!isEmployee) {
      showToast('দুঃখিত, এই সুবিধাটি শুধুমাত্র কর্মকর্তা অ্যাকাউন্টের জন্য প্রযোজ্য। আপনার অ্যাকাউন্টের সাথে কোনো কর্মকর্তা রেকর্ড যুক্ত নেই।', 'error');
      return;
    }
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return [];
      } else {
        return [dateStr];
      }
    });
  };

  const handleSaveDutyForDate = async (dateStr: string, selectedOption: string) => {
    if (!employee) return;
    setSavingDuties(true);
    setEntryError(null);
    try {
      const existing = myDuties.filter(d => d.date === dateStr);
      const dutiesToDelete = existing.map(d => d.id);

      if (selectedOption === 'DELETE') {
        // Delete all existing duties on this date
        for (const dId of dutiesToDelete) {
          const res = await fetch(`/api/duties/${dId}`, { method: 'DELETE' });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'ডিউটি মুছতে ব্যর্থ হয়েছে।');
          }
        }
        showToast('ডিউটি সফলভাবে মুছে ফেলা হয়েছে!', 'success');
      } else {
        // Prepare assignments based on option
        let assignments: Array<{ employeeId: number; date: string; type: string }> = [];
        if (selectedOption === 'LATE_SITTING') {
          assignments = [{ employeeId: employee.id, date: dateStr, type: 'LATE_SITTING' }];
        } else if (selectedOption === 'NIGHT_SHIFT') {
          assignments = [{ employeeId: employee.id, date: dateStr, type: 'NIGHT_SHIFT' }];
        } else if (selectedOption === 'HOLIDAY') {
          assignments = [{ employeeId: employee.id, date: dateStr, type: 'HOLIDAY' }];
        } else if (selectedOption === 'BOTH') {
          assignments = [
            { employeeId: employee.id, date: dateStr, type: 'HOLIDAY' },
            { employeeId: employee.id, date: dateStr, type: 'NIGHT_SHIFT' }
          ];
        }

        const res = await fetch('/api/duties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignments,
            dutiesToDelete: dutiesToDelete.length > 0 ? dutiesToDelete : undefined
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'ডিউটি এন্ট্রি করা সম্ভব হয়নি।');
        }
        showToast('ডিউটি সফলভাবে সংরক্ষণ করা হয়েছে!', 'success');
      }

      setSelectedDates([]); // Close modal
      setEntryError(null);
      
      // Refresh local states
      const portalRes = await fetch('/api/my-portal');
      if (portalRes.ok) {
        const portalData = await portalRes.json();
        if (Array.isArray(portalData.duties)) {
          setMyDuties(portalData.duties);
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'ডিউটি সংরক্ষণে সমস্যা হয়েছে';
      setEntryError(errorMsg);
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      setSavingDuties(false);
    }
  };

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

      {/* Holiday Reminder Banner for Admins */}
      {isAdmin && new Date().getMonth() >= 10 && !holidays.some(h => h.date.startsWith((new Date().getFullYear() + 1).toString())) && showHolidayReminder && (
        <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-xl">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                📅 আগামী বছরের ({new Date().getFullYear() + 1}) সরকারি ছুটির তালিকা এখনো আপলোড করা হয়নি।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/settings" 
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              আপলোড করুন →
            </Link>
            <button 
              onClick={() => setShowHolidayReminder(false)}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 p-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

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
          <Card
            title={
              <span className="flex items-center gap-2">
                <Calendar className="text-primary-600" size={18} />
                ২০২৬ সালের সরকারি ছুটির ক্যালেন্ডার
              </span>
            }
            actions={
              <span className="px-2.5 py-0.5 bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 text-[10px] font-bold rounded-full font-sans">
                ২০২৬ সাল
              </span>
            }
            className="flex-1 flex flex-col justify-between"
          >
            
            {/* Month Selection Buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 w-full mb-4">
              {MONTH_NAMES.map((name, idx) => (
                <Button
                  key={name}
                  onClick={() => setSelectedMonth(idx)}
                  variant={selectedMonth === idx ? 'primary' : 'secondary'}
                  size="sm"
                  className="w-full text-center"
                >
                  {name}
                </Button>
              ))}
            </div>

            {/* Interactive Grid Calendar */}
            <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm w-full">
              
              {/* Month Name and Summary Header */}
              <div className="text-center pb-4">
                <h4 className="text-lg sm:text-xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">
                  {formatMonthYear(selectedMonth, 2026)}
                </h4>
                <p className="font-sans mt-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4 text-xs sm:text-sm">
                  <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                    {isEn ? 'Total Public Holidays:' : 'মোট সরকারি ছুটি:'} {formatNumber(selectedMonthHolidays.length)} {isEn ? 'days' : 'টি'}
                  </span>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {isEn ? 'Total Working Days:' : 'মোট কার্যদিবস:'} {formatNumber(slots.filter(s => s.day !== null && !s.isWeekend && !s.isHoliday).length)} {isEn ? 'days' : 'দিন'}
                  </span>
                </p>
              </div>

              {/* Day-of-week Headers */}
              <div className="grid grid-cols-7 gap-2 text-center font-extrabold text-[11px] uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                {getWeekdays().map((w, index) => (
                  <div key={w} className={index === 5 || index === 6 ? 'text-rose-500 font-black' : ''}>
                    {w}
                  </div>
                ))}
              </div>

              {/* Calendar Slots */}
              <div className="grid grid-cols-7 gap-2 mt-3">
                {slots.map((slot, idx) => {
                  if (slot.day === null) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }

                  const isToday = slot.dateStr === todayStr;
                  const existingDuty = myDuties.find(d => d.date === slot.dateStr);
                  const isSelected = slot.dateStr ? selectedDates.includes(slot.dateStr) : false;

                  let cellClass = 'bg-white dark:bg-slate-900/80 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none hover:bg-slate-50/90 dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md hover:scale-105 hover:z-20 cursor-pointer relative transition-all duration-150 ease-premium';

                  if (existingDuty) {
                    if (existingDuty.type === 'LATE_SITTING') {
                      cellClass = 'bg-amber-500/20 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-extrabold border border-amber-300 dark:border-amber-700/60 shadow-xs hover:shadow-md hover:scale-105 hover:z-20 transition-all duration-150 ease-premium cursor-pointer relative';
                    } else if (existingDuty.type === 'HOLIDAY') {
                      cellClass = 'bg-rose-500/20 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 font-extrabold border border-rose-300 dark:border-rose-700/60 shadow-xs hover:shadow-md hover:scale-105 hover:z-20 transition-all duration-150 ease-premium cursor-pointer relative';
                    } else if (existingDuty.type === 'NIGHT_SHIFT') {
                      cellClass = 'bg-purple-500/20 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 font-extrabold border border-purple-300 dark:border-purple-700/60 shadow-xs hover:shadow-md hover:scale-105 hover:z-20 transition-all duration-150 ease-premium cursor-pointer relative';
                    }
                  } else if (slot.isHoliday) {
                    /* WCAG AA Contrast Pass: #DC2626/rose-700 against #FFFFFF yields 5.4:1 to 6.29:1 contrast ratio */
                    cellClass = 'bg-gradient-to-br from-red-600 to-rose-700 dark:from-rose-600 dark:to-red-700 text-white font-black shadow-md scale-[1.02] border border-red-500/80 dark:border-rose-500/60 hover:scale-105 hover:z-20 shadow-red-500/25 cursor-pointer relative group transition-all duration-150 ease-premium';
                  } else if (slot.isWeekend) {
                    /* WCAG AA Contrast Pass: rose-700 (#be123c) on rose-50 (#fff1f2) yields 5.92:1 contrast ratio */
                    cellClass = 'bg-rose-50/85 dark:bg-rose-950/25 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900/40 shadow-[0_1px_3px_rgba(244,63,94,0.06)] cursor-pointer hover:bg-rose-100/80 hover:shadow-md hover:scale-105 hover:z-20 transition-all duration-150 ease-premium';
                  }

                  if (isToday) {
                    cellClass += ' ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900 bg-indigo-50/50 dark:bg-indigo-950/45 text-indigo-950 dark:text-indigo-200 shadow-sm font-black';
                  }

                  if (isSelected) {
                    cellClass += ' ring-3 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-105 z-10 border-indigo-600 bg-indigo-100/70 dark:bg-indigo-900/60 shadow-md font-black';
                  }

                  return (
                    <div
                      key={`day-${slot.day}`}
                      onClick={() => slot.dateStr && handleDateClick(slot.dateStr)}
                      title={slot.holidayName || (slot.isWeekend ? 'সাপ্তাহিক ছুটি' : '')}
                      className={`aspect-square rounded-xl text-xs flex flex-col items-center justify-center transition-all relative ${cellClass}`}
                    >
                      <span className="font-sans font-bold text-sm">
                        {slot.day}
                      </span>
                      {existingDuty && (
                        <span className="text-[9px] font-bold mt-0.5 px-1 py-0.2 rounded bg-white/60 dark:bg-slate-950/40 scale-90">
                          {existingDuty.type === 'LATE_SITTING' ? 'লেট' : existingDuty.type === 'HOLIDAY' ? 'হলিডে' : 'নাইট'}
                        </span>
                      )}
                      {isToday && !existingDuty && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-650 dark:bg-indigo-400" />
                      )}
                      {slot.isHoliday && !existingDuty && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white/80 animate-pulse" />
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

          </Card>

        </div>

        {/* Right Section (Upcoming Holidays & approved Rate Cards) - Spans 1 column */}
        <div className="flex flex-col">
          
          {/* Upcoming Configuration Public Holidays */}
          <Card
            title="আসন্ন সরকারি ছুটি"
            subtitle="পরবর্তী ক্যালেন্ডার ছুটির দিনসমূহ।"
            actions={
              <span className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-rose-500 animate-pulse">
                <CalendarCheck size={14} />
              </span>
            }
            className="flex-1"
          >
            
            {finalUpcomingHolidays.length > 0 ? (
              <div className="space-y-3 font-sans">
                {finalUpcomingHolidays.map((holiday: Holiday) => {
                  const dateObj = new Date(holiday.date);
                  return (
                    <div key={holiday.date} className="flex items-center gap-4 hover:bg-slate-50/55 dark:hover:bg-slate-800/30 p-3 rounded-2xl transition-colors border border-slate-100/40 dark:border-slate-800/20 bg-white/40 dark:bg-slate-900/10 shadow-xs">
                      <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold text-center shrink-0 border border-rose-100 dark:border-rose-900/30 w-14 shadow-sm">
                        <p className="text-base sm:text-lg font-black leading-none tracking-tight tabular-nums">
                          {toBanglaDigits(dateObj.getDate())}
                        </p>
                        <p className="text-[10px] sm:text-[11px] leading-none mt-1.5 font-bold">
                          {MONTH_NAMES[dateObj.getMonth()]}
                        </p>
                      </div>
                      <div className="leading-normal space-y-1">
                        <p className="app-card-heading text-slate-850 dark:text-slate-100">{holiday.name}</p>
                        <p className="app-body-subtext text-[11px] sm:text-xs">
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
          </Card>

        </div>

      </div>

      {/* Approved Janata Bank Rates Guideline Card Block (Full Width) */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-5">
        <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3 flex justify-between items-center">
          <div>
            <h3 className="app-section-title text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <Info className="text-amber-500" size={20} />
              আপ্যায়ন বিল ও যাতায়াত ভাতা রেট
            </h3>
            <p className="app-body-subtext mt-0.5 font-medium font-sans">জনতা ব্যাংক পিএলসি. এর অনুমোদিত নির্দেশিকা। কার্ডে ক্লিক করে অ্যানালিটিক্স দেখুন।</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 font-sans">
          
          {/* Late Sitting (৳300) */}
          <div 
            onClick={() => setActiveChart(activeChart === 'LATE_SITTING' ? null : 'LATE_SITTING')}
            className={`p-4 sm:p-4.5 bg-gradient-to-br from-indigo-50/35 to-white/60 dark:from-indigo-950/20 dark:to-slate-900/40 border-y border-r border-indigo-100/70 dark:border-indigo-900/40 border-l-4 border-l-indigo-500 rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-normal ease-premium select-none ${
              activeChart === 'LATE_SITTING' ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-sm' : ''
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex justify-between items-center border-b border-indigo-100/40 dark:border-indigo-900/30 pb-2">
                <h4 className="app-card-heading text-indigo-700 dark:text-indigo-400 text-sm sm:text-[15px]">Late Sitting (লেট সিটিং)</h4>
                <span className="app-amount-text text-xs sm:text-sm font-extrabold text-indigo-650 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-100/60 dark:border-indigo-900/40 shadow-xs">৳৩০০</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
                <p className="flex justify-between items-center"><span>• নাস্তা ভাতা:</span> <span className="app-amount-text text-slate-800 dark:text-slate-200">৳১০০</span></p>
                <p className="flex justify-between items-center"><span>• যাতায়াত ভাতা:</span> <span className="app-amount-text text-slate-800 dark:text-slate-200">৳২০০</span></p>
              </div>
            </div>
            <p className="text-[11px] text-rose-500 dark:text-rose-400/90 leading-normal font-semibold pt-2 border-t border-dashed border-indigo-100/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>কর্মদিবসে অফিস ছুটির পর দায়িত্ব পালনের ক্ষেত্রে প্রযোজ্য।</span>
            </p>
          </div>

          {/* Holiday Duty (৳500) */}
          <div 
            onClick={() => setActiveChart(activeChart === 'HOLIDAY' ? null : 'HOLIDAY')}
            className={`p-4 sm:p-4.5 bg-gradient-to-br from-emerald-50/35 to-white/60 dark:from-emerald-955/20 dark:to-slate-900/40 border-y border-r border-emerald-100/70 dark:border-emerald-900/40 border-l-4 border-l-emerald-500 rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-normal ease-premium select-none ${
              activeChart === 'HOLIDAY' ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-sm' : ''
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex justify-between items-center border-b border-emerald-100/40 dark:border-emerald-900/30 pb-2">
                <h4 className="app-card-heading text-emerald-700 dark:text-emerald-400 text-sm sm:text-[15px]">Holiday Duty (সরকারি ছুটি)</h4>
                <span className="app-amount-text text-xs sm:text-sm font-extrabold text-emerald-650 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-100/60 dark:border-emerald-900/40 shadow-xs">৳৫০০</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
                <p className="flex justify-between items-center"><span>• দুপুরের খাবার:</span> <span className="app-amount-text text-slate-800 dark:text-slate-200">৳২৫০</span></p>
                <p className="flex justify-between items-center"><span>• যাতায়াত ভাতা:</span> <span className="app-amount-text text-slate-800 dark:text-slate-200">৳২৫০</span></p>
              </div>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400/90 leading-normal font-semibold pt-2 border-t border-dashed border-emerald-100/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>শুক্রবার, শনিবার ও সরকারি ছুটির দিনগুলোতে ডিউটি।</span>
            </p>
          </div>

          {/* Night Shift (৳1000) */}
          <div 
            onClick={() => setActiveChart(activeChart === 'NIGHT_SHIFT' ? null : 'NIGHT_SHIFT')}
            className={`p-4 sm:p-4.5 bg-gradient-to-br from-rose-50/35 to-white/60 dark:from-rose-955/20 dark:to-slate-900/40 border-y border-r border-rose-100/70 dark:border-rose-900/40 border-l-4 border-l-rose-500 rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-normal ease-premium select-none ${
              activeChart === 'NIGHT_SHIFT' ? 'ring-2 ring-rose-500 border-rose-500 shadow-sm' : ''
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex justify-between items-center border-b border-rose-100/40 dark:border-rose-900/30 pb-2">
                <h4 className="app-card-heading text-rose-700 dark:text-rose-400 text-sm sm:text-[15px]">Night Shift (রাত্রীকালীন ডিউটি)</h4>
                <span className="app-amount-text text-xs sm:text-sm font-extrabold text-rose-650 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-100/60 dark:border-rose-900/40 shadow-xs">৳১,০০০</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
                <p className="flex justify-between items-center"><span>• রাতের খাবার (ডিনার):</span> <span className="app-amount-text text-slate-800 dark:text-slate-200">৳৬০০</span></p>
                <p className="flex justify-between items-center"><span>• যাতায়াত ভাতা:</span> <span className="app-amount-text text-slate-800 dark:text-slate-200">৳৪০০</span></p>
              </div>
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-400/90 leading-normal font-semibold pt-2 border-t border-dashed border-rose-100/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>রিপোর্ট এর ডাটা এক্সট্রাকশন, ডাটা আপ্লোড এবং ডাউনলোড ডিউটি।</span>
            </p>
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
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">অ্যানালিটিক্স লোড হচ্ছে...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Cell Split (Bar Chart) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={13} className="text-indigo-500 shrink-0" />
                  <span>সেল ভিত্তিক ডিউটি বিভাজন (Cell Split)</span>
                </h4>
                {cellWiseData.length === 0 ? (
                  <EmptyState
                    icon={Building2}
                    title="কোনো সেল রেকর্ড নেই"
                    description="বর্তমানে এই ক্যাটাগরির কোনো সেল-ভিত্তিক ডিউটি রেকর্ড পাওয়া যায়নি।"
                    className="py-6"
                  />
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
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-emerald-500 shrink-0" />
                  <span>মাসিক ট্রেন্ড গ্রাফ (Monthly Trend)</span>
                </h4>
                
                {monthlyTrend.length === 0 || Math.max(...monthlyTrend.map(t => t.count)) === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="কোনো ট্রেন্ড ডাটা নেই"
                    description="বর্তমানে প্রদর্শনের জন্য কোনো মাসিক ডিউটি ট্রেন্ড পাওয়া যায়নি।"
                    className="py-6"
                  />
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

            {/* Premium Duty Selection Modal */}
      {selectedDates.length === 1 && (() => {
        const dateStr = selectedDates[0];
        const isHoliday = checkIsHolidayOrWeekend(dateStr);
        const existing = myDuties.filter(d => d.date === dateStr);
        
        // Find weekday name in Bangla
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const bnDayName = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'][dateObj.getDay()];
        const formattedDate = `${toBanglaDigits(d)} ${MONTH_NAMES[m - 1]} (${bnDayName})`;

        // Determine currently active selection in the modal
        // For BOTH, we check if there are both HOLIDAY and NIGHT_SHIFT duties
        const hasHoliday = existing.some(d => d.type === 'HOLIDAY');
        const hasNight = existing.some(d => d.type === 'NIGHT_SHIFT');
        const hasLate = existing.some(d => d.type === 'LATE_SITTING');
        
        let initialSelectedOption = '';
        if (hasHoliday && hasNight) initialSelectedOption = 'BOTH';
        else if (hasLate) initialSelectedOption = 'LATE_SITTING';
        else if (hasHoliday) initialSelectedOption = 'HOLIDAY';
        else if (hasNight) initialSelectedOption = 'NIGHT_SHIFT';

        return (
          <DutySelectionModal 
            dateStr={dateStr}
            formattedDate={formattedDate}
            isHoliday={isHoliday}
            existing={existing}
            initialOption={initialSelectedOption}
            onClose={() => setSelectedDates([])}
            onSave={(option) => handleSaveDutyForDate(dateStr, option)}
            saving={savingDuties}
            error={entryError}
          />
        );
      })()}

    </div>
  );
}

// Inner Modal Component for Premium 10/10 UI/UX Interactive Duty Selection
function DutySelectionModal({
  dateStr,
  formattedDate,
  isHoliday,
  existing,
  initialOption,
  onClose,
  onSave,
  saving,
  error
}: {
  dateStr: string;
  formattedDate: string;
  isHoliday: boolean;
  existing: Array<{ id?: number; type?: string; [key: string]: unknown }>;
  initialOption: string;
  onClose: () => void;
  onSave: (option: string) => void;
  saving: boolean;
  error: string | null;
}) {
  const [selectedOption, setSelectedOption] = useState(initialOption);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-805 rounded-[28px] shadow-2xl overflow-hidden flex flex-col p-6 space-y-5 animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              📅
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-850 dark:text-slate-100">ডিউটি অ্যাসাইনমেন্ট</h3>
              <p className="text-[11px] font-bold text-indigo-605 dark:text-indigo-400">{formattedDate}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-105 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Existing Duty Status */}
        {existing.length > 0 && (
          <div className="p-3.5 bg-blue-50/50 dark:bg-slate-800/40 border border-blue-100/50 dark:border-slate-850 rounded-2xl">
            <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">বিদ্যমান এন্ট্রি:</span>
            <div className="flex flex-wrap gap-1.5">
              {existing.map(d => {
                const label = d.type === 'LATE_SITTING' ? 'লেট সিটিং' : d.type === 'HOLIDAY' ? 'হলিডে' : 'নাইট ডিউটি';
                const color = d.type === 'LATE_SITTING' ? 'bg-amber-50 text-amber-700 border-amber-100' : d.type === 'HOLIDAY' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-purple-50 text-purple-700 border-purple-100';
                return (
                  <span key={d.id} className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${color}`}>
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Options Selection */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">ডিউটির ধরণ নির্বাচন করুন:</span>
          
          <div className="flex flex-col gap-2.5">
            {!isHoliday ? (
              // Working Day Options (Late Sitting, Night Shift)
              <>
                <button
                  type="button"
                  onClick={() => setSelectedOption('LATE_SITTING')}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all ${
                    selectedOption === 'LATE_SITTING'
                      ? 'bg-amber-50/75 dark:bg-amber-955/20 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-slate-50/50 dark:bg-slate-905/40 border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-805/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shrink-0">
                    ⏰
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-slate-805 dark:text-slate-250">লেট সিটিং (Late Sitting)</div>
                    <div className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Snacks + Travel allowance (BDT 300)</div>
                  </div>
                  {selectedOption === 'LATE_SITTING' && <Check size={16} className="text-amber-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOption('NIGHT_SHIFT')}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all ${
                    selectedOption === 'NIGHT_SHIFT'
                      ? 'bg-purple-50/75 dark:bg-purple-955/20 border-purple-500 ring-2 ring-purple-500/20'
                      : 'bg-slate-50/50 dark:bg-slate-905/40 border-slate-205 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-805/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-955/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shrink-0">
                    🌙
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-slate-805 dark:text-slate-250">রাত্রিকালীন ডিউটি (Night Duty)</div>
                    <div className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Dinner + Travel allowance (BDT 1,000)</div>
                  </div>
                  {selectedOption === 'NIGHT_SHIFT' && <Check size={16} className="text-purple-600 shrink-0" />}
                </button>
              </>
            ) : (
              // Holiday/Weekend Options (Holiday, Night Shift, Both)
              <>
                <button
                  type="button"
                  onClick={() => setSelectedOption('HOLIDAY')}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all ${
                    selectedOption === 'HOLIDAY'
                      ? 'bg-rose-50/75 dark:bg-rose-955/20 border-rose-500 ring-2 ring-rose-500/20'
                      : 'bg-slate-50/50 dark:bg-slate-905/40 border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-805/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-955/30 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg shrink-0">
                    📅
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-slate-805 dark:text-slate-250">ছুটির দিনের ডিউটি (Holiday Duty)</div>
                    <div className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Lunch + Travel allowance (BDT 500)</div>
                  </div>
                  {selectedOption === 'HOLIDAY' && <Check size={16} className="text-rose-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOption('NIGHT_SHIFT')}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all ${
                    selectedOption === 'NIGHT_SHIFT'
                      ? 'bg-purple-50/75 dark:bg-purple-955/20 border-purple-500 ring-2 ring-purple-500/20'
                      : 'bg-slate-50/50 dark:bg-slate-905/40 border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-850/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shrink-0">
                    🌙
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-slate-805 dark:text-slate-250">রাত্রিকালীন ডিউটি (Night Duty)</div>
                    <div className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Dinner + Travel allowance (BDT 1,000)</div>
                  </div>
                  {selectedOption === 'NIGHT_SHIFT' && <Check size={16} className="text-purple-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOption('BOTH')}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all ${
                    selectedOption === 'BOTH'
                      ? 'bg-emerald-50/75 dark:bg-emerald-955/20 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/50 dark:bg-slate-905/40 border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-805/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-955/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0">
                    🌟
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-slate-855 dark:text-slate-250">উভয় ডিউটি (Both - Holiday + Night)</div>
                    <div className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Lunch + Dinner + Travel allowance (BDT 1,500)</div>
                  </div>
                  {selectedOption === 'BOTH' && <Check size={16} className="text-emerald-650 shrink-0" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-xs font-bold text-red-550 p-3 bg-red-50 dark:bg-red-955/10 border border-red-150 dark:border-red-900/30 rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {existing.length > 0 && (
            <button
              type="button"
              disabled={saving}
              onClick={() => onSave('DELETE')}
              className="px-4 h-10 border border-red-200 hover:bg-red-50 dark:hover:bg-red-955/10 text-red-650 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              মুছে ফেলুন
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-4.5 h-10 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={saving || !selectedOption}
            onClick={() => onSave(selectedOption)}
            className="px-5 h-10 bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
        </div>

      </div>
    </div>
  );
}
