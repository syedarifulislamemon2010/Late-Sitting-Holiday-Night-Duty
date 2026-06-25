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
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';

// Dynamically import the charts component to disable Server-Side Rendering (SSR) for Recharts.
// This completely resolves hydration mismatch and SSR "window is not defined" warnings.
const AnalyticsCharts = dynamic(
  () => import('./components/AnalyticsCharts'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-[400px] w-full flex items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400 dark:text-slate-400">গ্রাফিক্যাল চার্ট লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }
);

interface AllowanceTrend {
  month: string;
  totalAllowance: number;
}

const DUTY_TYPE_OPTIONS = [
  { value: 'NIGHT_SHIFT', label: 'রাত্রীকালীন ডিউটি (Night Shift)' },
  { value: 'LATE_SITTING', label: 'লেট সিটিং (Late Sitting)' },
  { value: 'HOLIDAY', label: 'ছুটির দিন (Holiday)' },
];

const MONTH_OPTIONS_BASE = [
  { monthNum: '01', label: 'জানুয়ারি' },
  { monthNum: '02', label: 'ফেব্রুয়ারি' },
  { monthNum: '03', label: 'মার্চ' },
  { monthNum: '04', label: 'এপ্রিল' },
  { monthNum: '05', label: 'মে' },
  { monthNum: '06', label: 'জুন' },
  { monthNum: '07', label: 'জুলাই' },
  { monthNum: '08', label: 'আগস্ট' },
  { monthNum: '09', label: 'সেপ্টেম্বর' },
  { monthNum: '10', label: 'অক্টোবর' },
  { monthNum: '11', label: 'নভেম্বর' },
  { monthNum: '12', label: 'ডিসেম্বর' },
];

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

function MultiSelect({ options, selectedValues, onChange, placeholder = 'সিলেক্ট করুন' }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.multi-select-container')) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isOpen]);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const selectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  const displayLabel = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === options.length) return 'সবগুলো সিলেক্টেড';
    return options
      .filter(o => selectedValues.includes(o.value))
      .map(o => o.label)
      .join(', ');
  };

  return (
    <div className="relative multi-select-container font-sans select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-w-[130px] max-w-[200px] text-left cursor-pointer transition-all shadow-sm"
      >
        <span className="truncate pr-1">{displayLabel()}</span>
        <ChevronDown size={12} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-2 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          <div 
            onClick={selectAll}
            className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-900 mb-1 pb-2"
          >
            <input 
              type="checkbox" 
              checked={selectedValues.length === options.length}
              onChange={() => {}}
              className="accent-primary h-4 w-4 rounded-md border-slate-350 dark:border-slate-700" 
            />
            <span>সবগুলো (Select All)</span>
          </div>
          <div className="space-y-0.5">
            {options.map((opt) => {
              const isChecked = selectedValues.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  onClick={() => toggleOption(opt.value)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="accent-primary h-4 w-4 rounded-md border-slate-350 dark:border-slate-700"
                  />
                  <span className="truncate">{opt.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
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
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedDutyTypes, setSelectedDutyTypes] = useState<string[]>([]);

  const monthsOptions = MONTH_OPTIONS_BASE.map(m => ({
    value: `${selectedYear}-${m.monthNum}`,
    label: `${m.label} ${toBanglaDigits(selectedYear)}`
  }));
  const [cellsList, setCellsList] = useState<{ id: number; name: string }[]>([]);
  const [selectedCellId, setSelectedCellId] = useState('all');
  const [selectedReleaseDate, setSelectedReleaseDate] = useState('');
  const [availableReleaseDates, setAvailableReleaseDates] = useState<string[]>([]);
  const [resolvedReleaseDate, setResolvedReleaseDate] = useState('');

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
      if (selectedMonths.length > 0) {
        queryParams.set('month', selectedMonths.join(','));
      } else if (selectedYear) {
        queryParams.set('year', selectedYear);
      }
      if (selectedDutyTypes.length > 0) {
        queryParams.set('dutyType', selectedDutyTypes.join(','));
      }
      if (selectedCellId && selectedCellId !== 'all') {
        queryParams.set('cellId', selectedCellId);
      }
      if (selectedReleaseDate) {
        queryParams.set('releaseDate', selectedReleaseDate);
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
      setAvailableReleaseDates(data.availableReleaseDates || []);
      setResolvedReleaseDate(data.selectedReleaseDate || '');
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
  }, [selectedMonths.join(','), selectedYear, selectedDutyTypes.join(','), selectedCellId, selectedReleaseDate, currentUser]);

  const clearFilters = () => {
    setSelectedMonths([]);
    setSelectedYear('2026');
    setSelectedDutyTypes([]);
    setSelectedCellId('all');
    setSelectedReleaseDate('');
  };

  const formatBengaliDate = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const bnDay = toBanglaDigits(parseInt(d, 10).toString());
    const bnYear = toBanglaDigits(y);
    return `${bnDay}ই ${months[parseInt(m, 10) - 1]} ${bnYear}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart2 className="text-primary" size={24} />
            সিস্টেম অ্যানালিটিক্স ড্যাশবোর্ড
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {role === 'EMPLOYEE' 
              ? 'আমার প্রাপ্ত ভাতা এবং সামগ্রিক বিল রিলিজ সংক্রান্ত পরিসংখ্যান ও গ্রাফিকাল চার্ট'
              : 'ভাতা খরচ, ডিউটি পারফর্মার এবং সেল-ভিত্তিক বাজেটের সামগ্রিক পরিসংখ্যান'}
          </p>
        </div>
        
        <button 
          onClick={loadAnalytics}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          রিফ্রেশ করুন
        </button>
      </div>

      {/* KPI Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
          {/* Card 1: Total Released Bills */}
          <div className="bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/20 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">মোট রিলিজ হওয়া বিল</span>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{toBanglaDigits(summary.totalReleasedBills.toString())} টি</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-primary flex items-center justify-center text-xl">
              📊
            </div>
          </div>

          {/* Card 2: Total Duties Completed */}
          <div className="bg-gradient-to-br from-white to-indigo-50/20 dark:from-slate-900 dark:to-indigo-950/20 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">মোট ডিউটি সম্পন্ন</span>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{toBanglaDigits(summary.totalDutiesCompleted.toString())} টি</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl">
              ✅
            </div>
          </div>

          {/* Card 3: Personal Released Bills */}
          {summary.myBillCount > 0 && (
            <div className="bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">আমার রিলিজ হওয়া বিল</span>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{toBanglaDigits(summary.myBillCount.toString())} টি</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl">
                📄
              </div>
            </div>
          )}

          {/* Card 4: Personal Total Allowance Earnings */}
          {summary.myTotalEarnings > 0 && (
            <div className="bg-gradient-to-br from-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/20 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">আমার মোট প্রাপ্ত ভাতা</span>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">৳ {toBanglaDigits(summary.myTotalEarnings.toLocaleString())}/-</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
                ৳
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
          <Filter size={16} className="text-primary" />
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
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary font-sans bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                >
                  <option value="all">ওভারল (সব সেল)</option>
                  {cellsList.map((cell) => (
                    <option key={cell.id} value={String(cell.id)}>
                      {cell.name}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            </>
          )}

          {/* Duty Type Filter */}
          <div className="flex items-center gap-2 animate-in fade-in">
            <label className="text-[10px] text-slate-450 font-bold uppercase dark:text-slate-400">ডিউটি ধরন</label>
            <MultiSelect
              options={DUTY_TYPE_OPTIONS}
              selectedValues={selectedDutyTypes}
              onChange={setSelectedDutyTypes}
              placeholder="সিলেক্ট করুন"
            />
          </div>

          <span className="text-slate-355 dark:text-slate-700 hidden sm:inline">|</span>

          {/* Month Filter */}
          <div className="flex items-center gap-2 animate-in fade-in">
            <label className="text-[10px] text-slate-455 font-bold uppercase dark:text-slate-400">মাস</label>
            <MultiSelect
              options={monthsOptions}
              selectedValues={selectedMonths}
              onChange={setSelectedMonths}
              placeholder="সিলেক্ট করুন"
            />
          </div>

          <span className="text-slate-355 dark:text-slate-700 hidden sm:inline">|</span>

          {/* Year Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-450 font-bold uppercase dark:text-slate-400">বছর</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonths([]); // clear selected months when year changes
              }}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary font-sans bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="2026">২০২৬</option>
              <option value="2025">২০২৫</option>
              <option value="2024">২০২৪</option>
            </select>
          </div>

          <span className="text-slate-355 dark:text-slate-700 hidden sm:inline">|</span>

          {/* Bill Release Date Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-450 font-bold uppercase font-sans dark:text-slate-400">বিল ছাড়ার তারিখ</label>
            <select
              value={selectedReleaseDate}
              onChange={(e) => setSelectedReleaseDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary font-sans bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 animate-in fade-in cursor-pointer"
            >
              <option value="">সর্বশেষ তারিখ {resolvedReleaseDate ? `(${formatBengaliDate(resolvedReleaseDate)})` : ''}</option>
              {availableReleaseDates.map((date) => (
                <option key={date} value={date}>
                  {formatBengaliDate(date)}
                </option>
              ))}
              <option value="all">সকল তারিখের বিল (All Bills)</option>
            </select>
          </div>

          {(selectedMonths.length > 0 || selectedYear !== '2026' || selectedDutyTypes.length > 0 || selectedCellId !== 'all' || selectedReleaseDate !== '') && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-all animate-in fade-in"
            >
              রিসেট
            </button>
          )}

        </div>
      </div>

      {/* 3. Main Data Content Area */}
      {error ? (
        <div className="p-8 max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-red-100 dark:border-red-950/40 space-y-4 text-center mt-12">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">ডাটা লোড সমস্যা</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      ) : (
        <div className="min-h-[400px] relative z-10">
          {loading ? (
            <div className="min-h-[400px] w-full flex items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 dark:text-slate-400">ডাটা বিশ্লেষণ করা হচ্ছে...</p>
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
