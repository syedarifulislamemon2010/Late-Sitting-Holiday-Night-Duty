'use client';

import { useState, useEffect, useCallback } from 'react';
import { LUNCH_BILL_RATE, REVENUE_STAMP } from '@/constants/billing';
import { 
  Cell, 
  Employee, 
  Executive, 
  Holiday, 
  LunchBill, 
  LunchRecord, 
  DEFAULT_2026_HOLIDAYS 
} from '../types';

export function useLunchBillData(currentUser: any) {
  const [activeCellId, setActiveCellId] = useState<number | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });

  const [workingDays, setWorkingDays] = useState<number>(17);
  const [isAutoWorkingDays, setIsAutoWorkingDays] = useState(true);
  const [workingDaysLoading, setWorkingDaysLoading] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [records, setRecords] = useState<LunchRecord[]>([]);
  const [savedLunchBill, setSavedLunchBill] = useState<LunchBill | null>(null);

  const [deductionMode, setDeductionMode] = useState<'manual' | 'flat' | 'designation'>('manual');
  const [flatDeductionRate, setFlatDeductionRate] = useState<number>(0);
  const [designationRates, setDesignationRates] = useState({
    SPO: 0,
    PO: 0,
    SO_IT: 0,
    O_IT: 0,
    EXEC: 0
  });

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync active cell ID from currentUser profile
  useEffect(() => {
    if (currentUser && currentUser.cells && currentUser.cells.length > 0) {
      setActiveCellId(currentUser.cells[0].id);
    }
  }, [currentUser]);

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
        
        const filteredExecs = (Array.isArray(execData) ? execData : []).filter((e: Executive) => {
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

  // Compute / load working days for selected month
  const calculateWorkingDays = useCallback(async (yearMonth: string) => {
    if (!yearMonth) return;
    setWorkingDaysLoading(true);
    try {
      const [yearStr, monthStr] = yearMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const totalDaysInMonth = new Date(year, month, 0).getDate();
      
      let resHolidays: { date: string; name: string; isWorkingDay?: boolean }[] = [];
      try {
        const hRes = await fetch(`/api/holidays?month=${yearMonth}`);
        if (hRes.ok) {
          const data = await hRes.json();
          if (Array.isArray(data)) {
            resHolidays = data;
          }
        }
      } catch {
        resHolidays = DEFAULT_2026_HOLIDAYS.filter(h => h.date.startsWith(yearMonth));
      }

      if (resHolidays.length === 0) {
        resHolidays = DEFAULT_2026_HOLIDAYS.filter(h => h.date.startsWith(yearMonth));
      }

      let count = 0;
      for (let day = 1; day <= totalDaysInMonth; day++) {
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const matchedHoliday = resHolidays.find(h => h.date === dateStr);
        if (matchedHoliday) {
          if (matchedHoliday.isWorkingDay) {
            count++;
          }
        } else if (!isWeekend) {
          count++;
        }
      }
      
      setWorkingDays(count);
    } catch (err) {
      console.error('Failed to calculate working days:', err);
    } finally {
      setWorkingDaysLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAutoWorkingDays) {
      calculateWorkingDays(selectedMonth);
    }
  }, [selectedMonth, isAutoWorkingDays, calculateWorkingDays]);

  // Load saved combined sheet or fallback to structural list
  useEffect(() => {
    if (!selectedMonth || loading) return;

    async function fetchCombinedLunchBill() {
      try {
        const res = await fetch(`/api/lunch-bills?month=${selectedMonth}&cellId=0`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSavedLunchBill(data);
            setWorkingDays(data.workingDays);
            const parsed = JSON.parse(data.recordsJson).map((r: LunchRecord) => {
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

        // Fallback: build default combined list
        setSavedLunchBill(null);
        const cellRecords: LunchRecord[] = employees.map(emp => {
          const total = workingDays * LUNCH_BILL_RATE;
          const stamp = total > 0 ? REVENUE_STAMP : 0;
          return {
            employeeId: emp.id,
            employeeName: emp.name,
            designation: emp.designation,
            bankId: emp.bankId,
            rate: LUNCH_BILL_RATE,
            presentDays: workingDays,
            absenceDays: 0,
            totalBill: total,
            stampDeduction: stamp,
            additionalDeduction: 0,
            netPayable: Math.max(0, total - stamp),
            cellId: emp.cellId,
            isExecutive: false,
            remarks: ''
          };
        });

        const execRecords: LunchRecord[] = executives.map(ex => {
          const total = workingDays * LUNCH_BILL_RATE;
          const stamp = total > 0 ? REVENUE_STAMP : 0;
          return {
            employeeId: ex.id,
            employeeName: ex.name,
            designation: ex.designation,
            bankId: ex.bankId,
            rate: LUNCH_BILL_RATE,
            presentDays: workingDays,
            absenceDays: 0,
            totalBill: total,
            stampDeduction: stamp,
            additionalDeduction: 0,
            netPayable: Math.max(0, total - stamp),
            cellId: 0,
            isExecutive: true,
            remarks: ''
          };
        });

        setRecords([...execRecords, ...cellRecords]);
      } catch (err) {
        console.error('Error fetching combined lunch bill:', err);
      }
    }
    fetchCombinedLunchBill();
  }, [selectedMonth, loading, employees, executives, workingDays]);

  const handlePresentDaysChange = (index: number, val: number) => {
    setRecords(prev => {
      const next = [...prev];
      const rec = { ...next[index] };
      rec.presentDays = Math.max(0, val);
      rec.absenceDays = Math.max(0, workingDays - rec.presentDays);
      rec.totalBill = rec.presentDays * rec.rate;
      rec.stampDeduction = rec.totalBill > 0 ? REVENUE_STAMP : 0;
      rec.netPayable = Math.max(0, rec.totalBill - rec.stampDeduction - (rec.additionalDeduction || 0));
      next[index] = rec;
      return next;
    });
  };

  const handleAbsenceDaysChange = (index: number, val: number) => {
    setRecords(prev => {
      const next = [...prev];
      const rec = { ...next[index] };
      rec.absenceDays = Math.max(0, val);
      rec.presentDays = Math.max(0, workingDays - rec.absenceDays);
      rec.totalBill = rec.presentDays * rec.rate;
      rec.stampDeduction = rec.totalBill > 0 ? REVENUE_STAMP : 0;
      rec.netPayable = Math.max(0, rec.totalBill - rec.stampDeduction - (rec.additionalDeduction || 0));
      next[index] = rec;
      return next;
    });
  };

  const handleAdditionalDeductionChange = (index: number, val: number) => {
    setRecords(prev => {
      const next = [...prev];
      const rec = { ...next[index] };
      rec.additionalDeduction = Math.max(0, val);
      rec.netPayable = Math.max(0, rec.totalBill - rec.stampDeduction - rec.additionalDeduction);
      next[index] = rec;
      return next;
    });
  };

  const handleRemarksChange = (index: number, val: string) => {
    setRecords(prev => {
      const next = [...prev];
      const rec = { ...next[index] };
      rec.remarks = val;
      next[index] = rec;
      return next;
    });
  };

  const applyBulkDeduction = () => {
    setRecords(prev => prev.map(rec => {
      let deduction = 0;
      if (deductionMode === 'flat') {
        deduction = flatDeductionRate;
      } else if (deductionMode === 'designation') {
        if (rec.isExecutive) {
          deduction = designationRates.EXEC;
        } else {
          const desig = rec.designation.toUpperCase();
          if (desig.includes('SPO') || desig.includes('সিনিয়র প্রিন্সিপাল অফিসার') || desig.includes('এসপিও')) {
            deduction = designationRates.SPO;
          } else if (desig.includes('PO') || desig.includes('প্রিন্সিপাল অফিসার') || desig.includes('পিও')) {
            deduction = designationRates.PO;
          } else if (desig.includes('SO') || desig.includes('সিনিয়র অফিসার') || desig.includes('এসও')) {
            deduction = designationRates.SO_IT;
          } else if (desig.includes('OFFICER') || desig.includes('অফিসার') || desig.includes('ও')) {
            deduction = designationRates.O_IT;
          }
        }
      }
      return {
        ...rec,
        additionalDeduction: deduction,
        netPayable: Math.max(0, rec.totalBill - rec.stampDeduction - deduction)
      };
    }));
    setSuccessMessage('সকল কর্মকর্তার অতিরিক্ত কর্তন সফলভাবে আপডেট করা হয়েছে।');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/lunch-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          cellId: 0,
          workingDays,
          records
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSavedLunchBill(data);
        setSuccessMessage('খসড়া সফলভাবে সংরক্ষণ করা হয়েছে!');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'সংরক্ষণ করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('সার্ভার এরর: ডাটাবেজে সংরক্ষণ করা সম্ভব হয়নি।');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintCombinedBill = async () => {
    setGenerating(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const bengaliMonths = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
      const monthBangla = bengaliMonths[dateObj.getMonth()];
      const yearBangla = year;

      const cellsPayload = cells.map(cell => ({
        id: cell.id,
        name: cell.name,
        records: records.filter(r => r.cellId === cell.id && !r.isExecutive)
      })).filter(c => c.records.length > 0);

      const executivesPayload = records.filter(r => r.isExecutive);

      const payload = {
        monthBangla,
        yearBangla,
        workingDays,
        cells: cellsPayload,
        executives: executivesPayload
      };

      const res = await fetch('/api/documents/generate-lunch-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.filePath) {
          window.open(data.filePath, '_blank');
        }
      } else {
        alert('পিডিএফ জেনারেট করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('সার্ভার এরর');
    } finally {
      setGenerating(false);
    }
  };

  return {
    activeCellId,
    cells,
    employees,
    executives,
    loading,
    saving,
    generating,
    selectedMonth,
    setSelectedMonth,
    workingDays,
    setWorkingDays,
    isAutoWorkingDays,
    setIsAutoWorkingDays,
    workingDaysLoading,
    records,
    setRecords,
    savedLunchBill,
    deductionMode,
    setDeductionMode,
    flatDeductionRate,
    setFlatDeductionRate,
    designationRates,
    setDesignationRates,
    isWarningOpen,
    setIsWarningOpen,
    isPreviewOpen,
    setIsPreviewOpen,
    iframeUrl,
    setIframeUrl,
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
    handlePresentDaysChange,
    handleAbsenceDaysChange,
    handleAdditionalDeductionChange,
    handleRemarksChange,
    applyBulkDeduction,
    handleSaveDraft,
    handlePrintCombinedBill
  };
}
