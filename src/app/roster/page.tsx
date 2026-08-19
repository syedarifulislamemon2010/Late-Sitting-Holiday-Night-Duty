'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import logger from '@/lib/logger';
import { useProfile } from '@/context/ProfileContext';
import { useLayout, LayoutPriority } from '@/context/LayoutContext';
import { TableSkeleton } from "@/components/SkeletonLoader";
import { sortEmployeesBySeniority } from '@/lib/seniority';
import { toBanglaDigits, getBanglaNumberWords } from '@/lib/bengali-converter';
import { 
  AlertCircle, 
  Check, 
  CheckCircle, 
  Eye, 
  Printer, 
  Trash2, 
  X, 
  ChevronRight 
} from 'lucide-react';
import { 
  Cell, 
  Employee, 
  Executive, 
  Holiday, 
  OfficeOrder, 
  OrderDuty, 
  Duty, 
  getNormalizedRef, 
  isNameMatchingRef, 
  getDefaultDescription, 
  LATE_SITTING_TEMPLATE, 
  NIGHT_SHIFT_TEMPLATE, 
  HOLIDAY_TEMPLATE, 
  checkIsWorkingDay, 
  calculateOrderDate 
} from './types';
import DutyAssignmentPanel from './components/DutyAssignmentPanel';
import RosterListPanel from './components/RosterListPanel';
import OfficeOrderPrintPreview from './components/OfficeOrderPrintPreview';

export default function RosterPage() {
  const { currentUser } = useProfile();
  const { activeLayout, setLayoutPriority } = useLayout();
  const isAssignmentPrimary = activeLayout === LayoutPriority.ASSIGNMENT;
  const [orderGenerated, setOrderGenerated] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [isEditingArchive, setIsEditingArchive] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return !!params.get('edit_ref');
    }
    return false;
  });
  const [officeOrders, setOfficeOrders] = useState<OfficeOrder[]>([]);
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
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };
  const [msgBanner, setMsgBanner] = useState<{ type: 'success' | 'cancel'; text: string } | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [suggestedRef, setSuggestedRef] = useState('');
  const [refDuplicate, setRefDuplicate] = useState(false);
  const [preConflicts, setPreConflicts] = useState<Array<{ date: string; type: string; message: string }>>([]);
  const [billSuggestion, setBillSuggestion] = useState<{ ref: string; category: string } | null>(null);
  
  // Edit/Update Duty states
  const [editingDuty, setEditingDuty] = useState<Duty | null>(null);
  const [editingDuties, setEditingDuties] = useState<Duty[]>([]);

  // Filters state
  const [selectedCell, setSelectedCell] = useState('all');
  const [selectedMonths, setSelectedMonths] = useState<string[]>(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return [`${today.getFullYear()}-${mm}`];
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const isUserCellInitializedRef = useRef(false);

  // Duty assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    selectedEmployeeIds: [] as number[],
    type: '' as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' | '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Conflict modal and bulk selection states
  const [conflictModalData, setConflictModalData] = useState<{
    message: string;
    details?: any;
    assignments: any[];
  } | null>(null);
  const [selectedDutyIds, setSelectedDutyIds] = useState<number[]>([]);

  // Filter form employees list based on search or cell
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [formCellFilter, setFormCellFilter] = useState('all');

  // Entry mode: EMPLOYEE_WISE or DATE_WISE
  const [entryMode, setEntryMode] = useState<'EMPLOYEE_WISE' | 'DATE_WISE'>('EMPLOYEE_WISE');
  
  // Option 1 states
  const [opt1CellId, setOpt1CellId] = useState<string>('all');
  const [opt1SearchQuery, setOpt1SearchQuery] = useState<string>('');
  const [opt1Assignments, setOpt1Assignments] = useState<Record<number, string[]>>({});
  const [opt1ViewedMonths, setOpt1ViewedMonths] = useState<Record<number, string>>({});

  // Unsaved Changes Tracking for Sidebar Warning
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasUnsavedAssignments = (entryMode === 'EMPLOYEE_WISE' && Object.keys(opt1Assignments).length > 0) || (entryMode === 'DATE_WISE' && (assignmentForm.selectedEmployeeIds.length > 0 || assignmentForm.date));
      (window as any).__unsavedChanges = isEditingArchive || !!editingDuty || !!hasUnsavedAssignments;
    }
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).__unsavedChanges = false;
      }
    };
  }, [isEditingArchive, editingDuty, opt1Assignments, assignmentForm.selectedEmployeeIds, assignmentForm.date, entryMode]);

  // Office Order (জিও) custom edit fields
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [originalOrderRef, setOriginalOrderRef] = useState('');
  const [activePartIdx, setActivePartIdx] = useState(0);

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

  const [signingOfficer, setSigningOfficer] = useState('জনাব মোহাম্মদ সোহরাব হোসেন');
  const [signingDesignation, setSigningDesignation] = useState('উপ-মহাব্যবস্থাপক');
  const [copies, setCopies] = useState<string[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string>('');
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // New customizable parameters for Janata Bank Office Order
  const [userSelectedPrintCategory, setUserSelectedPrintCategory] = useState<'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' | null>(null);

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
    setActivePartIdx(0);
    setUserSelectedPayeeId(null);
    setUserCustomOrderText(null);
    setUserCustomOrderRef(null);
    setOrderGenerated(false);
  };

  const changeSelectedCell = (cellId: string) => {
    setSelectedCell(cellId);
    setOpt1CellId(cellId);
    setFormCellFilter(cellId);
    setActivePartIdx(0);
    setUserSelectedPayeeId(null);
    setUserCustomOrderText(null);
    setUserCustomOrderRef(null);
    setOrderGenerated(false);
    setSelectedEmployee('all');
  };

  const changeSelectedMonths = (months: string[] | ((prev: string[]) => string[])) => {
    setSelectedMonths(months);
    setActivePartIdx(0);
    setUserSelectedPayeeId(null);
    setUserCustomOrderText(null);
    setUserCustomOrderRef(null);
    setOrderGenerated(false);
  };

  const [userSelectedPayeeId, setUserSelectedPayeeId] = useState<string | null>(null);
  const [userCustomOrderDate, setUserCustomOrderDate] = useState<string | null>(null);
  const [userCustomOrderText, setUserCustomOrderText] = useState<string | null>(null);
  const [userCustomOrderRef, setUserCustomOrderRef] = useState<string | null>(null);

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
  }, [duties, selectedCell, printCategory, isEditingArchive, isPrintMode, originalOrderRef, activePartIdx]);

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
  }, [userCustomOrderRef, isArchived, duties, selectedCell, printCategory, payeeEmployeeId, employees, isEditingArchive, originalOrderRef, stableNumber, activePartIdx, getGroupedDuties, orderDate, initialRosterValues]);

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

    // Compare opt1Assignments
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

  useEffect(() => {
    if (isPrintMode && printCategory) {
      fetch(`/api/office-orders/next-ref?category=${printCategory}`)
        .then(res => res.json())
        .then(data => {
          if (data.nextRef) setSuggestedRef(data.nextRef);
        })
        .catch(err => console.error(err));
    }
  }, [isPrintMode, printCategory]);

  useEffect(() => {
    if (orderRef) {
      const isDupe = officeOrders.some(o => o.orderRef === orderRef && o.orderRef !== originalOrderRef);
      setRefDuplicate(isDupe);
    } else {
      setRefDuplicate(false);
    }
  }, [orderRef, officeOrders, originalOrderRef]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      let conflicts: any[] = [];
      const type = assignmentForm.type;
      if (!type) return setPreConflicts([]);

      if (entryMode === 'DATE_WISE') {
        const { date, selectedEmployeeIds } = assignmentForm;
        if (!date || selectedEmployeeIds.length === 0) return setPreConflicts([]);
        for (const empId of selectedEmployeeIds) {
          try {
            const res = await fetch('/api/duties/check-conflicts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ employeeId: empId, dates: [date], type })
            });
            const data = await res.json();
            if (data.conflicts && data.conflicts.length > 0) {
              conflicts.push(...data.conflicts);
            }
          } catch (e) {}
        }
      } else {
        const entries = Object.entries(opt1Assignments);
        if (entries.length === 0) return setPreConflicts([]);
        for (const [empId, dates] of entries) {
          if (!dates || dates.length === 0) continue;
          try {
            const res = await fetch('/api/duties/check-conflicts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ employeeId: Number(empId), dates, type })
            });
            const data = await res.json();
            if (data.conflicts && data.conflicts.length > 0) {
              conflicts.push(...data.conflicts);
            }
          } catch (e) {}
        }
      }
      setPreConflicts(conflicts);
    }, 500);

    return () => clearTimeout(handler);
  }, [assignmentForm.date, assignmentForm.selectedEmployeeIds, assignmentForm.type, opt1Assignments, entryMode]);

  const [headerMode, setHeaderMode] = useState<'with_header' | 'without_header'>('with_header');

  const getShortDesignation = (desig: string | undefined | null) => {
    if (!desig) return '';
    const match = desig.match(/\(([^)]+)\)/);
    return match ? match[1] : desig;
  };

  const getFormattedDateList = (dates: string[]) => {
    return dates
      .sort()
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
          datesFormatted: s.dates.sort().map(d => toBanglaDigits(d.split('-').reverse().join('-'))).join(', ')
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
      setSubmitting(true);
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
    } finally {
      setSubmitting(false);
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
    
    let list: any[] = [];
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

      const reconstructed: any[] = [];
      order.duties.forEach((group: any) => {
        const finalEmpId = typeof group.employeeId === 'string' ? parseInt(group.employeeId, 10) : group.employeeId;
        const matchedEmp = employees.find(e => e.id === finalEmpId);
        const datesList = group.dates || [];
        
        datesList.forEach((date: string) => {
          reconstructed.push({
            id: Math.random(),
            employeeId: finalEmpId,
            date: date,
            type: category,
            description: group.description || null,
            allowance1,
            allowance2,
            totalBill,
            orderRef: order.orderRef,
            employee: matchedEmp || {
              id: finalEmpId,
              name: group.employeeName,
              designation: group.designation,
              cellId: matchedRep ? matchedRep.cellId : 7
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

  const handleDeleteOfficeOrder = async (orderId: number, refNo: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে স্মারক নং: ${refNo} এর অফিস আদেশটি মুছে ফেলতে চান? এটি মুছে ফেললে এর সাথে সম্পর্কিত ডিউটিগুলো আবার অপেক্ষমাণ তালিকায় ফিরে যাবে।`)) {
      return;
    }
    
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
    }
  };

  async function loadData() {
    setIsLoading(true);
    try {
      const [empRes, cellRes, execRes, holidayRes, leavesRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/cells'),
        fetch('/api/executives'),
        fetch('/api/holidays'),
        fetch('/api/leaves')
      ]);
      const empData = await empRes.json();
      const cellData = await cellRes.json();
      const execData = await execRes.json();
      const holidayData = await holidayRes.json();
      const leavesData = await leavesRes.json();
      
      const sortedEmps = Array.isArray(empData) ? sortEmployeesBySeniority(empData) : [];
      setEmployees(sortedEmps);
      const cellsList = Array.isArray(cellData) ? cellData : [];
      setCells(cellsList);
      if (cellsList.length > 0) {
        const defaultCell = (!currentUser || currentUser.role === 'ADMIN' || (currentUser.cells && currentUser.cells.length > 1))
          ? 'all'
          : (currentUser.cells && currentUser.cells[0] ? currentUser.cells[0].id.toString() : cellsList[0].id.toString());
        setOpt1CellId(defaultCell);
        setFormCellFilter(defaultCell);
      }
      setHolidays(Array.isArray(holidayData) ? holidayData : []);
      setLeaves(Array.isArray(leavesData) ? leavesData : []);
      
      if (Array.isArray(execData)) {
        const dgmExecs = execData.filter((ex: Executive) => {
          const d = ex.designation.trim().toLowerCase();
          return d.includes('dgm') || d.includes('ডিজিএম') || d.includes('উপ-মহাব্যবস্থাপক');
        });

        const desigPriority: Record<string, number> = {
          'উপ-মহাব্যবস্থাপক': 1
        };
        const sortedExecs = [...dgmExecs].sort((a, b) => {
          const prioA = desigPriority[a.designation] || 99;
          const prioB = desigPriority[b.designation] || 99;
          if (prioA !== prioB) return prioA - prioB;
          return (a.fileNo || '').localeCompare(b.fileNo || '', undefined, { numeric: true, sensitivity: 'base' });
        });
        setExecutives(sortedExecs);
        if (sortedExecs.length > 0) {
          const defaultExec = sortedExecs.find((ex: Executive) => ex.name.includes('মোহাম্মদ সোহরাব হোসেন') || ex.designation.includes('উপ-মহাব্যবস্থাপক')) || sortedExecs[0];
          if (defaultExec) {
            setSelectedExecutiveId(defaultExec.id.toString());
            setSigningOfficer(defaultExec.name);
            setSigningDesignation(defaultExec.designation);
          }
        }
      }
    } catch (err) {
      logger.error('Error loading static data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const loadDuties = useCallback(async () => {
    if (isEditingArchive) return;
    if (isArchived && isPrintMode) return;
    try {
      let queryUrl = `/api/duties?`;
      if (isArchived && orderRef) {
        queryUrl += `orderRef=${encodeURIComponent(orderRef)}&includeArchived=true`;
      } else {
        if (selectedMonths.length > 0) {
          const sortedMonths = [...selectedMonths].sort();
          const startYrMn = sortedMonths[0];
          const endYrMn = sortedMonths[sortedMonths.length - 1];
          
          const [startY, startM] = startYrMn.split('-');
          const [endY, endM] = endYrMn.split('-');
          
          const startDate = `${startY}-${startM}-01`;
          const lastDay = new Date(parseInt(endY, 10), parseInt(endM, 10), 0).getDate();
          const endDate = `${endY}-${endM}-${String(lastDay).padStart(2, '0')}`;
          
          queryUrl += `startDate=${startDate}&endDate=${endDate}&`;
        }
        
        if (selectedCell !== 'all') {
          queryUrl += `cellId=${selectedCell}`;
        }
      }
      
      const res = await fetch(queryUrl);
      const data = await res.json();
      const activeList = Array.isArray(data) ? data : [];

      let filteredList = activeList;
      if (selectedMonths.length > 0 && !isEditingArchive && !isPrintMode && !isArchived) {
        filteredList = activeList.filter(d => {
          if (!d.orderRef) return true;
          if (!d.date) return false;
          const ym = d.date.substring(0, 7);
          return selectedMonths.includes(ym);
        });
      }
      
      setDuties(filteredList);
    } catch (err) {
      logger.error('Error loading duties:', err);
    }
  }, [isEditingArchive, selectedMonths, selectedCell, isPrintMode, isArchived, orderRef]);

  const loadOfficeOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/office-orders');
      if (res.ok) {
        const data = await res.json();
        setOfficeOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      logger.error('Error loading office orders:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentUser && !isUserCellInitializedRef.current) {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const hasEditRef = params ? !!params.get('edit_ref') : false;
      
      if (!hasEditRef && currentUser.role !== 'ADMIN') {
        if (currentUser.cells && currentUser.cells.length === 1) {
          const pIdStr = currentUser.cells[0].id.toString();
          setSelectedCell(pIdStr);
          setOpt1CellId(pIdStr);
          setFormCellFilter(pIdStr);
        } else {
          setSelectedCell('all');
          setOpt1CellId('all');
          setFormCellFilter('all');
        }
      }
      isUserCellInitializedRef.current = true;
    }
  }, [currentUser]);

  useEffect(() => {
    loadDuties();
    loadOfficeOrders();
  }, [selectedMonths, selectedCell, isEditingArchive, orderRef, loadDuties, loadOfficeOrders]);

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
                  const dbDuty = dbDuties.find(d => d.employeeId === finalEmpId && d.date === date && d.type === category);
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
  }, []);

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
  }, [opt1Assignments, isEditingArchive, printCategory, employees]);

  const handleBulkDutyImport = async (entries: { bankId: string; employeeName: string; dates: string[] }[]) => {
    const assignmentsToImport: any[] = [];
    const targetType = assignmentForm.type || 'LATE_SITTING';
    
    for (const entry of entries) {
      const emp = employees.find(e => e.bankId && e.bankId.trim() === entry.bankId.trim());
      if (emp) {
        const cellName = emp.cell?.name || '';
        for (const date of entry.dates) {
          assignmentsToImport.push({
            employeeId: emp.id,
            type: targetType,
            date: date,
            description: getDefaultDescription(emp.name, targetType, cellName)
          });
        }
      }
    }

    if (assignmentsToImport.length === 0) {
      alert('দুঃখিত, স্ক্যান করা কোনো কর্মকর্তার ব্যাংক আইডি প্রজেক্টের কর্মকর্তাদের তালিকার সাথে মেলেনি।');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      const res = await fetch('/api/duties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assignments: assignmentsToImport
        })
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 409) {
          setErrorMessage(err.message || 'ডিউটি সংঘর্ষ বা ছুটি ওভারল্যাপ হয়েছে।');
          showToast(err.message || 'ডিউটি সংঘর্ষ বা ছুটি ওভারল্যাপ হয়েছে।', 'error');
        } else {
          setErrorMessage(err.error || 'ডিউটি ইম্পোর্ট করতে ব্যর্থ হয়েছে।');
          alert(err.error || 'ডিউটি ইম্পোর্ট করতে ব্যর্থ হয়েছে।');
        }
      } else {
        alert('রোস্টার ডিউটি সফলভাবে ইম্পোর্ট ও সংরক্ষণ করা হয়েছে!');
        loadDuties();
      }
    } catch (err) {
      logger.error(err);
      alert('ডিউটি ইম্পোর্ট করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverwriteAndSave = async () => {
    if (!conflictModalData || !conflictModalData.assignments) return;
    try {
      setSubmitting(true);
      const assignments = conflictModalData.assignments;
      setConflictModalData(null);

      const res = await fetch('/api/duties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assignments,
          overwriteConflicts: true,
          orderRef: isEditingArchive ? orderRef : undefined,
          originalOrderRef: isEditingArchive ? originalOrderRef : undefined
        })
      });

      if (res.ok) {
        showToast('কনফ্লিক্টিং ডাটা প্রতিস্থাপন করে নতুন ডাটা সফলভাবে সংরক্ষিত হয়েছে!', 'success');
        if (entryMode === 'EMPLOYEE_WISE') {
          setOpt1Assignments({});
        } else {
          setAssignmentForm(prev => ({ ...prev, selectedEmployeeIds: [] }));
        }
        await loadDuties();
      } else {
        const err = await res.json();
        setErrorMessage(err.message || err.error || 'ডাটা সেভ করতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      logger.error(err);
      setErrorMessage('একটি নেটওয়ার্ক সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedirectToConflictingDuties = () => {
    setConflictModalData(null);
    const tableEl = document.getElementById('duties-table-container');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBulkDeleteDuties = async () => {
    if (selectedDutyIds.length === 0) return;
    if (!window.confirm(`আপনি কি নিশ্চিত যে নির্বাচিত ${toBanglaDigits(selectedDutyIds.length)} টি ডিউটি মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      setSubmitting(true);
      await Promise.all(selectedDutyIds.map(id => fetch(`/api/duties/${id}`, { method: 'DELETE' })));
      showToast('নির্বাচিত ডিউটিগুলো সফলভাবে মুছে ফেলা হয়েছে।', 'success');
      setSelectedDutyIds([]);
      await loadDuties();
    } catch (err) {
      logger.error(err);
      alert('ডিউটি মুছে ফেলতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (editingDuty) {
      let assignments: {
        employeeId: number;
        type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
        date: string;
        description: string;
      }[] = [];

      if (entryMode === 'EMPLOYEE_WISE') {
        const activeEmployeeIds = Object.keys(opt1Assignments).map(Number);
        for (const empId of activeEmployeeIds) {
          const empDates = opt1Assignments[empId] || [];
          if (empDates.length > 0) {
            const emp = employees.find(e => e.id === empId);
            const cellName = emp?.cell?.name || '';
            empDates.forEach(dateStr => {
              assignments.push({
                employeeId: empId,
                type: assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT',
                date: dateStr,
                description: assignmentForm.description.trim() || getDefaultDescription(emp?.name, assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT', cellName)
              });
            });
          }
        }
      } else {
        const employeeId = assignmentForm.selectedEmployeeIds[0];
        const emp = employees.find(e => e.id === employeeId);
        const cellName = emp?.cell?.name || '';
        assignments = [{
          employeeId,
          type: assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT',
          date: assignmentForm.date,
          description: assignmentForm.description.trim() || getDefaultDescription(emp?.name, assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT', cellName)
        }];
      }

      const preservedOrderRef = editingDuties.find(d => d.orderRef)?.orderRef || null;

      for (const assign of assignments) {
        const emp = employees.find(e => e.id === assign.employeeId);
        if (emp && emp.bankId) {
          const conflict = leaves.find(l => 
            l.bankId === emp.bankId && 
            l.startDate <= assign.date && 
            l.endDate >= assign.date
          );
          if (conflict) {
            const leaveTypeBn = conflict.leaveType === 'CASUAL' ? 'নৈমিত্তিক ছুটি' : 
                                conflict.leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : 
                                'কর্মস্থল ত্যাগসহ নৈমিত্তিক';
            const formattedDate = assign.date.split('-').reverse().join('-');
            setErrorMessage(`দুঃখিত, ${emp.name} কর্মকর্তাটি ${toBanglaDigits(formattedDate)} তারিখে ছুটিতে (${leaveTypeBn}) আছেন। ওই তারিখে তার জন্য ডিউটি বরাদ্দ করা সম্ভব নয়।`);
            return;
          }
        }
      }

      try {
        setSubmitting(true);

        const res = await fetch('/api/duties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            assignments,
            dutiesToDelete: editingDuties.map(d => d.id),
            orderRef: preservedOrderRef || undefined
          })
        });

        if (!res.ok) {
          const err = await res.json();
          let msg = 'ডিউটি আপডেট করতে ব্যর্থ হয়েছে।';
          if (res.status === 409) {
            msg = err.message || 'ডিউটি সংঘর্ষ বা ছুটি ওভারল্যাপ হয়েছে।';
            showToast(msg, 'error');
          } else if (err.error === 'late_sitting_on_holiday') {
            msg = 'ছুটির দিনে লেট সিটিং ডিউটি দেওয়া সম্ভব নয়।';
          } else if (err.error === 'holiday_duty_on_working_day') {
            msg = 'কার্যদিবসে সরকারি ছুটির ডিউটি দেওয়া সম্ভব নয়।';
          } else if (err.error === 'late_sitting_night_shift_conflict') {
            msg = 'একই কার্যদিবসে লেট সিটিং ও নাইট শিফট ডিউটি একসাথে বরাদ্দ করা সম্ভব নয়।';
          } else if (err.error === 'duplicate_duty_on_date') {
            msg = err.message || 'এই তারিখের মধ্যে কোনো কোনো কর্মকর্তার জন্য ইতিমধ্যে অন্য ডিউটি বা লেট সিটিং বরাদ্দ আছে। ডুপ্লিকেট এন্ট্রি করা সম্ভব নয়।';
          } else if (err.error === 'leave_conflict') {
            msg = 'উক্ত কর্মকর্তা ওই তারিখে ছুটিতে আছেন। ছুটিতে থাকাকালীন ডিউটি বরাদ্দ করা সম্ভব নয়।';
          } else if (err.error === 'duty_not_found') {
            msg = 'ডিউটি রেকর্ডটি খুঁজে পাওয়া যায়নি।';
          }
          setErrorMessage(msg);
          setSubmitting(false);
          return;
        }

        const submittedMonths = Array.from(new Set(assignments.map(a => a.date.substring(0, 7))));
        setSelectedMonths(prev => {
          const next = [...prev];
          submittedMonths.forEach(m => {
            if (!next.includes(m)) {
              next.push(m);
            }
          });
          return next;
        });

        handleCancelEdit();
        loadDuties();
        alert('ডিউটি সফলভাবে আপডেট করা হয়েছে!');
      } catch (err) {
        logger.error('Error updating duty:', err);
        setErrorMessage('সার্ভার কানেকশন ব্যর্থ হয়েছে।');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    
    let assignments: {
      employeeId: number;
      type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
      date: string;
      description: string;
    }[] = [];

    if (isEditingArchive) {
      if (duties.length === 0) {
        setErrorMessage('ডিউটি বরাদ্দ করার জন্য অন্তত একটি তারিখ ও কর্মকর্তা নির্বাচন করুন।');
        return;
      }
      assignments = duties.map(d => ({
        employeeId: d.employeeId,
        type: printCategory,
        date: d.date,
        description: d.description || getDefaultDescription(d.employee?.name, printCategory, d.employee?.cell?.name)
      }));
    } else {
      if (entryMode === 'EMPLOYEE_WISE') {
        const activeEmployeeIds = Object.keys(opt1Assignments).map(Number);
        if (activeEmployeeIds.length === 0) {
          setErrorMessage('ডিউটি বরাদ্দ করার জন্য অন্তত একজন কর্মকর্তা নির্বাচন করুন।');
          return;
        }

        let hasDates = false;
        for (const empId of activeEmployeeIds) {
          if (opt1Assignments[empId] && opt1Assignments[empId].length > 0) {
            hasDates = true;
            const emp = employees.find(e => e.id === empId);
            const cellName = emp?.cell?.name || '';
            opt1Assignments[empId].forEach(dateStr => {
              assignments.push({
                employeeId: empId,
                type: assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT',
                date: dateStr,
                description: getDefaultDescription(emp?.name, assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT', cellName)
              });
            });
          }
        }

        if (!hasDates) {
          setErrorMessage('নির্বাচিত কর্মকর্তাদের জন্য অন্তত একটি তারিখ নির্বাচন করুন।');
          return;
        }
      } else {
        if (assignmentForm.selectedEmployeeIds.length === 0) {
          setErrorMessage('ডিউটি বরাদ্দ করার জন্য অন্তত একজন কর্মকর্তা নির্বাচন করুন।');
          return;
        }
        
        if (!assignmentForm.date) {
          setErrorMessage('ডিউটির তারিখ নির্বাচন করুন।');
          return;
        }

        assignments = assignmentForm.selectedEmployeeIds.map(empId => {
          const emp = employees.find(e => e.id === empId);
          const cellName = emp?.cell?.name || '';
          return {
            employeeId: empId,
            type: assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT',
            date: assignmentForm.date,
            description: getDefaultDescription(emp?.name, assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT', cellName)
          };
        });
      }
    }

    for (const assign of assignments) {
      const emp = employees.find(e => e.id === assign.employeeId);
      if (emp && emp.bankId) {
        const conflict = leaves.find(l => 
          l.bankId === emp.bankId && 
          l.startDate <= assign.date && 
          l.endDate >= assign.date
        );
        if (conflict) {
          const leaveTypeBn = conflict.leaveType === 'CASUAL' ? 'নৈমিত্তিক ছুটি' : 
                              conflict.leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : 
                              'কর্মস্থল ত্যাগসহ নৈমিত্তিক';
          const formattedDate = assign.date.split('-').reverse().join('-');
          setErrorMessage(`দুঃখিত, ${emp.name} কর্মকর্তাটি ${toBanglaDigits(formattedDate)} তারিখে ছুটিতে (${leaveTypeBn}) আছেন। ওই তারিখে তার জন্য ডিউটি বরাদ্দ করা সম্ভব নয়।`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);

      const res = await fetch('/api/duties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assignments,
          orderRef: isEditingArchive ? orderRef : undefined,
          originalOrderRef: isEditingArchive ? originalOrderRef : undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 409) {
          setConflictModalData({
            message: err.message || 'এই তারিখের মধ্যে কোনো কোনো কর্মকর্তার জন্য ইতিমধ্যে অন্য ডিউটি বা লেট সিটিং বরাদ্দ আছে।',
            details: err.details,
            assignments
          });
          setSubmitting(false);
          return;
        } else if (err.error === 'late_sitting_on_holiday') {
          setErrorMessage('ছুটির দিনে লেট সিটিং ডিউটি দেওয়া সম্ভব নয়।');
        } else if (err.error === 'holiday_duty_on_working_day') {
          setErrorMessage('কার্যদিবসে সরকারি ছুটির ডিউটি দেওয়া সম্ভব নয়।');
        } else if (err.error === 'late_sitting_night_shift_conflict') {
          setErrorMessage('একই কার্যদিবসে লেট সিটিং ও নাইট শিফট ডিউটি একসাথে বরাদ্দ করা সম্ভব নয়।');
        } else if (err.error === 'leave_conflict') {
          setErrorMessage('সংশ্লিষ্ট কর্মকর্তা উক্ত তারিখে ছুটিতে আছেন। ছুটিতে থাকা অবস্থায় ডিউটি বরাদ্দ করা সম্ভব নয়।');
        } else {
          setErrorMessage(err.error || 'রোস্টার সংরক্ষণ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
        }
        setSubmitting(false);
        return;
      }

      if (isEditingArchive) {
        const emp = employees.find(e => e.id.toString() === payeeEmployeeId);
        const payeeName = emp ? emp.name : 'Unknown';
        
        const matchedCellObj = cells.find(c => c.id.toString() === selectedCell);
        const cellName = matchedCellObj ? matchedCellObj.name : 'IT Department';
        
        const printTableDuties = getGroupedDuties();
        const payload = {
          orderRef: orderRef,
          originalOrderRef: isEditingArchive ? originalOrderRef : undefined,
          orderDate: orderDate,
          category: printCategory,
          employeeName: payeeName,
          cellName: cellName,
          duties: printTableDuties.map(group => ({
            employeeId: group.employee.id,
            employeeName: group.employee.name,
            designation: group.employee.designation,
            dates: group.dates,
            description: group.description
          })),
          dutyIds: [],
          content: {
            orderText: orderText,
            signingOfficer: signingOfficer,
            signingDesignation: signingDesignation,
            copies: copies,
            cellName: cellName
          }
        };

        const ooRes = await fetch('/api/office-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (ooRes.ok) {
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
            headerMode: headerMode
          };

          await fetch('/api/documents/generate-office-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pdfPayload)
          });
        }

        await updateAssociatedBill(orderRef, originalOrderRef);

        setIsEditingArchive(false);
        const params = new URLSearchParams(window.location.search);
        const from = params.get('from') || '/documents';
        const redirectUrl = from.includes('?') ? `${from}&msg=success` : `${from}?msg=success`;
        window.location.href = redirectUrl;
        return;
      }

      const submittedMonths = Array.from(new Set(assignments.map(a => a.date.substring(0, 7))));
      setSelectedMonths(prev => {
        const next = [...prev];
        submittedMonths.forEach(m => {
          if (!next.includes(m)) {
            next.push(m);
          }
        });
        return next;
      });

      if (entryMode === 'EMPLOYEE_WISE') {
        setOpt1Assignments({});
        setOpt1ViewedMonths({});
      } else {
        setAssignmentForm(prev => ({
          ...prev,
          selectedEmployeeIds: [],
          description: ''
        }));
      }
      
      loadDuties();
      alert('ডিউটি রোস্টার সফলভাবে সংরক্ষণ করা হয়েছে!');
    } catch (err) {
      logger.error('Error assigning roster:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg === 'duplicate_duty_on_date') {
        setErrorMessage('এই তারিখের মধ্যে কোনো কোনো কর্মকর্তার জন্য ইতিমধ্যে অন্য ডিউটি বা লেট সিটিং বরাদ্দ আছে। ডুপ্লিকেট এন্ট্রি করা সম্ভব নয়।');
        alert('এই তারিখের মধ্যে কোনো কোনো কর্মকর্তার জন্য ইতিমধ্যে অন্য ডিউটি বা লেট সিটিং বরাদ্দ আছে। ডুপ্লিকেট এন্ট্রি করা সম্ভব নয়।');
      } else if (errorMsg === 'late_sitting_on_holiday') {
        setErrorMessage('ছুটির দিনে লেট সিটিং ডিউটি দেওয়া সম্ভব নয়।');
      } else if (errorMsg === 'holiday_duty_on_working_day') {
        setErrorMessage('কার্যদিবসে সরকারি ছুটির ডিউটি দেওয়া সম্ভব নয়।');
      } else if (errorMsg === 'leave_conflict') {
        setErrorMessage('সংশ্লিষ্ট কর্মকর্তা উক্ত তারিখে ছুটিতে আছেন। ছুটিতে থাকা অবস্থায় ডিউটি বরাদ্দ করা সম্ভব নয়।');
      } else {
        setErrorMessage('রোস্টার সংরক্ষণ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGroupedDuties = async (dutiesToDelete: Duty[]) => {
    if (!confirm(`আপনি কি নিশ্চিতভাবে এই কর্মকর্তার ${toBanglaDigits(dutiesToDelete.length)} টি ডিউটি রেকর্ড মুছে ফেলতে চান?`)) return;
    try {
      await Promise.all(
        dutiesToDelete.map(d => fetch(`/api/duties/${d.id}`, { method: 'DELETE' }))
      );
      loadDuties();
      alert('ডিউটি রেকর্ডসমূহ সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (err) {
      logger.error('Error deleting duties:', err);
      alert('ডিউটি রেকর্ড মুছতে ব্যর্থ হয়েছে।');
    }
  };

  const handleStartEdit = async (dutiesList: Duty[]) => {
    if (!dutiesList || dutiesList.length === 0) return;
    const representative = dutiesList[0];
    setEditingDuty(representative);
    
    try {
      const res = await fetch(`/api/duties?employeeId=${representative.employeeId}&type=${representative.type}`);
      const fetchedDuties = await res.json();
      const pendingDutiesOfEmp = Array.isArray(fetchedDuties)
        ? fetchedDuties.filter((d: Duty) => !d.orderRef)
        : [];
      
      const dutiesToUse = pendingDutiesOfEmp.length > 0 ? pendingDutiesOfEmp : dutiesList;
      setEditingDuties(dutiesToUse);
      
      setAssignmentForm(prev => ({
        ...prev,
        type: representative.type,
        date: representative.date,
        selectedEmployeeIds: [representative.employeeId],
        description: representative.description || ''
      }));

      setEntryMode('EMPLOYEE_WISE');
      setOpt1CellId(representative.employee.cellId.toString());
      const allDates = dutiesToUse.map(d => d.date);
      setOpt1Assignments({
        [representative.employeeId]: allDates
      });
      const ym = representative.date.substring(0, 7);
      setOpt1ViewedMonths({
        [representative.employeeId]: ym
      });
    } catch (err) {
      logger.error('Error loading edit duties:', err);
      setEditingDuties(dutiesList);
      
      setAssignmentForm(prev => ({
        ...prev,
        type: representative.type,
        date: representative.date,
        selectedEmployeeIds: [representative.employeeId],
        description: representative.description || ''
      }));

      setEntryMode('EMPLOYEE_WISE');
      setOpt1CellId(representative.employee.cellId.toString());
      const allDates = dutiesList.map(d => d.date);
      setOpt1Assignments({
        [representative.employeeId]: allDates
      });
      const ym = representative.date.substring(0, 7);
      setOpt1ViewedMonths({
        [representative.employeeId]: ym
      });
    }

    setFormCellFilter(representative.employee.cellId.toString());
    setFormSearchQuery('');
    setErrorMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingDuty(null);
    setEditingDuties([]);
    setErrorMessage('');
    
    setAssignmentForm({
      selectedEmployeeIds: [],
      type: 'LATE_SITTING',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setOpt1Assignments({});
    setOpt1ViewedMonths({});
    setFormCellFilter('all');
    setFormSearchQuery('');
  };

  const handleCancelRosterEdit = () => {
    setIsEditingArchive(false);
    setUserCustomOrderRef(null);
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || '/documents';
    const redirectUrl = from.includes('?') ? `${from}&msg=cancel` : `${from}?msg=cancel`;
    window.location.assign(redirectUrl);
  };

  const isSubmitDisabled = () => {
    if (!assignmentForm.type) return true;
    if (editingDuty) {
      if (entryMode === 'EMPLOYEE_WISE') {
        const activeEmployeeIds = Object.keys(opt1Assignments).map(Number);
        if (activeEmployeeIds.length === 0) return true;
        
        let hasDates = false;
        const isLateSitting = assignmentForm.type === 'LATE_SITTING';
        const isHoliday = assignmentForm.type === 'HOLIDAY';
        for (const empId of activeEmployeeIds) {
          const empDates = opt1Assignments[empId] || [];
          if (empDates.length > 0) {
            hasDates = true;
            for (const date of empDates) {
              const isWorking = checkIsWorkingDay(date, holidays);
              if ((isLateSitting && !isWorking) || (isHoliday && isWorking)) {
                return true;
              }
            }
          }
        }
        return !hasDates;
      } else {
        if (!assignmentForm.date) return true;
        if (assignmentForm.selectedEmployeeIds.length === 0) return true;
        
        const isWorking = checkIsWorkingDay(assignmentForm.date, holidays);
        const isLateSitting = assignmentForm.type === 'LATE_SITTING';
        const isHoliday = assignmentForm.type === 'HOLIDAY';
        if ((isLateSitting && !isWorking) || (isHoliday && isWorking)) {
          return true;
        }
      }
      return false;
    }

    if (entryMode === 'EMPLOYEE_WISE') {
      const activeEmployeeIds = Object.keys(opt1Assignments).map(Number);
      if (activeEmployeeIds.length === 0) return true;
      let hasDates = false;
      for (const empId of activeEmployeeIds) {
        if (opt1Assignments[empId] && opt1Assignments[empId].length > 0) {
          hasDates = true;
          break;
        }
      }
      return !hasDates;
    } else {
      if (!assignmentForm.date) return true;
      const isWorking = checkIsWorkingDay(assignmentForm.date, holidays);
      const isLateSitting = assignmentForm.type === 'LATE_SITTING';
      const isHoliday = assignmentForm.type === 'HOLIDAY';
      if ((isLateSitting && !isWorking) || (isHoliday && isWorking)) {
        return true;
      }
      if (assignmentForm.selectedEmployeeIds.length === 0) {
        return true;
      }
      return false;
    }
  };

  const pendingDutiesCount = useMemo(() => {
    return duties.filter(d => !d.orderRef).length;
  }, [duties]);

  if (isLoading) return (
    <div className="p-6">
      <TableSkeleton rows={8} columns={5} />
    </div>
  );

  return (
    <div className="space-y-6 min-h-screen bg-slate-50/50 dark:bg-transparent -m-4 lg:-m-8 p-4 lg:p-8">
      {msgBanner && (
        <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 ${
          msgBanner.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${
              msgBanner.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
            }`}>
              {msgBanner.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            </div>
            <span className="text-sm font-semibold">{msgBanner.text}</span>
          </div>
          <button 
            onClick={() => setMsgBanner(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* NORMAL VIEW MODE */}
      {!isPrintMode ? (
        <>
          {/* Header Dashboard Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">ডিউটি রোস্টার ও অফিস আদেশ</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">কর্মকর্তাদের রোস্টার তৈরি করুন এবং সরকারি প্রটোকলে অফিস আদেশ (জিও) জেনারেট করুন।</p>
            </div>
            
            <button
              onClick={() => setIsPrintMode(true)}
              disabled={pendingDutiesCount === 0}
              className={`flex items-center justify-center gap-2 text-sm transition-all cursor-pointer ${
                pendingDutiesCount > 0 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold px-4 py-2 rounded-xl' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed px-4 py-2 rounded-xl'
              }`}
            >
              <Printer size={16} />
              অফিস আদেশ (A4 সাইজ) দেখুন ও প্রিন্ট করুন
            </button>
          </div>

          {/* Archive Editing Mode Alert Banner */}
          {isEditingArchive && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                  <AlertCircle size={18} className="animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider">আর্কাইভ সম্পাদন মোড সক্রিয়</h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                    আপনি স্মারক সূত্র নম্বর <span className="font-mono font-bold text-amber-900 dark:text-amber-300 break-all">{orderRef}</span> এর অন্তর্গত অর্ডারটি এডিট করছেন।
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditingArchive(false);
                  setUserCustomOrderRef(null);
                  window.history.pushState({}, '', '/roster');
                  loadDuties();
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
              >
                সম্পাদন মোড থেকে বের হন (নতুন অর্ডার শুরু করুন)
              </button>
            </div>
          )}

          <div className="flex flex-col xl:flex-row gap-6 items-start no-print">
            {/* LEFT COLUMN: Duty Assignment Panel */}
            <DutyAssignmentPanel
              currentUser={currentUser}
              cells={cells}
              employees={employees}
              holidays={holidays}
              leaves={leaves}
              entryMode={entryMode}
              setEntryMode={setEntryMode}
              assignmentForm={assignmentForm}
              setAssignmentForm={setAssignmentForm}
              opt1CellId={opt1CellId}
              setOpt1CellId={setOpt1CellId}
              opt1SearchQuery={opt1SearchQuery}
              setOpt1SearchQuery={setOpt1SearchQuery}
              opt1Assignments={opt1Assignments}
              setOpt1Assignments={setOpt1Assignments}
              opt1ViewedMonths={opt1ViewedMonths}
              setOpt1ViewedMonths={setOpt1ViewedMonths}
              formSearchQuery={formSearchQuery}
              setFormSearchQuery={setFormSearchQuery}
              formCellFilter={formCellFilter}
              setFormCellFilter={setFormCellFilter}
              submitting={submitting}
              errorMessage={errorMessage}
              preConflicts={preConflicts}
              editingDuty={editingDuty}
              editingDuties={editingDuties}
              isEditingArchive={isEditingArchive}
              isRosterDirty={isRosterDirty}
              isAssignmentPrimary={isAssignmentPrimary}
              onFocusPanel={() => setLayoutPriority(LayoutPriority.ASSIGNMENT)}
              handleSubmit={handleAssignmentSubmit}
              handleCancelEdit={handleCancelEdit}
              handleCancelRosterEdit={handleCancelRosterEdit}
              handleBulkDutyImport={handleBulkDutyImport}
              isSubmitDisabled={isSubmitDisabled}
            />

            {/* RIGHT COLUMN: Roster Monthly List Panel */}
            <RosterListPanel
              currentUser={currentUser}
              cells={cells}
              employees={employees}
              duties={duties}
              officeOrders={officeOrders}
              selectedCell={selectedCell}
              changeSelectedCell={changeSelectedCell}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedEmployee={selectedEmployee}
              setSelectedEmployee={setSelectedEmployee}
              selectedMonths={selectedMonths}
              changeSelectedMonths={changeSelectedMonths}
              isAssignmentPrimary={isAssignmentPrimary}
              onFocusPanel={() => setLayoutPriority(LayoutPriority.ROSTER)}
              selectedDutyIds={selectedDutyIds}
              setSelectedDutyIds={setSelectedDutyIds}
              handleBulkDeleteDuties={handleBulkDeleteDuties}
              handleStartEdit={handleStartEdit}
              deleteGroupedDuties={deleteGroupedDuties}
              handlePreviewOfficeOrder={handlePreviewOfficeOrder}
              handleDeleteOfficeOrder={handleDeleteOfficeOrder}
            />
          </div>
        </>
      ) : (
        /* GOVERNMENT PRINT MODE (অফিস আদেশ / জিও) */
        <OfficeOrderPrintPreview
          orderGenerated={orderGenerated}
          isEditingArchive={isEditingArchive}
          isArchived={isArchived}
          submitting={submitting}
          isRosterDirty={isRosterDirty}
          orderRef={orderRef}
          originalOrderRef={originalOrderRef}
          orderDate={orderDate}
          orderText={orderText}
          printCategory={printCategory}
          payeeEmployeeId={payeeEmployeeId}
          selectedExecutiveId={selectedExecutiveId}
          executives={executives}
          signingOfficer={signingOfficer}
          signingDesignation={signingDesignation}
          headerMode={headerMode}
          suggestedRef={suggestedRef}
          refDuplicate={refDuplicate}
          holidays={holidays}
          duties={duties}
          selectedCell={selectedCell}
          activePartIdx={activePartIdx}
          stableNumber={stableNumber}
          setUserCustomOrderRef={setUserCustomOrderRef}
          setUserCustomOrderDate={setUserCustomOrderDate}
          setUserCustomOrderText={setUserCustomOrderText}
          setUserSelectedPayeeId={setUserSelectedPayeeId}
          setSelectedExecutiveId={setSelectedExecutiveId}
          setSigningOfficer={setSigningOfficer}
          setSigningDesignation={setSigningDesignation}
          setHeaderMode={setHeaderMode}
          changePrintCategory={changePrintCategory}
          setActivePartIdx={setActivePartIdx}
          handleBackToRoster={handleBackToRoster}
          archiveOrder={archiveOrder}
          saveOrderToArchive={saveOrderToArchive}
          handleCancelRosterEdit={handleCancelRosterEdit}
          getGroupedDuties={getGroupedDuties}
          getSplitParts={getSplitParts}
          getShortDesignation={getShortDesignation}
        />
      )}

      {/* Conflict Resolution & Auto-Redirect Modal */}
      {conflictModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/50 rounded-2xl">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                  ⚠️ ডাটা আগে থেকেই সংরক্ষিত ছিল! (Conflict Detected)
                </h3>
                <p className="text-xs text-slate-500 font-medium">ইনপুট কৃত তারিখ ও কর্মকর্তার তথ্য সিস্টেমে আগেই সংরক্ষিত ছিল।</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-medium whitespace-pre-line leading-relaxed">
              {conflictModalData.message}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConflictModalData(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                বাতিল
              </button>
              
              <button
                type="button"
                onClick={handleRedirectToConflictingDuties}
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye size={14} />
                তালিকায় কনফ্লিক্টিং ডাটা দেখুন
              </button>

              <button
                type="button"
                onClick={handleOverwriteAndSave}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                কনফ্লিক্টিং ডাটা মুছে সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {billSuggestion && (
        <div className="fixed bottom-5 right-5 z-50 max-w-[420px] p-4 bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/40 border-emerald-200 dark:border-emerald-800 border rounded-2xl shadow-xl flex flex-col gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300"
             style={{
               fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif",
             }}>
          <div className="flex items-start gap-3">
            <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
            <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 leading-relaxed">
              ✅ অফিস আদেশ সফলভাবে তৈরি হয়েছে। 💰 এখন বিল মেমো তৈরি করতে চান?
            </div>
            <button onClick={() => setBillSuggestion(null)} className="text-slate-400 hover:text-slate-600 ml-auto p-1 rounded-lg shrink-0 cursor-pointer -mt-1 -mr-1">
              <X size={16} />
            </button>
          </div>
          <div className="flex justify-end mt-1">
            <a 
              href={`/billing?orderRef=${encodeURIComponent(billSuggestion.ref)}&category=${encodeURIComponent(billSuggestion.category)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              বিলিং পেজে যান <ChevronRight size={14} />
            </a>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-[400px] p-4 bg-red-50 text-red-900 border border-red-200 rounded-2xl shadow-xl flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-300"
             style={{
               fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif",
               fontSize: "14px",
               lineHeight: "1.7",
             }}>
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div>
            <div className="font-bold text-red-800">ডিউটি সংঘর্ষ বা ছুটির ওভারল্যাপ</div>
            <div className="mt-1 text-xs text-red-700">{toast.message}</div>
          </div>
          <button onClick={() => setToast(null)} className="text-red-400 hover:text-red-650 ml-auto p-0.5 rounded-lg shrink-0 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
