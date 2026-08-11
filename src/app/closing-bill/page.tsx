'use client';
import { CLOSING_BILL_RATE, REVENUE_STAMP } from '@/constants/billing';

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Calendar, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  Users, 
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Search
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import { useProfile } from '@/context/ProfileContext';

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
  mobile?: string | null;
}

interface Executive {
  id: number;
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  phone?: string | null;
}

interface ClosingRecord {
  employeeId: number;
  employeeName: string;
  designation: string;
  bankId: string | null;
  rate: number;          // Flat 2000
  presentDays: number;   // 1
  absenceDays: number;   // 0
  totalBill: number;     // 2000
  stampDeduction: number;// 15
  netPayable: number;    // 1985
  cellId: number;
  isExecutive: boolean;
  remarks?: string;
}

interface UserSession {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
  cells?: Cell[];
}

interface SavedBill {
  id: number;
  month: string;
  workingDays: number;
  recordsJson: string;
}

const getInitialClosingMonth = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1-12
  const toBnDigits = (num: number | string): string => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/[0-9]/g, (w) => bnDigits[parseInt(w, 10)]);
  };
  if (month === 6) {
    return {
      options: [{ value: `${year}-06`, label: `জুন ${toBnDigits(year)}` }],
      month: `${year}-06`
    };
  } else if (month === 12) {
    return {
      options: [{ value: `${year}-12`, label: `ডিসেম্বর ${toBnDigits(year)}` }],
      month: `${year}-12`
    };
  }
  return { options: [], month: '' };
};

export default function ClosingBillPage() {
  const { currentUser } = useProfile();
  const [activeCellId, setActiveCellId] = useState<number | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Dynamic June & December options list calculated inline
  const initialClosing = getInitialClosingMonth();
  const [closingMonthOptions] = useState<{ value: string; label: string }[]>(initialClosing.options);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialClosing.month);

  const [records, setRecords] = useState<ClosingRecord[]>([]);
  const [savedBill, setSavedBill] = useState<SavedBill | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterCell, setFilterCell] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [collapsedCells, setCollapsedCells] = useState<Record<string, boolean>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string>('');

  // Sync active cell ID from currentUser profile
  useEffect(() => {
    if (currentUser && currentUser.cells && currentUser.cells.length > 0) {
      setActiveCellId(currentUser.cells[0].id);
    }
  }, [currentUser]);

  // Fetch structural units
  useEffect(() => {
    async function loadData() {
      try {
        const [cellRes, empRes, execRes] = await Promise.all([
          fetch('/api/cells'),
          fetch('/api/employees'),
          fetch('/api/executives')
        ]);
        const cellData = await cellRes.json();
        const empData = await empRes.json();
        const execData = await execRes.json();

        setCells(Array.isArray(cellData) ? cellData : []);
        setEmployees(Array.isArray(empData) ? empData : []);

        const filteredExecs = (Array.isArray(execData) ? execData : []).filter(e => {
          const d = e.designation.trim();
          return (
            d.includes('উপ-মহাব্যবস্থাপক') || 
            d.includes('সহকারী মহাব্যবস্থাপক') || 
            d.includes('ডিজিএম') || 
            d.includes('এজিএম') || 
            d.toLowerCase().includes('dgm') || 
            d.toLowerCase().includes('agm')
          ) && !(
            d.includes('মহাব্যবস্থাপক') && 
            !d.includes('উপ-') && 
            !d.includes('সহকারী')
          );
        });
        setExecutives(filteredExecs);
      } catch (err) {
        console.error('Error loading structural lists:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isAdmin = currentUser?.role === 'ADMIN';
  const matchedEmp = employees.find(e => e.bankId && e.bankId.trim().toLowerCase() === currentUser?.username?.trim().toLowerCase());
  const resolvedPrimaryCellId = matchedEmp ? matchedEmp.cellId : (currentUser?.cells?.[0]?.id || null);

  // Load saved closing bill
  useEffect(() => {
    if (!selectedMonth || loading) return;

    async function fetchClosingBill() {
      try {
        // Query the combined closing sheet in DB (prefixed with closing-)
        const res = await fetch(`/api/lunch-bills?month=closing-${selectedMonth}&cellId=0`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSavedBill(data);
            const parsed = JSON.parse(data.recordsJson).map((r: ClosingRecord) => {
              let bId = r.bankId;
              if (!bId) {
                if (r.isExecutive) {
                  const matched = executives.find(e => e.id === r.employeeId);
                  bId = matched?.bankId || null;
                } else {
                  const matched = employees.find(e => e.id === r.employeeId);
                  bId = matched?.bankId || null;
                }
              }
              return {
                ...r,
                bankId: bId,
                rate: 2000,
                presentDays: 1,
                absenceDays: 0,
                totalBill: 2000,
                stampDeduction: 15,
                netPayable: 1985
              };
            });
            setRecords(parsed);
            return;
          }
        }

        // Fallback: build default static Closing Bill
        setSavedBill(null);
        const defaultRecords: ClosingRecord[] = [];

        // 1. Add Cell Officers
        employees.forEach(emp => {
          defaultRecords.push({
            employeeId: emp.id,
            employeeName: emp.name,
            designation: emp.designation,
            bankId: emp.bankId,
            rate: 2000,
            presentDays: 1,
            absenceDays: 0,
            totalBill: 2000,
            stampDeduction: 15,
            netPayable: 1985,
            cellId: emp.cellId,
            isExecutive: false,
            remarks: ''
          });
        });

        // 2. Add Executives (DGMs & AGMs)
        executives.forEach(exec => {
          defaultRecords.push({
            employeeId: exec.id,
            employeeName: exec.name,
            designation: exec.designation,
            bankId: exec.bankId,
            rate: 2000,
            presentDays: 1,
            absenceDays: 0,
            totalBill: 2000,
            stampDeduction: 15,
            netPayable: 1985,
            cellId: 0,
            isExecutive: true,
            remarks: ''
          });
        });

        setRecords(defaultRecords);
      } catch (err) {
        console.error('Error loading closing sheet:', err);
      }
    }

    fetchClosingBill();
  }, [selectedMonth, employees, executives, loading]);

  const toBanglaDigits = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) return '';
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/[0-9]/g, (w) => bnDigits[parseInt(w, 10)]);
  };

  const getBanglaMonthLabel = (monthStr: string): string => {
    if (!monthStr) return '';
    const parts = monthStr.split('-');
    if (parts.length !== 2) return '';
    const yearStr = toBanglaDigits(parts[0]);
    const month = parseInt(parts[1], 10);
    if (month === 6) return `জুন ${yearStr}`;
    if (month === 12) return `ডিসেম্বর ${yearStr}`;
    return '';
  };

  const getBanglaNumberWords = (num: number) => {
    if (num === 0) return 'অনুল্লেখ্য';
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
    
    if (num >= 100000) {
      const lac = Math.floor(num / 100000);
      wordStr += convertTens(lac) + ' লক্ষ ';
      num %= 100000;
    }

    if (num >= 1000) {
      const thousand = Math.floor(num / 1000);
      wordStr += convertTens(thousand) + ' হাজার ';
      num %= 1000;
    }
    
    if (num >= 100) {
      const hundred = Math.floor(num / 100);
      wordStr += singleWords[hundred] + ' শত ';
      num %= 100;
    }
    
    if (num > 0) {
      wordStr += convertTens(num);
    }
    
    return wordStr.trim() + ' টাকা মাত্র';
  };

  // Filter records by cell/executives for standard users
  const getFilteredRecordsForUser = (primaryCellId: number | null) => {
    if (isAdmin) return records;
    // Standard user gets only officers belonging to their specific cell (primary cell only)
    return records.filter(r => !r.isExecutive && r.cellId === primaryCellId);
  };

  const primaryCellId = isAdmin ? (activeCellId || null) : resolvedPrimaryCellId;
  const userBaseRecords = getFilteredRecordsForUser(primaryCellId);

  // Apply Search Query & Advanced Filters to activeRecords
  const activeRecords = userBaseRecords.filter(r => {
    // 1. Search Query Match
    const matchesSearch = searchQuery === '' || 
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.bankId || '').toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Cell Filter Match
    const matchesCell = filterCell === 'ALL' || r.cellId.toString() === filterCell || (filterCell === '0' && r.isExecutive);

    // 3. Type Filter Match
    const matchesType = filterType === 'ALL' || 
      (filterType === 'officer' && !r.isExecutive) || 
      (filterType === 'executive' && r.isExecutive);

    return matchesSearch && matchesCell && matchesType;
  });

  const totalEmployeesCount = activeRecords.length;
  const totalClaimAll = activeRecords.reduce((sum, r) => sum + r.totalBill, 0);
  const totalStampAll = totalEmployeesCount * 15;
  const grandTotalAll = activeRecords.reduce((sum, r) => sum + r.netPayable, 0);

  const saveClosingBill = async (): Promise<SavedBill | null> => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/lunch-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: `closing-${selectedMonth}`,
          workingDays: 1,
          records: isAdmin ? records : userBaseRecords // Send only complete cell records for coordinators
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSavedBill(data.lunchBill);
        setSuccessMessage('ক্লোজিং ভাতা বিল সফলভাবে সংরক্ষণ করা হয়েছে!');
        setTimeout(() => setSuccessMessage(null), 5000);
        return data.lunchBill;
      } else {
        setErrorMessage(data.message || 'ক্লোজিং বিল সংরক্ষণ করতে ব্যর্থ হয়েছে।');
        return null;
      }
    } catch (err) {
      console.error('Error saving closing bill:', err);
      setErrorMessage('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const getPrintPayload = () => {
    const primaryCellId = isAdmin ? (activeCellId || null) : resolvedPrimaryCellId;

    // Filter records and cells according to user role/assigned primary cell
    const allowedRecords = isAdmin 
      ? records 
      : records.filter(r => !r.isExecutive && r.cellId === primaryCellId);
      
    const allowedCells = isAdmin 
      ? cells 
      : cells.filter(c => c.id === primaryCellId);

    // 1. Group cell officers
    const cellGroups = allowedCells.map(cell => {
      const cellRecs = allowedRecords.filter(r => !r.isExecutive && r.cellId === cell.id);
      return {
        cellName: cell.name,
        records: cellRecs,
        totalClaim: cellRecs.reduce((sum, r) => sum + r.totalBill, 0),
        totalDeduction: cellRecs.length * 15,
        grandTotal: cellRecs.reduce((sum, r) => sum + r.netPayable, 0)
      };
    }).filter(g => g.records.length > 0);

    // 2. Executives
    const execRecsUnsorted = isAdmin ? records.filter(r => r.isExecutive) : [];
    const execRecs = [...execRecsUnsorted].sort((a, b) => {
      const priority = (desig: string | null | undefined) => {
        if (!desig) return 3;
        const d = desig.toLowerCase();
        if (d.includes('উপ-মহাব্যবস্থাপক') || d.includes('ডিজিএম') || d.includes('dgm')) return 1;
        if (d.includes('সহকারী মহাব্যবস্থাপক') || d.includes('এজিএম') || d.includes('agm')) return 2;
        return 3;
      };
      const pA = priority(a.designation);
      const pB = priority(b.designation);
      if (pA !== pB) return pA - pB;
      return (a.bankId || '').localeCompare(b.bankId || '', undefined, { numeric: true, sensitivity: 'base' });
    });
    const execsData = {
      records: execRecs,
      totalClaim: execRecs.reduce((sum, r) => sum + r.totalBill, 0),
      totalDeduction: execRecs.length * 15,
      grandTotal: execRecs.reduce((sum, r) => sum + r.netPayable, 0)
    };

    const allowedTotalClaim = allowedRecords.reduce((sum, r) => sum + r.totalBill, 0);
    const allowedTotalStamp = allowedRecords.length * 15;
    const allowedGrandTotal = allowedRecords.reduce((sum, r) => sum + r.netPayable, 0);

    return {
      monthName: getBanglaMonthLabel(selectedMonth),
      groupedData: cellGroups,
      executivesData: execsData,
      totalEmployeesCount: allowedRecords.length,
      totalClaimAll: allowedTotalClaim,
      totalStampAll: allowedTotalStamp,
      grandTotalAll: allowedGrandTotal,
      grandTotalInWords: getBanglaNumberWords(allowedGrandTotal),
      reportDate: new Date().toISOString().split('T')[0]
    };
  };

  const generateClosingBillReport = async (): Promise<string | null> => {
    setGenerating(true);
    setErrorMessage(null);
    try {
      if (isAdmin) {
        const savedRecord = await saveClosingBill();
        if (!savedRecord) {
          throw new Error('বিল জেনারেট করার আগে ডাটাবেজ সংরক্ষণ ব্যর্থ হয়েছে।');
        }
      }

      const res = await fetch('/api/documents/generate-closing-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPrintPayload())
      });

      const data = await res.json();
      if (res.ok && data.success && data.filePath) {
        return data.filePath;
      } else {
        setErrorMessage(data.message || 'প্রিন্ট মেমো প্রস্তুত করতে ব্যর্থ হয়েছে।');
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।';
      console.error('Error generating closing bill:', err);
      setErrorMessage(errorMsg);
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintPreview = async () => {
    const path = await generateClosingBillReport();
    if (path) {
      setIframeUrl(path);
      setIsPreviewOpen(true);
    }
  };

  const handleDirectPrint = async () => {
    const path = await generateClosingBillReport();
    if (path) {
      const iframe = document.getElementById('silent-print-iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.src = path;
        iframe.onload = () => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        };
      }
    }
  };

  const toggleCellCollapse = (cellId: number) => {
    setCollapsedCells(prev => ({
      ...prev,
      [cellId]: !prev[cellId]
    }));
  };

  return (
    <AuthGuard>
      <div className="space-y-6 pb-10">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">ক্লোজিং ভাতার বিল জেনারেটর</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isAdmin 
                ? 'জুন এবং ডিসেম্বর মাসের জন্য কর্মকর্তা ও নির্বাহীদের ক্লোজিং ভাতার সমন্বিত হিসাব প্যানেল।'
                : 'আপনার সেলের চূড়ান্তকৃত ক্লোজিং ভাতার বিল ও প্রিন্ট বিবরণী।'}
            </p>
          </div>
        </div>

        {/* Filter Configuration Panel */}
        <div className="glass-card p-6 rounded-2xl space-y-5 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="selectedMonth" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ক্লোজিং মাস নির্বাচন করুন</label>
              <select
                id="selectedMonth"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold font-sans"
              >
                {closingMonthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Cell Selection removed under governance rules */}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="কর্মকর্তার নাম, পদবী বা ব্যাংক আইডি দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>
            
            {/* Toggle Panel Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                showAdvancedFilters || filterCell !== 'ALL' || filterType !== 'ALL'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400 font-bold'
                  : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-350'
              }`}
            >
              <Filter size={14} />
              <span>ফিল্টারসমূহ</span>
              {(filterCell !== 'ALL' || filterType !== 'ALL') && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Advanced Filter Options Panel */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 animate-fadeIn">
              
              {/* Cell Filter */}
              {isAdmin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">শাখা/সেল</label>
                  <select
                    value={filterCell}
                    onChange={(e) => setFilterCell(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">সকল সেল (All)</option>
                    <option value="0">নির্বাহী প্যানেল (Executives)</option>
                    {cells.map(c => (
                      <option key={c.id} value={c.id.toString()}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Type Filter */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ধরণ</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">সবাই (All)</option>
                  <option value="officer">কর্মকর্তা (Cell Officers)</option>
                  <option value="executive">নির্বাহী (Executives)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Alert Notifications */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 font-sans font-medium text-sm animate-fade-in">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 font-sans font-medium text-sm animate-fade-in">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Loading / Data Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={36} />
            <p className="text-sm font-bold text-slate-500">ক্লোজিং বিল ডাটা লোড হচ্ছে...</p>
          </div>
        ) : !selectedMonth ? (
          <div className="glass-card p-10 rounded-3xl text-center space-y-6 flex flex-col items-center justify-center max-w-2xl mx-auto border border-slate-200/60 dark:border-slate-800/80 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 flex items-center justify-center animate-pulse">
              <Calendar size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">ক্লোজিং বিল সেবা নিষ্ক্রিয়</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                ক্লোজিং বিল কেবলমাত্র জুন এবং ডিসেম্বর মাসে প্রস্তুত করা সম্ভব। বর্তমানে এই সুবিধাটি নিষ্ক্রিয় রয়েছে।
              </p>
            </div>
          </div>
        ) : activeRecords.length > 0 ? (
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800/80">
            
            {/* Card Header Actions */}
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                  ক্লোজিং বিল শিট - {cells.find(c => c.id === primaryCellId)?.name || ''} - {getBanglaMonthLabel(selectedMonth)}
                </h3>
                <p className="text-[10px] mt-0.5 font-sans">
                  {savedBill ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle size={10} /> প্রশাসন সেল কর্তৃক ডাটাবেজে চূড়ান্তকৃত ক্লোজিং শিট
                    </span>
                  ) : (
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      <AlertTriangle size={10} /> খসড়া বিবরণী (ডাটাবেজে চূড়ান্ত করা হয়নি)
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {(isAdmin || !isAdmin) && (
                  <button
                    onClick={saveClosingBill}
                    disabled={saving}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 border border-slate-200/50 dark:border-slate-700 transition-colors"
                  >
                    {saving && <Loader2 className="animate-spin" size={12} />}
                    সেভ করুন
                  </button>
                )}
                
                <button
                  onClick={handlePrintPreview}
                  disabled={generating}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 border border-slate-200/50 dark:border-slate-700 transition-colors"
                >
                  <Eye size={14} />
                  প্রিন্ট প্রিভিউ
                </button>

                <button
                  onClick={handleDirectPrint}
                  disabled={generating}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center gap-2 transition-colors shadow-md shadow-indigo-500/10"
                >
                  {generating && <Loader2 className="animate-spin" size={12} />}
                  <Printer size={14} />
                  প্রিন্ট পিডিএফ
                </button>
              </div>
            </div>

            {/* List Table Content */}
            <div className="p-6 space-y-8">
              
              {/* Group B: DGM & AGM Executives */}
              {activeRecords.some(r => r.isExecutive) && (() => {
                const execRecs = activeRecords.filter(r => r.isExecutive).sort((a, b) => {
                  const priority = (desig: string | null | undefined) => {
                    if (!desig) return 3;
                    const d = desig.toLowerCase();
                    if (d.includes('উপ-মহাব্যবস্থাপক') || d.includes('ডিজিএম') || d.includes('dgm')) return 1;
                    if (d.includes('সহকারী মহাব্যবস্থাপক') || d.includes('এজিএম') || d.includes('agm')) return 2;
                    return 3;
                  };
                  const pA = priority(a.designation);
                  const pB = priority(b.designation);
                  if (pA !== pB) return pA - pB;
                  return (a.bankId || '').localeCompare(b.bankId || '', undefined, { numeric: true, sensitivity: 'base' });
                });
                const execClaim = execRecs.length * 2000;
                const execStamp = execRecs.length * 15;
                const execGrand = execRecs.length * 1985;

                const dgmCount = execRecs.filter(r => {
                  const d = (r.designation || '').toLowerCase();
                  return d.includes('ডিজিএম') || d.includes('dgm') || d.includes('উপ-মহাব্যবস্থাপক');
                }).length;
                const agmCount = execRecs.filter(r => {
                  const d = (r.designation || '').toLowerCase();
                  return d.includes('এজিএম') || d.includes('agm') || d.includes('সহকারী মহাব্যবস্থাপক');
                }).length;
                const totalExec = dgmCount + agmCount;

                return (
                  <div className="border border-rose-150 dark:border-rose-900/40 rounded-xl overflow-hidden shadow-sm" style={{ borderLeft: '3px solid #db2777' }}>
                    <div className="px-5 py-3 bg-rose-50/40 dark:bg-rose-950/10 border-b border-rose-150 dark:border-rose-900/40 flex items-center justify-between font-sans">
                      <div className="flex items-center gap-2">
                        <Lock size={16} className="text-rose-500" />
                        <span className="font-extrabold text-xs text-rose-800 dark:text-rose-300 uppercase tracking-wide">
                          নির্বাহী প্যানেল (ডিজিএম {toBanglaDigits(dgmCount)} জন + এজিএম {toBanglaDigits(agmCount)} জন = মোট {toBanglaDigits(totalExec)} জন নির্বাহী)
                        </span>
                      </div>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-350">
                        নির্বাহীদের বিল সমষ্টি: ৳{toBanglaDigits(execGrand)}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-center border-collapse">
                        <thead>
                          <tr className="bg-rose-50/20 dark:bg-rose-950/5 text-rose-900 dark:text-rose-300 font-bold text-xs border-b border-rose-150 dark:border-rose-900/30 uppercase tracking-wider">
                            <th className="py-2.5 px-3 w-10">ক্রমিক</th>
                            <th className="py-2.5 px-3 text-left">নির্বাহীর নাম</th>
                            <th className="py-2.5 px-3">পদবী</th>
                            <th className="py-2.5 px-3">ব্যাংক আইডি</th>
                            <th className="py-2.5 px-3">মোবাইল নম্বর</th>
                            <th className="py-2.5 px-3">ভাতার পরিমাণ</th>
                            <th className="py-2.5 px-3">রেভেনিউ স্ট্যাম্প</th>
                            <th className="py-2.5 px-3">প্রাপ্তব্য</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-50 dark:divide-rose-950/20">
                          {execRecs.map((r, index) => (
                            <tr key={r.employeeId} className="hover:bg-rose-50/10 dark:hover:bg-rose-950/5 transition-colors" style={{ backgroundColor: '#fffdfd' }}>
                              <td className="py-3 px-3 font-bold text-rose-800">{toBanglaDigits(index + 1)}</td>
                              <td className="py-3 px-3 text-left font-extrabold text-rose-800 dark:text-rose-200">{r.employeeName}</td>
                              <td className="py-3 px-3 font-bold text-rose-700 dark:text-rose-300 text-xs">{r.designation}</td>
                              <td className="py-3 px-3 text-xs font-semibold font-sans">{r.bankId || '-'}</td>
                              <td className="py-3 px-3 font-semibold font-sans text-xs text-rose-800 dark:text-rose-300">
                                {(() => {
                                  const exec = executives.find(e => e.id === r.employeeId);
                                  return exec?.phone ? toBanglaDigits(exec.phone) : 'N/A';
                                })()}
                              </td>
                              <td className="py-3 px-3 font-bold font-sans text-slate-500">৳{toBanglaDigits(2000)}</td>
                              <td className="py-3 px-3 font-bold font-sans text-slate-500">৳{toBanglaDigits(15)}</td>
                              <td className="py-3 px-3 font-extrabold text-rose-700 dark:text-rose-400 font-sans text-sm">৳{toBanglaDigits(1985)}</td>
                            </tr>
                          ))}

                          <tr className="bg-rose-100/80 dark:bg-rose-900/60 font-bold border-t border-rose-200 dark:border-rose-800">
                            <td colSpan={5} className="py-3 px-4 text-right pr-6 text-rose-900 dark:text-rose-200 text-xs">
                              সর্বমোট (নির্বাহী প্যানেল) =
                            </td>
                            <td className="py-3 px-4 font-sans font-bold text-rose-900 dark:text-rose-200">
                              ৳{toBanglaDigits(execClaim)}/-
                            </td>
                            <td className="py-3 px-4 font-sans font-bold text-amber-600 dark:text-amber-500">
                              ৳{toBanglaDigits(execStamp)}/-
                            </td>
                            <td className="py-3 px-4 font-sans font-bold text-rose-750 dark:text-rose-400 text-sm">
                              ৳{toBanglaDigits(execGrand)}/-
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Group A: Cell officers */}
              {cells.map(cell => {
                const cellRecs = activeRecords.filter(r => !r.isExecutive && r.cellId === cell.id);
                if (cellRecs.length === 0) return null;
                const isCollapsed = collapsedCells[cell.id];

                const cellClaim = cellRecs.length * 2000;
                const cellStamp = cellRecs.length * 15;
                const cellGrand = cellRecs.length * 1985;

                return (
                  <div key={cell.id} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    
                    {/* Collapsible header */}
                    <div 
                      onClick={() => toggleCellCollapse(cell.id)}
                      className="px-5 py-3 bg-slate-100/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-950/30 transition-colors font-sans select-none"
                    >
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-400" />
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-50 uppercase tracking-wide">
                          সেল: {cell.name} ({cellRecs.length} জন কর্মকর্তা)
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                        <span>সেলের ক্লোজিং ভাতা সমষ্টি: ৳{toBanglaDigits(cellGrand)}</span>
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-center border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-950/10 text-slate-500 dark:text-slate-400 font-bold text-xs border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                              <th className="py-2.5 px-3 w-10">ক্রমিক</th>
                              <th className="py-2.5 px-3 text-left">কর্মকর্তার নাম</th>
                              <th className="py-2.5 px-3">পদবী</th>
                              <th className="py-2.5 px-3">ব্যাংক আইডি</th>
                              <th className="py-2.5 px-3">মোবাইল নম্বর</th>
                              <th className="py-2.5 px-3">ভাতার পরিমাণ</th>
                              <th className="py-2.5 px-3">রেভেনিউ স্ট্যাম্প</th>
                              <th className="py-2.5 px-3">প্রাপ্তব্য</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {cellRecs.map((r, index) => (
                              <tr key={r.employeeId} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/5 transition-colors">
                                <td className="py-3 px-3 font-bold">{toBanglaDigits(index + 1)}</td>
                                <td className="py-3 px-3 text-left font-extrabold text-slate-800 dark:text-slate-200">{r.employeeName}</td>
                                <td className="py-3 px-3 text-xs">{r.designation}</td>
                                <td className="py-3 px-3 text-xs font-semibold font-sans">{r.bankId || '-'}</td>
                                <td className="py-3 px-3 font-semibold font-sans text-xs text-slate-600 dark:text-slate-400">
                                  {(() => {
                                    const emp = employees.find(e => e.id === r.employeeId);
                                    return emp?.mobile ? toBanglaDigits(emp.mobile) : 'N/A';
                                  })()}
                                </td>
                                <td className="py-3 px-3 font-bold font-sans text-slate-500">৳{toBanglaDigits(2000)}</td>
                                <td className="py-3 px-3 font-bold font-sans text-slate-500">৳{toBanglaDigits(15)}</td>
                                <td className="py-3 px-3 font-extrabold text-indigo-650 dark:text-indigo-400 font-sans text-sm">৳{toBanglaDigits(1985)}</td>
                              </tr>
                            ))}

                            {/* Total Row */}
                            <tr className="bg-slate-100/80 dark:bg-slate-900/60 font-bold border-t border-slate-200 dark:border-slate-800">
                              <td colSpan={5} className="py-3 px-4 text-right pr-6 text-slate-800 dark:text-slate-200 text-xs">
                                সর্বমোট (১ থেকে {toBanglaDigits(cellRecs.length)} নং কর্মকর্তা) =
                              </td>
                              <td className="py-3 px-4 font-sans font-bold text-slate-800 dark:text-slate-200">
                                ৳{toBanglaDigits(cellClaim)}/-
                              </td>
                              <td className="py-3 px-4 font-sans font-bold text-amber-600 dark:text-amber-500">
                                ৳{toBanglaDigits(cellStamp)}/-
                              </td>
                              <td className="py-3 px-4 font-sans font-bold text-emerald-600 dark:text-emerald-450 text-sm">
                                ৳{toBanglaDigits(cellGrand)}/-
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Grand summary banner */}
              <div className="bg-indigo-50/30 dark:bg-indigo-950/10 border-2 border-indigo-500 dark:border-indigo-800/80 rounded-2xl p-6 shadow-sm text-center">
                <p className="text-sm sm:text-base md:text-lg font-black text-slate-800 dark:text-slate-100 leading-relaxed font-sans">
                  <strong>সেলের প্রাপ্তব্য টাকার পরিমাণ = ৳{toBanglaDigits(totalClaimAll)}/-</strong> &nbsp;&nbsp;&nbsp;&nbsp;
                  <strong>রেভেনিউ স্ট্যাম্প = ৳{toBanglaDigits(totalStampAll)}/-</strong> &nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">প্রাপ্তব্য = ৳{toBanglaDigits(grandTotalAll)}/-</span>
                </p>
              </div>

              {/* Words Summary */}
              <div className="p-5 bg-indigo-50/10 dark:bg-indigo-950/5 border border-indigo-150/20 dark:border-indigo-900/10 rounded-2xl">
                <p className="text-xs font-bold text-slate-500">কথায় সর্বমোট প্রাপ্তব্য:</p>
                <p className="text-sm text-indigo-650 dark:text-indigo-400 font-extrabold mt-1">{getBanglaNumberWords(grandTotalAll)}</p>
              </div>

            </div>
          </div>
        ) : (
          <div className="glass-card p-10 rounded-3xl text-center space-y-6 flex flex-col items-center justify-center max-w-2xl mx-auto border border-slate-200/60 dark:border-slate-800/80 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 flex items-center justify-center">
              <Lock size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">ক্লোজিং বিল প্রস্তুত করা হয়নি</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                এই সেলে এই মাসের কোনো কর্মকর্তা ডেটাবেজে তালিকাভুক্ত নেই।
              </p>
            </div>
          </div>
        )}

        {/* Print Preview Modal */}
        {isPreviewOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
            <div className="bg-white dark:bg-slate-950 w-full max-w-5xl rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-scale-up h-[90vh]">
              
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-50 text-sm">ইন-পেজ ক্লোজিং বিল প্রিন্ট প্রিভিউ</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">নতুন ট্যাবে ওপেন না করে সরাসরি ড্যাশবোর্ড থেকে প্রিভিউ করুন।</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      const iframe = document.getElementById('preview-print-iframe') as HTMLIFrameElement;
                      if (iframe) {
                        iframe.contentWindow?.focus();
                        iframe.contentWindow?.print();
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Printer size={13} />
                    প্রিন্ট করুন
                  </button>
                  <button 
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-50/50 dark:bg-slate-950/10 p-4 relative">
                <iframe 
                  id="preview-print-iframe"
                  src={iframeUrl}
                  className="w-full h-full border border-slate-100 dark:border-slate-800 rounded-2xl shadow-inner bg-white animate-scale-up"
                />
              </div>

            </div>
          </div>
        )}

        {/* Hidden Iframe */}
        <iframe 
          id="silent-print-iframe" 
          className="hidden" 
          style={{ width: '0px', height: '0px', border: '0px' }}
        />

      </div>
    </AuthGuard>
  );
}
