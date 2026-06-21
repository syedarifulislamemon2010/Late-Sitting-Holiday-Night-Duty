'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  BarChart2, 
  TrendingUp, 
  Filter, 
  Calendar, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';

// Dynamically import the charts component to disable Server-Side Rendering (SSR) for Recharts.
// This completely resolves hydration mismatch and SSR "window is not defined" warnings.
const AnalyticsCharts = dynamic(
  () => import('./components/AnalyticsCharts'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-[400px] w-full flex items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0b5e9e] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400">গ্রাফিক্যাল চার্ট লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }
);

interface AllowanceTrend {
  month: string;
  totalAllowance: number;
}

interface TopNightPerformer {
  employeeId: number;
  employeeName: string;
  designation: string;
  count: number;
}

interface CellBudget {
  cellId: number;
  cellName: string;
  totalAllowance: number;
}

interface LeavePattern {
  year: string;
  month: string;
  count: number;
}

export default function AnalyticsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Aggregated Data State
  const [allowanceTrend, setAllowanceTrend] = useState<AllowanceTrend[]>([]);
  const [topNightPerformers, setTopNightPerformers] = useState<TopNightPerformer[]>([]);
  const [cellBudget, setCellBudget] = useState<CellBudget[]>([]);
  const [leavePatterns, setLeavePatterns] = useState<LeavePattern[]>([]);

  // Double Check security redirect for client session
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        if (parsed.role === 'EMPLOYEE') {
          window.location.href = '/my-portal';
        }
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      if (selectedMonth) {
        queryParams.set('month', selectedMonth);
      } else if (selectedYear) {
        queryParams.set('year', selectedYear);
      }

      const res = await fetch(`/api/analytics?${queryParams.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('অননুমোদিত প্রবেশ! আপনার এই অ্যানালিটিক্স দেখার ক্ষমতা নেই।');
        }
        throw new Error('অ্যানালিটিক্স ডাটা লোড করতে ব্যর্থ হয়েছে');
      }
      
      const data = await res.json();
      setAllowanceTrend(data.allowanceTrend || []);
      setTopNightPerformers(data.topNightPerformers || []);
      setCellBudget(data.cellBudget || []);
      setLeavePatterns(data.leavePatterns || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'ডাটাবেজ সংযোগ ত্রুটি।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load if user is not employee
    if (currentUser?.role !== 'EMPLOYEE') {
      loadAnalytics();
    }
  }, [selectedMonth, selectedYear, currentUser]);

  const clearFilters = () => {
    setSelectedMonth('');
    setSelectedYear('2026');
  };

  if (currentUser?.role === 'EMPLOYEE') {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0b5e9e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <BarChart2 className="text-[#0b5e9e]" size={24} />
            সিস্টেম অ্যানালিটিক্স ড্যাশবোর্ড
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            ভাতা খরচ, নাইট ডিউটি পারফর্মার এবং সেল-ভিত্তিক বাজেটের সামগ্রিক পরিসংখ্যান
          </p>
        </div>
        
        <button 
          onClick={loadAnalytics}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 border border-slate-200"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          রিফ্রেশ করুন
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
          <Filter size={16} className="text-[#0b5e9e]" />
          <span>নাইট ডিউটি ফিল্টারিং:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          
          {/* Month Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase">মাস</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                if (e.target.value) setSelectedYear(''); // clear year if month is picked
              }}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#0b5e9e] font-sans"
            />
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* Year Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase">বছর</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                if (e.target.value) setSelectedMonth(''); // clear month if year is picked
              }}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#0b5e9e] font-sans"
              disabled={!!selectedMonth}
            >
              <option value="2026">২০২৬</option>
              <option value="2025">২০২৫</option>
              <option value="2024">২০২৪</option>
            </select>
          </div>

          {(selectedMonth || selectedYear !== '2026') && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold rounded-xl border border-slate-200 cursor-pointer transition-all"
            >
              রিসেট
            </button>
          )}

        </div>
      </div>

      {/* 3. Main Data Content Area */}
      {error ? (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl shadow-md border border-red-100 space-y-4 text-center mt-12">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">ডাটা লোড সমস্যা</h2>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      ) : (
        <div className="min-h-[400px]">
          {loading ? (
            <div className="min-h-[400px] w-full flex items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-[#0b5e9e] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400">ডাটা বিশ্লেষণ করা হচ্ছে...</p>
              </div>
            </div>
          ) : (
            <AnalyticsCharts 
              allowanceTrend={allowanceTrend}
              topNightPerformers={topNightPerformers}
              cellBudget={cellBudget}
              leavePatterns={leavePatterns}
            />
          )}
        </div>
      )}

    </div>
  );
}
