'use client';

import { useState, useEffect, useCallback } from 'react';
import { LUNCH_BILL_RATE, REVENUE_STAMP } from '@/constants/billing';
import { UserProfile } from '@/context/ProfileContext';
import { 
  Cell, 
  Employee, 
  Executive, 
  Holiday, 
  LunchBill, 
  LunchRecord, 
  DEFAULT_2026_HOLIDAYS 
} from '../types';
import { getBanglaMonthYearLabel, getBanglaNumberWords } from '@/lib/bengali-converter';

export function useLunchBillData(currentUser: UserProfile | null | undefined) {
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
  const [syncingLeaves, setSyncingLeaves] = useState(false);
  const [leaveDaysSummary, setLeaveDaysSummary] = useState<Record<string, number>>({});

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

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger'
  });

  const showAlertModal = (title: string, message: string, variant: 'danger' | 'warning' | 'info' = 'danger') => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      variant
    });
  };

  const closeAlertModal = () => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  };

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
        const [res, leaveRes] = await Promise.all([
          fetch(`/api/lunch-bills?month=${selectedMonth}&cellId=0`),
          fetch(`/api/lunch-bills/leave-days?month=${selectedMonth}`)
        ]);

        let leaveDaysMap: Record<string, number> = {};
        if (leaveRes.ok) {
          const lData = await leaveRes.json();
          if (lData && lData.leaveDaysByBankId) {
            leaveDaysMap = lData.leaveDaysByBankId;
            setLeaveDaysSummary(leaveDaysMap);
          }
        }

        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSavedLunchBill(data);
            setWorkingDays(data.workingDays);
            const rawParsed = JSON.parse(data.recordsJson || '[]');
            const parsed = rawParsed
              .filter((r: LunchRecord) => !r.isExecutive)
              .map((r: LunchRecord) => {
                let bId = r.bankId;
                if (!bId) {
                  const matched = employees.find(e => e.id === r.employeeId);
                  bId = matched?.bankId || null;
                }
                const bIdLower = (bId || '').trim().toLowerCase();
                const detectedLeaveDays = leaveDaysMap[bIdLower] ?? 0;
                
                // Enforce Md. Shahinur Rahman strictly in R09 (Cell ID 7)
                const isShahinur = (bId === '018273') || (r.employeeName && r.employeeName.includes('শাহিনুর'));
                const assignedCellId = isShahinur ? 7 : r.cellId;

                return {
                  ...r,
                  bankId: bId,
                  cellId: assignedCellId,
                  isExecutive: false,
                  leaveDays: r.leaveDays !== undefined ? r.leaveDays : detectedLeaveDays,
                  additionalDeduction: r.additionalDeduction ?? 0,
                  remarks: r.remarks ?? ''
                };
              });

            // Deduplicate if Shahinur or any employee appears multiple times
            const seenKeys = new Set<string>();
            const dedupedRecords = parsed.filter((r: LunchRecord) => {
              const key = `${r.bankId || r.employeeId}`;
              if (seenKeys.has(key)) return false;
              seenKeys.add(key);
              return true;
            });

            setRecords(dedupedRecords);
            return;
          }
        }

        // Fallback: build default combined list with auto-calculated leave absences (excluding executives)
        setSavedLunchBill(null);
        const cellRecords: LunchRecord[] = employees.map(emp => {
          const bIdLower = (emp.bankId || '').trim().toLowerCase();
          const detectedLeaveDays = leaveDaysMap[bIdLower] ?? 0;
          const absence = Math.min(workingDays, detectedLeaveDays);
          const present = Math.max(0, workingDays - absence);
          const total = present * LUNCH_BILL_RATE;
          const stamp = total > 0 ? REVENUE_STAMP : 0;
          
          // Enforce Md. Shahinur Rahman strictly in R09 (Cell ID 7)
          const isShahinur = (emp.bankId === '018273') || (emp.name && emp.name.includes('শাহিনুর'));
          const assignedCellId = isShahinur ? 7 : emp.cellId;

          return {
            employeeId: emp.id,
            employeeName: emp.name,
            designation: emp.designation,
            bankId: emp.bankId,
            rate: LUNCH_BILL_RATE,
            presentDays: present,
            absenceDays: absence,
            leaveDays: detectedLeaveDays,
            totalBill: total,
            stampDeduction: stamp,
            additionalDeduction: 0,
            netPayable: Math.max(0, total - stamp),
            cellId: assignedCellId,
            isExecutive: false,
            remarks: ''
          };
        });

        // Deduplicate in fallback
        const seenFallbackKeys = new Set<string>();
        const dedupedCellRecords = cellRecords.filter(r => {
          const key = `${r.bankId || r.employeeId}`;
          if (seenFallbackKeys.has(key)) return false;
          seenFallbackKeys.add(key);
          return true;
        });

        // In Lunch Bill, only cell officers are included (executives are excluded)
        setRecords(dedupedCellRecords);
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

  const handleWorkingDaysUpdate = (newDays: number) => {
    setWorkingDays(newDays);
    setRecords(prev => prev.map(rec => {
      const present = Math.max(0, newDays - rec.absenceDays);
      const total = present * rec.rate;
      const stamp = total > 0 ? REVENUE_STAMP : 0;
      return {
        ...rec,
        presentDays: present,
        totalBill: total,
        stampDeduction: stamp,
        netPayable: Math.max(0, total - stamp - (rec.additionalDeduction || 0))
      };
    }));
  };

  const handleSyncLeaves = async () => {
    setSyncingLeaves(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/lunch-bills/leave-days?month=${selectedMonth}`);
      if (!res.ok) throw new Error('ছুটির তথ্য লোড করা সম্ভব হয়নি');
      const data = await res.json();
      const map: Record<string, number> = data.leaveDaysByBankId || {};
      setLeaveDaysSummary(map);

      setRecords(prev => prev.map(rec => {
        const bIdLower = (rec.bankId || '').trim().toLowerCase();
        const detected = map[bIdLower] ?? 0;
        const absence = Math.min(workingDays, detected);
        const present = Math.max(0, workingDays - absence);
        const total = present * rec.rate;
        const stamp = total > 0 ? REVENUE_STAMP : 0;
        return {
          ...rec,
          leaveDays: detected,
          absenceDays: absence,
          presentDays: present,
          totalBill: total,
          stampDeduction: stamp,
          netPayable: Math.max(0, total - stamp - (rec.additionalDeduction || 0))
        };
      }));

      setSuccessMessage('ছুটির তালিকা অনুযায়ী কর্মকর্তা ও নির্বাহীদের অনুপস্থিতি ও উপস্থিতি সফলভাবে সিঙ্ক করা হয়েছে!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error syncing leaves:', err);
      setErrorMessage('ছুটি সিঙ্ক করতে সমস্যা হয়েছে।');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setSyncingLeaves(false);
    }
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
    if (records.length === 0) {
      showAlertModal('তথ্য পাওয়া যায়নি', 'প্রিন্ট বা পিডিএফ তৈরি করার মতো কোনো কর্মকর্তার রেকর্ড পাওয়া যায়নি।', 'warning');
      return;
    }

    setGenerating(true);
    const printWindow = typeof window !== 'undefined' ? window.open('', '_blank') : null;

    try {
      const monthName = getBanglaMonthYearLabel(selectedMonth) || selectedMonth;

      // Build cell groups based on available cells and active records
      const cellMap = new Map<number, string>();
      cells.forEach(c => cellMap.set(c.id, c.name));

      const distinctCellIds = Array.from(new Set(records.map(r => r.cellId)));
      const cellGroups = distinctCellIds.map(cId => {
        const cName = cellMap.get(cId) || (cId === 7 ? 'R09 Development & Customization Cell' : cId === 9 ? 'CBS Integrated Development Cell' : `সেল ${cId}`);
        // Filter out executives, and strictly ensure Md. Shahinur Rahman is only in Cell 7 (never in CBS)
        const cellRecs = records.filter(r => {
          if (r.isExecutive) return false;
          const isShahinur = (r.bankId === '018273') || (r.employeeName && r.employeeName.includes('শাহিনুর'));
          if (isShahinur) {
            return cId === 7;
          }
          return r.cellId === cId;
        });

        return {
          id: cId,
          cellName: cName,
          name: cName,
          records: cellRecs
        };
      }).filter(c => c.records.length > 0);

      const effectiveRecords = cellGroups.flatMap(g => g.records);

      const totalClaimAll = effectiveRecords.reduce((sum, r) => sum + r.totalBill, 0);
      const grandTotalAll = effectiveRecords.reduce((sum, r) => sum + r.netPayable, 0);
      const totalDeductionAll = effectiveRecords.reduce((sum, r) => sum + (r.stampDeduction + (r.additionalDeduction || 0)), 0);

      const payload = {
        monthName,
        groupedData: cellGroups,
        executivesData: undefined,
        workingDays,
        cells: cellGroups,
        executives: [],
        totalDaysAll: effectiveRecords.reduce((sum, r) => sum + r.presentDays, 0),
        totalClaimAll,
        totalDeductionAll,
        grandTotalAll,
        grandTotalInWords: getBanglaNumberWords(grandTotalAll),
        reportDate: new Date().toISOString().split('T')[0]
      };

      const res = await fetch('/api/documents/generate-lunch-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.filePath) {
          if (printWindow) {
            printWindow.location.href = data.filePath;
          } else {
            window.open(data.filePath, '_blank');
          }
        } else if (printWindow) {
          printWindow.close();
        }
      } else {
        if (printWindow) printWindow.close();
        const errData = await res.json().catch(() => null);
        const errMsg = errData?.message || errData?.error || 'পিডিএফ / লাঞ্চ বিল প্রস্তুত করতে সমস্যা হয়েছে। অনুগ্রহ করে ডেটা যাচাই করে পুনরায় চেষ্টা করুন।';
        showAlertModal('পিডিএফ তৈরিতে সমস্যা', errMsg, 'danger');
      }
    } catch (err) {
      if (printWindow) printWindow.close();
      console.error('Error generating PDF:', err);
      showAlertModal('সার্ভার এরর', 'সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে অথবা সংযোগে সমস্যা দেখা দিয়েছে।', 'danger');
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
    alertModal,
    showAlertModal,
    closeAlertModal,
    syncingLeaves,
    handleSyncLeaves,
    leaveDaysSummary,
    handleWorkingDaysUpdate,
    handlePresentDaysChange,
    handleAbsenceDaysChange,
    handleAdditionalDeductionChange,
    handleRemarksChange,
    applyBulkDeduction,
    handleSaveDraft,
    handlePrintCombinedBill
  };
}
