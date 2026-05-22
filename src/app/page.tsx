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
  BarChart4
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    employeesCount: 0,
    cellsCount: 0,
    dutiesCount: 0,
    totalBill: 0,
    lateSittingBill: 0,
    holidayBill: 0,
    nightShiftBill: 0,
    lateSittingCount: 0,
    holidayCount: 0,
    nightShiftCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [empRes, cellRes, dutyRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/cells'),
          fetch('/api/duties')
        ]);
        
        const emps = await empRes.json();
        const cells = await cellRes.json();
        const duties = await dutyRes.json();
        
        const statsObj = {
          employeesCount: Array.isArray(emps) ? emps.length : 0,
          cellsCount: Array.isArray(cells) ? cells.length : 0,
          dutiesCount: Array.isArray(duties) ? duties.length : 0,
          totalBill: 0,
          lateSittingBill: 0,
          holidayBill: 0,
          nightShiftBill: 0,
          lateSittingCount: 0,
          holidayCount: 0,
          nightShiftCount: 0
        };

        if (Array.isArray(duties)) {
          duties.forEach((d: any) => {
            statsObj.totalBill += d.totalBill || 0;
            if (d.type === 'LATE_SITTING') {
              statsObj.lateSittingBill += d.totalBill || 0;
              statsObj.lateSittingCount++;
            } else if (d.type === 'HOLIDAY') {
              statsObj.holidayBill += d.totalBill || 0;
              statsObj.holidayCount++;
            } else if (d.type === 'NIGHT_SHIFT') {
              statsObj.nightShiftBill += d.totalBill || 0;
              statsObj.nightShiftCount++;
            }
          });
        }
        
        setStats(statsObj);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const COLORS = ['#6366f1', '#0ea5e9', '#10b981'];

  // Data for charts
  const billData = [
    { name: 'Late Sitting', value: stats.lateSittingBill, display: 'লেট সিটিং', amount: `৳${stats.lateSittingBill.toLocaleString('bn-BD')}` },
    { name: 'Holiday Duty', value: stats.holidayBill, display: 'সরকারি ছুটি', amount: `৳${stats.holidayBill.toLocaleString('bn-BD')}` },
    { name: 'Night Shift', value: stats.nightShiftBill, display: 'রাত্রীকালীন', amount: `৳${stats.nightShiftBill.toLocaleString('bn-BD')}` }
  ].filter(item => item.value > 0);

  const frequencyData = [
    { name: 'লেট সিটিং (৳৩০০)', count: stats.lateSittingCount },
    { name: 'সরকারি ছুটি (৳৫০০)', count: stats.holidayCount },
    { name: 'রাত্রীকালীন (৳১০০০)', count: stats.nightShiftCount }
  ];

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
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-wide">সিস্টেম ড্যাশবোর্ড</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">স্বাগতম! ডিউটি ম্যানেজমেন্ট ও আপ্যায়ন বিলিং পোর্টালে আপনার আজকের দিনের সারসংক্ষেপ।</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Officers */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-indigo-500/30 dark:hover:border-indigo-400/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">মোট কর্মকর্তা</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2 font-sans">{stats.employeesCount.toLocaleString('bn-BD')} জন</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users size={22} />
            </div>
          </div>
          <Link href="/employees" className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:gap-2.5 transition-all">
            কর্মকর্তা তালিকা দেখুন <ArrowRight size={12} />
          </Link>
        </div>

        {/* KPI 2: Cells */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-sky-500/30 dark:hover:border-sky-400/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">সচল সেল</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2 font-sans">{stats.cellsCount.toLocaleString('bn-BD')} টি</h3>
            </div>
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl">
              <Building2 size={22} />
            </div>
          </div>
          <Link href="/employees?tab=cells" className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:gap-2.5 transition-all">
            সেল ম্যানেজ করুন <ArrowRight size={12} />
          </Link>
        </div>

        {/* KPI 3: Total Duties */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/30 dark:hover:border-emerald-400/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">মোট অ্যাসাইনড ডিউটি</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2 font-sans">{stats.dutiesCount.toLocaleString('bn-BD')} টি</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CalendarCheck size={22} />
            </div>
          </div>
          <Link href="/roster" className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:gap-2.5 transition-all">
            রোস্টার ও অফিস অর্ডার <ArrowRight size={12} />
          </Link>
        </div>

        {/* KPI 4: Total Bill */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-violet-500/30 dark:hover:border-violet-400/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">সর্বমোট আপ্যায়ন বিল</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2 font-sans">৳{stats.totalBill.toLocaleString('bn-BD')}</h3>
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-xl">
              <Banknote size={22} />
            </div>
          </div>
          <Link href="/billing" className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:gap-2.5 transition-all">
            বিল নোট জেনারেট করুন <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Analytics Charts */}
      {stats.dutiesCount > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Financial Breakdown (Pie Chart) */}
          <div className="glass-card p-6 rounded-2xl space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <PieIcon size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">আপ্যায়ন বিলের আর্থিক বরাদ্দ</h3>
                <p className="text-xs text-slate-400 mt-0.5">ডিউটির ক্যাটাগরি ভিত্তিক মোট আপ্যায়ন বিলের অনুপাত।</p>
              </div>
            </div>
            <div className="h-72 w-full flex items-center justify-center">
              {billData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={billData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {billData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => [`৳${value.toLocaleString('bn-BD')}`, props.payload.display]} 
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      formatter={(value, entry: any) => <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{entry.payload.display}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-400">চার্ট লোড করার জন্য পর্যাপ্ত ডাটা নেই</p>
              )}
            </div>
          </div>

          {/* Chart 2: Frequency Breakdown (Bar Chart) */}
          <div className="glass-card p-6 rounded-2xl space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg">
                <BarChart4 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">ডিউটি পালনের সংখ্যা</h3>
                <p className="text-xs text-slate-400 mt-0.5">লেট সিটিং, হলিডে এবং নাইট শিফট ডিউটি পালনের মোট ফ্রিকোয়েন্সি।</p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    formatter={(value: any) => [`${value} বার`, 'সম্পন্ন']}
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={45}>
                    {frequencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="glass-card p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <CalendarCheck size={28} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">কোনো ডিউটি অ্যাসাইন করা হয়নি</h3>
            <p className="text-sm text-slate-400 mt-1">সিস্টেমে পরিসংখ্যান ও চার্ট দেখতে কর্মকর্তাদের ডিউটি অ্যাসাইন করতে হবে।</p>
          </div>
          <Link 
            href="/roster" 
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-colors"
          >
            রোস্টার তৈরি শুরু করুন
          </Link>
        </div>
      )}

      {/* Structured Guidelines and Explanations */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">আপ্যায়ন বিলের বরাদ্দ বিবরণী (Entertainment Scale Rules):</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rule 1 */}
          <div className="p-4 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-950/20 rounded-xl space-y-2">
            <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">Late Sitting (লেট সিটিং)</h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>• সান্ধ্যকালীন নাস্তা: ৳১০০</p>
              <p>• যাতায়াত বরাদ্দ: ৳২০০</p>
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-1.5" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">মোট বরাদ্দ: ৳৩০০ (প্রতি জন/দিন)</p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="p-4 bg-sky-50/30 dark:bg-sky-950/10 border border-sky-100/50 dark:border-sky-950/20 rounded-xl space-y-2">
            <h4 className="font-bold text-sky-600 dark:text-sky-400 text-sm">Holiday Duty (সরকারি ছুটি)</h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>• দুপুরের খাবার: ৳২৫০</p>
              <p>• যাতায়াত বরাদ্দ: ৳২৫০</p>
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-1.5" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">মোট বরাদ্দ: ৳৫০০ (প্রতি জন/দিন)</p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="p-4 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-950/20 rounded-xl space-y-2">
            <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Night Shift (রাত্রীকালীন ডিউটি)</h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>• রাতের খাবার (Dinner): ৳৬০০</p>
              <p>• যাতায়াত বরাদ্দ: ৳৪০০</p>
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-1.5" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">মোট বরাদ্দ: ৳১০০০ (প্রতি জন/দিন)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
