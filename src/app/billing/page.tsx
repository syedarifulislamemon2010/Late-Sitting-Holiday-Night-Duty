'use client';

import React, { useState, useEffect } from 'react';
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
  const [billMemo, setBillMemo] = useState('স্মারক নং: ৪৬.০২.০০০০.০০১.১৯.০০২.২৬-১৫৪');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [preparedBy, setPreparedBy] = useState('জনাব শামীমা আক্তার');
  const [preparedDesignation, setPreparedDesignation] = useState('কম্পিউটার অপারেটর');
  const [verifiedBy, setVerifiedBy] = useState('জনাব চৌধুরী আশিকুর রহমান');
  const [verifiedDesignation, setVerifiedDesignation] = useState('সিনিয়র সহকারী সচিব');
  const [approvedBy, setApprovedBy] = useState('জনাব কে. এম. মোস্তফা কামাল');
  const [approvedDesignation] = useState('ডিজিএম/উপ-মহাব্যবস্থাপক'); // LOCKED TO DGM
  
  // Janata Bank Specific Configs
  const [subjectText, setSubjectText] = useState('যাতায়াত ও আপ্যায়ন ভাতা প্রদান প্রসঙ্গে।');
  const [representativeName, setRepresentativeName] = useState('জনাব শাহনেওয়াজ মাহমুদ');
  const [representativeDesignation, setRepresentativeDesignation] = useState('এসও-আইটি');
  const [openingParagraph, setOpeningParagraph] = useState('কর্তৃপক্ষের নির্দেশক্রমে Online Banking Software T-24 বাস্তবায়ন ও উক্ত Software দ্বারা পরিচালিত শাখা সমূহে অপারেশনাল সহায়তা প্রদানের নিমিত্তে অত্র ডিপার্টমেন্টের নিম্নবর্ণিত কর্মকর্তাগণ তাদের নামের পার্শ্বে বর্ণিত তারিখে ছুটির দিনে অফিসে অবস্থান করেছেন। উল্লেখ্য, গত ০৪/০৯/২০১৪ ইং তারিখে অনুষ্ঠিত বোর্ড অব ডিরেক্টরস এর ৩৩৪ তম সভার সিদ্ধান্ত "ঙ" মোতাবেক আইটি কার্যক্রম ২৪ ঘণ্টা নিরবচ্ছিন্ন রাখার ক্ষেত্রে ছুটির দিনে দায়িত্ব পালনকারী নির্বাহী/কর্মকর্তাদের অনুকূলে ৫০০/- (যাতায়াত- ২৫০/-+আপ্যায়ন-২৫০/-) হারে ভাতা প্রদান অনুমোদিত আছে। নিম্নে বর্ণিত নির্বাহী/কর্মকর্তাদের অনুকূলে যাতায়াত ও আপ্যায়ন ভাতা বাবদ খরচ উল্লেখ করা হলো:');

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

  // Convert English digits/text to Bengali digits
  const toBanglaDigits = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) return '';
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/[0-9]/g, (w) => bnDigits[parseInt(w, 10)]);
  };

  // Convert Gregorian Month string to formal Bengali
  const getBanglaMonth = (dateStr: string) => {
    if (!dateStr) return '';
    const months = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const [year, month] = dateStr.split('-');
    const bnYear = toBanglaDigits(parseInt(year, 10));
    const bnMonth = months[parseInt(month, 10) - 1];
    return `${bnMonth}, ${bnYear}`;
  };

  // Convert Date String to formal Bengali Date (e.g. ২৩-০৫-২০২৬)
  const getBanglaDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const bnDay = toBanglaDigits(parseInt(day, 10).toString().padStart(2, '0'));
    const bnMonth = toBanglaDigits(parseInt(month, 10).toString().padStart(2, '0'));
    const bnYear = toBanglaDigits(year);
    return `${bnDay}-${bnMonth}-${bnYear}`;
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
    
    // Lac portion
    if (num >= 100000) {
      const lac = Math.floor(num / 100000);
      wordStr += convertTens(lac) + ' লক্ষ ';
      num %= 100000;
    }

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

  // Helper to extract sorted dates for an employee
  const getEmployeeDuties = (employeeId: number) => {
    return duties.filter(d => d.employeeId === employeeId);
  };

  // Helper to format worked dates nicely (compact, comma separated, with total days)
  const formatWorkedDates = (empDuties: Duty[]) => {
    if (empDuties.length === 0) return '';
    const sorted = [...empDuties].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const formattedDates = sorted.map(d => {
      const [year, month, day] = d.date.split('-');
      const bnDay = toBanglaDigits(parseInt(day, 10).toString().padStart(2, '0'));
      const bnMonth = toBanglaDigits(parseInt(month, 10).toString().padStart(2, '0'));
      return `${bnDay}-${bnMonth}`;
    });
    
    const bnTotalDays = toBanglaDigits(empDuties.length);
    return `${formattedDates.join(', ')} (মোট: ${bnTotalDays} দিন)`;
  };

  // Helper to calculate cell-wise totals for a list of summaries
  const getCellTotals = (summaries: EmployeeBillingSummary[]) => {
    const lateDays = summaries.reduce((sum, s) => sum + s.lateDays, 0);
    const holidayDays = summaries.reduce((sum, s) => sum + s.holidayDays, 0);
    const nightDays = summaries.reduce((sum, s) => sum + s.nightDays, 0);
    
    const transport = summaries.reduce((sum, s) => sum + (s.lateDays * 200 + s.holidayDays * 250 + s.nightDays * 400), 0);
    const apyaon = summaries.reduce((sum, s) => sum + (s.lateDays * 100 + s.holidayDays * 250 + s.nightDays * 600), 0);
    const total = summaries.reduce((sum, s) => sum + s.grandTotal, 0);

    return {
      lateDays,
      holidayDays,
      nightDays,
      transport,
      apyaon,
      total
    };
  };

  // Transport calculation formula builder
  const getTransportFormula = (summary: EmployeeBillingSummary) => {
    const parts: string[] = [];
    if (summary.lateDays > 0) {
      parts.push(`২০০x${toBanglaDigits(summary.lateDays)}`);
    }
    if (summary.holidayDays > 0) {
      parts.push(`২৫০x${toBanglaDigits(summary.holidayDays)}`);
    }
    if (summary.nightDays > 0) {
      parts.push(`৪০০x${toBanglaDigits(summary.nightDays)}`);
    }
    
    const totalTransport = (summary.lateDays * 200) + (summary.holidayDays * 250) + (summary.nightDays * 400);
    const bnTotal = toBanglaDigits(totalTransport);
    
    if (parts.length === 0) return '০/-';
    return `(${parts.join(' + ')}) = ${bnTotal}/-`;
  };

  // Apyaon calculation formula builder
  const getApyaonFormula = (summary: EmployeeBillingSummary) => {
    const parts: string[] = [];
    if (summary.lateDays > 0) {
      parts.push(`১০০x${toBanglaDigits(summary.lateDays)}`);
    }
    if (summary.holidayDays > 0) {
      parts.push(`২৫০x${toBanglaDigits(summary.holidayDays)}`);
    }
    if (summary.nightDays > 0) {
      parts.push(`৬০০x${toBanglaDigits(summary.nightDays)}`);
    }
    
    const totalApyaon = (summary.lateDays * 100) + (summary.holidayDays * 250) + (summary.nightDays * 600);
    const bnTotal = toBanglaDigits(totalApyaon);
    
    if (parts.length === 0) return '০/-';
    return `(${parts.join(' + ')}) = ${bnTotal}/-`;
  };

  // Group billingSummaries by cell name
  const groupedSummaries: { [cellName: string]: EmployeeBillingSummary[] } = {};
  billingSummaries.forEach(s => {
    if (!groupedSummaries[s.cellName]) {
      groupedSummaries[s.cellName] = [];
    }
    groupedSummaries[s.cellName].push(s);
  });

  const totalTransportAll = billingSummaries.reduce((sum, s) => sum + (s.lateDays * 200 + s.holidayDays * 250 + s.nightDays * 400), 0);
  const totalApyaonAll = billingSummaries.reduce((sum, s) => sum + (s.lateDays * 100 + s.holidayDays * 250 + s.nightDays * 600), 0);

  // Dynamic scaling parameters based on billing summaries count to ensure exactly 1 legal page printout
  const summariesCount = billingSummaries.length;
  let printFontSize = 'text-[11px]';
  let printTableFontSize = 'text-[9.5px]';
  let printTablePadding = 'p-1.5';
  let printHeaderSpacing = 'space-y-1.5';
  let printHeaderPadding = 'pb-3';
  let printBodySpacing = 'space-y-4';
  let printTitleSpacing = 'space-y-1.5';
  let printParaSpacing = 'leading-relaxed text-[11px]';
  let printCertSpacing = 'space-y-1.5 mt-5 pt-3';
  let printCertPadding = 'pl-4';
  let printSigSpacing = 'pt-16';
  let printTableHeadingSize = 'text-[9.5px]';
  let printRowTextSize = 'text-[8.5px]';
  let printSubRowTextSize = 'text-[7.5px]';
  let printLogoSize = 'w-10 h-10';

  if (summariesCount > 12) {
    printFontSize = 'text-[8px]';
    printTableFontSize = 'text-[7px]';
    printTablePadding = 'p-0.5';
    printHeaderSpacing = 'space-y-0.5';
    printHeaderPadding = 'pb-1';
    printBodySpacing = 'space-y-1';
    printTitleSpacing = 'space-y-0.5';
    printParaSpacing = 'leading-tight text-[8px]';
    printCertSpacing = 'space-y-0.5 mt-1 pt-1';
    printCertPadding = 'pl-2';
    printSigSpacing = 'pt-2';
    printTableHeadingSize = 'text-[7px]';
    printRowTextSize = 'text-[7px]';
    printSubRowTextSize = 'text-[6px]';
    printLogoSize = 'w-7 h-7';
  } else if (summariesCount > 7) {
    printFontSize = 'text-[9.5px]';
    printTableFontSize = 'text-[8px]';
    printTablePadding = 'p-1';
    printHeaderSpacing = 'space-y-1';
    printHeaderPadding = 'pb-2';
    printBodySpacing = 'space-y-2';
    printTitleSpacing = 'space-y-1';
    printParaSpacing = 'leading-relaxed text-[9px]';
    printCertSpacing = 'space-y-1 mt-3 pt-2';
    printCertPadding = 'pl-3';
    printSigSpacing = 'pt-6';
    printTableHeadingSize = 'text-[8px]';
    printRowTextSize = 'text-[7.5px]';
    printSubRowTextSize = 'text-[7px]';
    printLogoSize = 'w-8 h-8';
  }

  // Running serial index for printing
  let globalPrintIndex = 0;

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
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">কর্মকর্তাদের ক্যাটাগরি ভিত্তিক ভাতার নিখুঁত হিসাব ও জনতা ব্যাংক পিএলসি. এর লিগ্যাল সাইজ বিল মেমো প্রস্তুতকরণ প্যানেল।</p>
            </div>
            
            <button
              onClick={() => setIsPrintMode(true)}
              disabled={duties.length === 0}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${duties.length > 0 ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white hover:opacity-95' : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'}`}
            >
              <Printer size={16} />
              বিল মেমো (Legal Size) দেখুন ও প্রিন্ট করুন
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

          {/* Aggregated Officers Ledger Table Grouped By Cell */}
          <div className="glass-card p-6 rounded-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">আপ্যায়ন বিলিং খতিয়ান (Monthly Billing Ledger)</h3>
              <p className="text-xs text-slate-400 mt-0.5">সেল ভিত্তিক কর্মকর্তাদের মাসিক মোট ডিউটির পরিমাণ ও খাত ভিত্তিক অর্থ প্রাপ্তির তালিকা।</p>
            </div>

            {loading ? (
              <div className="h-64 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-xl" />
            ) : Object.keys(groupedSummaries).length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
                <table className="w-full text-left text-xs leading-normal">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="px-5 py-3.5">কর্মকর্তার নাম ও পদবী</th>
                      <th className="px-5 py-3.5">ব্যাংক আইডি / ফাইল নং</th>
                      <th className="px-5 py-3.5 text-center">লেট সিটিং (দিন)</th>
                      <th className="px-5 py-3.5 text-center">হলিডে ডিউটি (দিন)</th>
                      <th className="px-5 py-3.5 text-center">নাইট শিফট (দিন)</th>
                      <th className="px-5 py-3.5 text-right">সর্বমোট প্রদেয়</th>
                    </tr>
                  </thead>
                  
                  {Object.entries(groupedSummaries).map(([cellName, summaries]) => {
                    const cellTotals = getCellTotals(summaries);
                    return (
                      <tbody key={cellName} className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium border-b-2 border-slate-100 dark:border-slate-800/60 last:border-b-0">
                        {/* Cell Category Row Header */}
                        <tr className="bg-indigo-50/30 dark:bg-indigo-950/20 font-bold border-y border-slate-100 dark:border-slate-800">
                          <td colSpan={6} className="px-5 py-3 text-indigo-700 dark:text-indigo-400 font-sans tracking-wide text-xs">
                            {cellName}
                          </td>
                        </tr>

                        {/* Employee Rows inside this Cell */}
                        {summaries.map((summary) => (
                          <tr key={summary.employeeId} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-800 dark:text-slate-200">{summary.name}</p>
                              <p className="text-[10px] text-slate-400 font-normal mt-0.5">{summary.designation}</p>
                            </td>
                            <td className="px-5 py-4 font-sans text-slate-500 font-semibold">
                              {summary.bankId && <p>আইডি: {summary.bankId}</p>}
                              {summary.fileNo && <p>ফাইল: {summary.fileNo}</p>}
                              {!summary.bankId && !summary.fileNo && <p className="text-slate-300 dark:text-slate-700">-</p>}
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

                        {/* Cell Subtotal Row */}
                        <tr className="bg-slate-50/50 dark:bg-slate-900/40 font-bold text-slate-700 dark:text-slate-300">
                          <td colSpan={2} className="px-5 py-3 text-right">
                            {cellName} উপ-মোট:
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="font-sans">{cellTotals.lateDays} দিন</span>
                            <span className="text-[9px] text-slate-400 font-sans block mt-0.5">৳{(cellTotals.lateDays * 300).toLocaleString('bn-BD')}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="font-sans">{cellTotals.holidayDays} দিন</span>
                            <span className="text-[9px] text-slate-400 font-sans block mt-0.5">৳{(cellTotals.holidayDays * 500).toLocaleString('bn-BD')}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="font-sans">{cellTotals.nightDays} দিন</span>
                            <span className="text-[9px] text-slate-400 font-sans block mt-0.5">৳{(cellTotals.nightDays * 1000).toLocaleString('bn-BD')}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm font-sans">
                            ৳{cellTotals.total.toLocaleString('bn-BD')}
                          </td>
                        </tr>
                      </tbody>
                    );
                  })}
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
        // JANATA BANK PLC PRINT MODE (লিগ্যাল সাইজ মেমো বিবরণী)
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
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-md animate-pulse"
              >
                <Printer size={14} />
                মেমো প্রিন্ট করুন (Legal Size)
              </button>
            </div>
          </div>

          {/* Interactive Print Options Configurator (No-print) */}
          <div className="no-print glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-500 text-base">বিল মেমো কাস্টমাইজেশন ও প্রফেশনাল কন্ট্রোল প্যানেল</h3>
            
            <div className="space-y-4">
              {/* Row 1: Document Metadata & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">নথি নম্বর (Memo No)</label>
                  <input
                    type="text"
                    value={billMemo}
                    onChange={(e) => setBillMemo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">মেমো তারিখ (Memo Date)</label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">বিষয় (Memo Subject)</label>
                  <input
                    type="text"
                    value={subjectText}
                    onChange={(e) => setSubjectText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              {/* Row 2: Payees & Representatives */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">তহবিল সংগ্রহকারী প্রতিনিধি কর্মকর্তা (Payee Representative)</label>
                  <input
                    type="text"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">প্রতিনিধির পদবী (Representative Designation)</label>
                  <input
                    type="text"
                    value={representativeDesignation}
                    onChange={(e) => setRepresentativeDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              {/* Row 3: Board Resolution Paragraph */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">১ম অনুচ্ছেদ (বোর্ড অব ডিরেক্টরস এর অনুমোদন সংক্রান্ত প্রারম্ভিক প্যারাগ্রাফ)</label>
                <textarea
                  rows={4}
                  value={openingParagraph}
                  onChange={(e) => setOpeningParagraph(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:outline-none focus:border-indigo-500 leading-relaxed font-semibold"
                />
              </div>

              {/* Row 4: Administrative Officers */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">বিল প্রস্তুতকারী</label>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">প্রস্তুতকারীর পদবী</label>
                  <input
                    type="text"
                    value={preparedDesignation}
                    onChange={(e) => setPreparedDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">বিল যাচাইকারী</label>
                  <input
                    type="text"
                    value={verifiedBy}
                    onChange={(e) => setVerifiedBy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">যাচাইকারীর পদবী</label>
                  <input
                    type="text"
                    value={verifiedDesignation}
                    onChange={(e) => setVerifiedDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">অনুমোদনকারী (ডিজিএম)</label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:outline-none font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Print Mock Sheet */}
          <div className="flex justify-center p-4 bg-slate-100/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-x-auto shadow-inner">
            {/* Renders exactly like Legal Page in Print Preview with requested margins */}
            <div className="print-legal-layout w-[216mm] h-[356mm] bg-white border border-slate-200 text-black shadow-xl flex flex-col justify-between overflow-hidden relative" style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: '"Nikosh", "SolaimanLipi", "Noto Sans Bengali", serif', paddingTop: '0.75in', paddingRight: '0.5in', paddingBottom: '0.5in', paddingLeft: '1.75in', boxSizing: 'border-box' }}>
              
              {/* Official Header */}
              <div className="w-full flex flex-col items-end text-right justify-start space-y-1 pr-1 border-b border-black pb-2">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <svg viewBox="0 0 60 60" className={`${printLogoSize} text-[#00bcd4]`}>
                    <rect x="3" y="3" width="54" height="54" rx="14" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path d="M18 16 C18 40, 26 44, 30 44 C34 44, 42 40, 42 16" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M24 16 C24 34, 28 38, 30 38 C32 38, 36 34, 36 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="30" y1="8" x2="30" y2="52" stroke="currentColor" strokeWidth="3.5" />
                    <path d="M30 16 C38 16, 42 20, 42 26 C42 32, 38 34, 30 34" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M30 34 C38 34, 42 38, 42 44 C42 50, 38 50, 30 50" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                  </svg>
                  <div className="text-left font-serif leading-none">
                    <h2 className="text-sm font-extrabold tracking-tight">জনতা ব্যাংক পিএলসি.</h2>
                    <p className="text-[7.5px] font-semibold text-slate-800">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
                  </div>
                </div>
                
                <div className="w-full flex justify-between items-end text-[10px] pt-1 font-serif">
                  <span className="font-semibold text-[9.5px]">{billMemo}</span>
                  <span className="font-semibold border-b border-black pb-0.5">তারিখ: {getBanglaDate(billDate)}</span>
                </div>
              </div>

              {/* Title and Main Body */}
              <div className={`flex-1 flex flex-col justify-between ${printBodySpacing} ${printFontSize} mt-3`}>
                <div>
                  <h2 className="text-left text-[12.5px] font-extrabold underline decoration-black">
                    বিষয়: {subjectText}
                  </h2>
                  
                  <div className="space-y-2 mt-2.5">
                    <p className={`text-justify leading-relaxed text-slate-900 ${printParaSpacing}`}>
                      {openingParagraph}
                    </p>
                  </div>

                  {/* Redesigned Printed Legal Billing Table */}
                  <table className={`w-full border-collapse border border-black text-center mt-3.5 ${printTableFontSize}`}>
                    <thead>
                      <tr className={`bg-slate-50 font-bold border-b border-black ${printTableHeadingSize}`}>
                        <th className={`border border-black ${printTablePadding} w-[6%] text-center`}>ক্রমিক নং</th>
                        <th className={`border border-black ${printTablePadding} text-left pl-2`}>নাম ও পদবী</th>
                        <th className={`border border-black ${printTablePadding} text-center w-[25%]`}>দায়িত্ব পালনের তারিখ</th>
                        <th className={`border border-black ${printTablePadding} text-center w-[23%]`}>যাতায়াত ভাতা</th>
                        <th className={`border border-black ${printTablePadding} text-center w-[23%]`}>আপ্যায়ন ভাতা</th>
                        <th className={`border border-black ${printTablePadding} text-right pr-2 w-[13%]`}>মোট প্রদেয়</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(groupedSummaries).map(([cellName, summaries]) => {
                        const cellTotals = getCellTotals(summaries);
                        return (
                          <React.Fragment key={cellName}>
                            {/* Cell Group Header inside the Table */}
                            <tr className="bg-slate-100 font-bold border-y border-black text-left">
                              <td colSpan={6} className={`${printTablePadding} font-extrabold text-[9px] pl-2 bg-slate-100`}>
                                সেল: {cellName}
                              </td>
                            </tr>

                            {/* Officers in this cell */}
                            {summaries.map((summary) => {
                              globalPrintIndex++;
                              const empDuties = getEmployeeDuties(summary.employeeId);
                              return (
                                <tr key={summary.employeeId} className={`${printRowTextSize} hover:bg-slate-50/40 text-black`}>
                                  <td className={`border border-black ${printTablePadding} font-serif text-center`}>
                                    {toBanglaDigits(globalPrintIndex)}
                                  </td>
                                  <td className={`border border-black ${printTablePadding} text-left pl-2 leading-tight`}>
                                    <p className="font-extrabold">{summary.name}</p>
                                    <p className={`${printSubRowTextSize} text-slate-800 font-semibold`}>{summary.designation}</p>
                                    {summary.bankId && <p className="text-[6.5px] text-slate-600 font-medium">ব্যাংক আইডি: {summary.bankId}</p>}
                                    {summary.fileNo && <p className="text-[6.5px] text-slate-600 font-medium">ফাইল নং: {summary.fileNo}</p>}
                                  </td>
                                  <td className={`border border-black ${printTablePadding} font-serif text-center text-[7.5px] leading-snug`}>
                                    {formatWorkedDates(empDuties)}
                                  </td>
                                  <td className={`border border-black ${printTablePadding} font-serif text-center text-[8px] leading-tight`}>
                                    {getTransportFormula(summary)}
                                  </td>
                                  <td className={`border border-black ${printTablePadding} font-serif text-center text-[8px] leading-tight`}>
                                    {getApyaonFormula(summary)}
                                  </td>
                                  <td className={`border border-black ${printTablePadding} font-extrabold font-serif text-right pr-2`}>
                                    ৳{toBanglaDigits(summary.grandTotal)}/-
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Subtotal row inside printed table for this Cell */}
                            <tr className="font-bold bg-slate-50/80">
                              <td className={`border border-black ${printTablePadding} text-right pr-2`} colSpan={3}>
                                उप-মোট ({cellName}):
                              </td>
                              <td className={`border border-black ${printTablePadding} font-serif text-center text-[8.5px]`}>
                                ৳{toBanglaDigits(cellTotals.transport)}/-
                              </td>
                              <td className={`border border-black ${printTablePadding} font-serif text-center text-[8.5px]`}>
                                ৳{toBanglaDigits(cellTotals.apyaon)}/-
                              </td>
                              <td className={`border border-black ${printTablePadding} font-extrabold font-serif text-right pr-2`} colSpan={1}>
                                ৳{toBanglaDigits(cellTotals.total)}/-
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                      
                      {/* Grand Total Row at bottom */}
                      <tr className="font-bold bg-slate-100/60 text-[9.5px] border-t border-black">
                        <td className={`border border-black ${printTablePadding} text-right pr-2`} colSpan={3}>
                          সর্বমোট প্রদেয় বিল:
                        </td>
                        <td className={`border border-black ${printTablePadding} font-serif text-center`}>
                          ৳{toBanglaDigits(totalTransportAll)}/-
                        </td>
                        <td className={`border border-black ${printTablePadding} font-serif text-center`}>
                          ৳{toBanglaDigits(totalApyaonAll)}/-
                        </td>
                        <td className={`border border-black ${printTablePadding} font-extrabold font-serif text-right pr-2`} colSpan={1}>
                          ৳{toBanglaDigits(metrics.grandTotal)}/-
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Specific Government/Janata Bank PLC Paragraphs 02 and 03 */}
                <div className={`${printCertSpacing} border-t border-black text-left pt-2 font-serif`}>
                  <p className={`text-justify leading-relaxed ${printParaSpacing} mb-1.5`}>
                    ০২। বর্ণিত যাতায়াত ভাতা বাবদ সর্বমোট টাকা <span className="font-bold">৳{toBanglaDigits(totalTransportAll)}/- ({getBanglaNumberWords(totalTransportAll)})</span> কোড নং- ১৩৫১২০২৫০০০০০০৩ (যাতায়াত ও ভ্রমণ) এবং আপ্যায়ন ভাতা বাবদ সর্বমোট টাকা <span className="font-bold">৳{toBanglaDigits(totalApyaonAll)}/- ({getBanglaNumberWords(totalApyaonAll)})</span> কোড নং- ১৩৫১২০১১০০০০০০২ (আপ্যায়ন ব্যয়) খাত হতে ব্যয় করা হবে।
                  </p>
                  <p className={`text-justify leading-relaxed ${printParaSpacing}`}>
                    ০৩। অতএব, উপরোক্ত কর্মকর্তা ও কর্মচারীদের যাতায়াত ও আপ্যায়ন ভাতা বাবদ সর্বমোট টাকা <span className="font-bold">৳{toBanglaDigits(metrics.grandTotal)}/- ({getBanglaNumberWords(metrics.grandTotal)})</span> পরিশোধ করার লক্ষ্যে <span className="font-bold">{representativeName}, {representativeDesignation}</span> এর নিকট হস্তান্তরের প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য সবিনয় অনুরোধ করা হলো।
                  </p>
                </div>
              </div>

              {/* Stacked Left-Routing and Right-Signatures Panel */}
              <div className={`flex justify-between items-end border-t border-black/10 pt-4 ${printSigSpacing} ${printFontSize} no-break-inside mt-4`}>
                {/* Left Side Stacked Routing Blocks */}
                <div className="w-[45%] text-left space-y-1.5 font-serif text-[8.5px] leading-normal border-l-2 border-black pl-3 py-0.5">
                  <p className="font-bold underline mb-1">সুপারিশ ও অগ্রায়নকারী কর্তৃপক্ষ:</p>
                  <p className="font-semibold">১. সিনিয়র প্রোগ্রামার (এসপিও)</p>
                  <p className="font-semibold">২. সহকারী মহাব্যবস্থাপক (এজিএম)</p>
                  <p className="font-semibold">৩. উপ-মহাব্যবস্থাপক (ডিজিএম), অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
                  <p className="font-semibold">৪. উপ-মহাব্যবস্থাপক (ডিজিএম), বাজেট অ্যান্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট</p>
                </div>

                {/* Right Side Aligned Signature Box */}
                <div className="w-[50%] flex justify-end gap-5 text-center leading-tight">
                  <div className="space-y-0.5 font-serif">
                    <div className="h-8 border-b border-black/30 w-24 mx-auto mb-1.5" />
                    <p className="font-bold text-[9px]">({preparedBy})</p>
                    <p className="text-[7.5px] text-slate-800 font-semibold">{preparedDesignation}</p>
                    <p className="text-[6.5px] text-slate-500">বিল প্রস্তুতকারী</p>
                  </div>
                  
                  <div className="space-y-0.5 font-serif">
                    <div className="h-8 border-b border-black/30 w-24 mx-auto mb-1.5" />
                    <p className="font-bold text-[9px]">({verifiedBy})</p>
                    <p className="text-[7.5px] text-slate-800 font-semibold">{verifiedDesignation}</p>
                    <p className="text-[6.5px] text-slate-500">যাচাইকারী / সেল প্রধান</p>
                  </div>

                  <div className="space-y-0.5 font-serif">
                    <div className="h-8 border-b border-black/30 w-24 mx-auto mb-1.5" />
                    <p className="font-bold text-[9px]">({approvedBy})</p>
                    <p className="text-[7.5px] text-slate-800 font-semibold">{approvedDesignation}</p>
                    <p className="text-[6.5px] text-slate-500">অনুমোদনকারী কর্তৃপক্ষ</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
