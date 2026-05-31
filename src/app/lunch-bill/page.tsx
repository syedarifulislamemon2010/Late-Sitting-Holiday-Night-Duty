'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  ChevronLeft, 
  Calendar, 
  DollarSign, 
  Clock,
  ShieldCheck,
  Award,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Lock,
  Users,
  Info
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

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
}

interface LunchRecord {
  employeeId: number;
  employeeName: string;
  designation: string;
  rate: number;
  presentDays: number;
  absenceDays: number;
  totalBill: number;
  stampDeduction: number;
  additionalDeduction: number;
  netPayable: number;
}

export default function LunchBillPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Filter configs
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });
  const [selectedCellId, setSelectedCellId] = useState<string>('');
  const [workingDays, setWorkingDays] = useState<number>(17);

  // Active records sheet state
  const [records, setRecords] = useState<LunchRecord[]>([]);
  const [savedLunchBill, setSavedLunchBill] = useState<any>(null);

  // Warning pop-up alert state
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch initial profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error('Error loading auth profile:', err);
      }
    }
    loadProfile();
  }, []);

  // Fetch cells & employees lists
  useEffect(() => {
    async function loadStaticData() {
      try {
        const [cellRes, empRes] = await Promise.all([
          fetch('/api/cells'),
          fetch('/api/employees')
        ]);
        const cellData = await cellRes.json();
        const empData = await empRes.json();
        setCells(Array.isArray(cellData) ? cellData : []);
        setEmployees(Array.isArray(empData) ? empData : []);
      } catch (err) {
        console.error('Error loading lunch static data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStaticData();
  }, []);

  // Determine authorized cells list based on logged-in user role
  const isAdministrationCell = currentUser?.cells?.some((c: any) => 
    c.name.includes('প্রশাসন') || 
    c.name.toLowerCase().includes('admin') || 
    c.name.toLowerCase().includes('administration')
  );
  
  const isAdminOrAdminCell = currentUser?.role === 'ADMIN' || isAdministrationCell;

  const selectableCells = currentUser?.role === 'ADMIN'
    ? cells
    : cells.filter(cell => currentUser?.cells?.some((c: any) => c.id === cell.id));

  // Initialize selectedCellId once cells are loaded
  useEffect(() => {
    if (selectableCells.length > 0 && !selectedCellId) {
      setSelectedCellId(selectableCells[0].id.toString());
    }
  }, [selectableCells, selectedCellId]);

  // Load or construct active lunch bill records when cell, month, or working days change
  useEffect(() => {
    if (!selectedCellId || !selectedMonth) return;

    async function loadLunchBill() {
      try {
        const cellId = parseInt(selectedCellId, 10);
        const res = await fetch(`/api/lunch-bills?month=${selectedMonth}&cellId=${cellId}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSavedLunchBill(data);
            setWorkingDays(data.workingDays);
            const parsedRecords = JSON.parse(data.recordsJson);
            setRecords(parsedRecords);
            return;
          }
        }
        
        // Fallback: If not saved in database, generate default records list from active employees
        setSavedLunchBill(null);
        const cellEmps = employees.filter(e => e.cellId === cellId);
        const defaultRecords = cellEmps.map(emp => {
          const absence = 0;
          const present = Math.max(0, workingDays - absence);
          const totalBill = present * 400;
          const stamp = 15;
          const additional = 0;
          const net = totalBill - (stamp + additional);
          return {
            employeeId: emp.id,
            employeeName: emp.name,
            designation: emp.designation,
            rate: 400,
            presentDays: present,
            absenceDays: absence,
            totalBill,
            stampDeduction: stamp,
            additionalDeduction: additional,
            netPayable: net
          };
        });
        setRecords(defaultRecords);
      } catch (err) {
        console.error('Error loading active lunch bill:', err);
      }
    }

    loadLunchBill();
  }, [selectedCellId, selectedMonth, employees]);

  // Handle live recalculation when Working Days, Absence, or Additional Deductions change
  const handleRecalculation = (updatedWorkingDays: number, updatedRecords: LunchRecord[]) => {
    const recalculated = updatedRecords.map(r => {
      const present = Math.max(0, updatedWorkingDays - r.absenceDays);
      const totalBill = present * 400;
      const stamp = 15;
      const additional = r.additionalDeduction;
      const net = totalBill - (stamp + additional);
      return {
        ...r,
        presentDays: present,
        totalBill,
        netPayable: net
      };
    });
    setRecords(recalculated);
  };

  const handleAbsenceChange = (empId: number, absenceStr: string) => {
    const val = parseInt(absenceStr, 10) || 0;
    const updated = records.map(r => r.employeeId === empId ? { ...r, absenceDays: val } : r);
    handleRecalculation(workingDays, updated);
  };

  const handleAdditionalDeductionChange = (empId: number, additionalStr: string) => {
    const val = parseInt(additionalStr, 10) || 0;
    const updated = records.map(r => r.employeeId === empId ? { ...r, additionalDeduction: val } : r);
    handleRecalculation(workingDays, updated);
  };

  const handleWorkingDaysChange = (daysStr: string) => {
    const val = parseInt(daysStr, 10) || 0;
    setWorkingDays(val);
    handleRecalculation(val, records);
  };

  // Calculations for bottom total row
  const totalPresentDaysAll = records.reduce((sum, r) => sum + r.presentDays, 0);
  const totalClaimAll = records.reduce((sum, r) => sum + r.totalBill, 0);
  const totalDeductionAll = records.reduce((sum, r) => sum + (r.stampDeduction + r.additionalDeduction), 0);
  const grandTotalAll = records.reduce((sum, r) => sum + r.netPayable, 0);

  // Convert English digits/text to Bengali digits
  const toBanglaDigits = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) return '';
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/[0-9]/g, (w) => bnDigits[parseInt(w, 10)]);
  };

  // Convert Gregorian Month string to formal Bengali (e.g. "মে ২০২৬")
  const getBanglaMonthName = (monthStr: string): string => {
    if (!monthStr || !monthStr.includes('-')) return '';
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const idx = parseInt(month, 10) - 1;
    return `${monthNames[idx]} ${toBanglaDigits(year)}`;
  };

  // Convert total number into Bengali Words for legal certification note
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

  // Save changes to Database (Admin only)
  const saveLunchBill = async () => {
    if (!isAdminOrAdminCell) return;
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/lunch-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          cellId: selectedCellId,
          workingDays: workingDays,
          records: records
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSavedLunchBill(data.lunchBill);
        setSuccessMessage('লাঞ্চ ভাতার বিল হিসাব সফলভাবে সংরক্ষণ করা হয়েছে!');
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(data.message || 'লাঞ্চ বিল সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error('Error saving lunch bill:', err);
      setErrorMessage('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  // Generate HTML sheet inside public/uploads/ and open Print window
  const generateAndPrintBill = async () => {
    setGenerating(true);
    setErrorMessage(null);
    try {
      // 1. Ensure the latest records are saved to the database first
      if (isAdminOrAdminCell) {
        const saveRes = await fetch('/api/lunch-bills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            month: selectedMonth,
            cellId: selectedCellId,
            workingDays: workingDays,
            records: records
          })
        });
        if (!saveRes.ok) {
          throw new Error('বিল জেনারেট করার আগে ডাটাবেজ সংরক্ষণ করতে ব্যর্থ হয়েছে।');
        }
      }

      const activeCell = cells.find(c => c.id.toString() === selectedCellId);
      const activeCellName = activeCell ? activeCell.name : 'Unknown Cell';

      // 2. Call PDF/Print HTML Generator API
      const res = await fetch('/api/documents/generate-lunch-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthName: getBanglaMonthName(selectedMonth),
          cellName: activeCellName,
          records: records,
          workingDays: workingDays,
          totalDays: totalPresentDaysAll,
          totalClaim: totalClaimAll,
          totalDeduction: totalDeductionAll,
          grandTotal: grandTotalAll,
          grandTotalInWords: getBanglaNumberWords(grandTotalAll),
          signingOfficer: 'উপ-মহাব্যবস্থাপক',
          signingDesignation: 'অনলাইন ব্যাংকিং ডিপার্টমেন্ট',
          reportDate: new Date().toISOString().split('T')[0]
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.filePath) {
        // Open the generated print HTML page in a new window/tab
        window.open(data.filePath, '_blank');
      } else {
        setErrorMessage(data.message || 'প্রিন্ট মেমো প্রস্তুত করতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      console.error('Error generating printable lunch bill:', err);
      setErrorMessage(err.message || 'সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setGenerating(false);
    }
  };

  // Intercept Print Action to check if additional deductions are modified
  const handlePrintClick = () => {
    // Check if additionalDeductions are all 0
    const hasAdditionalDeductions = records.some(r => r.additionalDeduction > 0);
    if (!hasAdditionalDeductions) {
      // Show warning modal
      setIsWarningOpen(true);
    } else {
      generateAndPrintBill();
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-6 pb-10">
        
        {/* Header Action Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-wide">লাঞ্চ ভাতা বিল জেনারেটর</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">কর্মকর্তাদের দৈনিক লাঞ্চ ভাতার নিখুঁত হিসাব প্রস্তুতকরণ ও স্বয়ংক্রিয় সেল ভিত্তিক রিপোর্ট বিতরণ প্যানেল।</p>
          </div>
        </div>

        {/* Configurations Filter Panel */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Cell Selection Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">সেল সিলেক্ট করুন</label>
              <select
                value={selectedCellId}
                disabled={!isAdminOrAdminCell && selectableCells.length <= 1}
                onChange={(e) => setSelectedCellId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold"
              >
                {selectableCells.map((c) => (
                  <option key={c.id} value={c.id.toString()}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Month Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">মাস নির্বাচন করুন</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold font-sans"
              />
            </div>

            {/* Working Days Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                মোট কার্যদিবস
                {!isAdminOrAdminCell && <span className="text-[10px] text-slate-400 normal-case ml-1.5">(লকড)</span>}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                disabled={!isAdminOrAdminCell}
                value={workingDays}
                onChange={(e) => handleWorkingDaysChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold font-sans"
              />
            </div>

          </div>
        </div>

        {/* Messages Alerts */}
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

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={36} />
            <p className="text-sm font-bold text-slate-500">ডাটা লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
          </div>
        ) : records.length > 0 ? (
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800/80">
            
            {/* Card Header Actions */}
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                  লাঞ্চ ভাতা বিল শিট - {getBanglaMonthName(selectedMonth)}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {savedLunchBill ? (
                    <span className="text-emerald-600 font-bold">● administration সেল কর্তৃক চূড়ান্ত সংরক্ষিত রেকর্ড</span>
                  ) : (
                    <span className="text-amber-500 font-bold">● খসড়া (ডাটাবেজে এখনও চূড়ান্ত সংরক্ষণ করা হয়নি)</span>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {isAdminOrAdminCell && (
                  <button
                    onClick={saveLunchBill}
                    disabled={saving}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 border border-slate-200/50 dark:border-slate-750 transition-colors"
                  >
                    {saving && <Loader2 className="animate-spin" size={12} />}
                    সেভ করুন
                  </button>
                )}
                <button
                  onClick={handlePrintClick}
                  disabled={generating}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center gap-2 transition-colors shadow-md shadow-indigo-500/10"
                >
                  {generating && <Loader2 className="animate-spin" size={12} />}
                  <Printer size={14} />
                  প্রিন্ট ও পিডিএফ
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 font-bold text-xs border-b border-slate-150 dark:border-slate-850 uppercase tracking-wider">
                    <th className="py-3.5 px-4">ক্রমিক</th>
                    <th className="py-3.5 px-4 text-left">কর্মকর্তার নাম</th>
                    <th className="py-3.5 px-4">পদবী</th>
                    <th className="py-3.5 px-4">দৈনিক হার</th>
                    <th className="py-3.5 px-4">অনুপস্থিত দিন</th>
                    <th className="py-3.5 px-4">উপস্থিত দিন</th>
                    <th className="py-3.5 px-4">মোট দাবী</th>
                    <th className="py-3.5 px-4">রেভেনিউ স্ট্যাম্প</th>
                    <th className="py-3.5 px-4">অতিরিক্ত কর্তন</th>
                    <th className="py-3.5 px-4">প্রাপ্তব্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {records.map((r, index) => (
                    <tr key={r.employeeId} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/5 transition-colors">
                      <td className="py-3 px-4 font-bold">{toBanglaDigits(index + 1)}</td>
                      <td className="py-3 px-4 text-left font-extrabold text-slate-800 dark:text-slate-200">{r.employeeName}</td>
                      <td className="py-3 px-4">{r.designation}</td>
                      <td className="py-3 px-4 font-bold font-sans">৳{toBanglaDigits(400)}</td>
                      
                      {/* Absence Days input */}
                      <td className="py-2 px-4 w-28">
                        <input
                          type="number"
                          min="0"
                          max={workingDays}
                          disabled={!isAdminOrAdminCell}
                          value={r.absenceDays}
                          onChange={(e) => handleAbsenceChange(r.employeeId, e.target.value)}
                          className="w-full px-2 py-1 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 font-bold font-sans text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </td>

                      <td className="py-3 px-4 font-bold font-sans">{toBanglaDigits(r.presentDays)}</td>
                      <td className="py-3 px-4 font-bold font-sans">৳{toBanglaDigits(r.totalBill)}</td>
                      <td className="py-3 px-4 font-bold font-sans">৳{toBanglaDigits(15)}</td>
                      
                      {/* Additional Deduction input */}
                      <td className="py-2 px-4 w-32">
                        <input
                          type="number"
                          min="0"
                          disabled={!isAdminOrAdminCell}
                          value={r.additionalDeduction}
                          onChange={(e) => handleAdditionalDeductionChange(r.employeeId, e.target.value)}
                          className="w-full px-2 py-1 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 font-bold font-sans text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </td>

                      <td className="py-3 px-4 font-extrabold text-indigo-650 dark:text-indigo-400 font-sans">৳{toBanglaDigits(r.netPayable)}</td>
                    </tr>
                  ))}

                  {/* Summary/Totals row */}
                  <tr className="bg-slate-50/40 dark:bg-slate-950/10 font-bold text-slate-800 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800">
                    <td colSpan={4} className="py-4 px-4 text-right">মোট =</td>
                    <td className="py-4 px-4 text-center font-sans">-</td>
                    <td className="py-4 px-4 font-extrabold font-sans text-center">{toBanglaDigits(totalPresentDaysAll)}</td>
                    <td className="py-4 px-4 font-extrabold font-sans">৳{toBanglaDigits(totalClaimAll)}</td>
                    <td className="py-4 px-4 font-extrabold font-sans">-</td>
                    <td className="py-4 px-4 font-extrabold font-sans">-</td>
                    <td className="py-4 px-4 font-black text-indigo-700 dark:text-indigo-350 font-sans">৳{toBanglaDigits(grandTotalAll)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* In Words display */}
            <div className="p-6 bg-slate-50/20 dark:bg-slate-950/5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs font-bold text-slate-500">
              <p>কথায়: <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">{getBanglaNumberWords(grandTotalAll)}</span></p>
              <p>হার ও স্ট্যাম্প কর্তন প্রবিধান অনুযায়ী স্থায়ী এবং অপরিবর্তনযোগ্য।</p>
            </div>

          </div>
        ) : (
          /* Empty / Not prepared state card */
          <div className="glass-card p-10 rounded-3xl text-center space-y-6 flex flex-col items-center justify-center max-w-2xl mx-auto border border-slate-200/60 dark:border-slate-800/80 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 flex items-center justify-center">
              <Lock size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">লাঞ্চ ভাতা বিল প্রস্তুত করা হয়নি</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                {isAdminOrAdminCell 
                  ? 'এই সেলে এই মাসের কোনো সক্রিয় কর্মকর্তা ডেটাবেজে তালিকাভুক্ত নেই। অনুগ্রহ করে কর্মকর্তা তথ্য যুক্ত করুন।'
                  : 'প্রশাসন সেল কর্তৃক এই মাসের লাঞ্চ ভাতা বিল এখনও প্রস্তুত বা চূড়ান্ত করা হয়নি। অনুগ্রহ করে চূড়ান্ত হওয়ার পর চেক করুন।'}
              </p>
            </div>
          </div>
        )}

        {/* Warning verification Modal */}
        {isWarningOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-up p-6 text-center space-y-5">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center mx-auto">
                <ShieldCheck size={26} />
              </div>
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-850 dark:text-slate-50 text-base">অতিরিক্ত কর্তন যাচাইকরণ</h4>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                  এ মাসে কোনো কর্মকর্তার বেতন/ভাতা থেকে অতিরিক্ত কর্তন (ডিজিএম বা নির্বাহীর নির্দেশানুযায়ী) কাটা হবে কি না?
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsWarningOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
                >
                  হ্যাঁ, অতিরিক্ত কর্তন কাটবো
                </button>
                <button
                  onClick={() => {
                    setIsWarningOpen(false);
                    generateAndPrintBill();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-indigo-500/10"
                >
                  না, অতিরিক্ত কর্তন নেই (প্রিন্ট করুন)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}
