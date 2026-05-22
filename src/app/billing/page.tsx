'use client';

import { useState, useEffect } from 'react';
import { 
  Printer, 
  ChevronLeft, 
  Calculator, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock,
  ShieldCheck,
  Award
} from 'lucide-react';

interface Cell {
  id: number;
  name: string;
  description: string | null;
}

interface Employee {
  id: number;
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  cellId: number;
  cell: Cell;
}

interface Duty {
  id: number;
  employeeId: number;
  employee: Employee;
  type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
  date: string;
  description: string | null;
  allowance1: number;
  allowance2: number;
  totalBill: number;
}

interface EmployeeBillingSummary {
  employeeId: number;
  name: string;
  designation: string;
  cellName: string;
  bankId: string | null;
  fileNo: string | null;
  lateDays: number;
  lateAllowance1: number; // Snacks (100)
  lateAllowance2: number; // Meal (200)
  holidayDays: number;
  holidayAllowance1: number; // Lunch (250)
  holidayAllowance2: number; // Snacks (250)
  nightDays: number;
  nightAllowance1: number; // Dinner (600)
  nightAllowance2: number; // Early Meal (400)
  grandTotal: number;
}

export default function BillingPage() {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });

  // Legal Print Form Configs
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [billMemo, setBillMemo] = useState('নথি নং: ডিউটি/আপ্যায়ন/২০২৬-২৭/০৮৯');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [preparedBy, setPreparedBy] = useState('জনাব শামীমা আক্তার');
  const [preparedDesignation, setPreparedDesignation] = useState('কম্পিউটার অপারেটর');
  const [verifiedBy, setVerifiedBy] = useState('জনাব চৌধুরী আশিকুর রহমান');
  const [verifiedDesignation, setVerifiedDesignation] = useState('সিনিয়র সহকারী সচিব');
  const [approvedBy, setApprovedBy] = useState('জনাব কে. এম. মোস্তফা কামাল');
  const [approvedDesignation] = useState('ডিজিএম/উপ-মহাব্যবস্থাপক'); // LOCKED TO DGM

  // Load Cells list
  useEffect(() => {
    async function loadCells() {
      try {
        const res = await fetch('/api/cells');
        const data = await res.json();
        setCells(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading cells:', err);
      }
    }
    loadCells();
  }, []);

  // Fetch duties based on selected month & filters
  async function fetchDutiesForBilling() {
    try {
      setLoading(true);
      const yearMonth = selectedMonth.split('-');
      const year = yearMonth[0];
      const month = yearMonth[1];
      
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      
      let queryUrl = `/api/duties?startDate=${startDate}&endDate=${endDate}`;
      if (selectedCell !== 'all') {
        queryUrl += `&cellId=${selectedCell}`;
      }
      
      const res = await fetch(queryUrl);
      const data = await res.json();
      setDuties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching duties for billing:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDutiesForBilling();
  }, [selectedMonth, selectedCell]);

  // Aggregate duties by employee for billing ledger
  const getBillingSummaries = (): EmployeeBillingSummary[] => {
    const map = new Map<number, EmployeeBillingSummary>();
    
    duties.forEach(duty => {
      const emp = duty.employee;
      if (!map.has(emp.id)) {
        map.set(emp.id, {
          employeeId: emp.id,
          name: emp.name,
          designation: emp.designation,
          cellName: emp.cell.name,
          bankId: emp.bankId,
          fileNo: emp.fileNo,
          lateDays: 0,
          lateAllowance1: 0,
          lateAllowance2: 0,
          holidayDays: 0,
          holidayAllowance1: 0,
          holidayAllowance2: 0,
          nightDays: 0,
          nightAllowance1: 0,
          nightAllowance2: 0,
          grandTotal: 0
        });
      }
      
      const summary = map.get(emp.id)!;
      
      if (duty.type === 'LATE_SITTING') {
        summary.lateDays++;
        summary.lateAllowance1 += duty.allowance1; // 100
        summary.lateAllowance2 += duty.allowance2; // 200
      } else if (duty.type === 'HOLIDAY') {
        summary.holidayDays++;
        summary.holidayAllowance1 += duty.allowance1; // 250
        summary.holidayAllowance2 += duty.allowance2; // 250
      } else if (duty.type === 'NIGHT_SHIFT') {
        summary.nightDays++;
        summary.nightAllowance1 += duty.allowance1; // 600
        summary.nightAllowance2 += duty.allowance2; // 400
      }
      
      summary.grandTotal += duty.totalBill;
    });
    
    return Array.from(map.values()).sort((a, b) => b.grandTotal - a.grandTotal);
  };

  const billingSummaries = getBillingSummaries();

  // Aggregate financial metrics
  const aggregateMetrics = () => {
    let totalLateSittingBill = 0;
    let totalLateAllowance1 = 0; // Snacks
    let totalLateAllowance2 = 0; // Meal
    let totalHolidayBill = 0;
    let totalHolidayAllowance1 = 0; // Lunch
    let totalHolidayAllowance2 = 0; // Snacks
    let totalNightBill = 0;
    let totalNightAllowance1 = 0; // Dinner
    let totalNightAllowance2 = 0; // Early Meal
    let grandTotal = 0;

    duties.forEach(d => {
      grandTotal += d.totalBill;
      if (d.type === 'LATE_SITTING') {
        totalLateSittingBill += d.totalBill;
        totalLateAllowance1 += d.allowance1;
        totalLateAllowance2 += d.allowance2;
      } else if (d.type === 'HOLIDAY') {
        totalHolidayBill += d.totalBill;
        totalHolidayAllowance1 += d.allowance1;
        totalHolidayAllowance2 += d.allowance2;
      } else if (d.type === 'NIGHT_SHIFT') {
        totalNightBill += d.totalBill;
        totalNightAllowance1 += d.allowance1;
        totalNightAllowance2 += d.allowance2;
      }
    });

    return {
      totalLateSittingBill,
      totalLateAllowance1,
      totalLateAllowance2,
      totalHolidayBill,
      totalHolidayAllowance1,
      totalHolidayAllowance2,
      totalNightBill,
      totalNightAllowance1,
      totalNightAllowance2,
      grandTotal
    };
  };

  const metrics = aggregateMetrics();

  // Convert Gregorian Month string to formal Bengali
  const getBanglaMonth = (dateStr: string) => {
    if (!dateStr) return '';
    const months = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const [year, month] = dateStr.split('-');
    const bnYear = parseInt(year, 10).toLocaleString('bn-BD', { useGrouping: false });
    const bnMonth = months[parseInt(month, 10) - 1];
    return `${bnMonth}, ${bnYear}`;
  };

  // Convert Date String to formal Bengali Date
  const getBanglaDate = (dateStr: string) => {
    if (!dateStr) return '';
    const months = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const [year, month, day] = dateStr.split('-');
    const bnDay = parseInt(day, 10).toLocaleString('bn-BD');
    const bnYear = parseInt(year, 10).toLocaleString('bn-BD', { useGrouping: false });
    const bnMonth = months[parseInt(month, 10) - 1];
    return `${bnDay} ${bnMonth} ${bnYear}`;
  };

  // Convert total number into Bengali Words for legal certification note
  const getBanglaNumberWords = (num: number) => {
    if (num === 0) return 'শূন্য';
    
    const singleWords = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
    const teenWords = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
    const doubleWords = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

    const convertTens = (n: number): string => {
      if (n < 10) return singleWords[n];
      if (n >= 10 && n < 20) return teenWords[n - 10];
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      return doubleWords[ten] + (unit > 0 ? ' ' + singleWords[unit] : '');
    };

    let wordStr = '';
    
    // Thousand portion
    if (num >= 1000) {
      const thousand = Math.floor(num / 1000);
      wordStr += convertTens(thousand) + ' হাজার ';
      num %= 1000;
    }
    
    // Hundred portion
    if (num >= 100) {
      const hundred = Math.floor(num / 100);
      wordStr += singleWords[hundred] + ' শত ';
      num %= 100;
    }
    
    // Tens portion
    if (num > 0) {
      wordStr += convertTens(num);
    }
    
    return wordStr.trim() + ' টাকা মাত্র';
  };

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------
          NORMAL VIEW MODE
      ---------------------------------------------------- */}
      {!isPrintMode ? (
        <>
          {/* Header Action Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-wide">আপ্যায়ন বিলিং লেজার</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">কর্মকর্তাদের ক্যাটাগরি ভিত্তিক ভাতার নিখুঁত হিসাব ও সরকারের লিগ্যাল সাইজ বিল নোট প্রস্তুতকরণ প্যানেল।</p>
            </div>
            
            <button
              onClick={() => setIsPrintMode(true)}
              disabled={duties.length === 0}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${duties.length > 0 ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white hover:opacity-95' : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'}`}
            >
              <Printer size={16} />
              বিল নোট (Legal Size) দেখুন ও প্রিন্ট করুন
            </button>
          </div>

          {/* Quick Filters Panel */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Calendar size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">বিলিং পিরিয়ড ও ফিল্টারসমূহ</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Select Cell Filter */}
              <select
                value={selectedCell}
                onChange={(e) => setSelectedCell(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
              >
                <option value="all">সকল সেল (All Cells)</option>
                {cells.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
              </select>

              {/* Month Picker */}
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none font-sans"
              />
            </div>
          </div>

          {loading ? (
            /* KPI Loading state */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
            </div>
          ) : (
            /* Detailed Allowance Cost KPI Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Metric 1: Late Sitting Allowance splits */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">লেট সিটিং বিল (Entertainment + Travel)</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">৳{metrics.totalLateSittingBill.toLocaleString('bn-BD')}</h3>
                  </div>
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-2 mt-4 space-y-0.5">
                  <p>• নাস্তা বরাদ্দ (৳১০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalLateAllowance1.toLocaleString('bn-BD')}</span></p>
                  <p>• যাতায়াত বরাদ্দ (৳২০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalLateAllowance2.toLocaleString('bn-BD')}</span></p>
                </div>
              </div>

              {/* Metric 2: Holiday Duty Allowance splits */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">হলিডে ডিউটি বিল (Entertainment + Travel)</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">৳{metrics.totalHolidayBill.toLocaleString('bn-BD')}</h3>
                  </div>
                  <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg">
                    <Award size={16} />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-2 mt-4 space-y-0.5">
                  <p>• দুপুরের খাবার (৳২৫০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalHolidayAllowance1.toLocaleString('bn-BD')}</span></p>
                  <p>• যাতায়াত বরাদ্দ (৳২৫০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalHolidayAllowance2.toLocaleString('bn-BD')}</span></p>
                </div>
              </div>

              {/* Metric 3: Night Shift Allowance splits */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">নাইট শিফট বিল (Dinner + Travel)</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">৳{metrics.totalNightBill.toLocaleString('bn-BD')}</h3>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-2 mt-4 space-y-0.5">
                  <p>• রাতের খাবার (৳৬০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalNightAllowance1.toLocaleString('bn-BD')}</span></p>
                  <p>• যাতায়াত বরাদ্দ (৳৪০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalNightAllowance2.toLocaleString('bn-BD')}</span></p>
                </div>
              </div>

              {/* Metric 4: Grand Total */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between bg-gradient-to-tr from-indigo-950/30 to-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">সর্বমোট আপ্যায়ন ব্যয়</p>
                    <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400 font-sans">৳{metrics.grandTotal.toLocaleString('bn-BD')}</h3>
                  </div>
                  <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm">
                    <DollarSign size={16} />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-4 flex items-center justify-between">
                  <span>নিখুঁত হিসাব সংকলন</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-500"><TrendingUp size={10} /> শতভাগ নির্ভুল</span>
                </div>
              </div>
            </div>
          )}

          {/* Aggregated Officers Ledger Table */}
          <div className="glass-card p-6 rounded-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">আপ্যায়ন বিলিং খতিয়ান (Monthly Billing Ledger)</h3>
              <p className="text-xs text-slate-400 mt-0.5">মাসিক মোট ডিউটির পরিমাণ ও খাত ভিত্তিক অর্থ প্রাপ্তির তালিকা।</p>
            </div>

            {loading ? (
              <div className="h-64 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-xl" />
            ) : billingSummaries.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
                <table className="w-full text-left text-xs leading-normal">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="px-5 py-3.5">কর্মকর্তার নাম ও পদবী</th>
                      <th className="px-5 py-3.5">সেল</th>
                      <th className="px-5 py-3.5 text-center">লেট সিটিং (দিন)</th>
                      <th className="px-5 py-3.5 text-center">হলিডে ডিউটি (দিন)</th>
                      <th className="px-5 py-3.5 text-center">নাইট শিফট (দিন)</th>
                      <th className="px-5 py-3.5 text-right">সর্বমোট প্রদেয়</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {billingSummaries.map((summary) => (
                      <tr key={summary.employeeId} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{summary.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal mt-0.5">{summary.designation}</p>
                          {(summary.bankId || summary.fileNo) && (
                            <p className="text-[9px] text-slate-400 font-normal mt-0.5 flex gap-2">
                              {summary.bankId && <span>ব্যাংক আইডি: {summary.bankId}</span>}
                              {summary.fileNo && <span>ফাইল নং: {summary.fileNo}</span>}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 font-sans text-[11px] font-bold text-slate-500">
                          {summary.cellName}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">{summary.lateDays}</span>
                          <span className="text-[9px] text-slate-400 font-sans block mt-0.5">৳{(summary.lateDays * 300).toLocaleString('bn-BD')}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">{summary.holidayDays}</span>
                          <span className="text-[9px] text-slate-400 font-sans block mt-0.5">৳{(summary.holidayDays * 500).toLocaleString('bn-BD')}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">{summary.nightDays}</span>
                          <span className="text-[9px] text-slate-400 font-sans block mt-0.5">৳{(summary.nightDays * 1000).toLocaleString('bn-BD')}</span>
                        </td>
                        <td className="px-5 py-4 text-right font-extrabold text-indigo-600 dark:text-indigo-400 text-sm font-sans">
                          ৳{summary.grandTotal.toLocaleString('bn-BD')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center max-w-sm mx-auto space-y-3">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                  <Calculator size={22} />
                </div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300">কোনো বিলিং ডাটা নেই</h4>
                <p className="text-[11px] text-slate-400">এই পিরিয়ডে কোনো ডিউটি পালিত না হওয়ায় কোনো আপ্যায়ন বিল হিসাব করা যায়নি।</p>
              </div>
            )}
          </div>
        </>
      ) : (
        // ----------------------------------------------------
        // GOVERNMENT PRINT MODE (বিল নোট / লিগ্যাল পেপার)
        // ----------------------------------------------------
        <div className="space-y-6">
          {/* Back Controls (No-print) */}
          <div className="no-print flex items-center justify-between glass-card p-4 rounded-2xl">
            <button
              onClick={() => setIsPrintMode(false)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ChevronLeft size={16} />
              ফিরে যান (লেজার ভিউ)
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-md"
              >
                <Printer size={14} />
                প্রিন্ট করুন (Legal Size)
              </button>
            </div>
          </div>

          {/* Print Options Configurator (No-print) */}
          <div className="no-print glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">বিল নোট কাস্টমাইজেশন</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">নথি নম্বর (Memo No)</label>
                <input
                  type="text"
                  value={billMemo}
                  onChange={(e) => setBillMemo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">বিল প্রস্তুতকারী</label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">বিল যাচাইকারী</label>
                <input
                  type="text"
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">বিল অনুমোদনকারী</label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">অনুমোদনকারী পদবী (লকড)</label>
                <input
                  type="text"
                  value={approvedDesignation}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs cursor-not-allowed text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Interactive Print Mock Sheet */}
          <div className="flex justify-center p-4 bg-slate-100/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-x-auto shadow-inner font-serif">
            {/* Renders exactly like Legal Page in Print Preview */}
            <div className="print-legal-layout w-[216mm] min-h-[356mm] bg-white border border-slate-200 text-black p-[20mm] shadow-xl flex flex-col justify-between" style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: '"Nikosh", "SolaimanLipi", "Noto Sans Bengali", serif' }}>
              
              <div className="space-y-6 flex-1">
                {/* Official Header */}
                <div className="text-center space-y-1.5 border-b border-black pb-4">
                  <h2 className="text-lg font-bold">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</h2>
                  <h3 className="text-sm font-semibold">ডিউটি পোর্টাল সদর দপ্তর, ঢাকা</h3>
                  <h4 className="text-xs font-semibold">প্রশাসনিক সেল (আপ্যায়ন বিলিং শাখা)</h4>
                  <p className="text-xs font-bold pt-2">{billMemo}</p>
                </div>

                {/* Sub title and description */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <p className="font-bold">বিষয়: অতিরিক্ত দায়িত্ব পালনের নিমিত্তে আপ্যায়ন বিল পরিশোধ বিবরণী।</p>
                    <p className="font-sans">তারিখ: {getBanglaDate(billDate)}</p>
                  </div>
                  <p className="text-justify leading-relaxed text-[11px]">
                    সদর দপ্তরে কর্মরত নিম্নবর্ণিত কর্মকর্তাবৃন্দ বিগত <span className="font-bold">{getBanglaMonth(selectedMonth)}</span> মাসে বিভিন্ন প্রশাসনিক ও জরুরি প্রয়োজনে নিয়মিত অফিস সময়ের অতিরিক্ত সময় দায়িত্ব (লেট সিটিং/ছুটির দিনের ডিউটি/রাত্রিকালীন শিফট) সুচারুরূপে পালন করেছেন। তাদের সপক্ষে দাবিকৃত আপ্যায়ন বিলের সংকলন ও পরিশোধ বিবরণী নিম্নে পেশ করা হলো:
                  </p>
                </div>

                {/* Main Legal Billing Table */}
                <table className="w-full border-collapse border border-black text-[10px] text-center">
                  <thead>
                    <tr className="bg-slate-100/60 font-bold border-b border-black text-[9.5px]">
                      <th className="border border-black p-1.5 w-[5%]">ক্রমিক</th>
                      <th className="border border-black p-1.5 text-left">কর্মকর্তার নাম ও পদবী</th>
                      <th className="border border-black p-1.5 w-[8%]">সেল</th>
                      <th className="border border-black p-1.5 w-[20%]">লেট সিটিং<br/>(দিন / ভাতা-১ / ভাতা-২)</th>
                      <th className="border border-black p-1.5 w-[20%]">সরকারি ছুটি<br/>(দিন / লাঞ্চ / নাস্তা)</th>
                      <th className="border border-black p-1.5 w-[20%]">নাইট শিফট<br/>(দিন / ডিনার / সেহরি)</th>
                      <th className="border border-black p-1.5 w-[12%]">সর্বমোট বিল</th>
                      <th className="border border-black p-1.5 w-[15%]">প্রাপ্তি স্বীকার স্বাক্ষর</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingSummaries.map((summary, index) => (
                      <tr key={summary.employeeId}>
                        <td className="border border-black p-1.5 font-sans">{(index + 1).toLocaleString('bn-BD')}</td>
                        <td className="border border-black p-1.5 text-left leading-tight">
                          <p className="font-bold text-slate-900">{summary.name}</p>
                          <p className="text-[8px] text-slate-700 font-semibold">{summary.designation}</p>
                          {summary.bankId && <p className="text-[7.5px] text-slate-600 font-semibold mt-0.5">ব্যাংক আইডি: {summary.bankId}</p>}
                          {summary.fileNo && <p className="text-[7.5px] text-slate-600 font-semibold mt-0.5">ফাইল নং: {summary.fileNo}</p>}
                        </td>
                        <td className="border border-black p-1.5 font-sans text-[9px] font-bold text-slate-700">{summary.cellName}</td>
                        
                        {/* Late sitting allocations */}
                        <td className="border border-black p-1.5 leading-tight">
                          <p className="font-bold font-sans">{summary.lateDays} দিন</p>
                          {summary.lateDays > 0 && (
                            <p className="text-[8px] text-slate-600 font-sans">
                              (নাস্তা: {summary.lateAllowance1} + যাতায়াত: {summary.lateAllowance2})
                            </p>
                          )}
                        </td>

                        {/* Holiday Duty allocations */}
                        <td className="border border-black p-1.5 leading-tight">
                          <p className="font-bold font-sans">{summary.holidayDays} দিন</p>
                          {summary.holidayDays > 0 && (
                            <p className="text-[8px] text-slate-600 font-sans">
                              (খাবার: {summary.holidayAllowance1} + যাতায়াত: {summary.holidayAllowance2})
                            </p>
                          )}
                        </td>

                        {/* Night Shift allocations */}
                        <td className="border border-black p-1.5 leading-tight">
                          <p className="font-bold font-sans">{summary.nightDays} দিন</p>
                          {summary.nightDays > 0 && (
                            <p className="text-[8px] text-slate-600 font-sans">
                              (রাতের খাবার: {summary.nightAllowance1} + যাতায়াত: {summary.nightAllowance2})
                            </p>
                          )}
                        </td>

                        {/* Total Bill */}
                        <td className="border border-black p-1.5 font-bold font-sans">
                          ৳{summary.grandTotal.toLocaleString('bn-BD')}
                        </td>
                        
                        {/* Signature placeholder */}
                        <td className="border border-black p-1.5"></td>
                      </tr>
                    ))}
                    
                    {/* Bottom Grand Total Line */}
                    <tr className="font-bold bg-slate-100/60">
                      <td className="border border-black p-1.5 text-right text-[9.5px]" colSpan={3}>সর্বমোট সংকলিত দাবি:</td>
                      <td className="border border-black p-1.5 font-sans">৳{metrics.totalLateSittingBill.toLocaleString('bn-BD')}</td>
                      <td className="border border-black p-1.5 font-sans">৳{metrics.totalHolidayBill.toLocaleString('bn-BD')}</td>
                      <td className="border border-black p-1.5 font-sans">৳{metrics.totalNightBill.toLocaleString('bn-BD')}</td>
                      <td className="border border-black p-1.5 font-sans" colSpan={2}>৳{metrics.grandTotal.toLocaleString('bn-BD')}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Official Certification Notes */}
                <div className="space-y-3 pt-6 border-t border-black text-xs leading-relaxed">
                  <p className="font-semibold underline">প্রত্যয়নপত্র ও সার্টিফিকেট (Official Certifications):</p>
                  
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-justify">
                    <li>১. প্রত্যয়ন করা যাচ্ছে যে, উপরোক্ত বিবরণী ও বিলে দাবিকৃত টাকা ইতিপূর্বে কোষাগার থেকে উত্তোলন করা হয়নি এবং পরিশোধ করা হয়নি।</li>
                    <li>২. সংশ্লিষ্ট কর্মকর্তা/কর্মচারীগণ প্রকৃতপক্ষে অর্পিত অতিরিক্ত ও জরুরি দায়িত্ব স্ব-স্ব স্থানে অর্পিত নিয়ম অনুযায়ী যথাযথভাবে সম্পন্ন করেছেন।</li>
                    <li>৩. উক্ত আপ্যায়ন বিলের বিপরীতে মোট ব্যয় <span className="font-bold">৳{metrics.grandTotal.toLocaleString('bn-BD')} ({getBanglaNumberWords(metrics.grandTotal)})</span> সরকারি বিধি অনুযায়ী নিয়মিত তহবিলের বাজেট বরাদ্দ থেকে পরিশোধ করার জন্য সুপারিশ করা হলো।</li>
                  </ul>
                </div>
              </div>

              {/* Signatures Panel */}
              <div className="flex justify-between items-start pt-16 text-center text-[10px] no-break-inside">
                <div className="w-[30%] space-y-1">
                  <div className="h-10" />
                  <p className="border-t border-black pt-1">({preparedBy})</p>
                  <p>{preparedDesignation}</p>
                  <p className="text-slate-600">বিল প্রস্তুতকারী</p>
                </div>

                <div className="w-[30%] space-y-1">
                  <div className="h-10" />
                  <p className="border-t border-black pt-1">({verifiedBy})</p>
                  <p>{verifiedDesignation}</p>
                  <p className="text-slate-600">যাচাইকারী কর্মকর্তা / সেল প্রধান</p>
                </div>

                <div className="w-[30%] space-y-1">
                  <div className="h-10" />
                  <p className="border-t border-black pt-1">({approvedBy})</p>
                  <p>{approvedDesignation}</p>
                  <p className="text-slate-600">মঞ্জুরি ও অনুমোদনকারী কর্তৃপক্ষ</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
