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

interface TopPerformer {
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
  const [selectedDutyType, setSelectedDutyType] = useState('');
  const [cellsList, setCellsList] = useState<{ id: number; name: string }[]>([]);
  const [selectedCellId, setSelectedCellId] = useState('all');

  // Aggregated Data State
  const [allowanceTrend, setAllowanceTrend] = useState<AllowanceTrend[]>([]);
  const [personalAllowanceTrend, setPersonalAllowanceTrend] = useState<AllowanceTrend[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [cellBudget, setCellBudget] = useState<CellBudget[]>([]);
  const [leavePatterns, setLeavePatterns] = useState<LeavePattern[]>([]);
  const [billReleases, setBillReleases] = useState<any[]>([]);
  const [employeeBillCounts, setEmployeeBillCounts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [role, setRole] = useState('');

  // Double Check security redirect for client session
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
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
      queryParams.set('dutyType', selectedDutyType);
      if (selectedCellId && selectedCellId !== 'all') {
        queryParams.set('cellId', selectedCellId);
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
      setPersonalAllowanceTrend(data.personalAllowanceTrend || []);
      setTopPerformers(data.topPerformers || []);
      setCellBudget(data.cellBudget || []);
      setLeavePatterns(data.leavePatterns || []);
      setBillReleases(data.billReleases || []);
      setEmployeeBillCounts(data.employeeBillCounts || []);
      setSummary(data.summary || null);
      setRole(data.role || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'ডাটাবেজ সংযোগ ত্রুটি।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCells = async () => {
      if (currentUser && currentUser.role === 'ADMIN') {
        try {
          const res = await fetch('/api/cells');
          if (res.ok) {
            const data = await res.json();
            setCellsList(data);
          }
        } catch (e) {
          console.error('Error fetching cells for analytics filter:', e);
        }
      }
    };
    fetchCells();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadAnalytics();
    }
  }, [selectedMonth, selectedYear, selectedDutyType, selectedCellId, currentUser]);

  const clearFilters = () => {
    setSelectedMonth('');
    setSelectedYear('2026');
    setSelectedDutyType('');
    setSelectedCellId('all');
  };

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
            {role === 'EMPLOYEE' 
              ? 'আমার প্রাপ্ত ভাতা এবং সামগ্রিক বিল রিলিজ সংক্রান্ত পরিসংখ্যান ও গ্রাফিকাল চার্ট'
              : 'ভাতা খরচ, ডিউটি পারফর্মার এবং সেল-ভিত্তিক বাজেটের সামগ্রিক পরিসংখ্যান'}
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

      {/* KPI Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
          {/* Card 1: Total Released Bills */}
          <div className="bg-gradient-to-br from-white to-blue-50/20 rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">মোট রিলিজ হওয়া বিল</span>
              <p className="text-2xl font-black text-slate-800">{toBanglaDigits(summary.totalReleasedBills.toString())} টি</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0b5e9e] flex items-center justify-center text-xl">
              📊
            </div>
          </div>

          {/* Card 2: Total Duties Completed */}
          <div className="bg-gradient-to-br from-white to-indigo-50/20 rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">মোট ডিউটি সম্পন্ন</span>
              <p className="text-2xl font-black text-slate-800">{toBanglaDigits(summary.totalDutiesCompleted.toString())} টি</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
              ✅
            </div>
          </div>

          {/* Card 3: Personal Released Bills */}
          {summary.myBillCount > 0 && (
            <div className="bg-gradient-to-br from-white to-emerald-50/20 rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">আমার রিলিজ হওয়া বিল</span>
                <p className="text-2xl font-black text-slate-800">{toBanglaDigits(summary.myBillCount.toString())} টি</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                📄
              </div>
            </div>
          )}

          {/* Card 4: Personal Total Allowance Earnings */}
          {summary.myTotalEarnings > 0 && (
            <div className="bg-gradient-to-br from-white to-amber-50/20 rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">আমার মোট প্রাপ্ত ভাতা</span>
                <p className="text-2xl font-black text-slate-800">৳ {toBanglaDigits(summary.myTotalEarnings.toLocaleString())}/-</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
                ৳
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
          <Filter size={16} className="text-[#0b5e9e]" />
          <span>ডিউটি ও বিল ফিল্টারিং:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          
          {/* Cell Filter - Only shown for ADMIN role */}
          {currentUser?.role === 'ADMIN' && (
            <>
              <div className="flex items-center gap-2 animate-in fade-in">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-sans">সেল</label>
                <select
                  value={selectedCellId}
                  onChange={(e) => setSelectedCellId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#0b5e9e] font-sans bg-white"
                >
                  <option value="all">ওভারল (সব সেল)</option>
                  {cellsList.map((cell) => (
                    <option key={cell.id} value={String(cell.id)}>
                      {cell.name}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-slate-300 hidden sm:inline">|</span>
            </>
          )}

          {/* Duty Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase">ডিউটি ধরন</label>
            <select
              value={selectedDutyType}
              onChange={(e) => setSelectedDutyType(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#0b5e9e] font-sans bg-white animate-in fade-in"
            >
              <option value="">সিলেক্ট করুন</option>
              <option value="NIGHT_SHIFT">রাত্রীকালীন ডিউটি (Night Shift)</option>
              <option value="LATE_SITTING">লেট সিটিং (Late Sitting)</option>
              <option value="HOLIDAY">ছুটির দিন (Holiday)</option>
            </select>
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

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
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#0b5e9e] font-sans bg-white"
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
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#0b5e9e] font-sans bg-white"
              disabled={!!selectedMonth}
            >
              <option value="2026">২০২৬</option>
              <option value="2025">২০২৫</option>
              <option value="2024">২০২৪</option>
            </select>
          </div>

          {(selectedMonth || selectedYear !== '2026' || selectedDutyType !== '' || selectedCellId !== 'all') && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold rounded-xl border border-slate-200 cursor-pointer transition-all animate-in fade-in"
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
            <div className="min-h-[400px] w-full flex items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-[#0b5e9e] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400">ডাটা বিশ্লেষণ করা হচ্ছে...</p>
              </div>
            </div>
          ) : (
            <AnalyticsCharts 
              allowanceTrend={allowanceTrend}
              personalAllowanceTrend={personalAllowanceTrend}
              topPerformers={topPerformers}
              cellBudget={cellBudget}
              leavePatterns={leavePatterns}
              billReleases={billReleases}
              employeeBillCounts={employeeBillCounts}
              role={role}
            />
          )}
        </div>
      )}

    </div>
  );
}
