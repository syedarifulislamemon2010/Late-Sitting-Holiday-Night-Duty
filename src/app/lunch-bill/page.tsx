'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Calendar, 
  DollarSign, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  Users, 
  Settings, 
  FileText,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

// Default 2026 Bangladesh public holidays
const DEFAULT_2026_HOLIDAYS = [
  { date: '2026-02-04', name: 'পবিত্র শবে বরাত' },
  { date: '2026-02-21', name: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস' },
  { date: '2026-03-17', name: 'পবিত্র শবে কদর' },
  { date: '2026-03-19', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-20', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-21', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-22', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-23', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-26', name: 'স্বাধীনতা ও জাতীয় দিবস' },
  { date: '2026-04-14', name: 'বাংলা নববর্ষ (পহেলা বৈশাখ)' },
  { date: '2026-05-01', name: 'মে দিবস ও বুদ্ধ পূর্ণিমা' },
  { date: '2026-05-25', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-26', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-27', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-28', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-29', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-30', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-31', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-06-26', name: 'পবিত্র আশুরা' },
  { date: '2026-07-01', name: 'ব্যাংক ছুটির দিন (অর্ধ-বার্ষিকী)' },
  { date: '2026-08-05', name: 'জুলাই গণঅভ্যুত্থান দিবস' },
  { date: '2026-08-26', name: 'পবিত্র ঈদে মিলাদুন্নবী (সা.)' },
  { date: '2026-09-04', name: 'শুভ জন্মাষ্টমী' },
  { date: '2026-10-20', name: 'দূর্গাপূজা (মহা নবমী)' },
  { date: '2026-10-21', name: 'দূর্গাপূজা (বিজয়া দশমী)' },
  { date: '2026-12-16', name: 'বিজয় দিবস' },
  { date: '2026-12-25', name: 'যীশু খ্রীষ্টের জন্মদিন (বড় দিন)' },
  { date: '2026-12-31', name: 'ব্যাংক ছুটির দিন (বার্ষিকী)' },
];

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

interface LunchRecord {
  employeeId: number;
  employeeName: string;
  designation: string;
  bankId: string | null;
  rate: number;
  presentDays: number;
  absenceDays: number;
  totalBill: number;
  stampDeduction: number;
  additionalDeduction: number;
  netPayable: number;
  cellId: number;       // For cell officers
  isExecutive: boolean; // True for DGM/AGM
  remarks?: string;      // Remarks/মন্তব্য
}

export default function LunchBillPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeCellId, setActiveCellId] = useState<number | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Gregorian Month (defaults to current year/month)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });
  
  const [workingDays, setWorkingDays] = useState<number>(17);
  const [holidays, setHolidays] = useState<any[]>([]);

  // Active records sheet state
  const [records, setRecords] = useState<LunchRecord[]>([]);
  const [savedLunchBill, setSavedLunchBill] = useState<any>(null);

  // Additional Deduction Mode & Configuration
  const [deductionMode, setDeductionMode] = useState<'manual' | 'flat' | 'designation'>('manual');
  const [flatDeductionRate, setFlatDeductionRate] = useState<number>(0);
  const [designationRates, setDesignationRates] = useState({
    SPO: 0,
    PO: 0,
    SO_IT: 0,
    O_IT: 0,
    EXEC: 0
  });

  // Warning, print, and modal state
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Collapsible Cell sections on the form list
  const [collapsedCells, setCollapsedCells] = useState<Record<string, boolean>>({});

  // Fetch initial profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setCurrentUser(data.user);
          if (data.user.cells && data.user.cells.length > 0) {
            setActiveCellId(data.user.cells[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading auth profile:', err);
      }
    }
    loadProfile();
  }, []);

  // Fetch cells, employees, executives, and holidays lists
  useEffect(() => {
    async function loadData() {
      try {
        const [cellRes, empRes, execRes, holidayRes] = await Promise.all([
          fetch('/api/cells'),
          fetch('/api/employees'),
          fetch('/api/executives'),
          fetch('/api/holidays')
        ]);
        const cellData = await cellRes.json();
        const empData = await empRes.json();
        const execData = await execRes.json();
        const holidayData = await holidayRes.json();
        
        setCells(Array.isArray(cellData) ? cellData : []);
        setEmployees(Array.isArray(empData) ? empData : []);
        setHolidays(Array.isArray(holidayData) ? holidayData : []);
        
        // Filter out GMs strictly, leaving only DGMs and AGMs
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
        console.error('Error loading lunch structural lists:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isAdmin = currentUser?.role === 'ADMIN';
  const matchedEmp = employees.find(e => e.bankId && e.bankId.trim().toLowerCase() === currentUser?.username?.trim().toLowerCase());
  const resolvedPrimaryCellId = matchedEmp ? matchedEmp.cellId : (currentUser?.cells?.[0]?.id || null);

  // Load saved combined sheet (cellId = 0 maps to system combined cell internally)
  useEffect(() => {
    if (!selectedMonth || loading) return;

    async function fetchCombinedLunchBill() {
      try {
        // Query the combined sheet
        const res = await fetch(`/api/lunch-bills?month=${selectedMonth}&cellId=0`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSavedLunchBill(data);
            setWorkingDays(data.workingDays);
            const parsed = JSON.parse(data.recordsJson).map((r: any) => {
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
                additionalDeduction: r.additionalDeduction ?? 0,
                remarks: r.remarks ?? ''
              };
            });
            setRecords(parsed);
            return;
          }
        }

        // Fallback: Build default combined list (cell officers + DGM/AGM executives)
        setSavedLunchBill(null);
        
        // Dynamically compute the default working days for the selected month
        let computedDays = 17; // standard fallback
        if (selectedMonth && selectedMonth.includes('-')) {
          const [yearStr, monthStr] = selectedMonth.split('-');
          const year = parseInt(yearStr, 10);
          const month = parseInt(monthStr, 10);
          const daysInMonth = new Date(year, month, 0).getDate();
          
          let count = 0;
          for (let day = 1; day <= daysInMonth; day++) {
            const dayStr = String(day).padStart(2, '0');
            const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
            
            const dateObj = new Date(year, month - 1, day);
            const dayOfWeek = dateObj.getDay(); // 0: Sun, 5: Fri, 6: Sat
            
            const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
            const isHoliday = DEFAULT_2026_HOLIDAYS.some(h => h.date === dateStr);
            
            const dbHol = holidays.find(h => h.date === dateStr);
            let isWorking = true;
            if (dbHol) {
              isWorking = dbHol.isWorkingDay;
            } else {
              if (dateStr === '2026-05-23') {
                isWorking = true;
              } else if (isWeekend || isHoliday) {
                isWorking = false;
              }
            }
            if (isWorking) {
              count++;
            }
          }
          computedDays = count;
        }

        setWorkingDays(computedDays);
        
        const defaultRecords: LunchRecord[] = [];

        // 1. Add Cell Officers
        employees.forEach(emp => {
          defaultRecords.push({
            employeeId: emp.id,
            employeeName: emp.name,
            designation: emp.designation,
            bankId: emp.bankId,
            rate: 400,
            presentDays: computedDays,
            absenceDays: 0,
            totalBill: computedDays * 400,
            stampDeduction: 15,
            additionalDeduction: 0,
            netPayable: (computedDays * 400) - 15,
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
            rate: 400,
            presentDays: computedDays,
            absenceDays: 0,
            totalBill: computedDays * 400,
            stampDeduction: 15,
            additionalDeduction: 0,
            netPayable: (computedDays * 400) - 15,
            cellId: 0, // No cell for executives
            isExecutive: true,
            remarks: ''
          });
        });

        setRecords(defaultRecords);
      } catch (err) {
        console.error('Error loading combined sheet:', err);
      }
    }

    fetchCombinedLunchBill();
  }, [selectedMonth, employees, executives, holidays, loading]);

  // Recalculations hook for deduction configs (flat or designation based)
  const applyDeductionRates = (mode: 'manual' | 'flat' | 'designation', flatRate: number, rates: typeof designationRates, currentWorkingDays: number, currentRecords: LunchRecord[]) => {
    const updated = currentRecords.map(r => {
      let addDed = r.additionalDeduction ?? 0;

      if (mode === 'flat') {
        addDed = flatRate;
      } else if (mode === 'designation') {
        if (r.isExecutive) {
          addDed = rates.EXEC;
        } else {
          const des = r.designation.toUpperCase();
          if (
            des.includes('SPO') || 
            des.includes('SSPO') || 
            des.includes('এসপিও') || 
            des.includes('এসএসপিও')
          ) {
            addDed = rates.SPO;
          } else if (
            des.includes('PO') || 
            des.includes('SNPO') || 
            des.includes('পিও') || 
            des.includes('এসএনপিও')
          ) {
            addDed = rates.PO;
          } else if (
            des.includes('SO-IT') || 
            des.includes('SO_IT') || 
            des.includes('SO') || 
            des.includes('এসও-আইটি') || 
            des.includes('এসও')
          ) {
            addDed = rates.SO_IT;
          } else if (
            des.includes('O-IT') || 
            des.includes('O_IT') || 
            des.includes('ও-আইটি') || 
            des.includes('অফিসার') || 
            des.includes('OFFICER')
          ) {
            addDed = rates.O_IT;
          } else {
            addDed = rates.PO; // Default fallback
          }
        }
      }

      const present = Math.max(0, currentWorkingDays - r.absenceDays);
      const totalBill = present * 400;
      const net = totalBill - (15 + addDed);

      return {
        ...r,
        presentDays: present,
        totalBill,
        additionalDeduction: addDed,
        netPayable: net
      };
    });
    setRecords(updated);
  };

  const handleAbsenceChange = (empId: number, isExec: boolean, valStr: string) => {
    const val = parseInt(valStr, 10) || 0;
    const updated = records.map(r => 
      (r.employeeId === empId && r.isExecutive === isExec) ? { ...r, absenceDays: val } : r
    );
    applyDeductionRates(deductionMode, flatDeductionRate, designationRates, workingDays, updated);
  };

  const handleManualDeductionChange = (empId: number, isExec: boolean, valStr: string) => {
    const val = parseInt(valStr, 10) || 0;
    const updated = records.map(r => 
      (r.employeeId === empId && r.isExecutive === isExec) ? { ...r, additionalDeduction: val } : r
    );
    applyDeductionRates('manual', flatDeductionRate, designationRates, workingDays, updated);
    setDeductionMode('manual');
  };

  const handleRemarksChange = (empId: number, isExec: boolean, val: string) => {
    const updated = records.map(r => 
      (r.employeeId === empId && r.isExecutive === isExec) ? { ...r, remarks: val } : r
    );
    setRecords(updated);
  };

  const handleWorkingDaysChange = (daysStr: string) => {
    const val = parseInt(daysStr, 10) || 0;
    setWorkingDays(val);
    applyDeductionRates(deductionMode, flatDeductionRate, designationRates, val, records);
  };

  const applyFlatRate = (rateVal: number) => {
    setFlatDeductionRate(rateVal);
    applyDeductionRates('flat', rateVal, designationRates, workingDays, records);
  };

  const applyDesignationRates = (field: keyof typeof designationRates, val: number) => {
    const updatedRates = { ...designationRates, [field]: val };
    setDesignationRates(updatedRates);
    applyDeductionRates('designation', flatDeductionRate, updatedRates, workingDays, records);
  };

  // Safe Bengali digit translation
  const toBanglaDigits = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) return '';
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/[0-9]/g, (w) => bnDigits[parseInt(w, 10)]);
  };

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

  // Filter records by cell/executive for standard users
  const getFilteredRecordsForUser = (primaryCellId: number | undefined) => {
    if (isAdmin) return records;
    // Standard user gets only officers belonging to their specific cell (primary cell only)
    return records.filter(r => !r.isExecutive && r.cellId === primaryCellId);
  };

  const primaryCellId = isAdmin ? (activeCellId || resolvedPrimaryCellId) : resolvedPrimaryCellId;
  const activeRecords = getFilteredRecordsForUser(primaryCellId);

  // Combined sums
  const totalEmployeesCount = activeRecords.length;
  const totalPresentDaysAll = activeRecords.reduce((sum, r) => sum + r.presentDays, 0);
  const totalClaimAll = activeRecords.reduce((sum, r) => sum + r.totalBill, 0);
  
  const totalStampAll = totalEmployeesCount * 15;
  const totalExtraAll = activeRecords.reduce((sum, r) => sum + (r.additionalDeduction || 0), 0);
  const totalDeductionAll = totalStampAll + totalExtraAll;
  
  const grandTotalAll = activeRecords.reduce((sum, r) => sum + r.netPayable, 0);

  // Save entire combined record
  const saveLunchBill = async (): Promise<any> => {
    if (!isAdmin) return null;
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/lunch-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          workingDays: workingDays,
          records: records // Saves entire combined department records list
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSavedLunchBill(data.lunchBill);
        setSuccessMessage('সমন্বিত লাঞ্চ ভাতার বিল সফলভাবে ডাটাবেজে সংরক্ষণ করা হয়েছে!');
        setTimeout(() => setSuccessMessage(null), 5000);
        return data.lunchBill;
      } else {
        setErrorMessage(data.message || 'লাঞ্চ বিল সংরক্ষণ করতে ব্যর্থ হয়েছে।');
        return null;
      }
    } catch (err) {
      console.error('Error saving lunch bill:', err);
      setErrorMessage('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Build Payload structures for HTML generator
  const getPrintPayload = () => {
    const primaryCellId = isAdmin ? (activeCellId || resolvedPrimaryCellId) : resolvedPrimaryCellId;

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
        totalDays: cellRecs.reduce((sum, r) => sum + r.presentDays, 0),
        totalClaim: cellRecs.reduce((sum, r) => sum + r.totalBill, 0),
        totalDeduction: cellRecs.reduce((sum, r) => sum + (r.stampDeduction + r.additionalDeduction), 0),
        grandTotal: cellRecs.reduce((sum, r) => sum + r.netPayable, 0)
      };
    }).filter(g => g.records.length > 0);

    // 2. Gather Executives
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
      totalDays: execRecs.reduce((sum, r) => sum + execRecs.reduce((s, o) => s + o.presentDays, 0), 0),
      totalClaim: execRecs.reduce((sum, r) => sum + r.totalBill, 0),
      totalDeduction: execRecs.reduce((sum, r) => sum + (r.stampDeduction + r.additionalDeduction), 0),
      grandTotal: execRecs.reduce((sum, r) => sum + r.netPayable, 0)
    };

    return {
      monthName: getBanglaMonthName(selectedMonth),
      groupedData: cellGroups,
      executivesData: execsData,
      workingDays: workingDays,
      totalDaysAll: allowedRecords.reduce((sum, r) => sum + r.presentDays, 0),
      totalClaimAll: allowedRecords.reduce((sum, r) => sum + r.totalBill, 0),
      totalDeductionAll: allowedRecords.reduce((sum, r) => sum + (r.stampDeduction + r.additionalDeduction), 0),
      grandTotalAll: allowedRecords.reduce((sum, r) => sum + r.netPayable, 0),
      grandTotalInWords: getBanglaNumberWords(allowedRecords.reduce((sum, r) => sum + r.netPayable, 0)),
      reportDate: new Date().toISOString().split('T')[0]
    };
  };

  // Generate printable HTML document
  const generateBillReport = async (): Promise<string | null> => {
    setGenerating(true);
    setErrorMessage(null);
    try {
      // 1. Auto-save latest admin states first and immediately update frontend saved state!
      if (isAdmin) {
        const savedRecord = await saveLunchBill();
        if (!savedRecord) {
          throw new Error('বিল জেনারেট করার আগে ডাটাবেজ আপডেট সংরক্ষণ ব্যর্থ হয়েছে।');
        }
      }

      // 2. Call combined report generator
      const res = await fetch('/api/documents/generate-lunch-bill', {
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
    } catch (err: any) {
      console.error('Error generating lunch bill:', err);
      setErrorMessage(err.message || 'সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  // In-Page Iframe Printing without opening new tabs
  const handleDirectPrint = async () => {
    const path = await generateBillReport();
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

  // In-Page Iframe Print Preview Modal
  const handlePrintPreview = async () => {
    const path = await generateBillReport();
    if (path) {
      setIframeUrl(path);
      setIsPreviewOpen(true);
    }
  };

  const handlePrintWarningCheck = () => {
    const hasAddDeds = records.some(r => r.additionalDeduction > 0);
    if (!hasAddDeds) {
      setIsWarningOpen(true);
    } else {
      handleDirectPrint();
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
        
        {/* Header Action Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">লাঞ্চ বিল জেনারেটর</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isAdmin 
                ? 'সকল সেল এবং ডিজিএম ও এজিএম নির্বাহীদের সমন্বিত লাঞ্চ বিলের হিসাব ও পেমেন্ট রেকর্ড শিট প্রস্তুতকারক প্যানেল।'
                : 'আপনার সেলের চূড়ান্তকৃত লাঞ্চ বিল ও প্রিন্ট প্রিভিউ বিবরণী।'}
            </p>
          </div>
        </div>

        {/* Configurations Filter Panel */}
        <div className="glass-card p-6 rounded-2xl space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Month Selection */}
            <div className="space-y-2">
              <label htmlFor="selectedMonth" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">মাস নির্বাচন করুন</label>
              <input
                id="selectedMonth"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold font-sans"
              />
            </div>

            {/* Working Days Input */}
            <div className="space-y-2">
              <label htmlFor="workingDays" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                মোট কার্যদিবস
                {!isAdmin && <span className="text-[10px] text-slate-400 normal-case ml-1.5">(লকড)</span>}
              </label>
              <input
                id="workingDays"
                type="number"
                min="1"
                max="31"
                disabled={!isAdmin}
                value={workingDays}
                onChange={(e) => handleWorkingDaysChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold font-sans"
              />
            </div>



            {/* Deduction Settings Mode Trigger */}
            {isAdmin && (
              <div className="space-y-2">
                <label htmlFor="deductionMode" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={12} /> অতিরিক্ত কর্তন কনফিগারেশন
                </label>
                <select
                  id="deductionMode"
                  value={deductionMode}
                  onChange={(e) => {
                    const mode = e.target.value as any;
                    setDeductionMode(mode);
                    applyDeductionRates(mode, flatDeductionRate, designationRates, workingDays, records);
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="manual">ম্যানুয়াল ইনপুট (আলাদা আলাদা)</option>
                  <option value="flat">সবার জন্য সমান অতিরিক্ত কর্তন (ফ্ল্যাট)</option>
                  <option value="designation">পদবী ভিত্তিক অতিরিক্ত কর্তন</option>
                </select>
              </div>
            )}

          </div>

          {/* Dynamic configs dependent panel */}
          {isAdmin && deductionMode === 'flat' && (
            <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-4 animate-fade-in">
              <span className="text-xs font-bold text-slate-500 uppercase">ফ্ল্যাট অতিরিক্ত কর্তনের হার:</span>
              <input
                type="number"
                min="0"
                value={flatDeductionRate}
                onChange={(e) => applyFlatRate(parseInt(e.target.value, 10) || 0)}
                className="w-24 px-3 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 font-bold font-sans text-xs"
              />
              <span className="text-[10px] text-slate-400 font-bold">এটি সেল কর্মকর্তা ও ডিজিএম/এজিএম নির্বাহীদের ওপর অভিন্নভাবে প্রয়োগ হবে।</span>
            </div>
          )}

          {isAdmin && deductionMode === 'designation' && (
            <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-xl grid grid-cols-2 sm:grid-cols-5 gap-4 animate-fade-in animate-scale-up">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SPO / SSPO:</span>
                <input
                  type="number"
                  value={designationRates.SPO}
                  onChange={(e) => applyDesignationRates('SPO', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold font-sans text-xs border-indigo-200 focus:border-indigo-550"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">PO / SNPO:</span>
                <input
                  type="number"
                  value={designationRates.PO}
                  onChange={(e) => applyDesignationRates('PO', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold font-sans text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SO-IT:</span>
                <input
                  type="number"
                  value={designationRates.SO_IT}
                  onChange={(e) => applyDesignationRates('SO_IT', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold font-sans text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">O-IT / Officers:</span>
                <input
                  type="number"
                  value={designationRates.O_IT}
                  onChange={(e) => applyDesignationRates('O_IT', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold font-sans text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase" style={{ color: '#db2777' }}>ডিজিএম ও এজিএম:</span>
                <input
                  type="number"
                  value={designationRates.EXEC}
                  onChange={(e) => applyDesignationRates('EXEC', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold font-sans text-xs"
                />
              </div>
            </div>
          )}
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
        ) : activeRecords.length > 0 ? (
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800/80">
            
            {/* Card Header Actions */}
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                  {isAdmin ? 'সমন্বিত লাঞ্চ বিল এন্ট্রি শিট' : `লাঞ্চ ভাতা বিল শিট - ${cells.find(c => c.id === primaryCellId)?.name || ''}`} - {getBanglaMonthName(selectedMonth)}
                </h3>
                <p className="text-[10px] mt-0.5 font-sans">
                  {savedLunchBill ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle size={10} /> administration সেল কর্তৃক চূড়ান্ত সমন্বিত রেকর্ড
                    </span>
                  ) : (
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      <AlertTriangle size={10} /> খসড়া (ডাটাবেজে এখনও চূড়ান্ত সংরক্ষণ করা হয়নি)
                    </span>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button
                    onClick={saveLunchBill}
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
                  onClick={handlePrintWarningCheck}
                  disabled={generating}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center gap-2 transition-colors shadow-md shadow-indigo-500/10"
                >
                  {generating && <Loader2 className="animate-spin" size={12} />}
                  <Printer size={14} />
                  প্রিন্ট পিডিএফ
                </button>
              </div>
            </div>

            {/* List and Combined view */}
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
                const execClaim = execRecs.reduce((sum, r) => sum + r.totalBill, 0);
                const execStamp = execRecs.length * 15;
                const execExtra = execRecs.reduce((sum, r) => sum + (r.additionalDeduction || 0), 0);
                const execGrand = execRecs.reduce((sum, r) => sum + r.netPayable, 0);

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
                            <th className="py-2.5 px-3">দৈনিক হার</th>
                            <th className="py-2.5 px-3">উপস্থিত দিন</th>
                            <th className="py-2.5 px-3">অনুপস্থিত দিন (CL)</th>
                            <th className="py-2.5 px-3">মোট দাবী</th>
                            <th className="py-2.5 px-3">রেভেনিউ স্ট্যাম্প</th>
                            <th className="py-2.5 px-3">অতিরিক্ত কর্তন</th>
                            <th className="py-2.5 px-3">মোট কর্তন</th>
                            <th className="py-2.5 px-3">প্রাপ্তব্য</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-50 dark:divide-rose-950/20">
                          {execRecs.map((r, index) => {
                            const additional = r.additionalDeduction ?? 0;
                            const totalDed = 15 + additional;
                            return (
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
                                <td className="py-3 px-3 font-bold font-sans text-slate-500">৳{toBanglaDigits(400)}</td>
                                
                                <td className="py-3 px-3 font-bold font-sans">{toBanglaDigits(r.presentDays)}</td>

                                {/* CL absence input */}
                                <td className="py-1 px-3 w-24">
                                  <input
                                    type="number"
                                    min="0"
                                    max={workingDays}
                                    disabled={!isAdmin}
                                    value={r.absenceDays}
                                    onChange={(e) => handleAbsenceChange(r.employeeId, true, e.target.value)}
                                    className="w-full px-2 py-1 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 font-bold font-sans text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                                  />
                                </td>

                                <td className="py-3 px-3 font-bold font-sans">৳{toBanglaDigits(r.totalBill)}</td>
                                
                                {/* রেভেনিউ স্ট্যাম্প */}
                                <td className="py-3 px-3 font-bold font-sans text-slate-500">৳{toBanglaDigits(15)}</td>

                                {/* অতিরিক্ত কর্তন */}
                                <td className="py-1 px-3 w-28">
                                  <input
                                    type="number"
                                    min="0"
                                    disabled={!isAdmin}
                                    value={r.additionalDeduction}
                                    onChange={(e) => handleManualDeductionChange(r.employeeId, true, e.target.value)}
                                    className="w-full px-2 py-1 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 font-bold font-sans text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                                  />
                                </td>

                                {/* মোট কর্তন */}
                                <td className="py-3 px-3 font-bold font-sans text-rose-700 dark:text-rose-400">৳{toBanglaDigits(totalDed)}</td>

                                {/* Net Payable */}
                                <td className="py-3 px-3">
                                  <span className="font-extrabold text-rose-700 dark:text-rose-400 font-sans text-sm">৳{toBanglaDigits(r.netPayable)}</span>
                                </td>
                              </tr>
                            );
                          })}

                          {/* ১. সর্বমোট নির্বাহী প্যানেল হিসাব রো */}
                          <tr className="bg-rose-100/80 dark:bg-rose-900/60 font-bold border-t border-rose-200 dark:border-rose-800">
                            <td colSpan={8} className="py-3 px-4 text-right pr-6 text-rose-900 dark:text-rose-200 text-xs">
                              সর্বমোট (নির্বাহী প্যানেল) =
                            </td>
                            <td className="py-3 px-4 font-sans font-bold text-rose-900 dark:text-rose-200">
                              ৳{toBanglaDigits(execClaim)}/-
                            </td>
                            <td className="py-3 px-4 font-sans font-bold text-amber-600 dark:text-amber-500">
                              ৳{toBanglaDigits(execStamp)}/-
                            </td>
                            <td className="py-3 px-4 font-sans font-bold text-amber-600 dark:text-amber-500">
                              ৳{toBanglaDigits(execExtra)}/-
                            </td>
                            <td className="py-3 px-4 font-sans font-bold text-rose-600 dark:text-rose-400">
                              ৳{toBanglaDigits(execStamp + execExtra)}/-
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

              {/* Group A: Cell-wise Officers */}
              {cells.map(cell => {
                const cellRecs = activeRecords.filter(r => !r.isExecutive && r.cellId === cell.id);
                if (cellRecs.length === 0) return null;

                const isCollapsed = collapsedCells[cell.id];

                // Calculate Cell sums
                const cellClaim = cellRecs.reduce((sum, r) => sum + r.totalBill, 0);
                const cellStamp = cellRecs.length * 15;
                const cellExtra = cellRecs.reduce((sum, r) => sum + (r.additionalDeduction || 0), 0);
                const cellGrand = cellRecs.reduce((sum, r) => sum + r.netPayable, 0);

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
                          সেল: {cell.name} (মোট কার্যদিবস: {toBanglaDigits(workingDays)} দিন, {cellRecs.length} জন কর্মকর্তা)
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                        <span>সেলের দাবী সমষ্টি: ৳{toBanglaDigits(cellGrand)}</span>
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
                              <th className="py-2.5 px-3">দৈনিক হার</th>
                              <th className="py-2.5 px-3">উপস্থিত দিন</th>
                              <th className="py-2.5 px-3">অনুপস্থিত দিন (CL)</th>
                              <th className="py-2.5 px-3">মোট দাবী</th>
                              <th className="py-2.5 px-3">রেভেনিউ স্ট্যাম্প</th>
                              <th className="py-2.5 px-3">অতিরিক্ত কর্তন</th>
                              <th className="py-2.5 px-3">মোট কর্তন</th>
                              <th className="py-2.5 px-3">প্রাপ্তব্য</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {cellRecs.map((r, index) => {
                              const additional = r.additionalDeduction ?? 0;
                              const totalDed = 15 + additional;
                              return (
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
                                  <td className="py-3 px-3 font-bold font-sans text-slate-500">৳{toBanglaDigits(400)}</td>
                                  
                                  <td className="py-3 px-3 font-bold font-sans">{toBanglaDigits(r.presentDays)}</td>

                                  {/* CL absence input */}
                                  <td className="py-1 px-3 w-24">
                                    <input
                                      type="number"
                                      min="0"
                                      max={workingDays}
                                      disabled={!isAdmin}
                                      value={r.absenceDays}
                                      onChange={(e) => handleAbsenceChange(r.employeeId, false, e.target.value)}
                                      className="w-full px-2 py-1 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 font-bold font-sans text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                                    />
                                  </td>

                                  <td className="py-3 px-3 font-bold font-sans">৳{toBanglaDigits(r.totalBill)}</td>
                                  
                                  {/* রেভেনিউ স্ট্যাম্প */}
                                  <td className="py-3 px-3 font-bold font-sans text-slate-500">৳{toBanglaDigits(15)}</td>

                                  {/* অতিরিক্ত কর্তন */}
                                  <td className="py-1 px-3 w-28">
                                    <input
                                      type="number"
                                      min="0"
                                      disabled={!isAdmin}
                                      value={r.additionalDeduction}
                                      onChange={(e) => handleManualDeductionChange(r.employeeId, false, e.target.value)}
                                      className="w-full px-2 py-1 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 font-bold font-sans text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                                    />
                                  </td>

                                  {/* মোট কর্তন */}
                                  <td className="py-3 px-3 font-bold font-sans text-rose-700 dark:text-rose-450">৳{toBanglaDigits(totalDed)}</td>

                                  {/* Net Payable */}
                                  <td className="py-3 px-3">
                                    <span className="font-extrabold text-indigo-650 dark:text-indigo-400 font-sans text-sm">৳{toBanglaDigits(r.netPayable)}</span>
                                  </td>
                                </tr>
                              );
                            })}

                            {/* ১. সর্বমোট দাবী ও কর্তন রো */}
                            <tr className="bg-slate-100/80 dark:bg-slate-900/60 font-bold border-t border-slate-200 dark:border-slate-800">
                              <td colSpan={8} className="py-3 px-4 text-right pr-6 text-slate-800 dark:text-slate-200 text-xs">
                                সর্বমোট (১ থেকে {toBanglaDigits(cellRecs.length)} নং কর্মকর্তা) =
                              </td>
                              <td className="py-3 px-4 font-sans font-bold text-slate-800 dark:text-slate-200">
                                ৳{toBanglaDigits(cellClaim)}/-
                              </td>
                              <td className="py-3 px-4 font-sans font-bold text-amber-600 dark:text-amber-500">
                                ৳{toBanglaDigits(cellStamp)}/-
                              </td>
                              <td className="py-3 px-4 font-sans font-bold text-amber-600 dark:text-amber-500">
                                ৳{toBanglaDigits(cellExtra)}/-
                              </td>
                              <td className="py-3 px-4 font-sans font-bold text-rose-600 dark:text-rose-400">
                                ৳{toBanglaDigits(cellStamp + cellExtra)}/-
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

              {/* Deductions Breakdown Summary Box */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 animate-scale-up">
                <h5 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">● কর্তনের বিস্তারিত বিবরণী:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-600 dark:text-slate-355">
                  <p>- রেভেনিউ স্ট্যাম্প কর্তন (১৫/- টাকা হারে মোট {toBanglaDigits(totalEmployeesCount)} জনের): <span className="font-extrabold font-sans text-slate-800 dark:text-slate-100">৳{toBanglaDigits(totalStampAll)}</span></p>
                  <p>- অতিরিক্ত কর্তন (ডিজিএম/নির্বাহী নির্দেশানুযায়ী): <span className="font-extrabold font-sans text-slate-800 dark:text-slate-100">৳{toBanglaDigits(totalExtraAll)}</span></p>
                  <p className="sm:border-l border-slate-200 dark:border-slate-700 sm:pl-4 font-extrabold" style={{ color: '#db2777' }}>
                    = সর্বমোট কর্তন (RS+EXTRA): <span className="font-sans text-sm">৳{toBanglaDigits(totalDeductionAll)}</span>
                  </p>
                </div>
              </div>

              {/* Grand Unified Summary Table Footer Breakdown */}
              <div className="bg-indigo-50/30 dark:bg-indigo-950/10 border-2 border-indigo-500 dark:border-indigo-800/80 rounded-2xl p-6 shadow-sm text-center">
                <p className="text-sm sm:text-base md:text-lg font-black text-slate-800 dark:text-slate-100 leading-relaxed font-sans">
                  <strong>সেলের প্রাপ্তব্য টাকার পরিমাণ = ৳{toBanglaDigits(totalClaimAll)}/-</strong> &nbsp;&nbsp;&nbsp;&nbsp;
                  <strong>রেভেনিউ স্ট্যাম্প = ৳{toBanglaDigits(totalStampAll)}/-</strong> &nbsp;&nbsp;&nbsp;&nbsp;
                  <strong>অতিরিক্ত কর্তন = ৳{toBanglaDigits(totalExtraAll)}/-</strong> &nbsp;&nbsp;&nbsp;&nbsp;
                  <strong>মোট কর্তন = ৳{toBanglaDigits(totalDeductionAll)}/-</strong> &nbsp;&nbsp;&nbsp;&nbsp;
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
          /* Empty / Lock placeholder */
          <div className="glass-card p-10 rounded-3xl text-center space-y-6 flex flex-col items-center justify-center max-w-2xl mx-auto border border-slate-200/60 dark:border-slate-800/80 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 flex items-center justify-center">
              <Lock size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">লাঞ্চ বিল প্রস্তুত করা হয়নি</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                {isAdmin 
                  ? 'এই সেলে এই মাসের কোনো সক্রিয় কর্মকর্তা ডেটাবেজে তালিকাভুক্ত নেই। অনুগ্রহ করে কর্মকর্তা তথ্য যুক্ত করুন।'
                  : 'প্রশাসন সেল কর্তৃক এই মাসের লাঞ্চ ভাতা বিল এখনও প্রস্তুত বা চূড়ান্ত করা হয়নি। অনুগ্রহ করে চূড়ান্ত হওয়ার পর চেক করুন।'}
              </p>
            </div>
          </div>
        )}

        {/* Warning verification Modal */}
        {isWarningOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-5 animate-scale-up">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center mx-auto">
                <AlertTriangle size={26} />
              </div>
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-50 text-base">অতিরিক্ত কর্তন ও ডেটা সংরক্ষণ</h4>
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
                    handleDirectPrint();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-indigo-500/10"
                >
                  "না, অতিরিক্ত কর্তন নেই (প্রিন্ট করুন)"
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Premium In-Page Print Preview Modal */}
        {isPreviewOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
            <div className="bg-white dark:bg-slate-950 w-full max-w-5xl rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-scale-up h-[90vh]">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-50 text-sm">ইন-পেজ লাঞ্চ বিল প্রিন্ট প্রিভিউ</h4>
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

              {/* Modal Body: Printable HTML loaded inside Iframe */}
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

        {/* Hidden Iframe for silent printing */}
        <iframe 
          id="silent-print-iframe" 
          className="hidden" 
          style={{ width: '0px', height: '0px', border: '0px' }}
        />

      </div>
    </AuthGuard>
  );
}
