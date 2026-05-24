'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Building2, 
  CalendarCheck, 
  Banknote, 
  ArrowRight,
  PieChart as PieIcon,
  BarChart4,
  CalendarPlus,
  UserPlus,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  ArrowUpRight,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell as RechartsCell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

// Custom Bangla digit converter
function toBanglaDigits(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
}

// Custom currency formatter
function formatBanglaCurrency(num: number): string {
  const formatted = Math.round(num).toLocaleString('en-US'); // e.g. 50,500
  return toBanglaDigits(formatted);
}

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/40 p-3.5 rounded-xl shadow-2xl text-xs space-y-1 border-t-2 border-t-primary select-none">
        <p className="font-extrabold text-slate-100 text-sm tracking-wide">{data.display || payload[0].name}</p>
        <p className="font-semibold text-emerald-400">
          পরিমাণ: <span className="font-sans font-bold text-sm">{payload[0].value.toLocaleString('bn-BD')}</span> {data.unit || ''}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [duties, setDuties] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [cells, setCells] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'this_month' | 'this_year' | 'all'>('all');

  useEffect(() => {
    async function loadStats() {
      try {
        const [empRes, cellRes, dutyRes, holidayRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/cells'),
          fetch('/api/duties'),
          fetch('/api/holidays')
        ]);
        
        const emps = await empRes.json();
        const cellsData = await cellRes.json();
        const dutiesData = await dutyRes.json();
        const holidaysData = await holidayRes.json();
        
        setEmployees(Array.isArray(emps) ? emps : []);
        setCells(Array.isArray(cellsData) ? cellsData : []);
        setDuties(Array.isArray(dutiesData) ? dutiesData : []);
        setHolidays(Array.isArray(holidaysData) ? holidaysData : []);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Filter duties based on selected time range
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
  const currentYearMonth = `${currentYear}-${currentMonth}`;

  const filteredDuties = duties.filter(d => {
    if (timeRange === 'this_month') {
      return d.date.startsWith(currentYearMonth);
    }
    if (timeRange === 'this_year') {
      return d.date.startsWith(currentYear);
    }
    return true;
  });

  // Calculate stats dynamically
  let totalBill = 0;
  let totalEntertainment = 0;
  let totalTravel = 0;
  let lateSittingBill = 0;
  let holidayBill = 0;
  let nightShiftBill = 0;
  let lateSittingCount = 0;
  let holidayCount = 0;
  let nightShiftCount = 0;

  filteredDuties.forEach((d: any) => {
    totalBill += d.totalBill || 0;
    if (d.type === 'LATE_SITTING') {
      lateSittingBill += d.totalBill || 0;
      lateSittingCount++;
      totalEntertainment += d.allowance1 || 100;
      totalTravel += d.allowance2 || 200;
    } else if (d.type === 'HOLIDAY') {
      holidayBill += d.totalBill || 0;
      holidayCount++;
      totalEntertainment += d.allowance1 || 250;
      totalTravel += d.allowance2 || 250;
    } else if (d.type === 'NIGHT_SHIFT') {
      nightShiftBill += d.totalBill || 0;
      nightShiftCount++;
      totalEntertainment += d.allowance1 || 600;
      totalTravel += d.allowance2 || 400;
    }
  });

  // Cell Leaderboard Calculation
  const cellLeaderboardMap: { [key: number]: { id: number, name: string, dutiesCount: number, totalBill: number } } = {};
  cells.forEach(c => {
    cellLeaderboardMap[c.id] = { id: c.id, name: c.name, dutiesCount: 0, totalBill: 0 };
  });

  filteredDuties.forEach(d => {
    const cId = d.employee?.cellId;
    if (cId && cellLeaderboardMap[cId]) {
      cellLeaderboardMap[cId].dutiesCount++;
      cellLeaderboardMap[cId].totalBill += d.totalBill || 0;
    }
  });

  const cellLeaderboard = Object.values(cellLeaderboardMap)
    .sort((a, b) => b.totalBill - a.totalBill)
    .filter(c => c.dutiesCount > 0);

  const maxCellBill = cellLeaderboard.length > 0 ? Math.max(...cellLeaderboard.map(c => c.totalBill)) : 1;

  // Employee Leaderboard Calculation
  const employeeLeaderboardMap: { [key: number]: { id: number, name: string, designation: string, cellName: string, dutiesCount: number, totalBill: number } } = {};

  filteredDuties.forEach(d => {
    const emp = d.employee;
    if (emp) {
      if (!employeeLeaderboardMap[emp.id]) {
        employeeLeaderboardMap[emp.id] = {
          id: emp.id,
          name: emp.name,
          designation: emp.designation,
          cellName: emp.cell?.name || '',
          dutiesCount: 0,
          totalBill: 0
        };
      }
      employeeLeaderboardMap[emp.id].dutiesCount++;
      employeeLeaderboardMap[emp.id].totalBill += d.totalBill || 0;
    }
  });

  const employeeLeaderboard = Object.values(employeeLeaderboardMap)
    .sort((a, b) => b.dutiesCount - a.dutiesCount)
    .slice(0, 5);

  // Modernized Colors
  const CHART_COLORS = ['#6366f1', '#0ea5e9', '#10b981'];

  // Data for Chart 1: Financial Allocation
  const billData = [
    { name: 'Late Sitting', value: lateSittingBill, display: 'লেট সিটিং', unit: '৳' },
    { name: 'Holiday Duty', value: holidayBill, display: 'সরকারি ছুটি', unit: '৳' },
    { name: 'Night Shift', value: nightShiftBill, display: 'রাত্রীকালীন', unit: '৳' }
  ].filter(item => item.value > 0);

  // Data for Chart 2: Duty Count Frequency
  const frequencyData = [
    { name: 'লেট সিটিং', count: lateSittingCount, display: 'লেট সিটিং ডিউটি', unit: 'বার' },
    { name: 'সরকারি ছুটি', count: holidayCount, display: 'সরকারি ছুটি ডিউটি', unit: 'বার' },
    { name: 'রাত্রীকালীন', count: nightShiftCount, display: 'রাত্রীকালীন ডিউটি', unit: 'বার' }
  ];

  // Up-coming active holidays
  const upcomingHolidays = holidays
    .filter(h => !h.isWorkingDay)
    .filter(h => new Date(h.date) >= new Date(now.toISOString().split('T')[0]))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Timeframe Control and Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-slate-200/60 dark:border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-wide font-sans flex items-center gap-3">
            <Activity className="text-primary animate-pulse" size={28} />
            পোর্টাল ড্যাশবোর্ড
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            জনতা ব্যাংক পিএলসি. এর অনলাইন ব্যাংকিং ডিপার্টমেন্টের ডিউটি ও আপ্যায়ন ব্যয়ের রিয়েল-টাইম সারসংক্ষেপ।
          </p>
        </div>

        {/* Custom Pill Filter Tab - Sleek & Beautiful */}
        <div className="flex items-center gap-1.5 bg-slate-200/65 dark:bg-slate-800/60 p-1.5 rounded-2xl shadow-inner w-fit self-start xl:self-center">
          <button
            onClick={() => setTimeRange('this_month')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              timeRange === 'this_month'
                ? 'bg-white dark:bg-slate-900 text-primary dark:text-accent shadow-md scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            চলতি মাস
          </button>
          <button
            onClick={() => setTimeRange('this_year')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              timeRange === 'this_year'
                ? 'bg-white dark:bg-slate-900 text-primary dark:text-accent shadow-md scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            চলতি বছর
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              timeRange === 'all'
                ? 'bg-white dark:bg-slate-900 text-primary dark:text-accent shadow-md scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            সর্বমোট
          </button>
        </div>
      </div>

      {/* Modern KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Officers */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-indigo-500/40 dark:hover:border-indigo-400/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">

          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">মোট কর্মকর্তা</p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 font-sans tracking-tight">
                {toBanglaDigits(employees.length)} <span className="text-sm font-bold text-slate-400">জন</span>
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm">
              <Users size={22} className="stroke-[2px]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">সক্রিয় ও ডিউটি পাওয়ার যোগ্য</span>
            <Link href="/employees" className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:gap-1.5 transition-all">
              বিস্তারিত <ArrowRight size={10} />
            </Link>
          </div>
        </div>

        {/* KPI 2: Total Duties */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-sky-500/40 dark:hover:border-sky-400/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">

          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest">মোট অ্যাসাইনড ডিউটি</p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 font-sans tracking-tight">
                {toBanglaDigits(filteredDuties.length)} <span className="text-sm font-bold text-slate-400">টি</span>
              </h3>
            </div>
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl shadow-sm">
              <CalendarCheck size={22} className="stroke-[2px]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-x-2 text-[9px] font-bold text-slate-400">
            <span>লেট: {toBanglaDigits(lateSittingCount)}</span>
            <span>•</span>
            <span>ছুটি: {toBanglaDigits(holidayCount)}</span>
            <span>•</span>
            <span>নাইট: {toBanglaDigits(nightShiftCount)}</span>
          </div>
        </div>

        {/* KPI 3: Period Expenses */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 dark:hover:border-emerald-400/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">

          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">
                {timeRange === 'this_month' ? 'চলতি মাসের ব্যয়' : timeRange === 'this_year' ? 'চলতি বছরের ব্যয়' : 'সর্বমোট ব্যয়'}
              </p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 font-sans tracking-tight text-emerald-600 dark:text-emerald-400">
                ৳{formatBanglaCurrency(totalBill)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm">
              <Banknote size={22} className="stroke-[2px]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400 font-bold">
            <span>নাস্তা/খাবার: ৳{formatBanglaCurrency(totalEntertainment)}</span>
            <span>যাতায়াত: ৳{formatBanglaCurrency(totalTravel)}</span>
          </div>
        </div>

        {/* KPI 4: Active Cells */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-violet-500/40 dark:hover:border-violet-400/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">

          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest">সচল সেল সমূহ</p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 font-sans tracking-tight">
                {toBanglaDigits(cells.length)} <span className="text-sm font-bold text-slate-400">টি</span>
              </h3>
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-xl shadow-sm">
              <Building2 size={22} className="stroke-[2px]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
              <span>ডিউটি পাওয়া সেল</span>
              <span>{toBanglaDigits(cellLeaderboard.length)}/{toBanglaDigits(cells.length)}</span>
            </div>
            {/* Elegant tiny progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-500" 
                style={{ width: `${(cellLeaderboard.length / (cells.length || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Quick Actions & Leaderboards (Spans 2 columns) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Quick Actions Panel */}
          <div className="glass-card p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                <TrendingUp className="text-primary" size={20} />
                ঝটপট অ্যাডমিন অ্যাকশন
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/roster" className="p-4 rounded-2xl bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 text-center flex flex-col items-center gap-3 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none group-hover:scale-110 transition-transform">
                  <CalendarPlus size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">ডিউটি দিন</h4>
                  <p className="text-[9px] text-slate-400 mt-1">রপ্তানি ও ছুটি ডিউটি</p>
                </div>
              </Link>

              <Link href="/employees" className="p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 text-center flex flex-col items-center gap-3 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-none group-hover:scale-110 transition-transform">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">কর্মকর্তা যুক্ত</h4>
                  <p className="text-[9px] text-slate-400 mt-1">নতুন ডেটাবেজ এন্ট্রি</p>
                </div>
              </Link>

              <Link href="/billing" className="p-4 rounded-2xl bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 text-center flex flex-col items-center gap-3 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-200 dark:shadow-none group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">বিল নোট তৈরি</h4>
                  <p className="text-[9px] text-slate-400 mt-1">আপ্যায়ন বিল শিট</p>
                </div>
              </Link>

              <Link href="/roster" className="p-4 rounded-2xl bg-sky-50/50 hover:bg-sky-50 dark:bg-sky-950/10 dark:hover:bg-sky-950/20 border border-sky-100/50 dark:border-sky-900/30 text-center flex flex-col items-center gap-3 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-200 dark:shadow-none group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-sky-900 dark:text-sky-200">রোস্টার ও জেনারেট</h4>
                  <p className="text-[9px] text-slate-400 mt-1">অফিস আদেশ ডাউনলোড</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Analytics Charts Grid */}
          {filteredDuties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart 1: Financial Allocation */}
              <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      <PieIcon size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">আপ্যায়ন বরাদ্দ অনুপাত</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">টাইপ ভিত্তিক মোট বরাদ্দের পরিমাণ।</p>
                    </div>
                  </div>
                  <div className="h-60 w-full flex items-center justify-center relative mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={billData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={6}
                          dataKey="value"
                        >
                          {billData.map((entry, index) => (
                            <RechartsCell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Ring center value */}
                    <div className="absolute text-center select-none pointer-events-none">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">মোট বরাদ্দ</p>
                      <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 font-sans mt-0.5">
                        ৳{formatBanglaCurrency(totalBill)}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Custom Styled Legends */}
                <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  {billData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {item.display}: <span className="font-sans font-bold text-slate-700 dark:text-slate-300">৳{formatBanglaCurrency(item.value)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: Duty Count */}
              <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg">
                      <BarChart4 size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">ডিউটি সম্পন্ন সংখ্যা</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">ডিউটি পালনের মোট ফ্রিকোয়েন্সি তুলনা।</p>
                    </div>
                  </div>
                  <div className="h-60 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={frequencyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={30}>
                          {frequencyData.map((entry, index) => (
                            <RechartsCell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  {frequencyData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {item.name}: <span className="font-sans font-bold text-slate-700 dark:text-slate-300">{toBanglaDigits(item.count)} বার</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State for Charts */
            <div className="glass-card p-12 rounded-2xl text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <CalendarCheck size={28} />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">ডিউটি ডাটা পাওয়া যায়নি</h3>
                <p className="text-xs text-slate-400 mt-2">নির্বাচিত সময়কালের মধ্যে কোনো অফিস আদেশ বা অ্যাসাইনড ডিউটি পাওয়া যায়নি। ডাটা জেনারেট করতে কর্মকর্তাদের ডিউটি দিন।</p>
              </div>
              <Link 
                href="/roster" 
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 dark:shadow-none transition-colors"
              >
                ডিউটি অ্যাসাইন করুন
              </Link>
            </div>
          )}

          {/* Cell Bill Breakdown Leaderboard */}
          {cellLeaderboard.length > 0 && (
            <div className="glass-card p-6 rounded-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">শীর্ষ সচল সেল ও বরাদ্দ বিবরণী</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">সবচেয়ে বেশি বরাদ্দপ্রাপ্ত ও ডিউটি সম্পন্ন সেলসমূহের তুলনামূলক তালিকা।</p>
                </div>
              </div>
              <div className="space-y-4">
                {cellLeaderboard.slice(0, 5).map((cell, index) => {
                  const percent = Math.max(10, Math.round((cell.totalBill / maxCellBill) * 100));
                  return (
                    <div key={cell.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-sans text-[10px]">
                            {index + 1}
                          </span>
                          <span className="text-slate-700 dark:text-slate-200">{cell.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-semibold text-slate-400">{toBanglaDigits(cell.dutiesCount)} টি ডিউটি</span>
                          <span className="text-slate-900 dark:text-slate-50">৳{formatBanglaCurrency(cell.totalBill)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800/60 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-700" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Activity Feeds & Holidays (Spans 1 column) */}
        <div className="space-y-8">
          
          {/* Top Duty Performing Employees Leaderboard */}
          {employeeLeaderboard.length > 0 && (
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">শীর্ষ ডিউটি সম্পন্নকারী</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">সবচেয়ে বেশি ডিউটি সম্পন্ন কর্মকর্তা।</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {employeeLeaderboard.map((emp, index) => (
                  <div key={emp.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-primary dark:text-accent font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                        {toBanglaDigits(index + 1)}
                      </div>
                      <div className="leading-tight">
                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 tracking-wide">{emp.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{emp.designation} ({emp.cellName})</p>
                      </div>
                    </div>
                    <div className="text-right leading-tight">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-sans tracking-wide">
                        {toBanglaDigits(emp.dutiesCount)} <span className="text-[9px] text-slate-400 font-bold">বার</span>
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1">৳{formatBanglaCurrency(emp.totalBill)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Staged Assignments Log */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">সাম্প্রতিক কার্যক্রম</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">সদ্য বরাদ্দকৃত ডিউটিসমূহের বিবরণ।</p>
              </div>
              <span className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-primary animate-pulse">
                <Activity size={12} />
              </span>
            </div>
            
            {filteredDuties.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {filteredDuties.slice(0, 5).map((duty: any) => {
                  let badgeColor = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400';
                  let dutyTypeBn = 'লেট সিটিং';
                  
                  if (duty.type === 'HOLIDAY') {
                    badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
                    dutyTypeBn = 'সরকারি ছুটি';
                  } else if (duty.type === 'NIGHT_SHIFT') {
                    badgeColor = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400';
                    dutyTypeBn = 'রাত্রীকালীন';
                  }

                  return (
                    <div key={duty.id} className="p-3 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100/60 dark:border-slate-800/40 rounded-xl space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800/45 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="leading-tight">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{duty.employee?.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{duty.employee?.designation} ({duty.employee?.cell?.name})</p>
                        </div>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase leading-none shrink-0 ${badgeColor}`}>
                          {dutyTypeBn}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold border-t border-dashed border-slate-200/50 dark:border-slate-800/30 pt-1.5">
                        <span className="flex items-center gap-1">
                          <Clock size={10} className="text-slate-400" />
                          {toBanglaDigits(new Date(duty.date).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))}
                        </span>
                        <span className="text-slate-800 dark:text-slate-300">৳{formatBanglaCurrency(duty.totalBill)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">সাম্প্রতিক কোনো তথ্য নেই।</p>
            )}
          </div>

          {/* Upcoming Configuration Public Holidays */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">আসন্ন সরকারি ছুটি</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">পরবর্তী ক্যালেন্ডার ছুটির দিনসমূহ।</p>
              </div>
              <span className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sky-500">
                <Calendar size={12} />
              </span>
            </div>
            
            {upcomingHolidays.length > 0 ? (
              <div className="space-y-3">
                {upcomingHolidays.map((holiday: any) => (
                  <div key={holiday.id} className="flex items-center gap-3">
                    <div className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 font-bold text-center shrink-0 border border-sky-100 dark:border-sky-900/30">
                      <p className="text-[10px] font-sans leading-none tracking-tight">
                        {toBanglaDigits(new Date(holiday.date).getDate())}
                      </p>
                      <p className="text-[8px] font-bold leading-none mt-1">
                        {new Date(holiday.date).toLocaleDateString('bn-BD', { month: 'short' })}
                      </p>
                    </div>
                    <div className="leading-tight">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{holiday.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 font-sans tracking-wide mt-1">
                        {toBanglaDigits(new Date(holiday.date).toLocaleDateString('bn-BD', { weekday: 'long' }))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-slate-400">ছুটির কোনো দিন কনফিগার করা নেই।</p>
                <Link href="/roster" className="text-[9px] font-bold text-primary hover:underline block">
                  ক্যালেন্ডার ও জিও সেটিং দেখুন
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Regulatory Scale Info Panel */}
      <div className="glass-card p-6 rounded-2xl space-y-5">
        <div>
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">আপ্যায়ন বিল ও যাতায়াত ভাতার সরকারি রেট এবং নিয়মাবলী</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Janata Bank PLC. কর্তৃক অনুমোদিত রোস্টার ডিউটি এবং আপ্যায়ন বরাদ্দের বর্তমান নিয়ম বিবরণী।</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rule 1 */}
          <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">Late Sitting (লেট সিটিং)</h4>
              <span className="text-[9px] font-extrabold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full font-sans tracking-tight">৳৩০০</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
              <p className="flex justify-between font-medium"><span>• সান্ধ্যকালীন নাস্তা:</span> <span className="font-sans font-bold">৳১০০</span></p>
              <p className="flex justify-between font-medium"><span>• যাতায়াত ভাতা:</span> <span className="font-sans font-bold">৳২০০</span></p>
              <div className="h-px bg-slate-200/50 dark:bg-slate-800/40 my-1" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs text-right">মোট দৈনিক বরাদ্দ: ৳৩০০/জন</p>
              <p className="text-[9px] text-rose-500 dark:text-rose-400 leading-normal mt-1.5 font-bold">• সরকারি ছুটির দিনে লেট সিটিং প্রযোজ্য নয়।</p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="p-4 bg-sky-50/20 dark:bg-sky-950/10 border border-sky-100/50 dark:border-sky-900/20 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sky-700 dark:text-sky-400 text-sm">Holiday Duty (সরকারি ছুটি)</h4>
              <span className="text-[9px] font-extrabold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full font-sans tracking-tight">৳৫০০</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
              <p className="flex justify-between font-medium"><span>• দুপুরের খাবার:</span> <span className="font-sans font-bold">৳২৫০</span></p>
              <p className="flex justify-between font-medium"><span>• যাতায়াত ভাতা:</span> <span className="font-sans font-bold">৳২৫০</span></p>
              <div className="h-px bg-slate-200/50 dark:bg-slate-800/40 my-1" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs text-right">মোট দৈনিক বরাদ্দ: ৳৫০০/জন</p>
              <p className="text-[9px] text-emerald-500 leading-normal mt-1.5 font-bold">• শুক্রবার, শনিবার ও অন্যান্য ঘোষিত ছুটির দিনসমূহ।</p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="p-4 bg-rose-50/15 dark:bg-rose-950/10 border border-rose-100/30 dark:border-rose-900/20 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-rose-700 dark:text-rose-400 text-sm">Night Shift (রাত্রীকালীন ডিউটি)</h4>
              <span className="text-[9px] font-extrabold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full font-sans tracking-tight">৳১,০০০</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
              <p className="flex justify-between font-medium"><span>• রাতের খাবার (ডিনার):</span> <span className="font-sans font-bold">৳৬০০</span></p>
              <p className="flex justify-between font-medium"><span>• যাতায়াত ভাতা:</span> <span className="font-sans font-bold">৳৪০০</span></p>
              <div className="h-px bg-slate-200/50 dark:bg-slate-800/40 my-1" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs text-right">মোট দৈনিক বরাদ্দ: ৳১,০০০/জন</p>
              <p className="text-[9px] text-rose-500 dark:text-rose-400 leading-normal mt-1.5 font-bold">• বিশেষ ইমার্জেন্সি সাপোর্ট এবং সার্ভার মেইনটেন্যান্স ডিউটি।</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
