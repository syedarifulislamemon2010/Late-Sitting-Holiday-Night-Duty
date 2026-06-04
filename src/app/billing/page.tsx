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

export default function BillingPage() {
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
  const [randomNumber, setRandomNumber] = useState(() => Math.floor(10 + Math.random() * 90));
  const [archivedOrders, setArchivedOrders] = useState<any[]>([]);

  // Sync billRef dynamically
  useEffect(() => {
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
      setBillRef(parts.join('/') + '/বিল');
    } else {
      const catBangla = printCategory === 'LATE_SITTING' ? 'লেট-সিটিং' : printCategory === 'HOLIDAY' ? 'অফ-ডে' : 'নাইট';
      const bnYear = toBanglaDigits('2026');
      const bnRand = toBanglaDigits(randomNumber);
      setBillRef(`৯১০৩/ডেভ/${repName}/${catBangla}/অফিস-নির্দেশ/${bnYear}/${bnRand}/বিল`);
    }
  }, [baseOrderRef, selectedOrderRef, printCategory, representativeName, randomNumber]);

  const [executives, setExecutives] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

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
          const desigPriority: Record<string, number> = {
            'মহাব্যবস্থাপক': 1,
            'উপ-মহাব্যবস্থাপক': 2,
            'সহকারী মহাব্যবস্থাপক': 3
          };
          const sortedExecs = [...execData].sort((a, b) => {
            const prioA = desigPriority[a.designation] || 99;
            const prioB = desigPriority[b.designation] || 99;
            if (prioA !== prioB) return prioA - prioB;
            return a.id - b.id;
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
      }
    }
    loadStaticData();
  }, []);

  // Load archived bill details if edit_ref query param is present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const editRef = params.get('edit_ref');
    if (editRef) {
      const editRefVal: string = editRef;
      async function loadArchivedBill() {
        try {
          const res = await fetch('/api/office-orders');
          if (res.ok) {
            const orders = await res.json();
            const archivedBill = orders.find((o: any) => o.orderRef === editRefVal);
            if (archivedBill) {
              setIsEditingArchive(true);
              setIsPrintMode(true);
              setOriginalBillRef(editRefVal);
              
              if (archivedBill.category && archivedBill.category.startsWith('BILL_')) {
                setPrintCategory(archivedBill.category.slice(5) as any);
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
            }
          }
        } catch (err) {
          console.error('Error loading archived bill for editing:', err);
        }
      }
      loadArchivedBill();
    }
  }, []);

  // Load archived order details if orderRef query param is present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const orderRefParam = params.get('orderRef');
    if (orderRefParam) {
      const targetRef = orderRefParam;
      async function loadTargetOrder() {
        try {
          const res = await fetch('/api/office-orders');
          if (res.ok) {
            const orders = await res.json();
            const matchedOrder = orders.find((o: any) => o.orderRef === targetRef);
            if (matchedOrder) {
              setSelectedOrderRef(targetRef);
              setPrintCategory(matchedOrder.category as any);
              setIsPrintMode(true);
              
              // Extract month from dutiesJson
              let dutiesList: any[] = [];
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
  // Fetch duties based on selected month & filters
  async function fetchDutiesForBilling() {
    try {
      setLoading(true);
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
      const activeList = Array.isArray(data) ? data : [];

      // Fetch all archived office orders and bills
      const ordersRes = await fetch('/api/office-orders');
      const ordersData = await ordersRes.json();
      const archivedOrders = Array.isArray(ordersData) ? ordersData : [];
      setArchivedOrders(archivedOrders);

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
        archivedOrders
          .filter(o => o.category?.startsWith('BILL_') || o.orderRef?.endsWith('/বিল'))
          .map(o => getNormalizedRef(o.orderRef))
      );

      const filteredDuties = activeList.filter(d => {
        if (!d.orderRef) return false; // Must have an office order generated
        if (d.orderRef.endsWith('/বিল')) return false; // Already billed
        const norm = getNormalizedRef(d.orderRef);
        return !archivedBillNormalizedRefs.has(norm); // Must NOT have a bill generated
      });

      // Merge with archived duties if editing
      if (isEditingArchive && baseOrderRef) {
        const archRes = await fetch(`/api/duties?orderRef=${encodeURIComponent(baseOrderRef)}&includeArchived=true`);
        if (archRes.ok) {
          const archData = await archRes.json();
          const archList = Array.isArray(archData) ? archData : [];
          
          const merged = [...archList];
          filteredDuties.forEach(d => {
            if (!merged.some(m => m.id === d.id)) {
              merged.push(d);
            }
          });
          setDuties(merged);
          return;
        }
      }

      // Extract distinct orderRefs for the selected printCategory
      const pendingRefs = Array.from(
        new Set(
          filteredDuties
            .filter(d => d.type === printCategory)
            .map(d => d.orderRef)
            .filter(Boolean)
        )
      ) as string[];
      
      setPendingOrderRefs(pendingRefs);
      if (pendingRefs.length > 0) {
        if (!selectedOrderRef || !pendingRefs.includes(selectedOrderRef)) {
          setSelectedOrderRef(pendingRefs[0]);
        }
      } else {
        setSelectedOrderRef('');
      }

      setDuties(filteredDuties);
    } catch (err) {
      console.error('Error fetching duties for billing:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleBackToLedger = () => {
    setIsPrintMode(false);
    setIsEditingArchive(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/billing');
    }
    fetchDutiesForBilling();
  };

  useEffect(() => {
    fetchDutiesForBilling();
  }, [selectedMonth, selectedCell, isEditingArchive, baseOrderRef, printCategory]);

  // Reactive effect to keep baseOrderRef in sync with printCategory and duties
  useEffect(() => {
    const firstDuty = duties.find(d => d.type === printCategory && d.orderRef);
    setBaseOrderRef(firstDuty ? firstDuty.orderRef || '' : '');
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
    setOpeningParagraph(text);
  }, [printCategory]);

  // Aggregate duties by employee for billing ledger
  const getBillingSummaries = (): EmployeeBillingSummary[] => {
    const map = new Map<number, EmployeeBillingSummary>();
    
    const activeDuties = selectedOrderRef
      ? duties.filter(d => d.orderRef === selectedOrderRef)
      : duties;
      
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
        setRepresentativeName(matchedOrder.employeeName);
        const matchedEmp = employees.find(e => e.name === matchedOrder.employeeName);
        if (matchedEmp) {
          setRepresentativeDesignation(getShortDesignation(matchedEmp.designation));
        } else {
          setRepresentativeDesignation('এসও-আইটি'); // Fallback designation
        }
        return;
      }
    }

    if (printFilteredSummaries.length > 0) {
      setRepresentativeName(printFilteredSummaries[0].name);
      setRepresentativeDesignation(getShortDesignation(printFilteredSummaries[0].designation));
    } else {
      setRepresentativeName('');
      setRepresentativeDesignation('');
    }
  }, [duties, printCategory, selectedOrderRef, archivedOrders, employees]);

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

  const handleGenerateAndPrint = async (isPrintPreview: boolean) => {
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

      const archivePayload = {
        orderRef: billRef,
        originalOrderRef: isEditingArchive ? originalBillRef : undefined,
        orderDate: billDate,
        category: "BILL_" + printCategory,
        employeeName: representativeName,
        cellName: cellName,
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
        dutyIds: duties.filter(d => d.orderRef === selectedOrderRef && d.type === printCategory).map(d => d.id),
        content: {
          openingParagraph: openingParagraph,
          totalDays: totalDaysAll,
          totalApyaon: totalApyaonAll,
          totalTransport: totalTransportAll,
          grandTotal: grandTotalPrintAll,
          grandTotalInWords: getBanglaNumberWords(grandTotalPrintAll),
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          subjectText: subjectText
        }
      };

      const archiveRes = await fetch('/api/office-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(archivePayload),
      });

      if (!archiveRes.ok) {
        throw new Error('Failed to archive bill memo metadata');
      }
      console.log('Bill memo metadata archived successfully!');

      // 2. Generate PDF and save in Documents table
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
        billRef: billRef
      };

      const res = await fetch('/api/documents/generate-bill-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Bill memo archived successfully as PDF:', data);
        setArchiveSuccess('বিল মেমো সফলভাবে জেনারেট এবং ম্যানুয়াল ফাইল আর্কাইভে সংরক্ষণ করা হয়েছে!');
        
        if (isPrintPreview) {
          setTimeout(() => {
            window.print();
            setIsPrintMode(false);
            setIsEditingArchive(false);
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/billing');
            }
            fetchDutiesForBilling();
          }, 300);
        } else {
          if (data.filePath) {
            window.open(data.filePath, '_blank');
          }
          setIsPrintMode(false);
          setIsEditingArchive(false);
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/billing');
          }
          fetchDutiesForBilling();
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to generate/archive bill memo PDF:', errorData);
        setArchiveError('বিল মেমো আর্কাইভ করতে ব্যর্থ হয়েছে।');
        setTimeout(() => setArchiveError(null), 5000);
      }
    } catch (err: any) {
      console.error('Error in handleGenerateAndPrint:', err);
      setArchiveError(err.message || 'সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
      setTimeout(() => setArchiveError(null), 5000);
    } finally {
      setArchiving(false);
    }
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
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-wide">বিল পিডিএফ জেনারেটর</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">কর্মকর্তাদের ক্যাটাগরি ভিত্তিক ভাতার নিখুঁত হিসাব ও জনতা ব্যাংক পিএলসি. এর লিগ্যাল সাইজ বিল মেমো প্রস্তুতকরণ প্যানেল।</p>
            </div>
            
            <button
              onClick={() => setIsPrintMode(true)}
              disabled={duties.length === 0}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${duties.length > 0 ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white hover:opacity-95' : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'}`}
            >
              <Printer size={16} />
              বিল মেমো (Legal Size) দেখুন ও প্রিন্ট করুন
            </button>
          </div>

          {/* Quick Filters Panel */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Calendar size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">বিলিং পিরিয়ড ও ফিল্টারসমূহ</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Select Cell Filter */}
              <select
                value={selectedCell}
                onChange={(e) => setSelectedCell(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
              >
                <option value="all">সকল সেল (All Cells)</option>
                {cells.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
              </select>

              {/* Month Picker */}
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none font-sans"
              />
            </div>
          </div>

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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">লেট সিটিং বিল (Snacks + Travel)</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">৳{metrics.totalLateSittingBill.toLocaleString('bn-BD')}</h3>
                  </div>
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-2 mt-4 space-y-0.5">
                  <p>• নাস্তা বরাদ্দ (৳১০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalLateAllowance1.toLocaleString('bn-BD')}</span></p>
                  <p>• যাতায়াত বরাদ্দ (৳২০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalLateAllowance2.toLocaleString('bn-BD')}</span></p>
                </div>
              </div>

              {/* Metric 2: Holiday Duty Allowance splits */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">হলিডে ডিউটি বিল (Lunch + Travel)</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">৳{metrics.totalHolidayBill.toLocaleString('bn-BD')}</h3>
                  </div>
                  <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg">
                    <Award size={16} />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-2 mt-4 space-y-0.5">
                  <p>• দুপুরের খাবার (৳২৫০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalHolidayAllowance1.toLocaleString('bn-BD')}</span></p>
                  <p>• যাতায়াত বরাদ্দ (৳২৫০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalHolidayAllowance2.toLocaleString('bn-BD')}</span></p>
                </div>
              </div>

              {/* Metric 3: Night Shift Allowance splits */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">নাইট শিফট বিল (Dinner + Travel)</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">৳{metrics.totalNightBill.toLocaleString('bn-BD')}</h3>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-2 mt-4 space-y-0.5">
                  <p>• রাতের খাবার (৳৬০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalNightAllowance1.toLocaleString('bn-BD')}</span></p>
                  <p>• যাতায়াত বরাদ্দ (৳৪০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{metrics.totalNightAllowance2.toLocaleString('bn-BD')}</span></p>
                </div>
              </div>

              {/* Metric 4: Grand Total */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between bg-gradient-to-tr from-indigo-950/30 to-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">সর্বমোট প্রদেয় বিল (Grand Total)</p>
                    <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400 font-sans">৳{metrics.grandTotal.toLocaleString('bn-BD')}</h3>
                  </div>
                  <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm">
                    <DollarSign size={16} />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-2 mt-4 space-y-0.5">
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
              <p className="text-xs text-slate-400 mt-0.5">সেল ভিত্তিক কর্মকর্তাদের মাসিক মোট ডিউটির পরিমাণ ও খাত ভিত্তিক অর্থ প্রাপ্তির তালিকা।</p>
            </div>

            {loading ? (
              <div className="h-64 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-xl" />
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
                নির্বাচিত মাস ও ফিল্টারের অধীনে কোনো বিলিং ডাটা পাওয়া যায়নি।
              </div>
            )}
          </div>
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
                <button
                  onClick={() => handleGenerateAndPrint(true)}
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
                  onClick={() => handleGenerateAndPrint(false)}
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
              </div>
            </div>

            {archiveSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-455">
                <CheckCircle size={16} className="text-emerald-505" />
                <span>{archiveSuccess}</span>
              </div>
            )}

            {archiveError && (
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-3 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-455">
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
                  <label className="text-xs font-bold text-slate-500">ডিউটির ক্যাটাগরি (Duty Category)</label>
                  <select
                    value={printCategory}
                    onChange={(e) => setPrintCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LATE_SITTING">Late Sitting (লেট সিটিং)</option>
                    <option value="NIGHT_SHIFT">Night Shift (রাত্রের ডিউটি)</option>
                    <option value="HOLIDAY">Holiday Duty (ছুটির দিন)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">মেমো তারিখ (Memo Date)</label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">বিষয় (Memo Subject)</label>
                  <input
                    type="text"
                    value={subjectText}
                    onChange={(e) => setSubjectText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">স্মারক/সূত্র নম্বর (Bill Ref)</label>
                  <input
                    type="text"
                    value={billRef}
                    onChange={(e) => setBillRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* office order selection dropdown if there are pending orders */}
              {pendingOrderRefs.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/20 space-y-1.5">
                  <label className="text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    কোন অফিস আদেশের বিল তৈরি করতে চান? (Select Office Order)
                  </label>
                  <select
                    value={selectedOrderRef}
                    onChange={(e) => setSelectedOrderRef(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  >
                    {pendingOrderRefs.map(ref => (
                      <option key={ref} value={ref}>{ref}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Row 2: Payees & Representatives & DGM */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">তহবিল সংগ্রহকারী কর্মকর্তা (Bill Favoring To)</label>
                  <select
                    value={representativeName}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setRepresentativeName(selectedVal);
                      const found = employees.find(emp => emp.name === selectedVal);
                      if (found) {
                        setRepresentativeDesignation(getShortDesignation(found.designation));
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold"
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
                  <label className="text-xs font-bold text-slate-500">প্রতিনিধির পদবী (Representative Designation)</label>
                  <input
                    type="text"
                    disabled
                    value={representativeDesignation}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 rounded-lg text-xs cursor-not-allowed text-slate-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">অনুমোদনকারী কর্মকর্তা (DGM)</label>
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold"
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
    </div>
  );
}
