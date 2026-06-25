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

// Colors for Pie Chart
const COLORS = ['#0b5e9e', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

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

  // 2. Format Month names for Personal Allowance Trend
  const formattedPersonalTrendData = personalAllowanceTrend.map(d => {
    const [y, m] = d.month.split('-');
    const monthName = MONTHS_BN[parseInt(m, 10) - 1] || m;
    return {
      name: `${monthName} ${y.substring(2)}`,
      allowance: d.totalAllowance
    };
  });

  // 3. Transform Leave Patterns for Year-over-Year comparison
  const years = Array.from(new Set(leavePatterns.map(p => p.year))).sort();
  const formattedLeaveData = MONTHS_BN.map((mName, idx) => {
    const monthCode = String(idx + 1).padStart(2, '0');
    const item: any = { name: mName };
    years.forEach(yr => {
      const match = leavePatterns.find(p => p.year === yr && p.month === monthCode);
      item[yr] = match ? match.count : 0;
    });
    return item;
  });

  // 4. Format Date for Bill Releases ("2026-06-10" -> "১০ জুন")
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
      
      {/* 0. Personal Allowance Trend (Line Chart) for Admin/User who has Employee profile */}
      {!isEmployee && personalAllowanceTrend.length > 0 && (
        <div className="bg-gradient-to-br from-white to-blue-50/10 dark:from-slate-900 dark:to-blue-950/10 rounded-3xl p-6 border border-slate-100/80 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary">আমার প্রাপ্ত ভাতার ধারা (My Allowance Trend)</h3>
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold rounded-full uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/50">ব্যক্তিগত</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={formattedPersonalTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => `৳${toBanglaDigits(val)}`}
                />
                <Tooltip 
                  formatter={(val) => [`৳${toBanglaDigits(Number(val).toLocaleString())}`, 'প্রাপ্ত ভাতা']}
                  contentStyle={{ borderRadius: '16px', border: '1px solid var(--card-border)', backgroundColor: 'var(--surface-bright)', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="allowance" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  activeDot={{ r: 6 }} 
                  dot={{ strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 1. Allowance Trend (Line Chart) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {isEmployee ? 'আমার প্রাপ্ত ভাতার ধারা (My Allowance Trend)' : 'সামগ্রিক মাসিক ভাতা ব্যয়ের ধারা (Allowance Trend)'}
        </h3>
        <div className="h-72 w-full">
          {formattedTrendData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
              কোনো তথ্য পাওয়া যায়নি।
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={formattedTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => `৳${toBanglaDigits(val)}`}
                />
                <Tooltip 
                  formatter={(val) => [`৳${toBanglaDigits(Number(val).toLocaleString())}`, isEmployee ? 'প্রাপ্ত ভাতা' : 'মোট ভাতা খরচ']}
                  contentStyle={{ borderRadius: '16px', border: '1px solid var(--card-border)', backgroundColor: 'var(--surface-bright)', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="allowance" 
                  stroke="#0b5e9e" 
                  strokeWidth={3} 
                  activeDot={{ r: 6 }} 
                  dot={{ strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Top Performers (Bar Chart) - Hidden for employees to save space, shown as a standard performers list/chart if needed */}
      {!isEmployee && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">সর্বোচ্চ ডিউটি সম্পাদনকারী (Top Performers - Count Only)</h3>
          <div className="h-72 w-full">
            {topPerformers.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                কোনো তথ্য পাওয়া যায়নি।
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={topPerformers} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis 
                    dataKey="employeeName" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    tickFormatter={(name) => name.split(' ').slice(-2).join(' ')} // abbreviate name to fit
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    tickFormatter={(val) => toBanglaDigits(String(val))}
                  />
                  <Tooltip 
                    formatter={(val) => [toBanglaDigits(String(val)), 'ডিউটি সংখ্যা']}
                    labelFormatter={(idx) => {
                      const emp = topPerformers[idx as number];
                      return emp ? `${emp.employeeName} (${emp.designation})` : '';
                    }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid var(--card-border)', backgroundColor: 'var(--surface-bright)', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={28}>
                    {topPerformers.map((entry, index) => (
                      <RechartsCell key={`cell-${index}`} fill={index === 0 ? '#0b5e9e' : '#4f46e5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* 3. Cell-wise Budget Consumption (Pie Chart) - Hidden for employees */}
      {!isEmployee && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">সামগ্রিক সেল-ভিত্তিক বাজেট খরচ বিভাজন (Cell Budget)</h3>
          <div className="h-72 w-full flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="h-56 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={cellBudget}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="totalAllowance"
                    nameKey="cellName"
                  >
                    {cellBudget.map((entry, index) => (
                      <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => [`৳${toBanglaDigits(Number(val).toLocaleString())}`, 'মোট খরচ']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid var(--card-border)', backgroundColor: 'var(--surface-bright)', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="w-full md:w-1/2 overflow-y-auto max-h-56 space-y-2 text-xs">
              {cellBudget.map((item, idx) => (
                <div key={item.cellName} className="flex items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-800 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.cellName}</span>
                  </div>
                  <span className="font-sans font-semibold text-slate-500 dark:text-slate-400">
                    ৳{toBanglaDigits(item.totalAllowance.toLocaleString())}/-
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Year-over-Year Leave Pattern (Line Chart) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {isEmployee ? 'আমার বছর-ভিত্তিক ছুটির তুলনা (My YoY Leaves)' : 'সামগ্রিক বছর-ভিত্তিক ছুটির প্যাটার্ন তুলনা (Overall YoY Leaves)'}
        </h3>
        <div className="h-72 w-full">
          {formattedLeaveData.every(item => Object.keys(item).length <= 1) ? (
            <div className="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
              কোনো তথ্য পাওয়া যায়নি।
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={formattedLeaveData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => toBanglaDigits(String(val))}
                />
                <Tooltip 
                  formatter={(val) => [toBanglaDigits(String(val)), 'আবেদন সংখ্যা']}
                  contentStyle={{ borderRadius: '16px', border: '1px solid var(--card-border)', backgroundColor: 'var(--surface-bright)', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                {years.map((yr, idx) => (
                  <Line 
                    key={yr}
                    type="monotone" 
                    dataKey={yr} 
                    name={`${toBanglaDigits(yr)} সাল`}
                    stroke={COLORS[idx % COLORS.length]} 
                    strokeWidth={2.5} 
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 5. Bill Releases by Date (Bar Chart) - Public */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">তারিখ অনুযায়ী বিল ছাড়ার পরিমাণ (Daily Bill Releases)</h3>
        <div className="h-72 w-full">
          {billReleases.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
              কোনো তথ্য পাওয়া যায়নি।
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={billReleases.map(d => ({ name: formatOrderDate(d.orderDate), count: d.count }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => toBanglaDigits(String(val))}
                />
                <Tooltip 
                  formatter={(val) => [toBanglaDigits(String(val)), 'বিল সংখ্যা']}
                  contentStyle={{ borderRadius: '16px', border: '1px solid var(--card-border)', backgroundColor: 'var(--surface-bright)', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={28}>
                  {billReleases.map((entry, index) => (
                    <RechartsCell key={`cell-${index}`} fill={index % 2 === 0 ? '#0ea5e9' : '#0b5e9e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 6. Released Bills per Employee (List / Table) - Public */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">কর্মকর্তা অনুযায়ী বিল ছাড়ার সংখ্যা (Released Bills per Employee)</h3>
          <div className="overflow-y-auto max-h-72 pr-2 no-scrollbar space-y-2.5">
            {employeeBillCounts.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                কোনো তথ্য পাওয়া যায়নি।
              </div>
            ) : (
              employeeBillCounts.map((emp, idx) => (
                <div key={emp.employeeName} className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-primary text-[10px] font-bold rounded-full">
                      {toBanglaDigits((idx + 1).toString())}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{emp.employeeName}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 text-xs font-bold rounded-full border border-emerald-100 dark:border-emerald-900/50">
                    {toBanglaDigits(emp.count.toString())} টি বিল
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
