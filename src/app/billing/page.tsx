'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
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
  FileText
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
}

// Convert English digits/text to Bengali digits
const toBanglaDigits = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/[0-9]/g, (w) => bnDigits[parseInt(w, 10)]);
};

// Convert Gregorian Date String to formal Bengali Date (e.g. ২৩-০৫-২০২৬)
const getBanglaDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const bnDay = toBanglaDigits(parseInt(day, 10).toString().padStart(2, '0'));
  const bnMonth = toBanglaDigits(parseInt(month, 10).toString().padStart(2, '0'));
  const bnYear = toBanglaDigits(year);
  return `${bnDay}-${bnMonth}-${bnYear}`;
};

// Convert Gregorian YYYY-MM into formal Bengali Month Year (e.g. জুন ২০২৬)
const getBanglaMonthYearLabel = (ym: string) => {
  if (!ym || !ym.includes('-')) return '';
  const [yearStr, monthStr] = ym.split('-');
  const month = parseInt(monthStr, 10);
  const banglaMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  return `${banglaMonths[month - 1]} ${toBanglaDigits(yearStr)}`;
};

// Convert total number into Bengali Words for Legal certification note
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

export default function BillingPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'ledger' | 'orders' | 'bills'>('ledger');
  const [viewingOrder, setViewingOrder] = useState<OfficeOrder | null>(null);
  const [billGenerated, setBillGenerated] = useState(false);
  const isFirstLoadRef = useRef(true);
  const isInitializingArchiveRef = useRef(false);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [baseOrderRef, setBaseOrderRef] = useState('');
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });

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

  // Legal Print Form Configs
  const [isPrintMode, setIsPrintMode] = useState(false);
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
        return;
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
  }, [baseOrderRef, selectedOrderRef, printCategory, representativeName, randomNumber]);

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
        const [cellRes, execRes, empRes, authRes] = await Promise.all([
          fetch('/api/cells'),
          fetch('/api/executives'),
          fetch('/api/employees'),
          fetch('/api/auth')
        ]);
        const cellData = await cellRes.json();
        const execData = await execRes.json();
        const empData = await empRes.json();
        const authData = await authRes.json();
        setCells(Array.isArray(cellData) ? cellData : []);
        setEmployees(Array.isArray(empData) ? empData : []);
        if (authRes.ok && authData.authenticated) {
          setCurrentUser(authData.user);
        }
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
            baseRef = baseRef.slice(0, -5);
          }
          setBaseOrderRef(baseRef);

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
              
              // Extract month from dutiesJson
              let dutiesList: DutyListEntry[] = [];
              try {
                dutiesList = JSON.parse(matchedOrder.dutiesJson || '[]');
              } catch (e) {
                console.error('Failed to parse dutiesJson:', e);
              }
              
              let yearMonth = '';
              if (dutiesList.length > 0 && dutiesList[0].date) {
                const parts = dutiesList[0].date.split('-');
                if (parts.length >= 2) yearMonth = `${parts[0]}-${parts[1]}`;
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
        backingRef = urlEditRef.endsWith('/বিল') ? urlEditRef.slice(0, -5) : urlEditRef;
      }
      const orderRefToFetch = urlOrderRef || backingRef;

      let activeList: Duty[] = [];
      if (orderRefToFetch) {
        const res = await fetch(`/api/duties?orderRef=${encodeURIComponent(orderRefToFetch)}&includeArchived=true`);
        const data = await res.json();
        activeList = Array.isArray(data) ? data : [];
      } else {
        const yearMonth = selectedMonth.split('-');
        const year = yearMonth[0];
        const month = yearMonth[1];
        
        const startDate = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
        const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        
        let queryUrl = `/api/duties?startDate=${startDate}&endDate=${endDate}&includeArchived=true`;
        if (selectedCell !== 'all') {
          queryUrl += `&cellId=${selectedCell}`;
        }
        
        const res = await fetch(queryUrl);
        const data = await res.json();
        activeList = Array.isArray(data) ? data : [];
      }

      // Fetch all archived office orders and bills
      const ordersRes = await fetch('/api/office-orders');
      const ordersData = await ordersRes.json();
      const archivedOrdersList: OfficeOrder[] = Array.isArray(ordersData) ? ordersData : [];
      setArchivedOrders(archivedOrdersList);

      const getNormalizedRef = (ref: string) => {
        if (!ref) return '';
        let clean = ref;
        if (clean.endsWith('/বিল')) {
          clean = clean.slice(0, -5);
        }
        const parts = clean.split('/');
        if (parts.length >= 3) {
          parts.splice(2, 1); // remove name component
        }
        return parts.join('/');
      };

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
  }, [selectedMonth, selectedCell, printCategory]);

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

  useEffect(() => {
    setTimeout(() => {
      fetchDutiesForBilling();
    }, 0);
  }, [fetchDutiesForBilling]);

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
      ? duties.filter(d => d.orderRef === selectedOrderRef)
      : duties;
      
    if (selectedCategory !== 'all') {
      activeDuties = activeDuties.filter(d => d.type === selectedCategory);
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
    
    return Array.from(map.values()).sort((a, b) => b.grandTotal - a.grandTotal);
  };

  const billingSummaries = getBillingSummaries();

  // Filter summaries for print based on selected printCategory
  const printFilteredSummaries = billingSummaries.filter(s => {
    if (printCategory === 'LATE_SITTING') return s.lateDays > 0;
    if (printCategory === 'HOLIDAY') return s.holidayDays > 0;
    if (printCategory === 'NIGHT_SHIFT') return s.nightDays > 0;
    return false;
  });

  // Automatically select representative payee by default (based on selected office order payee name, falling back to first employee)
  useEffect(() => {
    if (selectedOrderRef && archivedOrders.length > 0) {
      const matchedOrder = archivedOrders.find(o => o.orderRef === selectedOrderRef);
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
  }, [duties, printCategory, selectedOrderRef, archivedOrders, employees, printFilteredSummaries]);

  // Aggregate financial metrics for general dashboard
  const aggregateMetrics = () => {
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

    duties.forEach(d => {
      if (selectedCategory !== 'all' && d.type !== selectedCategory) return;
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

  // Rates configuration strictly for calculations
  const getPrintCategoryRates = () => {
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
  };


  // Helper to extract category duties for formatting
  const getEmployeeCategoryDuties = (employeeId: number) => {
    return duties.filter(d => d.employeeId === employeeId && d.type === printCategory);
  };

  // Helper to format worked dates nicely with full DD-MM-YYYY format
  const formatWorkedDatesForCategory = (empId: number) => {
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
    const { transportRate } = getPrintCategoryRates();
    const days = printCategory === 'LATE_SITTING' ? s.lateDays : printCategory === 'HOLIDAY' ? s.holidayDays : s.nightDays;
    return sum + (days * transportRate);
  }, 0);

  const totalApyaonAll = printFilteredSummaries.reduce((sum, s) => {
    const { apyaonRate } = getPrintCategoryRates();
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

      const backingOrder = archivedOrders.find(o => o.orderRef === selectedOrderRef);

      const archivePayload = {
        orderRef: billRef,
        originalOrderRef: isEditingArchive ? originalBillRef : undefined,
        orderDate: billDate,
        category: "BILL_" + printCategory,
        employeeName: representativeName,
        cellName: cellName,
        status: action === 'generate' ? 'Generated' : undefined,
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
          .filter(d => 
            (d.orderRef === selectedOrderRef || 
             d.orderRef === baseOrderRef || 
             d.orderRef === billRef || 
             d.orderRef === (isEditingArchive ? originalBillRef : '') ||
             (d.orderRef && baseOrderRef && d.orderRef.replace(/\/বিল$/, '') === baseOrderRef.replace(/\/বিল$/, ''))
            ) && 
            d.type === printCategory
          )
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

      if (action === 'generate') {
        const archiveRes = await fetch('/api/office-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(archivePayload),
        });

        if (!archiveRes.ok) {
          throw new Error('Failed to archive bill memo metadata');
        }
        console.log('Bill memo metadata archived successfully!');

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
    if (currentUser?.role === 'ADMIN') return true;
    if (currentUser?.role === 'USER') {
      const userCellNames = currentUser.cells?.map((c: Cell) => c.name) || [];
      return order.cellName && userCellNames.includes(order.cellName);
    }
    return false;
  };

  const hasEditPermission = (order: OfficeOrder) => {
    if (currentUser?.role === 'ADMIN') return true;
    if (currentUser?.role === 'USER') {
      const userCellNames = currentUser.cells?.map((c: Cell) => c.name) || [];
      return order.cellName && userCellNames.includes(order.cellName);
    }
    return false;
  };

  const getNormalizedRef = useCallback((ref: string) => {
    if (!ref) return '';
    let clean = ref;
    if (clean.endsWith('/বিল')) {
      clean = clean.slice(0, -5);
    }
    const parts = clean.split('/');
    if (parts.length >= 3) {
      parts.splice(2, 1); // remove name component
    }
    return parts.join('/');
  }, []);

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
      
      // Cell filter
      if (selectedCell !== 'all') {
        const targetCellObj = cells.find(c => c.id.toString() === selectedCell);
        if (targetCellObj && order.cellName !== targetCellObj.name) {
          return false;
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
      if (selectedMonth) {
        let matchesMonth = order.orderDate?.startsWith(selectedMonth);
        if (!matchesMonth) {
          try {
            const dutiesList = JSON.parse(order.dutiesJson || '[]');
            if (dutiesList.some((d: DutyListEntry) => d.date && d.date.startsWith(selectedMonth))) {
              matchesMonth = true;
            }
          } catch {
            // ignore
          }
        }
        if (!matchesMonth) return false;
      }
      
      return true;
    });
  }, [archivedOrders, selectedCell, selectedCategory, selectedMonth, cells]);

  const filteredOrdersList = useMemo(() => getFilteredOrders('orders'), [getFilteredOrders]);
  const pendingBillingOfficeOrders = useMemo(() => filteredOrdersList.filter(o => !archivedBillNormalizedRefs.has(getNormalizedRef(o.orderRef))), [filteredOrdersList, archivedBillNormalizedRefs, getNormalizedRef]);
  const billedOfficeOrders = useMemo(() => filteredOrdersList.filter(o => archivedBillNormalizedRefs.has(getNormalizedRef(o.orderRef))), [filteredOrdersList, archivedBillNormalizedRefs, getNormalizedRef]);

  const filteredBillMemos = useMemo(() => getFilteredOrders('bills'), [getFilteredOrders]);

  const handleLoadBillForEditing = (editRef: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/billing?edit_ref=${encodeURIComponent(editRef)}`);
    }
    loadArchivedBill(editRef);
  };

  const handleGenerateBillFromOrder = (order: OfficeOrder) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/billing?orderRef=${encodeURIComponent(order.orderRef)}`);
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
    
    // Extract month from dutiesJson
    let dutiesList: DutyListEntry[] = [];
    try {
      dutiesList = JSON.parse(order.dutiesJson || '[]');
    } catch (e) {
      console.error('Failed to parse dutiesJson:', e);
    }
    
    let yearMonth = '';
    if (dutiesList.length > 0 && dutiesList[0].date) {
      const parts = dutiesList[0].date.split('-');
      if (parts.length >= 2) yearMonth = `${parts[0]}-${parts[1]}`;
    }
    if (!yearMonth && order.orderDate) {
      const parts = order.orderDate.split('-');
      if (parts.length >= 2) yearMonth = `${parts[0]}-${parts[1]}`;
    }
    
    if (yearMonth) {
      setSelectedMonth(yearMonth);
    }
  };

  const renderOrdersGrid = (ordersList: OfficeOrder[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ordersList.map((order) => {
          const isOrderBilled = archivedBillNormalizedRefs.has(getNormalizedRef(order.orderRef));
          
          return (
            <div 
              key={order.id}
              className="group border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 bg-white/30 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between gap-4 shadow-sm text-slate-850 dark:text-slate-100"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-500/20 font-sans">
                    <CheckCircle size={10} className="text-emerald-505" />
                    {order.status === 'Generated & Printed' || order.status === 'Printed' ? 'জেনারেটেড এন্ড প্রিন্টেড' : order.status}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isOrderBilled ? (
                      <span className="text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full font-extrabold border border-teal-500/20 font-sans">
                        বিল সম্পন্ন
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-extrabold border border-amber-500/20 animate-pulse font-sans">
                        বিল অপেক্ষমাণ
                      </span>
                    )}
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase font-sans">
                      {order.category === 'LATE_SITTING' ? 'লেট সিটিং' : order.category === 'HOLIDAY' ? 'সরকারি ছুটি' : 'রাত্রীকালীন'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1.5 text-left">
                  <h4 className="text-xs font-extrabold leading-snug font-mono break-all text-slate-800 dark:text-slate-100" title={order.orderRef}>
                    {order.orderRef}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-1 border-t border-slate-100/50 dark:border-slate-800/50 mt-2 font-sans">
                    <div>
                      <span className="text-slate-400 font-medium block">আদেশের তারিখ:</span>
                      <span>{order.orderDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">কর্মকর্তা:</span>
                      <span className="truncate block" title={order.employeeName}>{order.employeeName}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-medium block">শাখা/セル:</span>
                      <span>{order.cellName || 'আইটি বিভাগ'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setViewingOrder(order)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer font-sans"
                    title="অর্ডারটি ভিউ করুন"
                  >
                    <Eye size={12} />
                    <span>ভিউ</span>
                  </button>

                  {isOrderBilled ? (
                    <button 
                      onClick={() => {
                        const norm = getNormalizedRef(order.orderRef);
                        const existingBill = archivedOrders.find(o => o.category?.startsWith('BILL_') && getNormalizedRef(o.orderRef) === norm);
                        if (existingBill) {
                          handleLoadBillForEditing(existingBill.orderRef);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-lg text-[10px] font-extrabold transition-all border border-teal-100 dark:border-teal-950/30 cursor-pointer font-sans"
                      title="বিলটি সম্পাদন করুন"
                    >
                      <Receipt size={12} />
                      <span>বিল সম্পাদন</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleGenerateBillFromOrder(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-extrabold transition-all border border-amber-100 dark:border-amber-950/30 cursor-pointer font-sans"
                      title="বিল জেনারেট করুন"
                    >
                      <Receipt size={12} />
                      <span>বিল জেনারেট</span>
                    </button>
                  )}
                  
                  {hasEditPermission(order) && (
                    <button 
                      onClick={() => window.location.href = `/roster?edit_ref=${encodeURIComponent(order.orderRef)}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer font-sans"
                      title="রোস্টারে ফিরে এডিট করুন (স্মারক একই থাকবে)"
                    >
                      <FileSignature size={12} />
                      <span>সম্পাদনা (রোস্টার)</span>
                    </button>
                  )}
                </div>

                {hasDeletePermission(order) && (
                  <button 
                    onClick={() => handleDeleteOrder(order.id)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg transition-all cursor-pointer"
                    title="আর্কাইভ থেকে মুছে ফেলুন"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderBillMemosGrid = (memosList: OfficeOrder[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memosList.map((order) => (
          <div 
            key={order.id}
            className="group border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 bg-white/30 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between gap-4 shadow-sm text-slate-850 dark:text-slate-100"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-500/20 font-sans">
                  <CheckCircle size={10} className="text-emerald-555" />
                  {order.status === 'Generated & Printed' || order.status === 'Printed' ? 'জেনারেটেড এন্ড প্রিন্টেড' : order.status}
                </span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase font-sans">
                  {order.category === 'BILL_LATE_SITTING' ? 'লেট সিটিং বিল' : order.category === 'BILL_HOLIDAY' ? 'সরকারি ছুটি বিল' : 'রাত্রীকালীন বিল'}
                </span>
              </div>
              
              <div className="space-y-1.5 text-left">
                <h4 className="text-xs font-extrabold leading-snug font-mono break-all text-slate-800 dark:text-slate-100" title={order.orderRef}>
                  {order.orderRef}
                </h4>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-1 border-t border-slate-100/50 dark:border-slate-800/50 mt-2 font-sans">
                  <div>
                    <span className="text-slate-400 font-medium block">প্রতিনিধি কর্মকর্তা:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{order.employeeName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">তারিখ:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">
                      {toBanglaDigits(new Date(order.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-medium block">শাখা/সেল:</span>
                    <span>{order.cellName || 'আইটি বিভাগ'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setViewingOrder(order)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer font-sans"
                  title="বিল মেমো ভিউ করুন"
                >
                  <Eye size={12} />
                  <span>ভিউ</span>
                </button>

                {hasEditPermission(order) && (
                  <button 
                    onClick={() => handleLoadBillForEditing(order.orderRef)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer font-sans"
                    title="বিলিং এ ফিরে এডিট করুন (স্মারক একই থাকবে)"
                  >
                    <FileSignature size={12} />
                    <span>সম্পাদনা (বিলিং)</span>
                  </button>
                )}
              </div>

              {hasDeletePermission(order) && (
                <button 
                  onClick={() => handleDeleteOrder(order.id)}
                  className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg transition-all cursor-pointer"
                  title="আর্কাইভ থেকে মুছে ফেলুন"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const { transportRate, apyaonRate } = getPrintCategoryRates();

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
              <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">বিল পিডিএফ জেনারেটর</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">কর্মকর্তাদের ক্যাটাগরি ভিত্তিক ভাতার নিখুঁত হিসাব ও জনতা ব্যাংক পিএলসি. এর লিগ্যাল সাইজ বিল মেমো প্রস্তুতকরণ প্যানেল।</p>
            </div>
            
            <button
              onClick={() => setIsPrintMode(true)}
              disabled={selectedCategory === 'all' || duties.length === 0 || showOrderWarning}
              title={selectedCategory === 'all' ? 'বিল প্রিন্ট করার জন্য একটি নির্দিষ্ট ক্যাটাগরি নির্বাচন করুন' : ''}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
                selectedCategory !== 'all' && duties.length > 0 && !showOrderWarning 
                  ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white hover:opacity-95 cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <Printer size={16} />
              {selectedCategory === 'all' 
                ? 'প্রিন্ট করতে ক্যাটাগরি সিলেক্ট করুন' 
                : 'বিল মেমো (Legal Size) দেখুন ও প্রিন্ট করুন'
              }
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
                  .filter(c => currentUser?.role === 'ADMIN' || currentUser?.cells?.some((uc: Cell) => uc.id === c.id))
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
                  <span>{selectedMonth ? getBanglaMonthYearLabel(selectedMonth) : 'মাস নির্বাচন করুন'}</span>
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
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all relative ${
                activeTab === 'ledger'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              বিলিং খতিয়ান (Billing Ledger)
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all relative ${
                activeTab === 'orders'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              অফিস আদেশ আর্কাইভ (Office Orders)
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all relative ${
                activeTab === 'bills'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              বিল মেমো আর্কাইভ (Bill Memos)
            </button>
          </div>

          {activeTab === 'ledger' && (
            <>
              {showOrderWarning && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 font-sans font-medium text-sm animate-fade-in mb-6">
                  <AlertCircle size={18} className="text-rose-600 shrink-0" />
                  <p>নির্বাচিত মাস ও সেলের জন্য কোনো &quot;জেনারেটেড এন্ড প্রিন্টেড&quot; অফিস আদেশ পাওয়া যায়নি। আগে অফিস আদেশ জেনারেট করুন, তারপর বিল প্রস্তুত করতে পারবেন।</p>
                </div>
              )}

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
                        <p className="app-metadata-text font-medium text-slate-500 uppercase tracking-wider">লেট সিটিং বিল (Snacks + Travel)</p>
                        <h3 className="app-kpi-value text-slate-800 dark:text-slate-100 font-sans">৳{metrics.totalLateSittingBill.toLocaleString('bn-BD')}</h3>
                      </div>
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Clock size={16} />
                      </div>
                    </div>
                    <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-4 space-y-0.5">
                      <p>• নাস্তা বরাদ্দ (৳১০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalLateAllowance1.toLocaleString('bn-BD')}</span></p>
                      <p>• যাতায়াত বরাদ্দ (৳২০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalLateAllowance2.toLocaleString('bn-BD')}</span></p>
                    </div>
                  </div>

                  {/* Metric 2: Holiday Duty Allowance splits */}
                  <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="app-metadata-text font-medium text-slate-500 uppercase tracking-wider">হলিডে ডিউটি বিল (Lunch + Travel)</p>
                        <h3 className="app-kpi-value text-slate-800 dark:text-slate-100 font-sans">৳{metrics.totalHolidayBill.toLocaleString('bn-BD')}</h3>
                      </div>
                      <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg">
                        <Award size={16} />
                      </div>
                    </div>
                    <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-4 space-y-0.5">
                      <p>• দুপুরের খাবার (৳২৫০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalHolidayAllowance1.toLocaleString('bn-BD')}</span></p>
                      <p>• যাতায়াত বরাদ্দ (৳২৫০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalHolidayAllowance2.toLocaleString('bn-BD')}</span></p>
                    </div>
                  </div>

                  {/* Metric 3: Night Shift Allowance splits */}
                  <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <p className="app-metadata-text font-medium text-slate-500 uppercase tracking-wider">নাইট শিফট বিল (Dinner + Travel)</p>
                        <h3 className="app-kpi-value text-slate-800 dark:text-slate-100 font-sans">৳{metrics.totalNightBill.toLocaleString('bn-BD')}</h3>
                      </div>
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <ShieldCheck size={16} />
                      </div>
                    </div>
                    <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-4 space-y-0.5">
                      <p>• রাতের খাবার (৳৬০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalNightAllowance1.toLocaleString('bn-BD')}</span></p>
                      <p>• যাতায়াত বরাদ্দ (৳৪০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalNightAllowance2.toLocaleString('bn-BD')}</span></p>
                    </div>
                  </div>

                  {/* Metric 4: Grand Total */}
                  <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between bg-gradient-to-tr from-indigo-950/30 to-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="app-metadata-text font-medium text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">সর্বমোট প্রদেয় বিল (Grand Total)</p>
                        <h3 className="app-kpi-value text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400 font-sans">৳{metrics.grandTotal.toLocaleString('bn-BD')}</h3>
                      </div>
                      <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm">
                        <DollarSign size={16} />
                      </div>
                    </div>
                    <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-4 space-y-0.5">
                      <p>• সর্বমোট আপ্যায়ন ব্যয়: <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{(metrics.totalLateAllowance1 + metrics.totalHolidayAllowance1 + metrics.totalNightAllowance1).toLocaleString('bn-BD')}</span></p>
                      <p>• সর্বমোট যাতায়াত ব্যয়: <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{(metrics.totalLateAllowance2 + metrics.totalHolidayAllowance2 + metrics.totalNightAllowance2).toLocaleString('bn-BD')}</span></p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aggregated Officers Ledger Table Grouped By Cell */}
              <div className="glass-card p-6 rounded-2xl space-y-4 border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">আপ্যায়ন বিলিং খতিয়ান (Monthly Billing Ledger)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">セル ভিত্তিক কর্মকর্তাদের মাসিক মোট ডিউটির পরিমাণ ও খাত ভিত্তিক অর্থ প্রাপ্তির তালিকা।</p>
                </div>

                {loading ? (
                  <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                ) : Object.keys(groupedSummaries).length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <table className="w-full text-left text-xs leading-normal">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="px-5 py-3.5">কর্মকর্তার নাম ও পদবী</th>
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
                              <td colSpan={5} className="px-5 py-3 text-indigo-700 dark:text-indigo-400 font-sans tracking-wide text-xs">
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
                                <td className="px-5 py-4 text-right font-bold text-slate-800 dark:text-slate-200 font-sans">
                                  ৳{summary.grandTotal.toLocaleString('bn-BD')}/-
                                </td>
                              </tr>
                            ))}

                            {/* Subtotal Row for this Cell */}
                            <tr className="bg-slate-50/50 dark:bg-slate-950/10 font-bold border-t border-slate-100 dark:border-slate-800/80">
                              <td className="px-5 py-3 text-slate-500">উপ-মোট ({cellName})</td>
                              <td className="px-5 py-3 text-center text-slate-700 dark:text-slate-350 font-sans">{cellTotals.lateDays} দিন</td>
                              <td className="px-5 py-3 text-center text-slate-700 dark:text-slate-350 font-sans">{cellTotals.holidayDays} দিন</td>
                              <td className="px-5 py-3 text-center text-slate-700 dark:text-slate-350 font-sans">{cellTotals.nightDays} দিন</td>
                              <td className="px-5 py-3 text-right text-indigo-600 dark:text-indigo-400 font-bold font-sans">৳{cellTotals.total.toLocaleString('bn-BD')}/-</td>
                            </tr>
                          </tbody>
                        );
                      })}
                    </table>
                  </div>
                ) : (
                  <div className="p-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 dark:text-slate-500 italic">
                    নির্ধারিত মাস ও ফিল্টারের অধীনে কোনো বিলিং ডাটা পাওয়া যায়নি।
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 size={36} className="text-indigo-500 animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">আর্কাইভ লোড হচ্ছে...</p>
                </div>
              ) : pendingBillingOfficeOrders.length === 0 && billedOfficeOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <AlertCircle size={28} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">কোন সূত্র সংরক্ষিত নেই</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                      নির্বাচিত ফিল্টারের অধীনে কোনো অফিস আদেশ পাওয়া যায়নি।
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Section 1: Pending Billing */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-2 border-b border-amber-200/30 pb-2 font-sans">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      বিল প্রস্তুত করা হয়নি এমন অফিস আদেশ (Pending Billing) - {pendingBillingOfficeOrders.length} টি
                    </h3>
                    {pendingBillingOfficeOrders.length > 0 ? (
                      renderOrdersGrid(pendingBillingOfficeOrders)
                    ) : (
                      <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 dark:text-slate-500 italic text-xs font-sans">
                        কোনো বিল অপেক্ষমাণ অফিস আদেশ নেই।
                      </div>
                    )}
                  </div>

                  {/* Section 2: Already Billed */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-2 border-b border-teal-200/30 pb-2 font-sans">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                      ইতিমধ্যেই বিল প্রস্তুত সম্পন্ন হয়েছে (Already Billed) - {billedOfficeOrders.length} টি
                    </h3>
                    {billedOfficeOrders.length > 0 ? (
                      renderOrdersGrid(billedOfficeOrders)
                    ) : (
                      <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 dark:text-slate-500 italic text-xs font-sans">
                        কোনো বিল প্রস্তুতকৃত অফিস আদেশ নেই।
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bills' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 size={36} className="text-indigo-500 animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">আর্কাইভ লোড হচ্ছে...</p>
                </div>
              ) : filteredBillMemos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <AlertCircle size={28} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">কোন বিল মেমো সংরক্ষিত নেই</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                      নির্বাচিত ফিল্টারের অধীনে কোনো বিল মেমো পাওয়া যায়নি।
                    </p>
                  </div>
                </div>
              ) : (
                renderBillMemosGrid(filteredBillMemos)
              )}
            </div>
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
                size: legal !important;
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
              .print-legal-layout {
                width: 8.5in !important;
                height: 14.0in !important;
                padding-top: 0.6in !important;
                padding-bottom: 0.75in !important;
                padding-left: 1.3in !important;
                padding-right: 0.5in !important;
                border: none !important;
                box-shadow: none !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
                page-break-before: avoid !important;
                overflow: hidden !important;
              }
            }
          `}} />

          {/* Back Controls (No-print) */}
          <div className="no-print flex flex-col gap-4 glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToLedger}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ChevronLeft size={16} />
                ফিরে যান (লেজার ভিউ)
              </button>

              <div className="flex gap-3">
                {!billGenerated ? (
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
                        const getNormalizedRef = (ref: string) => {
                          if (!ref) return '';
                          let clean = ref;
                          if (clean.endsWith('/বিল')) {
                            clean = clean.slice(0, -5);
                          }
                          const parts = clean.split('/');
                          if (parts.length >= 3) {
                            parts.splice(2, 1); // remove name component
                          }
                          return parts.join('/');
                        };
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
                          <option key={ref} value={ref}>{ref} (বিল সম্পন্ন)</option>
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

          {/* Interactive Print Mock Sheet */}
          <div className="flex justify-center p-4 bg-slate-100/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-x-auto shadow-inner">
            <div className="print-legal-layout w-[8.5in] h-[14.0in] bg-white border border-slate-200 text-black shadow-xl flex flex-col justify-between overflow-hidden relative" style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: 'Kalpurush, "Noto Sans Bengali", sans-serif', paddingTop: '0.6in', paddingBottom: '0.75in', paddingLeft: '1.3in', paddingRight: '0.5in', boxSizing: 'border-box', fontSize: '10px', lineHeight: '1.0' }}>
              
              <div className="flex flex-col h-full justify-between">
                <div>
                  {/* Official Header */}
                  <div className="w-full flex justify-end text-right mb-4">
                    <div className="text-right leading-none">
                      <h2 className="text-[16px] font-bold text-black uppercase" style={{ fontFamily: 'Kalpurush', fontSize: '16px', lineHeight: '1.0' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h2>
                      <p className="text-[10px] font-bold text-black mt-1.5" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>তারিখ: {getBanglaDate(billDate)} ইং</p>
                    </div>
                  </div>

                  {/* Title and Main Body */}
                  <div className="flex-1 flex flex-col justify-between mt-2">
                    <div>
                      <h2 className="text-left text-[10px] font-bold underline decoration-black underline-offset-2 leading-none" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                        বিষয়: {subjectText}
                      </h2>
                      
                      <div className="mt-2.5">
                        <p className="text-justify leading-normal text-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6' }}>
                          {openingParagraph}
                        </p>
                      </div>

                      {/* Redesigned Printed Legal Billing Table */}
                      {printFilteredSummaries.length > 0 ? (
                        <table className="w-full border-collapse border border-black text-center mt-3 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                          <thead>
                            <tr className="bg-slate-50 font-bold border-b border-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              <th className="border border-black p-1.5 w-[8%] text-center">ক্রমিক</th>
                              <th className="border border-black p-1.5 text-left pl-3 w-[28%]">নাম ও পদবী</th>
                              <th className="border border-black p-1.5 text-center w-[25%]">তারিখ</th>
                              <th className="border border-black p-1.5 text-center w-[15%]">যাতায়াত</th>
                              <th className="border border-black p-1.5 text-center w-[15%]">আপ্যায়ন</th>
                              <th className="border border-black p-1.5 text-center w-[9%]">মোট</th>
                            </tr>
                          </thead>
                          <tbody>
                            {printFilteredSummaries.map((summary, index) => {
                              const days = printCategory === 'LATE_SITTING' ? summary.lateDays : printCategory === 'HOLIDAY' ? summary.holidayDays : summary.nightDays;
                              const empTransport = days * transportRate;
                              const empApyaon = days * apyaonRate;
                              const empTotal = empTransport + empApyaon;
                              
                              return (
                                <tr key={summary.employeeId} className="text-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                  <td className="border border-black p-1.5 text-center" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>{toBanglaDigits(index + 1)}</td>
                                  <td className="border border-black p-1.5 text-left pl-3 font-normal" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                    <p className="font-normal">{summary.name}</p>
                                    <p className="text-[9px] text-slate-800 font-normal mt-0.5">{summary.designation}</p>
                                  </td>
                                  <td className="border border-black p-1.5 text-center leading-snug" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                    <p>{formatWorkedDatesForCategory(summary.employeeId)}</p>
                                    <p className="text-[9px] text-slate-700 mt-1 font-semibold">মোট: {toBanglaDigits(days)} দিন</p>
                                  </td>
                                  <td className="border border-black p-1.5 text-center" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                    ({toBanglaDigits(transportRate)}x{toBanglaDigits(days)}) = {toBanglaDigits(empTransport)}/-
                                  </td>
                                  <td className="border border-black p-1.5 text-center" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                    ({toBanglaDigits(apyaonRate)}x{toBanglaDigits(days)}) = {toBanglaDigits(empApyaon)}/-
                                  </td>
                                  <td className="border border-black p-1.5 font-extrabold text-center" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                    {toBanglaDigits(empTotal)}/-
                                  </td>
                                </tr>
                              );
                            })}
                            
                            <tr className="font-bold bg-slate-50/50 text-[10px] border-t-2 border-black" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              <td className="border border-black p-1.5 text-right pr-3" colSpan={3} style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                <p>মোট দিন = {toBanglaDigits(totalDaysAll)} দিন</p>
                                <p className="mt-1">মোট টাকা = ({getBanglaNumberWords(grandTotalPrintAll).replace(' টাকা মাত্র', ' টাকা')})</p>
                              </td>
                              <td className="border border-black p-1.5 text-center" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                ({toBanglaDigits(transportRate)}x{toBanglaDigits(totalDaysAll)}) = {toBanglaDigits(totalTransportAll)}/-
                              </td>
                              <td className="border border-black p-1.5 text-center" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                ({toBanglaDigits(apyaonRate)}x{toBanglaDigits(totalDaysAll)}) = {toBanglaDigits(totalApyaonAll)}/-
                              </td>
                              <td className="border border-black p-1.5 font-extrabold text-center" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                {toBanglaDigits(grandTotalPrintAll)}/-
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      ) : null}

                      {/* Paragraphs */}
                      <div className="text-left pt-3 mt-3 space-y-2.5" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6' }}>
                        <p className="text-justify leading-normal text-black" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6' }}>
                          ০২। আলোচ্য বিলটি সঠিক এবং পূর্বে পরিশোধ করা হয়নি।
                        </p>
                        <p className="text-justify leading-normal text-black" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6' }}>
                          ০৩। ২০১৭ সালের আর্থিক ক্ষমতা অর্পন এর পৃষ্ঠা ১৫ এর অনুচ্ছেদ-২৬.০২ মোতাবেক যাতায়াত খাত (কোড-১৩৫৫১২০৫০০০০০০৩) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(totalTransportAll)}/- ({getBanglaNumberWords(totalTransportAll).replace(' টাকা মাত্র', ' টাকা')})</strong> এবং পৃষ্ঠা ১৪ এর অনুচ্ছেদ-২২.০২ মোতাবেক আপ্যায়ন খাত (কোড-১৩৫৫১২০১০০০০০০২) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(totalApyaonAll)}/- ({getBanglaNumberWords(totalApyaonAll).replace(' টাকা মাত্র', ' টাকা')})</strong> অনুমোদন ক্ষমতা উপ-মহাব্যবস্থাপক মহোদয়ের এখতিয়ারাধীন।
                        </p>
                        <p className="text-justify leading-normal text-black" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6' }}>
                          ০৪। এমতাবস্থায়, বর্ণিত খরচ অনুমোদনপূর্বক যাতায়াত ও আপ্যায়ন খাত (প্রযোজ্য ক্ষেত্রে) বিকলন করতঃ মোট = <strong>{toBanglaDigits(grandTotalPrintAll)}/- ({getBanglaNumberWords(grandTotalPrintAll).replace(' টাকা মাত্র', ' টাকা')})</strong> <strong>{representativeName || 'জনাব আব্দুল্লাহ আল জোবায়ের'}, {representativeDesignation || 'এসও-আইটি'}</strong> এর নামে প্রদানের নিমিত্ত নিরীক্ষার অনুরোধ জানিয়ে বাজেট এন্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট বরাবর এবং নিরীক্ষান্তে নথি একাউন্টস ডিপার্টমেন্ট বরাবর প্রেরণ করা যেতে পারে।
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right-aligned payee signature block */}
                  <div className="w-full flex justify-end text-right" style={{ marginTop: '0.6in', marginBottom: '0.2in' }}>
                    <div className="text-right leading-none" style={{ fontFamily: 'Kalpurush', fontSize: '10px', paddingRight: '0.1in' }}>
                      <p className="font-extrabold text-[10px]">({representativeName || 'জনাব আব্দুল্লাহ আল জোবায়ের'})</p>
                      <p className="text-[10px] font-bold text-slate-800 mt-1">{representativeDesignation || 'এসও-আইটি'}</p>
                    </div>
                  </div>

                  {/* Left-aligned Routing List with nice gaps, underlines and font size 10, NOT bold */}
                  <div className="w-full text-left mt-6 pl-1 no-break-inside" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                    <div style={{ marginBottom: '0.85in' }}>
                      <p className="inline-block border-b border-black pb-0.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                        এসপিও, অনলাইন ব্যাংকিং ডিপার্টমেন্ট সমীপেঃ
                      </p>
                    </div>
                    <div style={{ marginBottom: '0.85in' }}>
                      <p className="inline-block border-b border-black pb-0.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                        এজিএম, অনলাইন ব্যাংকিং ডিপার্টমেন্ট সমীপেঃ
                      </p>
                    </div>
                    <div style={{ marginBottom: '0.85in' }}>
                      <p className="inline-block border-b border-black pb-0.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                        উপ-মহাব্যবস্থাপক, অনলাইন ব্যাংকিং ডিপার্টমেন্ট সমীপেঃ
                      </p>
                    </div>
                    <div style={{ marginBottom: '0.85in' }}>
                      <p className="inline-block border-b border-black pb-0.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                        উপ-মহাব্যবস্থাপক, বাজেট অ্যান্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট সমীপেঃ
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
      {viewingOrder && (() => {
        const isBill = viewingOrder.category?.startsWith('BILL_');
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              
              {/* Modal Header Controls */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <FileText className="text-indigo-500" size={20} />
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm font-sans">
                    {isBill ? 'আপ্যায়ন বিল বিবরণী প্রাক-প্রদর্শন (Legal Size)' : 'অফিস নির্দেশ প্রাক-প্রদর্শন (A4 Size)'}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const printContent = document.getElementById('printable-order-sheet');
                      if (!printContent) return;
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>${isBill ? 'আপ্যায়ন বিল বিবরণী' : 'অফিস নির্দেশ'} - প্রিন্ট</title>
                              <style>
                                body {
                                  margin: 0;
                                  padding: 0;
                                  font-family: 'Kalpurush', 'Noto Sans Bengali', sans-serif;
                                  font-size: 10px;
                                  color: #000;
                                  background-color: #fff;
                                  line-height: 1.6;
                                }
                                @page {
                                  size: ${isBill ? 'legal portrait' : 'A4'};
                                  margin: 0;
                                }
                                #printable-order-sheet {
                                  width: ${isBill ? '8.5in' : '210mm'} !important;
                                  height: ${isBill ? '14.0in' : '297mm'} !important;
                                  padding-top: ${isBill ? '0.6in' : '1.0in'} !important;
                                  padding-bottom: ${isBill ? '0.75in' : '1.0in'} !important;
                                  padding-left: ${isBill ? '1.3in' : '1.0in'} !important;
                                  padding-right: ${isBill ? '0.5in' : '1.0in'} !important;
                                  box-sizing: border-box !important;
                                  display: flex !important;
                                  flex-direction: column !important;
                                  justify-content: space-between !important;
                                  font-family: 'Kalpurush', 'Noto Sans Bengali', sans-serif !important;
                                  font-size: 10px !important;
                                  color: #000 !important;
                                  background-color: #fff !important;
                                  line-height: 1.6 !important;
                                }
                                .w-full { width: 100%; }
                                .flex { display: flex; }
                                .justify-between { justify-content: space-between; }
                                .items-start { align-items: flex-start; }
                                .border-b-2 { border-bottom: 2px solid #0b5e9e; }
                                .border-b { border-bottom: 1px solid #e2e8f0; }
                                .border-t { border-top: 1px solid #e2e8f0; }
                                .pb-2 { padding-bottom: 8px; }
                                .pt-1 { padding-top: 4px; }
                                .pb-1 { padding-bottom: 4px; }
                                .pt-2 { padding-top: 8px; }
                                .pt-4 { padding-top: 16px; }
                                .text-left { text-align: left; }
                                .text-right { text-align: right; }
                                .font-bold { font-weight: bold; }
                                .font-extrabold { font-weight: 800; }
                                .text-center { text-align: center; }
                                .text-xs { font-size: 10px; }
                                .text-sm { font-size: 10px; }
                                .text-base { font-size: 18px; }
                                .leading-tight { line-height: 1.15; }
                                .leading-relaxed { line-height: 1.6; }
                                .leading-normal { line-height: 1.6; }
                                .leading-none { line-height: 1.0; }
                                .leading-snug { line-height: 1.375; }
                                .uppercase { text-transform: uppercase; }
                                .tracking-wider { letter-spacing: 0.05em; }
                                .mt-0.5 { margin-top: 2px; }
                                .mt-1 { margin-top: 4px; }
                                .mt-2 { margin-top: 8px; }
                                .mt-2.5 { margin-top: 10px; }
                                .mt-4 { margin-top: 16px; }
                                .mt-6 { margin-top: 24px; }
                                .mt-8 { margin-top: 32px; }
                                .mt-12 { margin-top: 48px; }
                                .mb-1.5 { margin-bottom: 6px; }
                                .mb-4 { margin-bottom: 16px; }
                                .pl-2 { padding-left: 8px; }
                                .pl-5 { padding-left: 20px; }
                                .shrink-0 { flex-shrink: 0; }
                                .gap-2 { gap: 8px; }
                                .gap-3 { gap: 12px; }
                                .gap-4 { gap: 16px; }
                                .font-serif { font-family: Georgia, Cambria, "Times New Roman", Times, serif; }
                                .underline { text-decoration: underline; }
                                .decoration-black { text-decoration-color: #000000; }
                                .underline-offset-2 { text-underline-offset: 2px; }
                                .text-justify { text-align: justify; }
                                .text-indent-8 { text-indent: 0.5in; }
                                .text-slate-950 { color: #000000; }
                                .font-normal { font-weight: 400; }
                                .w-\\[8\\%\\] { width: 8%; }
                                .w-\\[28\\%\\] { width: 28%; }
                                .w-\\[12\\%\\] { width: 12%; }
                                .w-\\[27\\%\\] { width: 27%; }
                                .w-\\[25\\%\\] { width: 25%; }
                                .w-\\[50\\%\\] { width: 50%; }
                                .list-decimal { list-style-type: decimal; }
                                .space-y-4 > * + * { margin-top: 16px; }
                                .space-y-2.5 > * + * { margin-top: 10px; }
                                .space-y-1 > * + * { margin-top: 4px; }
                                .space-y-0.5 > * + * { margin-top: 2px; }
                                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                                th, td { border: 1px solid #000; padding: 4px; font-size: 10px; line-height: 1.4; }
                                th { font-weight: bold; background-color: #f8fafc; }
                                ${!isBill ? `
                                  #printable-order-sheet .bank-title { font-size: 20pt !important; font-weight: bold !important; color: #0b5e9e !important; }
                                  #printable-order-sheet .dept-title { font-size: 15pt !important; font-weight: bold !important; color: #000000 !important; }
                                  #printable-order-sheet .memo-line, #printable-order-sheet .memo-line * { font-size: 11pt !important; font-weight: bold !important; }
                                  #printable-order-sheet .office-order-title { font-size: 16pt !important; font-weight: bold !important; text-decoration: underline !important; }
                                  #printable-order-sheet .body-paragraph, #printable-order-sheet .body-paragraph * { font-size: 12pt !important; line-height: 1.6 !important; }
                                  #printable-order-sheet table th { font-size: 12pt !important; font-weight: bold !important; }
                                  #printable-order-sheet table td, #printable-order-sheet table td p, #printable-order-sheet table td span { font-size: 11pt !important; }
                                  #printable-order-sheet .signature-name { font-size: 12pt !important; font-weight: bold !important; }
                                  #printable-order-sheet .signature-designation { font-size: 11pt !important; }
                                  #printable-order-sheet .footer-copy, #printable-order-sheet .footer-copy * { font-size: 10pt !important; }
                                ` : ''}
                              </style>
                            </head>
                            <body>
                              ${printContent.outerHTML}
                              <script>
                                window.onload = function() {
                                  window.print();
                                  window.close();
                                }
                              </script>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer font-sans"
                  >
                    <Printer size={13} />
                    <span>প্রিন্ট করুন</span>
                  </button>
                  <button
                    onClick={() => setViewingOrder(null)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable Printable Wrapper */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 dark:bg-slate-950/20 flex justify-center">
                
                {isBill ? (
                  /* simulated Legal-sized Bill Memo sheet */
                  <div 
                    id="printable-order-sheet"
                    className="w-[215.9mm] min-h-[355.6mm] bg-white border border-slate-200 text-black shadow-lg flex flex-col justify-between relative text-left font-serif leading-none text-[10px]"
                    style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: 'Kalpurush, "Noto Sans Bengali", sans-serif', boxSizing: 'border-box', paddingTop: '0.6in', paddingBottom: '0.75in', paddingLeft: '1.3in', paddingRight: '0.5in' }}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        {/* Official Header */}
                        <div className="w-full flex justify-end text-right mb-4">
                          <div className="text-right leading-none">
                            <h2 className="text-[16px] font-bold text-black uppercase" style={{ fontFamily: 'Kalpurush', fontSize: '16px', lineHeight: '1.0' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h2>
                            <p className="text-[10px] font-bold text-black mt-1.5" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>তারিখ: \${toBanglaDigits(new Date(viewingOrder.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং</p>
                          </div>
                        </div>

                        {/* Title and Main Body */}
                        <div className="flex-1 flex flex-col justify-between mt-2">
                          <div>
                            <h2 className="text-left text-[10px] font-bold underline decoration-black underline-offset-2 leading-none" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              বিষয়: \${viewingOrder.content?.subjectText || 'যাতায়াত ও আপ্যায়ন ভাতা প্রদান প্রসঙ্গে।'}
                            </h2>
                            
                            <div className="mt-2.5">
                              <p className="text-justify leading-normal text-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6', textIndent: '0.5in', textAlign: 'justify' }}>
                                \${viewingOrder.content?.openingParagraph}
                              </p>
                            </div>

                            {/* Table */}
                            {viewingOrder.duties && viewingOrder.duties.length > 0 ? (() => {
                              const cat = viewingOrder.category || '';
                              const isHoliday = cat.includes('HOLIDAY');
                              const isNight = cat.includes('NIGHT_SHIFT');
                              const apyaonRate = isHoliday ? 250 : isNight ? 600 : 100;
                              const transportRate = cat.includes('LATE_SITTING') ? 150 : 0;
                              return (
                                <table className="w-full border-collapse border border-black text-center mt-3 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0', borderCollapse: 'collapse', border: '1px solid #000' }}>
                                  <thead>
                                    <tr className="bg-slate-50 font-bold border-b border-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                      <th className="border border-black p-1.5 w-[8%] text-center" style={{ border: '1px solid #000', padding: '6px' }}>ক্রমিক</th>
                                      <th className="border border-black p-1.5 text-left pl-3 w-[28%]" style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', paddingLeft: '12px' }}>নাম ও পদবী</th>
                                      <th className="border border-black p-1.5 text-center w-[25%]" style={{ border: '1px solid #000', padding: '6px' }}>তারিখ</th>
                                      <th className="border border-black p-1.5 text-center w-[15%]" style={{ border: '1px solid #000', padding: '6px' }}>যাতায়াত</th>
                                      <th className="border border-black p-1.5 text-center w-[15%]" style={{ border: '1px solid #000', padding: '6px' }}>আপ্যায়ন</th>
                                      <th className="border border-black p-1.5 text-center w-[9%]" style={{ border: '1px solid #000', padding: '6px' }}>মোট</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {viewingOrder.duties.map((s: OrderDuty, idx: number) => (
                                      <tr key={idx} className="text-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                        <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '6px' }}>\${toBanglaDigits(idx + 1)}</td>
                                        <td className="border border-black p-1.5 text-left pl-3 font-normal" style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', paddingLeft: '12px' }}>
                                          <p className="font-normal">\${s.employeeName}</p>
                                          <p className="text-[9px] text-slate-800 font-normal mt-0.5">\${s.designation}</p>
                                        </td>
                                        <td className="border border-black p-1.5 text-center leading-snug font-normal" style={{ border: '1px solid #000', padding: '6px' }}>
                                          <p className="break-words max-w-[200px] leading-snug">\${s.datesFormatted || s.dates || ''}</p>
                                          <p className="text-[9px] text-slate-700 mt-1 font-semibold">মোট: \${toBanglaDigits(s.days)} দিন</p>
                                        </td>
                                        <td className="border border-black p-1.5 text-center font-normal" style={{ border: '1px solid #000', padding: '6px' }}>
                                          (\${toBanglaDigits(transportRate)}x\${toBanglaDigits(s.days)}) = \${toBanglaDigits(s.totalTransport)}/-
                                        </td>
                                        <td className="border border-black p-1.5 text-center font-normal" style={{ border: '1px solid #000', padding: '6px' }}>
                                          (\${toBanglaDigits(apyaonRate)}x\${toBanglaDigits(s.days)}) = \${toBanglaDigits(s.totalApyaon)}/-
                                        </td>
                                        <td className="border border-black p-1.5 font-extrabold text-center" style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>
                                          \${toBanglaDigits(s.grandTotal)}/-
                                        </td>
                                      </tr>
                                    ))}
                                    <tr className="font-bold bg-slate-50/50 text-[10px]" style={{ border: '1px solid #000', fontWeight: 'bold' }}>
                                      <td colSpan={2} className="border border-black p-1.5 text-right pr-3" style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', paddingRight: '12px' }}>সর্বমোট:</td>
                                      <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '6px' }}>\${toBanglaDigits(viewingOrder.content?.totalDays)} দিন</td>
                                      <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '6px' }}>৳\${toBanglaDigits(viewingOrder.content?.totalTransport)}/-</td>
                                      <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '6px' }}>৳\${toBanglaDigits(viewingOrder.content?.totalApyaon)}/-</td>
                                      <td className="border border-black p-1.5 text-center font-extrabold" style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>৳\${toBanglaDigits(viewingOrder.content?.grandTotal)}/-</td>
                                    </tr>
                                  </tbody>
                                </table>
                              );
                            })() : null}

                            {/* Words and paragraphs */}
                            <div className="text-left pt-3 mt-3 space-y-2.5" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6' }}>
                              <p className="font-bold text-black">কথায়: \${viewingOrder.content?.grandTotalInWords || ''} মাত্র।</p>
                              <p className="text-justify leading-normal text-black" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6', textAlign: 'justify' }}>
                                ০২। আলোচ্য বিলটি সঠিক এবং পূর্বে পরিশোধ করা হয়নি।
                              </p>
                              <p className="text-justify leading-normal text-black" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6', textAlign: 'justify' }}>
                                ০৩। ২০১৭ সালের আর্থিক ক্ষমতা অর্পন এর পৃষ্ঠা ১৫ এর অনুচ্ছেদ-২৬.০২ মোতাবেক যাতায়াত খাত (কোড-১৩৫৫১২০৫০০০০০০৩) অনুযায়ী প্রকৃত খরচ = <strong>\${toBanglaDigits(viewingOrder.content?.totalTransport)}/- (\${getBanglaNumberWords(viewingOrder.content?.totalTransport || 0).replace(' টাকা মাত্র', ' টাকা')})</strong> এবং পৃষ্ঠা ১৪ এর অনুচ্ছেদ-২২.০২ মোতাবেক আপ্যায়ন খাত (কোড-১৩৫৫১২০১০০০০০০২) অনুযায়ী প্রকৃত খরচ = <strong>\${toBanglaDigits(viewingOrder.content?.totalApyaon)}/- (\${getBanglaNumberWords(viewingOrder.content?.totalApyaon || 0).replace(' টাকা মাত্র', ' টাকা')})</strong> অনুমোদন ক্ষমতা উপ-মহাব্যবস্থাপক মহোদয়ের এখতিয়ারাধীন।
                              </p>
                              <p className="text-justify leading-normal text-black" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6', textAlign: 'justify' }}>
                                ০৪। এমতাবস্থায়, বর্ণিত খরচ অনুমোদনপূর্বক যাতায়াত ও আপ্যায়ন খাত (প্রযোজ্য ক্ষেত্রে) বিকলন করতঃ মোট = <strong>\${toBanglaDigits(viewingOrder.content?.grandTotal)}/- (\${getBanglaNumberWords(viewingOrder.content?.grandTotal || 0).replace(' টাকা মাত্র', ' টাকা')})</strong> <strong>\${viewingOrder.employeeName}, \${viewingOrder.content?.representativeDesignation || 'এসও-আইটি'}</strong> এর নামে প্রদানের নিমিত্ত নিরীক্ষার অনুরোধ জানিয়ে বাজেট এন্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট বরাবর এবং নিরীক্ষান্তে নথি একাউন্টস ডিপার্টমেন্ট বরাবর প্রেরণ করা যেতে পারে।
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right-aligned payee signature block */}
                        <div className="w-full flex justify-end text-right" style={{ marginTop: '0.6in', marginBottom: '0.2in' }}>
                          <div className="text-right leading-none" style={{ fontFamily: 'Kalpurush', fontSize: '10px', paddingRight: '0.1in' }}>
                            <p className="font-extrabold text-[10px]">(\${viewingOrder.employeeName})</p>
                            <p className="text-[10px] font-bold text-slate-800 mt-1">\${viewingOrder.content?.representativeDesignation || 'এসও-আইটি'}</p>
                          </div>
                        </div>

                        {/* Left-aligned Routing List with nice gaps, underlines and font size 10, NOT bold */}
                        <div className="w-full text-left mt-6 pl-1 no-break-inside" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                          <div style={{ marginBottom: '0.85in' }}>
                            <p className="inline-block border-b border-black pb-0.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              এসপিও, অনলাইন ব্যাংকিং ডিপার্টমেন্ট সমীপেঃ
                            </p>
                          </div>
                          <div style={{ marginBottom: '0.85in' }}>
                            <p className="inline-block border-b border-black pb-0.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              এজিএম, অনলাইন ব্যাংকিং ডিপার্টমেন্ট সমীপেঃ
                            </p>
                          </div>
                          <div style={{ marginBottom: '0.85in' }}>
                            <p className="inline-block border-b border-black pb-0.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              উপ-মহাব্যবস্থাপক, অনলাইন ব্যাংকিং ডিপার্টমেন্ট সমীপেঃ
                            </p>
                          </div>
                          <div style={{ marginBottom: '0.85in' }}>
                            <p className="inline-block border-b border-black pb-0.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              উপ-মহাব্যবস্থাপক, বাজেট অ্যান্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট সমীপেঃ
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                ) : (
                  /* simulated A4 office order sheet */
                  <div 
                    id="printable-order-sheet"
                    className="w-[210mm] min-h-[297mm] bg-white border border-slate-200 text-black shadow-lg flex flex-col justify-between relative text-left font-serif leading-relaxed text-[10px]"
                    style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: 'Kalpurush, "Noto Sans Bengali", sans-serif', boxSizing: 'border-box', paddingTop: '1.0in', paddingBottom: '1.0in', paddingLeft: '1.0in', paddingRight: '1.0in' }}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        {/* Header */}
                        <div className="w-full flex justify-between items-start border-b-2 border-[#0b5e9e] pb-2">
                          <Image 
                            src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Janata_Bank_PLC_Logo.svg"
                            alt="Janata Bank Logo" 
                            width={150}
                            height={40}
                            className="h-10 shrink-0" 
                            unoptimized
                          />
                          <div className="text-right leading-tight">
                            <h2 className="text-[18px] font-extrabold text-[#0b5e9e] bank-title" style={{ fontFamily: 'Kalpurush', fontSize: '18px', lineHeight: '1.15' }}>জনতা ব্যাংক পিএলসি.</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 dept-title" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
                            <p className="text-[8px] font-medium text-slate-400 leading-none mt-1" style={{ fontFamily: 'Kalpurush', fontSize: '8px', lineHeight: '1.0' }}>প্রধান কার্যালয়, ঢাকা</p>
                          </div>
                        </div>

                        {/* Title and Memo details */}
                        <div className="w-full flex justify-between items-start mt-4 text-[10px] memo-line" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                          <p className="font-bold">স্মারক নং: \${viewingOrder.orderRef}</p>
                          <p className="font-bold">তারিখ: \${toBanglaDigits(new Date(viewingOrder.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং</p>
                        </div>

                        <div className="text-center font-bold text-sm underline decoration-black underline-offset-4 mt-6 leading-none office-order-title" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                          অফিস নির্দেশ
                        </div>

                        <div className="mt-6">
                          <p className="text-justify leading-relaxed text-black text-[10px] text-indent-8 body-paragraph" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6', textIndent: '0.5in', textAlign: 'justify' }}>
                            \${viewingOrder.content?.openingParagraph || 'অনলাইন ব্যাংকিং ডিপার্টমেন্টের স্বাভাবিক কার্যক্রম পরিচালনার জন্য নিম্নলিখিত কর্মকর্তাদের দায়িত্ব অর্পণ করা হইলঃ'}
                          </p>
                        </div>

                        {/* Table */}
                        {(() => {
                          let dutiesList: DutyListEntry[] = [];
                          try {
                            dutiesList = JSON.parse(viewingOrder.dutiesJson || '[]');
                          } catch (e) {
                            console.error(e);
                          }
                          return dutiesList.length > 0 ? (
                            <table className="w-full border-collapse border border-black text-center mt-4 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0', borderCollapse: 'collapse', border: '1px solid #000' }}>
                              <thead>
                                <tr className="bg-slate-50 font-bold border-b border-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                  <th className="border border-black p-1 w-[8%] text-center" style={{ border: '1px solid #000', padding: '4px' }}>ক্রমিক</th>
                                  <th className="border border-black p-1 text-left pl-2 w-[28%]" style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', paddingLeft: '8px' }}>নাম ও পদবী</th>
                                  <th className="border border-black p-1 text-left pl-2 w-[12%]" style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', paddingLeft: '8px' }}>কার্ড নং</th>
                                  <th className="border border-black p-1 text-center w-[27%]" style={{ border: '1px solid #000', padding: '4px' }}>তারিখ</th>
                                  <th className="border border-black p-1 text-left pl-2 w-[25%]" style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', paddingLeft: '8px' }}>মন্তব্য</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dutiesList.map((d: DutyListEntry, idx: number) => (
                                  <tr key={idx} className="text-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                    <td className="border border-black p-1 text-center" style={{ border: '1px solid #000', padding: '4px' }}>\${toBanglaDigits(idx + 1)}</td>
                                    <td className="border border-black p-1 text-left pl-2 font-normal" style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', paddingLeft: '8px' }}>
                                      <p className="font-normal">\${d.employeeName || d.name}</p>
                                      <p className="text-[9px] text-slate-800 font-normal mt-0.5">\${d.designation}</p>
                                    </td>
                                    <td className="border border-black p-1 text-left pl-2 font-normal" style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', paddingLeft: '8px' }}>
                                      <p className="font-sans font-normal">\${d.bankId}</p>
                                    </td>
                                    <td className="border border-black p-1 text-center leading-snug font-normal" style={{ border: '1px solid #000', padding: '4px' }}>
                                      <p className="break-words max-w-[200px] leading-snug">
                                        \${d.datesFormatted || d.date || ''}
                                      </p>
                                    </td>
                                    <td className="border border-black p-1 text-left pl-2 font-normal" style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', paddingLeft: '8px' }}>
                                      \${d.description || ''}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : null;
                        })()}

                        {/* Signatures block */}
                        <div className="w-full flex justify-between items-start mt-8 pt-4 leading-normal text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.6' }}>
                          <div className="w-[50%] footer-copy">
                            <p className="underline underline-offset-2">অনুলিপি জ্ঞাতার্থে ও কার্যার্থে প্রেরিত হইলোঃ</p>
                            <ol className="list-decimal pl-5 mt-2 space-y-1">
                              <li>উপ-মহাব্যবস্থাপক মহোদয়ের ব্যক্তিগত নথি, অনলাইন ব্যাংকিং ডিপার্টমেন্ট;</li>
                              <li>সংশ্লিষ্ট কর্মকর্তা; এবং</li>
                              <li>নথি/অফিস কপি।</li>
                            </ol>
                          </div>
                          <div className="w-[50%] text-right pr-2">
                            <p className="font-extrabold signature-name">(\${viewingOrder.content?.signingOfficer || 'জনাব মোহাম্মদ সোহরাব হোসেন'})</p>
                            <p className="text-slate-800 mt-1 signature-designation">\${viewingOrder.content?.signingDesignation || 'উপ-মহাব্যবস্থাপক'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
