'use client';
import logger from '@/lib/logger';

import { useState, useEffect, useRef } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { 
  DEFAULT_2026_HOLIDAYS, 
  isNonWorkingDay as libIsNonWorkingDay, 
  getSucceedingContiguousHolidaysCount as libGetSucceedingContiguousHolidaysCount, 
  getCalculatedLeaveDetails as libGetCalculatedLeaveDetails 
} from '@/lib/leave-calculator';
import { sortEmployeesBySeniority } from '@/lib/seniority';
import { toBanglaDigits } from '@/lib/bengali-converter';

import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BANGLADESH_AREAS } from './bangladesh_areas';
import LeaveFormHeader from './components/LeaveFormHeader';
import LeaveSummaryCard from './components/LeaveSummaryCard';
import LeaveHistoryTable from './components/LeaveHistoryTable';
import { 
  CalendarCheck, 
  Printer, 
  ArrowLeft, 
  FileText, 
  User, 
  AlertCircle,
  Settings,
  CalendarRange,
  Info,
  Trash2,
  Edit2,
  Download,
  FileEdit
} from 'lucide-react';

// Helper to clean designations by removing duplicate parenthesized abbreviations (e.g. "সিনিয়র অফিসার-আইটি (এসও-আইটি)" -> "সিনিয়র অফিসার-আইটি")
const cleanDesignationForLeave = (desig: string): string => {
  if (!desig) return '';
  return desig.replace(/\s*\([^)]*\)/g, '').trim();
};

interface CalendarDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  isNonWorkingDay: (dateStr: string) => boolean;
  toBanglaDigits: (num: number | string) => string;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
}

function CalendarDatePicker({
  value,
  onChange,
  isNonWorkingDay,
  toBanglaDigits,
  minDate,
  maxDate,
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
    
    let isOutOfRange = false;
    if (minDate && dateStr < minDate) isOutOfRange = true;
    if (maxDate && dateStr > maxDate) isOutOfRange = true;

    const isDisabled = isWeekendOrHoliday || isOutOfRange;
    const isSelected = value === dateStr;

    days.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={isDisabled}
        onClick={() => handleSelectDay(d)}
        className={`w-8 h-8 flex items-center justify-center text-xs rounded-xl transition-all ${
          isSelected 
            ? 'bg-indigo-650 text-white font-bold shadow-sm shadow-indigo-500/30' 
            : isWeekendOrHoliday 
              ? 'text-rose-500 bg-rose-50/10 dark:bg-rose-950/5 cursor-not-allowed opacity-90 font-medium' 
              : isOutOfRange
                ? 'text-slate-405 dark:text-slate-600 bg-slate-50/5 dark:bg-slate-900/5 cursor-not-allowed font-medium'
                : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30 cursor-pointer font-black'
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
        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-550 font-semibold text-left cursor-pointer transition-all disabled:bg-slate-100 disabled:dark:bg-slate-950 disabled:cursor-not-allowed flex items-center justify-between shadow-sm"
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
            <span className="text-xs font-bold text-slate-805 dark:text-slate-200">
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
  mobile: string | null;
  cellId: number;
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

interface UserSession {
  id: number;
  name: string;
  username: string;
  role: string;
  cells?: { id: number; name: string }[];
}

interface Leave {
  id: number;
  leaveType: 'CASUAL' | 'POST_FACTO' | 'STATION_LEAVE';
  startDate: string;
  endDate: string;
  applicationDate: string;
  applicantName: string;
  designation: string;
  bankId: string;
  fileNo?: string | null;
  cellName: string;
  leaveLocation: string;
  mobileNo: string;
  selectedDistrict?: string | null;
  delegateId?: string | null;
  casualTotal: number;
  casualUsed: number;
  ordinaryTotal: number;
  ordinaryUsed: number;
  specialTotal: number;
  specialUsed: number;
}

interface Holiday {
  date: string;
  name: string;
  isWorkingDay: boolean;
}


export default function LeaveGeneratorPage() {
  const { currentUser } = useProfile();
  const [matchedEmp, setMatchedEmp] = useState<Employee | null>(null);
  const [selectedApplicantEmp, setSelectedApplicantEmp] = useState<Employee | null>(null);
  const [isProfileUnresolved, setIsProfileUnresolved] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [dbHolidays, setDbHolidays] = useState<Holiday[]>([]);
  const [selectedCellId, setSelectedCellId] = useState<number | ''>('');
  const [hasSyncedProfile, setHasSyncedProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Leave Form States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationMode, setDurationMode] = useState<'SINGLE' | 'MULTIPLE'>('SINGLE');
  const [applicationDate, setApplicationDate] = useState('');
  
  // Custom applicant details (editable, but default loaded from session & matching employee)
  const [applicantName, setApplicantName] = useState('');
  const [designation, setDesignation] = useState('');
  const [bankId, setBankId] = useState('');
  const [fileNo, setFileNo] = useState('');
  const [cellName, setCellName] = useState('অনলাইন ব্যাংকিং ডিপার্টমেন্ট');
  const [leaveLocation, setLeaveLocation] = useState('ঢাকা');
  const [mobileNo, setMobileNo] = useState('');

  // Leave Archive & CRUD States
  const [leaveType, setLeaveType] = useState<'CASUAL' | 'POST_FACTO' | 'STATION_LEAVE' | ''>('');
  
  // Leave Archive & CRUD States
  const [activeTab, setActiveTab] = useState<'NEW' | 'ARCHIVE'>('NEW');
  const [archivedLeaves, setArchivedLeaves] = useState<Leave[]>([]);
  const [latestLeave, setLatestLeave] = useState<Leave | null>(null);
  const lastLoadedBankIdRef = useRef('');
  const [editingLeaveId, setEditingLeaveId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch all archived leaves for the current officer
  const fetchArchivedLeaves = async (targetBankId?: string) => {
    try {
      let url = '/api/leaves';
      if (targetBankId) {
        url += `?bankId=${encodeURIComponent(targetBankId)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setArchivedLeaves(data);
        if (data.length > 0) {
          setLatestLeave(data[0]);
        } else {
          setLatestLeave(null);
        }
      }
    } catch (err) {
      logger.error('Error fetching archived leaves:', err);
    }
  };

  // Load archive on user/applicant change
  useEffect(() => {
    if (currentUser) {
      const activeBankId = selectedApplicantEmp?.bankId || (currentUser.role === 'ADMIN' ? '' : currentUser.username);
      let active = true;
      const getLeavesOnMount = async () => {
        try {
          let url = '/api/leaves';
          if (activeBankId) {
            url += `?bankId=${encodeURIComponent(activeBankId)}`;
          }
          const res = await fetch(url);
          if (res.ok && active) {
            const data = await res.json();
            setArchivedLeaves(data);
            if (data.length > 0) {
              setLatestLeave(data[0]);
            } else {
              setLatestLeave(null);
            }
          }
        } catch (err) {
          logger.error('Error fetching archived leaves:', err);
        }
      };
      getLeavesOnMount();
      return () => {
        active = false;
      };
    }
  }, [currentUser, selectedApplicantEmp]);

  // Handle Save / Update to Archive
  const handleSaveToArchive = async () => {
    if (!startDate || !endDate) {
      setErrorMsg('অনুগ্রহ করে ছুটির শুরুর এবং শেষের তারিখ নির্বাচন করুন।');
      setTimeout(() => setErrorMsg(''), 4000);
      return false;
    }

    const valResult = getDropdownValidation();
    if (!valResult.isValid) {
      setShowValidationErrors(true);
      setErrorMsg(valResult.message);
      setTimeout(() => setErrorMsg(''), 4000);
      return false;
    }

    const payload = {
      leaveType,
      startDate,
      endDate,
      applicationDate,
      applicantName,
      designation,
      bankId,
      fileNo,
      cellName,
      leaveLocation,
      mobileNo,
      selectedDistrict,
      delegateId,
      casualTotal,
      casualUsed,
      ordinaryTotal,
      ordinaryUsed,
      specialTotal,
      specialUsed
    };

    try {
      let res;
      if (editingLeaveId) {
        res = await fetch(`/api/leaves/${editingLeaveId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/leaves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        await res.json();
        setSuccessMsg(editingLeaveId ? 'আবেদনটি সফলভাবে আপডেট করা হয়েছে।' : 'আবেদনটি সফলভাবে আর্কাইভে সংরক্ষণ করা হয়েছে।');
        setErrorMsg('');
        
        if (editingLeaveId) {
          setEditingLeaveId(null);
        }
        
        // Refresh archive list
        const activeBankId = selectedApplicantEmp?.bankId || (currentUser?.role === 'ADMIN' ? '' : currentUser?.username);
        await fetchArchivedLeaves(activeBankId);

        // Refetch employees list to get the updated mobile numbers dynamically
        try {
          const empsRes = await fetch('/api/employees');
          if (empsRes.ok) {
            const empsData = await empsRes.json();
            const empsArray = Array.isArray(empsData) ? empsData : [];
            setEmployees(empsArray);
            
            // Also update selectedApplicantEmp state to keep it in sync
            if (selectedApplicantEmp?.bankId) {
              const updatedApplicant = empsArray.find((emp: any) => emp.bankId === selectedApplicantEmp.bankId);
              if (updatedApplicant) {
                setSelectedApplicantEmp(updatedApplicant);
              }
            }
          }
        } catch (empsErr) {
          logger.error('Error refreshing employees list after leave save:', empsErr);
        }
        
        // Auto switch tab
        setActiveTab('ARCHIVE');
        
        setTimeout(() => {
          setSuccessMsg('');
        }, 5000);
        return true;
      } else {
        const errData = await res.json();
        let displayError = errData.message || errData.error || 'আর্কাইভে সংরক্ষণ করতে সমস্যা হয়েছে।';
        if (errData.details) {
          const detailMsgs = Object.entries(errData.details)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(', ');
          displayError = `ভ্যালিডেশন এরর (${detailMsgs})`;
        }
        setErrorMsg(displayError);
        setTimeout(() => setErrorMsg(''), 5000);
        return false;
      }
    } catch (err) {
      logger.error('Error saving leave application:', err);
      setErrorMsg('একটি নেটওয়ার্ক সমস্যা হয়েছে।');
      setTimeout(() => setErrorMsg(''), 4000);
      return false;
    }
  };

  // Load archived leave to form for editing
  const handleEditLeave = (leave: Leave) => {
    setEditingLeaveId(leave.id);
    setLeaveType(leave.leaveType);
    setStartDate(leave.startDate);
    setEndDate(leave.endDate);
    setDurationMode(leave.startDate === leave.endDate ? 'SINGLE' : 'MULTIPLE');
    setApplicationDate(leave.applicationDate);
    setApplicantName(leave.applicantName);
    setDesignation(cleanDesignationForLeave(leave.designation));
    setBankId(leave.bankId);
    setFileNo(leave.fileNo || '');
    setCellName(leave.cellName);
    setLeaveLocation(leave.leaveLocation);
    setMobileNo(leave.mobileNo);
    setSelectedDistrict(leave.selectedDistrict || '');
    setDelegateId(leave.delegateId || '');
    
    setCasualTotal(leave.casualTotal);
    setCasualUsed(leave.casualUsed);
    setOrdinaryTotal(leave.ordinaryTotal);
    setOrdinaryUsed(leave.ordinaryUsed);
    setSpecialTotal(leave.specialTotal);
    setSpecialUsed(leave.specialUsed);

    setActiveTab('NEW'); // Switch to Form tab
    setSuccessMsg('আর্কাইভের তথ্য এডিটর ফর্মে লোড করা হয়েছে। পরিবর্তন করে আপডেট করুন।');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Load archived leave details strictly for preview/print
  const handleLoadLeavePreview = (leave: Leave) => {
    setLeaveType(leave.leaveType);
    setStartDate(leave.startDate);
    setEndDate(leave.endDate);
    setDurationMode(leave.startDate === leave.endDate ? 'SINGLE' : 'MULTIPLE');
    setApplicationDate(leave.applicationDate);
    setApplicantName(leave.applicantName);
    setDesignation(cleanDesignationForLeave(leave.designation));
    setBankId(leave.bankId);
    setFileNo(leave.fileNo || '');
    setCellName(leave.cellName);
    setLeaveLocation(leave.leaveLocation);
    setMobileNo(leave.mobileNo);
    setSelectedDistrict(leave.selectedDistrict || '');
    setDelegateId(leave.delegateId || '');
    
    setCasualTotal(leave.casualTotal);
    setCasualUsed(leave.casualUsed);
    setOrdinaryTotal(leave.ordinaryTotal);
    setOrdinaryUsed(leave.ordinaryUsed);
    setSpecialTotal(leave.specialTotal);
    setSpecialUsed(leave.specialUsed);
    
    setEditingLeaveId(null); // Clear editing mode
    setSuccessMsg('আবেদনের তথ্য প্রিন্ট প্রিভিউতে লোড করা হয়েছে।');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Delete archived application
  const handleDeleteLeave = async (leaveId: number) => {
    if (!window.confirm('প্রিন্টেড বা প্রিভিউড এপ্লিকেশন ডিলেট না করাই বেটার। আপনি কি সত্যিই এটা ডিলেট করতে চান?')) {
      return;
    }

    try {
      const res = await fetch(`/api/leaves/${leaveId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccessMsg('আবেদনটি সফলভাবে ডিলিট করা হয়েছে।');
        setErrorMsg('');
        
        if (editingLeaveId === leaveId) {
          setEditingLeaveId(null);
        }

        const activeBankId = selectedApplicantEmp?.bankId || (currentUser?.role === 'ADMIN' ? '' : currentUser?.username);
        await fetchArchivedLeaves(activeBankId);

        setTimeout(() => {
          setSuccessMsg('');
        }, 4500);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'ডিলিট করতে সমস্যা হয়েছে।');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    } catch (err) {
      logger.error('Error deleting leave application:', err);
      setErrorMsg('একটি নেটওয়ার্ক সমস্যা হয়েছে।');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Reset editing mode
  const handleCancelEdit = () => {
    setEditingLeaveId(null);
    setSuccessMsg('এডিটিং বাতিল করা হয়েছে।');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Helper to validate and restrict Leave Balance inputs (positive integers only, spent <= allowed)
  const validateAndSetTotal = (
    value: string,
    setter: (val: number | string) => void,
    currentUsed: number | string,
    setUsed: (val: number | string) => void
  ) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned === '') {
      setter('');
      return;
    }
    const num = Math.max(0, parseInt(cleaned, 10));
    setter(num);

    const usedValStr = String(currentUsed).trim();
    if (usedValStr !== '-' && usedValStr !== '') {
      const usedNum = parseInt(usedValStr, 10);
      if (!isNaN(usedNum) && usedNum > num) {
        setUsed(num);
      }
    }
  };

  const validateAndSetUsed = (
    value: string,
    setter: (val: number | string) => void,
    total: number | string
  ) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned === '') {
      setter('');
      return;
    }
    const num = Math.max(0, parseInt(cleaned, 10));

    const totalValStr = String(total).trim();
    if (totalValStr !== '-' && totalValStr !== '') {
      const totalNum = parseInt(totalValStr, 10);
      if (!isNaN(totalNum)) {
        if (num > totalNum) {
          setter(totalNum);
          return;
        }
      }
    }
    setter(num);
  };

  // Stayed Location State (Only District is needed)
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Duty delegate officer
  const [delegateId, setDelegateId] = useState<string>('');
  
  // Leaves Table Balance Sheet States (Editable inputs)
  const [isAutoBalance, setIsAutoBalance] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [casualTotal, setCasualTotal] = useState<number | string>(20);
  const [casualUsed, setCasualUsed] = useState<number | string>(0);
  
  const [ordinaryTotal, setOrdinaryTotal] = useState<number | string>(120);
  const [ordinaryUsed, setOrdinaryUsed] = useState<number | string>('-');

  const [specialTotal, setSpecialTotal] = useState<number | string>('-');
  const [specialUsed, setSpecialUsed] = useState<number | string>('-');

  // Initialize application date to today
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${date}`;
    const timer = setTimeout(() => {
      setApplicationDate(formatted);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch initial data (employees, holidays & cells)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [empsRes, holidaysRes, cellsRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/holidays'),
          fetch('/api/cells')
        ]);

        if (empsRes.ok) {
          const empsData = await empsRes.json();
          setEmployees(Array.isArray(empsData) ? empsData : []);
        }

        if (holidaysRes.ok) {
          const holData = await holidaysRes.json();
          setDbHolidays(Array.isArray(holData) ? holData : []);
        }

        if (cellsRes.ok) {
          const cellsData = await cellsRes.json();
          setCells(Array.isArray(cellsData) ? cellsData : []);
        }
      } catch (err) {
        logger.error('Error fetching initial static leave data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync state once currentUser, employees and cells are loaded
  useEffect(() => {
    if (!currentUser || employees.length === 0 || hasSyncedProfile) return;

    let initialBankId = '';
    if (currentUser.role === 'ADMIN') {
      const firstNonAdminEmp = employees.find((e: Employee) => 
        e.bankId?.trim().toLowerCase() !== currentUser.username.trim().toLowerCase()
      ) || employees[0];
      
      if (firstNonAdminEmp) {
        setSelectedApplicantEmp(firstNonAdminEmp);
        setSelectedCellId(firstNonAdminEmp.cellId);
        setApplicantName((firstNonAdminEmp.name || '').replace(/^জনাব\s+/, ''));
        setDesignation(cleanDesignationForLeave(firstNonAdminEmp.designation));
        setBankId(firstNonAdminEmp.bankId || '');
        setFileNo(firstNonAdminEmp.fileNo || '');
        setMobileNo(firstNonAdminEmp.mobile || '');
        if (firstNonAdminEmp.cell && firstNonAdminEmp.cell.name) {
          setCellName(firstNonAdminEmp.cell.name);
        }
        initialBankId = firstNonAdminEmp.bankId || '';
        setHasSyncedProfile(true);
      }
    } else {
      setApplicantName((currentUser.name || '').replace(/^জনাব\s+/, ''));
      setBankId(currentUser.username || '');
      initialBankId = currentUser.username || '';
      
      const matchedEmp = employees.find((e: Employee) => 
        e.bankId && e.bankId.trim().toLowerCase() === currentUser.username.trim().toLowerCase()
      );
      if (matchedEmp) {
        setMatchedEmp(matchedEmp);
        setSelectedApplicantEmp(matchedEmp);
        setSelectedCellId(matchedEmp.cellId);
        setApplicantName((matchedEmp.name || '').replace(/^জনাব\s+/, ''));
        setDesignation(cleanDesignationForLeave(matchedEmp.designation));
        if (matchedEmp.fileNo) {
          setFileNo(matchedEmp.fileNo);
        }
        setMobileNo(matchedEmp.mobile || '');
        if (matchedEmp.cell && matchedEmp.cell.name) {
          setCellName(matchedEmp.cell.name);
        }
        initialBankId = matchedEmp.bankId || currentUser.username || '';
        setHasSyncedProfile(true);
      } else {
        setIsProfileUnresolved(true);
        fetch('/api/leaves/log-resolve-failed', { method: 'POST' }).catch(err => logger.error(err));
      }
    }

    if (initialBankId) {
      fetchArchivedLeaves(initialBankId);
    }
  }, [currentUser, employees, hasSyncedProfile]);

  // Prepopulate balance sheet editor when latestLeave changes (only when not editing an existing archive record)
  useEffect(() => {
    if (!editingLeaveId) {
      const activeBankId = selectedApplicantEmp?.bankId || '';
      if (activeBankId !== lastLoadedBankIdRef.current) {
        if (latestLeave) {
          setCasualTotal(latestLeave.casualTotal ?? 20);
          setCasualUsed(latestLeave.casualUsed ?? 0);
          setOrdinaryTotal(latestLeave.ordinaryTotal || 120);
          setOrdinaryUsed(latestLeave.ordinaryUsed ?? 0);
          setSpecialTotal(latestLeave.specialTotal ?? 0);
          setSpecialUsed(latestLeave.specialUsed ?? 0);
        } else {
          // Reset to default starting entitlements
          setCasualTotal(20);
          setCasualUsed(0);
          setOrdinaryTotal(120);
          setOrdinaryUsed(0);
          setSpecialTotal(0);
          setSpecialUsed(0);
        }
        lastLoadedBankIdRef.current = activeBankId;
      }
    }
  }, [latestLeave, editingLeaveId, selectedApplicantEmp]);

  useEffect(() => {
    if (!isAutoBalance || !bankId) return;
    const fetchBalance = async () => {
      setBalanceLoading(true);
      try {
        const year = new Date().getFullYear();
        const res = await fetch(`/api/leaves/balance?bankId=${encodeURIComponent(bankId)}&year=${year}`);
        if (res.ok) {
          const data = await res.json();
          const cUsed = data.casualUsed ?? data.casual?.used;
          const cTotal = data.casualTotal ?? data.casual?.total;
          const oUsed = data.ordinaryUsed ?? data.ordinary?.used;
          const oTotal = data.ordinaryTotal ?? data.ordinary?.total;
          const sUsed = data.specialUsed ?? data.special?.used;
          const sTotal = data.specialTotal ?? data.special?.total;

          if (cTotal !== undefined) setCasualTotal(String(cTotal));
          if (cUsed !== undefined) setCasualUsed(String(cUsed));
          if (oTotal !== undefined) setOrdinaryTotal(String(oTotal));
          if (oUsed !== undefined) setOrdinaryUsed(String(oUsed));
          if (sTotal !== undefined) setSpecialTotal(String(sTotal));
          if (sUsed !== undefined) setSpecialUsed(String(sUsed));
        }
      } catch { /* silent */ }
      setBalanceLoading(false);
    };
    fetchBalance();
  }, [bankId, isAutoBalance, archivedLeaves]);

  // Format YYYY-MM-DD date to DD/MM/YYYY
  const toDisplayDateStr = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${toBanglaDigits(parts[2])}/${toBanglaDigits(parts[1])}/${toBanglaDigits(parts[0])}`;
  };

  // Format YYYY-MM-DD date to full Bengali date string (e.g. ২৫ই জুন ২০২৬)
  const toBanglaFullDateStr = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const monthNamesBN = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const dayVal = parseInt(d, 10);
    const bnDay = toBanglaDigits(dayVal.toString());
    const bnYear = toBanglaDigits(y);
    const bnMonth = monthNamesBN[parseInt(m, 10) - 1] || m;
    
    let suffix = 'ই';
    if (dayVal === 1) suffix = 'লা';
    else if (dayVal === 2) suffix = 'রা';
    else if (dayVal === 3) suffix = 'রা';
    else if (dayVal === 4) suffix = 'ঠা';
    else if (dayVal === 18 || dayVal === 28 || dayVal === 29 || dayVal === 31) suffix = 'শে';
    
    return `${bnDay}${suffix} ${bnMonth}, ${bnYear}`;
  };

  // Convert numbers to Bengali digits


  // Map digits to Bengali written words
  const getBanglaDayWord = (num: number): string => {
    const wordsLookup: Record<number, string> = {
      1: '০১ (এক)', 2: 'দুই (০২)', 3: 'তিন (০৩)', 4: 'চার (০৪)', 5: 'পাঁচ (০৫)',
      6: 'ছয় (০৬)', 7: 'সাত (০৭)', 8: 'আট (০৮)', 9: 'নয় (০৯)', 10: 'দশ (১০)',
      11: 'এগারো (১১)', 12: 'বারো (১২)', 13: 'তেরো (১৩)', 14: 'চৌদ্দ (১৪)', 15: 'পনেরো (১৫)',
      16: 'ষোল (১৬)', 17: 'সতেরো (১৭)', 18: 'আঠারো (১৮)', 19: 'উনিশ (১৯)', 20: 'বিশ (২০)',
      21: 'একুশ (২১)', 22: 'বাইশ (২২)', 23: 'তেইশ (২৩)', 24: 'চব্বিশ (২৪)', 25: 'পঁচিশ (২৫)',
      26: 'ছাব্বিশ (২৬)', 27: 'সাতাশ (২৭)', 28: 'আটাশ (২৮)', 29: 'ঊনত্রিশ (২৯)', 30: 'ত্রিশ (৩০)'
    };
    return wordsLookup[num] || `${toBanglaDigits(num)} (${num})`;
  };

  // Date Check logic: public holiday or weekend
  const isNonWorkingDay = (dateStr: string): boolean => {
    return libIsNonWorkingDay(dateStr, dbHolidays);
  };

  // Validate selected start/end dates against weekends/public holidays
  useEffect(() => {
    if (startDate && isNonWorkingDay(startDate)) {
      setErrorMsg('ছুটির শুরুর তারিখ কোনো ছুটির দিন (যেমন: শুক্র, শনি বা সরকারি ছুটির দিন) হতে পারবে না। অনুগ্রহ করে একটি কর্মদিবস নির্বাচন করুন।');
      setStartDate('');
      setEndDate('');
      setTimeout(() => setErrorMsg(''), 5000);
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate && isNonWorkingDay(endDate)) {
      setErrorMsg('ছুটির শেষের তারিখ কোনো ছুটির দিন (যেমন: শুক্র, শনি বা সরকারি ছুটির দিন) হতে পারবে না। অনুগ্রহ করে একটি কর্মদিবস নির্বাচন করুন।');
      setEndDate('');
      setTimeout(() => setErrorMsg(''), 5000);
    }
  }, [endDate]);

  // Removed auto-reset weekend/holiday block for Application Date to let users select any date.

  // Get contiguous holiday days starting from a specific date forward
  const getSucceedingContiguousHolidaysCount = (startDateStr: string): number => {
    return libGetSucceedingContiguousHolidaysCount(startDateStr, dbHolidays);
  };

  // Leave calculation based on working days and Sandwich Leave rules
  const getCalculatedLeaveDetails = () => {
    return libGetCalculatedLeaveDetails(startDate, endDate, dbHolidays);
  };

  const leaveDetails = getCalculatedLeaveDetails();

  // Handle Dynamic changes on leave type (adjust date picker limits)
  const todayVal = new Date();
  
  // Helper to format Date to YYYY-MM-DD in local time
  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const todayStr = getLocalDateStr(todayVal);

  const tomorrowVal = new Date(todayVal);
  tomorrowVal.setDate(tomorrowVal.getDate() + 1);
  const tomorrowStr = getLocalDateStr(tomorrowVal);

  const yesterdayVal = new Date(todayVal);
  yesterdayVal.setDate(yesterdayVal.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterdayVal);

  const dateLimits = {
    min: (leaveType === 'CASUAL' || leaveType === 'STATION_LEAVE') ? tomorrowStr : undefined,
    max: leaveType === 'POST_FACTO' ? yesterdayStr : undefined
  };

  // Automatically reset invalid dates when type changes or if today is selected
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (startDate) {
      if (startDate === todayStr) {
        timer = setTimeout(() => {
          setStartDate('');
          setEndDate('');
          setErrorMsg('আজকের তারিখে ছুটি নেওয়া যাবে না। অনুগ্রহ করে অন্য দিন নির্বাচন করুন।');
          setTimeout(() => setErrorMsg(''), 5000);
        }, 0);
      } else if (leaveType === 'POST_FACTO' && startDate > yesterdayStr) {
        timer = setTimeout(() => {
          setStartDate('');
          setEndDate('');
        }, 0);
      } else if ((leaveType === 'CASUAL' || leaveType === 'STATION_LEAVE') && startDate < tomorrowStr) {
        timer = setTimeout(() => {
          setStartDate('');
          setEndDate('');
        }, 0);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [leaveType, startDate, todayStr, tomorrowStr, yesterdayStr]);

  // Automatically determine leave type based on dates and location
  useEffect(() => {
    if (!startDate) return;

    if (startDate < todayStr) {
      setLeaveType('POST_FACTO');
    } else {
      if (selectedDistrict === 'ঢাকা' || !selectedDistrict) {
        setLeaveType('CASUAL');
      } else {
        setLeaveType('STATION_LEAVE');
      }
    }
  }, [startDate, selectedDistrict, todayStr]);

  // Dynamically calculate remaining leaves
  const getRemaining = (total: number | string, used: number | string) => {
    const tStr = String(total).trim();
    const uStr = String(used).trim();
    if (tStr === '-' || uStr === '-' || tStr === '' || uStr === '') {
      return '-';
    }
    const totalNum = parseInt(tStr, 10);
    const usedNum = parseInt(uStr, 10);
    if (isNaN(totalNum) || isNaN(usedNum)) {
      return '-';
    }
    return Math.max(0, totalNum - usedNum);
  };

  // Single day validation and wording logic
  const isSingleDay = startDate && endDate && startDate === endDate;

  // Dynamic Leave Increment calculation: Include active application days for casual leave
  const appliedDays = (startDate || endDate) 
    ? (isSingleDay ? 1 : (leaveDetails.actualDeducted > 0 ? leaveDetails.actualDeducted : 1)) 
    : 0;

  const previousUsedNum = parseInt(String(casualUsed || 0), 10) || 0;
  const totalEntitledNum = parseInt(String(casualTotal || 20), 10) || 20;

  // When applying for casual / post-facto / station leave, automatically increment used days by current application days
  const currentCasualUsed = (leaveType === 'CASUAL' || leaveType === 'POST_FACTO' || leaveType === 'STATION_LEAVE')
    ? (previousUsedNum + appliedDays)
    : previousUsedNum;

  const currentCasualRemaining = Math.max(0, totalEntitledNum - currentCasualUsed);

  const currentOrdinaryRemaining = getRemaining(ordinaryTotal, ordinaryUsed);
  const currentSpecialRemaining = getRemaining(specialTotal, specialUsed);

  // Filter Covering Officers: Restricted strictly to the same cell, excluding the applicant themselves
  const eligibleCoveringOfficers = sortEmployeesBySeniority(
    employees.filter((emp: Employee) => {
      const activeEmp = selectedApplicantEmp || matchedEmp;
      if (!activeEmp) return true; // Show all as fallback if current user not resolved
      return emp.cellId === activeEmp.cellId && emp.id !== activeEmp.id;
    })
  );

  const matchedDelegate = eligibleCoveringOfficers.find(e => String(e.id) === delegateId);
  const delegateName = matchedDelegate ? matchedDelegate.name : '';
  const delegateDesignation = matchedDelegate ? cleanDesignationForLeave(matchedDelegate.designation) : '';

  // Single day validation and wording logic
  const displayDaysWord = isSingleDay ? getBanglaDayWord(1) : (leaveDetails.actualDeducted > 0 ? getBanglaDayWord(leaveDetails.actualDeducted) : '');

  const appYear = applicationDate ? applicationDate.split('-')[0] : new Date().getFullYear().toString();

  // Format delegate name and designation
  const renderDelegateInfo = () => {
    if (!delegateId || !matchedDelegate) {
      return (
        <strong className="text-red-600 dark:text-red-400 font-bold bold-text" style={{ color: 'red', fontWeight: 'bold' }}>
          [দায়িত্ব পালনকারী কর্মকর্তা নির্বাচন করুন]
        </strong>
      );
    }
    const cleanName = delegateName.replace(/^জনাব\s+/, '').trim();
    if (cleanName.includes('কিবরিয়া') || cleanName.includes('কিবর')) {
      return <span className="italic" style={{ fontStyle: 'italic' }}>জনাব জি.এস.কিবরিয়া, সিনিয়র অফিসার-আইটি</span>;
    }
    return <span className="italic" style={{ fontStyle: 'italic' }}>জনাব {cleanName}, {delegateDesignation}</span>;
  };

  // Format stay location dynamic text
  const formatStayLocationText = () => {
    if (!selectedDistrict) {
      return (
        <strong className="text-red-600 dark:text-red-400 font-bold bold-text" style={{ color: 'red', fontWeight: 'bold' }}>
          [জেলা নির্বাচন করুন]
        </strong>
      );
    }
    return selectedDistrict;
  };

  // Format Subject
  const formatSubject = () => {
    const daysWord = isSingleDay ? getBanglaDayWord(1) : getBanglaDayWord(leaveDetails.actualDeducted);
    switch (leaveType) {
      case 'CASUAL':
        return `বিষয়ঃ ${daysWord} দিনের নৈমিত্তিক ছুটি মঞ্জুরির আবেদন।`;
      case 'POST_FACTO':
        return `বিষয়ঃ ${daysWord} দিনের ঘটনাত্তোর নৈমিত্তিক ছুটির জন্য আবেদন।`;
      case 'STATION_LEAVE':
        return `বিষয়ঃ ${daysWord} দিনের কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটির জন্য আবেদন।`;
      default:
        return `বিষয়ঃ ${daysWord} দিনের নৈমিত্তিক ছুটি মঞ্জুরির আবেদন।`;
    }
  };

  // Dropdown Validation Logic
  const getDropdownValidation = () => {
    const missing = [];
    if (currentUser?.role === 'ADMIN' && !selectedApplicantEmp) {
      missing.push('আবেদনকারী কর্মকর্তা');
    }
    if (!selectedDistrict) {
      missing.push('ছুটিতে থাকাকালীন অবস্থান (জেলা)');
    }
    if (!leaveType) {
      missing.push('আবেদনের ধরণ');
    }
    if (eligibleCoveringOfficers.length > 0 && !delegateId) {
      missing.push('ছুটিতে দায়িত্ব পালনকারী কর্মকর্তা');
    }
    // Mobile number is now optional as requested
    
    if (missing.length > 0) {
      return {
        isValid: false,
        message: `আপনি ড্রপডাউন মেন্যু থেকে এই ইনফোরমেশন (${missing.join(' ও ')}) সিলেক্ট করতে ভুলে গিয়েছেন।`
      };
    }

    if (startDate && isNonWorkingDay(startDate)) {
      return {
        isValid: false,
        message: 'ছুটির শুরুর তারিখ কোনো ছুটির দিন (যেমন: শুক্র, শনি বা সরকারি ছুটির দিন) হতে পারবে না। অনুগ্রহ করে একটি কর্মদিবস নির্বাচন করুন।'
      };
    }
    if (endDate && isNonWorkingDay(endDate)) {
      return {
        isValid: false,
        message: 'ছুটির শেষের তারিখ কোনো ছুটির দিন (যেমন: শুক্র, শনি বা সরকারি ছুটির দিন) হতে পারবে না। অনুগ্রহ করে একটি কর্মদিবস নির্বাচন করুন।'
      };
    }
    
    return {
      isValid: true,
      message: 'আপনার আবেদন এখন প্রিন্ট করার জন্য সম্পূর্ণরূপে প্রস্তুত, এখন প্রিন্ট প্রিভিউ বা পিডিএফ ডাউনলোড করার জন্য প্রস্তুত।'
    };
  };

  const handlePrint = async () => {
    // Automatically save or update to archive first, but make it non-blocking
    handleSaveToArchive().catch(console.error);
    
    // Trigger standard print viewport immediately
    window.print();
  };

  const handleDownloadDocx = async () => {
    try {
      const { generateLeaveDocx } = await import('@/lib/docx-generator');
      const delegateEmp = employees.find(e => String(e.id) === delegateId);

      let bodyText = '';
      if (leaveType === 'POST_FACTO') {
        bodyText = isSingleDay
          ? `যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত ও পারিবারিক জরুরি প্রয়োজনে আমি গত ${startDate ? toDisplayDateStr(startDate) : ''} ইং তারিখে ০১ (এক) দিন অফিসে উপস্থিত হতে পারিনি বিধায় উক্ত ০১ (এক) দিনের ঘটনাত্তোর নৈমিত্তিক ছুটি মঞ্জুরের জন্য বিনীত আবেদন জানাচ্ছি।`
          : `যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত ও পারিবারিক জরুরি প্রয়োজনে আমি গত ${startDate ? toDisplayDateStr(startDate) : ''} হতে ${endDate ? toDisplayDateStr(endDate) : ''} ইং তারিখ পর্যন্ত মোট ${displayDaysWord} দিনের ঘটনাত্তোর নৈমিত্তিক ছুটি মঞ্জুরের জন্য বিনীত আবেদন জানাচ্ছি।`;
      } else if (leaveType === 'STATION_LEAVE') {
        bodyText = isSingleDay
          ? `যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত প্রয়োজনে আগামী ${startDate ? toDisplayDateStr(startDate) : ''} ইং তারিখে আমার ${selectedDistrict || 'ঢাকার বাইরে'} অবস্থান করা প্রয়োজন। উক্ত ০১ (এক) দিন কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটি মঞ্জুরের জন্য বিনীত আবেদন জানাচ্ছি।`
          : `যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত প্রয়োজনে আগামী ${startDate ? toDisplayDateStr(startDate) : ''} হতে ${endDate ? toDisplayDateStr(endDate) : ''} ইং তারিখ পর্যন্ত আমার ${selectedDistrict || 'ঢাকার বাইরে'} অবস্থান করা প্রয়োজন। উক্ত ${displayDaysWord} দিন কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটি মঞ্জুরের জন্য বিনীত আবেদন জানাচ্ছি।`;
      } else {
        bodyText = isSingleDay
          ? `যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত প্রয়োজনে আগামী ${startDate ? toDisplayDateStr(startDate) : ''} ইং তারিখে আমার ছুটি প্রয়োজন। উক্ত ০১ (এক) দিনের নৈমিত্তিক ছুটি মঞ্জুরের জন্য বিনীত আবেদন জানাচ্ছি।`
          : `যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত প্রয়োজনে আগামী ${startDate ? toDisplayDateStr(startDate) : ''} হতে ${endDate ? toDisplayDateStr(endDate) : ''} ইং তারিখ পর্যন্ত মোট ${displayDaysWord} দিনের নৈমিত্তিক ছুটি মঞ্জুরের জন্য বিনীত আবেদন জানাচ্ছি।`;
      }

      const blob = await generateLeaveDocx({
        applicationDateStr: toBanglaFullDateStr(applicationDate),
        applicantName,
        designation,
        bankId,
        fileNo,
        cellName,
        leaveType,
        subjectText: leaveDetails.actualDeducted > 0 || isSingleDay ? formatSubject() : 'বিষয়ঃ নৈমিত্তিক ছুটি মঞ্জুরির আবেদন।',
        bodyParagraphs: [
          leaveType === 'STATION_LEAVE' ? 'মহোদয়,' : 'প্রিয় মহোদয়,',
          bodyText,
          'অতএব, মহোদয়ের নিকট বিনীত প্রার্থনা এই যে, আমাকে উক্ত ছুটি মঞ্জুর করে বাধিত করবেন।'
        ],
        leaveLocation: selectedDistrict || 'ঢাকা',
        mobileNo,
        delegateOfficerName: delegateEmp?.name,
        delegateOfficerDesig: cleanDesignationForLeave(delegateEmp?.designation || ''),
        appYear: toBanglaDigits(appYear),
        casualTotal: toBanglaDigits(casualTotal),
        casualUsed: toBanglaDigits(currentCasualUsed),
        casualRemaining: toBanglaDigits(currentCasualRemaining),
        ordinaryTotal: toBanglaDigits(ordinaryTotal),
        ordinaryUsed: toBanglaDigits(ordinaryUsed),
        ordinaryRemaining: toBanglaDigits(currentOrdinaryRemaining),
        specialTotal: toBanglaDigits(specialTotal),
        specialUsed: toBanglaDigits(specialUsed),
        specialRemaining: toBanglaDigits(currentSpecialRemaining),
        daysCount: isSingleDay ? 1 : leaveDetails.actualDeducted,
        daysInBanglaWords: displayDaysWord,
        leaveTypeBangla: leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : leaveType === 'STATION_LEAVE' ? 'কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক' : 'নৈমিত্তিক'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Leave_Application_${bankId || 'Officer'}_${applicationDate}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Error generating DOCX document:', err);
    }
  };

  const validation = getDropdownValidation();

  return (
    <AuthGuard>
      <div className="space-y-6 pb-12 font-sans">
        
        {/* TOP BAR / NAVIGATION */}
        <LeaveFormHeader handlePrint={handlePrint} handleDownloadDocx={handleDownloadDocx} />

        {/* Loading Spinner */}
        {loading ? (
          <div className="no-print flex flex-col items-center justify-center py-24 space-y-3 glass-card rounded-2xl">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">প্রয়োজনীয় তথ্যসমূহ লোড হচ্ছে...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Banner Messages */}
            <div className="no-print space-y-3">
              {successMsg && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 text-emerald-805 dark:text-emerald-305 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm">
                  <AlertCircle size={14} className="text-rose-500" />
                  {errorMsg}
                </div>
              )}
              {editingLeaveId && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-xl flex justify-between items-center shadow-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                    আপনি বর্তমানে একটি সংরক্ষিত আবেদন (আইডি #{toBanglaDigits(editingLeaveId)}) এডিট করছেন।
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-350 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-lg transition-colors cursor-pointer text-[10px] font-extrabold"
                  >
                    বাতিল করুন
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* LEFT: Leaf Generator Settings Form (35% width on desktop) */}
              <div className="no-print xl:col-span-4 space-y-6">

                {/* Tab Switcher */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 pb-px">
                  <button
                    type="button"
                    onClick={() => setActiveTab('NEW')}
                    className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      activeTab === 'NEW'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-705'
                    }`}
                  >
                    নতুন আবেদন ফর্ম
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ARCHIVE')}
                    className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      activeTab === 'ARCHIVE'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-705'
                    }`}
                  >
                    আর্কাইভ ও বিগত আবেদনসমূহ
                  </button>
                </div>

                {activeTab === 'NEW' ? (
                  <div className="space-y-6">
                    {isProfileUnresolved && (
                      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-xl flex items-center gap-3 shadow-sm animate-pulse">
                        <AlertCircle size={18} className="text-rose-605 shrink-0" />
                        <p>আপনার কর্মকর্তা প্রোফাইল সিস্টেমে খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
                      </div>
                    )}
                    
                    {/* Box 1: applicant information */}
              <Card
                title={
                  <span className="flex items-center gap-2">
                    <User size={16} className="text-primary-600" />
                    আবেদনকারীর তথ্য
                  </span>
                }
              >

                <div className="space-y-3.5 text-xs font-sans">
                  {currentUser?.role === 'ADMIN' && (
                    <>
                      <div className="space-y-1.5 pb-2">
                        <label htmlFor="selectedCellId" className="font-bold text-indigo-700 dark:text-indigo-400 block">শাখা/সেল নির্বাচন করুন:</label>
                        <select
                          id="selectedCellId"
                          value={selectedCellId}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value, 10) : '';
                            setSelectedCellId(val);
                            setSelectedApplicantEmp(null);
                            setApplicantName('');
                            setDesignation('');
                            setBankId('');
                            setFileNo('');
                            setMobileNo('');
                            setCellName('');
                            setDelegateId('');
                          }}
                          className="w-full px-3 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-xl outline-none focus:border-indigo-550 font-bold cursor-pointer text-indigo-900 dark:text-indigo-300"
                        >
                          <option value="">শাখা/সেল নির্বাচন করুন...</option>
                          {cells.map(cell => (
                            <option key={cell.id} value={cell.id}>{cell.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 pb-2 border-b border-dashed border-indigo-100 dark:border-indigo-950">
                        <label htmlFor="selectedEmployeeId" className="font-bold text-indigo-700 dark:text-indigo-400 block">আবেদনকারী কর্মকর্তা নির্বাচন:</label>
                        <select
                          id="selectedEmployeeId"
                          value={selectedApplicantEmp?.id || ''}
                          disabled={!selectedCellId}
                          onChange={(e) => {
                            const empId = e.target.value;
                            const emp = employees.find(emp => String(emp.id) === empId);
                            if (emp) {
                              setSelectedApplicantEmp(emp);
                              setApplicantName((emp.name || '').replace(/^জনাব\s+/, ''));
                              setDesignation(cleanDesignationForLeave(emp.designation));
                              setBankId(emp.bankId || '');
                              setFileNo(emp.fileNo || '');
                              setMobileNo(emp.mobile || '');
                              if (emp.cell && emp.cell.name) {
                                setCellName(emp.cell.name);
                              }
                              setDelegateId(''); // Reset covering officer dropdown selection
                              if (emp.bankId) {
                                fetchArchivedLeaves(emp.bankId);
                              }
                            }
                          }}
                          className="w-full px-3 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-xl outline-none focus:border-indigo-550 font-bold cursor-pointer text-indigo-900 dark:text-indigo-300 disabled:bg-slate-100 disabled:dark:bg-slate-900 disabled:cursor-not-allowed"
                        >
                          <option value="">কর্মকর্তা নির্বাচন করুন...</option>
                          {(() => {
                            const displayEmps = employees.filter((emp) => {
                              if (currentUser?.role === 'ADMIN') {
                                  return emp.bankId?.trim().toLowerCase() !== currentUser.username?.trim().toLowerCase();
                              }
                              return true;
                            });
                            const cellEmps = sortEmployeesBySeniority(displayEmps.filter(emp => emp.cellId === selectedCellId));
                            return cellEmps.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} ({cleanDesignationForLeave(emp.designation)})
                              </option>
                            ));
                          })()}
                        </select>
                      </div>
                    </>
                  )}
                  {/* Name field */}
                  <div className="space-y-1">
                    <label htmlFor="applicantName" className="font-bold text-slate-700 dark:text-slate-300">নাম:</label>
                    <input 
                      id="applicantName"
                      type="text" 
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      readOnly={currentUser?.role !== 'ADMIN'}
                      className={`w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-550 text-slate-800 dark:text-slate-100 font-bold ${currentUser?.role !== 'ADMIN' ? 'bg-slate-100 dark:bg-slate-950 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-900'}`}
                    />
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label htmlFor="designation" className="font-bold text-slate-700 dark:text-slate-300">পদবী:</label>
                    <input 
                      id="designation"
                      type="text" 
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      readOnly={currentUser?.role !== 'ADMIN'}
                      className={`w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-550 text-slate-800 dark:text-slate-100 font-semibold ${currentUser?.role !== 'ADMIN' ? 'bg-slate-100 dark:bg-slate-950 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-900'}`}
                    />
                  </div>

                  {/* Cell Name */}
                  <div className="space-y-1">
                    <label htmlFor="cellName" className="font-bold text-slate-700 dark:text-slate-300">বিভাগ/সেল:</label>
                    <input 
                      id="cellName"
                      type="text" 
                      value={cellName}
                      onChange={(e) => setCellName(e.target.value)}
                      readOnly={currentUser?.role !== 'ADMIN'}
                      className={`w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-550 text-slate-800 dark:text-slate-100 font-semibold ${currentUser?.role !== 'ADMIN' ? 'bg-slate-100 dark:bg-slate-950 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-900'}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Bank ID */}
                    <div className="space-y-1">
                      <label htmlFor="bankId" className="font-bold text-slate-700 dark:text-slate-300">ব্যাংক আইডি:</label>
                      <input 
                        id="bankId"
                        type="text" 
                        value={bankId}
                        onChange={(e) => setBankId(e.target.value)}
                        readOnly={currentUser?.role !== 'ADMIN'}
                        className={`w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-550 text-slate-800 dark:text-slate-100 font-mono font-semibold ${currentUser?.role !== 'ADMIN' ? 'bg-slate-100 dark:bg-slate-950 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-900'}`}
                      />
                    </div>

                    {/* File No */}
                    <div className="space-y-1">
                      <label htmlFor="fileNo" className="font-bold text-slate-700 dark:text-slate-300">নথি নম্বর:</label>
                      <input 
                        id="fileNo"
                        type="text" 
                        value={fileNo}
                        onChange={(e) => setFileNo(e.target.value)}
                        placeholder="যেমন: এসও (কম)-১৪৫১৯"
                        readOnly={currentUser?.role !== 'ADMIN'}
                        className={`w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-550 text-slate-800 dark:text-slate-100 font-semibold ${currentUser?.role !== 'ADMIN' ? 'bg-slate-100 dark:bg-slate-950 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-900'}`}
                      />
                    </div>
                  </div>

                  {/* Mobile No */}
                  <div className="space-y-1">
                    <label htmlFor="mobileNo" className="font-bold text-slate-700 dark:text-slate-300">মোবাইল নম্বর:</label>
                    <input 
                      id="mobileNo"
                      type="text" 
                      value={mobileNo}
                      onChange={(e) => setMobileNo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-550 font-mono font-semibold"
                    />
                  </div>
                </div>
              </Card>

              {/* Box 2: leave settings */}
              <Card
                className="!overflow-visible"
                title={
                  <span className="flex items-center gap-2">
                    <CalendarRange size={16} className="text-primary-600" />
                    ছুটির তথ্য ও সময়কাল
                  </span>
                }
              >

                <div className="space-y-3.5 text-xs font-sans">
                  {/* 1. Application Date Picker */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">আবেদনের তারিখ (চিঠির উপরে প্রদর্শিত হবে):</label>
                    <CalendarDatePicker 
                      value={applicationDate}
                      onChange={setApplicationDate}
                      isNonWorkingDay={isNonWorkingDay}
                      toBanglaDigits={toBanglaDigits}
                      placeholder="আবেদনের তারিখ নির্বাচন..."
                    />
                  </div>

                  {/* 2. Leave Type */}
                  <div className="space-y-1">
                    <label htmlFor="leaveType" className="font-bold text-slate-700 dark:text-slate-300">আবেদনের ধরণ:</label>
                    <select
                      id="leaveType"
                      value={leaveType}
                      onChange={(e) => {
                        setLeaveType(e.target.value as any);
                        if (e.target.value) {
                          setShowValidationErrors(false);
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-xl outline-none font-bold cursor-pointer transition-all ${
                        !leaveType && showValidationErrors
                          ? 'border-red-500 focus:border-red-500 dark:border-red-900/80 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-300'
                          : 'border-slate-200 dark:border-slate-800 focus:border-indigo-550 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <option value="">আবেদনের ধরণ নির্বাচন করুন...</option>
                      <option value="CASUAL">ক) নৈমিত্তিক ছুটি</option>
                      <option value="POST_FACTO">খ) ঘটনাত্তোর নৈমিত্তিক ছুটি</option>
                      <option value="STATION_LEAVE">গ) কর্মস্থল ত্যাগের অনুমতি সহ নৈমিত্তিক ছুটি</option>
                    </select>
                    {!leaveType && showValidationErrors && (
                      <p className="text-[10px] text-red-500 font-bold mt-1">
                        ⚠️ দয়া করে আবেদনের ধরণ নির্বাচন করুন।
                      </p>
                    )}
                  </div>

                  {/* 3. District Selection Section */}
                  <div className="space-y-1.5">
                    <label htmlFor="selectedDistrict" className="font-bold text-slate-700 dark:text-slate-300 block">ছুটিতে থাকাকালীন অবস্থান (জেলা):</label>
                    <select
                      id="selectedDistrict"
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value);
                        if (e.target.value) {
                          setShowValidationErrors(false);
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-xl font-bold outline-none cursor-pointer transition-all ${
                        !selectedDistrict && showValidationErrors 
                          ? 'border-red-500 focus:border-red-500 dark:border-red-900/80 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-300' 
                          : 'border-slate-200 dark:border-slate-800 focus:border-indigo-550 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <option value="">জেলা সিলেক্ট করুন...</option>
                      {Object.keys(BANGLADESH_AREAS).map(division => (
                        <optgroup key={division} label={division}>
                          {Object.keys(BANGLADESH_AREAS[division as keyof typeof BANGLADESH_AREAS].districts).sort().map(dist => (
                            <option key={dist} value={dist}>{dist}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {!selectedDistrict && showValidationErrors && (
                      <p className="text-[10px] text-red-500 font-bold mt-1">
                        ⚠️ দয়া করে ছুটিতে থাকাকালীন অবস্থান (জেলা) নির্বাচন করুন।
                      </p>
                    )}
                  </div>

                  {/* 4. Duration Mode Selection */}
                  <div className="space-y-1.5 no-print">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">ছুটির মেয়াদ:</label>
                    <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl w-fit border border-slate-200/50 dark:border-slate-800/40">
                      <button
                        type="button"
                        onClick={() => {
                          setDurationMode('SINGLE');
                          if (startDate) {
                            setEndDate(startDate);
                          }
                        }}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          durationMode === 'SINGLE'
                            ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        ১ দিন (একক দিন)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDurationMode('MULTIPLE')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          durationMode === 'MULTIPLE'
                            ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        একাধিক দিন
                      </button>
                    </div>
                  </div>

                  {/* 5. Date Pickers (Grid / Single) */}
                  {durationMode === 'SINGLE' ? (
                    /* Single Date Picker */
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">ছুটির তারিখ:</label>
                      <CalendarDatePicker 
                        value={startDate}
                        onChange={(val) => {
                          setStartDate(val);
                          setEndDate(val);
                        }}
                        isNonWorkingDay={isNonWorkingDay}
                        toBanglaDigits={toBanglaDigits}
                        minDate={dateLimits.min}
                        maxDate={dateLimits.max}
                        placeholder="ছুটির তারিখ নির্বাচন..."
                      />
                    </div>
                  ) : (
                    /* Multiple Date Pickers (Grid) */
                    <div className="grid grid-cols-2 gap-3">
                      {/* Start Date */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">শুরুর তারিখ:</label>
                        <CalendarDatePicker 
                          value={startDate}
                          onChange={setStartDate}
                          isNonWorkingDay={isNonWorkingDay}
                          toBanglaDigits={toBanglaDigits}
                          minDate={dateLimits.min}
                          maxDate={dateLimits.max}
                          placeholder="শুরুর তারিখ নির্বাচন..."
                        />
                      </div>

                      {/* End Date */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">শেষের তারিখ:</label>
                        <CalendarDatePicker 
                          value={endDate}
                          onChange={setEndDate}
                          isNonWorkingDay={isNonWorkingDay}
                          toBanglaDigits={toBanglaDigits}
                          minDate={startDate || dateLimits.min}
                          maxDate={dateLimits.max}
                          disabled={!startDate}
                          placeholder="শেষের তারিখ নির্বাচন..."
                        />
                      </div>
                    </div>
                  )}

                  {/* 6. Delegate Officer dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="delegateId" className="font-bold text-slate-700 dark:text-slate-300">ছুটিতে দায়িত্ব পালনকারী কর্মকর্তা:</label>
                    <select
                      id="delegateId"
                      value={delegateId}
                      onChange={(e) => {
                        setDelegateId(e.target.value);
                        if (e.target.value) {
                          setShowValidationErrors(false);
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-xl outline-none font-bold cursor-pointer transition-all ${
                        eligibleCoveringOfficers.length > 0 && !delegateId && showValidationErrors
                          ? 'border-red-500 focus:border-red-500 dark:border-red-900/80 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-300'
                          : 'border-slate-200 dark:border-slate-800 focus:border-indigo-550 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <option value="">দায়িত্বপ্রাপ্ত কর্মকর্তা নির্বাচন করুন...</option>
                      {eligibleCoveringOfficers.map((emp: Employee) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({cleanDesignationForLeave(emp.designation)})
                        </option>
                      ))}
                    </select>
                    {eligibleCoveringOfficers.length > 0 && !delegateId && showValidationErrors && (
                      <p className="text-[10px] text-red-500 font-bold mt-1">
                        ⚠️ দয়া করে দায়িত্বপ্রাপ্ত কর্মকর্তা নির্বাচন করুন।
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Box 3: editable balance grid */}
              <Card
                title={
                  <span className="flex items-center gap-2">
                    <Settings size={16} className="text-primary-600" />
                    ছুটির ব্যালেন্স শিট এডিটর
                  </span>
                }
              >

                <div className="space-y-3.5 text-xs font-sans">
                  {/* Auto Balance Tracking Header */}
                  <div className="backdrop-blur-sm bg-gradient-to-r from-indigo-50/40 to-teal-50/40 dark:from-indigo-950/20 dark:to-teal-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl p-3 flex flex-col gap-2 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🔄</span>
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">অটো ব্যালেন্স ট্র্যাকিং</h4>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsAutoBalance(!isAutoBalance)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isAutoBalance ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isAutoBalance ? 'translate-x-4.5' : 'translate-x-1'}`} style={{ transform: isAutoBalance ? 'translateX(18px)' : 'translateX(4px)' }} />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">আবেদনকারীর ব্যাংক আইডি অনুযায়ী স্বয়ংক্রিয়ভাবে ভোগকৃত ছুটি হিসাব করা হয়েছে</p>
                    {balanceLoading && (
                      <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                        <div className="h-full bg-indigo-500 w-1/3 rounded animate-[shimmer_1.5s_infinite] relative left-0" style={{ animationName: 'shimmerX' }} />
                      </div>
                    )}
                  </div>
                  {/* Row 1 Casual leaves config */}
                  <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-2">
                    <p className="font-extrabold text-indigo-900 dark:text-indigo-400">নৈমিত্তিক ছুটি ব্যালেন্স:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label htmlFor="casualTotal" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">প্রাপ্তব্য:</label>
                        <input 
                          id="casualTotal"
                          type="text" 
                          value={casualTotal}
                          onChange={(e) => validateAndSetTotal(e.target.value, setCasualTotal, casualUsed, setCasualUsed)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-550"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="casualUsed" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">ভোগকৃত (আগের):</label>
                        <input 
                          id="casualUsed"
                          type="text" 
                          value={casualUsed}
                          onChange={(e) => validateAndSetUsed(e.target.value, setCasualUsed, casualTotal)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-550"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2 Earned leaves config */}
                  <div className="p-3 bg-teal-50/20 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/50 rounded-xl space-y-2">
                    <p className="font-extrabold text-teal-900 dark:text-teal-400">সাধারণ ছুটি ব্যালেন্স:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label htmlFor="ordinaryTotal" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">প্রাপ্তব্য:</label>
                        <input 
                          id="ordinaryTotal"
                          type="text" 
                          value={ordinaryTotal}
                          onChange={(e) => validateAndSetTotal(e.target.value, setOrdinaryTotal, ordinaryUsed, setOrdinaryUsed)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-550"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="ordinaryUsed" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">ভোগকৃত:</label>
                        <input 
                          id="ordinaryUsed"
                          type="text" 
                          value={ordinaryUsed}
                          onChange={(e) => validateAndSetUsed(e.target.value, setOrdinaryUsed, ordinaryTotal)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-550"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3 Special leaves config */}
                  <div className="p-3 bg-purple-50/20 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-xl space-y-2">
                    <p className="font-extrabold text-purple-900 dark:text-purple-400">বিশেষ ছুটি ব্যালেন্স:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label htmlFor="specialTotal" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">প্রাপ্তব্য:</label>
                        <input 
                          id="specialTotal"
                          type="text" 
                          value={specialTotal}
                          onChange={(e) => validateAndSetTotal(e.target.value, setSpecialTotal, specialUsed, setSpecialUsed)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-550"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="specialUsed" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">ভোগকৃত:</label>
                        <input 
                          id="specialUsed"
                          type="text" 
                          value={specialUsed}
                          onChange={(e) => validateAndSetUsed(e.target.value, setSpecialUsed, specialTotal)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-550"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
                    {/* Box 4: sandwich leave details display */}
                    <LeaveSummaryCard 
                      leaveDetails={leaveDetails} 
                      leaveType={leaveType} 
                      toBanglaDigits={toBanglaDigits} 
                    />

                    {/* Save or Update Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSaveToArchive}
                        disabled={isProfileUnresolved}
                        className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md text-center hover:scale-[1.01] active:scale-[0.99] ${
                          isProfileUnresolved
                            ? 'bg-slate-400 cursor-not-allowed shadow-none hover:scale-100'
                            : editingLeaveId 
                              ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/10 hover:shadow-amber-500/20 cursor-pointer' 
                              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10 hover:shadow-indigo-500/20 cursor-pointer'
                        }`}
                      >
                        {editingLeaveId ? 'আর্কাইভ আপডেট করুন (Update)' : 'আর্কাইভে সংরক্ষণ করুন (Save)'}
                      </button>
                    </div>

                  </div>
                ) : (
              <div className="space-y-4">
                
                {/* Latest Application Box */}
                {latestLeave ? (
                  <div className="glass-card p-4 rounded-2xl border border-indigo-150 dark:border-indigo-950 bg-indigo-50/5">
                    <div className="flex justify-between items-center mb-2.5 border-b border-indigo-100/50 dark:border-indigo-950/50 pb-2">
                      <h4 className="font-extrabold text-indigo-950 dark:text-indigo-400 text-xs flex items-center gap-1.5">
                        <FileText size={14} className="text-indigo-600" />
                        লাস্ট বা লেটেস্ট এপ্লিকেশন (সর্বশেষ আবেদন)
                      </h4>
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-850 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                        {toDisplayDateStr(latestLeave.applicationDate)}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1.5 mb-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p>ছুটির ধরণ: <span className="font-bold text-slate-900 dark:text-slate-100">
                        {latestLeave.leaveType === 'CASUAL' ? 'নৈমিত্তিক ছুটি' : latestLeave.leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক ছুটি' : 'কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটি'}
                      </span></p>
                      <p>সময়কাল: <span className="font-bold text-slate-950 dark:text-slate-55">{toDisplayDateStr(latestLeave.startDate)} হতে {toDisplayDateStr(latestLeave.endDate)}</span></p>
                      <p>ভোগকৃত ছুটি দিন: <span className="font-bold text-slate-950 dark:text-slate-55">{toBanglaDigits(
                        latestLeave.startDate === latestLeave.endDate ? 1 : 
                        Math.round((new Date(latestLeave.endDate).getTime() - new Date(latestLeave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                      )} দিন</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadLeavePreview(latestLeave)}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-sm shadow-indigo-500/10 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                      >
                        প্রিন্ট প্রিভিউ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditLeave(latestLeave)}
                        className="py-2 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all text-center cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                      >
                        এডিট করুন
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-6 text-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50">
                    <p className="text-xs text-slate-500 font-bold">কোনো পূর্ববর্তী আবেদন পাওয়া যায়নি।</p>
                  </div>
                )}

                {/* Past Applications List */}
                <LeaveHistoryTable 
                  archivedLeaves={archivedLeaves as any} 
                  toBanglaDigits={toBanglaDigits}
                  toDisplayDateStr={toDisplayDateStr}
                  handleLoadLeavePreview={handleLoadLeavePreview}
                  handleEditLeave={handleEditLeave}
                  handleDeleteLeave={handleDeleteLeave}
                />

              </div>
            )}

          </div>

            {/* RIGHT: Pixel-Perfect A4 Document Sheet Preview (8 columns) */}
            <div className="xl:col-span-8 flex flex-col items-center pb-8">
              
              {/* Live Editor Notification Banner */}
              <div className="no-print w-full max-w-[216mm] mb-3">
                <div className="p-3 bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs font-bold rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <FileEdit size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span><strong>লাইভ অন-স্ক্রিন এডিটর সক্রিয়:</strong> দরখাস্তের যেকোনো লেখায় সরাসরি মাউস দিয়ে ক্লিক করে টাইপ করে এডিট করতে পারবেন। প্রিন্ট বা PDF ফাইলে সংশোধিত ফাইলটিই সেভ হবে।</span>
                  </div>
                </div>
              </div>

              {/* Dropdown Validation Message Banner */}
              <div className="no-print w-full max-w-[216mm] mb-4">
                {validation.isValid ? (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 text-emerald-805 dark:text-emerald-305 text-xs font-bold rounded-2xl flex items-center gap-2.5 shadow-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shrink-0" />
                    <span>{validation.message}</span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-2xl flex items-center gap-2.5 shadow-sm">
                    <AlertCircle size={15} className="text-amber-500 shrink-0" />
                    <span>{validation.message}</span>
                  </div>
                )}
              </div>

              {/* Scrollable Container for Preview Sheet */}
              <div className="w-full max-w-full overflow-x-auto flex justify-center pb-4 no-print-scrollbar">
                {/* Container of simulated sheet */}
                <div 
                  id="printable-leave-sheet" 
                  className="print-legal-layout w-[216mm] min-h-[356mm] bg-white text-black p-[20mm] border-2 border-slate-300 dark:border-slate-800 rounded-3xl print:border-none print:rounded-none print:shadow-none shadow-[0_15px_50px_rgba(0,0,0,0.08)] relative flex flex-col justify-start shrink-0"
                  style={{ contentVisibility: 'auto' }}
                >
                
                {/* 1. Header (Date + Leaves Table) */}
                <div className="flex justify-between items-start font-sans leading-tight">
                  {/* Left block (Date and To address) */}
                  <div className="space-y-4 pt-1 text-xs" contentEditable suppressContentEditableWarning title="ক্লিক করে ঠিকানা এডিট করুন">
                    <p className="font-semibold text-black">
                      তারিখ: {toBanglaFullDateStr(applicationDate)} ইং
                    </p>
                    <div className="space-y-0.5 font-bold text-black text-xs font-sans">
                      <p>উপ-মহাব্যবস্থাপক</p>
                      <p>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
                      <p>জনতা ব্যাংক পিএলসি,</p>
                      <p>প্রধান কার্যালয়, ঢাকা।</p>
                    </div>
                  </div>

                  {/* Right block: Leaves Balance Table */}
                  <div className="w-[85mm] text-[10px] bg-white font-sans text-black">
                    <table className="w-full text-center border-collapse border border-black">
                      <thead>
                        <tr className="border border-black font-bold text-center">
                          <th colSpan={5} className="border border-black px-1.5 py-1 text-center bg-slate-50 text-xs">
                            {toBanglaDigits(appYear)} সালের ছুটির বিবরণ
                          </th>
                        </tr>
                        <tr className="bg-slate-50 font-bold border-b border-black">
                          <th className="border border-black px-1.5 py-0.5 w-[12mm]">ক্র.নং</th>
                          <th className="border border-black px-1.5 py-0.5">ছুটির ধরণ</th>
                          <th className="border border-black px-1 py-0.5 w-[14mm]">প্রাপ্তব্য</th>
                          <th className="border border-black px-1 py-0.5 w-[14mm]">ভোগকৃত</th>
                          <th className="border border-black px-1 py-0.5 w-[14mm]">অবশিষ্ট</th>
                        </tr>
                      </thead>
                      <tbody className="font-semibold" contentEditable suppressContentEditableWarning title="ক্লিক করে ঘরের মান পরিবর্তন করুন">
                        <tr className="border-b border-black">
                          <td className="border border-black px-1 py-0.5">০১.</td>
                          <td className="border border-black px-1.5 py-0.5 text-left">নৈমিত্তিক ছুটি</td>
                          <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(casualTotal)}</td>
                          <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(currentCasualUsed)}</td>
                          <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(currentCasualRemaining)}</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="border border-black px-1 py-0.5">০২.</td>
                          <td className="border border-black px-1.5 py-0.5 text-left">সাধারণ ছুটি</td>
                          <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(ordinaryTotal)}</td>
                          <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(ordinaryUsed)}</td>
                          <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(currentOrdinaryRemaining)}</td>
                        </tr>
                        <tr>
                          <td className="border border-black px-1 py-0.5">০৩.</td>
                          <td className="border border-black px-1.5 py-0.5 text-left">বিশেষ ছুটি</td>
                          <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(specialTotal)}</td>
                          <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(specialUsed)}</td>
                          <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(currentSpecialRemaining)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. SUBJECT */}
                <div style={{ marginTop: '0.55in', marginBottom: '0.25in' }} contentEditable suppressContentEditableWarning title="ক্লিক করে বিষয় এডিট করুন">
                  <p className="text-black text-xs pb-0.5 w-fit bold-text">
                    {leaveDetails.actualDeducted > 0 || isSingleDay ? formatSubject() : 'বিষয়ঃ নৈমিত্তিক ছুটি মঞ্জুরির আবেদন।'}
                  </p>
                </div>

                {/* 3. LETTER BODY */}
                <div className="mt-1.5 text-xs text-black leading-relaxed text-justify space-y-1.5" contentEditable suppressContentEditableWarning title="ক্লিক করে দরখাস্তের মূল বক্তব্য এডিট করুন">
                  <p className="text-xs">{leaveType === 'STATION_LEAVE' ? 'মহোদয়,' : 'প্রিয় মহোদয়,'}</p>
                  
                  {leaveType === 'POST_FACTO' ? (
                    <>
                      <p className="text-black text-xs text-justify">
                        {isSingleDay ? (
                          <>
                            যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত ও পারিবারিক জরুরি প্রয়োজনে আমি গত{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>{startDate ? toDisplayDateStr(startDate) : ''}</strong>{startDate ? ' ইং' : ''} তারিখে{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>০১ (এক)</strong> দিন অফিসে উপস্থিত হতে পারিনি বিধায় উক্ত{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>০১ (এক)</strong> দিনের ঘটনাত্তোর নৈমিত্তিক ছুটির জন্য আবেদন করছি।
                          </>
                        ) : (
                          <>
                            যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত ও পারিবারিক জরুরি প্রয়োজনে আমি গত{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>{startDate ? toDisplayDateStr(startDate) : ''}</strong>{startDate ? ' ইং' : ''} তারিখ হতে{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>{endDate ? toDisplayDateStr(endDate) : ''}</strong>{endDate ? ' ইং' : ''} তারিখ পর্যন্ত মোট{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>{displayDaysWord}</strong> দিন অফিসে উপস্থিত হতে পারিনি বিধায় উক্ত{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>{displayDaysWord}</strong> দিনের ঘটনাত্তোর নৈমিত্তিক ছুটির জন্য আবেদন করছি।
                          </>
                        )}
                        {' '}উল্লেখ্য যে, আমি ছুটিতে থাকাকালীন, অত্র ডিপার্টমেন্টের{' '}
                        {renderDelegateInfo()} তার নিজ দায়িত্বের অতিরিক্ত হিসেবে আমার দায়িত্ব পালন করছেন।
                      </p>

                      <p className="text-black text-xs leading-relaxed text-justify">
                        অতএব মহোদয় সমীপে আবেদন যে, আমার অনুকূলে উক্ত{' '}
                        <strong className="italic" style={{ fontStyle: 'italic' }}>{isSingleDay ? '০১ (এক)' : displayDaysWord}</strong> দিনের ঘটনাত্তোর নৈমিত্তিক ছুটি মঞ্জুরীর অনুমতি দান করে বাধিত করবেন।
                      </p>
                    </>
                  ) : leaveType === 'STATION_LEAVE' ? (
                    <>
                      <p className="text-black text-xs text-justify">
                        {isSingleDay ? (
                          <>
                            যথাবিহিত সম্মানপূর্বক বিনীত নিবেদন এই যে, পারিবারিক ও ব্যক্তিগত জরুরি প্রয়োজনে আমি আগামী{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>{startDate ? toDisplayDateStr(startDate) : ''}</strong>{startDate ? ' ইং' : ''} তারিখে{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>০১ (এক)</strong> দিনের কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটির জন্য আবেদন করছি।
                          </>
                        ) : (
                          <>
                            যথাবিহিত সম্মানপূর্বক বিনীত নিবেদন এই যে, পারিবারিক ও ব্যক্তিগত জরুরি প্রয়োজনে আমি আগামী{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>{startDate ? toDisplayDateStr(startDate) : ''}</strong>{startDate ? ' ইং' : ''} তারিখ হতে{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>{endDate ? toDisplayDateStr(endDate) : ''}</strong>{endDate ? ' ইং' : ''} তারিখ পর্যন্ত{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>{displayDaysWord}</strong> দিনের কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটির জন্য আবেদন করছি।
                          </>
                        )}
                      </p>

                      <p className="text-black text-xs leading-relaxed text-justify">
                        উল্লেখ্য যে, আমি ছুটিতে থাকাকালীন অত্র ডিপার্টমেন্টের{' '}
                        {renderDelegateInfo()} তার নিজ দায়িত্বের অতিরিক্ত হিসেবে আমার দায়িত্ব পালন করবেন।
                      </p>

                      <p className="text-black text-xs leading-relaxed text-justify">
                        অতএব, মহোদয় সমীপে আবেদন এই যে, আমার অনুকূলে উক্ত{' '}
                        <strong className="italic" style={{ fontStyle: 'italic' }}>{isSingleDay ? '০১ (এক)' : displayDaysWord}</strong> দিনের কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটি মঞ্জুরপূর্বক বাধিত করবেন।
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-black text-xs text-justify">
                        {isSingleDay ? (
                          <>
                            যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত ও পারিবারিক জরুরি প্রয়োজনে আমার আগামী{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>{startDate ? toDisplayDateStr(startDate) : ''}</strong>{startDate ? ' ইং' : ''} তারিখে{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>০১ (এক)</strong> দিনের নৈমিত্তিক ছুটির প্রয়োজন।
                          </>
                        ) : (
                          <>
                            যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত ও পারিবারিক জরুরি প্রয়োজনে আমার আগামী{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>{startDate ? toDisplayDateStr(startDate) : ''}</strong>{startDate ? ' ইং' : ''} তারিখ হতে{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>{endDate ? toDisplayDateStr(endDate) : ''}</strong>{endDate ? ' ইং' : ''} তারিখ পর্যন্ত মোট{' '}
                            <strong className="italic" style={{ fontStyle: 'italic' }}>{displayDaysWord}</strong> দিনের নৈমিত্তিক ছুটির প্রয়োজন।
                          </>
                        )}
                      </p>

                      <p className="text-black text-xs leading-relaxed text-justify">
                        উল্লেখ্য যে, আমি ছুটিতে থাকাকালীন, অত্র ডিপার্টমেন্টের{' '}
                        {renderDelegateInfo()} তার নিজ দায়িত্বের অতিরিক্ত হিসেবে আমার দায়িত্ব পালন করবেন।
                      </p>

                      <p className="text-black text-xs leading-relaxed text-justify">
                        অতএব মহোদয় সমীপে আবেদন যে, আমার অনুকূলে উক্ত{' '}
                        <strong className="italic" style={{ fontStyle: 'italic' }}>{isSingleDay ? '০১ (এক)' : displayDaysWord}</strong> দিনের নৈমিত্তিক ছুটি মঞ্জুরীর অনুমতি দান করে বাধিত করবেন।
                      </p>
                    </>
                  )}
                </div>

                {/* 4. SIGNATURE CARD SUMMARY */}
                <div 
                  className="flex justify-between items-start text-xs font-sans leading-tight text-black"
                  style={{ marginTop: '0.55in' }}
                  contentEditable
                  suppressContentEditableWarning
                  title="ক্লিক করে আবেদনকারীর তথ্য ও অবস্থান এডিট করুন"
                >
                  {/* Left Block (Applicant Info Signature block) */}
                  <div className="space-y-1 text-black">
                    <p>আপনার বিশ্বস্ত,</p>
                    <div className="h-12 w-32 mt-1" />
                    <p className="pt-1">নামঃ <strong className="italic" style={{ fontStyle: 'italic' }}>{applicantName || 'সৈয়দ আরিফুল ইসলাম ইমন'}</strong></p>
                    <p>পদবীঃ {cleanDesignationForLeave(designation) || 'সিনিয়র অফিসার-আইটি'}</p>
                    <p className="font-mono">ব্যাংক আইডিঃ {toBanglaDigits(bankId || '০২৬৭৯৫')}</p>
                    {fileNo && <p>ব্যক্তিগত নথি নংঃ {fileNo}</p>}
                    <p>{cellName}</p>
                    <p>জনতা ব্যাংক পিএলসি,</p>
                    <p>প্রধান কার্যালয়, ঢাকা।</p>
                  </div>

                  {/* Right Block (Stay & Mobile during leave) */}
                  <div className="space-y-2 text-black text-xs text-right pr-2">
                    <p>ছুটিতে থাকাকালীন অবস্থানঃ <strong className="italic" style={{ fontStyle: 'italic' }}>{formatStayLocationText()}</strong></p>
                    <p>মোবাইল নংঃ <span className="font-mono">{toBanglaDigits(mobileNo)}</span></p>
                  </div>
                </div>

                {/* 5. RECOMMENDATION & HIERARCHY APPROVAL BOXES */}
                <div 
                  className="pt-0.5 text-xs text-black font-sans space-y-0"
                  style={{ marginTop: '0.55in' }}
                >
                  {/* Recommendation notice line */}
                  <div className="text-left text-black mb-6">
                    আবেদনকারীর অনুকূলে উক্ত <strong className="italic" style={{ fontStyle: 'italic' }}>{displayDaysWord}</strong> দিনের {leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : leaveType === 'STATION_LEAVE' ? 'কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক' : 'নৈমিত্তিক'} ছুটি মঞ্জুরীর সুপারিশ করা হলো।
                  </div>

                  {/* Recommendation signatures */}
                  <div 
                    className="flex justify-between items-center text-xs text-black"
                    style={{ paddingTop: '0.5in', paddingBottom: '0.75in' }}
                  >
                    <div className="text-left leading-normal">
                      <span>সেল ইনচার্জ</span>
                    </div>

                    <div className="text-right leading-normal">
                      <span>সহকারী মহাব্যবস্থাপক</span>
                    </div>
                  </div>

                  {/* AGM/DGM/SPO routing lines */}
                  <div className="text-left" style={{ paddingBottom: '0.75in' }}>
                    <span>এজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</span>
                  </div>
                  <div className="text-left" style={{ paddingBottom: '0.75in' }}>
                    <span>ডিজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</span>
                  </div>
                  <div className="text-left" style={{ paddingBottom: '0.75in' }}>
                    <span>এজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</span>
                  </div>
                  <div className="text-left" style={{ paddingBottom: '0.75in' }}>
                    <span>এসপিও, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</span>
                  </div>
                </div>

              </div>

              {/* Close Scrollable Container */}
              </div>

            </div>

          </div>

        </div>
      )}

      </div>
      
      {/* Dynamic Printing CSS styles */}
      <style>{`
        /* Universal Kalpurush size 10 normal weight styles */
        #printable-leave-sheet, #printable-leave-sheet * {
          font-family: 'SolaimanLipi', 'Nikosh', 'Noto Sans Bengali', sans-serif !important;
          font-size: 15px !important;
          font-style: normal;
          line-height: 1.45 !important;
          color: #000000;
          text-decoration: none;
          letter-spacing: normal !important;
          word-spacing: normal !important;
        }
        .dark #printable-leave-sheet {
          background-color: #090d16 !important;
          border-color: #1e293b !important;
        }
        .dark #printable-leave-sheet .bg-white {
          background-color: transparent !important;
        }
        .dark #printable-leave-sheet * {
          color: #f8fafc !important;
          border-color: #334155 !important;
        }
        .dark #printable-leave-sheet .bg-slate-50,
        .dark #printable-leave-sheet th {
          background-color: #1e293b !important;
        }
        .dark #printable-leave-sheet table,
        .dark #printable-leave-sheet tr,
        .dark #printable-leave-sheet th,
        .dark #printable-leave-sheet td {
          border-color: #334155 !important;
        }
        #printable-leave-sheet, #printable-leave-sheet *:not(.bold-text):not(strong):not(b) {
          font-weight: normal !important;
        }
        #printable-leave-sheet .bold-text, #printable-leave-sheet .bold-text * {
          font-weight: bold !important;
        }

        @media print {
          @page {
            size: legal portrait;
            margin: 0 !important;
          }
          
          /* Force page break behavior */
          html, body {
            width: 216mm !important;
            height: 355mm !important;
            max-height: 355mm !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          /* Hide all non-printable components */
          .no-print, footer, header, nav, aside, [role="navigation"], .sidebar-wrapper, .mobile-nav-top, .sidebar-footer {
            display: none !important;
          }

          /* Reset all parent elements of the sheet */
          main, .flex-1, .p-4, .lg\:p-8, .p-6, .py-6, .xl\:col-span-8, .pb-8 {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            width: auto !important;
            height: auto !important;
            max-height: none !important;
            min-height: auto !important;
            overflow: visible !important;
          }

          /* Position the sheet absolute at the top-left */
          #printable-leave-sheet {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 216mm !important;
            height: 355mm !important;
            min-height: 355mm !important;
            max-height: 355mm !important;
            padding: 15mm 20mm !important;
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

          /* Force high fidelity black on white print text colors and borders */
          #printable-leave-sheet,
          #printable-leave-sheet * {
            background-color: transparent !important;
            color: #000000 !important;
            border-color: #000000 !important;
          }
          #printable-leave-sheet {
            background-color: #ffffff !important;
          }
        }
      `}</style>
    </AuthGuard>
  );
}


