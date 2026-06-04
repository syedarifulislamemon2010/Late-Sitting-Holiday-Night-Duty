'use client';

import { useState, useEffect, useMemo } from 'react';
import { sortEmployeesBySeniority } from '@/lib/seniority';

import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2,
  Calendar, 
  Printer, 
  Building2, 
  ChevronLeft, 
  Check, 
  Users,
  AlertCircle
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
  orderRef?: string | null;
}

const toBanglaDigits = (num: number | string) => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, d => bn[parseInt(d, 10)]);
};

const getBanglaNumberWords = (num: number) => {
  if (num === 0) return 'শূন্য';
  
  const singleWords = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'छয়', 'সাত', 'আট', 'নয়'];
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

export default function RosterPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Edit/Update Duty states
  const [editingDuty, setEditingDuty] = useState<Duty | null>(null);
  const [editForm, setEditForm] = useState({
    type: 'LATE_SITTING' as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT',
    date: '',
    description: ''
  });
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Filters state
  const [selectedCell, setSelectedCell] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });

  // Duty assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    selectedEmployeeIds: [] as number[],
    type: 'LATE_SITTING' as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Entry mode: EMPLOYEE_WISE or DATE_WISE
  const [entryMode, setEntryMode] = useState<'EMPLOYEE_WISE' | 'DATE_WISE'>('EMPLOYEE_WISE');
  
  // Option 1 states
  const [opt1CellId, setOpt1CellId] = useState<string>('all');
  const [opt1Assignments, setOpt1Assignments] = useState<Record<number, string[]>>({});

  useEffect(() => {
    if (cells.length > 0 && opt1CellId === 'all') {
      setOpt1CellId(cells[0].id.toString());
    }
  }, [cells]);

  const handleOpt1EmployeeToggle = (empId: number) => {
    setOpt1Assignments(prev => {
      const next = { ...prev };
      if (empId in next) {
        delete next[empId];
      } else {
        next[empId] = [];
      }
      return next;
    });
  };

  const handleOpt1AddDate = (empId: number, dateStr: string) => {
    if (!dateStr) return;
    setOpt1Assignments(prev => {
      const currentDates = prev[empId] || [];
      if (currentDates.includes(dateStr)) return prev;
      return {
        ...prev,
        [empId]: [...currentDates, dateStr].sort()
      };
    });
  };

  const handleOpt1RemoveDate = (empId: number, dateStr: string) => {
    setOpt1Assignments(prev => {
      const currentDates = prev[empId] || [];
      return {
        ...prev,
        [empId]: currentDates.filter(d => d !== dateStr)
      };
    });
  };

  // Office Order (জিও) custom edit fields
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isEditingArchive, setIsEditingArchive] = useState(false);
  const [archiveSerial, setArchiveSerial] = useState('');
  const [originalOrderRef, setOriginalOrderRef] = useState('');
  const [activePartIdx, setActivePartIdx] = useState(0);

  const getSplitParts = (flatDuties: any[], numParts: number) => {
    const parts: any[][] = Array.from({ length: numParts }, () => []);
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

  const [memoNo, setMemoNo] = useState('স্মারক নং: ৪৬.০২.০০০০.০০১.১৯.০০২.২৬-১৫৪');
  const [issuingOffice, setIssuingOffice] = useState('প্রশাসনিক সেল, ডিউটি পোর্টাল কার্যালয়');
  const [signingOfficer, setSigningOfficer] = useState('জনাব মোহাম্মদ সোহরাব হোসেন');
  const [signingDesignation, setSigningDesignation] = useState('উপ-মহাব্যবস্থাপক');
  const [signingPhone, setSigningPhone] = useState('০২-৯৫৫৫৬৬৬');
  const [signingEmail, setSigningEmail] = useState('ashikur.rahman@office.gov.bd');
  const [copies, setCopies] = useState<string[]>([]);
  const [newCopyText, setNewCopyText] = useState('');
  const [executives, setExecutives] = useState<any[]>([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string>('');
  const [holidays, setHolidays] = useState<any[]>([]);

  // Helper to check if a date is a working day or weekend/holiday
  const checkIsWorkingDay = (dateStr: string, holidaysList: any[]) => {
    if (!dateStr) return true;
    
    // Hardcoded override for May 23, 2026 (Saturday) to be a working day (just like in dashboard calendar)
    if (dateStr === '2026-05-23') {
      return true;
    }
    
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0: Sun, 5: Fri, 6: Sat
    
    // Find database holiday entry
    const holiday = holidaysList.find(h => h.date === dateStr);
    
    if (holiday) {
      return holiday.isWorkingDay; // If isWorkingDay is false, it's a holiday (non-working day)
    }
    
    // Default weekends in Bangladesh (Friday and Saturday)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return false;
    }
    
    return true;
  };

  // Check if a date should be disabled based on selected duty category
  const isDateDisabledForType = (isWorking: boolean, type: string) => {
    if (type === 'LATE_SITTING') {
      return !isWorking; // Disable holidays/weekends for Late Sitting
    }
    if (type === 'HOLIDAY') {
      return isWorking; // Disable normal working days for Holiday Duty
    }
    return false; // Night Shift allows any date
  };

  // Helper to walk backward to find the N-th previous working day
  const calculateOrderDate = (earliestDateStr: string, holidaysList: any[], steps: number = 1) => {
    if (!earliestDateStr) return new Date().toISOString().split('T')[0];
    
    let [y, m, d] = earliestDateStr.split('-').map(Number);
    let currentDate = new Date(y, m - 1, d);
    
    let workingDaysFound = 0;
    while (true) {
      // Subtract 1 day
      currentDate.setDate(currentDate.getDate() - 1);
      
      const cy = currentDate.getFullYear();
      const cm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const cd = String(currentDate.getDate()).padStart(2, '0');
      const cDateStr = `${cy}-${cm}-${cd}`;
      
      if (checkIsWorkingDay(cDateStr, holidaysList)) {
        workingDaysFound++;
        if (workingDaysFound === steps) {
          return cDateStr;
        }
      }
    }
  };

  // Render stunning month calendar for multi-date selection
  const renderMonthCalendar = (empId: number) => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-indexed
    
    const lastDay = new Date(year, month, 0).getDate();
    const cells = [];
    
    for (let day = 1; day <= lastDay; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
      
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay(); // 0: Sun, 5: Fri, 6: Sat
      const dayNamesBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
      const dayName = dayNamesBn[dayOfWeek];
      
      const isSelected = (opt1Assignments[empId] || []).includes(dateStr);
      const isWorking = checkIsWorkingDay(dateStr, holidays);
      const isDbHoliday = holidays.find(h => h.date === dateStr);
      
      cells.push({
        day,
        dateStr,
        dayName,
        dayOfWeek,
        isSelected,
        isWorking,
        isDbHoliday
      });
    }
    
    return (
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 no-print">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-555 dark:text-slate-400">
            ডিউটি তারিখসমূহ ({selectedMonth}):
          </span>
          {opt1Assignments[empId] && opt1Assignments[empId].length > 0 && (
            <button
              type="button"
              onClick={() => setOpt1Assignments(prev => ({ ...prev, [empId]: [] }))}
              className="text-[9px] font-bold text-red-500 hover:text-red-650 transition-colors"
            >
              সব মুছুন
            </button>
          )}
        </div>
        <div className="grid grid-cols-7 gap-1 font-sans text-center">
          {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'].map((dName, idx) => (
            <div key={idx} className={`text-[10px] sm:text-xs font-bold py-0.5 ${idx === 5 || idx === 6 ? 'text-red-500 font-extrabold' : 'text-slate-400 dark:text-slate-550'}`}>
              {dName}
            </div>
          ))}
          
          {/* Pad grid */}
          {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, idx) => (
            <div key={`pad-${idx}`} className="min-h-[36px]" />
          ))}
          
          {cells.map(c => {
            const holidayInfo = c.isDbHoliday ? c.isDbHoliday.name : ((c.dayOfWeek === 5 || c.dayOfWeek === 6) && !c.isWorking ? 'সাপ্তাহিক ছুটি' : '');
            const isDisabled = isDateDisabledForType(c.isWorking, assignmentForm.type);
            return (
              <button
                type="button"
                key={c.dateStr}
                disabled={isDisabled}
                title={`${c.dateStr} (${holidayInfo || 'কর্মদিবস'})${isDisabled ? ' - এই ক্যাটাগরির জন্য ডিজেবল' : ''}`}
                onClick={() => {
                  if (c.isSelected) {
                    handleOpt1RemoveDate(empId, c.dateStr);
                  } else {
                    handleOpt1AddDate(empId, c.dateStr);
                  }
                }}
                className={`relative p-1 text-[10px] font-bold rounded-lg transition-all flex flex-col items-center justify-center min-h-[36px] border ${
                  c.isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-extrabold scale-105'
                    : isDisabled
                      ? 'bg-slate-100/50 dark:bg-slate-900/10 border-slate-200/20 dark:border-slate-800/10 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40'
                      : !c.isWorking
                        ? 'bg-red-50/50 dark:bg-red-950/20 border-red-100/50 dark:border-red-900/10 text-red-500 hover:bg-red-100/60 dark:hover:bg-red-900/30'
                        : 'bg-slate-50 dark:bg-slate-950/20 border-slate-200/40 dark:border-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{c.day}</span>
                {c.isDbHoliday && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-amber-550 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // New customizable parameters for Janata Bank Office Order
  const [printCategory, setPrintCategory] = useState<'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT'>('LATE_SITTING');

  useEffect(() => {
    setActivePartIdx(0);
  }, [selectedMonth, selectedCell, printCategory]);

  const [payeeEmployeeId, setPayeeEmployeeId] = useState<string>('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const LATE_SITTING_TEMPLATE = `T24 Online Banking Software Customization এবং Development সংক্রান্ত কার্যাদি সুচারুরূপে সম্পাদনের নিমিত্তে  অত্র ডিপার্টমেন্টের নিম্ন বর্ণিত কর্মকর্তাগণকে তাদের নামের পাশে বর্ণিত তারিখে অফিস <strong>ছুটির পর (Late Sitting)</strong> কর্মস্থলে উপস্থিত থেকে কর্ম সম্পাদনের নির্দেশ প্রদান করা হলঃ`;

  const NIGHT_SHIFT_TEMPLATE = `T24 Online Banking Software Customization এবং Development সংক্রান্ত কার্যাদি সুচারুরূপে সম্পাদনের নিমিত্তে  অত্র ডিপার্টমেন্টের নিম্ন বর্ণিত কর্মকর্তাগণকে তাদের নামের পাশে বর্ণিত তারিখে অফিস <strong>রাত্রিকালীন (Night Shift)</strong> কর্মস্থলে উপস্থিত থেকে কর্ম সম্পাদনের নির্দেশ প্রদান করা হলঃ`;

  const HOLIDAY_TEMPLATE = `T24 Online Banking Software Customization এবং Development সংক্রান্ত কার্যাদি সুচারুরূপে সম্পাদনের নিমিত্তে  অত্র ডিপার্টমেন্টের নিম্ন বর্ণিত কর্মকর্তাগণকে তাদের নামের পাশে বর্ণিত তারিখে অফিস <strong>ছুটির দিনে (Holiday)</strong> কর্মস্থলে উপস্থিত থেকে কর্ম সম্পাদনের নির্দেশ প্রদান করা হলঃ`;

  const [orderText, setOrderText] = useState(LATE_SITTING_TEMPLATE);
  const [orderRef, setOrderRef] = useState('');
  const [headerMode, setHeaderMode] = useState<'with_header' | 'without_header'>('with_header');

  // Calculate stable, deterministic reference number suffix based on selected duties
  const stableNumber = useMemo(() => {
    const filtered = duties.filter(d => {
      const matchesCell = selectedCell === 'all' || d.employee.cellId.toString() === selectedCell;
      const matchesCategory = d.type === printCategory;
      return matchesCell && matchesCategory;
    });

    const dutyIds = filtered.map(d => d.id).sort((a, b) => a - b);
    if (dutyIds.length === 0) {
      return 84; // Fallback default
    }

    const hashStr = `${dutyIds.join(',')}|${printCategory}|${payeeEmployeeId}`;
    let hash = 0;
    for (let i = 0; i < hashStr.length; i++) {
      hash = (hash * 31 + hashStr.charCodeAt(i)) & 0xffffff;
    }
    return 10 + (hash % 90);
  }, [duties, printCategory, payeeEmployeeId, selectedCell]);

  // Automatically select first employee of the duty table as payee representative by default
  useEffect(() => {
    const tableEmps = getGroupedDuties();
    if (tableEmps.length > 0) {
      const isCurrentPayeeValid = tableEmps.some(g => g.employee.id.toString() === payeeEmployeeId);
      if (!payeeEmployeeId || !isCurrentPayeeValid) {
        setPayeeEmployeeId(tableEmps[0].employee.id.toString());
      }
    } else {
      setPayeeEmployeeId('');
    }
  }, [selectedCell, duties, printCategory, payeeEmployeeId]);

  // Sync templates and orderRef dynamically
  useEffect(() => {
    let template = LATE_SITTING_TEMPLATE;
    if (printCategory === 'NIGHT_SHIFT') template = NIGHT_SHIFT_TEMPLATE;
    if (printCategory === 'HOLIDAY') template = HOLIDAY_TEMPLATE;
    setOrderText(template);

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
    const bnYear = toBanglaDigits('2026');
    
    // Check if there are any duties in the print table that already have an orderRef
    const tableGroups = getGroupedDuties();
    const tableDates = tableGroups.flatMap(g => g.dates);
    const activeDuties = duties.filter(d => {
      const matchesCell = selectedCell === 'all' || d.employee.cellId.toString() === selectedCell;
      const matchesCategory = d.type === printCategory;
      return matchesCell && matchesCategory && tableDates.includes(d.date);
    });
    const firstArchivedDuty = activeDuties.find(d => d.orderRef);
    if (firstArchivedDuty && firstArchivedDuty.orderRef) {
      setOrderRef(firstArchivedDuty.orderRef);
      return;
    }
    
    if (isEditingArchive) {
      // If editing, use the preserved archiveSerial, or fall back to parsing current orderRef
      let currentSerial = archiveSerial;
      if (!currentSerial && orderRef) {
        const parts = orderRef.split('/');
        if (parts.length >= 7) {
          currentSerial = parts[6];
        }
      }
      if (currentSerial) {
        setOrderRef(`৯১০৩/ডেভ/${empName}/${catBangla}/অফিস-নির্দেশ/${bnYear}/${currentSerial}`);
      }
      return;
    }

    // Consecutive reference numbers for split parts (e.g., 85 and 86)
    const activeStableNumber = stableNumber + activePartIdx;
    const bnRand = toBanglaDigits(activeStableNumber);
    setOrderRef(`৯১০৩/ডেভ/${empName}/${catBangla}/অফিস-নির্দেশ/${bnYear}/${bnRand}`);
  }, [printCategory, payeeEmployeeId, employees, stableNumber, isEditingArchive, activePartIdx, archiveSerial]);

  const archiveOrder = async (isPrintPreview: boolean) => {
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
            if (matchedDuty) ids.push(matchedDuty.id);
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
        console.log('Office order archived successfully!');
        
        // Call updateAssociatedBill to keep the bill memo updated in sync with office order!
        await updateAssociatedBill(orderRef);
        
        // Trigger PDF generation endpoint in backend unconditionally
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

        const pdfRes = await fetch('/api/documents/generate-office-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pdfPayload)
        });

        if (pdfRes.ok) {
          const pdfData = await pdfRes.json();
          // Only open PDF in a new tab if in download/A4 mode (not print preview mode)
          if (!isPrintPreview && pdfData.filePath) {
            window.open(pdfData.filePath, '_blank');
          }
        } else {
          console.error('Failed to generate office order PDF');
        }

        if (isPrintPreview) {
          // Trigger browser print
          setTimeout(() => {
            window.print();
            setIsPrintMode(false);
            if (isEditingArchive) {
              setIsEditingArchive(false);
              window.history.pushState({}, '', '/roster');
            }
            loadDuties();
          }, 300);
        } else {
          setIsPrintMode(false);
          if (isEditingArchive) {
            setIsEditingArchive(false);
            window.history.pushState({}, '', '/roster');
          }
          loadDuties();
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Failed to archive office order:', res.status, errData);
        alert(`অফিস আদেশ আর্কাইভে সংরক্ষণ করতে ব্যর্থ হয়েছে। সার্ভার মেসেজ: ${errData.message || errData.error || 'অজানা ত্রুটি (Status: ' + res.status + ')'}`);
      }
    } catch (err) {
      console.error('Error archiving office order:', err);
      alert('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে। আপনার ইন্টারনেট কানেকশন বা সার্ভার সচল আছে কিনা চেক করুন।');
    }
  };

  // Commented out to ensure that archive is only saved upon explicit download/print click action
  // as per instructions: "যতক্ষণ না ডাউনলোড বা প্রিন্ট প্রিভিউ অ্যাকশন নেওয়া হচ্ছে, ততক্ষণ এই সূত্র আর্কাইভে জমা হবে না"
  /*
  useEffect(() => {
    if (isPrintMode) {
      archiveOrder(true);
    }
  }, [isPrintMode]);
  */


  const getShortDesignation = (desig: string) => {
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

  const updateAssociatedBill = async (baseOrderRef: string) => {
    try {
      const billRef = baseOrderRef + '/বিল';
      const ordersRes = await fetch('/api/office-orders');
      if (!ordersRes.ok) return;
      const orders = await ordersRes.json();
      const existingBill = orders.find((o: any) => o.orderRef === billRef);
      if (!existingBill) {
        console.log("No existing bill found for this office order. Skipping bill update.");
        return;
      }
      
      const apyaonRate = printCategory === 'HOLIDAY' ? 250 : printCategory === 'NIGHT_SHIFT' ? 600 : 100;
      const transportRate = printCategory === 'HOLIDAY' ? 250 : printCategory === 'NIGHT_SHIFT' ? 400 : 200;
      
      // Group the duties by employee matching the print category
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
      const cellName = matchedCellObj ? matchedCellObj.name : 'IT Department';
      
      const billPayload = {
        orderRef: billRef,
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
        dutyIds: [],
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
      
      // Update bill record in database
      await fetch('/api/office-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billPayload)
      });
      
      // Automatically regenerate bill PDF in the background
      const formatMonthName = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthName = date.toLocaleString('en-US', { month: 'long' });
        return `${monthName}-${year}`;
      };
      
      const pdfPayload = {
        billingMonth: formatMonthName(selectedMonth),
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
      
      console.log("Associated bill and PDF updated successfully!");
    } catch (err) {
      console.error("Failed to update associated bill:", err);
    }
  };

  const getGroupedDuties = () => {
    const filtered = duties.filter(d => {
      const matchesCell = selectedCell === 'all' || d.employee.cellId.toString() === selectedCell;
      const matchesCategory = d.type === printCategory;
      return matchesCell && matchesCategory;
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
      if (!groupedMap.has(empId)) {
        groupedMap.set(empId, {
          employee: d.employee,
          dates: [],
          description: d.description || `Customization এবং Development সংক্রান্ত কাজ (${d.employee.cell?.name || ''})`
        });
      }
      const group = groupedMap.get(empId)!;
      if (!group.dates.includes(d.date)) {
        group.dates.push(d.date);
      }
      if (d.description && d.description.trim() !== '') {
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
  };

  // Automatically calculate orderDate to be the previous working day of the earliest selected duty date or printed table date
  useEffect(() => {
    let earliestDate: string | null = null;

    // First try to calculate from the matched duties in the print table
    const tableGroups = getGroupedDuties();
    const tableDates = tableGroups.flatMap(g => g.dates);
    if (tableDates.length > 0) {
      tableDates.sort();
      earliestDate = tableDates[0];
    } else {
      // Fallback to the form inputs if print table is empty
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
      const steps = isEditingArchive ? 1 : (1 + activePartIdx);
      const calculated = calculateOrderDate(earliestDate, holidays, steps);
      setOrderDate(calculated);
    }
  }, [duties, selectedCell, printCategory, opt1Assignments, assignmentForm.date, entryMode, holidays, activePartIdx, isEditingArchive]);

  async function loadData() {
    try {
      setLoading(true);
      const [empRes, cellRes, execRes, holidayRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/cells'),
        fetch('/api/executives'),
        fetch('/api/holidays')
      ]);
      const empData = await empRes.json();
      const cellData = await cellRes.json();
      const execData = await execRes.json();
      const holidayData = await holidayRes.json();
      
      const sortedEmps = Array.isArray(empData) ? sortEmployeesBySeniority(empData) : [];
      setEmployees(sortedEmps);
      setCells(Array.isArray(cellData) ? cellData : []);
      setHolidays(Array.isArray(holidayData) ? holidayData : []);
      
      if (Array.isArray(execData)) {
        // Exclude AGMs from signing executive list in Office Orders
        const nonAgmExecs = execData.filter((ex: any) => {
          const d = ex.designation.trim().toLowerCase();
          return !(d.includes('সহকারী') || d.includes('এজিএম') || d.includes('agm'));
        });

        const desigPriority: Record<string, number> = {
          'মহাব্যবস্থাপক': 1,
          'উপ-মহাব্যবস্থাপক': 2,
          'সহকারী মহাব্যবস্থাপক': 3
        };
        const sortedExecs = [...nonAgmExecs].sort((a, b) => {
          const prioA = desigPriority[a.designation] || 99;
          const prioB = desigPriority[b.designation] || 99;
          if (prioA !== prioB) return prioA - prioB;
          return (a.fileNo || '').localeCompare(b.fileNo || '', undefined, { numeric: true, sensitivity: 'base' });
        });
        setExecutives(sortedExecs);
        if (sortedExecs.length > 0) {
          const defaultExec = sortedExecs.find((ex: any) => ex.name.includes('মোহাম্মদ সোহরাব হোসেন') || ex.designation.includes('উপ-মহাব্যবস্থাপক')) || sortedExecs[0];
          if (defaultExec) {
            setSelectedExecutiveId(defaultExec.id.toString());
            setSigningOfficer(defaultExec.name);
            setSigningDesignation(defaultExec.designation);
          }
        }
      }
    } catch (err) {
      console.error('Error loading static data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadDuties() {
    if (isEditingArchive) {
      // In edit mode, duties state is fully driven by opt1Assignments sync useEffect.
      return;
    }
    try {
      const yearMonth = selectedMonth.split('-');
      const year = yearMonth[0];
      const month = yearMonth[1];
      
      // Calculate start and end date of the selected month
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      
      let queryUrl = `/api/duties?startDate=${startDate}&endDate=${endDate}`;
      if (selectedCell !== 'all') {
        queryUrl += `&cellId=${selectedCell}`;
      }
      
      const res = await fetch(queryUrl);
      const data = await res.json();
      const activeList = Array.isArray(data) ? data : [];

      // Merge with archived duties if editing
      if (isEditingArchive && orderRef) {
        const archRes = await fetch(`/api/duties?orderRef=${encodeURIComponent(orderRef)}&includeArchived=true`);
        if (archRes.ok) {
          const archData = await archRes.json();
          const archList = Array.isArray(archData) ? archData : [];
          
          const merged = [...archList];
          activeList.forEach(d => {
            if (!merged.some(m => m.id === d.id)) {
              merged.push(d);
            }
          });
          setDuties(merged);
          return;
        }
      }
      
      setDuties(activeList);
    } catch (err) {
      console.error('Error loading duties:', err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadDuties();
  }, [selectedMonth, selectedCell, isEditingArchive, orderRef]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editRef = params.get('edit_ref');
      if (editRef) {
        setIsEditingArchive(true);
        console.log("Loading archived order for editing:", editRef);
        
        const loadArchivedDuties = async () => {
          try {
            // First load employees and cells locally to ensure we have them
            const [empRes, cellRes, orderRes] = await Promise.all([
              fetch('/api/employees'),
              fetch('/api/cells'),
              fetch('/api/office-orders')
            ]);
            
            const localEmps = await empRes.json();
            const localCells = await cellRes.json();
            const orders = await orderRes.json();
            
            const sortedLocalEmps = Array.isArray(localEmps) ? sortEmployeesBySeniority(localEmps) : [];
            
            setEmployees(sortedLocalEmps);
            setCells(localCells);
            
            const matchingOrder = orders.find((o: any) => o.orderRef === editRef);
            if (matchingOrder) {
              const orderDuties = matchingOrder.duties || [];
              const category = matchingOrder.category;
              
              setPrintCategory(category);
              
              // Find payee representative id
              const matchedRep = localEmps.find((e: any) => e.name === matchingOrder.employeeName);
              if (matchedRep) {
                setPayeeEmployeeId(matchedRep.id.toString());
              }
              
              // Find cell id
              if (matchingOrder.cellName) {
                const matchedCell = localCells.find((c: any) => c.name === matchingOrder.cellName);
                if (matchedCell) {
                  setSelectedCell(matchedCell.id.toString());
                }
              }
              
              // Set selectedMonth dynamically to match the archived order's duties month
              if (orderDuties.length > 0 && orderDuties[0].dates && orderDuties[0].dates.length > 0) {
                const firstDate = orderDuties[0].dates[0]; // e.g. "2026-05-23"
                if (firstDate && firstDate.includes('-')) {
                  const parts = firstDate.split('-');
                  if (parts.length >= 2) {
                    const orderMonth = `${parts[0]}-${parts[1]}`;
                    setSelectedMonth(orderMonth);
                  }
                }
              }
              
              // Set orderRef and date
              setOrderRef(editRef);
              setOriginalOrderRef(editRef);
              if (editRef && editRef.includes('/')) {
                const parts = editRef.split('/');
                const serial = parts[parts.length - 1] || '';
                setArchiveSerial(serial);
              }
              setOrderDate(matchingOrder.orderDate);
              
              // Populate content
              if (matchingOrder.content) {
                setOrderText(matchingOrder.content.orderText || '');
                setSigningOfficer(matchingOrder.content.signingOfficer || '');
                setSigningDesignation(matchingOrder.content.signingDesignation || '');
                if (Array.isArray(matchingOrder.content.copies)) {
                  setCopies(matchingOrder.content.copies);
                }
              }
              
              // Pre-populate opt1Assignments (left-side checked boxes)
              const assignments: Record<number, string[]> = {};
              orderDuties.forEach((group: any) => {
                assignments[group.employeeId] = group.dates;
              });
              setOpt1Assignments(assignments);
              
              // Reconstruct duties state
              const reconstructedDuties: any[] = [];
              orderDuties.forEach((group: any) => {
                const matchedEmp = localEmps.find((e: any) => e.id === group.employeeId);
                group.dates.forEach((date: string) => {
                  reconstructedDuties.push({
                    id: Math.random(),
                    employeeId: group.employeeId,
                    date: date,
                    type: category,
                    description: group.description,
                    employee: matchedEmp || {
                      id: group.employeeId,
                      name: group.employeeName,
                      designation: group.designation,
                      cellId: matchedRep ? matchedRep.cellId : 7
                    }
                  });
                });
              });
              setDuties(reconstructedDuties);
            }
          } catch (e) {
            console.error("Failed to load archived duties for editing:", e);
          }
        };
        
        loadArchivedDuties();
      }
    }
  }, []);

  const handleBackToRoster = () => {
    setIsPrintMode(false);
    if (isEditingArchive) {
      setIsEditingArchive(false);
      setArchiveSerial('');
      window.history.pushState({}, '', '/roster');
      setTimeout(() => {
        loadDuties();
      }, 50);
    }
  };

  // Dynamic sync duties state from opt1Assignments when in edit mode
  useEffect(() => {
    if (isEditingArchive && employees.length > 0) {
      const newDuties: any[] = [];
      Object.entries(opt1Assignments).forEach(([empIdStr, dates]) => {
        const empId = Number(empIdStr);
        const emp = employees.find(e => e.id === empId);
        if (!emp) return;
        
        dates.forEach(date => {
          newDuties.push({
            id: Math.random(), // unique key for UI mapping
            employeeId: empId,
            date: date,
            type: printCategory,
            description: `Customization এবং Development সংক্রান্ত কাজ (${emp.cell?.name || ''})`,
            employee: emp
          });
        });
      });
      setDuties(newDuties);
    }
  }, [opt1Assignments, isEditingArchive, printCategory, employees]);



  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    let assignments: any[] = [];

    if (isEditingArchive) {
      if (duties.length === 0) {
        setErrorMessage('ডিউটি বরাদ্দ করার জন্য অন্তত একটি তারিখ ও কর্মকর্তা নির্বাচন করুন।');
        return;
      }
      assignments = duties.map(d => ({
        employeeId: d.employeeId,
        type: printCategory,
        date: d.date,
        description: d.description || `Customization এবং Development সংক্রান্ত কাজ`
      }));
    } else {
      if (entryMode === 'EMPLOYEE_WISE') {
        const activeEmployeeIds = Object.keys(opt1Assignments).map(Number);
        if (activeEmployeeIds.length === 0) {
          setErrorMessage('ডিউটি বরাদ্দ করার জন্য অন্তত একজন কর্মকর্তা নির্বাচন করুন।');
          return;
        }

        // Check if any checked employee actually has selected dates
        let hasDates = false;
        for (const empId of activeEmployeeIds) {
          if (opt1Assignments[empId] && opt1Assignments[empId].length > 0) {
            hasDates = true;
            const emp = employees.find(e => e.id === empId);
            const cellName = emp?.cell?.name || '';
            opt1Assignments[empId].forEach(dateStr => {
              assignments.push({
                employeeId: empId,
                type: assignmentForm.type,
                date: dateStr,
                description: `Customization এবং Development সংক্রান্ত কাজ (${cellName})`
              });
            });
          }
        }

        if (!hasDates) {
          setErrorMessage('নির্বাচিত কর্মকর্তাদের জন্য অন্তত একটি তারিখ নির্বাচন করুন।');
          return;
        }
      } else {
        // DATE_WISE
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
            type: assignmentForm.type,
            date: assignmentForm.date,
            description: `Customization এবং Development সংক্রান্ত কাজ (${cellName})`
          };
        });
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
        if (err.error === 'duplicate_duty_on_date') {
          setErrorMessage('এই তারিখের মধ্যে কোনো কোনো কর্মকর্তার জন্য ইতিমধ্যে অন্য ডিউটি বা লেট সিটিং বরাদ্দ আছে। ডুপ্লিকেট এন্ট্রি করা সম্ভব নয়।');
        } else if (err.error === 'late_sitting_on_holiday') {
          setErrorMessage('ছুটির দিনে লেট সিটিং ডিউটি দেওয়া সম্ভব নয়।');
        } else if (err.error === 'holiday_duty_on_working_day') {
          setErrorMessage('কার্যদিবসে সরকারি ছুটির ডিউটি দেওয়া সম্ভব নয়।');
        } else {
          setErrorMessage(err.error || 'রোস্টার সংরক্ষণ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
        }
        setSubmitting(false);
        return;
      }

      if (isEditingArchive) {
        // Now update the office order and the associated bill!
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
          dutyIds: [], // backend handles linking because we set it on creation
          content: {
            orderText: orderText,
            signingOfficer: signingOfficer,
            signingDesignation: signingDesignation,
            copies: copies,
            cellName: cellName
          }
        };

        // 1. Update the office order in DB
        const ooRes = await fetch('/api/office-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (ooRes.ok) {
          // 2. Generate updated office order PDF in backend
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

        // 3. Update the associated bill!
        await updateAssociatedBill(orderRef);

        // Exit edit mode and redirect to documents archive page!
        setIsEditingArchive(false);
        window.location.href = '/documents';
        return;
      }

      // Normal mode reset logic
      if (entryMode === 'EMPLOYEE_WISE') {
        setOpt1Assignments({});
      } else {
        setAssignmentForm(prev => ({
          ...prev,
          selectedEmployeeIds: [],
          description: ''
        }));
      }
      
      loadDuties();
      
      // Show success toast/alert
      alert('ডিউটি রোস্টার সফলভাবে সংরক্ষণ করা হয়েছে!');
    } catch (err: any) {
      console.error('Error assigning roster:', err);
      if (err.message === 'duplicate_duty_on_date') {
        setErrorMessage('এই অর্ডার করা হয়েছে');
        alert('এই অর্ডার করা হয়েছে');
      } else if (err.message === 'late_sitting_on_holiday') {
        setErrorMessage('ছুটির দিনে লেট সিটিং ডিউটি দেওয়া সম্ভব নয়।');
      } else if (err.message === 'holiday_duty_on_working_day') {
        setErrorMessage('কার্যদিবসে সরকারি ছুটির ডিউটি দেওয়া সম্ভব নয়।');
      } else {
        setErrorMessage('রোস্টার সংরক্ষণ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDuty = async (id: number) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই ডিউটি এন্ট্রিটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/duties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadDuties();
      } else {
        alert('ডিউটি মুছতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error('Error deleting duty:', err);
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
      console.error('Error deleting duties:', err);
      alert('ডিউটি রেকর্ড মুছতে ব্যর্থ হয়েছে।');
    }
  };

  const handleStartEdit = (duty: Duty) => {
    setEditingDuty(duty);
    setEditForm({
      type: duty.type,
      date: duty.date,
      description: duty.description || ''
    });
    setEditError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDuty) return;
    setEditError('');
    setUpdating(true);
    try {
      const res = await fetch(`/api/duties/${editingDuty.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editForm.type,
          date: editForm.date,
          description: 'Customization এবং Development সংক্রান্ত'
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        let msg = 'ডিউটি আপডেট করতে ব্যর্থ হয়েছে।';
        if (err.error === 'late_sitting_on_holiday') {
          msg = 'ছুটির দিনে লেট সিটিং ডিউটি দেওয়া সম্ভব নয়।';
        } else if (err.error === 'holiday_duty_on_working_day') {
          msg = 'কার্যদিবসে সরকারি ছুটির ডিউটি দেওয়া সম্ভব নয়।';
        } else if (err.error === 'duplicate_duty_on_date') {
          msg = 'এই কর্মকর্তার জন্য এই তারিখে ইতিমধ্যে অন্য ডিউটি বরাদ্দ রয়েছে।';
        } else if (err.error === 'duty_not_found') {
          msg = 'ডিউটি রেকর্ডটি খুঁজে পাওয়া যায়নি।';
        }
        setEditError(msg);
        return;
      }
      
      setEditingDuty(null);
      loadDuties();
      alert('ডিউটি সফলভাবে আপডেট করা হয়েছে!');
    } catch (err) {
      console.error('Error updating duty:', err);
      setEditError('সার্ভার কানেকশন ব্যর্থ হয়েছে।');
    } finally {
      setUpdating(false);
    }
  };

  // Checkbox group handlers for Officer multi-selection
  const handleEmployeeToggle = (empId: number) => {
    setAssignmentForm(prev => {
      const selected = [...prev.selectedEmployeeIds];
      const index = selected.indexOf(empId);
      if (index > -1) {
        selected.splice(index, 1);
      } else {
        selected.push(empId);
      }
      return { ...prev, selectedEmployeeIds: selected };
    });
  };

  const selectAllFilteredEmployees = (filteredEmps: Employee[]) => {
    const allIds = filteredEmps.map(e => e.id);
    setAssignmentForm(prev => ({
      ...prev,
      selectedEmployeeIds: allIds
    }));
  };

  const deselectAllFilteredEmployees = () => {
    setAssignmentForm(prev => ({
      ...prev,
      selectedEmployeeIds: []
    }));
  };

  // Helper translations and colors
  const getDutyBadgeStyles = (type: string) => {
    switch (type) {
      case 'LATE_SITTING':
        return 'bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-950/20';
      case 'HOLIDAY':
        return 'bg-sky-50/70 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 border-sky-100/50 dark:border-sky-950/20';
      case 'NIGHT_SHIFT':
        return 'bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-950/20';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100';
    }
  };

  // Format dynamic dates to formal Bengali
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

  // Simple copy recipient additions
  const addCopyRecipient = () => {
    if (newCopyText.trim() === '') return;
    setCopies([...copies, newCopyText.trim()]);
    setNewCopyText('');
  };

  const removeCopyRecipient = (index: number) => {
    setCopies(copies.filter((_, i) => i !== index));
  };

  // Filter form employees list based on search or cell
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [formCellFilter, setFormCellFilter] = useState('all');

  const filteredFormEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(formSearchQuery.toLowerCase()) || 
                          emp.designation.toLowerCase().includes(formSearchQuery.toLowerCase());
    const matchesCell = formCellFilter === 'all' || emp.cellId.toString() === formCellFilter;
    return matchesSearch && matchesCell;
  });

  // Dynamic scaling parameters based on duties count
  const dutiesCount = duties.length;
  let printFontSize = 'text-[12px]';
  let printTableFontSize = 'text-[11px]';
  let printTablePadding = 'p-2';
  let printHeaderSpacing = 'space-y-3';
  let printBodySpacing = 'space-y-4 pt-4';
  let printTitleSpacing = 'mb-2';
  let printParaSpacing = 'leading-relaxed text-[12px]';
  let printSigSpacing = 'pt-6';
  let printLogoSize = 'w-12 h-12';

  if (dutiesCount > 12) {
    printFontSize = 'text-[10.5px]';
    printTableFontSize = 'text-[10px]';
    printTablePadding = 'p-1';
    printHeaderSpacing = 'space-y-1.5';
    printBodySpacing = 'space-y-2 pt-2';
    printTitleSpacing = 'mb-1';
    printParaSpacing = 'leading-normal text-[10.5px]';
    printSigSpacing = 'pt-3';
    printLogoSize = 'w-10 h-10';
  } else if (dutiesCount > 7) {
    printFontSize = 'text-[11px]';
    printTableFontSize = 'text-[10.5px]';
    printTablePadding = 'p-1.5';
    printHeaderSpacing = 'space-y-2';
    printBodySpacing = 'space-y-3 pt-3';
    printTitleSpacing = 'mb-1.5';
    printParaSpacing = 'leading-relaxed text-[11px]';
    printSigSpacing = 'pt-4';
    printLogoSize = 'w-11 h-11';
  }  return (
    <div className="space-y-6 min-h-screen bg-slate-50/50 -m-4 lg:-m-8 p-4 lg:p-8">
      {/* ----------------------------------------------------
          NORMAL VIEW MODE
      ---------------------------------------------------- */}
      {!isPrintMode ? (
        <>
          {/* Header Dashboard Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-wide">ডিউটি রোস্টার ও অফিস আদেশ</h1>
              <p className="text-sm text-slate-500 mt-1">কর্মকর্তাদের রোস্টার তৈরি করুন এবং সরকারি প্রটোকলে অফিস আদেশ (জিও) জেনারেট করুন।</p>
            </div>
            
            <button
              onClick={() => setIsPrintMode(true)}
              disabled={duties.length === 0}
              className={`flex items-center justify-center gap-2 text-sm transition-all cursor-pointer ${
                duties.length > 0 
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
                  setOrderRef('');
                  setArchiveSerial('');
                  window.history.pushState({}, '', '/roster');
                  loadDuties();
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-[10px] font-bold rounded-lg transition-all"
              >
                সম্পাদন মোড থেকে বের হন (নতুন অর্ডার শুরু করুন)
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* LEFT COLUMN: Assign New Duty Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6 w-full xl:col-span-1">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Calendar size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">ডিউটি অ্যাসাইনমেন্ট প্যানেল</h3>
              </div>

              {/* Entry Option Toggle */}
              <div className="w-full">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setEntryMode('EMPLOYEE_WISE');
                      setErrorMessage('');
                    }}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
                      entryMode === 'EMPLOYEE_WISE' 
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
                    }`}
                  >
                    অপশন ১: সেল ও এমপ্লয়ী ভিত্তিক (মাল্টিপল ডেট)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEntryMode('DATE_WISE');
                      setErrorMessage('');
                    }}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
                      entryMode === 'DATE_WISE' 
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
                    }`}
                  >
                    অপশন ২: তারিখ ভিত্তিক (এমপ্লয়ী সিলেক্ট)
                  </button>
                </div>
              </div>

              <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs flex items-center gap-2 animate-pulse">
                    <AlertCircle size={14} />
                    {errorMessage}
                  </div>
                )}

                {/* Common Field 1: Duty Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">১. ডিউটির ক্যাটাগরি</label>
                  <select
                    value={assignmentForm.type}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, type: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LATE_SITTING">Late Sitting (লেট সিটিং)</option>
                    <option value="HOLIDAY">Holiday Duty (সরকারি ছুটি)</option>
                    <option value="NIGHT_SHIFT">Night Shift (রাত্রীকালীন ডিউটি)</option>
                  </select>
                </div>

                {/* Mode Specific Layouts */}
                {entryMode === 'EMPLOYEE_WISE' ? (
                  /* ========================================================
                     OPTION 1: Cell & Employee wise (Multi-date picker)
                     ======================================================== */
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">৩. সেল সিলেক্ট করুন</label>
                      <select
                        value={opt1CellId}
                        onChange={(e) => {
                          setOpt1CellId(e.target.value);
                          setOpt1Assignments({}); // Reset assignments when cell changes to keep it clean
                        }}
                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {cells.map(c => (
                          <option key={c.id} value={c.id.toString()}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        ৪. কর্মকর্তা ও তারিখসমূহ নির্বাচন করুন
                      </label>
                      
                      <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-white space-y-1">
                        {employees.filter(emp => emp.cellId.toString() === opt1CellId).length > 0 ? (
                          employees
                            .filter(emp => emp.cellId.toString() === opt1CellId)
                            .map(emp => {
                              const isChecked = emp.id in opt1Assignments;
                              return (
                                <div key={emp.id} className="border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-2.5 bg-white dark:bg-slate-900/40 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div 
                                      onClick={() => handleOpt1EmployeeToggle(emp.id)}
                                      className="flex items-center gap-2 cursor-pointer select-none"
                                    >
                                      <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                                        {isChecked && <Check size={10} strokeWidth={3} />}
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{emp.name}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{emp.designation}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {isChecked && renderMonthCalendar(emp.id)}
                                </div>
                              );
                            })
                        ) : (
                          <p className="text-[11px] text-center text-slate-400 py-4">এই সেলে কোনো কর্মকর্তা পাওয়া যায়নি</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ========================================================
                     OPTION 2: Date wise (Multi-employee checkboxes)
                     ======================================================== */
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    {/* Duty Date Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">৩. ডিউটির তারিখ</label>
                      <input
                        type="date"
                        required
                        value={assignmentForm.date}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, date: e.target.value })}
                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans cursor-pointer"
                      />
                      {assignmentForm.date && (() => {
                        const isWorking = checkIsWorkingDay(assignmentForm.date, holidays);
                        const isLateSitting = assignmentForm.type === 'LATE_SITTING';
                        const isHoliday = assignmentForm.type === 'HOLIDAY';
                        
                        if (isLateSitting && !isWorking) {
                          return (
                            <p className="text-[11px] font-bold text-red-500 mt-1.5 flex items-center gap-1.5 bg-red-50 p-2 rounded-lg border border-red-100/50">
                              <AlertCircle size={12} />
                              উক্ত তারিখটি ছুটির দিন/সাপ্তাহিক ছুটি হওয়ায় লেট সিটিং ডিউটি এন্ট্রি করা যাবে না!
                            </p>
                          );
                        }
                        if (isHoliday && isWorking) {
                          return (
                            <p className="text-[11px] font-bold text-red-500 mt-1.5 flex items-center gap-1.5 bg-red-50 p-2 rounded-lg border border-red-100/50">
                              <AlertCircle size={12} />
                              উক্ত তারিখটি কর্মদিবস হওয়ায় সরকারি ছুটির ডিউটি এন্ট্রি করা যাবে না!
                            </p>
                          );
                        }
                        
                        const matchedHoliday = holidays.find(h => h.date === assignmentForm.date);
                        const isWeekend = !isWorking && !matchedHoliday;
                        if (matchedHoliday) {
                          return (
                            <p className="text-[11px] font-bold text-amber-600 mt-1.5 flex items-center gap-1.5 bg-amber-50 p-2 rounded-lg border border-amber-100/50">
                              <AlertCircle size={12} />
                              সরকারি ছুটি: {matchedHoliday.name}
                            </p>
                          );
                        }
                        if (isWeekend) {
                          return (
                            <p className="text-[11px] font-bold text-red-550 mt-1.5 flex items-center gap-1.5 bg-red-50/40 p-2 rounded-lg border border-red-100/20">
                              <AlertCircle size={12} />
                              সাপ্তাহিক ছুটি
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Officer Selector Multi-select checkboxes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          ৪. কর্মকর্তা নির্বাচন করুন ({assignmentForm.selectedEmployeeIds.length} জন সিলেক্টেড)
                        </label>
                      </div>
                      
                      {/* Internal search inside form */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="খুঁজুন..."
                          value={formSearchQuery}
                          onChange={(e) => setFormSearchQuery(e.target.value)}
                          className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={formCellFilter}
                          onChange={(e) => setFormCellFilter(e.target.value)}
                          className="h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="all">সকল সেল</option>
                          {cells.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                        </select>
                      </div>

                      {/* Mass actions for quick selection */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => selectAllFilteredEmployees(filteredFormEmployees)}
                          className="flex-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          সব সিলেক্ট করুন
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllFilteredEmployees}
                          className="flex-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          সব বাদ দিন
                        </button>
                      </div>

                      {/* Officers Checkboxes scrollbox */}
                      <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-white space-y-1">
                        {(() => {
                          const isWorking = assignmentForm.date ? checkIsWorkingDay(assignmentForm.date, holidays) : true;
                          const isLateSitting = assignmentForm.type === 'LATE_SITTING';
                          const isHoliday = assignmentForm.type === 'HOLIDAY';
                          const isBlocked = (isLateSitting && !isWorking) || (isHoliday && isWorking);
                          
                          if (isBlocked) {
                            return (
                              <div className="p-8 text-center text-red-500/80 font-bold italic text-xs">
                                নির্বাচিত তারিখটি এই ডিউটি ক্যাটাগরির জন্য উপযুক্ত নয়। উপযুক্ত তারিখ বেছে নিন।
                              </div>
                            );
                          }
                          
                          if (!assignmentForm.date) {
                            return (
                              <div className="p-8 text-center text-slate-400 italic text-xs">
                                অনুগ্রহ করে প্রথমে উপরে তারিখ সিলেক্ট করুন।
                              </div>
                            );
                          }

                          return filteredFormEmployees.length > 0 ? (
                            filteredFormEmployees.map(emp => {
                              const isChecked = assignmentForm.selectedEmployeeIds.includes(emp.id);
                              return (
                                 <div 
                                  key={emp.id}
                                  onClick={() => handleEmployeeToggle(emp.id)}
                                  className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                                      {isChecked && <Check size={10} strokeWidth={3} />}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900 leading-tight">{emp.name}</p>
                                      <p className="text-xs text-slate-400 font-medium mt-0.5">{emp.designation}</p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg uppercase font-sans">{emp.cell.name}</span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-[11px] text-center text-slate-400 py-4">কর্মকর্তা পাওয়া যায়নি</p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || (() => {
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
                    }
                    return false;
                  })()}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-semibold transition-all shadow-md mt-4 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isEditingArchive ? (submitting ? 'সম্পাদনা ও আপডেট হচ্ছে...' : 'অফিস আদেশ সম্পাদন ও আপডেট করুন') : (submitting ? 'সংরক্ষণ হচ্ছে...' : 'ডিউটি অ্যাসাইন করুন')}
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: Roster Monthly List Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 w-full space-y-6 xl:col-span-2">
              {/* Controls Menu */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">ডিউটি রোস্টার তালিকা</h3>
                  <p className="text-xs text-slate-400 mt-0.5">মাসিক ভিউ ফিল্টার এবং বরাদ্দ তালিকা।</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {/* Select Cell Filter */}
                  <select
                    value={selectedCell}
                    onChange={(e) => setSelectedCell(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">সকল সেল (All Cells)</option>
                    {cells.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                  </select>

                  {/* Select Month Picker */}
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none font-sans"
                  />
                </div>
              </div>

              {/* Roster Table Grid */}
              {duties.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(
                    duties.reduce((acc, duty) => {
                      const cellName = duty.employee.cell.name;
                      if (!acc[cellName]) {
                        acc[cellName] = [];
                      }
                      acc[cellName].push(duty);
                      return acc;
                    }, {} as Record<string, Duty[]>)
                  ).map(([cellName, cellDuties]) => (
                    <div key={cellName} className="border border-slate-200/60 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/30 p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                          <Building2 size={16} className="text-indigo-500" />
                          {cellName} ({cellDuties.length.toLocaleString('bn-BD')} টি ডিউটি রেকর্ড)
                        </h4>
                      </div>
                      
                      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <table className="w-full text-left text-xs leading-normal">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                              <th className="px-5 py-3">তারিখ</th>
                              <th className="px-5 py-3">কর্মকর্তা</th>
                              <th className="px-5 py-3">পদবী</th>
                              <th className="px-5 py-3">ডিউটির ক্যাটাগরি</th>
                              <th className="px-5 py-3">মোট বিল</th>
                              <th className="px-5 py-3 no-print">অ্যাকশন</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                            {(() => {
                              const cellGroupedDuties = Object.entries(
                                cellDuties.reduce((acc, duty) => {
                                  const key = `${duty.employeeId}-${duty.type}`;
                                  if (!acc[key]) {
                                    acc[key] = {
                                      employee: duty.employee,
                                      type: duty.type,
                                      duties: [],
                                      totalBill: 0
                                    };
                                  }
                                  acc[key].duties.push(duty);
                                  acc[key].totalBill += duty.totalBill;
                                  return acc;
                                }, {} as Record<string, { employee: Employee; type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT'; duties: Duty[]; totalBill: number }>)
                              ).map(([_, val]) => val);

                              return cellGroupedDuties.map((group) => {
                                const datesSorted = group.duties.sort((a, b) => a.date.localeCompare(b.date));
                                const datesJoined = datesSorted.map(d => d.date).join(', ');
                                const bnDatesJoined = datesSorted.map(d => getBanglaDate(d.date)).join(', ');
                                
                                return (
                                  <tr key={`${group.employee.id}-${group.type}`} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                                    <td className="px-5 py-3.5 font-sans font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                                      {datesJoined}
                                      <p className="text-[10px] text-slate-400 mt-0.5 font-normal leading-normal">{bnDatesJoined}</p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <p className="font-bold text-slate-800 dark:text-slate-200">{group.employee.name}</p>
                                      {group.duties[0]?.description && <p className="text-[10px] text-slate-400 font-normal italic mt-0.5">মন্তব্য: {group.duties[0].description}</p>}
                                    </td>
                                    <td className="px-5 py-3.5 font-sans text-[11px]">
                                      {group.employee.designation}
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${getDutyBadgeStyles(group.type)}`}>
                                        {group.type === 'LATE_SITTING' ? 'Late Sitting (লেট সিটিং)' : group.type === 'HOLIDAY' ? 'Holiday Duty (সরকারি ছুটি)' : 'Night Shift (রাত্রীকালীন ডিউটি)'}
                                      </span>
                                      {group.duties.some(d => d.orderRef) && (
                                        <div className="mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono flex items-center gap-1">
                                          <span>স্মারকঃ {group.duties.find(d => d.orderRef)?.orderRef}</span>
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-5 py-3.5 font-bold text-indigo-600 dark:text-indigo-400 font-sans">
                                      ৳{group.totalBill.toLocaleString('bn-BD')}
                                    </td>
                                    <td className="px-5 py-3.5 no-print flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleStartEdit(group.duties[0])}
                                        className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-400 hover:text-indigo-500 transition-colors"
                                        title="সম্পাদনা (Edit)"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={() => deleteGroupedDuties(group.duties)}
                                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors"
                                        title="মুছে ফেলুন"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4 border border-slate-100">
                    <Calendar size={32} />
                  </div>
                  <h4 className="text-base font-semibold text-slate-800 mb-1">কোনো ডিউটি রেকর্ড নেই</h4>
                  <p className="text-sm text-slate-400">অনুগ্রহ করে বাম পাশের প্যানেল থেকে নতুন ডিউটি বরাদ্দ করুন।</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // ----------------------------------------------------
        // GOVERNMENT PRINT MODE (অফিস আদেশ / জিও)
        // ----------------------------------------------------
        <div className="space-y-6">
          {/* Dynamic Media Print Style Overrides to ensure A4 fits on exactly 1 single page with zero double margins */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: A4 !important;
                margin: 0 !important;
              }
              .no-print { display: none !important; }
              body { 
                margin: 0 !important; 
                padding: 0 !important; 
                background: #fff !important; 
                font-family: "Kalpurush", "Noto Sans Bengali", sans-serif !important; 
                font-size: 10px !important;
                line-height: 1.6 !important;
              }
              /* Force resetting Next.js page margins & layout wrapper padding */
              main, .flex-1, .p-4, .lg\\:p-8, .p-6, .space-y-6, .py-6, .my-6 {
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
              }
              .print-a4-layout {
                width: 210mm !important;
                height: 297mm !important;
                padding: 1.0in !important;
                border: none !important;
                box-shadow: none !important;
                font-family: "Kalpurush", "Noto Sans Bengali", sans-serif !important;
                font-size: 10px !important;
                line-height: 1.6 !important;
                box-sizing: border-box !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
                page-break-before: avoid !important;
                overflow: hidden !important;
              }
            }
          `}} />

          {/* Back Controls (No-print) */}
          <div className="no-print flex items-center justify-between glass-card p-4 rounded-2xl">
            <button
              onClick={handleBackToRoster}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ChevronLeft size={16} />
              ফিরে যান (রোস্টার ভিউ)
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => archiveOrder(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                <Printer size={14} />
                প্রিন্ট প্রিভিউ (Print)
              </button>
              <button
                onClick={() => archiveOrder(false)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                <Printer size={14} />
                ডাউনলোড পিডিএফ (Download)
              </button>
            </div>
          </div>

          {/* Configurator Panel (No-print) */}
          <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-4 lg:col-span-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">অফিস আদেশ কাস্টমাইজেশন ও প্রফেশনাল কন্ট্রোল প্যানেল</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">১. ডিউটির ক্যাটাগরি (Category)</label>
                  <select
                    value={printCategory}
                    onChange={(e) => setPrintCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LATE_SITTING">Late Sitting (লেট সিটিং)</option>
                    <option value="HOLIDAY">Holiday Duty (সরকারি ছুটি)</option>
                    <option value="NIGHT_SHIFT">Night Shift (রাত্রীকালীন ডিউটি)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">২. বিল যার অনুকূলে হবে (Bill Favoring To)</label>
                  <select
                    value={payeeEmployeeId}
                    onChange={(e) => setPayeeEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Employee (কর্মকর্তা নির্বাচন)</option>
                    {getGroupedDuties().map(group => (
                      <option key={group.employee.id} value={group.employee.id.toString()}>
                        {group.employee.name} ({getShortDesignation(group.employee.designation)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">৩. আদেশ অনুমোদনকারী জিএম/ডিজিএম</label>
                  <select
                    value={selectedExecutiveId}
                    onChange={(e) => {
                      const execId = e.target.value;
                      setSelectedExecutiveId(execId);
                      const exec = executives.find(ex => ex.id.toString() === execId);
                      if (exec) {
                        setSigningOfficer(exec.name);
                        setSigningDesignation(exec.designation);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select GM/DGM (জিএম/ডিজিএম নির্বাচন)</option>
                    {executives.map(ex => (
                      <option key={ex.id} value={ex.id.toString()}>
                        {ex.name} ({ex.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">৪. স্মারক/সূত্র নম্বর (Order Ref)</label>
                  <input
                    type="text"
                    value={orderRef}
                    onChange={(e) => setOrderRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500">৫. আদেশের তারিখ (Order Date)</label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500">৬. আদেশের মূল বক্তব্য (Order Text)</label>
                  <textarea
                    rows={4}
                    value={orderText}
                    onChange={(e) => setOrderText(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-semibold leading-relaxed focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500">৭. হেডার প্রিন্ট অপশন (Header Option)</label>
                  <select
                    value={headerMode}
                    onChange={(e) => setHeaderMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="with_header">হেডার সহ (With Header - সাধারণ প্রিন্ট)</option>
                    <option value="without_header">হেডার ছাড়া (Without Header - প্যাড পেপার প্রিন্ট)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Scale reference instructions */}
            <div className="space-y-3 lg:col-span-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">প্রিন্ট প্রাক-প্রস্তুতি নির্দেশাবলী</h3>
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/30 text-xs text-indigo-700 dark:text-indigo-400 space-y-2.5">
                <p className="font-bold">💡 অফিস আদেশ তৈরিতে লক্ষণীয়:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>পেজে একই কর্মকর্তার একাধিক তারিখের ডিউটি থাকলে তা কমা দিয়ে একই রোতে বসানো হবে।</li>
                  <li>ডিজিএম এবং বিল প্রাপক (Bill Favoring To) ড্রপডাউন থেকে সিলেক্ট করলে সূত্র ও বিল স্বয়ংক্রিয় রি-রুট হবে।</li>
                  <li>প্রিন্ট করার সময় ব্রাউজার সেটিংস থেকে <strong>Headers and Footers</strong> টিকমার্ক উঠিয়ে দিন এবং মার্জিন <strong>None/Default</strong> রাখুন।</li>
                  <li>আদেশপত্রটি ছবির মত নিখুঁতভাবে **A4 Size** কাগজে প্রিন্টযোগ্য।</li>
                </ul>
              </div>
            </div>
          </div>

          {/* DGM 7500 Tk Apyaon split alert and tabs switchers */}
          {(() => {
            const filtered = duties.filter(d => {
              const matchesCell = selectedCell === 'all' || d.employee.cellId.toString() === selectedCell;
              const matchesCategory = d.type === printCategory;
              return matchesCell && matchesCategory;
            });
            const apyaonRate = printCategory === 'HOLIDAY' ? 250 : printCategory === 'NIGHT_SHIFT' ? 600 : 100;
            const totalApyaon = filtered.length * apyaonRate;
            
            if (totalApyaon <= 7500) return null;
            
            const numParts = Math.ceil(totalApyaon / 7500);
            const parts = getSplitParts(filtered, numParts);
            
            return (
              <div className="no-print w-full max-w-[210mm] mx-auto space-y-4 mb-4 mt-6">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300">
                  <h4 className="font-extrabold text-sm flex items-center gap-2 mb-1">
                    <AlertCircle size={16} />
                    উপ-মহাব্যবস্থাপক (ডিজিএম) এর আপ্যায়ন বিলের সীমা ৭৫০০/- টাকা অতিক্রম করেছে!
                  </h4>
                  <p className="text-xs leading-relaxed">
                    মোট আপ্যায়ন খরচ <strong>{toBanglaDigits(totalApyaon)}/- টাকা</strong> (মোট {toBanglaDigits(filtered.length)}টি ডিউটি)। 
                    তাই নীতিগত সিদ্ধান্ত অনুযায়ী আদেশটি সমান <strong>{toBanglaDigits(numParts)}টি আলাদা অফিস আদেশে</strong> বিভক্ত করা হয়েছে। 
                    অনুগ্রহ করে প্রতিটি অংশ আলাদাভাবে প্রিভিউ করে প্রিন্ট/ডাউনলোড করুন (প্রতিটি অংশের জন্য আলাদা ধারাবাহিক স্মারক সূত্র তৈরি হবে):
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] font-bold">
                    {parts.map((p, idx) => (
                      <span key={idx} className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800/40">
                        অংশ {toBanglaDigits(idx + 1)}: {toBanglaDigits(p.length * apyaonRate)}/- টাকা ({toBanglaDigits(p.length)}টি ডিউটি)
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Part Switcher Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  {Array.from({ length: numParts }).map((_, idx) => {
                    const isActive = activePartIdx === idx;
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setActivePartIdx(idx)}
                        className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-850'
                        }`}
                      >
                        অংশ {toBanglaDigits(idx + 1)} (স্মারক সূত্র: {toBanglaDigits(stableNumber + idx)})
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Interactive Print Mock Sheet */}
          <div className="flex justify-center p-4 bg-slate-100/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-x-auto shadow-inner font-serif">
            {/* Renders exactly like A4 Page in Print Preview with standard 1.0 inch margins all around */}
            <div className="print-a4-layout w-[210mm] h-[297mm] bg-white border border-slate-200 text-black shadow-xl flex flex-col justify-between overflow-hidden relative" style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: 'Kalpurush, "Noto Sans Bengali", sans-serif', padding: '1.0in', boxSizing: 'border-box' }}>
              
              {/* Janata Bank PLC Redesigned Header to match mockup logo exactly */}
              {headerMode === 'with_header' ? (
                <div className="w-full flex justify-between items-start border-b-2 border-[#0b5e9e] pb-2">
                  {/* Left side: Logo & Tagline */}
                  <div className="flex items-start gap-2 text-left">
                    <svg viewBox="0 0 512 512" style={{ width: '64px', height: '64px' }} className="text-[#0b5e9e] shrink-0" fill="none">
                      <g>
                        <path fill="currentColor" d="M175.7,351.4c-53.1,0-96.4-43.3-96.4-96.4c0-24.9,9.5-48.6,26.6-66.5l8.2,7.9c-15.1,15.8-23.5,36.7-23.5,58.7c0,46.9,38.1,85.1,85,85.1c46.9,0,85.1-38.2,85.1-85.1v-97.7h11.4v97.7C272.1,308.1,228.9,351.4,175.7,351.4z"/>
                        <path fill="currentColor" d="M175.7,329.1c-41.3,0-74.9-33.6-74.9-74.9c0-19.4,7.3-37.7,20.7-51.7l8.2,7.9c-11.3,11.8-17.5,27.4-17.5,43.9c0,35.1,28.5,63.6,63.5,63.6c35.1,0,63.6-28.5,63.6-63.6v-96.9h11.4v96.9C250.7,295.4,217,329.1,175.7,329.1z"/>
                        <path fill="currentColor" d="M175.7,306.8c-29.5,0-53.4-24-53.4-53.5c0-13.8,5.2-26.9,14.8-36.9l8.2,7.9c-7.5,7.8-11.6,18.2-11.6,29c0,23.2,18.9,42.1,42.1,42.1c23.2,0,42.1-18.9,42.1-42.1v-96.1h11.4v96.1C229.2,282.8,205.2,306.8,175.7,306.8z"/>
                        <path fill="currentColor" d="M175.7,284.4c-17.6,0-32-14.3-32-32c0-8.3,3.1-16.1,8.8-22.1l8.2,7.9c-3.7,3.8-5.7,8.9-5.7,14.2c0,11.4,9.2,20.6,20.6,20.6c11.4,0,20.6-9.2,20.6-20.6v-95.2h11.4v95.2C207.7,270.1,193.3,284.4,175.7,284.4z"/>
                        <path fill="currentColor" d="M400.1,255.1c9.9-7.8,15.9-19.8,15.9-32.7c0-23-18.7-41.6-41.6-41.6h-85.1v11.7h85.1c16.5,0,29.9,13.4,29.9,29.9c0,11.8-7,22.5-17.8,27.3l-12.1,5.4l12.1,5.4c10.8,4.8,17.8,15.5,17.8,27.3c0,16.5-13.4,30-29.9,30H270.2c-2.7,4.1-5.8,8-9,11.7h113.1c23,0,41.6-18.7,41.6-41.7C416,274.8,410,262.8,400.1,255.1z"/>
                        <path fill="currentColor" d="M442.1,218.5c0-33.9-27.6-61.5-61.5-61.5h-91.4v11.4h91.4c27.7,0,50.2,22.5,50.2,50.2c0,12.1-4.4,23.8-12.3,32.8l-3.3,3.7l3.3,3.7c7.9,9.1,12.3,20.8,12.3,32.9c0,27.7-22.5,50.2-50.2,50.2h-132c-5,4.2-10.5,8-16.2,11.4h148.2c33.9,0,61.5-27.6,61.5-61.5c0-13.2-4.3-26-12.1-36.6C437.9,244.6,442.1,231.8,442.1,218.5z"/>
                        <path fill="currentColor" d="M362.7,204.7h-73.5v11.4h73.5c5.4,0,9.7,4.3,9.7,9.7c0,2.6-1,5-2.9,6.9c-1.8,1.8-4.2,2.8-6.8,2.8h-73.5v11.4h73.5c5.7,0,11-2.2,14.9-6.2c4-4,6.2-9.3,6.2-14.9C383.8,214.2,374.3,204.7,362.7,204.7z"/>
                        <path fill="currentColor" d="M362.7,263.3h-73.8c-0.3,3.8-0.8,7.6-1.4,11.4h75.2c5.4,0,9.7,4.4,9.7,9.7c0,2.6-1,5.1-2.9,6.9c-1.8,1.8-4.3,2.8-6.8,2.8h-80.4c-1.4,3.9-3.1,7.7-4.9,11.4h85.4c5.6,0,10.9-2.2,14.8-6.1c4-3.9,6.3-9.3,6.3-15C383.8,272.7,374.3,263.3,362.7,263.3z"/>
                        <path fill="currentColor" d="M255.8,420.3c-64.5,0-129-12.9-192.9-38.6l-2.7-1.1l-0.7-2.8c-24.7-97.3-24.7-177.2,0.2-244.3l0.9-2.4l2.3-0.9c128.4-51.4,258.3-51.4,386.2,0l2.7,1.1l0.7,2.8c24.7,97.3,24.7,177.2-0.2,244.3l-0.9,2.4l-2.3,0.9C384.9,407.4,320.3,420.3,255.8,420.3z M69.8,372.2c123.4,48.9,248.8,48.9,372.7-0.1c22.9-63.7,22.8-139.8-0.3-232.3c-123.4-48.9-248.8-48.9-372.7,0.1C46.6,203.6,46.7,279.7,69.8,372.2z"/>
                      </g>
                    </svg>
                    <div className="font-serif leading-none mt-0.5">
                      <h2 style={{ fontFamily: 'Kalpurush', fontSize: '24px', fontWeight: 'bold', color: '#0b5e9e', lineHeight: '1.0' }}>জনতা ব্যাংক পিএলসি.</h2>
                      <p style={{ fontFamily: 'Kalpurush', fontSize: '10px', fontWeight: 'bold', color: '#555555', marginTop: '4px', lineHeight: '1.0' }}>উন্নয়নে আপনার বিশ্বস্ত অংশীদার</p>
                    </div>
                  </div>

                  {/* Right side: Department */}
                  <div className="text-right mt-1">
                    <h3 style={{ fontFamily: 'Kalpurush', fontSize: '18px', fontWeight: 'bold', color: '#000000', lineHeight: '1.0', marginTop: '8px' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h3>
                  </div>
                </div>
              ) : (
                <div className="w-full h-[85px] border-b-2 border-transparent pb-2" />
              )}

              {/* Sub-header line: Reference and Date (With exactly 1 inch space below it) */}
              <div className="w-full flex justify-between items-center text-[10px] pt-1 pb-1 border-b border-black/10 mt-1" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0', marginBottom: '0.4in' }}>
                <span className="font-bold">সূত্রঃ {orderRef}</span>
                <span className="font-bold">
                  তারিখঃ {toBanglaDigits(new Date(orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং
                </span>
              </div>

              {/* Title and Main Body */}
              <div className="flex-1 flex flex-col justify-start pt-2 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6' }}>
                <div className="space-y-2.5">
                  <h2 className="text-center text-[12px] font-extrabold underline decoration-black underline-offset-2" style={{ fontFamily: 'Kalpurush', fontSize: '12px', lineHeight: '1.4' }}>
                    অফিস নির্দেশ
                  </h2>
                  
                  <p 
                    className="text-justify leading-normal mt-2 text-[10px] text-slate-950 text-indent-8"
                    style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: orderText }}
                  />

                  {/* Redesigned Printed Duty Table Grouped by Employee */}
                  {getGroupedDuties().length > 0 ? (
                    <table className="w-full border-collapse border border-black text-center mt-2.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                      <thead>
                        <tr className="bg-slate-50 font-bold border-b border-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                          <th className="border border-black p-1 w-[8%] text-center">ক্রমিক নং</th>
                          <th className="border border-black p-1 text-left pl-2 w-[28%]">নির্বাহী/ কর্মকর্তার নাম</th>
                          <th className="border border-black p-1 text-center w-[12%]">পদবী</th>
                          <th className="border border-black p-1 text-left pl-2 w-[27%]">কাজের বিবরণ</th>
                          <th className="border border-black p-1 text-center w-[25%]">তারিখ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getGroupedDuties().map((group, index) => (
                          <tr key={group.employee.id} className="text-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                            <td className="border border-black p-1 text-center font-normal" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              {toBanglaDigits(index + 1)}
                            </td>
                            <td className="border border-black p-1 text-left pl-2 leading-tight font-normal text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              {group.employee.name.startsWith('জনাব') ? group.employee.name : `জনাব ${group.employee.name}`}
                            </td>
                            <td className="border border-black p-1 text-center font-normal" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              {getShortDesignation(group.employee.designation)}
                            </td>
                            <td className="border border-black p-1 text-left pl-2 leading-tight font-normal text-black" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              {group.description}
                            </td>
                            <td className="border border-black p-1 text-center font-normal font-serif leading-snug tracking-tight" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              {getFormattedDateList(group.dates)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 border border-dashed border-slate-300 text-center text-slate-400 italic">
                      নির্বাচিত ক্যাটাগরি ও সেলের আন্ডারে কোনো ডিউটি রেকর্ড খুঁজে পাওয়া যায়নি।
                    </div>
                  )}
                </div>

                {/* Redesigned bottom-left signature aligned exactly like mockup with exactly 1 inch of space above it */}
                <div className="flex justify-between items-start text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0', marginTop: '1.0in' }}>
                  <div className="w-[50%] text-left space-y-0.5 pl-2 leading-none">
                    <p className="font-extrabold text-[10px] text-black">({signingOfficer || 'ডিজিএম নাম সিলেক্ট করুন'})</p>
                    <p className="font-semibold text-slate-800 text-[10px]">{signingDesignation}</p>
                  </div>
                  <div className="w-[50%]" />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Edit/Update Duty Modal */}
      {editingDuty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
              <div>
                <h3 className="font-bold text-base">ডিউটি তথ্য সংশোধন</h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">{editingDuty.employee.name} ({editingDuty.employee.designation})</p>
              </div>
              <button
                onClick={() => setEditingDuty(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-sans text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  {editError}
                </div>
              )}

              {/* Edit Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">১. ডিউটির ক্যাটাগরি</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="LATE_SITTING">Late Sitting (লেট সিটিং)</option>
                  <option value="HOLIDAY">Holiday Duty (সরকারি ছুটি)</option>
                  <option value="NIGHT_SHIFT">Night Shift (রাত্রীকালীন ডিউটি)</option>
                </select>
              </div>

              {/* Edit Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">২. ডিউটির তারিখ</label>
                <input
                  type="date"
                  required
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDuty(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-md"
                >
                  {updating ? 'আপডেট হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
