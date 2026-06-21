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
  topNightPerformers: { employeeName: string; designation: string; count: number }[];
  cellBudget: { cellName: string; totalAllowance: number }[];
  leavePatterns: { year: string; month: string; count: number }[];
}

// Colors for Pie Chart
const COLORS = ['#0b5e9e', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const MONTHS_BN = [
  'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export default function AnalyticsCharts({
  allowanceTrend,
  topNightPerformers,
  cellBudget,
  leavePatterns
}: AnalyticsChartsProps) {

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
  // We want to construct an array for months 1 to 12:
  // [{ month: 'জানুয়ারি', '2025': 4, '2026': 8 }]
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
      
      {/* 1. Allowance Trend (Line Chart) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800">মাসিক ভাতা ব্যয়ের ধারা (Allowance Trend)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                tickFormatter={(val) => `৳${toBanglaDigits(val)}`}
              />
              <Tooltip 
                formatter={(val) => [`৳${toBanglaDigits(Number(val).toLocaleString())}`, 'ভাতা খরচ']}
                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
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
        </div>
      </div>

      {/* 2. Top Night Duty Performers (Bar Chart) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800">সর্বোচ্চ নাইট ডিউটি সম্পাদনকারী (Top Performers)</h3>
        <div className="h-72 w-full">
          {topNightPerformers.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
              কোনো তথ্য পাওয়া যায়নি।
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topNightPerformers} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
                  formatter={(val) => [toBanglaDigits(String(val)), 'নাইট ডিউটি সংখ্যা']}
                  labelFormatter={(idx) => {
                    const emp = topNightPerformers[idx as number];
                    return emp ? `${emp.employeeName} (${emp.designation})` : '';
                  }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={28}>
                  {topNightPerformers.map((entry, index) => (
                    <RechartsCell key={`cell-${index}`} fill={index === 0 ? '#0b5e9e' : '#4f46e5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Cell-wise Budget Consumption (Pie Chart) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800">সেল-ভিত্তিক বাজেট খরচ বিভাজন (Cell Budget)</h3>
        <div className="h-72 w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="h-56 w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
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
                  contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Custom Legend */}
          <div className="w-full md:w-1/2 overflow-y-auto max-h-56 space-y-2 text-xs">
            {cellBudget.map((item, idx) => (
              <div key={item.cellName} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-bold text-slate-700 truncate max-w-[120px]">{item.cellName}</span>
                </div>
                <span className="font-sans font-semibold text-slate-500">
                  ৳{toBanglaDigits(item.totalAllowance.toLocaleString())}/-
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Year-over-Year Leave Pattern (Line Chart) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800">বছর-ভিত্তিক ছুটির প্যাটার্ন তুলনা (Year-over-Year Leaves)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedLeaveData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                tickFormatter={(val) => toBanglaDigits(String(val))}
              />
              <Tooltip 
                formatter={(val) => [toBanglaDigits(String(val)), 'আবেদন সংখ্যা']}
                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
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
        </div>
      </div>

    </div>
  );
}
