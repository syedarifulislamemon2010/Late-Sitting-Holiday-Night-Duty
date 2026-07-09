'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useProfile } from '@/context/ProfileContext';
import { TableSkeleton, CardSkeleton } from "@/components/SkeletonLoader";
import { 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  Calendar, 
  DollarSign, 
  Clock,
  ShieldCheck,
  Award,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileSignature,
  Eye,
  Receipt,
  Trash2,
  X,
  FileText,
  Users,
  Banknote,
  Edit3
} from 'lucide-react';

import LedgerTab from './components/LedgerTab';
import OrdersTab from './components/OrdersTab';
import BillsTab from './components/BillsTab';
import ReportsTab from './components/ReportsTab';
import BillPrintLayout from './components/BillPrintLayout';
import BulkBillPrintLayout from './components/BulkBillPrintLayout';
import { toBanglaDigits, getBanglaDate, getBanglaMonthYearLabel, getBanglaNumberWords } from '@/lib/bengali-converter';
import { getShortDesignation, renderDatesInPairs, cleanBracketName } from '@/lib/print-helpers';




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

interface User {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
  cells?: Cell[];
}

interface Executive {
  id: number;
  name: string;
  designation: string;
}

interface OfficeOrder {
  id: number;
  orderRef: string;
  originalOrderRef?: string;
  orderDate: string;
  category: string;
  employeeName: string;
  cellName: string | null;
  status: string;
  dutiesJson?: string | null;
  duties?: OrderDuty[];
  content?: {
    subjectText?: string;
    openingParagraph?: string;
    signingOfficer?: string;
    signingDesignation?: string;
    representativeDesignation?: string;
    totalDays?: number;
    totalApyaon?: number;
    totalTransport?: number;
    grandTotal?: number;
    grandTotalInWords?: string;
    backingOrderId?: number | null;
    backingOrderRef?: string | null;
    backingOrderDate?: string | null;
    orderText?: string;
    copies?: string[];
  } | null;
}

interface OrderDuty {
  employeeId?: string | null;
  employeeName: string;
  designation: string;
  days: number;
  apyaonRate: number;
  totalApyaon: number;
  totalTransport: number;
  grandTotal: number;
  datesFormatted: string;
  dates?: string;
}

interface DutyListEntry {
  employeeName?: string;
  name?: string;
  designation?: string;
  bankId?: string;
  datesFormatted?: string;
  date?: string;
  description?: string;
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

interface EmployeeBillingSummary {
  employeeId: number;
  name: string;
  designation: string;
  cellName: string;
  bankId: string | null;
  fileNo: string | null;
  lateDays: number;
  lateAllowance1: number;
  lateAllowance2: number;
  holidayDays: number;
  holidayAllowance1: number;
  holidayAllowance2: number;
  nightDays: number;
  nightAllowance1: number;
  nightAllowance2: number;
  grandTotal: number;
  datesFormatted?: string;
}

// Convert English digits/text to Bengali digits
;

const getSlotName = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  const banglaMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const monthName = banglaMonths[monthNum - 1] || '';
  
  let dayStr = '';
  if (day === 1) dayStr = '১লা';
  else if (day === 2) dayStr = '২রা';
  else if (day === 3) dayStr = '৩রা';
  else if (day === 4) dayStr = '৪ঠা';
  else if (day >= 5 && day <= 18) dayStr = `${toBanglaDigits(day)}ই`;
  else dayStr = `${toBanglaDigits(day)}শে`;
  
  return `${dayStr} ${monthName}, ${toBanglaDigits(year)}`;
};

const getNormalizedRef = (ref: string) => {
  if (!ref) return '';
  let clean = ref;
  if (clean.endsWith('/বিল')) {
    clean = clean.replace(/\/বিল$/, '');
  }
  const parts = clean.split('/');
  if (parts.length >= 3) {
    parts.splice(2, 1); // remove name component
  }
  return parts.join('/');
};

const getSeniorityRank = (designation: string): number => {
  if (!designation) return 99;
  const d = designation.toUpperCase();
  if (d.includes('এসপিও') || d.includes('SPO') || d.includes('সিনিয়র প্রিন্সিপাল') || d.includes('SENIOR PRINCIPAL')) {
    return 1;
  }
  if (d.includes('পিও') || d.includes('PO') || d.includes('প্রিন্সিপাল') || d.includes('PRINCIPAL')) {
    return 2;
  }
  if (d.includes('এসও-আইটি') || d.includes('SO-IT') || d.includes('সিনিয়র অফিসার') || d.includes('SENIOR OFFICER')) {
    return 3;
  }
  return 4; // default fallback
};

// Rates configuration strictly for calculations
const getPrintCategoryRates = (printCategory: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT') => {
  let transportRate = 200;
  let apyaonRate = 100;
  if (printCategory === 'HOLIDAY') {
    transportRate = 250;
    apyaonRate = 250;
  } else if (printCategory === 'NIGHT_SHIFT') {
    transportRate = 400;
    apyaonRate = 600;
  }
  return { transportRate, apyaonRate };
};const userHasAccessToOrder = (o: OfficeOrder, currentUser: any, employees: Employee[]) => {
  if (!currentUser) return false;
  if (currentUser.role === 'ADMIN') return true;

  const userCellNames = currentUser.cells?.map((c: any) => c.name) || [];

  // 1. Direct cell name match
  if (o.cellName && userCellNames.includes(o.cellName)) {
    return true;
  }

  // 2. Fallback: Check involved employees
  let dutiesList: any[] = o.duties || [];
  if (dutiesList.length === 0 && o.dutiesJson) {
    try {
      dutiesList = JSON.parse(o.dutiesJson);
    } catch (e) {
      console.error(e);
    }
  }

  if (dutiesList.length === 0) {
    if (o.employeeName) {
      const matched = employees.find(e => e.name === o.employeeName);
      if (matched && matched.cell?.name && userCellNames.includes(matched.cell.name)) {
        return true;
      }
    }
    return false;
  }

  return dutiesList.some((d: any) => {
    const empIdStr = d.employeeId ? d.employeeId.toString() : '';
    const empName = d.employeeName || '';
    
    const matched = employees.find(e => 
      (e.id && e.id.toString() === empIdStr) || 
      (e.bankId && e.bankId.toString() === empIdStr) || 
      (e.name && e.name === empName)
    );

    return matched && matched.cell?.name && userCellNames.includes(matched.cell.name);
  });
};

export default function BillingPage() {
  const { currentUser } = useProfile();
  const userCellNamesString = currentUser?.cells?.map(c => c.name).sort().join(',') || '';
  const userRole = currentUser?.role || '';
  const userUsername = currentUser?.username || '';
  const [activeTab, setActiveTab] = useState<'ledger' | 'orders' | 'bills' | 'reports'>('ledger');
  const [viewingOrder, setViewingOrder] = useState<OfficeOrder | null>(null);
  const [viewingOrders, setViewingOrders] = useState<OfficeOrder[] | null>(null);
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isReportPrintMode, setIsReportPrintMode] = useState(false);
  const [billGenerated, setBillGenerated] = useState(false);
  const isFirstLoadRef = useRef(true);
  const isInitializingArchiveRef = useRef(false);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [baseOrderRef, setBaseOrderRef] = useState('');
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [currentPickerYear, setCurrentPickerYear] = useState(() => new Date().getFullYear());
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    if (val !== 'all') {
      setPrintCategory(val as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT');
    }
  };

  const handlePrintButtonClick = () => {
    if (selectedCategory === 'all') {
      const categoriesWithDuties = new Set<'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT'>();
      duties.forEach(d => {
        if (d.type === 'LATE_SITTING' || d.type === 'HOLIDAY' || d.type === 'NIGHT_SHIFT') {
          categoriesWithDuties.add(d.type);
        }
      });

      if (categoriesWithDuties.size === 0) {
        alert('কোনো ডিউটি পাওয়া যায়নি।');
        return;
      }

      if (categoriesWithDuties.size === 1) {
        const cat = Array.from(categoriesWithDuties)[0];
        handleCategoryChange(cat);
        setIsPrintMode(true);
      } else {
        alert('একাধিক ক্যাটাগরির ডিউটি রয়েছে। অনুগ্রহ করে ফিল্টার প্যানেল থেকে নির্দিষ্ট ক্যাটাগরি ফিল্টার করে প্রিন্ট করুন। প্রথম ক্যাটাগরিটি প্রিন্টের জন্য লোড করা হচ্ছে।');
        const firstCat = Array.from(categoriesWithDuties)[0];
        handleCategoryChange(firstCat);
        setIsPrintMode(true);
      }
    } else {
      setIsPrintMode(true);
    }
  };

  // Legal Print Form Configs
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isLedgerPrintMode, setIsLedgerPrintMode] = useState(false);
  const [isEditingArchive, setIsEditingArchive] = useState(false);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [printCategory, setPrintCategory] = useState<'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT'>('LATE_SITTING');
  
  // Janata Bank Specific Configs
  const [subjectText, setSubjectText] = useState('যাতায়াত ও আপ্যায়ন ভাতা প্রদান প্রসঙ্গে।');
  const [representativeName, setRepresentativeName] = useState('জনাব শাহনেওয়াজ মাহমুদ');
  const [representativeDesignation, setRepresentativeDesignation] = useState('এসও-আইটি');
  const [openingParagraph, setOpeningParagraph] = useState('');

  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');
  const [signingOfficer, setSigningOfficer] = useState('জনাব মোহাম্মদ সোহরাব হোসেন');
  const [signingDesignation, setSigningDesignation] = useState('উপ-মহাব্যবস্থাপক');

  const [archiving, setArchiving] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const [billRef, setBillRef] = useState('');
  const [originalBillRef, setOriginalBillRef] = useState('');
  const [selectedOrderRef, setSelectedOrderRef] = useState<string>('');
  const [initialBillValues, setInitialBillValues] = useState<{
    printCategory: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
    billDate: string;
    representativeName: string;
    subjectText: string;
    openingParagraph: string;
    signingOfficer: string;
    signingDesignation: string;
  } | null>(null);
  const [msgBanner, setMsgBanner] = useState<{ type: 'success' | 'cancel'; text: string } | null>(null);
  
  const isBillDirty = useMemo(() => {
    if (!isEditingArchive || !initialBillValues) return false;
    
    if (printCategory !== initialBillValues.printCategory) return true;
    if (billDate !== initialBillValues.billDate) return true;
    if (representativeName !== initialBillValues.representativeName) return true;
    if (subjectText !== initialBillValues.subjectText) return true;
    if (openingParagraph !== initialBillValues.openingParagraph) return true;
    if (signingOfficer !== initialBillValues.signingOfficer) return true;
    if (signingDesignation !== initialBillValues.signingDesignation) return true;
    
    return false;
  }, [
    isEditingArchive,
    initialBillValues,
    printCategory,
    billDate,
    representativeName,
    subjectText,
    openingParagraph,
    signingOfficer,
    signingDesignation
  ]);

  const [pendingOrderRefs, setPendingOrderRefs] = useState<string[]>([]);
  const [billedOrderRefs, setBilledOrderRefs] = useState<string[]>([]);
  const [randomNumber] = useState(() => Math.floor(10 + Math.random() * 90));
  const [archivedOrders, setArchivedOrders] = useState<OfficeOrder[]>([]);
  const [showOrderWarning, setShowOrderWarning] = useState(false);

  // Sync billRef dynamically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('edit_ref')) {
        const hasRepChanged = initialBillValues && representativeName !== initialBillValues.representativeName;
        const hasCategoryChanged = initialBillValues && printCategory !== initialBillValues.printCategory;
        if (!hasRepChanged && !hasCategoryChanged) {
          return;
        }
      }
    }

    let repName = 'ইমন';
    if (representativeName) {
      repName = representativeName.replace(/^জনাব\s+/, '');
    }
    
    const targetOrderRef = selectedOrderRef || baseOrderRef;
    
    if (targetOrderRef) {
      const parts = targetOrderRef.split('/');
      if (parts.length >= 3) {
        parts[2] = repName;
      }
      const val = parts.join('/') + '/বিল';
      setTimeout(() => {
        setBillRef(val);
      }, 0);
    } else {
      const catBangla = printCategory === 'LATE_SITTING' ? 'লেট-সিটিং' : printCategory === 'HOLIDAY' ? 'অফ-ডে' : 'নাইট';
      const bnYear = toBanglaDigits('2026');
      const bnRand = toBanglaDigits(randomNumber);
      const val = `৯১০৩/ডেভ/${repName}/${catBangla}/অফিস-নির্দেশ/${bnYear}/${bnRand}/বিল`;
      setTimeout(() => {
        setBillRef(val);
      }, 0);
    }
  }, [baseOrderRef, selectedOrderRef, printCategory, representativeName, randomNumber, initialBillValues]);

  const [executives, setExecutives] = useState<Executive[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const getShortDesignation = (desig: string) => {
    const match = desig.match(/\(([^)]+)\)/);
    return match ? match[1] : desig;
  };

  // Load Cells, Executives, and Employees list
  useEffect(() => {
    async function loadStaticData() {
      try {
        const [cellRes, execRes, empRes] = await Promise.all([
          fetch('/api/cells'),
          fetch('/api/executives'),
          fetch('/api/employees')
        ]);
        const cellData = await cellRes.json();
        const execData = await execRes.json();
        const empData = await empRes.json();
        setCells(Array.isArray(cellData) ? cellData : []);
        setEmployees(Array.isArray(empData) ? empData : []);
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
            return a.id - b.id;
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
        console.error('Error loading static data:', err);
      }
    }
    loadStaticData();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('orderRef') || params.get('edit_ref')) {
        return;
      }
    }
    if (currentUser && currentUser.role !== 'ADMIN' && employees.length > 0) {
      const matchedEmp = employees.find(e => e.bankId && e.bankId.trim().toLowerCase() === currentUser.username?.trim().toLowerCase());
      const primaryCellId = matchedEmp ? matchedEmp.cellId : (currentUser.cells?.[0]?.id || null);
      if (primaryCellId) {
        setTimeout(() => {
          setSelectedCell(primaryCellId.toString());
        }, 0);
      }
    }
  }, [currentUser, employees]);

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

  const loadArchivedBill = useCallback(async (editRefVal: string) => {
    isInitializingArchiveRef.current = true;
    try {
      const res = await fetch('/api/office-orders');
      if (res.ok) {
        const orders = await res.json();
        const archivedBill = orders.find((o: OfficeOrder) => o.orderRef === editRefVal);
        if (archivedBill) {
          setIsEditingArchive(true);
          setIsPrintMode(true);
          setOriginalBillRef(editRefVal);
          setBillRef(editRefVal);
          
          if (archivedBill.category && archivedBill.category.startsWith('BILL_')) {
            setTimeout(() => {
              setPrintCategory(archivedBill.category.slice(5) as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT');
            }, 0);
          }
          setBillDate(archivedBill.orderDate || new Date().toISOString().split('T')[0]);
          setRepresentativeName(archivedBill.employeeName || '');
          
           let baseRef = editRefVal;
          if (baseRef.endsWith('/বিল')) {
            baseRef = baseRef.replace(/\/বিল$/, '');
          }
          setBaseOrderRef(baseRef);
          setSelectedOrderRef(baseRef);

          if (archivedBill.content) {
            if (archivedBill.content.openingParagraph) {
              setOpeningParagraph(archivedBill.content.openingParagraph);
            }
            if (archivedBill.content.subjectText) {
              setSubjectText(archivedBill.content.subjectText);
            }
            if (archivedBill.content.signingOfficer) {
              setSigningOfficer(archivedBill.content.signingOfficer);
            }
            if (archivedBill.content.signingDesignation) {
              setSigningDesignation(archivedBill.content.signingDesignation);
            }
          }
          let categoryVal: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' = 'LATE_SITTING';
          if (archivedBill.category && archivedBill.category.startsWith('BILL_')) {
            categoryVal = archivedBill.category.slice(5) as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
          }
          setInitialBillValues({
            printCategory: categoryVal,
            billDate: archivedBill.orderDate || new Date().toISOString().split('T')[0],
            representativeName: archivedBill.employeeName || '',
            subjectText: archivedBill.content?.subjectText || '',
            openingParagraph: archivedBill.content?.openingParagraph || '',
            signingOfficer: archivedBill.content?.signingOfficer || '',
            signingDesignation: archivedBill.content?.signingDesignation || ''
          });
          if (archivedBill.status === 'Generated' || archivedBill.status === 'Modified' || archivedBill.status === 'Generated & Printed' || archivedBill.status === 'Printed') {
            setBillGenerated(true);
          } else {
            setBillGenerated(false);
          }
        }
      }
    } catch (err) {
      console.error('Error loading archived bill for editing:', err);
    } finally {
      setTimeout(() => {
        isInitializingArchiveRef.current = false;
      }, 300);
    }
  }, [
    setIsEditingArchive,
    setIsPrintMode,
    setOriginalBillRef,
    setBillRef,
    setPrintCategory,
    setBillDate,
    setRepresentativeName,
    setBaseOrderRef,
    setOpeningParagraph,
    setSubjectText,
    setSigningOfficer,
    setSigningDesignation,
    setBillGenerated
  ]);

  // Load archived bill details if edit_ref query param is present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const editRef = params.get('edit_ref');
    if (editRef) {
      setTimeout(() => {
        loadArchivedBill(editRef);
      }, 0);
    }
  }, [loadArchivedBill]);

  // Load archived order details if orderRef query param is present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const orderRefParam = params.get('orderRef');
    if (orderRefParam) {
      const targetRef = orderRefParam;
      async function loadTargetOrder() {
        try {
          const [cellRes, orderRes] = await Promise.all([
            fetch('/api/cells'),
            fetch('/api/office-orders')
          ]);
          if (cellRes.ok && orderRes.ok) {
            const localCells = await cellRes.json();
            const orders = await orderRes.json();
            const matchedOrder = orders.find((o: OfficeOrder) => o.orderRef === targetRef);
            if (!matchedOrder) {
              alert('রেফারেন্সকৃত অফিস আদেশটি খুঁজে পাওয়া যায়নি।');
              window.location.href = '/documents';
              return;
            }
            if (matchedOrder.status === 'Deleted') {
              alert('এই অফিস আদেশটি মুছে ফেলা হয়েছে। মুছে ফেলা আদেশের বিল তৈরি করা সম্ভব নয়।');
              window.location.href = '/documents';
              return;
            }
            if (matchedOrder.status !== 'Generated & Printed' && matchedOrder.status !== 'Printed' && matchedOrder.status !== 'Generated' && matchedOrder.status !== 'Modified') {
              alert(`এই অফিস আদেশের বিল তৈরি করা যাবে না। বিল তৈরির পূর্বে অফিস আদেশটি প্রিন্ট অথবা জেনারেটেড অবস্থায় থাকতে হবে (বর্তমান অবস্থা: ${matchedOrder.status})।`);
              window.location.href = '/documents';
              return;
            }

            if (matchedOrder) {
              setSelectedOrderRef(targetRef);
              setPrintCategory(matchedOrder.category as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT');
              setIsPrintMode(true);
              
              if (matchedOrder.employeeName) {
                setRepresentativeName(matchedOrder.employeeName);
              }
              
              if (matchedOrder.cellName) {
                const matchedCell = localCells.find((c: Cell) => c.name === matchedOrder.cellName);
                if (matchedCell) {
                  setSelectedCell(matchedCell.id.toString());
                }
              }
              
              // Extract month from duties/dutiesJson
              let dutiesList: DutyListEntry[] = (matchedOrder.duties as any) || [];
              if (dutiesList.length === 0 && matchedOrder.dutiesJson) {
                try {
                  dutiesList = JSON.parse(matchedOrder.dutiesJson);
                } catch (e) {
                  console.error('Failed to parse dutiesJson:', e);
                }
              }
              
              let yearMonth = '';
              if (dutiesList.length > 0) {
                const firstDuty = dutiesList[0] as any;
                const firstDate = firstDuty?.date || (Array.isArray(firstDuty?.dates) && firstDuty.dates[0]) || '';
                if (firstDate) {
                  const parts = firstDate.split('-');
                  if (parts.length >= 2) yearMonth = `${parts[0]}-${parts[1]}`;
                }
              }
              if (!yearMonth && matchedOrder.orderDate) {
                const parts = matchedOrder.orderDate.split('-');
                if (parts.length >= 2) yearMonth = `${parts[0]}-${parts[1]}`;
              }
              
              if (yearMonth) {
                setSelectedMonth(yearMonth);
              }
            }
          }
        } catch (err) {
          console.error('Error loading targeted order for billing:', err);
        }
      }
      loadTargetOrder();
    }
  }, []);

  // Fetch duties based on selected month & filters
  const fetchDutiesForBilling = useCallback(async () => {
    try {
      setLoading(true);
      
      let urlOrderRef = '';
      let urlEditRef = '';
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        urlOrderRef = params.get('orderRef') || '';
        urlEditRef = params.get('edit_ref') || '';
      }
      
      let backingRef = '';
      if (urlEditRef) {
        backingRef = urlEditRef.endsWith('/বিল') ? urlEditRef.replace(/\/বিল$/, '') : urlEditRef;
      }
      const orderRefToFetch = selectedOrderRef || urlOrderRef || backingRef;

      let activeList: Duty[] = [];
      if (orderRefToFetch) {
        const res = await fetch(`/api/duties?orderRef=${encodeURIComponent(orderRefToFetch)}&includeArchived=true`);
        const data = await res.json();
        activeList = Array.isArray(data) ? data : [];
      } else {
        let queryUrl = `/api/duties?includeArchived=true`;
        if (selectedMonth !== 'all') {
          const yearMonth = selectedMonth.split('-');
          const year = yearMonth[0];
          const month = yearMonth[1];
          
          const startDate = `${year}-${month}-01`;
          const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
          const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
          queryUrl += `&startDate=${startDate}&endDate=${endDate}`;
        }
        if (selectedCell !== 'all') {
          queryUrl += `&cellId=${selectedCell}`;
        }
        
        const res = await fetch(queryUrl);
        const data = await res.json();
        activeList = Array.isArray(data) ? data : [];
      }

      if (currentUser && currentUser.role !== 'ADMIN') {
        const userCellNames = currentUser.cells?.map(c => c.name) || [];
        activeList = activeList.filter(d => d.employee?.cell?.name && userCellNames.includes(d.employee.cell.name));
      }

      // Fetch all archived office orders and bills
      const ordersRes = await fetch('/api/office-orders');
      const ordersData = await ordersRes.json();
      let archivedOrdersList: OfficeOrder[] = Array.isArray(ordersData) ? ordersData : [];

      if (currentUser && currentUser.role !== 'ADMIN') {
        archivedOrdersList = archivedOrdersList.filter(o => userHasAccessToOrder(o, currentUser, employees));
      }
      setArchivedOrders(archivedOrdersList);



      const archivedBillNormalizedRefs = new Set(
        archivedOrdersList
          .filter((o: OfficeOrder) => o.category?.startsWith('BILL_') || o.orderRef?.endsWith('/বিল'))
          .map((o: OfficeOrder) => getNormalizedRef(o.orderRef))
      );

      const printedOrderRefs = new Set(
        archivedOrdersList
          .filter((o: OfficeOrder) => !o.category?.startsWith('BILL_') && (o.status === 'Generated & Printed' || o.status === 'Printed' || o.status === 'Generated' || o.status === 'Modified'))
          .map((o: OfficeOrder) => o.orderRef)
      );

      const filteredDuties = activeList.filter((d: Duty) => {
        if (orderRefToFetch) return true; // Keep all duties for the target order when fetching specifically for it
        if (!d.orderRef) return false; // Must have an office order generated
        if (!printedOrderRefs.has(d.orderRef)) return false; // Must have a matching printed office order in status Printed/Generated & Printed
        if (d.orderRef.endsWith('/বিল')) return false; // Already billed
        const norm = getNormalizedRef(d.orderRef);
        return !archivedBillNormalizedRefs.has(norm); // Must NOT have a bill generated
      });

      const hasUnbilledDutiesWithoutOrder = activeList.some((d: Duty) => {
        if (!d.orderRef) return true;
        if (d.orderRef.endsWith('/বিল')) return false;
        const norm = getNormalizedRef(d.orderRef);
        if (archivedBillNormalizedRefs.has(norm)) return false;
        return !printedOrderRefs.has(d.orderRef);
      });
      setShowOrderWarning(activeList.length > 0 && hasUnbilledDutiesWithoutOrder && filteredDuties.length === 0);

      // Extract distinct orderRefs for the selected printCategory
      const pendingRefs = Array.from(
        new Set(
          filteredDuties
            .filter((d: Duty) => d.type === printCategory)
            .map((d: Duty) => d.orderRef)
            .filter((ref): ref is string => Boolean(ref))
        )
      ) as string[];

      const billedRefs = Array.from(
        new Set(
          archivedOrdersList
            .filter((o: OfficeOrder) => {
              const isOfficeOrder = o.category === printCategory && (o.status === 'Generated & Printed' || o.status === 'Printed' || o.status === 'Generated' || o.status === 'Modified');
              if (!isOfficeOrder) return false;
              const norm = getNormalizedRef(o.orderRef);
              return archivedBillNormalizedRefs.has(norm);
            })
            .map((o: OfficeOrder) => o.orderRef)
        )
      ) as string[];
      
      if (orderRefToFetch) {
        setPendingOrderRefs([orderRefToFetch]);
        setBilledOrderRefs([]);
        setSelectedOrderRef(orderRefToFetch);
      } else {
        setPendingOrderRefs(pendingRefs);
        setBilledOrderRefs(billedRefs);
        if (pendingRefs.length > 0) {
          setSelectedOrderRef(current => {
            if (!current || (!pendingRefs.includes(current) && !billedRefs.includes(current))) {
              return pendingRefs[0];
            }
            return current;
          });
        } else if (billedRefs.length > 0) {
          setSelectedOrderRef(current => {
            if (!current || (!pendingRefs.includes(current) && !billedRefs.includes(current))) {
              return billedRefs[0];
            }
            return current;
          });
        } else {
          setSelectedOrderRef('');
        }
      }

      setDuties(filteredDuties);
    } catch (err) {
      console.error('Error fetching duties for billing:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedCell, printCategory, selectedOrderRef, userCellNamesString, userRole, userUsername, employees]);

  const handleBackToLedger = () => {
    setIsPrintMode(false);
    setIsEditingArchive(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/billing');
    }
    setTimeout(() => {
      fetchDutiesForBilling();
    }, 0);
  };

  const handleCancelEditBill = () => {
    setIsPrintMode(false);
    setIsEditingArchive(false);
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || '/documents';
    const redirectUrl = from.includes('?') ? `${from}&msg=cancel` : `${from}?msg=cancel`;
    window.location.assign(redirectUrl);
  };

  useEffect(() => {
    setTimeout(() => {
      fetchDutiesForBilling();
    }, 0);
  }, [fetchDutiesForBilling]);

  useEffect(() => {
    if (!isPrintMode) {
      setSelectedOrderRef('');
    }
  }, [isPrintMode]);

  // Reset billGenerated to false if inputs change (excluding initial load)
  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }
    if (isInitializingArchiveRef.current) {
      return;
    }
    console.log("Billing input changed, resetting billGenerated to false");
    setBillGenerated(false);
  }, [
    selectedMonth,
    selectedCell,
    selectedCategory,
    printCategory,
    openingParagraph,
    subjectText,
    signingOfficer,
    signingDesignation,
    representativeName,
    billDate
  ]);

  // Reactive effect to keep baseOrderRef in sync with printCategory and duties
  useEffect(() => {
    const firstDuty = duties.find(d => d.type === printCategory && d.orderRef);
    setTimeout(() => {
      setBaseOrderRef(firstDuty ? firstDuty.orderRef || '' : '');
    }, 0);
  }, [duties, printCategory]);

  // Sync templates and openingParagraph dynamically based on printCategory
  useEffect(() => {
    let text = '';
    if (printCategory === 'LATE_SITTING') {
      text = 'কর্তৃপক্ষের নির্দেশক্রমে Online Banking Software T-24 বাস্তবায়ন ও উক্ত Software দ্বারা পরিচালিত শাখা সমুহে অপারেশনাল সহায়তা প্রদানের নিমিত্তে অত্র ডিপার্টমেন্টের নিম্নবর্ণিত কর্মকর্তাগণ তাদের নামের পার্শ্বে বর্নিত তারিখে ছুটির পরে অফিসে অবস্থান করেছেন। উল্লেখ্য, গত ০৪/০৯/২০১৪ ইং তারিখে অনুষ্ঠিত র্বোড অব ডিরেক্টরস এর ৩৩৪ তম সভার সিদ্ধান্ত "ঙ" মোতাবেক আইটি কার্যক্রম 24 ঘন্টা নিরবিচ্ছিন্ন সাপোর্ট প্রদানের ক্ষেত্রে ছুটির পরে দায়িত্ব পালনকারী নির্বাহী/কর্মকতাদের অনুকুলে ৩০০/- (যাতায়াত- ২০০/-+আপ্যায়ন-১০০/-) হারে ভাতা প্রদান অনুমোদিত আছে। নিম্নে বর্ণিত নির্বাহী/কর্মকতাদের অনুকূলে যাতায়াত ও আপ্যায়ন ভাতা বাবদ খরচ উল্লেখ করা হলঃ';
    } else if (printCategory === 'NIGHT_SHIFT') {
      text = 'কর্তৃপক্ষের নির্দেশক্রমে Online Banking Software T-24 বাস্তবায়ন ও উক্ত Software দ্বারা পরিচালিত শাখা সমুহে অপারেশনাল সহায়তা প্রদানের নিমিত্তে অত্র ডিপার্টমেন্টের নিম্নবর্ণিত কর্মকর্তাগণ তাদের নামের পার্শ্বে বর্নিত তারিখে রাত্রীকালীন শিফটে অফিসে অবস্থান করেছেন। উল্লেখ্য, গত ০৪/০৯/২০১৪ ইং তারিখে অনুষ্ঠিত র্বোড অব ডিরেক্টরস এর ৩৩৪ তম সভার সিদ্ধান্ত "ঙ" মোতাবেক আইটি কার্যক্রম 24 ঘন্টা নিরবিচ্ছিন্ন সাপোর্ট প্রদানের ক্ষেত্রে রাত্রী জাগরনের জন্য রাত্রীকালীন শিফটের দায়িত্ব পালনকারী নির্বাহী/কর্মকতাদের অনুকুলে ১০০০/- (যাতায়াত- ৪০০/-+আপ্যায়ন-৬০০/-) হারে ভাতা প্রদান অনুমোদিত আছে। নিম্নে বর্ণিত নির্বাহী/কর্মকতাদের অনুকূলে যাতায়াত ও আপ্যায়ন ভাতা বাবদ খরচ উল্লেখ করা হলঃ';
    } else if (printCategory === 'HOLIDAY') {
      text = 'কর্তৃপক্ষের নির্দেশক্রমে Online Banking Software T-24 বাস্তবায়ন ও উক্ত Software দ্বারা পরিচালিত শাখা সমুহে অপারেশনাল সহায়তা প্রদানের নিমিত্তে অত্র ডিপার্টমেন্টের নিম্নবর্ণিত কর্মকর্তাগণ তাদের নামের পার্শ্বে বর্নিত তারিখে ছুটির দিনে অফিসে অবস্থান করেছেন। উল্লেখ্য, গত ০৪/০৯/২০১৪ ইং তারিখে অনুষ্ঠিত র্বোড অব ডিরেক্টরস এর ৩৩৪ তম সভার সিদ্ধান্ত "ঙ" মোতাবেক আইটি কার্যক্রম 24 ঘন্টা নিরবিচ্ছিন্ন সাপোর্ট প্রদানের ক্ষেত্রে ছুটির দিনে দায়িত্ব পালনকারী নির্বাহী/কর্মকতাদের অনুকুলে ৫০০/- (যাতায়াত- ২৫০/-+আপ্যায়ন-২৫০/-) হারে ভাতা প্রদান অনুমোদিত আছে। নিম্নে বর্ণিত নির্বাহী/কর্মকতাদের অনুকূলে যাতায়াত ও আপ্যায়ন ভাতা বাবদ খরচ উল্লেখ করা হলঃ';
    }
    setTimeout(() => {
      setOpeningParagraph(text);
    }, 0);
  }, [printCategory]);

  // Aggregate duties by employee for billing ledger
  const getBillingSummaries = (): EmployeeBillingSummary[] => {
    const map = new Map<number, EmployeeBillingSummary>();
    
    let activeDuties = selectedOrderRef
      ? duties.filter(d => {
          if (!d.orderRef) return false;
          return getNormalizedRef(d.orderRef) === getNormalizedRef(selectedOrderRef);
        })
      : duties;
      
    if (selectedCategory !== 'all') {
      activeDuties = activeDuties.filter(d => d.type === selectedCategory);
    }
      
    if (selectedOrderRef && activeDuties.length === 0) {
      // Fallback to loading from the Office Order dutiesJson
      const backingOrder = archivedOrders.find(o => {
        if (!o.orderRef || o.category?.startsWith('BILL_')) return false;
        return getNormalizedRef(o.orderRef) === getNormalizedRef(selectedOrderRef);
      });

      if (backingOrder) {
        let orderDutiesList: any[] = [];
        if (backingOrder.duties && backingOrder.duties.length > 0) {
          orderDutiesList = backingOrder.duties;
        } else if (backingOrder.dutiesJson) {
          try {
            orderDutiesList = JSON.parse(backingOrder.dutiesJson);
          } catch (e) {
            console.error('Failed to parse dutiesJson fallback:', e);
          }
        }

        const { transportRate: tRate, apyaonRate: aRate } = getPrintCategoryRates(printCategory);

        orderDutiesList.forEach((od, idx) => {
          const empId = Number(od.employeeId) || idx + 10000;
          const name = od.employeeName || od.name || '';
          const designation = od.designation || '';
          const dates = od.dates || [];
          const days = dates.length || od.days || 0;

          const totalApyaon = days * aRate;
          const totalTransport = days * tRate;
          const grandTotal = totalApyaon + totalTransport;

          if (selectedCategory !== 'all' && printCategory !== selectedCategory) {
            return;
          }

          const sortedDates = [...dates].sort();
          const formatted = sortedDates.map(dStr => {
            const [year, month, day] = dStr.split('-');
            const bnDay = toBanglaDigits(day.padStart(2, '0'));
            const bnMonth = toBanglaDigits(month.padStart(2, '0'));
            const bnYear = toBanglaDigits(year);
            return `${bnDay}-${bnMonth}-${bnYear}`;
          }).join(', ');

          map.set(empId, {
            employeeId: empId,
            name,
            designation,
            cellName: backingOrder.cellName || '',
            bankId: String(od.employeeId || ''),
            fileNo: od.fileNo || '',
            lateDays: printCategory === 'LATE_SITTING' ? days : 0,
            lateAllowance1: printCategory === 'LATE_SITTING' ? totalApyaon : 0,
            lateAllowance2: printCategory === 'LATE_SITTING' ? totalTransport : 0,
            holidayDays: printCategory === 'HOLIDAY' ? days : 0,
            holidayAllowance1: printCategory === 'HOLIDAY' ? totalApyaon : 0,
            holidayAllowance2: printCategory === 'HOLIDAY' ? totalTransport : 0,
            nightDays: printCategory === 'NIGHT_SHIFT' ? days : 0,
            nightAllowance1: printCategory === 'NIGHT_SHIFT' ? totalApyaon : 0,
            nightAllowance2: printCategory === 'NIGHT_SHIFT' ? totalTransport : 0,
            grandTotal: grandTotal,
            datesFormatted: formatted
          });
        });

        return Array.from(map.values()).sort((a, b) => {
          const rankA = getSeniorityRank(a.designation);
          const rankB = getSeniorityRank(b.designation);
          if (rankA !== rankB) {
            return rankA - rankB;
          }
          return b.grandTotal - a.grandTotal;
        });
      }
    }

    activeDuties.forEach(duty => {
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
        summary.lateAllowance1 += duty.allowance1; 
        summary.lateAllowance2 += duty.allowance2; 
      } else if (duty.type === 'HOLIDAY') {
        summary.holidayDays++;
        summary.holidayAllowance1 += duty.allowance1; 
        summary.holidayAllowance2 += duty.allowance2; 
      } else if (duty.type === 'NIGHT_SHIFT') {
        summary.nightDays++;
        summary.nightAllowance1 += duty.allowance1; 
        summary.nightAllowance2 += duty.allowance2; 
      }
      
      summary.grandTotal += duty.totalBill;
    });
    
    return Array.from(map.values()).sort((a, b) => {
      const rankA = getSeniorityRank(a.designation);
      const rankB = getSeniorityRank(b.designation);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return b.grandTotal - a.grandTotal;
    });
  };

  const billingSummaries = getBillingSummaries();

  // Consolidated Daily Report Calculations
  const reportData = useMemo(() => {
    const targetBills = archivedOrders.filter(o => 
      o.category?.startsWith('BILL_') && 
      o.orderDate === reportDate &&
      o.status !== 'Deleted'
    );

    let totalBillsCount = targetBills.length;
    let totalDays = 0;
    let totalTransport = 0;
    let totalApyaon = 0;
    let grandTotal = 0;

    let lateSittingAmount = 0;
    let holidayAmount = 0;
    let nightShiftAmount = 0;

    const cleanName = (n: string) => (n || '').replace(/^(জনাব|জনাবা|ডাঃ|ড\.)\s*/, '').replace(/\s+/g, ' ').trim().toLowerCase();

    const empMap = new Map<string, {
      employeeName: string;
      designation: string;
      lateSittingDays: number;
      lateSittingAmount: number;
      holidayDays: number;
      holidayAmount: number;
      nightShiftDays: number;
      nightShiftAmount: number;
      totalDays: number;
      grandTotal: number;
    }>();

    targetBills.forEach(bill => {
      let dutiesList: any[] = (bill.duties as any) || [];
      if (dutiesList.length === 0 && bill.dutiesJson) {
        try {
          dutiesList = JSON.parse(bill.dutiesJson);
        } catch (e) {
          console.error('Failed to parse bill dutiesJson in report:', e);
        }
      }

      const isLateSitting = bill.category === 'BILL_LATE_SITTING';
      const isHoliday = bill.category === 'BILL_HOLIDAY';
      const isNight = bill.category === 'BILL_NIGHT_SHIFT';

      dutiesList.forEach(duty => {
        const name = duty.employeeName || duty.name || '';
        const designation = duty.designation || '';
        const days = Number(duty.days || (duty.dates && duty.dates.length) || 0);
        const transport = Number(duty.totalTransport || 0);
        const apyaon = Number(duty.totalApyaon || 0);
        const total = Number(duty.grandTotal || (transport + apyaon) || 0);

        totalDays += days;
        totalTransport += transport;
        totalApyaon += apyaon;
        grandTotal += total;

        if (isLateSitting) lateSittingAmount += total;
        if (isHoliday) holidayAmount += total;
        if (isNight) nightShiftAmount += total;

        const empKey = cleanName(name);

        if (!empMap.has(empKey)) {
          empMap.set(empKey, {
            employeeName: name,
            designation: designation,
            lateSittingDays: 0,
            lateSittingAmount: 0,
            holidayDays: 0,
            holidayAmount: 0,
            nightShiftDays: 0,
            nightShiftAmount: 0,
            totalDays: 0,
            grandTotal: 0
          });
        }

        const record = empMap.get(empKey)!;
        record.totalDays += days;
        record.grandTotal += total;

        if (isLateSitting) {
          record.lateSittingDays += days;
          record.lateSittingAmount += total;
        } else if (isHoliday) {
          record.holidayDays += days;
          record.holidayAmount += total;
        } else if (isNight) {
          record.nightShiftDays += days;
          record.nightShiftAmount += total;
        }
      });
    });

    const employeesBreakdown = Array.from(empMap.values()).sort((a, b) => {
      const rankA = getSeniorityRank(a.designation);
      const rankB = getSeniorityRank(b.designation);
      if (rankA !== rankB) return rankA - rankB;
      return b.grandTotal - a.grandTotal;
    });

    const totalLateDays = employeesBreakdown.reduce((sum, r) => sum + r.lateSittingDays, 0);
    const totalLateAmount = employeesBreakdown.reduce((sum, r) => sum + r.lateSittingAmount, 0);
    const totalHolidayDays = employeesBreakdown.reduce((sum, r) => sum + r.holidayDays, 0);
    const totalHolidayAmount = employeesBreakdown.reduce((sum, r) => sum + r.holidayAmount, 0);
    const totalNightDays = employeesBreakdown.reduce((sum, r) => sum + r.nightShiftDays, 0);
    const totalNightAmount = employeesBreakdown.reduce((sum, r) => sum + r.nightShiftAmount, 0);
    const totalDaysSum = employeesBreakdown.reduce((sum, r) => sum + r.totalDays, 0);
    const grandTotalSum = employeesBreakdown.reduce((sum, r) => sum + r.grandTotal, 0);

    const payeeMap = new Map<string, {
      payeeName: string;
      designation: string;
      billCount: number;
      grandTotal: number;
    }>();

    targetBills.forEach(bill => {
      const payeeName = bill.employeeName || 'অজ্ঞাত কর্মকর্তা';
      const designation = bill.content?.representativeDesignation || '';
      
      let billTotal = 0;
      if (bill.content?.grandTotal !== undefined && bill.content?.grandTotal !== null) {
        billTotal = bill.content.grandTotal;
      } else {
        let dutiesList: any[] = (bill.duties as any) || [];
        if (dutiesList.length === 0 && bill.dutiesJson) {
          try {
            dutiesList = JSON.parse(bill.dutiesJson);
          } catch (e) {
            console.error('Failed to parse bill dutiesJson in reportData:', e);
          }
        }
        billTotal = dutiesList.reduce((sum, d) => {
          const transport = Number(d.totalTransport || 0);
          const apyaon = Number(d.totalApyaon || 0);
          return sum + Number(d.grandTotal || (transport + apyaon) || 0);
        }, 0);
      }

      const key = payeeName.trim().toLowerCase();
      if (!payeeMap.has(key)) {
        payeeMap.set(key, {
          payeeName,
          designation,
          billCount: 0,
          grandTotal: 0
        });
      }

      const record = payeeMap.get(key)!;
      record.billCount += 1;
      record.grandTotal += billTotal;
      if (!record.designation && designation) {
        record.designation = designation;
      }
    });

    const payeesSummary = Array.from(payeeMap.values()).sort((a, b) => b.grandTotal - a.grandTotal);

    return {
      targetBills,
      totalBillsCount,
      totalDays,
      totalTransport,
      totalApyaon,
      grandTotal,
      lateSittingAmount,
      holidayAmount,
      nightShiftAmount,
      employeesBreakdown,
      payeesSummary,
      totalLateDays,
      totalLateAmount,
      totalHolidayDays,
      totalHolidayAmount,
      totalNightDays,
      totalNightAmount,
      totalDaysSum,
      grandTotalSum
    };
  }, [reportDate, archivedOrders]);

  useEffect(() => {
    if (isReportPrintMode) {
      const timer = setTimeout(() => {
        window.print();
        setIsReportPrintMode(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isReportPrintMode]);

  // Filter summaries for print based on selected printCategory
  const printFilteredSummaries = billingSummaries.filter(s => {
    if (printCategory === 'LATE_SITTING') return s.lateDays > 0;
    if (printCategory === 'HOLIDAY') return s.holidayDays > 0;
    if (printCategory === 'NIGHT_SHIFT') return s.nightDays > 0;
    return false;
  });

  // Automatically select representative payee by default (based on selected office order payee name, falling back to first employee)
  const lastSelectedOrderRefForPayee = useRef<string | null>(null);
  const lastPrintCategoryForPayee = useRef<string | null>(null);

  useEffect(() => {
    if (isEditingArchive) {
      lastSelectedOrderRefForPayee.current = selectedOrderRef;
      lastPrintCategoryForPayee.current = printCategory;
      return;
    }

    const hasOrderRefChanged = lastSelectedOrderRefForPayee.current !== selectedOrderRef;
    const hasCategoryChanged = lastPrintCategoryForPayee.current !== printCategory;
    
    if (hasOrderRefChanged || hasCategoryChanged) {
      lastSelectedOrderRefForPayee.current = selectedOrderRef;
      lastPrintCategoryForPayee.current = printCategory;

      if (selectedOrderRef && archivedOrders.length > 0) {
        const matchedOrder = archivedOrders.find(o => {
          if (!o.orderRef) return false;
          return o.orderRef.replace(/\/বিল$/, '') === selectedOrderRef.replace(/\/বিল$/, '');
        });
        if (matchedOrder && matchedOrder.employeeName) {
          const nameVal = matchedOrder.employeeName;
          const matchedEmp = employees.find(e => e.name === nameVal);
          const desigVal = matchedEmp ? getShortDesignation(matchedEmp.designation) : 'এসও-আইটি';
          setTimeout(() => {
            setRepresentativeName(nameVal);
            setRepresentativeDesignation(desigVal);
          }, 0);
          return;
        }
      }

      if (printFilteredSummaries.length > 0) {
        const nameVal = printFilteredSummaries[0].name;
        const desigVal = getShortDesignation(printFilteredSummaries[0].designation);
        setTimeout(() => {
          setRepresentativeName(nameVal);
          setRepresentativeDesignation(desigVal);
        }, 0);
      } else {
        setTimeout(() => {
          setRepresentativeName('');
          setRepresentativeDesignation('');
        }, 0);
      }
    }
  }, [duties, printCategory, selectedOrderRef, archivedOrders, employees, printFilteredSummaries, isEditingArchive]);

  // Removed old monthly-based aggregateMetrics; metrics are now computed reactively below.




  // Helper to extract category duties for formatting
  const getEmployeeCategoryDuties = (employeeId: number) => {
    return duties.filter(d => d.employeeId === employeeId && d.type === printCategory);
  };

  // Helper to format worked dates nicely with full DD-MM-YYYY format
  const formatWorkedDatesForCategory = (empId: number) => {
    const summary = billingSummaries.find(s => s.employeeId === empId);
    if (summary && summary.datesFormatted) {
      return summary.datesFormatted;
    }

    const empDuties = getEmployeeCategoryDuties(empId);
    if (empDuties.length === 0) return '';
    const sorted = [...empDuties].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const formattedDates = sorted.map(d => {
      const [year, month, day] = d.date.split('-');
      const bnDay = toBanglaDigits(parseInt(day, 10).toString().padStart(2, '0'));
      const bnMonth = toBanglaDigits(parseInt(month, 10).toString().padStart(2, '0'));
      const bnYear = toBanglaDigits(year);
      return `${bnDay}-${bnMonth}-${bnYear}`;
    });
    
    return formattedDates.join(', ');
  };

  // Cell grouping for dashboard ledger
  const groupedSummaries: { [cellName: string]: EmployeeBillingSummary[] } = {};
  billingSummaries.forEach(s => {
    if (!groupedSummaries[s.cellName]) {
      groupedSummaries[s.cellName] = [];
    }
    groupedSummaries[s.cellName].push(s);
  });

  // Calculate cell totals for dashboard view
  const getCellTotals = (summaries: EmployeeBillingSummary[]) => {
    const lateDays = summaries.reduce((sum, s) => sum + s.lateDays, 0);
    const holidayDays = summaries.reduce((sum, s) => sum + s.holidayDays, 0);
    const nightDays = summaries.reduce((sum, s) => sum + s.nightDays, 0);
    
    const transport = summaries.reduce((sum, s) => sum + (s.lateDays * 200 + s.holidayDays * 250 + s.nightDays * 400), 0);
    const apyaon = summaries.reduce((sum, s) => sum + (s.lateDays * 100 + s.holidayDays * 250 + s.nightDays * 600), 0);
    const total = summaries.reduce((sum, s) => sum + s.grandTotal, 0);

    return { lateDays, holidayDays, nightDays, transport, apyaon, total };
  };

  // Category based printed totals
  const totalTransportAll = printFilteredSummaries.reduce((sum, s) => {
    const { transportRate } = getPrintCategoryRates(printCategory);
    const days = printCategory === 'LATE_SITTING' ? s.lateDays : printCategory === 'HOLIDAY' ? s.holidayDays : s.nightDays;
    return sum + (days * transportRate);
  }, 0);

  const totalApyaonAll = printFilteredSummaries.reduce((sum, s) => {
    const { apyaonRate } = getPrintCategoryRates(printCategory);
    const days = printCategory === 'LATE_SITTING' ? s.lateDays : printCategory === 'HOLIDAY' ? s.holidayDays : s.nightDays;
    return sum + (days * apyaonRate);
  }, 0);

  const grandTotalPrintAll = totalTransportAll + totalApyaonAll;

  const totalDaysAll = printFilteredSummaries.reduce((sum, s) => {
    const days = printCategory === 'LATE_SITTING' ? s.lateDays : printCategory === 'HOLIDAY' ? s.holidayDays : s.nightDays;
    return sum + days;
  }, 0);

  const handleGenerateAndPrint = async (action: 'generate' | 'print' | 'download') => {
    setArchiving(true);
    setArchiveSuccess(null);
    setArchiveError(null);
    
    try {
      const formatMonthName = (monthStr: string) => {
        if (!monthStr || monthStr === 'all') {
          const today = new Date();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          monthStr = `${today.getFullYear()}-${mm}`;
        }
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthName = date.toLocaleString('en-US', { month: 'long' });
        return `${monthName}-${year}`;
      };
      
      const billingMonthName = formatMonthName(selectedMonth);

      const summariesPayload = printFilteredSummaries.map(s => {
        const days = printCategory === 'LATE_SITTING' ? s.lateDays : printCategory === 'HOLIDAY' ? s.holidayDays : s.nightDays;
        const totalTransport = days * transportRate;
        const totalApyaon = days * apyaonRate;
        const empTotal = totalTransport + totalApyaon;
        return {
          name: s.name,
          designation: s.designation,
          bankId: s.bankId || '',
          days: days,
          apyaonRate: apyaonRate,
          totalApyaon: totalApyaon,
          totalTransport: totalTransport,
          grandTotal: empTotal,
          datesFormatted: formatWorkedDatesForCategory(s.employeeId)
        };
      });

      // 1. Archive metadata into OfficeOrders table (Bill Archive)
      const matchedCellObj = cells.find(c => c.id.toString() === selectedCell);
      const cellName = matchedCellObj ? matchedCellObj.name : (selectedCell === 'all' ? 'All Cells' : 'IT Department');

      const backingOrder = archivedOrders.find(o => {
        if (!o.orderRef) return false;
        const cleanO = o.orderRef.replace(/\/বিল$/, '');
        const cleanS = selectedOrderRef.replace(/\/বিল$/, '');
        return cleanO === cleanS && !o.category?.startsWith('BILL_');
      });

      const archivePayload = {
        orderRef: billRef,
        originalOrderRef: isEditingArchive ? originalBillRef : undefined,
        orderDate: billDate,
        category: "BILL_" + printCategory,
        employeeName: representativeName,
        cellName: cellName,
        status: action === 'generate' ? 'Generated' : 'Printed',
        duties: summariesPayload.map(s => ({
          employeeId: s.bankId,
          employeeName: s.name,
          designation: s.designation,
          days: s.days,
          apyaonRate: s.apyaonRate,
          totalApyaon: s.totalApyaon,
          totalTransport: s.totalTransport,
          grandTotal: s.grandTotal,
          datesFormatted: s.datesFormatted
        })),
        dutyIds: duties
          .filter(d => {
            if (!d.orderRef || d.type !== printCategory) return false;
            const cleanD = d.orderRef.replace(/\/বিল$/, '');
            const cleanSel = selectedOrderRef.replace(/\/বিল$/, '');
            const cleanBase = baseOrderRef.replace(/\/বিল$/, '');
            const cleanBill = billRef.replace(/\/বিল$/, '');
            const cleanOrig = (isEditingArchive ? originalBillRef : '').replace(/\/বিল$/, '');
            return (
              cleanD === cleanSel ||
              cleanD === cleanBase ||
              cleanD === cleanBill ||
              (cleanOrig && cleanD === cleanOrig)
            );
          })
          .map(d => d.id),
        content: {
          openingParagraph: openingParagraph,
          totalDays: totalDaysAll,
          totalApyaon: totalApyaonAll,
          totalTransport: totalTransportAll,
          grandTotal: grandTotalPrintAll,
          grandTotalInWords: getBanglaNumberWords(grandTotalPrintAll),
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          representativeDesignation: representativeDesignation,
          subjectText: subjectText,
          backingOrderId: backingOrder ? backingOrder.id : null,
          backingOrderRef: backingOrder ? backingOrder.orderRef : (selectedOrderRef || null),
          backingOrderDate: backingOrder ? backingOrder.orderDate : null
        }
      };

      // Always save to database for all actions (generate, download, print)
      const archiveRes = await fetch('/api/office-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(archivePayload),
      });

      if (!archiveRes.ok) {
        throw new Error('Failed to archive bill memo metadata');
      }
      console.log('Bill memo metadata archived successfully!');

      if (action === 'generate') {
        // Generate PDF
        const payload = {
          billingMonth: billingMonthName,
          openingParagraph: openingParagraph,
          summaries: summariesPayload,
          totalDays: totalDaysAll,
          totalApyaon: totalApyaonAll,
          totalTransport: totalTransportAll,
          grandTotal: grandTotalPrintAll,
          grandTotalInWords: getBanglaNumberWords(grandTotalPrintAll),
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          representativeName: representativeName,
          representativeDesignation: representativeDesignation,
          subjectText: subjectText,
          billDate: billDate,
          transportRate: transportRate,
          apyaonRate: apyaonRate,
          totalTransportInWords: getBanglaNumberWords(totalTransportAll),
          totalApyaonInWords: getBanglaNumberWords(totalApyaonAll),
          billRef: billRef,
          actionType: 'GENERATE_BILL'
        };

        const res = await fetch('/api/documents/generate-bill-memo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setBillGenerated(true);
          setArchiveSuccess('বিল মেমো সফলভাবে জেনারেট এবং সংরক্ষণ করা হয়েছে!');
          fetchDutiesForBilling();
          if (isEditingArchive) {
            const params = new URLSearchParams(window.location.search);
            const from = params.get('from') || '/documents';
            const redirectUrl = from.includes('?') ? `${from}&msg=success` : `${from}?msg=success`;
            window.location.assign(redirectUrl);
          }
        } else {
          throw new Error('Failed to generate PDF');
        }
      } else if (action === 'download') {
        const payload = {
          billingMonth: billingMonthName,
          openingParagraph: openingParagraph,
          summaries: summariesPayload,
          totalDays: totalDaysAll,
          totalApyaon: totalApyaonAll,
          totalTransport: totalTransportAll,
          grandTotal: grandTotalPrintAll,
          grandTotalInWords: getBanglaNumberWords(grandTotalPrintAll),
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          representativeName: representativeName,
          representativeDesignation: representativeDesignation,
          subjectText: subjectText,
          billDate: billDate,
          transportRate: transportRate,
          apyaonRate: apyaonRate,
          totalTransportInWords: getBanglaNumberWords(totalTransportAll),
          totalApyaonInWords: getBanglaNumberWords(totalApyaonAll),
          billRef: billRef,
          actionType: 'DOWNLOAD_BILL_PDF'
        };

        const res = await fetch('/api/documents/generate-bill-memo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.filePath) {
            window.open(data.filePath, '_blank');
          }
          setIsPrintMode(false);
          setIsEditingArchive(false);
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/billing');
          }
          fetchDutiesForBilling();
        } else {
          throw new Error('Failed to generate PDF');
        }
      } else if (action === 'print') {
        const payload = {
          billingMonth: billingMonthName,
          openingParagraph: openingParagraph,
          summaries: summariesPayload,
          totalDays: totalDaysAll,
          totalApyaon: totalApyaonAll,
          totalTransport: totalTransportAll,
          grandTotal: grandTotalPrintAll,
          grandTotalInWords: getBanglaNumberWords(grandTotalPrintAll),
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          representativeName: representativeName,
          representativeDesignation: representativeDesignation,
          subjectText: subjectText,
          billDate: billDate,
          transportRate: transportRate,
          apyaonRate: apyaonRate,
          totalTransportInWords: getBanglaNumberWords(totalTransportAll),
          totalApyaonInWords: getBanglaNumberWords(totalApyaonAll),
          billRef: billRef,
          actionType: 'PRINT_BILL'
        };

        await fetch('/api/documents/generate-bill-memo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        setTimeout(() => {
          window.print();
          setIsPrintMode(false);
          setIsEditingArchive(false);
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/billing');
          }
          fetchDutiesForBilling();
        }, 100);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'বিল মেমো প্রসেস করতে ব্যর্থ হয়েছে।';
      console.error('Error in handleGenerateAndPrint:', err);
      setArchiveError(errorMsg);
      setTimeout(() => setArchiveError(null), 5000);
    } finally {
      setArchiving(false);
    }
  };

  const hasDeletePermission = (order: OfficeOrder) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    const userCellNames = currentUser.cells?.map((c) => c.name) || [];
    if (order.cellName && userCellNames.includes(order.cellName)) return true;
    if (order.duties && Array.isArray(order.duties)) {
      return order.duties.some((d: any) => d.cellName && userCellNames.includes(d.cellName));
    }
    return false;
  };

  const hasEditPermission = (order: OfficeOrder) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    const userCellNames = currentUser.cells?.map((c) => c.name) || [];
    if (order.cellName && userCellNames.includes(order.cellName)) return true;
    if (order.duties && Array.isArray(order.duties)) {
      return order.duties.some((d: any) => d.cellName && userCellNames.includes(d.cellName));
    }
    return false;
  };



  const archivedBillNormalizedRefs = useMemo(() => {
    return new Set(
      archivedOrders
        .filter((o: OfficeOrder) => o.category?.startsWith('BILL_') || o.orderRef?.endsWith('/বিল'))
        .map((o: OfficeOrder) => getNormalizedRef(o.orderRef))
    );
  }, [archivedOrders, getNormalizedRef]);

  const handleDeleteOrder = async (id: number) => {
    const order = archivedOrders.find(o => o.id === id);
    if (!order) return;

    if (!hasDeletePermission(order)) {
      alert('দুঃখিত, এই office order/বিল মুছে ফেলার জন্য আপনার পর্যাপ্ত পারমিশন বা অনুমতি নেই।');
      return;
    }

    const isBill = order.category?.startsWith('BILL_');
    const warningMsg = isBill 
      ? `⚠️ সতর্কবার্তা!\n\nআপনি কি নিশ্চিত যে এই বিল স্মারক বিবরণীটি (${order.orderRef}) আর্কাইভ থেকে মুছে ফেলতে চান?\n\nএটি ডিলিট করলে বিলের রেকর্ডটি রিসাইকেল বিনে স্থানান্তরিত হবে। এটি স্থায়ীভাবে মুছে ফেলা হবে না এবং পরবর্তীতে পুনরুদ্ধার (Restore) করা সম্ভব।`
      : `⚠️ সতর্কবার্তা!\n\nআপনি কি নিশ্চিত যে এই অফিস আদেশ স্মারক বিবরণীটি (${order.orderRef}) আর্কাইভ থেকে মুছে ফেলতে চান?\n\nএটি ডিলিট করলে এটি রিসাইকেল বিনে স্থানান্তরিত হবে এবং পুনরুদ্ধার করা সম্ভব। কিন্তু রিস্টোর করার পূর্ব পর্যন্ত এই আদেশের বিপরীতে বিল প্রসেস করা সম্ভব হবে না।`;

    if (!confirm(warningMsg)) {
      return;
    }

    try {
      const res = await fetch(`/api/office-orders/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setArchiveSuccess(isBill ? 'বিল মেমোটি সফলভাবে মুছে ফেলা হয়েছে।' : 'অফিস আদেশটি সফলভাবে মুছে ফেলা হয়েছে।');
        setTimeout(() => setArchiveSuccess(null), 5000);
        fetchDutiesForBilling();
      } else {
        const errData = await res.json().catch(() => ({}));
        setArchiveError(errData.message || 'মুছে ফেলা সম্ভব হয়নি।');
        setTimeout(() => setArchiveError(null), 5000);
      }
    } catch {
      setArchiveError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
      setTimeout(() => setArchiveError(null), 5000);
    }
  };

  const getFilteredOrders = useCallback((type: 'orders' | 'bills') => {
    return archivedOrders.filter((order: OfficeOrder) => {
      if (order.status === 'Deleted') return false;
      const isBill = order.category?.startsWith('BILL_');
      if (type === 'orders' && isBill) return false;
      if (type === 'bills' && !isBill) return false;
      
      // Enforce cell visibility restrictions for non-admin users
      if (currentUser && currentUser.role !== 'ADMIN') {
        if (!userHasAccessToOrder(order, currentUser, employees)) {
          return false;
        }
      }

      // Cell filter
      if (selectedCell !== 'all') {
        const targetCellObj = cells.find(c => c.id.toString() === selectedCell);
        if (targetCellObj && order.cellName !== targetCellObj.name && order.cellName !== 'All Cells' && order.cellName !== 'সকল সেল') {
          // Fallback: check if the involved employees belong to the selected cell
          let dutiesList: any[] = order.duties || [];
          if (dutiesList.length === 0 && order.dutiesJson) {
            try {
              dutiesList = JSON.parse(order.dutiesJson);
            } catch (e) {
              console.error(e);
            }
          }
          let hasTargetCellEmployee = false;
          if (dutiesList.length === 0) {
            if (order.employeeName) {
              const matched = employees.find(e => e.name === order.employeeName);
              if (matched && matched.cell?.name === targetCellObj.name) {
                hasTargetCellEmployee = true;
              }
            }
          } else {
            hasTargetCellEmployee = dutiesList.some((d: any) => {
              const empIdStr = d.employeeId ? d.employeeId.toString() : '';
              const empName = d.employeeName || '';
              const matched = employees.find(e => 
                (e.id && e.id.toString() === empIdStr) || 
                (e.bankId && e.bankId.toString() === empIdStr) || 
                (e.name && e.name === empName)
              );
              return matched && matched.cell?.name === targetCellObj.name;
            });
          }
          if (!hasTargetCellEmployee) {
            return false;
          }
        }
      }
      
      // Category filter
      if (selectedCategory !== 'all') {
        const expectedCat = type === 'bills' ? `BILL_${selectedCategory}` : selectedCategory;
        if (order.category !== expectedCat) {
          return false;
        }
      }

      // Month filter
      if (selectedMonth && selectedMonth !== 'all') {
        if (type === 'bills') {
          if (order.orderDate && !order.orderDate.startsWith(selectedMonth)) {
            return false;
          }
        } else {
          // For office orders: if they have a bill, filter by the bill's orderDate; otherwise, by their own orderDate
          const norm = getNormalizedRef(order.orderRef);
          const bill = archivedOrders.find(o => 
            o.category?.startsWith('BILL_') && 
            o.status !== 'Deleted' && 
            getNormalizedRef(o.orderRef) === norm
          );
          const dateToFilterBy = bill ? bill.orderDate : order.orderDate;
          if (dateToFilterBy && !dateToFilterBy.startsWith(selectedMonth)) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [archivedOrders, selectedCell, selectedCategory, selectedMonth, cells, getNormalizedRef, userCellNamesString, userRole, userUsername, employees]);

  const filteredOrdersList = useMemo(() => getFilteredOrders('orders'), [getFilteredOrders]);
  const pendingBillingOfficeOrders = useMemo(() => {
    return filteredOrdersList.filter(o => 
      o.status !== 'Deleted' &&
      !archivedBillNormalizedRefs.has(getNormalizedRef(o.orderRef))
    );
  }, [filteredOrdersList, archivedBillNormalizedRefs, getNormalizedRef]);

  const billedOfficeOrders = useMemo(() => {
    return filteredOrdersList.filter(o => 
      o.status !== 'Deleted' &&
      archivedBillNormalizedRefs.has(getNormalizedRef(o.orderRef))
    );
  }, [filteredOrdersList, archivedBillNormalizedRefs, getNormalizedRef]);

  const filteredBillMemos = useMemo(() => getFilteredOrders('bills'), [getFilteredOrders]);

  const allActiveOfficeOrders = useMemo(() => {
    return filteredOrdersList.filter(o => o.status !== 'Deleted');
  }, [filteredOrdersList]);

  const ledgerActiveOfficeOrders = useMemo<OfficeOrder[]>(() => {
    const active = allActiveOfficeOrders;
    if (active.length === 0) return [];
    
    let latestDateStr = "";
    let latestDateTime = -1;
    
    active.forEach(order => {
      if (order.orderDate) {
        const dStr = order.orderDate.substring(0, 10);
        const t = new Date(dStr).getTime();
        if (t > latestDateTime) {
          latestDateTime = t;
          latestDateStr = dStr;
        }
      }
    });
    
    if (!latestDateStr) return active;
    
    return active.filter(order => order.orderDate && order.orderDate.substring(0, 10) === latestDateStr);
  }, [allActiveOfficeOrders]);

  const ledgerGrandTotal = useMemo(() => {
    return ledgerActiveOfficeOrders.reduce((sum: number, order: OfficeOrder) => {
      let dutiesList = order.duties || [];
      if (dutiesList.length === 0 && order.dutiesJson) {
        try {
          dutiesList = JSON.parse(order.dutiesJson);
        } catch (e) {
          console.error(e);
        }
      }
      const totalDays = dutiesList.reduce((dSum: number, d: any) => dSum + (Array.isArray(d.dates) ? d.dates.length : (d.days || 0)), 0);
      let transportRate = 200;
      let apyaonRate = 100;
      if (order.category === 'HOLIDAY') {
        transportRate = 250;
        apyaonRate = 250;
      } else if (order.category === 'NIGHT_SHIFT') {
        transportRate = 400;
        apyaonRate = 600;
      }
      return sum + (totalDays * (apyaonRate + transportRate));
    }, 0);
  }, [ledgerActiveOfficeOrders]);

  const billGroups = useMemo(() => {
    const groupsMap = new Map<string, OfficeOrder[]>();
    filteredBillMemos.forEach(o => {
      if (o.orderDate) {
        if (!groupsMap.has(o.orderDate)) {
          groupsMap.set(o.orderDate, []);
        }
        groupsMap.get(o.orderDate)!.push(o);
      }
    });

    const sortedDates = Array.from(groupsMap.keys()).sort().reverse();

    return sortedDates.map(dateStr => {
      const bills = groupsMap.get(dateStr) || [];
      return {
        date: dateStr,
        name: getSlotName(dateStr),
        bills: bills
      };
    });
  }, [filteredBillMemos]);

  const metrics = useMemo(() => {
    let totalLateSittingBill = 0;
    let totalLateAllowance1 = 0; 
    let totalLateAllowance2 = 0; 
    let totalHolidayBill = 0;
    let totalHolidayAllowance1 = 0; 
    let totalHolidayAllowance2 = 0; 
    let totalNightBill = 0;
    let totalNightAllowance1 = 0; 
    let totalNightAllowance2 = 0; 
    let grandTotal = 0;

    ledgerActiveOfficeOrders.forEach(order => {
      if (selectedCategory !== 'all' && order.category !== selectedCategory) return;
      let dutiesList = (order.duties as any) || [];
      if (dutiesList.length === 0 && order.dutiesJson) {
        try {
          dutiesList = JSON.parse(order.dutiesJson);
        } catch (e) {
          console.error(e);
        }
      }
      
      dutiesList.forEach((d: any) => {
        const days = Array.isArray(d.dates) ? d.dates.length : (d.days || 0);
        let transportRate = 200;
        let apyaonRate = 100;
        if (order.category === 'HOLIDAY') {
          transportRate = 250;
          apyaonRate = 250;
        } else if (order.category === 'NIGHT_SHIFT') {
          transportRate = 400;
          apyaonRate = 600;
        }

        const totalApyaon = d.totalApyaon !== undefined && d.totalApyaon > 0 ? d.totalApyaon : (days * apyaonRate);
        const totalTransport = d.totalTransport !== undefined && d.totalTransport > 0 ? d.totalTransport : (days * transportRate);
        const itemGrandTotal = d.grandTotal !== undefined && d.grandTotal > 0 ? d.grandTotal : (totalApyaon + totalTransport);

        grandTotal += itemGrandTotal;
        if (order.category === 'LATE_SITTING') {
          totalLateSittingBill += itemGrandTotal;
          totalLateAllowance1 += totalApyaon;
          totalLateAllowance2 += totalTransport;
        } else if (order.category === 'HOLIDAY') {
          totalHolidayBill += itemGrandTotal;
          totalHolidayAllowance1 += totalApyaon;
          totalHolidayAllowance2 += totalTransport;
        } else if (order.category === 'NIGHT_SHIFT') {
          totalNightBill += itemGrandTotal;
          totalNightAllowance1 += totalApyaon;
          totalNightAllowance2 += totalTransport;
        }
      });
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
  }, [ledgerActiveOfficeOrders, selectedCategory]);

  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>({});

  const toggleSlot = (slotDate: string) => {
    setExpandedSlots(prev => ({
      ...prev,
      [slotDate]: !prev[slotDate]
    }));
  };

  const findMatchingOfficeOrder = (bill: OfficeOrder) => {
    const norm = getNormalizedRef(bill.orderRef);
    return archivedOrders.find(o => 
      !o.category?.startsWith('BILL_') && 
      !o.orderRef?.endsWith('/বিল') && 
      getNormalizedRef(o.orderRef) === norm
    );
  };

  const findAssociatedBill = (order: OfficeOrder) => {
    const norm = getNormalizedRef(order.orderRef);
    return archivedOrders.find(o => 
      o.category?.startsWith('BILL_') && 
      o.status !== 'Deleted' && 
      getNormalizedRef(o.orderRef) === norm
    );
  };

  const handleChangeBillGroup = async (billId: number, bill: OfficeOrder, targetDate: string) => {
    try {
      let finalDate = targetDate;
      if (targetDate === 'custom') {
        const custom = prompt('নতুন গ্রুপ তারিখ দিন (YYYY-MM-DD):', bill.orderDate);
        if (!custom) return;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(custom)) {
          alert('ভুল তারিখ ফরম্যাট! YYYY-MM-DD ফরম্যাটে দিন।');
          return;
        }
        finalDate = custom;
      }
      
      const res = await fetch(`/api/office-orders/${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderRef: bill.orderRef,
          orderDate: finalDate,
          employeeName: bill.employeeName,
          cellName: bill.cellName,
          status: bill.status
        })
      });
      
      if (!res.ok) {
        throw new Error('Failed to update group');
      }
      
      alert('গ্রুপ সফলভাবে পরিবর্তন করা হয়েছে!');
      fetchDutiesForBilling();
    } catch (err) {
      console.error(err);
      alert('গ্রুপ পরিবর্তন করতে ব্যর্থ হয়েছে।');
    }
  };

  const handleLoadBillForEditing = (editRef: string) => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.pathname + window.location.search;
      window.history.pushState({}, '', `/billing?edit_ref=${encodeURIComponent(editRef)}&from=${encodeURIComponent(currentUrl)}`);
    }
    loadArchivedBill(editRef);
  };

  const handleGenerateBillFromOrder = (order: OfficeOrder) => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.pathname + window.location.search;
      window.history.pushState({}, '', `/billing?orderRef=${encodeURIComponent(order.orderRef)}&from=${encodeURIComponent(currentUrl)}`);
    }
    setSelectedOrderRef(order.orderRef);
    setPrintCategory(order.category as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT');
    setIsPrintMode(true);
    
    if (order.employeeName) {
      setRepresentativeName(order.employeeName);
    }
    
    if (order.cellName) {
      const matchedCell = cells.find((c: Cell) => c.name === order.cellName);
      if (matchedCell) {
        setSelectedCell(matchedCell.id.toString());
      }
    }
    
    // Extract month from duties/dutiesJson
    let dutiesList: DutyListEntry[] = (order.duties as any) || [];
    if (dutiesList.length === 0 && order.dutiesJson) {
      try {
        dutiesList = JSON.parse(order.dutiesJson);
      } catch (e) {
        console.error('Failed to parse dutiesJson:', e);
      }
    }
    
    let yearMonth = '';
    if (dutiesList.length > 0) {
      const firstDuty = dutiesList[0] as any;
      const firstDate = firstDuty?.date || (Array.isArray(firstDuty?.dates) && firstDuty.dates[0]) || '';
      if (firstDate) {
        const parts = firstDate.split('-');
        if (parts.length >= 2) yearMonth = `${parts[0]}-${parts[1]}`;
      }
    }
    if (!yearMonth && order.orderDate) {
      const parts = order.orderDate.split('-');
      if (parts.length >= 2) yearMonth = `${parts[0]}-${parts[1]}`;
    }
    
    if (yearMonth) {
      setSelectedMonth(yearMonth);
    }
  };

  ;

  ;

  const { transportRate, apyaonRate } = getPrintCategoryRates(printCategory);

  const renderPrintableReport = () => {
    const { 
      targetBills, 
      totalBillsCount, 
      totalDays, 
      totalTransport, 
      totalApyaon, 
      grandTotal, 
      lateSittingAmount, 
      holidayAmount, 
      nightShiftAmount, 
      employeesBreakdown,
      payeesSummary,
      totalLateDays,
      totalLateAmount,
      totalHolidayDays,
      totalHolidayAmount,
      totalNightDays,
      totalNightAmount,
      totalDaysSum,
      grandTotalSum
    } = reportData;

    return (
      <div className="print-report-layout max-w-4xl mx-auto bg-white p-8 border border-slate-200 shadow-md font-sans text-black" style={{ fontFamily: "'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', sans-serif", color: '#000', lineHeight: '1.4' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4;
              margin: 1in !important;
            }
            .no-print { display: none !important; }
            body {
              background: #fff !important;
              color: #000 !important;
              font-family: 'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', sans-serif !important;
            }
            .print-report-layout {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              max-width: 100% !important;
            }
          }
        `}} />

        {/* Back Controls (No-print) */}
        <div className="no-print flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <button
            onClick={() => setIsReportPrintMode(false)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft size={16} />
            প্রতিবেদন ভিউতে ফিরে যান
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Printer size={14} />
            প্রিন্ট করুন (Print)
          </button>
        </div>

        {/* Report Header */}
        <div className="text-center space-y-1 mb-6">
          <h1 className="text-2xl font-bold tracking-wide">জনতা ব্যাংক পিএলসি.</h1>
          <p className="text-base font-semibold">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
          <p className="text-sm text-slate-500 font-bold uppercase mt-1">লেট সিটিং হলিডে নাইট বিল স্টেটমেন্ট</p>
          <div className="w-full border-t border-double border-black my-2"></div>
          <div className="flex justify-between items-center text-sm font-bold px-2 pt-1">
            <span>প্রতিবেদনের তারিখ: {getBanglaDate(reportDate)}</span>
            <span>প্রস্তুতকাল: {new Date().toLocaleDateString('bn-BD')}</span>
          </div>
        </div>

        {/* KPI Summary Block for Print */}
        <div className="mb-6 p-4 border border-black rounded-lg">
          <h3 className="text-sm font-bold border-b border-black pb-1 mb-2">সংক্ষিপ্ত সারসংক্ষেপ (KPI Summary):</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div><strong>মোট জেনারেটকৃত বিলের সংখ্যা:</strong> {toBanglaDigits(totalBillsCount)} টি</div>
            <div><strong>সর্বমোট প্রদেয় বিলের পরিমাণ:</strong> {toBanglaDigits(grandTotal)}/- টাকা</div>
            <div><strong>মোট ডিউটি কার্যদিবস:</strong> {toBanglaDigits(totalDays)} দিন</div>
            <div><strong>সর্বমোট প্রদেয় (কথায়):</strong> {getBanglaNumberWords(grandTotal)}</div>
            <div><strong>মোট যাতায়াত ভাতা:</strong> {toBanglaDigits(totalTransport)}/- টাকা</div>
            <div><strong>লেট-সিটিং বিল বাবদ:</strong> {toBanglaDigits(lateSittingAmount)}/- টাকা</div>
            <div><strong>মোট আপ্যায়ন ভাতা:</strong> {toBanglaDigits(totalApyaon)}/- টাকা</div>
            <div><strong>ছুটির দিনের বিল বাবদ:</strong> {toBanglaDigits(holidayAmount)}/- টাকা</div>
            <div><strong>রাত্রিকালীন শিফট বিল বাবদ:</strong> {toBanglaDigits(nightShiftAmount)}/- টাকা</div>
          </div>
        </div>

        {/* Table: Payee Bill Summary for Print */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-2">১. কর্মকর্তা ভিত্তিক বিলের সারসংক্ষেপ (Payee Bill Summary):</h3>
          <table className="w-full text-xs border-collapse" style={{ border: '1px solid #000' }}>
            <thead>
              <tr className="bg-slate-50 text-center font-bold" style={{ borderBottom: '1px solid #000' }}>
                <th className="p-1.5 border-r border-black w-12" style={{ borderRight: '1px solid #000' }}>ক্রমিক</th>
                <th className="p-1.5 border-r border-black text-left pl-2" style={{ borderRight: '1px solid #000' }}>কর্মকর্তার নাম ও পদবী (Payee Name & Designation)</th>
                <th className="p-1.5 border-r border-black w-28 text-center" style={{ borderRight: '1px solid #000' }}>বিলের সংখ্যা</th>
                <th className="p-1.5 text-right pr-4 w-40">মোট বিলের পরিমাণ (টাকা)</th>
              </tr>
            </thead>
            <tbody>
              {payeesSummary.map((payee, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid #000' }}>
                  <td className="p-1.5 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(idx + 1)}</td>
                  <td className="p-1.5 border-r border-black text-left pl-2 font-bold" style={{ borderRight: '1px solid #000' }}>
                    {payee.payeeName} {payee.designation ? `(${payee.designation})` : ''}
                  </td>
                  <td className="p-1.5 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(payee.billCount)} টি</td>
                  <td className="p-1.5 text-right pr-4 font-bold">{toBanglaDigits(payee.grandTotal)}/-</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                <td className="p-1.5 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}></td>
                <td className="p-1.5 border-r border-black text-left pl-2 font-bold" style={{ borderRight: '1px solid #000' }}>সর্বমোট</td>
                <td className="p-1.5 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>
                  {toBanglaDigits(payeesSummary.reduce((sum, p) => sum + p.billCount, 0))} টি
                </td>
                <td className="p-1.5 text-right pr-4 font-bold">
                  {toBanglaDigits(payeesSummary.reduce((sum, p) => sum + p.grandTotal, 0))}/-
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Table: Employee Breakdown for Print */}
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-2">২. কর্মকর্তা ভিত্তিক সমন্বিত প্রাপ্তির বিবরণী (Payee Detailed Statement):</h3>
          <table className="w-full text-xs border-collapse" style={{ border: '1px solid #000' }}>
            <thead>
              <tr className="bg-slate-50 text-center font-bold" style={{ borderBottom: '1px solid #000' }}>
                <th className="p-1 border-r border-black w-8" style={{ borderRight: '1px solid #000' }}>#</th>
                <th className="p-1 border-r border-black" style={{ borderRight: '1px solid #000', textAlign: 'left', paddingLeft: '4px' }}>কর্মকর্তার নাম</th>
                <th className="p-1 border-r border-black w-28" style={{ borderRight: '1px solid #000', textAlign: 'left', paddingLeft: '4px' }}>পদবী</th>
                <th className="p-1 border-r border-black w-24" style={{ borderRight: '1px solid #000' }}>লেট-সিটিং (দিন/টাকা)</th>
                <th className="p-1 border-r border-black w-24" style={{ borderRight: '1px solid #000' }}>ছুটির দিন (দিন/টাকা)</th>
                <th className="p-1 border-r border-black w-24" style={{ borderRight: '1px solid #000' }}>নাইট শিফট (দিন/টাকা)</th>
                <th className="p-1 border-r border-black w-14" style={{ borderRight: '1px solid #000' }}>মোট দিন</th>
                <th className="p-1 text-right pr-2 w-24">সর্বমোট (টাকা)</th>
              </tr>
            </thead>
            <tbody>
              {employeesBreakdown.map((record, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid #000' }}>
                  <td className="p-1 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(idx + 1)}</td>
                  <td className="p-1 border-r border-black font-bold" style={{ borderRight: '1px solid #000', textAlign: 'left', paddingLeft: '4px' }}>{record.employeeName}</td>
                  <td className="p-1 border-r border-black" style={{ borderRight: '1px solid #000', textAlign: 'left', paddingLeft: '4px' }}>{record.designation}</td>
                  <td className="p-1 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>
                    {record.lateSittingDays > 0 ? `${toBanglaDigits(record.lateSittingDays)} (${toBanglaDigits(record.lateSittingAmount)}/-)` : '-'}
                  </td>
                  <td className="p-1 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>
                    {record.holidayDays > 0 ? `${toBanglaDigits(record.holidayDays)} (${toBanglaDigits(record.holidayAmount)}/-)` : '-'}
                  </td>
                  <td className="p-1 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>
                    {record.nightShiftDays > 0 ? `${toBanglaDigits(record.nightShiftDays)} (${toBanglaDigits(record.nightShiftAmount)}/-)` : '-'}
                  </td>
                  <td className="p-1 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(record.totalDays)}</td>
                  <td className="p-1 text-right pr-2 font-bold">{toBanglaDigits(record.grandTotal)}/-</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                <td className="p-1 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}></td>
                <td className="p-1 border-r border-black text-left font-bold" style={{ borderRight: '1px solid #000', paddingLeft: '4px' }} colSpan={2}>সর্বমোট</td>
                <td className="p-1 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>
                  {totalLateDays > 0 ? `${toBanglaDigits(totalLateDays)} (${toBanglaDigits(totalLateAmount)}/-)` : '-'}
                </td>
                <td className="p-1 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>
                  {totalHolidayDays > 0 ? `${toBanglaDigits(totalHolidayDays)} (${toBanglaDigits(totalHolidayAmount)}/-)` : '-'}
                </td>
                <td className="p-1 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>
                  {totalNightDays > 0 ? `${toBanglaDigits(totalNightDays)} (${toBanglaDigits(totalNightAmount)}/-)` : '-'}
                </td>
                <td className="p-1 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(totalDaysSum)}</td>
                <td className="p-1 text-right pr-2 font-bold">{toBanglaDigits(grandTotalSum)}/-</td>
              </tr>
            </tbody>
          </table>
        </div>


      </div>
    );
  };

  const renderPrintableLedger = () => {
    return (
      <div className="print-report-layout max-w-4xl mx-auto bg-white p-8 border border-slate-200 shadow-md font-sans text-black" style={{ fontFamily: "'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', sans-serif", color: '#000', lineHeight: '1.4' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4;
              margin: 1.5cm !important;
            }
            .no-print { display: none !important; }
            body {
              background: #fff !important;
              color: #000 !important;
              font-family: 'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', sans-serif !important;
            }
            .print-report-layout {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              max-width: 100% !important;
            }
          }
        `}} />

        {/* Back Controls (No-print) */}
        <div className="no-print flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <button
            onClick={() => setIsLedgerPrintMode(false)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft size={16} />
            খতিয়ান ভিউতে ফিরে যান
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Printer size={14} />
            প্রিন্ট করুন (Print)
          </button>
        </div>

        {/* Report Header */}
        <div className="text-center space-y-1 mb-6">
          <h1 className="text-2xl font-bold tracking-wide">জনতা ব্যাংক পিএলসি.</h1>
          <p className="text-base font-semibold">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
          <p className="text-sm text-slate-500 font-bold uppercase mt-1">আপ্যায়ন বিলিং খতিয়ান ({selectedMonth === 'all' ? 'সকল মাস' : getBanglaMonthYearLabel(selectedMonth)})</p>
          <div className="w-full border-t border-double border-black my-2"></div>
        </div>

        {/* Table: Ledger List */}
        <div className="mb-8">
          <table className="w-full text-xs border-collapse" style={{ border: '1px solid #000' }}>
            <thead>
              <tr className="bg-slate-50 text-center font-bold" style={{ borderBottom: '1px solid #000' }}>
                <th className="p-2 border-r border-black w-12" style={{ borderRight: '1px solid #000' }}>ক্রমিক</th>
                <th className="p-2 border-r border-black text-left" style={{ borderRight: '1px solid #000', paddingLeft: '6px' }}>স্মারক নম্বর (Order Reference)</th>
                <th className="p-2 border-r border-black w-24" style={{ borderRight: '1px solid #000' }}>আদেশের তারিখ</th>
                <th className="p-2 border-r border-black w-24" style={{ borderRight: '1px solid #000' }}>ক্যাটাগরি</th>
                <th className="p-2 border-r border-black text-left" style={{ borderRight: '1px solid #000', paddingLeft: '6px' }}>কর্মকর্তা (Payee)</th>
                <th className="p-2 border-r border-black w-24" style={{ borderRight: '1px solid #000' }}>ডিউটি দিন</th>
                <th className="p-2 text-right pr-2 w-28">সর্বমোট বিল (টাকা)</th>
              </tr>
            </thead>
            <tbody>
              {ledgerActiveOfficeOrders.map((order: OfficeOrder, idx: number) => {
                let dutiesList = order.duties || [];
                if (dutiesList.length === 0 && order.dutiesJson) {
                  try {
                    dutiesList = JSON.parse(order.dutiesJson);
                  } catch (e) {
                    console.error(e);
                  }
                }
                const totalDays = dutiesList.reduce((sum: number, d: any) => sum + (Array.isArray(d.dates) ? d.dates.length : (d.days || 0)), 0);
                
                let transportRate = 200;
                let apyaonRate = 100;
                if (order.category === 'HOLIDAY') {
                  transportRate = 250;
                  apyaonRate = 250;
                } else if (order.category === 'NIGHT_SHIFT') {
                  transportRate = 400;
                  apyaonRate = 600;
                }
                const billTotal = totalDays * (apyaonRate + transportRate);
                const categoryLabel = order.category === 'LATE_SITTING' ? 'লেট সিটিং' : order.category === 'HOLIDAY' ? 'সরকারি ছুটি' : 'রাত্রীকালীন';

                return (
                  <tr key={order.id} style={{ borderTop: '1px solid #000' }}>
                    <td className="p-2 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(idx + 1)}</td>
                    <td className="p-2 border-r border-black font-mono font-bold" style={{ borderRight: '1px solid #000', textAlign: 'left', paddingLeft: '6px' }}>{order.orderRef}</td>
                    <td className="p-2 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(order.orderDate.split('-').reverse().join('-'))}</td>
                    <td className="p-2 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{categoryLabel}</td>
                    <td className="p-2 border-r border-black font-bold" style={{ borderRight: '1px solid #000', textAlign: 'left', paddingLeft: '6px' }}>{order.employeeName}</td>
                    <td className="p-2 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(totalDays)} দিন</td>
                    <td className="p-2 text-right pr-2 font-bold">{toBanglaDigits(billTotal)}/-</td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                <td className="p-2 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}></td>
                <td className="p-2 border-r border-black text-left font-bold" style={{ borderRight: '1px solid #000', paddingLeft: '6px' }} colSpan={4}>সর্বমোট</td>
                <td className="p-2 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>
                  {toBanglaDigits(ledgerActiveOfficeOrders.reduce((sum: number, order: OfficeOrder) => {
                    let dutiesList = order.duties || [];
                    if (dutiesList.length === 0 && order.dutiesJson) {
                      try { dutiesList = JSON.parse(order.dutiesJson); } catch {}
                    }
                    return sum + dutiesList.reduce((s: number, d: any) => s + (Array.isArray(d.dates) ? d.dates.length : (d.days || 0)), 0);
                  }, 0))} দিন
                </td>
                <td className="p-2 text-right pr-2 font-bold text-indigo-600">৳{toBanglaDigits(ledgerGrandTotal.toLocaleString('en-US'))}/-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (isReportPrintMode) {
    return renderPrintableReport();
  }

  if (isLedgerPrintMode) {
    return renderPrintableLedger();
  }

  if (loading) return (
    <div className="p-6 space-y-6">
      <CardSkeleton count={4} />
      <TableSkeleton rows={5} columns={6} />
    </div>
  );

  return (
    <div className="space-y-6">
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
      {/* ----------------------------------------------------
          NORMAL VIEW MODE
      ---------------------------------------------------- */}
      {!isPrintMode ? (
        <>
          {/* Header Action Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">বিল পিডিএফ জেনারেটর</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">কর্মকর্তাদের ক্যাটাগরি ভিত্তিক ভাতার নিখুঁত হিসাব ও জনতা ব্যাংক পিএলসি. এর লিগ্যাল সাইজ বিল মেমো প্রস্তুতকরণ প্যানেল।</p>
            </div>
            
            <button
              onClick={handlePrintButtonClick}
              disabled={pendingBillingOfficeOrders.length === 0}
              title={pendingBillingOfficeOrders.length === 0 ? 'বিল প্রিন্ট করার জন্য কোনো অপেক্ষমান অফিস আদেশ পাওয়া যায়নি' : ''}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
                pendingBillingOfficeOrders.length > 0 
                  ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white hover:opacity-95 cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <Printer size={16} />
              বিল মেমো (Legal Size) দেখুন ও প্রিন্ট করুন
            </button>
          </div>

          {/* Quick Filters Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base font-sans">বিলিং ও স্মারক ফিল্টার</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">মাসিক ভিউ ফিল্টার এবং আপ্যায়ন ভাতার হিসাব বিবরণী।</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Select Cell Filter */}
              <select
                value={selectedCell}
                onChange={(e) => setSelectedCell(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {(currentUser?.role === 'ADMIN' || (currentUser?.cells && currentUser.cells.length > 1)) && (
                  <option value="all">সকল সেল (All Cells)</option>
                )}
                {cells
                  .filter(c => currentUser?.role === 'ADMIN' || currentUser?.cells?.some((uc) => uc.id === c.id))
                  .map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)
                }
              </select>

              {/* Select Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">সকল ক্যাটাগরি (All Categories)</option>
                <option value="LATE_SITTING">Late Sitting (লেট সিটিং)</option>
                <option value="HOLIDAY">Holiday Duty (ছুটির দিনে)</option>
                <option value="NIGHT_SHIFT">Night Shift (রাত্রিকালীন)</option>
              </select>

              {/* Custom Modern Single-Month Picker */}
              <div className="relative" ref={monthPickerRef}>
                <button
                  type="button"
                  onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none transition-all shadow-sm cursor-pointer"
                >
                  <Calendar size={13} className="text-indigo-500 shrink-0" />
                  <span>{selectedMonth === 'all' ? 'সকল মাস' : (selectedMonth ? getBanglaMonthYearLabel(selectedMonth) : 'মাস নির্বাচন করুন')}</span>
                  <svg
                    className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isMonthPickerOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMonthPickerOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Popover Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setCurrentPickerYear(prev => prev - 1)}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-sans">
                        {toBanglaDigits(currentPickerYear)} সাল
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => setCurrentPickerYear(prev => prev + 1)}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* All Months Option */}
                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMonth('all');
                          setIsMonthPickerOpen(false);
                        }}
                        className={`w-full py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          selectedMonth === 'all'
                            ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-md hover:bg-indigo-700'
                            : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-900/50 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-100/50'
                        }`}
                      >
                        সকল মাস (Show All Months)
                      </button>
                    </div>

                    {/* Month Selection Grid */}
                    <div className="grid grid-cols-3 gap-2 py-4">
                      {['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'].map((mName, idx) => {
                        const ymStr = `${currentPickerYear}-${String(idx + 1).padStart(2, '0')}`;
                        const isSelected = selectedMonth === ymStr;
                        
                        return (
                          <button
                            type="button"
                            key={ymStr}
                            onClick={() => {
                              setSelectedMonth(ymStr);
                              setIsMonthPickerOpen(false);
                            }}
                            className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-md scale-102 hover:bg-indigo-700'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            {mName}
                          </button>
                        );
                      })}
                    </div>

                    {/* Popover Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const mm = String(today.getMonth() + 1).padStart(2, '0');
                          setSelectedMonth(`${today.getFullYear()}-${mm}`);
                          setIsMonthPickerOpen(false);
                        }}
                        className="text-[9px] font-bold text-indigo-500 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        চলতি মাস রিসেট
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setIsMonthPickerOpen(false)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                      >
                        ঠিক আছে
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 mt-4">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 relative cursor-pointer ${
                activeTab === 'ledger'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              বিলিং খতিয়ান (Billing Ledger)
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 relative cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              অপেক্ষমান বিল জেনারেট করুন
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'orders'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
              }`}>
                {toBanglaDigits(pendingBillingOfficeOrders.length)}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 relative cursor-pointer ${
                activeTab === 'bills'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              জেনারেটেড এবং প্রিন্টেড সেকশন
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'bills'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
              }`}>
                {toBanglaDigits(filteredBillMemos.length)}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 relative cursor-pointer ${
                activeTab === 'reports'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              রিপোর্ট ও বিশ্লেষণ (Reports)
            </button>
          </div>

          {activeTab === 'ledger' && (
            <LedgerTab
              loading={loading}
              showOrderWarning={showOrderWarning}
              metrics={metrics}
              allActiveOfficeOrders={ledgerActiveOfficeOrders}
              findAssociatedBill={findAssociatedBill}
              handleLoadBillForEditing={handleLoadBillForEditing}
              handleGenerateBillFromOrder={handleGenerateBillFromOrder}
              ledgerGrandTotal={ledgerGrandTotal}
              selectedMonth={selectedMonth}
              setIsLedgerPrintMode={setIsLedgerPrintMode}
              setViewingOrder={setViewingOrder}
              handleDeleteOrder={handleDeleteOrder}
              hasDeletePermission={hasDeletePermission}
              employees={employees}
              currentUser={currentUser}
              selectedCell={selectedCell}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersTab
              loading={loading}
              pendingBillingOfficeOrders={pendingBillingOfficeOrders}
              archivedBillNormalizedRefs={archivedBillNormalizedRefs}
              getNormalizedRef={getNormalizedRef}
              archivedOrders={archivedOrders}
              handleLoadBillForEditing={handleLoadBillForEditing}
              handleGenerateBillFromOrder={handleGenerateBillFromOrder}
              hasEditPermission={hasEditPermission}
              hasDeletePermission={hasDeletePermission}
              handleDeleteOrder={handleDeleteOrder}
              setViewingOrder={setViewingOrder}
            />
          )}

          {activeTab === 'bills' && (
            <BillsTab
              loading={loading}
              filteredBillMemos={filteredBillMemos}
              handleLoadBillForEditing={handleLoadBillForEditing}
              hasEditPermission={hasEditPermission}
              hasDeletePermission={hasDeletePermission}
              handleDeleteOrder={handleDeleteOrder}
              setViewingOrder={setViewingOrder}
              onBulkPrintPreview={(orders) => setViewingOrders(orders)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              billGroups={billGroups}
              expandedSlots={expandedSlots}
              toggleSlot={toggleSlot}
              findMatchingOfficeOrder={findMatchingOfficeOrder}
              hasDeletePermission={hasDeletePermission}
              handleDeleteOrder={handleDeleteOrder}
              handleLoadBillForEditing={handleLoadBillForEditing}
              handleChangeBillGroup={handleChangeBillGroup}
              reportDate={reportDate}
              setReportDate={setReportDate}
              reportData={reportData}
              setIsReportPrintMode={setIsReportPrintMode}
              getBanglaNumberWords={getBanglaNumberWords}
            />
          )}
        </>
      ) : (
        // ----------------------------------------------------
        // JANATA BANK PLC PRINT MODE (Legal সাইজ মেমো বিবরণী)
        // ----------------------------------------------------
        <div className="space-y-6">
          {/* Dynamic Media Print Style Overrides to ensure precise Legal spacing with Kalpurush font family */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: legal portrait;
                margin: 0;
              }
              .no-print { display: none !important; }
              body { 
                margin: 0 !important; 
                padding: 0 !important; 
                background: #fff !important; 
                font-family: "SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif !important; 
                font-size: 12px !important;
                line-height: 1.6 !important;
                letter-spacing: normal !important;
                word-spacing: normal !important;
              }
              .whitespace-nowrap {
                white-space: nowrap !important;
              }
              .print-legal-layout {
                width: 100% !important;
                max-width: 100% !important;
                min-width: 100% !important;
                height: auto !important;
                min-height: auto !important;
                padding-top: 0.5in !important;
                padding-bottom: 0.5in !important;
                padding-left: 1.4in !important;
                padding-right: 0.5in !important;
                border: none !important;
                box-shadow: none !important;
                display: block !important;
                overflow: visible !important;
                letter-spacing: normal !important;
                word-spacing: normal !important;
              }
              .print-block {
                display: block !important;
                height: auto !important;
              }
            }
          `}} />

          {/* Back Controls (No-print) */}
          <div className="no-print flex flex-col gap-4 glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <button
                onClick={isEditingArchive ? handleCancelEditBill : handleBackToLedger}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-sans"
              >
                <ChevronLeft size={16} />
                ফিরে যান (লেজার ভিউ)
              </button>

              <div className="flex gap-3">
                {isEditingArchive ? (
                  <>
                    <button
                      onClick={() => handleGenerateAndPrint('generate')}
                      disabled={archiving || !isBillDirty}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:cursor-not-allowed font-sans whitespace-nowrap"
                    >
                      {archiving ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          সংরক্ষণ হচ্ছে...
                        </>
                      ) : (
                        <>
                          <FileSignature size={14} />
                          সেভ করুন
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancelEditBill}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-250 dark:border-slate-700 cursor-pointer font-sans whitespace-nowrap"
                    >
                      বাতিল করুন
                    </button>
                  </>
                ) : !billGenerated ? (
                  <button
                    onClick={() => handleGenerateAndPrint('generate')}
                    disabled={archiving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {archiving ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        প্রসেস হচ্ছে...
                      </>
                    ) : (
                      <>
                        <FileSignature size={14} />
                        বিল জেনারেট করুন (Generate Bill)
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleGenerateAndPrint('print')}
                      disabled={archiving}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {archiving ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          প্রসেস হচ্ছে...
                        </>
                      ) : (
                        <>
                          <Printer size={14} />
                          প্রিন্ট প্রিভিউ
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleGenerateAndPrint('download')}
                      disabled={archiving}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {archiving ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          প্রসেস হচ্ছে...
                        </>
                      ) : (
                        <>
                          <Printer size={14} />
                          ডাউনলোড
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {archiveSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle size={16} className="text-emerald-500" />
                <span>{archiveSuccess}</span>
              </div>
            )}

            {archiveError && (
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-3 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400">
                <AlertCircle size={16} className="text-rose-505" />
                <span>{archiveError}</span>
              </div>
            )}
          </div>

          {/* Interactive Print Options Configurator (No-print) */}
          <div className="no-print glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-50 to-indigo-500 text-base">বিল মেমো কাস্টমাইজেশন ও প্রফেশনাল কন্ট্রোল প্যানেল</h3>
            
            <div className="space-y-4">
              {/* Row 1: Document Metadata & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="printCategory" className="text-xs font-bold text-slate-500">ডিউটির ক্যাটাগরি (Duty Category)</label>
                  <select
                    id="printCategory"
                    value={printCategory}
                    onChange={(e) => setPrintCategory(e.target.value as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LATE_SITTING">Late Sitting (লেট সিটিং)</option>
                    <option value="NIGHT_SHIFT">Night Shift (রাত্রের ডিউটি)</option>
                    <option value="HOLIDAY">Holiday Duty (ছুটির দিন)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="billDate" className="text-xs font-bold text-slate-500">মেমো তারিখ (Memo Date)</label>
                  <input
                    id="billDate"
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="subjectText" className="text-xs font-bold text-slate-500">বিষয় (Memo Subject)</label>
                  <input
                    id="subjectText"
                    type="text"
                    value={subjectText}
                    onChange={(e) => setSubjectText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="billRef" className="text-xs font-bold text-slate-500">স্মারক/সূত্র নম্বর (Bill Ref)</label>
                  <input
                    id="billRef"
                    type="text"
                    value={billRef}
                    onChange={(e) => setBillRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* office order selection dropdown (Pending vs Billed) */}
              {(pendingOrderRefs.length > 0 || billedOrderRefs.length > 0) && (
                <div className="p-4 rounded-xl bg-indigo-500/5 dark:bg-indigo-950/10 border border-indigo-150/40 dark:border-indigo-900/20 space-y-1.5">
                  <label className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    কোন অফিস আদেশের বিল প্রস্তুত/সম্পাদনা করতে চান? (Select Office Order)
                  </label>
                  <select
                    value={selectedOrderRef}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setSelectedOrderRef(val);
                      
                      // Check if already billed
                      if (billedOrderRefs.includes(val)) {

                        const norm = getNormalizedRef(val);
                        const existingBill = archivedOrders.find(o => o.category?.startsWith('BILL_') && getNormalizedRef(o.orderRef) === norm);
                        if (existingBill) {
                          if (confirm('এই অফিস আদেশের অধীনে ইতিমধ্যেই বিল তৈরি করা হয়েছে। আপনি কি পূর্ববর্তী বিলটি সম্পাদনা (Edit) করতে চান?')) {
                            window.location.href = `/billing?edit_ref=${encodeURIComponent(existingBill.orderRef)}`;
                          }
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200/60 dark:border-indigo-900/40 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- অফিস আদেশ নির্বাচন করুন --</option>
                    {pendingOrderRefs.length > 0 && (
                      <optgroup label="বিল প্রস্তুত করা হয়নি (Pending Billing)">
                        {pendingOrderRefs.map(ref => (
                          <option key={ref} value={ref}>{ref}</option>
                        ))}
                      </optgroup>
                    )}
                    {billedOrderRefs.length > 0 && (
                      <optgroup label="ইতিমধ্যেই বিল প্রস্তুত করা হয়েছে (Already Billed)">
                        {billedOrderRefs.map(ref => (
                          <option key={ref} value={ref}>{ref} (বিল সম্পাদিত)</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}

              {/* Row 2: Payees & Representatives & DGM */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="representativeName" className="text-xs font-bold text-slate-500">তহবিল সংগ্রহকারী কর্মকর্তা (Bill Favoring To)</label>
                  <select
                    id="representativeName"
                    value={representativeName}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setRepresentativeName(selectedVal);
                      const found = employees.find(emp => emp.name === selectedVal);
                      if (found) {
                        setRepresentativeDesignation(getShortDesignation(found.designation));
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="">Select Payee (সিলেক্ট করুন)</option>
                    {printFilteredSummaries.map(summary => (
                      <option key={summary.employeeId} value={summary.name}>
                        {summary.name} ({getShortDesignation(summary.designation)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="representativeDesignation" className="text-xs font-bold text-slate-500">প্রতিনিধির পদবী (Representative Designation)</label>
                  <input
                    id="representativeDesignation"
                    type="text"
                    disabled
                    value={representativeDesignation}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-xs cursor-not-allowed text-slate-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="selectedExecutiveId" className="text-xs font-bold text-slate-500">অনুমোদনকারী কর্মকর্তা (DGM)</label>
                  <select
                    id="selectedExecutiveId"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="">DGM নির্বাচন করুন</option>
                    {executives.map(ex => (
                      <option key={ex.id} value={ex.id.toString()}>
                        {ex.name} ({ex.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center p-2 bg-slate-100/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-x-auto shadow-inner">
            <div className="print-legal-layout w-[8.5in] h-[14.0in] bg-white border border-slate-200 text-black shadow-xl flex flex-col justify-between overflow-hidden relative" style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', paddingTop: '0.5in', paddingBottom: '0.5in', paddingLeft: '1.4in', paddingRight: '0.5in', boxSizing: 'border-box', fontSize: '12px', lineHeight: '1.0' }}>
              
              <div className="print-block flex flex-col h-full justify-between">
                <div>
                  {/* Official Header */}
                  <div className="w-full flex justify-end text-right mb-4">
                    <div className="text-right leading-none" style={{ lineHeight: '0.85' }}>
                      <h2 className="text-[18px] font-bold text-black uppercase" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '18px', lineHeight: '0.85', margin: 0, padding: 0 }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h2>
                      <p className="text-[12px] font-bold text-black" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '0.85', margin: 0, padding: 0, marginTop: '2px' }}>তারিখ: {getBanglaDate(billDate)} ইং</p>
                    </div>
                  </div>

                  {/* Title and Main Body */}
                  <div className="flex-1 flex flex-col justify-between mt-2">
                    <div>
                      <h2 className="text-left text-[12px] font-bold underline decoration-black underline-offset-2 leading-none" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.0' }}>
                        বিষয়: {subjectText}
                      </h2>
                      
                      <div className="mt-2.5">
                        <p className="text-justify leading-normal text-black text-[12px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.1' }}>
                          {openingParagraph}
                        </p>
                      </div>

                      {/* Redesigned Printed Legal Billing Table */}
                      {printFilteredSummaries.length > 0 ? (
                        <table className="w-full border-collapse border border-black text-center mt-3 text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                          <thead>
                            <tr className="bg-slate-50 font-bold border-b border-black text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                              <th className="border border-black p-1.5 w-[6%] text-center">ক্রমিক</th>
                              <th className="border border-black p-1.5 text-left pl-3 w-[32%]">নাম ও পদবী</th>
                              <th className="border border-black p-1.5 text-center w-[26%]">তারিখ</th>
                              <th className="border border-black p-1.5 text-center w-[13%]">যাতায়াত</th>
                              <th className="border border-black p-1.5 text-center w-[13%]">আপ্যায়ন</th>
                              <th className="border border-black p-1.5 text-center w-[10%]">মোট</th>
                            </tr>
                          </thead>
                          <tbody>
                            {printFilteredSummaries.map((summary, index) => {
                              const days = printCategory === 'LATE_SITTING' ? summary.lateDays : printCategory === 'HOLIDAY' ? summary.holidayDays : summary.nightDays;
                              const empTransport = days * transportRate;
                              const empApyaon = days * apyaonRate;
                              const empTotal = empTransport + empApyaon;
                              
                              return (
                                <tr key={summary.employeeId} className="text-black text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                                  <td className="border border-black p-1.5 text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>{toBanglaDigits(index + 1)}</td>
                                  <td className="border border-black p-1.5 text-left pl-3 font-normal whitespace-nowrap" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.1', whiteSpace: 'nowrap' }}>
                                    {(() => {
                                      const displayName = summary.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
                                      return (
                                        <>
                                          <p className="font-normal whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>{displayName.startsWith('জনাব') ? displayName : `জনাব ${displayName}`}</p>
                                          <p className="text-[10px] text-slate-800 font-normal mt-0.5" style={{ fontSize: '11px', marginTop: '2px' }}>({getShortDesignation(summary.designation)})</p>
                                        </>
                                      );
                                    })()}
                                  </td>
                                  <td className="border border-black p-1.5 text-center leading-snug" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.15' }}>
                                    {renderDatesInPairs(formatWorkedDatesForCategory(summary.employeeId)).map((pair, pIdx, arr) => (
                                      <span key={pIdx} className="block leading-snug" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                                        {pair}
                                      </span>
                                    ))}
                                    <p className="text-[11px] text-slate-700 mt-0.5 font-semibold">মোট: {toBanglaDigits(days)} দিন</p>
                                  </td>
                                  <td className="border border-black p-1.5 text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0', verticalAlign: 'middle' }}>
                                    <span style={{ display: 'block', whiteSpace: 'nowrap' }}>({toBanglaDigits(transportRate)}x{toBanglaDigits(days)}) =</span>
                                    <span style={{ display: 'block', whiteSpace: 'nowrap', marginTop: '2px' }}>{toBanglaDigits(empTransport)}/-</span>
                                  </td>
                                  <td className="border border-black p-1.5 text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0', verticalAlign: 'middle' }}>
                                    <span style={{ display: 'block', whiteSpace: 'nowrap' }}>({toBanglaDigits(apyaonRate)}x{toBanglaDigits(days)}) =</span>
                                    <span style={{ display: 'block', whiteSpace: 'nowrap', marginTop: '2px' }}>{toBanglaDigits(empApyaon)}/-</span>
                                  </td>
                                  <td className="border border-black p-1.5 font-extrabold text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                                    {toBanglaDigits(empTotal)}/-
                                  </td>
                                </tr>
                              );
                            })}
                            
                            <tr className="font-bold bg-slate-50/50 text-[11px] border-t-2 border-black" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                              <td className="border border-black p-1.5 text-right pr-3" colSpan={3} style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                                <p>মোট দিন = {toBanglaDigits(totalDaysAll)} দিন</p>
                                <p className="mt-1">মোট টাকা = ({getBanglaNumberWords(grandTotalPrintAll).replace(' টাকা মাত্র', ' টাকা')})</p>
                              </td>
                              <td className="border border-black p-1.5 text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                                ({toBanglaDigits(transportRate)}x{toBanglaDigits(totalDaysAll)}) = {toBanglaDigits(totalTransportAll)}/-
                              </td>
                              <td className="border border-black p-1.5 text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                                ({toBanglaDigits(apyaonRate)}x{toBanglaDigits(totalDaysAll)}) = {toBanglaDigits(totalApyaonAll)}/-
                              </td>
                              <td className="border border-black p-1.5 font-extrabold text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                                {toBanglaDigits(grandTotalPrintAll)}/-
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      ) : null}

                      {/* Paragraphs */}
                      <div className="text-left pt-3 mt-3 space-y-1.5" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.1' }}>
                        <p className="text-justify leading-normal text-black" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.1' }}>
                          ০১। যাতায়াত বিলটি সঠিক এবং পূর্বে পরিশোধ করা হয়নি।
                        </p>
                        <p className="text-justify leading-normal text-black" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.1' }}>
                          ০২। ২০১৭ সালের আর্থিক ক্ষমতা অর্পন এর পৃষ্ঠা ১৫ এর অনুচ্ছেদ-২৬.০২ মোতাবেক যাতায়াত খাত (কোড-১৩৫৫১২০৫০০০০০০৩) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(totalTransportAll)}/- ({getBanglaNumberWords(totalTransportAll).replace(' টাকা মাত্র', ' টাকা')})</strong> এবং পৃষ্ঠা ১৪ এর অনুচ্ছেদ-২২.০২ মোতাবেক আপ্যায়ন খাত (কোড-১৩৫৫১২০১০০০০০০২) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(totalApyaonAll)}/- ({getBanglaNumberWords(totalApyaonAll).replace(' টাকা মাত্র', ' টাকা')})</strong> অনুমোদন ক্ষমতা উপ-মহাব্যবস্থাপক মহোদয়ের এখতিয়ারাধীন।
                        </p>
                        <p className="text-justify leading-normal text-black" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.1' }}>
                          ০৩। এমতাবস্থায়, বর্ণিত খরচ অনুমোদনপূর্বক যাতায়াত ও আপ্যায়ন খাত (প্রযোজ্য ক্ষেত্রে) বিকলন করতঃ মোট = <strong>{toBanglaDigits(grandTotalPrintAll)}/- ({getBanglaNumberWords(grandTotalPrintAll).replace(' টাকা মাত্র', ' টাকা')})</strong> <strong>{(representativeName || 'জনাব আব্দুল্লাহ আল জোবায়ের').replace(/\s*\([^)]*\)\s*$/, '')}, {representativeDesignation || 'এসও-আইটি'}</strong> এর নামে প্রদানের নিমিত্ত নিরীক্ষার অনুরোধ জানিয়ে বাজেট এন্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট বরাবর এবং নিরীক্ষান্তে নথি একাউন্টস ডিপার্টমেন্ট বরাবর প্রেরণ করা যেতে পারে।
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right-aligned payee signature block */}
                  <div className="w-full flex justify-end text-right" style={{ marginTop: '0.25in', marginBottom: '0.1in' }}>
                    <div className="text-right leading-none" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', paddingRight: '0.1in', lineHeight: '1.15' }}>
                      <p className="font-extrabold text-[12px]" style={{ margin: 0, padding: 0, lineHeight: '1.15' }}>({cleanBracketName((representativeName || 'জনাব আব্দুল্লাহ আল জোবায়ের').replace(/\s*\([^)]*\)\s*$/, ''))})</p>
                      <p className="text-[12px] font-bold text-slate-800" style={{ margin: 0, padding: 0, marginTop: '3px', lineHeight: '1.15' }}>{representativeDesignation || 'এসও-আইটি'}</p>
                    </div>
                  </div>

                  {/* Left-aligned Routing List with nice gaps, underlines and font size 12, NOT bold */}
                  <div className="w-full text-left mt-4 pl-1" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '10.5px', lineHeight: '1.4' }}>
                    <div style={{ marginBottom: '0.7in' }}>
                      <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                        এসপিও, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ
                      </p>
                    </div>
                    <div style={{ marginBottom: '0.7in' }}>
                      <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                        এজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ
                      </p>
                    </div>
                    <div style={{ marginBottom: '0.7in' }}>
                      <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                        ডিজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ
                      </p>
                    </div>
                    <div style={{ marginBottom: '0.7in' }}>
                      <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                        ডিজিএম, (বাজেট অ্যান্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট) সমীপেঃ
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- VIEW OFFICE ORDER OR BILL MODAL --- */}
      {viewingOrder && (
        <BillPrintLayout
          viewingOrder={viewingOrder}
          onClose={() => setViewingOrder(null)}
          fetchDutiesForBilling={fetchDutiesForBilling}
        />
      )}

      {viewingOrders && (
        <BulkBillPrintLayout
          viewingOrders={viewingOrders}
          onClose={() => setViewingOrders(null)}
          fetchDutiesForBilling={fetchDutiesForBilling}
        />
      )}
    </div>
  );
}
