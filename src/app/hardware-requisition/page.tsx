'use client';
import logger from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { 
  DEFAULT_2026_HOLIDAYS, 
  isNonWorkingDay as libIsNonWorkingDay 
} from '@/lib/leave-calculator';
import { toBanglaDigits } from '@/lib/bengali-converter';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  Printer, 
  ArrowLeft, 
  FileText, 
  User, 
  AlertCircle,
  HardDrive,
  Trash2,
  CalendarCheck,
  CheckCircle,
  Info
} from 'lucide-react';

interface CalendarDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  isNonWorkingDay: (dateStr: string) => boolean;
  toBanglaDigits: (num: number | string) => string;
  placeholder?: string;
  disabled?: boolean;
}

function CalendarDatePicker({
  value,
  onChange,
  isNonWorkingDay,
  toBanglaDigits,
  placeholder = 'তারিখ নির্বাচন করুন',
  disabled = false
}: CalendarDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const val = value ? new Date(value) : new Date();
    return isNaN(val.getTime()) ? new Date() : val;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.calendar-picker-container')) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isOpen]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(selectedDateStr);
    setIsOpen(false);
  };

  const monthNamesBN = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const getDisplayDate = () => {
    if (!value) return placeholder;
    const parts = value.split('-');
    if (parts.length !== 3) return value;
    const [y, m, d] = parts;
    return `${toBanglaDigits(parseInt(d, 10).toString())}ই ${monthNamesBN[parseInt(m, 10) - 1]} ${toBanglaDigits(y)}`;
  };

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isWeekendOrHoliday = isNonWorkingDay(dateStr);
    const isSelected = value === dateStr;

    days.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={isWeekendOrHoliday}
        onClick={() => handleSelectDay(d)}
        className={`w-8 h-8 flex items-center justify-center text-xs rounded-xl transition-all ${
          isSelected 
            ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-500/30' 
            : isWeekendOrHoliday 
              ? 'text-rose-500 bg-rose-50/10 dark:bg-rose-950/5 cursor-not-allowed opacity-40 font-medium' 
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-semibold'
        }`}
        title={isWeekendOrHoliday ? 'ছুটির দিন (ডিজেবল)' : undefined}
      >
        {toBanglaDigits(d)}
      </button>
    );
  }

  return (
    <div className="relative calendar-picker-container font-sans w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-semibold text-left cursor-pointer transition-all disabled:bg-slate-100 disabled:dark:bg-slate-950 disabled:cursor-not-allowed flex items-center justify-between shadow-sm"
      >
        <span>{getDisplayDate()}</span>
        <span className="text-xs text-slate-450 dark:text-slate-400">📅</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-3 animate-in fade-in slide-in-from-top-1 duration-150 select-none">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-900 pb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer text-xs font-extrabold"
            >
              ◀
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {monthNamesBN[month]} {toBanglaDigits(year)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer text-xs font-extrabold"
            >
              ▶
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center mb-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>রবি</span>
            <span>সোম</span>
            <span>মঙ্গল</span>
            <span>বুধ</span>
            <span>বৃহ</span>
            <span className="text-rose-500 font-bold">শুক্র</span>
            <span className="text-rose-500 font-bold">শনি</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {days}
          </div>
        </div>
      )}
    </div>
  );
}

interface Employee {
  id: number;
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  cellId: number;
  mobile: string | null;
  cell?: {
    id: number;
    name: string;
    description: string | null;
  };
}

interface Cell {
  id: number;
  name: string;
  description: string | null;
}

interface RequisitionItem {
  id?: number;
  serialNo: string;
  officerUserId?: number | null;
  officerNameSnapshot: string;
  officerDesignationSnapshot: string;
  hardwareLabel: string;
}

interface Requisition {
  id: number;
  requesterUserId: number;
  cellName: string;
  hardwareType: string;
  upsAction: string;
  subjectLine: string;
  requisitionDate: string;
  mode: 'INDIVIDUAL' | 'MULTIPLE';
  status: string;
  createdAt: string;
  items: RequisitionItem[];
  requester?: {
    id: number;
    name: string;
    username: string;
  };
}

export default function HardwareRequisitionPage() {
  const { currentUser } = useProfile();
  
  // View/Tab state
  const [activeTab, setActiveTab] = useState<'NEW' | 'ARCHIVE'>('NEW');
  const [entryMode, setEntryMode] = useState<'INDIVIDUAL' | 'MULTIPLE'>('INDIVIDUAL');
  
  // Data loading states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [dbHolidays, setDbHolidays] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [reqToDelete, setReqToDelete] = useState<number | null>(null);
  
  // Form fields
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [hardwareType, setHardwareType] = useState('');
  const [upsAction, setUpsAction] = useState<string>('');
  const [selectedCellId, setSelectedCellId] = useState<number | ''>('');
  const [selectedApplicantEmp, setSelectedApplicantEmp] = useState<Employee | null>(null);
  const [customHardwareType, setCustomHardwareType] = useState('');
  const [customRequestType, setCustomRequestType] = useState('');
  
  // Multiple mode specific state
  const [upsCount, setUpsCount] = useState<number>(1);
  const [checkedEmployees, setCheckedEmployees] = useState<Record<number, boolean>>({});

  // Printing state
  const [printRequisition, setPrintRequisition] = useState<Requisition | null>(null);

  const cleanDesignation = (desig: string): string => {
    if (!desig) return '';
    return desig.replace(/\s*\([^)]*\)/g, '').trim();
  };

  const isNonWorkingDay = (dateStr: string): boolean => {
    return libIsNonWorkingDay(dateStr, dbHolidays);
  };

  // Helper to convert number to Bangla words
  const getBanglaCountWords = (num: number): string => {
    const words = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 'এগারো', 'বারো'];
    return words[num] || num.toString();
  };

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [empsRes, holidaysRes, reqsRes, cellsRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/holidays'),
          fetch('/api/hardware-requisitions'),
          fetch('/api/cells')
        ]);

        let emps: Employee[] = [];
        if (empsRes.ok) {
          emps = await empsRes.json();
          setEmployees(emps);
        }

        if (holidaysRes.ok) {
          const hols = await holidaysRes.json();
          setDbHolidays(hols);
        }

        if (reqsRes.ok) {
          const reqs = await reqsRes.json();
          setRequisitions(reqs);
        }

        if (cellsRes.ok) {
          const cellsData = await cellsRes.json();
          setCells(Array.isArray(cellsData) ? cellsData : []);
        }

        // Set default selected employee based on current user
        if (currentUser) {
          const myEmp = emps.find(e => e.bankId?.trim().toLowerCase() === currentUser.username.trim().toLowerCase());
          if (myEmp) {
            setSelectedApplicantEmp(myEmp);
            setSelectedCellId(myEmp.cellId);
          }
        }
      } catch (err) {
        logger.error('Error fetching hardware requisition dependencies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  // Load archived list
  const refreshRequisitions = async () => {
    try {
      const res = await fetch('/api/hardware-requisitions');
      if (res.ok) {
        const data = await res.json();
        setRequisitions(data);
      }
    } catch (e) {
      logger.error('Failed to reload requisitions:', e);
    }
  };

  // Filter employees under the same in-charge
  const getEligibleEmployees = (): Employee[] => {
    if (!selectedApplicantEmp) return [];

    const cellId = selectedApplicantEmp.cellId;
    
    // Identify cell linkage (CBS = 9 and R09 = 7 are linked under same supervisor)
    const isLinkedCell = cellId === 7 || cellId === 9;

    return employees.filter(emp => {
      if (isLinkedCell) {
        return emp.cellId === 7 || emp.cellId === 9;
      }
      return emp.cellId === cellId;
    });
  };

  const eligibleEmployees = getEligibleEmployees();
  const maxSelectable = eligibleEmployees.length;

  // Sync state when selected requester or entry mode changes
  useEffect(() => {
    setCheckedEmployees({});
    setUpsCount(1);
    setErrorMsg('');
  }, [selectedApplicantEmp, entryMode]);

  // Build requisition items dynamically for the preview / submission
  const getRequisitionItems = (): RequisitionItem[] => {
    let hwLabel = '';
    if (hardwareType === 'OTHER') {
      const hwName = customHardwareType || 'হার্ডওয়্যার';
      const isSupply = customRequestType.includes('সরবরাহ');
      const isRepair = customRequestType.includes('মেরামত');
      
      if (isSupply) {
        hwLabel = `নতুন ${hwName} - ১ (এক) টি`;
      } else if (isRepair) {
        hwLabel = `${hwName} মেরামত - ১ (এক) টি`;
      } else {
        const actionSuffix = customRequestType ? ` ${customRequestType}` : '';
        hwLabel = `${hwName}${actionSuffix} - ১ (এক) টি`;
      }
    } else {
      if (upsAction === 'REPAIR') {
        hwLabel = 'ইউপিএস মেরামত - ১ (এক) টি';
      } else if (upsAction === 'NEW_SUPPLY') {
        hwLabel = 'নতুন ইউপিএস - ১ (এক) টি';
      } else {
        hwLabel = 'ইউপিএস - ১ (এক) টি';
      }
    }

    if (entryMode === 'INDIVIDUAL') {
      if (!selectedApplicantEmp) return [];
      return [{
        serialNo: '০১',
        officerUserId: currentUser?.id,
        officerNameSnapshot: selectedApplicantEmp.name,
        officerDesignationSnapshot: cleanDesignation(selectedApplicantEmp.designation),
        hardwareLabel: hwLabel
      }];
    } else {
      // Multiple mode
      const selectedList = eligibleEmployees.filter(emp => checkedEmployees[emp.id]);
      return selectedList.map((emp, index) => {
        const serialNo = String(index + 1).padStart(2, '0');
        const bnChars = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
        const bnSerial = serialNo.replace(/\d/g, (d) => bnChars[parseInt(d, 10)]);

        return {
          serialNo: bnSerial,
          officerNameSnapshot: emp.name,
          officerDesignationSnapshot: cleanDesignation(emp.designation),
          hardwareLabel: hwLabel
        };
      });
    }
  };

  const currentItems = getRequisitionItems();

  // Text generator
  const getGeneratedTexts = (req: any) => {
    const cellName = req.cellName || 'অনুমোদিত সেল';
    const count = req.items?.length || 0;
    const countBn = toBanglaDigits(String(count).padStart(2, '0'));
    const countWord = getBanglaCountWords(count);

    let subjectLine = '';
    let bodyParagraph = '';

    if (req.hardwareType === 'OTHER' || req.upsAction === 'CUSTOM') {
      if (req.subjectLine) {
        subjectLine = req.subjectLine;
        const coreText = req.subjectLine
          .replace(/^বিষয়ঃ\s+/, '')
          .replace(/^विषयঃ\s+/, '')
          .replace(/প্রসঙ্গে।$/, '')
          .trim();
        bodyParagraph = `${cellName}-এ কর্মরত নিম্ন স্বাক্ষরকারী কর্মকর্তার অফিসের যাবতীয় গুরুত্বপূর্ণ কাজ সূচারুরূপে নিরবিচ্ছিন্নভাবে সম্পাদনের নিমিত্তে জরুরিভিত্তিতে ${coreText} করা প্রয়োজন।`;
      } else {
        const hwName = customHardwareType || 'হার্ডওয়্যার';
        const isSupply = customRequestType.includes('সরবরাহ');
        const isRepair = customRequestType.includes('মেরামত');
        
        let hwTextWithModifier = hwName;
        let actionName = customRequestType || 'সরবরাহ/মেরামত';
        
        if (isSupply) {
          hwTextWithModifier = `নতুন ${hwName}`;
        } else if (isRepair) {
          hwTextWithModifier = `ব্যবহৃত অকেজো ${hwName}`;
        }
        
        subjectLine = `বিষয়ঃ ${cellName}-এ জরুরিভিত্তিতে ${countBn} (${countWord}) টি ${hwTextWithModifier} ${actionName} প্রসঙ্গে।`;
        bodyParagraph = `${cellName}-এ কর্মরত নিম্ন স্বাক্ষরকারী কর্মকর্তার অফিসের যাবতীয় গুরুত্বপূর্ণ কাজ সূচারুরূপে নিরবিচ্ছিন্নভাবে সম্পাদনের নিমিত্তে জরুরিভিত্তিতে ${countBn} (${countWord}) টি ${hwTextWithModifier} ${actionName} করা প্রয়োজন।`;
      }
    } else {
      if (req.upsAction === 'REPAIR') {
        subjectLine = `বিষয়ঃ ${cellName}-এ জরুরিভিত্তিতে ${countBn} (${countWord}) টি ব্যবহৃত অকেজো ইউপিএস মেরামত প্রসঙ্গে।`;
        bodyParagraph = `${cellName}-এ কর্মরত নিম্ন স্বাক্ষরকারী কর্মকর্তার অফিসের যাবতীয় গুরুত্বপূর্ণ কাজ সূচারুরূপে নিরবিচ্ছিন্নভাবে সম্পাদনের নিমিত্তে জরুরিভিত্তিতে ${countBn} (${countWord}) টি ব্যবহৃত অকেজো ইউপিএস মেরামত করা প্রয়োজন।`;
      } else if (req.upsAction === 'NEW_SUPPLY') {
        subjectLine = `বিষয়ঃ ${cellName}-এ জরুরিভিত্তিতে ${countBn} (${countWord}) টি নতুন ইউপিএস সরবরাহ প্রসঙ্গে।`;
        bodyParagraph = `${cellName}-এ কর্মরত নিম্ন স্বাক্ষরকারী কর্মকর্তার অফিসের যাবতীয় গুরুত্বপূর্ণ কাজ সূচারুরূপে নিরবিচ্ছিন্নভাবে সম্পাদনের নিমিত্তে জরুরিভিত্তিতে ${countBn} (${countWord}) টি নতুন ইউপিএস সরবরাহ করা প্রয়োজন।`;
      } else {
        subjectLine = `বিষয়ঃ [ক্যাটাগরি ও অনুরোধের ধরণ নির্বাচন করুন]`;
        bodyParagraph = `[ক্যাটাগরি ও অনুরোধের ধরণ নির্বাচন করুন]`;
      }
    }

    const closingParagraph = 'এমতাবস্থায়, উপরে উল্লেখিত সমস্যা সমাধানের জন্য প্রয়োজনীয় ব্যবস্থা গ্রহণের অনুরোধ জানিয়ে নথিটি অত্র ডিপার্টমেন্টের হার্ডওয়্যার সেল বরাবর প্রেরণ করা যেতে পারে।';

    return { subjectLine, bodyParagraph, closingParagraph };
  };

  const previewReq = (activeTab === 'ARCHIVE' && printRequisition) 
    ? printRequisition 
    : {
        id: 0,
        requesterUserId: 0,
        cellName: selectedApplicantEmp?.cell?.name || '',
        hardwareType,
        upsAction,
        subjectLine: '',
        requisitionDate: selectedDate,
        mode: entryMode,
        status: 'Draft',
        createdAt: new Date().toISOString(),
        items: currentItems,
        requester: {
          name: selectedApplicantEmp?.name || '',
          username: ''
        }
      };

  const { subjectLine, bodyParagraph, closingParagraph } = getGeneratedTexts(previewReq);

  if (activeTab === 'NEW' || !printRequisition) {
    previewReq.subjectLine = subjectLine;
  }

  // Validate on change
  const isDateHoliday = isNonWorkingDay(selectedDate);

  const isFormValid = !!selectedApplicantEmp && 
    !!hardwareType && 
    (hardwareType === 'UPS' ? !!upsAction : (hardwareType === 'OTHER' ? !!customHardwareType.trim() : false)) &&
    !isDateHoliday &&
    (entryMode === 'MULTIPLE' ? Object.values(checkedEmployees).filter(Boolean).length === upsCount : true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedApplicantEmp) {
      setErrorMsg('আবেদনকারী কর্মকর্তা নির্বাচন করা হয়নি।');
      return;
    }

    if (!hardwareType) {
      setErrorMsg('অনুগ্রহ করে হার্ডওয়্যার ক্যাটাগরি নির্বাচন করুন।');
      return;
    }

    if (hardwareType === 'OTHER' && !customHardwareType.trim()) {
      setErrorMsg('অনুগ্রহ করে হার্ডওয়্যারের নাম টাইপ করুন।');
      return;
    }

    if (hardwareType === 'UPS' && !upsAction) {
      setErrorMsg('অনুগ্রহ করে অনুরোধের ধরণ নির্বাচন করুন।');
      return;
    }

    if (isDateHoliday) {
      setErrorMsg('ছুটির দিনে রিকুইজিশন করা যাবে না। অনুগ্রহ করে একটি কর্মদিবস নির্বাচন করুন।');
      return;
    }

    if (entryMode === 'MULTIPLE') {
      const selectedCount = Object.values(checkedEmployees).filter(Boolean).length;
      if (selectedCount !== upsCount) {
        setErrorMsg(`অনুরোধকৃত হার্ডওয়্যার সংখ্যা (${toBanglaDigits(upsCount)} টি) এবং নির্বাচিত কর্মকর্তার সংখ্যা (${toBanglaDigits(selectedCount)} জন) অবশ্যই সমান হতে হবে।`);
        return;
      }
    }

    try {
      setSubmitting(true);

      const itemsPayload = currentItems.map(item => ({
        officerUserId: null, // will resolve by name snapshot
        officerNameSnapshot: item.officerNameSnapshot,
        officerDesignationSnapshot: item.officerDesignationSnapshot,
        hardwareLabel: item.hardwareLabel
      }));

      const res = await fetch('/api/hardware-requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requisitionDate: selectedDate,
          hardwareType,
          upsAction,
          mode: entryMode,
          cellName: selectedApplicantEmp.cell?.name || 'Unknown',
          subjectLine,
          items: itemsPayload
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'রিকুইজিশন সাবমিট করতে ব্যর্থ হয়েছে।');
      }

      setSuccessMsg('হার্ডওয়্যার রিকুইজিশন সফলভাবে সংরক্ষণ করা হয়েছে!');
      refreshRequisitions();
      setActiveTab('ARCHIVE');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    setReqToDelete(id);
  };

  const confirmDelete = async () => {
    if (!reqToDelete) return;
    try {
      const res = await fetch(`/api/hardware-requisitions/${reqToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        refreshRequisitions();
      } else {
        alert('ডিলিট করতে ব্যর্থ হয়েছে।');
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setReqToDelete(null);
    }
  };

  const handlePrintClick = (req: Requisition) => {
    setPrintRequisition(req);
    // Let the DOM update and then print
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const getBnDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${toBanglaDigits(d)}/${toBanglaDigits(m)}/${toBanglaDigits(y)}`;
  };

  // Preview target data is resolved above at previewReq

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
        
        {/* Main Interface Layout */}
        <div className="max-w-[1440px] mx-auto p-4 lg:p-8 space-y-6">
          
          {/* Header */}
          <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/85 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <Link 
                  href="/dashboard" 
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeft size={16} />
                </Link>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-xl">
                  <HardDrive size={22} />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-805 dark:text-slate-100">হার্ডওয়্যার রিকুইজিশন প্যানেল</h1>
                  <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Janata Bank PLC. Legal-Size Document Generation</p>
                </div>
              </div>
            </div>
            
            {activeTab === 'NEW' && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!isFormValid}
                  onClick={() => {
                    const fakeReq = {
                      id: 0,
                      requesterUserId: 0,
                      cellName: selectedApplicantEmp?.cell?.name || '',
                      hardwareType,
                      upsAction,
                      subjectLine,
                      requisitionDate: selectedDate,
                      mode: entryMode,
                      status: 'Draft',
                      createdAt: new Date().toISOString(),
                      items: currentItems
                    };
                    handlePrintClick(fakeReq);
                  }}
                  className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 hover:bg-slate-50 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer size={14} />
                  প্রিন্ট প্রিভিউ
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || isDateHoliday || !isFormValid}
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-indigo-550/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:dark:bg-slate-900 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'রিকুইজিশন সাবমিট'}
                </button>
              </div>
            )}
          </div>

          {/* Form and Preview Split */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* LEFT settings form */}
            <div className="no-print xl:col-span-4 space-y-6">
              
              {/* Tab Switcher */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 pb-px">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('NEW');
                    setPrintRequisition(null);
                  }}
                  className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'NEW'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  নতুন রিকুইজিশন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('ARCHIVE');
                    if (requisitions.length > 0) {
                      setPrintRequisition(requisitions[0]);
                    }
                  }}
                  className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'ARCHIVE'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  সংরক্ষিত রিকুইজিশন সমূহ
                </button>
              </div>

              {activeTab === 'NEW' ? (
                <div className="space-y-6">
                  
                  {errorMsg && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-xl flex items-center gap-3 shadow-sm">
                      <AlertCircle size={18} className="text-rose-600 shrink-0" />
                      <p>{errorMsg}</p>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in">
                      <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                      <p>{successMsg}</p>
                    </div>
                  )}

                  <Card
                    title={
                      <span className="flex items-center gap-2">
                        <User size={16} className="text-primary-600" />
                        রিকুয়েস্টার কর্মকর্তা তথ্য
                      </span>
                    }
                  >

                    <div className="space-y-3.5 text-xs font-sans">
                      {currentUser?.role === 'ADMIN' && (
                        <>
                          <div className="space-y-1.5 pb-2">
                            <label className="font-bold text-indigo-700 dark:text-indigo-400 block">শাখা/সেল নির্বাচন করুন:</label>
                            <select
                              value={selectedCellId}
                              onChange={(e) => {
                                const cellId = e.target.value ? parseInt(e.target.value, 10) : '';
                                setSelectedCellId(cellId);
                                setSelectedApplicantEmp(null); // Reset officer selection
                              }}
                              className="w-full px-3 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-xl outline-none focus:border-indigo-500 font-bold cursor-pointer text-indigo-900 dark:text-indigo-300"
                            >
                              <option value="">শাখা/সেল নির্বাচন করুন...</option>
                              {cells.map(cell => (
                                <option key={cell.id} value={cell.id}>{cell.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                            <label className="font-bold text-indigo-700 dark:text-indigo-400 block">আবেদনকারী কর্মকর্তা নির্বাচন:</label>
                            <select
                              value={selectedApplicantEmp?.id || ''}
                              disabled={!selectedCellId}
                              onChange={(e) => {
                                const emp = employees.find(emp => String(emp.id) === e.target.value);
                                if (emp) setSelectedApplicantEmp(emp);
                              }}
                              className="w-full px-3 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-xl outline-none focus:border-indigo-500 font-bold cursor-pointer text-indigo-900 dark:text-indigo-300 disabled:bg-slate-100 disabled:dark:bg-slate-900 disabled:cursor-not-allowed"
                            >
                              <option value="">কর্মকর্তা নির্বাচন করুন...</option>
                              {employees
                                .filter(emp => emp.cellId === selectedCellId)
                                .map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.name} ({cleanDesignation(emp.designation)})</option>
                                ))
                              }
                            </select>
                          </div>
                        </>
                      )}

                      {selectedApplicantEmp ? (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <span className="text-slate-450 block">নাম:</span>
                            <span className="font-extrabold text-slate-700 dark:text-slate-350">{selectedApplicantEmp.name}</span>
                          </div>
                          <div>
                            <span className="text-slate-450 block">পদবী:</span>
                            <span className="font-extrabold text-slate-700 dark:text-slate-350">{cleanDesignation(selectedApplicantEmp.designation)}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-450 block">সেল/শাখা:</span>
                            <span className="font-extrabold text-slate-700 dark:text-slate-350">{selectedApplicantEmp.cell?.name || 'Not Linked'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-rose-500 font-bold animate-pulse">প্রোফাইল ম্যাচ পাওয়া যায়নি!</div>
                      )}
                    </div>
                  </Card>

                  {/* Mode Selector (Everyone) */}
                  {currentUser && (
                    <div className="w-full bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner flex">
                      <button
                        type="button"
                        onClick={() => setEntryMode('INDIVIDUAL')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                          entryMode === 'INDIVIDUAL' 
                            ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm border border-slate-200/50' 
                            : 'text-slate-500 hover:text-slate-850'
                        }`}
                      >
                        অপশন ১: নিজস্ব আবেদন
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntryMode('MULTIPLE')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                          entryMode === 'MULTIPLE' 
                            ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm border border-slate-200/50' 
                            : 'text-slate-500 hover:text-slate-850'
                        }`}
                      >
                        অপশন ২: একাধিক কর্মকর্তা
                      </button>
                    </div>
                  )}

                  <Card
                    className="!overflow-visible"
                    title={
                      <span className="flex items-center gap-2">
                        <HardDrive size={16} className="text-primary-600" />
                        হার্ডওয়্যার ও তারিখ নির্ধারণ
                      </span>
                    }
                  >

                    <div className="space-y-4 text-xs font-sans">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500 block">তারিখ:</label>
                        <CalendarDatePicker 
                          value={selectedDate}
                          onChange={(d) => setSelectedDate(d)}
                          isNonWorkingDay={isNonWorkingDay}
                          toBanglaDigits={toBanglaDigits}
                        />
                        {isDateHoliday && (
                          <span className="text-[10px] text-rose-500 font-bold block mt-1">
                            ⚠️ নির্বাচিত তারিখটি ছুটির দিন বা সাপ্তাহিক ছুটির দিন। অনুগ্রহ করে অন্য তারিখ নির্বাচন করুন।
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500 block">হার্ডওয়্যার ক্যাটাগরি:</label>
                        <select
                          value={hardwareType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setHardwareType(val);
                            setUpsAction(val === 'UPS' ? '' : 'CUSTOM');
                            setCustomHardwareType('');
                            setCustomRequestType('');
                          }}
                          className="w-full h-10 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold cursor-pointer text-slate-800 dark:text-slate-100"
                        >
                          <option value="">ক্যাটাগরি নির্বাচন করুন...</option>
                          <option value="UPS">ইউপিএস (UPS)</option>
                          <option value="OTHER">অন্যান্য (Other)</option>
                        </select>
                      </div>

                      {hardwareType === 'UPS' && (
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500 block">অনুরোধের ধরণ:</label>
                          <select
                            value={upsAction}
                            onChange={(e) => setUpsAction(e.target.value)}
                            className="w-full h-10 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold cursor-pointer text-slate-800 dark:text-slate-100"
                          >
                            <option value="">অনুরোধের ধরণ নির্বাচন করুন...</option>
                            <option value="REPAIR">অকেজো ইউপিএস মেরামত</option>
                            <option value="NEW_SUPPLY">নতুন ইউপিএস সরবরাহ</option>
                          </select>
                        </div>
                      )}

                      {hardwareType === 'OTHER' && (
                        <>
                          <div className="space-y-1.5 animate-in fade-in duration-200">
                            <label className="font-bold text-slate-500 block">হার্ডওয়্যারের নাম:</label>
                            <input
                              type="text"
                              placeholder="উদাঃ প্রিন্টার, স্ক্যানার"
                              value={customHardwareType}
                              onChange={(e) => setCustomHardwareType(e.target.value)}
                              className="w-full h-10 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-850 dark:text-slate-100 placeholder-slate-450 outline-none focus:border-indigo-500 text-xs"
                            />
                          </div>

                          <div className="space-y-1.5 animate-in fade-in duration-200">
                            <label className="font-bold text-slate-500 block">অনুরোধের ধরণ (ঐচ্ছিক):</label>
                            <input
                              type="text"
                              placeholder="উদাঃ মেরামত, নতুন সরবরাহ"
                              value={customRequestType}
                              onChange={(e) => setCustomRequestType(e.target.value)}
                              className="w-full h-10 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-850 dark:text-slate-100 placeholder-slate-455 outline-none focus:border-indigo-500 text-xs"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </Card>

                  {/* Settings Box: Multiple mode selections */}
                  {entryMode === 'MULTIPLE' && selectedApplicantEmp && (
                    <Card
                      title={
                        <span className="flex items-center gap-2">
                          <CalendarCheck size={16} className="text-primary-600" />
                          কর্মকর্তা তালিকা (মোট কর্মকর্তা: {toBanglaDigits(maxSelectable)})
                        </span>
                      }
                      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >

                      <div className="space-y-4 text-xs font-sans">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500 block">প্রয়োজনীয় হার্ডওয়্যার সংখ্যা:</label>
                          <select
                            value={upsCount}
                            onChange={(e) => setUpsCount(parseInt(e.target.value, 10))}
                            className="w-full h-10 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold cursor-pointer text-slate-800 dark:text-slate-100"
                          >
                            {Array.from({ length: maxSelectable }, (_, i) => i + 1).map(num => (
                              <option key={num} value={num}>{toBanglaDigits(num)} টি</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 border border-slate-100 dark:border-slate-900 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                          <label className="font-bold text-slate-500 block pb-1 border-b border-slate-100 dark:border-slate-900 mb-1">
                            কর্মকর্তাবৃন্দ নির্বাচন করুন (হার্ডওয়্যার সংখ্যা অনুযায়ী):
                          </label>
                          {eligibleEmployees.map(emp => {
                            const isChecked = checkedEmployees[emp.id] || false;
                            return (
                              <label key={emp.id} className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition-all">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const nextChecked = { ...checkedEmployees, [emp.id]: !isChecked };
                                    setCheckedEmployees(nextChecked);
                                    
                                    // Live validation warning in form info if over select
                                    const checkedCount = Object.values(nextChecked).filter(Boolean).length;
                                    if (checkedCount > upsCount) {
                                      setErrorMsg(`হার্ডওয়্যার সংখ্যা (${toBanglaDigits(upsCount)}) এর চেয়ে বেশি কর্মকর্তা নির্বাচন করেছেন!`);
                                    } else {
                                      setErrorMsg('');
                                    }
                                  }}
                                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
                                />
                                <div className="text-[11px]">
                                  <span className="font-bold text-slate-805 dark:text-slate-200 block">{emp.name}</span>
                                  <span className="text-slate-450">{cleanDesignation(emp.designation)}</span>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  </Card>
                )}

                </div>
              ) : (
                /* Archive Tab Content */
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-12 text-slate-500 text-xs font-bold animate-pulse">ডাটা লোড হচ্ছে...</div>
                  ) : requisitions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs font-bold glass-card rounded-2xl p-5 border border-dashed border-slate-200">
                      কোনো রিকুইজিশন রেকর্ড পাওয়া যায়নি।
                    </div>
                  ) : (
                    requisitions.map(req => (
                      <div key={req.id} className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all space-y-3 font-sans text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 font-bold text-[9px] rounded-md tracking-wide">
                              ID: #{req.id}
                            </span>
                            <span className="ml-2 font-bold text-slate-800 dark:text-slate-200">{req.cellName}</span>
                          </div>
                          <span className="text-slate-400 text-[10px]">{getBnDateString(req.requisitionDate)}</span>
                        </div>

                        <div className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2">
                          <strong>বিষয়:</strong> {req.subjectLine.replace('বিষয়ঃ ', '').replace('विषয়ঃ ', '')}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-900">
                          <span className="text-[10px] text-slate-500">
                            কর্মকর্তা: {toBanglaDigits(req.items.length)} জন
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePrintClick(req)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-indigo-605 dark:text-indigo-400 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Printer size={10} />
                              প্রিন্ট
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleDelete(req.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>

            {/* RIGHT document layout preview */}
            <div className="xl:col-span-8 w-full flex justify-center pb-4">
              
              <div 
                id="printable-hardware-requisition-sheet" 
                className="w-full max-w-[216mm] min-h-[355mm] bg-white text-black border border-slate-350 dark:border-slate-800 print:border-none shadow-[0_15px_50px_rgba(0,0,0,0.08)] print:shadow-none flex flex-col justify-start"
                style={{
                  paddingTop: '0.8in',
                  paddingBottom: '1in',
                  paddingLeft: '1.3in',
                  paddingRight: '0.6in',
                  boxSizing: 'border-box'
                }}
              >
                
                {/* Upper block */}
                <div className="flex flex-col justify-start" contentEditable={true} suppressContentEditableWarning={true}>
                  
                  {/* Top Header */}
                  <div className="text-right space-y-1 font-bold pr-1">
                    <h2 className="text-black" style={{ letterSpacing: 'normal', fontSize: '20pt', lineHeight: 'normal' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h2>
                    <p className="text-xs text-black" style={{ letterSpacing: 'normal' }}>
                      তারিখঃ {getBnDateString(previewReq.requisitionDate)} ইং
                    </p>
                  </div>

                  {/* Subject line */}
                  <div className="text-left text-[13px] leading-relaxed text-black mt-4">
                    <span className="font-bold">বিষয়ঃ </span>
                    <span className="font-bold inline-block border-b border-black pb-0.5">
                      {previewReq.subjectLine.replace('বিষয়ঃ ', '').replace('विषয়ঃ ', '')}
                    </span>
                  </div>

                  {/* Body Paragraph */}
                  <p className="text-justify text-[13px] leading-relaxed text-black tracking-normal mt-4">
                    {bodyParagraph}
                  </p>

                  {/* Table */}
                  <table className="w-full text-center border-collapse border border-black mt-4 mb-4 text-[13px]">
                    <thead>
                      <tr className="bg-slate-50/20 font-bold border-b border-black">
                        <th className="border border-black px-2 py-1.5 text-center font-bold w-[12%]">ক্রমিক নং</th>
                        <th className="border border-black px-3 py-1.5 text-center font-bold w-[35%]">কর্মকর্তার নাম</th>
                        <th className="border border-black px-3 py-1.5 text-center font-bold w-[25%]">পদবী</th>
                        <th className="border border-black px-3 py-1.5 text-center font-bold w-[28%]">প্রয়োজনীয় হার্ডওয়্যার</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewReq.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-black">
                          <td className="border border-black px-2 py-2 text-center">{item.serialNo}</td>
                          <td className="border border-black px-3 py-2 text-left">{item.officerNameSnapshot}</td>
                          <td className="border border-black px-3 py-2 text-center">{item.officerDesignationSnapshot}</td>
                          <td className="border border-black px-3 py-2 text-center">{item.hardwareLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Closing Paragraph */}
                  <p className="text-justify text-[13px] leading-relaxed text-black mt-4">
                    এমতাবস্থায়, উপরে উল্লেখিত সমস্যা সমাধানের জন্য প্রয়োজনীয় ব্যবস্থা গ্রহণের অনুরোধ জানিয়ে নথিটি অत्र ডিপার্টমেন্টের <strong><em>হার্ডওয়্যার সেল</em></strong> বরাবর প্রেরণ করা যেতে পারে।
                  </p>

                </div>

                {/* Bottom Signature and Receivers block */}
                <div className="mt-10 space-y-12" contentEditable={true} suppressContentEditableWarning={true}>
                  
                  {/* Signature block */}
                  <div className="flex justify-end">
                    <div className="text-right space-y-1 pr-2">
                      <p className="text-[13px]">({(previewReq.requester?.name || selectedApplicantEmp?.name || '[আবেদনকারীর নাম]').replace(/^জনাব\s+/, '')})</p>
                      <p className="text-[13px]">{selectedApplicantEmp ? cleanDesignation(selectedApplicantEmp.designation) : '[আবেদনকারীর পদবী]'}</p>
                    </div>
                  </div>

                  {/* Receiver destinations list */}
                  <div className="space-y-16 pt-2 text-left text-[13px] leading-relaxed text-black">
                    <p className="underline">এসপিও, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</p>
                    <p className="underline">এজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</p>
                    <p className="underline">ডিজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Print specific CSS wrapper */}
        <style>{`
          /* Universal font styling on screen preview sheet */
          #printable-hardware-requisition-sheet, 
          #printable-hardware-requisition-sheet * {
            font-family: 'SolaimanLipi', 'Nikosh', 'Noto Sans Bengali', sans-serif !important;
            font-size: 11px !important;
            color: #000000;
            line-height: 1.5 !important;
          }

          #printable-hardware-requisition-sheet h2 {
            font-size: 20px !important;
          }

          .dark #printable-hardware-requisition-sheet {
            background-color: #090d16 !important;
            border-color: #1e293b !important;
          }
          
          .dark #printable-hardware-requisition-sheet * {
            color: #f8fafc !important;
            border-color: #334155 !important;
          }

          .dark #printable-hardware-requisition-sheet table,
          .dark #printable-hardware-requisition-sheet tr,
          .dark #printable-hardware-requisition-sheet th,
          .dark #printable-hardware-requisition-sheet td {
            border-color: #334155 !important;
          }

          .dark #printable-hardware-requisition-sheet .border-black {
            border-color: #f8fafc !important;
          }

          #printable-hardware-requisition-sheet h2 {
            font-size: 20pt !important;
            line-height: normal !important;
          }

          @media print {
            @page {
              size: legal portrait;
              margin: 0 !important;
            }
            
            /* Hide web portal elements */
            .no-print, footer, header, nav, aside, .sidebar-wrapper, .mobile-nav-top {
              display: none !important;
            }

            html, body {
              width: 216mm !important;
              height: 355mm !important;
              max-height: 355mm !important;
              overflow: hidden !important;
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
            }

            /* Reset wrapping elements layouts */
            main, .flex-1, .p-4, .lg\\:p-8, .p-6, .grid, .xl\\:col-span-8 {
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
              width: auto !important;
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
            }

            /* Format sheet layout absolute on legal sheet size */
            #printable-hardware-requisition-sheet {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 216mm !important;
              height: 355mm !important;
              min-height: 355mm !important;
              max-height: 355mm !important;
              padding-top: 0.8in !important;
              padding-bottom: 1in !important;
              padding-left: 1.3in !important;
              padding-right: 0.6in !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              box-sizing: border-box !important;
              background: #ffffff !important;
              overflow: hidden !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: flex-start !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
              page-break-inside: avoid !important;
            }

            #printable-hardware-requisition-sheet * {
              background-color: transparent !important;
              color: #000000 !important;
              border-color: #000000 !important;
            }
          }
        `}</style>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!reqToDelete}
          title="হার্ডওয়্যার রিকুইজিশন মুছে ফেলা"
          description="আপনি কি নিশ্চিত যে এই রিকুইজিশনটি ডিলিট করতে চান?"
          confirmText="হ্যাঁ, মুছে ফেলুন"
          cancelText="বাতিল"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setReqToDelete(null)}
        />
      </div>
    </AuthGuard>
  );
}
