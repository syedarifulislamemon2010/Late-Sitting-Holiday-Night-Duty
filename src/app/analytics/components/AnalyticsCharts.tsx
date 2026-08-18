'use client';

import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell as RechartsCell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  PieChart as PieIcon, 
  CalendarDays, 
  BarChart3, 
  Users, 
  FileText,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface AnalyticsChartsProps {
  allowanceTrend: { month: string; totalAllowance: number }[];
  personalAllowanceTrend: { month: string; totalAllowance: number }[];
  topPerformers: { employeeName: string; designation: string; count: number }[];
  cellBudget: { cellName: string; totalAllowance: number }[];
  leavePatterns: { year: string; month: string; count: number }[];
  billReleases: { orderDate: string; count: number }[];
  employeeBillCounts: { employeeName: string; count: number }[];
  role: string;
}

// Configurable threshold for sparse-data alternate display
const SPARSE_DATA_THRESHOLD = 3;

// Harmonious chart palette matching Sovereign Navy & Emerald accents
const PIE_COLORS = ['#0f75b8', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6'];
const RANK_GRADIENTS = ['#0f75b8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const MONTHS_BN = [
  'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export default function AnalyticsCharts({
  allowanceTrend,
  personalAllowanceTrend,
  topPerformers,
  cellBudget,
  leavePatterns,
  billReleases,
  employeeBillCounts,
  role
}: AnalyticsChartsProps) {

  const isEmployee = role === 'EMPLOYEE';

  // 1. Format Month names for Allowance Trend
  const formattedTrendData = allowanceTrend.map(d => {
    const [y, m] = d.month.split('-');
    const monthName = MONTHS_BN[parseInt(m, 10) - 1] || m;
    return {
      name: `${monthName} ${y.substring(2)}`,
      allowance: d.totalAllowance
    };
  });

  // 2. Transform Leave Patterns for Year-over-Year comparison
  const years = Array.from(new Set(leavePatterns.map(p => p.year))).sort();
  const formattedLeaveData = MONTHS_BN.map((mName, idx) => {
    const monthCode = String(idx + 1).padStart(2, '0');
    const item: Record<string, string | number> = { name: mName };
    years.forEach(yr => {
      const match = leavePatterns.find(p => p.year === yr && p.month === monthCode);
      item[yr] = match ? match.count : 0;
    });
    return item;
  });

  // 3. Format Date for Bill Releases ("2026-06-10" -> "১০ জুন")
  const formatOrderDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length < 3) return dateStr;
      const day = toBanglaDigits(parseInt(parts[2], 10).toString());
      const monthBN = MONTHS_BN[parseInt(parts[1], 10) - 1] || parts[1];
      return `${day} ${monthBN}`;
    } catch {
      return dateStr;
    }
  };

  // 4. Calculate total budget for Donut Chart percentage calculations
  const totalCellBudget = cellBudget.reduce((acc, curr) => acc + curr.totalAllowance, 0);

  // 5. Max bill count for Employee Progress Bars
  const maxEmployeeBillCount = Math.max(...employeeBillCounts.map(e => e.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
      
      {/* 1. Allowance Trend (Line Chart) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4">
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="space-y-0.5">
            <h3 className="app-card-heading flex items-center gap-2 text-slate-850 dark:text-slate-100 text-sm sm:text-[15px]">
              <TrendingUp className="text-primary shrink-0" size={18} />
              <span>{isEmployee ? 'আমার প্রাপ্ত ভাতার ধারা' : 'সামগ্রিক মাসিক ভাতা ব্যয়ের ধারা'}</span>
            </h3>
            <p className="app-body-subtext text-xs text-slate-500 dark:text-slate-400">
              {isEmployee ? 'মাসভিত্তিক ব্যক্তিগত ভাতার হিসেব' : 'মাসভিত্তিক সর্বমোট অনুমোদিত ভাতার ট্রেন্ডলাইন'}
            </p>
          </div>
        </div>
        
        <div className="h-72 w-full">
          {formattedTrendData.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
              <TrendingUp className="text-slate-300 dark:text-slate-600" size={28} />
              <span>কোনো ভাতার তথ্য পাওয়া যায়নি।</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={formattedTrendData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle, #e2e8f0)" strokeOpacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => `৳${toBanglaDigits(val)}`}
                />
                <Tooltip 
                  formatter={(val) => [`৳${toBanglaDigits(Number(val).toLocaleString())}/-`, isEmployee ? 'প্রাপ্ত ভাতা' : 'মোট ভাতা ব্যয়']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--card-border, #e2e8f0)', backgroundColor: 'var(--card-bg, #ffffff)', color: 'var(--foreground, #0f172a)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)', padding: '10px', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="allowance" 
                  stroke="#0f75b8" 
                  strokeWidth={2.5} 
                  activeDot={{ r: 6, fill: '#0f75b8', stroke: '#ffffff', strokeWidth: 2 }} 
                  dot={{ strokeWidth: 2, r: 4, fill: '#ffffff', stroke: '#0f75b8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Top Performers (Bar Chart) */}
      {!isEmployee && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <div className="space-y-0.5">
              <h3 className="app-card-heading flex items-center gap-2 text-slate-850 dark:text-slate-100 text-sm sm:text-[15px]">
                <Award className="text-amber-500 shrink-0" size={18} />
                <span>সর্বোচ্চ ডিউটি সম্পাদনকারী (Top Performers)</span>
              </h3>
              <p className="app-body-subtext text-xs text-slate-500 dark:text-slate-400">
                নির্বাচিত সময়সীমার মধ্যে সর্বোচ্চ ডিউটি পালনকারী কর্মকর্তাবৃন্দ
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {topPerformers.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-400 text-xs gap-2">
                <Award className="text-slate-300 dark:text-slate-600" size={28} />
                <span>কোনো পারফর্মার ডাটা পাওয়া যায়নি।</span>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-between">
                <div className="flex-1 min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={topPerformers} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle, #e2e8f0)" strokeOpacity={0.5} />
                      <XAxis 
                        dataKey="employeeName" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        tickFormatter={(name) => name.split(' ').slice(-2).join(' ')}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                        tickFormatter={(val) => toBanglaDigits(String(val))}
                      />
                      <Tooltip 
                        formatter={(val) => [`${toBanglaDigits(String(val))} টি`, 'ডিউটি সংখ্যা']}
                        labelFormatter={(_, payload) => {
                          const item = payload?.[0]?.payload;
                          return item ? `${item.employeeName} (${item.designation})` : '';
                        }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--card-border, #e2e8f0)', backgroundColor: 'var(--card-bg, #ffffff)', color: 'var(--foreground, #0f172a)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)', padding: '10px', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={26}>
                        {topPerformers.map((_, index) => (
                          <RechartsCell 
                            key={`cell-${index}`} 
                            fill={RANK_GRADIENTS[Math.min(index, RANK_GRADIENTS.length - 1)]} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#0f75b8]" />
                    <span>১ম স্থান</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]" />
                    <span>২য়-৩য় স্থান</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#93c5fd]" />
                    <span>অন্যান্য</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Cell-wise Budget Consumption (Donut Chart with Full Cell Names) */}
      {!isEmployee && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <div className="space-y-0.5">
              <h3 className="app-card-heading flex items-center gap-2 text-slate-850 dark:text-slate-100 text-sm sm:text-[15px]">
                <PieIcon className="text-emerald-600 shrink-0" size={18} />
                <span>সেল-ভিত্তিক বাজেট খরচ বিভাজন (Cell Budget)</span>
              </h3>
              <p className="app-body-subtext text-xs text-slate-500 dark:text-slate-400">
                বিভিন্ন সেলের মাঝে মোট ভাতার শতকরা বণ্টন ও পরিমাণ
              </p>
            </div>
          </div>

          <div className="h-72 w-full flex flex-col md:flex-row items-center justify-between gap-4">
            {cellBudget.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-400 text-xs gap-2">
                <PieIcon className="text-slate-300 dark:text-slate-600" size={28} />
                <span>কোনো বাজেট তথ্য পাওয়া যায়নি।</span>
              </div>
            ) : (
              <>
                <div className="h-56 w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={cellBudget}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="totalAllowance"
                        nameKey="cellName"
                      >
                        {cellBudget.map((_, index) => (
                          <RechartsCell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val, name, entry) => {
                          const num = Number(val) || 0;
                          const pct = totalCellBudget > 0 ? ((num / totalCellBudget) * 100).toFixed(1) : '0';
                          return [
                            `৳${toBanglaDigits(num.toLocaleString())}/- (${toBanglaDigits(pct)}%)`,
                            String(entry.payload.cellName)
                          ];
                        }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--card-border, #e2e8f0)', backgroundColor: 'var(--card-bg, #ffffff)', color: 'var(--foreground, #0f172a)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)', padding: '10px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom Responsive Legend with Full Cell Names (No Truncation) */}
                <div className="w-full md:w-1/2 overflow-y-auto max-h-56 space-y-2 text-xs no-scrollbar">
                  {cellBudget.map((item, idx) => {
                    const pct = totalCellBudget > 0 ? ((item.totalAllowance / totalCellBudget) * 100).toFixed(1) : '0';
                    return (
                      <div key={item.cellName} className="flex items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-800 pb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 leading-snug break-words" title={item.cellName}>
                            {item.cellName}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-sans font-bold text-slate-800 dark:text-slate-200">
                            ৳{toBanglaDigits(item.totalAllowance.toLocaleString())}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1 font-mono">
                            ({toBanglaDigits(pct)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. Leave Pattern Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4">
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="space-y-0.5">
            <h3 className="app-card-heading flex items-center gap-2 text-slate-850 dark:text-slate-100 text-sm sm:text-[15px]">
              <CalendarDays className="text-sky-600 shrink-0" size={18} />
              <span>
                {years.length > 1 
                  ? 'সামগ্রিক বছর-ভিত্তিক ছুটির প্যাটার্ন তুলনা' 
                  : `${toBanglaDigits(years[0] || '২০২৬')} সালের মাসিক ছুটির প্যাটার্ন`}
              </span>
            </h3>
            <p className="app-body-subtext text-xs text-slate-500 dark:text-slate-400">
              মাসভিত্তিক নৈমিত্তিক ও অর্জিত ছুটির আবেদনের ট্রেন্ড
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          {formattedLeaveData.every(item => Object.keys(item).length <= 1) ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-400 text-xs gap-2">
              <CalendarDays className="text-slate-300 dark:text-slate-600" size={28} />
              <span>কোনো ছুটির ডাটা পাওয়া যায়নি।</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={formattedLeaveData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle, #e2e8f0)" strokeOpacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => toBanglaDigits(String(val))}
                />
                <Tooltip 
                  formatter={(val) => [`${toBanglaDigits(String(val))} টি আবেদন`, 'ছুটির পরিমাণ']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--card-border, #e2e8f0)', backgroundColor: 'var(--card-bg, #ffffff)', color: 'var(--foreground, #0f172a)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)', padding: '10px', fontSize: '12px' }}
                />
                {years.length > 1 && <Legend verticalAlign="top" height={32} iconType="circle" />}
                {years.map((yr, idx) => (
                  <Line 
                    key={yr}
                    type="monotone" 
                    dataKey={yr} 
                    name={`${toBanglaDigits(yr)} সাল`}
                    stroke={PIE_COLORS[idx % PIE_COLORS.length]} 
                    strokeWidth={2.5} 
                    dot={{ r: 3.5, fill: '#ffffff', stroke: PIE_COLORS[idx % PIE_COLORS.length], strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 5. Bill Releases by Date (Smart Sparse Data Display) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4">
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="space-y-0.5">
            <h3 className="app-card-heading flex items-center gap-2 text-slate-850 dark:text-slate-100 text-sm sm:text-[15px]">
              <BarChart3 className="text-primary shrink-0" size={18} />
              <span>তারিখ অনুযায়ী বিল ছাড়ার পরিমাণ (Daily Bill Releases)</span>
            </h3>
            <p className="app-body-subtext text-xs text-slate-500 dark:text-slate-400">
              অফিস আদেশ জারির তারিখ অনুযায়ী রিলিজকৃত বিলের পরিসংখ্যান
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          {billReleases.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-400 text-xs gap-2">
              <BarChart3 className="text-slate-300 dark:text-slate-600" size={28} />
              <span>কোনো বিল রিলিজের তথ্য পাওয়া যায়নি।</span>
            </div>
          ) : billReleases.length <= SPARSE_DATA_THRESHOLD ? (
            /* Smart Centered Stat Display for Sparse Data (<= 3 items) */
            <div className="h-full flex flex-col items-center justify-center space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                {billReleases.map((d, i) => (
                  <div 
                    key={d.orderDate}
                    className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-slate-800/80 dark:to-blue-950/30 border border-blue-100/70 dark:border-slate-700/60 flex items-center gap-3 shadow-xs"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {formatOrderDate(d.orderDate)}
                      </p>
                      <p className="app-amount-text text-base font-black text-slate-800 dark:text-slate-100">
                        {toBanglaDigits(String(d.count))} টি বিল
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                <Info size={13} className="shrink-0" />
                <span>আরও তারিখের বিল যোগ হলে বিস্তারিত বার-চার্ট ট্রেন্ড দেখা যাবে।</span>
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={billReleases.map(d => ({ name: formatOrderDate(d.orderDate), count: d.count }))} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle, #e2e8f0)" strokeOpacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => toBanglaDigits(String(val))}
                />
                <Tooltip 
                  formatter={(val) => [`${toBanglaDigits(String(val))} টি`, 'বিল সংখ্যা']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--card-border, #e2e8f0)', backgroundColor: 'var(--card-bg, #ffffff)', color: 'var(--foreground, #0f172a)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)', padding: '10px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={26}>
                  {billReleases.map((_, index) => (
                    <RechartsCell key={`cell-${index}`} fill={index % 2 === 0 ? '#0f75b8' : '#2563eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 6. Released Bills per Employee (Auto-fit List with In-Row Mini Progress Bars) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <div className="space-y-0.5">
              <h3 className="app-card-heading flex items-center gap-2 text-slate-850 dark:text-slate-100 text-sm sm:text-[15px]">
                <Users className="text-indigo-600 shrink-0" size={18} />
                <span>কর্মকর্তা অনুযায়ী বিল ছাড়ার সংখ্যা</span>
              </h3>
              <p className="app-body-subtext text-xs text-slate-500 dark:text-slate-400">
                কর্মকর্তা-ভিত্তিক রিলিজ হওয়া বিল ও শতকরা অনুপাত
              </p>
            </div>
          </div>

          <div className="overflow-y-auto max-h-64 pr-1 no-scrollbar space-y-3">
            {employeeBillCounts.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 dark:text-slate-400 text-xs gap-2">
                <Users className="text-slate-300 dark:text-slate-600" size={28} />
                <span>কোনো কর্মকর্তার বিলের রেকর্ড নেই।</span>
              </div>
            ) : (
              employeeBillCounts.map((emp, idx) => {
                const percentage = Math.round((emp.count / maxEmployeeBillCount) * 100);
                return (
                  <div key={emp.employeeName} className="space-y-1.5 pb-2 border-b border-slate-100/70 dark:border-slate-800/60 last:border-0">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-full shrink-0">
                          {toBanglaDigits((idx + 1).toString())}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {emp.employeeName}
                        </span>
                      </div>
                      <span className="font-sans font-bold text-slate-800 dark:text-slate-200 text-xs shrink-0">
                        {toBanglaDigits(emp.count.toString())} টি বিল
                      </span>
                    </div>

                    {/* In-Row Horizontal Mini Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
