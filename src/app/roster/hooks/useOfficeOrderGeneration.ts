'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import logger from '@/lib/logger';
import { sortEmployeesBySeniority } from '@/lib/seniority';
import { toBanglaDigits, getBanglaNumberWords } from '@/lib/bengali-converter';
import { 
  Duty, 
  Employee, 
  Cell, 
  Executive, 
  Holiday, 
  OfficeOrder, 
  OrderDuty, 
  getNormalizedRef, 
  isNameMatchingRef, 
  getDefaultDescription,
  LATE_SITTING_TEMPLATE,
  NIGHT_SHIFT_TEMPLATE,
  HOLIDAY_TEMPLATE,
  calculateOrderDate
} from '../types';

interface UseOfficeOrderGenerationProps {
  duties: Duty[];
  setDuties: React.Dispatch<React.SetStateAction<Duty[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  cells: Cell[];
  setCells: React.Dispatch<React.SetStateAction<Cell[]>>;
  executives: Executive[];
  holidays: Holiday[];
  officeOrders: OfficeOrder[];
  loadDuties: () => Promise<void>;
  loadOfficeOrders: () => Promise<void>;
  selectedCell: string;
  setSelectedCell: (val: string) => void;
  selectedMonths: string[];
  setSelectedMonths: React.Dispatch<React.SetStateAction<string[]>>;
  setOpt1CellId: (val: string) => void;
  opt1Assignments: Record<number, string[]>;
  setOpt1Assignments: React.Dispatch<React.SetStateAction<Record<number, string[]>>>;
  assignmentForm: {
    selectedEmployeeIds: number[];
    type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' | '';
    date: string;
    description: string;
  };
  entryMode: 'EMPLOYEE_WISE' | 'DATE_WISE';
  editingDuty: Duty | null;
  setBillSuggestion: (val: { ref: string; category: string } | null) => void;
  setMsgBanner: (val: { type: 'success' | 'cancel'; text: string } | null) => void;
}

export function useOfficeOrderGeneration({
  duties,
  setDuties,
  employees,
  setEmployees,
  cells,
  setCells,
  executives,
  holidays,
  officeOrders,
  loadDuties,
  loadOfficeOrders,
  selectedCell,
  setSelectedCell,
  selectedMonths,
  setSelectedMonths,
  setOpt1CellId,
  opt1Assignments,
  setOpt1Assignments,
  assignmentForm,
  entryMode,
  editingDuty,
  setBillSuggestion,
  setMsgBanner
}: UseOfficeOrderGenerationProps) {
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isEditingArchive, setIsEditingArchive] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return !!params.get('edit_ref');
    }
    return false;
  });
  const [orderGenerated, setOrderGenerated] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [activePartIdx, setActivePartIdx] = useState(0);
  const [orderToDelete, setOrderToDelete] = useState<{ id: number; refNo: string } | null>(null);

  const [signingOfficer, setSigningOfficer] = useState('জনাব মোহাম্মদ সোহরাব হোসেন');
  const [signingDesignation, setSigningDesignation] = useState('উপ-মহাব্যবস্থাপক');
  const [copies, setCopies] = useState<string[]>([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string>('');
  const [headerMode, setHeaderMode] = useState<'with_header' | 'without_header'>('with_header');

  const [userSelectedPrintCategory, setUserSelectedPrintCategory] = useState<'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' | null>(null);
  const [userSelectedPayeeId, setUserSelectedPayeeId] = useState<string | null>(null);
  const [userCustomOrderDate, setUserCustomOrderDate] = useState<string | null>(null);
  const [userCustomOrderText, setUserCustomOrderText] = useState<string | null>(null);
  const [userCustomOrderRef, setUserCustomOrderRef] = useState<string | null>(null);
  const [originalOrderRef, setOriginalOrderRef] = useState('');

  const [suggestedRef, setSuggestedRef] = useState('');
  const [refDuplicate, setRefDuplicate] = useState(false);

  const isInitializingArchiveRef = useRef(false);
  const [initialRosterValues, setInitialRosterValues] = useState<{
    printCategory: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
    payeeEmployeeId: string;
    selectedCell: string;
    selectedMonths: string[];
    orderRef: string;
    orderDate: string;
    orderText: string;
    signingOfficer: string;
    signingDesignation: string;
    copies: string[];
    opt1Assignments: Record<number, string[]>;
  } | null>(null);

  // Set default executive
  useEffect(() => {
    if (executives.length > 0 && !selectedExecutiveId) {
      const defaultExec = executives.find((ex: Executive) => ex.name.includes('মোহাম্মদ সোহরাব হোসেন') || ex.designation.includes('উপ-মহাব্যবস্থাপক')) || executives[0];
      if (defaultExec) {
        setSelectedExecutiveId(defaultExec.id.toString());
        setSigningOfficer(defaultExec.name);
        setSigningDesignation(defaultExec.designation);
      }
    }
  }, [executives, selectedExecutiveId]);

  // Read URL query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const msg = params.get('msg');
      if (msg === 'success') {
        setMsgBanner({ type: 'success', text: 'আপনার সম্পাদনা সফল হয়েছে।' });
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]msg=success/, '').replace(/^&/, '?');
        window.history.replaceState({}, '', newUrl);
      } else if (msg === 'cancel') {
        setMsgBanner({ type: 'cancel', text: 'অপারেশন বা সম্পাদনা বাতিল করা হয়েছে।' });
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]msg=cancel/, '').replace(/^&/, '?');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [setMsgBanner]);

  // Reset custom fields
  const resetCustomOrderFields = useCallback(() => {
    setActivePartIdx(0);
    setUserSelectedPayeeId(null);
    setUserCustomOrderText(null);
    setUserCustomOrderRef(null);
    setOrderGenerated(false);
  }, []);

  const printCategory = useMemo(() => {
    if (userSelectedPrintCategory !== null) return userSelectedPrintCategory;
    if (duties && duties.length > 0) {
      let latestDuty = duties[0];
      for (let i = 1; i < duties.length; i++) {
        if (duties[i].id > latestDuty.id) {
          latestDuty = duties[i];
        }
      }
      if (latestDuty && latestDuty.type) {
        return latestDuty.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
      }
    }
    return 'LATE_SITTING';
  }, [userSelectedPrintCategory, duties]);

  const changePrintCategory = (category: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT') => {
    setUserSelectedPrintCategory(category);
    resetCustomOrderFields();
  };

  const getSplitParts = (flatDuties: Duty[], numParts: number): Duty[][] => {
    const parts: Duty[][] = Array.from({ length: numParts }, () => []);
    const sorted = [...flatDuties].sort((a, b) => {
      const dComp = a.date.localeCompare(b.date);
      if (dComp !== 0) return dComp;
      return a.employee.name.localeCompare(b.employee.name, 'bn-BD');
    });
    
    const totalItems = sorted.length;
    const baseSize = Math.floor(totalItems / numParts);
    const remainder = totalItems % numParts;
    
    let currentIdx = 0;
    for (let p = 0; p < numParts; p++) {
      const currentSize = baseSize + (p < remainder ? 1 : 0);
      parts[p] = sorted.slice(currentIdx, currentIdx + currentSize);
      currentIdx += currentSize;
    }
    
    return parts;
  };

  const getGroupedDuties = useCallback(() => {
    const filtered = duties.filter(d => {
      const matchesCategory = d.type === printCategory;
      if (isArchived && !isEditingArchive) {
        return matchesCategory && getNormalizedRef(d.orderRef) === getNormalizedRef(originalOrderRef);
      }
      const matchesCell = selectedCell === 'all' || d.employee.cellId.toString() === selectedCell;
      return matchesCell && matchesCategory && !d.orderRef;
    });

    const apyaonRate = printCategory === 'HOLIDAY' ? 250 : printCategory === 'NIGHT_SHIFT' ? 600 : 100;
    const totalDays = filtered.length;
    const totalApyaon = totalDays * apyaonRate;

    let activeDuties = filtered;
    if (totalApyaon > 7500) {
      const numParts = Math.ceil(totalApyaon / 7500);
      const parts = getSplitParts(filtered, numParts);
      activeDuties = parts[activePartIdx] || [];
    }

    const groupedMap = new Map<number, { employee: Employee; dates: string[]; description: string }>();
    activeDuties.forEach(d => {
      const empId = d.employee.id;
      
      const cleanName = (d.employee.name || '').replace(/^(জনাব|জনাবা|ডাঃ|ড\.)\s*/, '').replace(/\s+/g, ' ').trim();
      const isSpecialEmployee = cleanName.includes('মোঃ বাহার উদ্দিন') || cleanName.includes('দেবাশীষ কুমার দে');
      const isSpecialCategory = d.type === 'HOLIDAY' || d.type === 'NIGHT_SHIFT';
      
      const targetDescription = (isSpecialEmployee && isSpecialCategory)
        ? 'Customization এবং Development (রিপোর্ট পোর্টালের জন্য ডাটা এক্সট্রাকশন) সংক্রান্ত কাজ (R09 Development & Customization Cell)'
        : (d.description || getDefaultDescription(d.employee.name, d.type, d.employee.cell?.name));

      if (!groupedMap.has(empId)) {
        groupedMap.set(empId, {
          employee: d.employee,
          dates: [],
          description: targetDescription
        });
      }
      const group = groupedMap.get(empId)!;
      if (!group.dates.includes(d.date)) {
        group.dates.push(d.date);
      }
      if (isSpecialEmployee && isSpecialCategory) {
        group.description = 'Customization এবং Development (রিপোর্ট পোর্টালের জন্য ডাটা এক্সট্রাকশন) সংক্রান্ত কাজ (R09 Development & Customization Cell)';
      } else if (d.description && d.description.trim() !== '') {
        group.description = d.description;
      }
    });

    const groupedList = Array.from(groupedMap.values());
    const sortedEmployees = sortEmployeesBySeniority(groupedList.map(g => g.employee));
    groupedList.sort((a, b) => {
      const idxA = sortedEmployees.findIndex(emp => emp.id === a.employee.id);
      const idxB = sortedEmployees.findIndex(emp => emp.id === b.employee.id);
      return idxA - idxB;
    });

    return groupedList;
  }, [duties, selectedCell, printCategory, isEditingArchive, isPrintMode, isArchived, originalOrderRef, activePartIdx]);

  const payeeEmployeeId = useMemo(() => {
    if (userSelectedPayeeId !== null) return userSelectedPayeeId;
    const tableEmps = getGroupedDuties();
    if (tableEmps.length > 0) {
      let maxDutiesGroup = tableEmps[0];
      for (let i = 1; i < tableEmps.length; i++) {
        if (tableEmps[i].dates.length > maxDutiesGroup.dates.length) {
          maxDutiesGroup = tableEmps[i];
        }
      }
      return maxDutiesGroup.employee.id.toString();
    }
    return '';
  }, [userSelectedPayeeId, getGroupedDuties]);

  const orderText = useMemo(() => {
    if (userCustomOrderText !== null) return userCustomOrderText;
    let template = LATE_SITTING_TEMPLATE;
    if (printCategory === 'NIGHT_SHIFT') template = NIGHT_SHIFT_TEMPLATE;
    if (printCategory === 'HOLIDAY') template = HOLIDAY_TEMPLATE;
    return template;
  }, [userCustomOrderText, printCategory]);

  const orderDate = useMemo(() => {
    if (userCustomOrderDate !== null) return userCustomOrderDate;
    
    let earliestDate: string | null = null;
    const tableGroups = getGroupedDuties();
    const tableDates = tableGroups.flatMap(g => g.dates);
    if (tableDates.length > 0) {
      tableDates.sort();
      earliestDate = tableDates[0];
    } else {
      if (entryMode === 'EMPLOYEE_WISE') {
        const activeEmployeeIds = Object.keys(opt1Assignments).map(Number);
        const allDates: string[] = [];
        activeEmployeeIds.forEach(empId => {
          if (opt1Assignments[empId] && opt1Assignments[empId].length > 0) {
            allDates.push(...opt1Assignments[empId]);
          }
        });
        if (allDates.length > 0) {
          allDates.sort();
          earliestDate = allDates[0];
        }
      } else {
        if (assignmentForm.date) {
          earliestDate = assignmentForm.date;
        }
      }
    }

    if (earliestDate) {
      return calculateOrderDate(earliestDate, holidays, 1);
    }
    return new Date().toISOString().split('T')[0];
  }, [userCustomOrderDate, getGroupedDuties, entryMode, opt1Assignments, assignmentForm.date, holidays]);

  const stableNumber = useMemo(() => {
    const filtered = duties.filter(d => {
      const matchesCell = selectedCell === 'all' || d.employee.cellId.toString() === selectedCell;
      const matchesCategory = d.type === printCategory;
      return matchesCell && matchesCategory;
    });

    const dutyIds = filtered.map(d => d.id).sort((a, b) => a - b);
    if (dutyIds.length === 0) {
      return 84;
    }

    const hashStr = `${dutyIds.join(',')}|${printCategory}|${payeeEmployeeId}`;
    let hash = 0;
    for (let i = 0; i < hashStr.length; i++) {
      hash = (hash * 31 + hashStr.charCodeAt(i)) & 0xffffff;
    }
    return 10 + (hash % 90);
  }, [duties, printCategory, payeeEmployeeId, selectedCell]);

  const orderRef = useMemo(() => {
    if (userCustomOrderRef !== null) return userCustomOrderRef;
    if (isArchived && !isEditingArchive) return '';

    let empName = 'ইমন';
    if (payeeEmployeeId) {
      const grouped = getGroupedDuties();
      const matchedGroup = grouped.find(g => g.employee.id.toString() === payeeEmployeeId);
      if (matchedGroup) {
        empName = matchedGroup.employee.name.replace(/^জনাব\s+/, '');
      } else {
        const emp = employees.find(e => e.id.toString() === payeeEmployeeId);
        if (emp) {
          empName = emp.name.replace(/^জনাব\s+/, '');
        }
      }
    }
    const catBangla = printCategory === 'LATE_SITTING' ? 'লেট-সিটিং' : printCategory === 'HOLIDAY' ? 'অফ-ডে' : 'নাইট';

    if (isEditingArchive && originalOrderRef) {
      const hasPayeeChanged = initialRosterValues && payeeEmployeeId !== initialRosterValues.payeeEmployeeId;
      const hasCategoryChanged = initialRosterValues && printCategory !== initialRosterValues.printCategory;
      
      const emp = employees.find(e => e.id.toString() === payeeEmployeeId);
      const originalRefContainsPayee = emp ? isNameMatchingRef(emp.name, originalOrderRef) : false;

      if (!hasPayeeChanged && !hasCategoryChanged && originalRefContainsPayee) {
        return originalOrderRef;
      }
    }

    const cleanDate = orderDate.replace(/-/g, '');
    const bnDate = toBanglaDigits(cleanDate);
    const activeStableNumber = stableNumber + activePartIdx;
    const bnRand = toBanglaDigits(activeStableNumber);
    return `৯১০৩/ডেভ/${empName}/${catBangla}/অফিস-নির্দেশ/${bnDate}/${bnRand}`;
  }, [userCustomOrderRef, isArchived, duties, printCategory, payeeEmployeeId, employees, isEditingArchive, originalOrderRef, stableNumber, activePartIdx, getGroupedDuties, orderDate, initialRosterValues]);

  const isRosterDirty = useMemo(() => {
    if (!isEditingArchive || !initialRosterValues) return false;

    if (printCategory !== initialRosterValues.printCategory) return true;
    if (payeeEmployeeId !== initialRosterValues.payeeEmployeeId) return true;
    if (selectedCell !== initialRosterValues.selectedCell) return true;
    
    const initialMonthsStr = [...initialRosterValues.selectedMonths].sort().join(',');
    const currentMonthsStr = [...selectedMonths].sort().join(',');
    if (initialMonthsStr !== currentMonthsStr) return true;

    if (orderRef !== initialRosterValues.orderRef) return true;
    if (orderDate !== initialRosterValues.orderDate) return true;
    if (orderText !== initialRosterValues.orderText) return true;
    if (signingOfficer !== initialRosterValues.signingOfficer) return true;
    if (signingDesignation !== initialRosterValues.signingDesignation) return true;

    const initialCopiesStr = [...initialRosterValues.copies].join('\n');
    const currentCopiesStr = [...copies].join('\n');
    if (initialCopiesStr !== currentCopiesStr) return true;

    const initialEmpIds = Object.keys(initialRosterValues.opt1Assignments).sort();
    const currentEmpIds = Object.keys(opt1Assignments).sort();
    if (initialEmpIds.join(',') !== currentEmpIds.join(',')) return true;

    for (const empIdStr of initialEmpIds) {
      const empId = Number(empIdStr);
      const initialDates = [...(initialRosterValues.opt1Assignments[empId] || [])].sort().join(',');
      const currentDates = [...(opt1Assignments[empId] || [])].sort().join(',');
      if (initialDates !== currentDates) return true;
    }

    return false;
  }, [
    isEditingArchive,
    initialRosterValues,
    printCategory,
    payeeEmployeeId,
    selectedCell,
    selectedMonths,
    orderRef,
    orderDate,
    orderText,
    signingOfficer,
    signingDesignation,
    copies,
    opt1Assignments
  ]);

  // Unsaved Changes Tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasUnsavedAssignments = (entryMode === 'EMPLOYEE_WISE' && Object.keys(opt1Assignments).length > 0) || (entryMode === 'DATE_WISE' && (assignmentForm.selectedEmployeeIds.length > 0 || assignmentForm.date));
      window.__unsavedChanges = isEditingArchive || !!editingDuty || !!hasUnsavedAssignments;
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.__unsavedChanges = false;
      }
    };
  }, [isEditingArchive, editingDuty, opt1Assignments, assignmentForm.selectedEmployeeIds, assignmentForm.date, entryMode]);

  useEffect(() => {
    if (isPrintMode && printCategory) {
      fetch(`/api/office-orders/next-ref?category=${printCategory}`)
        .then(res => res.json())
        .then(data => {
          if (data.nextRef) setSuggestedRef(data.nextRef);
        })
        .catch(err => logger.error('Failed to fetch next office order ref:', err));
    }
  }, [isPrintMode, printCategory]);

  useEffect(() => {
    if (orderRef) {
      const isDupe = officeOrders.some((o: OfficeOrder) => o.orderRef === orderRef && o.orderRef !== originalOrderRef);
      setRefDuplicate(isDupe);
    } else {
      setRefDuplicate(false);
    }
  }, [orderRef, officeOrders, originalOrderRef]);

  const getShortDesignation = (desig: string | undefined | null) => {
    if (!desig) return '';
    const match = desig.match(/\(([^)]+)\)/);
    return match ? match[1] : desig;
  };

  const getFormattedDateList = (dates: string[]) => {
    return [...dates]
      .sort((a, b) => b.localeCompare(a))
      .map(d => {
        const [year, month, day] = d.split('-');
        return toBanglaDigits(`${day}-${month}-${year}`);
      })
      .join(', ');
  };

  const updateAssociatedBill = async (baseOrderRef: string, oldOrderRef?: string) => {
    try {
      const billRef = baseOrderRef + '/বিল';
      const oldBillRef = oldOrderRef ? (oldOrderRef + '/বিল') : billRef;
      const ordersRes = await fetch('/api/office-orders');
      if (!ordersRes.ok) return;
      const orders = await ordersRes.json();
      const existingBill = orders.find((o: OfficeOrder) => o.orderRef === billRef || (oldBillRef && o.orderRef === oldBillRef));
      if (!existingBill) {
        logger.info("No existing bill found for this office order. Skipping bill update.");
        return;
      }
      
      const apyaonRate = printCategory === 'HOLIDAY' ? 250 : printCategory === 'NIGHT_SHIFT' ? 600 : 100;
      const transportRate = printCategory === 'HOLIDAY' ? 250 : printCategory === 'NIGHT_SHIFT' ? 400 : 200;
      
      const summaries: Record<number, { name: string; designation: string; bankId: string; days: number; dates: string[] }> = {};
      const activeDuties = duties.filter(d => d.type === printCategory);
      activeDuties.forEach(d => {
        const empId = d.employeeId;
        if (!summaries[empId]) {
          summaries[empId] = {
            name: d.employee.name,
            designation: d.employee.designation,
            bankId: d.employee.bankId || '',
            days: 0,
            dates: []
          };
        }
        summaries[empId].days += 1;
        if (!summaries[empId].dates.includes(d.date)) {
          summaries[empId].dates.push(d.date);
        }
      });
      
      const summariesPayload = Object.values(summaries).map(s => {
        const totalTransport = s.days * transportRate;
        const totalApyaon = s.days * apyaonRate;
        const empTotal = totalTransport + totalApyaon;
        return {
          name: s.name,
          designation: s.designation,
          bankId: s.bankId,
          days: s.days,
          apyaonRate: apyaonRate,
          totalApyaon: totalApyaon,
          totalTransport: totalTransport,
          grandTotal: empTotal,
          datesFormatted: s.dates.slice().sort((a, b) => b.localeCompare(a)).map(d => toBanglaDigits(d.split('-').reverse().join('-'))).join(', ')
        };
      });
      
      const totalDaysAll = summariesPayload.reduce((sum, s) => sum + s.days, 0);
      const totalApyaonAll = summariesPayload.reduce((sum, s) => sum + s.totalApyaon, 0);
      const totalTransportAll = summariesPayload.reduce((sum, s) => sum + s.totalTransport, 0);
      const grandTotalPrintAll = totalApyaonAll + totalTransportAll;
      
      const emp = employees.find(e => e.id.toString() === payeeEmployeeId);
      const payeeName = emp ? emp.name : 'Unknown';
      
      const matchedCellObj = cells.find(c => c.id.toString() === selectedCell);
      const cellName = matchedCellObj ? matchedCellObj.name : (selectedCell === 'all' ? 'All Cells' : 'IT Department');
      
      const billPayload = {
        orderRef: billRef,
        originalOrderRef: oldBillRef !== billRef ? oldBillRef : undefined,
        orderDate: orderDate,
        category: "BILL_" + printCategory,
        employeeName: payeeName,
        cellName: cellName,
        duties: summariesPayload.map(s => ({
          employeeId: s.bankId,
          employeeName: s.name,
          designation: s.designation,
          days: s.days,
          apyaonRate: s.apyaonRate,
          totalApyaon: s.totalApyaon,
          totalTransport: s.totalTransport,
          grandTotal: s.grandTotal
        })),
        dutyIds: activeDuties.map(d => d.id).filter(Number.isInteger),
        content: {
          openingParagraph: `T24 Online Banking Software Customization এবং Development সংক্রান্ত কার্যাদি সুচারুরূপে সম্পাদনের নিমিত্তে অত্র ডিপার্টমেন্টের কর্মকর্তাদের নামের পাশে বর্ণিত তারিখে অতিরিক্ত কাজ সম্পন্ন করায় বিধি মোতাবেক আপ্যায়ন ও যাতায়াত ভাতা প্রদানের বিল মঞ্জুর করা হলো।`,
          totalDays: totalDaysAll,
          totalApyaon: totalApyaonAll,
          totalTransport: totalTransportAll,
          grandTotal: grandTotalPrintAll,
          grandTotalInWords: getBanglaNumberWords(grandTotalPrintAll),
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          subjectText: `অতিরিক্ত কাজের আপ্যায়ন ও যাতায়াত ভাতার মঞ্জুরীপত্র ও বিল প্রস্তুত প্রসঙ্গে।`
        }
      };
      
      await fetch('/api/office-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billPayload)
      });
      
      const formatMonthName = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthName = date.toLocaleString('en-US', { month: 'long' });
        return `${monthName}-${year}`;
      };
      
      const billingMonthString = selectedMonths.length > 0 
        ? selectedMonths.map(formatMonthName).join(', ')
        : formatMonthName(new Date().toISOString().substring(0, 7));
      
      const pdfPayload = {
        billingMonth: billingMonthString,
        openingParagraph: billPayload.content.openingParagraph,
        summaries: summariesPayload,
        totalDays: totalDaysAll,
        totalApyaon: totalApyaonAll,
        totalTransport: totalTransportAll,
        grandTotal: grandTotalPrintAll,
        grandTotalInWords: billPayload.content.grandTotalInWords,
        signingOfficer: signingOfficer,
        signingDesignation: signingDesignation,
        representativeName: payeeName,
        representativeDesignation: emp ? emp.designation : 'Unknown',
        subjectText: billPayload.content.subjectText,
        billDate: orderDate,
        transportRate: transportRate,
        apyaonRate: apyaonRate,
        totalTransportInWords: getBanglaNumberWords(totalTransportAll),
        totalApyaonInWords: getBanglaNumberWords(totalApyaonAll),
        billRef: billRef
      };
      
      await fetch('/api/documents/generate-bill-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfPayload)
      });
      
      logger.info("Associated bill and PDF updated successfully!");
    } catch (err) {
      logger.error("Failed to update associated bill:", err);
    }
  };

  const archiveOrder = async (action: 'generate' | 'print' | 'download') => {
    if (!payeeEmployeeId || !orderRef) return;
    
    try {
      const printTableDuties = getGroupedDuties();

      if (action === 'generate') {
        const pdfPayload = {
          orderRef: orderRef,
          orderDate: orderDate,
          orderText: orderText,
          duties: printTableDuties.map(group => ({
            employee: {
              name: group.employee.name,
              designation: getShortDesignation(group.employee.designation),
              bankId: group.employee.bankId || ''
            },
            datesFormatted: getFormattedDateList(group.dates),
            description: group.description
          })),
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          copies: copies,
          headerMode: headerMode,
          actionType: 'GENERATE_OFFICE_ORDER'
        };

        const res = await fetch('/api/documents/generate-office-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pdfPayload)
        });

        if (res.ok) {
          setOrderGenerated(true);
          setIsArchived(false);
          alert('অফিস আদেশ প্রস্তুত করা হয়েছে! এখন আপনি প্রিভিউ দেখতে পারেন। অনুগ্রহ করে এটি ডাটাবেইজে সংরক্ষণ করতে "আর্কাইভ করুন" বাটনে ক্লিক করুন।');
        } else {
          alert('অফিস আদেশ প্রস্তুত করতে ব্যর্থ হয়েছে।');
        }
      } else if (action === 'download') {
        const pdfPayload = {
          orderRef: orderRef,
          orderDate: orderDate,
          orderText: orderText,
          duties: printTableDuties.map(group => ({
            employee: {
              name: group.employee.name,
              designation: getShortDesignation(group.employee.designation),
              bankId: group.employee.bankId || ''
            },
            datesFormatted: getFormattedDateList(group.dates),
            description: group.description
          })),
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          copies: copies,
          headerMode: headerMode,
          actionType: 'DOWNLOAD_OFFICE_ORDER_PDF'
        };

        const pdfRes = await fetch('/api/documents/generate-office-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pdfPayload)
        });

        if (pdfRes.ok) {
          const pdfData = await pdfRes.json();
          if (pdfData.filePath) {
            window.open(pdfData.filePath, '_blank');
          }
          setIsPrintMode(false);
          if (isEditingArchive) {
            setIsEditingArchive(false);
            window.history.pushState({}, '', '/roster');
          }
          loadDuties();
        } else {
          alert('পিডিএফ ডাউনলোড করতে ব্যর্থ হয়েছে।');
        }
      } else if (action === 'print') {
        const pdfPayload = {
          orderRef: orderRef,
          orderDate: orderDate,
          orderText: orderText,
          duties: printTableDuties.map(group => ({
            employee: {
              name: group.employee.name,
              designation: getShortDesignation(group.employee.designation),
              bankId: group.employee.bankId || ''
            },
            datesFormatted: getFormattedDateList(group.dates),
            description: group.description
          })),
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          copies: copies,
          headerMode: headerMode,
          actionType: 'PRINT_OFFICE_ORDER'
        };

        await fetch('/api/documents/generate-office-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pdfPayload)
        });

        setTimeout(() => {
          window.print();
          setIsPrintMode(false);
          if (isEditingArchive) {
            setIsEditingArchive(false);
            window.history.pushState({}, '', '/roster');
          }
          loadDuties();
        }, 300);
      }
    } catch (err) {
      logger.error('Error in archiveOrder:', err);
      alert('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    }
  };

  const saveOrderToArchive = async () => {
    if (!payeeEmployeeId || !orderRef) return;
    
    try {
      const emp = employees.find(e => e.id.toString() === payeeEmployeeId);
      const payeeName = emp ? emp.name : 'Unknown';
      
      const matchedCellObj = cells.find(c => c.id.toString() === selectedCell);
      const cellName = matchedCellObj ? matchedCellObj.name : (selectedCell === 'all' ? 'All Cells' : 'IT Department');
      
      const printTableDuties = getGroupedDuties();

      const payload = {
        orderRef: orderRef,
        originalOrderRef: isEditingArchive ? originalOrderRef : undefined,
        orderDate: orderDate,
        category: printCategory,
        employeeName: payeeName,
        cellName: cellName,
        status: isEditingArchive ? 'Modified' : 'Generated',
        duties: printTableDuties.map(group => ({
          employeeId: group.employee.id,
          employeeName: group.employee.name,
          designation: group.employee.designation,
          dates: group.dates,
          description: group.description
        })),
        dutyIds: printTableDuties.flatMap(group => {
          const ids: number[] = [];
          group.dates.forEach(dStr => {
            const matchedDuty = duties.find(d => d.employee.id === group.employee.id && d.date === dStr && d.type === printCategory);
            if (matchedDuty && Number.isInteger(matchedDuty.id)) ids.push(matchedDuty.id);
          });
          return ids;
        }),
        content: {
          orderText: orderText,
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          copies: copies,
          cellName: cellName
        }
      };

      const res = await fetch('/api/office-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        logger.info('Office order saved to archive successfully!');
        setIsArchived(true);
        
        await updateAssociatedBill(orderRef, isEditingArchive ? originalOrderRef : undefined);
        
        alert(isEditingArchive ? 'আর্কাইভটি সফলভাবে আপডেট করা হয়েছে!' : 'অফিস আদেশটি সফলভাবে আর্কাইভে সংরক্ষণ করা হয়েছে!');
        
        loadDuties();
        setBillSuggestion({ ref: orderRef, category: printCategory || '' });
        setTimeout(() => setBillSuggestion(null), 15000);
        loadOfficeOrders();
        
        if (isEditingArchive) {
          setIsEditingArchive(false);
          const params = new URLSearchParams(window.location.search);
          const from = params.get('from') || '/documents';
          const redirectUrl = from.includes('?') ? `${from}&msg=success` : `${from}?msg=success`;
          window.location.assign(redirectUrl);
        } else {
          window.location.assign('/');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`আর্কাইভে সংরক্ষণ করতে ব্যর্থ হয়েছে। সার্ভার মেসেজ: ${errData.message || errData.error || 'অজানা ত্রুটি'}`);
      }
    } catch (err) {
      logger.error('Error in saveOrderToArchive:', err);
      alert('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    }
  };

  const handlePreviewOfficeOrder = async (order: OfficeOrder) => {
    const localEmps = employees;
    const cleanName = (n: string) => (n || '').replace(/^(জনাব|জনাবা|ডাঃ|ড\.)\s*/, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const matchedRep = localEmps.find((e: Employee) => 
      cleanName(e.name) === cleanName(order.employeeName) || 
      (e.bankId && order.employeeName.includes(e.bankId))
    );
    
    if (matchedRep) {
      setUserSelectedPayeeId(matchedRep.id.toString());
    }
    
    if (order.cellName) {
      const matchedCell = cells.find((c: Cell) => c.name === order.cellName);
      if (matchedCell) {
        setSelectedCell(matchedCell.id.toString());
      } else {
        setSelectedCell('all');
      }
    } else {
      setSelectedCell('all');
    }
    
    setUserSelectedPrintCategory(order.category as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT');
    const nameMatches = matchedRep ? isNameMatchingRef(matchedRep.name, order.orderRef) : false;
    setUserCustomOrderRef(nameMatches ? order.orderRef : null);
    setOriginalOrderRef(order.orderRef);
    setUserCustomOrderDate(order.orderDate);
    
    if (order.content) {
      setUserCustomOrderText(order.content.orderText || '');
      setSigningOfficer(order.content.signingOfficer || '');
      setSigningDesignation(order.content.signingDesignation || '');
      if (Array.isArray(order.content.copies)) {
        setCopies(order.content.copies);
      }
    }
    
    let list: Duty[] = [];
    try {
      const res = await fetch(`/api/duties?orderRef=${encodeURIComponent(order.orderRef)}&includeArchived=true`);
      if (res.ok) {
        const data = await res.json();
        list = Array.isArray(data) ? data : [];
      }
    } catch (err) {
      logger.error('Error loading duties for preview:', err);
    }

    if (list.length === 0 && order.duties && order.duties.length > 0) {
      const category = order.category as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
      let allowance1 = 100;
      let allowance2 = 200;
      let totalBill = 300;
      if (category === 'HOLIDAY') {
        allowance1 = 250;
        allowance2 = 250;
        totalBill = 500;
      } else if (category === 'NIGHT_SHIFT') {
        allowance1 = 600;
        allowance2 = 400;
        totalBill = 1000;
      }

      const reconstructed: Duty[] = [];
      order.duties.forEach((group: OrderDuty) => {
        const finalEmpId = typeof group.employeeId === 'string' ? parseInt(group.employeeId, 10) : group.employeeId;
        const matchedEmp = employees.find(e => e.id === finalEmpId);
        const datesList = group.dates || [];
        
        datesList.forEach((date: string) => {
          reconstructed.push({
            id: Math.random(),
            employeeId: finalEmpId || 0,
            date: date,
            type: category,
            description: group.description || null,
            allowance1,
            allowance2,
            totalBill,
            orderRef: order.orderRef,
            employee: matchedEmp || {
              id: finalEmpId || 0,
              name: group.employeeName || '',
              designation: group.designation || '',
              cellId: matchedRep ? matchedRep.cellId : 7,
              bankId: null,
              fileNo: null,
              mobile: null,
              cell: { id: matchedRep ? matchedRep.cellId : 7, name: group.cellName || 'General', description: null }
            }
          });
        });
      });
      list = reconstructed;
    }

    setDuties(list);
    
    const assignments: Record<number, string[]> = {};
    list.forEach(d => {
      if (!assignments[d.employeeId]) {
        assignments[d.employeeId] = [];
      }
      if (!assignments[d.employeeId].includes(d.date)) {
        assignments[d.employeeId].push(d.date);
      }
    });
    setOpt1Assignments(assignments);
    
    setOrderGenerated(true);
    setIsArchived(true);
    setIsPrintMode(true);
  };

  const handleDeleteOfficeOrder = (orderId: number, refNo: string) => {
    setOrderToDelete({ id: orderId, refNo });
  };

  const confirmDeleteOfficeOrder = async () => {
    if (!orderToDelete) return;
    const { id: orderId } = orderToDelete;
    
    try {
      const res = await fetch(`/api/office-orders/${orderId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert('অফিস আদেশটি সফলভাবে মুছে ফেলা হয়েছে এবং ডিউটিগুলো আবার অপেক্ষমাণ তালিকায় ফিরে গেছে।');
        loadDuties();
        loadOfficeOrders();
      } else {
        const data = await res.json();
        alert(`মুছে ফেলতে ব্যর্থ হয়েছে: ${data.message || data.error || 'অজানা ত্রুটি'}`);
      }
    } catch (err) {
      logger.error('Error deleting office order:', err);
      alert('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setOrderToDelete(null);
    }
  };

  const handleBackToRoster = () => {
    setIsPrintMode(false);
    if (isEditingArchive) {
      setIsEditingArchive(false);
      window.history.pushState({}, '', '/roster');
      setTimeout(() => {
        loadDuties();
      }, 50);
    }
  };

  // Load archived order for editing on mount if edit_ref is in query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editRef = params.get('edit_ref');
      if (editRef) {
        logger.info("Loading archived order for editing:", editRef);
        
        const loadArchivedDuties = async () => {
          try {
            const [empRes, cellRes, orderRes, dutiesRes] = await Promise.all([
              fetch('/api/employees'),
              fetch('/api/cells'),
              fetch('/api/office-orders'),
              fetch(`/api/duties?orderRef=${encodeURIComponent(editRef)}&includeArchived=true`)
            ]);
            
            const localEmps = await empRes.json();
            const localCells = await cellRes.json();
            const orders = await orderRes.json();
            const dbDutiesList = dutiesRes.ok ? await dutiesRes.json() : [];
            const dbDuties = Array.isArray(dbDutiesList) ? dbDutiesList : [];
            
            const sortedLocalEmps = Array.isArray(localEmps) ? sortEmployeesBySeniority(localEmps) : [];
            
            setEmployees(sortedLocalEmps);
            setCells(localCells);
            if (Array.isArray(localCells) && localCells.length > 0) {
              setOpt1CellId(localCells[0].id.toString());
            }
            
            const matchingOrder = orders.find((o: OfficeOrder) => o.orderRef === editRef);
            if (matchingOrder) {
              const orderDuties = matchingOrder.duties || [];
              setUserSelectedPrintCategory(matchingOrder.category as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT');
              
              const cleanName = (n: string) => (n || '').replace(/^(জনাব|জনাবা|ডাঃ|ড\.)\s*/, '').replace(/\s+/g, ' ').trim().toLowerCase();
              
              const matchedRep = localEmps.find((e: Employee) => 
                cleanName(e.name) === cleanName(matchingOrder.employeeName) || 
                (e.bankId && matchingOrder.employeeName.includes(e.bankId))
              );
              if (matchedRep) {
                setUserSelectedPayeeId(matchedRep.id.toString());
              }
              
              let matchedCell: Cell | undefined = undefined;
              if (matchingOrder.cellName) {
                matchedCell = localCells.find((c: Cell) => c.name === matchingOrder.cellName);
                if (matchedCell) {
                  setSelectedCell(matchedCell.id.toString());
                }
              }
              
              const orderMonthsSet = new Set<string>();
              orderDuties.forEach((group: OrderDuty) => {
                if (Array.isArray(group.dates)) {
                  group.dates.forEach((date: string) => {
                    if (date && date.includes('-')) {
                      const ym = date.substring(0, 7);
                      orderMonthsSet.add(ym);
                    }
                  });
                }
              });
              
              if (orderMonthsSet.size > 0) {
                setSelectedMonths(Array.from(orderMonthsSet).sort());
              }
              
              const nameMatches = matchedRep ? isNameMatchingRef(matchedRep.name, editRef) : false;
              setUserCustomOrderRef(nameMatches ? editRef : null);
              setOriginalOrderRef(editRef);
              setUserCustomOrderDate(matchingOrder.orderDate);
              
              if (matchingOrder.content) {
                setUserCustomOrderText(matchingOrder.content.orderText || '');
                setSigningOfficer(matchingOrder.content.signingOfficer || '');
                setSigningDesignation(matchingOrder.content.signingDesignation || '');
                if (Array.isArray(matchingOrder.content.copies)) {
                  setCopies(matchingOrder.content.copies);
                }
              }
              
              const assignments: Record<number, string[]> = {};
              orderDuties.forEach((group: OrderDuty) => {
                const matchedEmp = localEmps.find((e: Employee) => 
                  e.id.toString() === group.employeeId?.toString() || 
                  (e.bankId && group.employeeId && e.bankId.toString() === group.employeeId.toString()) || 
                  cleanName(e.name) === cleanName(group.employeeName || '')
                );
                if (matchedEmp) {
                  assignments[matchedEmp.id] = group.dates || [];
                }
              });
              setOpt1Assignments(assignments);
              
              const reconstructedDuties: Duty[] = [];
              orderDuties.forEach((group: OrderDuty) => {
                const matchedEmp = localEmps.find((e: Employee) => 
                  e.id.toString() === group.employeeId?.toString() || 
                  (e.bankId && group.employeeId && e.bankId.toString() === group.employeeId.toString()) || 
                  cleanName(e.name) === cleanName(group.employeeName || '')
                );
                const finalEmpId = matchedEmp ? matchedEmp.id : Number(group.employeeId) || 0;
                const finalDates = group.dates || [];
                const category = matchingOrder.category as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
                
                let allowance1 = 0;
                let allowance2 = 0;
                let totalBill = 0;
                if (category === 'LATE_SITTING') {
                  allowance1 = 100;
                  allowance2 = 200;
                  totalBill = 300;
                } else if (category === 'HOLIDAY') {
                  allowance1 = 250;
                  allowance2 = 250;
                  totalBill = 500;
                } else if (category === 'NIGHT_SHIFT') {
                  allowance1 = 600;
                  allowance2 = 400;
                  totalBill = 1000;
                }

                finalDates.forEach((date: string) => {
                  const dbDuty = dbDuties.find((d: Duty) => d.employeeId === finalEmpId && d.date === date && d.type === category);
                  reconstructedDuties.push({
                    id: dbDuty ? dbDuty.id : Math.random(),
                    employeeId: finalEmpId,
                    date: date,
                    type: category,
                    description: group.description || null,
                    allowance1,
                    allowance2,
                    totalBill,
                    employee: matchedEmp || {
                      id: finalEmpId,
                      name: group.employeeName,
                      designation: group.designation,
                      cellId: matchedRep ? matchedRep.cellId : 7
                    }
                  });
                });
              });
              setDuties(reconstructedDuties);
              setInitialRosterValues({
                printCategory: matchingOrder.category as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT',
                payeeEmployeeId: matchedRep ? matchedRep.id.toString() : '',
                selectedCell: matchedCell ? matchedCell.id.toString() : 'all',
                selectedMonths: Array.from(orderMonthsSet).sort(),
                orderRef: editRef,
                orderDate: matchingOrder.orderDate,
                orderText: matchingOrder.content?.orderText || '',
                signingOfficer: matchingOrder.content?.signingOfficer || '',
                signingDesignation: matchingOrder.content?.signingDesignation || '',
                copies: Array.isArray(matchingOrder.content?.copies) ? [...matchingOrder.content.copies] : [],
                opt1Assignments: JSON.parse(JSON.stringify(assignments))
              });
              if (matchingOrder.status === 'Generated' || matchingOrder.status === 'Modified' || matchingOrder.status === 'Generated & Printed' || matchingOrder.status === 'Printed') {
                setOrderGenerated(true);
                setIsArchived(true);
              } else {
                setOrderGenerated(false);
                setIsArchived(false);
              }
            }
          } catch (e) {
            logger.error("Failed to load archived duties for editing:", e);
          } finally {
            setTimeout(() => {
              isInitializingArchiveRef.current = false;
            }, 300);
          }
        };
        isInitializingArchiveRef.current = true;
        loadArchivedDuties();
      }
    }
  }, []);

  // Sync duties in edit mode when opt1Assignments change
  useEffect(() => {
    if (isEditingArchive && employees.length > 0) {
      const newDuties: Duty[] = [];
      Object.entries(opt1Assignments).forEach(([empIdStr, dates]) => {
        const empId = Number(empIdStr);
        const emp = employees.find(e => e.id === empId);
        if (!emp) return;
        
        let allowance1 = 0;
        let allowance2 = 0;
        let totalBill = 0;
        if (printCategory === 'LATE_SITTING') {
          allowance1 = 100;
          allowance2 = 200;
          totalBill = 300;
        } else if (printCategory === 'HOLIDAY') {
          allowance1 = 250;
          allowance2 = 250;
          totalBill = 500;
        } else if (printCategory === 'NIGHT_SHIFT') {
          allowance1 = 600;
          allowance2 = 400;
          totalBill = 1000;
        }

        dates.forEach(date => {
          newDuties.push({
            id: Math.random(),
            employeeId: empId,
            date: date,
            type: printCategory,
            description: getDefaultDescription(emp.name, printCategory, emp.cell?.name),
            allowance1,
            allowance2,
            totalBill,
            employee: emp
          });
        });
      });
      queueMicrotask(() => {
        setDuties(newDuties);
      });
    }
  }, [opt1Assignments, isEditingArchive, printCategory, employees, setDuties]);

  return {
    isPrintMode,
    setIsPrintMode,
    isEditingArchive,
    setIsEditingArchive,
    orderGenerated,
    setOrderGenerated,
    isArchived,
    setIsArchived,
    activePartIdx,
    setActivePartIdx,
    signingOfficer,
    setSigningOfficer,
    signingDesignation,
    setSigningDesignation,
    copies,
    setCopies,
    selectedExecutiveId,
    setSelectedExecutiveId,
    headerMode,
    setHeaderMode,
    printCategory,
    changePrintCategory,
    userSelectedPayeeId,
    setUserSelectedPayeeId,
    userCustomOrderDate,
    setUserCustomOrderDate,
    userCustomOrderText,
    setUserCustomOrderText,
    userCustomOrderRef,
    setUserCustomOrderRef,
    originalOrderRef,
    setOriginalOrderRef,
    suggestedRef,
    refDuplicate,
    isRosterDirty,
    resetCustomOrderFields,
    getSplitParts,
    getGroupedDuties,
    payeeEmployeeId,
    orderText,
    orderDate,
    stableNumber,
    orderRef,
    getShortDesignation,
    getFormattedDateList,
    updateAssociatedBill,
    archiveOrder,
    saveOrderToArchive,
    handlePreviewOfficeOrder,
    handleDeleteOfficeOrder,
    orderToDelete,
    setOrderToDelete,
    confirmDeleteOfficeOrder,
    handleBackToRoster
  };
}
