'use client';

import { useState, useEffect, useRef } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { isNonWorkingDay } from '@/lib/leave-calculator';
import AuthGuard from '@/components/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { 
  Printer, 
  Trash2, 
  Edit2, 
  Plus, 
  FileText, 
  Check, 
  ArrowLeft,
  X,
  PlusCircle,
  MinusCircle
} from 'lucide-react';

interface Implementer {
  name: string;
  designation: string;
  organization: string;
}

interface TazForm {
  id: number;
  formDate: string;
  ref: string;
  pacsId: string;
  title: string;
  purpose: string;
  applicationName: string;
  routineDetails: string;
  subroutineDetails: string;
  versionInfo: string;
  needBackendAccess: string;
  needCoreFtpAccess: string;
  needBrowserAccess: string;
  browserPortChange: string;
  duringTxHour: string;
  numTeamMembers: number;
  approxScheduleStart: string;
  approxScheduleEnd: string;
  execScheduleStart: string;
  execScheduleEnd: string;
  impact: string;
  requesterName: string;
  requesterDesignation: string;
  requesterOrganization: string;
  implementersJson: string; // JSON string of Implementer[]
  createdAt: string;
}

interface Holiday {
  date: string;
  name: string;
  isWorkingDay: boolean;
}

// Custom DatePicker that disables weekends & holidays
interface CalendarDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  isNonWorkingDay: (dateStr: string) => boolean;
}

function CalendarDatePicker({ value, onChange, isNonWorkingDay }: CalendarDatePickerProps) {
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
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

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
    if (!value) return 'তারিখ নির্বাচন করুন';
    const [y, m, d] = value.split('-');
    return `${parseInt(d, 10)}ই ${monthNamesBN[parseInt(m, 10) - 1]} ${y}`;
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
            ? 'bg-indigo-650 text-white font-bold' 
            : isWeekendOrHoliday 
              ? 'text-rose-500 bg-rose-50/10 cursor-not-allowed opacity-40' 
              : 'text-slate-700 hover:bg-slate-100 cursor-pointer font-bold'
        }`}
      >
        {d}
      </button>
    );
  }

  return (
    <div className="relative calendar-picker-container w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-left cursor-pointer transition-all flex items-center justify-between shadow-sm text-sm"
      >
        <span>{getDisplayDate()}</span>
        <span className="text-xs">📅</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-2xl shadow-xl z-30 p-3 select-none">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-900 pb-2">
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-650 cursor-pointer text-xs"
            >
              ◀
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {monthNamesBN[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-650 cursor-pointer text-xs"
            >
              ▶
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center mb-1 text-[10px] font-bold text-slate-500">
            <span>রবি</span>
            <span>সোম</span>
            <span>মঙ্গল</span>
            <span>বুধ</span>
            <span>বৃহ</span>
            <span className="text-rose-500">শুক্র</span>
            <span className="text-rose-500">শনি</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {days}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TazCommitteeFormPage() {
  const { currentUser } = useProfile();
  const { showToast } = useToast();

  const [dbHolidays, setDbHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'NEW' | 'ARCHIVE'>('NEW');
  const [archivedForms, setArchivedForms] = useState<TazForm[]>([]);
  const [printForm, setPrintForm] = useState<TazForm | null>(null);
  const [editingFormId, setEditingFormId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form States
  const [formDate, setFormDate] = useState(() => {
    // Defaults to today's date formatted as YYYY-MM-DD
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [ref, setRef] = useState('');
  const [pacsId, setPacsId] = useState('');
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [applicationName, setApplicationName] = useState('');
  const [routineDetails, setRoutineDetails] = useState('');
  const [subroutineDetails, setSubroutineDetails] = useState('');
  const [versionInfo, setVersionInfo] = useState('');
  
  const [needBackendAccess, setNeedBackendAccess] = useState('No');
  const [needCoreFtpAccess, setNeedCoreFtpAccess] = useState('No');
  const [needBrowserAccess, setNeedBrowserAccess] = useState('No');
  const [browserPortChange, setBrowserPortChange] = useState('No');
  const [duringTxHour, setDuringTxHour] = useState('No');
  
  const [numTeamMembers, setNumTeamMembers] = useState(1);
  const [approxScheduleStart, setApproxScheduleStart] = useState('');
  const [approxScheduleEnd, setApproxScheduleEnd] = useState('');
  const [execScheduleStart, setExecScheduleStart] = useState('');
  const [execScheduleEnd, setExecScheduleEnd] = useState('');
  const [impact, setImpact] = useState('');

  // Requester Info (defaulted from logged-in session)
  const [requesterName, setRequesterName] = useState('');
  const [requesterDesignation, setRequesterDesignation] = useState('');
  const [requesterOrganization, setRequesterOrganization] = useState('Central Data Center (CDC)');

  // Implementers Info
  const [implementers, setImplementers] = useState<Implementer[]>([
    { name: '', designation: '', organization: 'Central Data Center (CDC)' }
  ]);

  // Load holidays & history list
  useEffect(() => {
    const initPage = async () => {
      try {
        const [holRes, formsRes] = await Promise.all([
          fetch('/api/holidays'),
          fetch('/api/taz-committee-forms')
        ]);
        if (holRes.ok) {
          const holidays = await holRes.json();
          setDbHolidays(holidays);
        }
        if (formsRes.ok) {
          const forms = await formsRes.json();
          setArchivedForms(forms);
        }
      } catch (err) {
        console.error('Error loading Taz form dependencies:', err);
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, []);

  // Sync current user default info
  useEffect(() => {
    if (currentUser) {
      setRequesterName(currentUser.name || '');
      // Fetch matching designation from employee list if possible
      const getEmployeeDesignation = async () => {
        try {
          const res = await fetch('/api/employees');
          if (res.ok) {
            const list = await res.json();
            const matched = list.find((e: any) => e.userId === currentUser.id);
            if (matched) {
              setRequesterDesignation(matched.designation);
              setImplementers([{
                name: matched.name,
                designation: matched.designation,
                organization: 'Central Data Center (CDC)'
              }]);
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      getEmployeeDesignation();
    }
  }, [currentUser]);

  // Adjust implementers array length dynamically based on numTeamMembers
  useEffect(() => {
    setImplementers(prev => {
      const copy = [...prev];
      if (copy.length < numTeamMembers) {
        // Expand
        while (copy.length < numTeamMembers) {
          copy.push({ name: '', designation: '', organization: 'Central Data Center (CDC)' });
        }
      } else if (copy.length > numTeamMembers) {
        // Shrink
        return copy.slice(0, numTeamMembers);
      }
      return copy;
    });
  }, [numTeamMembers]);

  const handleImplementerChange = (index: number, key: keyof Implementer, value: string) => {
    setImplementers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) {
      showToast('তারিখ নির্বাচন করা আবশ্যক।', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        formDate,
        ref,
        pacsId,
        title,
        purpose,
        applicationName,
        routineDetails,
        subroutineDetails,
        versionInfo,
        needBackendAccess,
        needCoreFtpAccess,
        needBrowserAccess,
        browserPortChange,
        duringTxHour,
        numTeamMembers,
        approxScheduleStart,
        approxScheduleEnd,
        execScheduleStart,
        execScheduleEnd,
        impact,
        requesterName,
        requesterDesignation,
        requesterOrganization,
        implementersJson: JSON.stringify(implementers)
      };

      const url = editingFormId ? `/api/taz-committee-forms/${editingFormId}` : '/api/taz-committee-forms';
      const method = editingFormId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      }

      showToast(editingFormId ? 'TAZ কমিটি ফরম আপডেট করা হয়েছে!' : 'TAZ কমিটি ফরম তৈরি করা হয়েছে!', 'success');
      
      // Reload archive
      const formsRes = await fetch('/api/taz-committee-forms');
      if (formsRes.ok) {
        const forms = await formsRes.json();
        setArchivedForms(forms);
      }

      // Reset form fields
      resetForm();
      setActiveTab('ARCHIVE');
    } catch (err: any) {
      showToast(err.message || 'ডিউটি সংরক্ষণে সমস্যা হয়েছে', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (form: TazForm) => {
    setEditingFormId(form.id);
    setFormDate(form.formDate);
    setRef(form.ref);
    setPacsId(form.pacsId);
    setTitle(form.title);
    setPurpose(form.purpose);
    setApplicationName(form.applicationName);
    setRoutineDetails(form.routineDetails);
    setSubroutineDetails(form.subroutineDetails);
    setVersionInfo(form.versionInfo);
    setNeedBackendAccess(form.needBackendAccess);
    setNeedCoreFtpAccess(form.needCoreFtpAccess);
    setNeedBrowserAccess(form.needBrowserAccess);
    setBrowserPortChange(form.browserPortChange);
    setDuringTxHour(form.duringTxHour);
    setNumTeamMembers(form.numTeamMembers);
    setApproxScheduleStart(form.approxScheduleStart);
    setApproxScheduleEnd(form.approxScheduleEnd);
    setExecScheduleStart(form.execScheduleStart);
    setExecScheduleEnd(form.execScheduleEnd);
    setImpact(form.impact);
    setRequesterName(form.requesterName);
    setRequesterDesignation(form.requesterDesignation);
    setRequesterOrganization(form.requesterOrganization);
    try {
      setImplementers(JSON.parse(form.implementersJson));
    } catch (e) {
      setImplementers([]);
    }
    setActiveTab('NEW');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ফরমটি ডিলিট করতে চান?')) return;
    try {
      const res = await fetch(`/api/taz-committee-forms/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'ডিলিট করতে ব্যর্থ হয়েছে।');
      }
      showToast('রেকর্ডটি সফলভাবে ডিলিট করা হয়েছে!', 'success');
      setArchivedForms(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const resetForm = () => {
    setEditingFormId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setRef('');
    setPacsId('');
    setTitle('');
    setPurpose('');
    setApplicationName('');
    setRoutineDetails('');
    setSubroutineDetails('');
    setVersionInfo('');
    setNeedBackendAccess('No');
    setNeedCoreFtpAccess('No');
    setNeedBrowserAccess('No');
    setBrowserPortChange('No');
    setDuringTxHour('No');
    setNumTeamMembers(1);
    setApproxScheduleStart('');
    setApproxScheduleEnd('');
    setExecScheduleStart('');
    setExecScheduleEnd('');
    setImpact('');
    if (currentUser) {
      setRequesterName(currentUser.name || '');
    }
  };

  const isNonWorking = (dateStr: string) => {
    return isNonWorkingDay(dateStr, dbHolidays);
  };

  // Convert Date from YYYY-MM-DD to DD/MM/YYYY
  const formatDateToDMY = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Print layout preview view
  if (printForm) {
    let parsedImplementers: Implementer[] = [];
    try {
      parsedImplementers = JSON.parse(printForm.implementersJson);
    } catch (e) {
      parsedImplementers = [];
    }

    return (
      <div className="bg-slate-100 min-h-screen p-8 no-print flex flex-col items-center">
        <div className="w-full max-w-4xl flex items-center justify-between mb-6">
          <Button 
            onClick={() => setPrintForm(null)}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 cursor-pointer font-bold"
          >
            <ArrowLeft size={14} /> ফিরে যান
          </Button>
          <Button 
            onClick={() => window.print()}
            variant="primary"
            size="sm"
            className="flex items-center gap-2 shadow-md cursor-pointer font-bold"
          >
            <Printer size={14} /> প্রিন্ট করুন
          </Button>
        </div>

        {/* Standardized A4 Preview Card */}
        <div className="w-[210mm] min-h-[297mm] bg-white p-[15mm] shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 font-serif text-[11px] text-black leading-relaxed flex flex-col space-y-4 print-container">
          
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-[20px] font-bold text-black tracking-wide">Janata Bank PLC.</h1>
            <h2 className="text-[12px] font-bold text-black uppercase tracking-wider">Central Data Center (CDC)</h2>
            <div className="inline-block border-b border-black pb-0.5">
              <h3 className="text-[11px] font-bold text-black italic">
                Data Extraction/Change/Update Request Form for <span className="bg-black text-white px-1.5 py-0.5 not-italic font-mono font-bold">T24 Live</span> Area
              </h3>
            </div>
          </div>

          {/* Form Date */}
          <div className="text-right font-bold text-black mt-2">
            Date: {formatDateToDMY(printForm.formDate)}
          </div>

          {/* Main Attributes Table Grid */}
          <table className="w-full border-collapse border border-black text-left">
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 font-bold w-[25%]">Ref:</td>
                <td className="border border-black px-2 py-1 w-[40%]">{printForm.ref}</td>
                <td className="border border-black px-2 py-1 font-bold w-[15%]">PACS ID:</td>
                <td className="border border-black px-2 py-1 w-[20%]">{printForm.pacsId}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-bold">Title</td>
                <td colSpan={3} className="border border-black px-2 py-1">{printForm.title}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-bold">Purpose</td>
                <td colSpan={3} className="border border-black px-2 py-1">{printForm.purpose}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-bold">Application Name</td>
                <td colSpan={3} className="border border-black px-2 py-1">{printForm.applicationName}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-bold">Routine Details</td>
                <td colSpan={3} className="border border-black px-2 py-1">{printForm.routineDetails}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-bold">Subroutine Details</td>
                <td colSpan={3} className="border border-black px-2 py-1">{printForm.subroutineDetails}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-bold">Version (Routine, Subroutine)</td>
                <td colSpan={3} className="border border-black px-2 py-1">{printForm.versionInfo}</td>
              </tr>
              
              {/* Access Flags Checklist Grid */}
              <tr>
                <td className="border border-black px-2 py-1 font-bold text-[10px]">Need Backend Access? (Yes/No)</td>
                <td className="border border-black px-2 py-1 text-center font-mono font-bold">{printForm.needBackendAccess}</td>
                <td className="border border-black px-2 py-1 font-bold text-[10px]">Need Core FTP Access? (Yes/No)</td>
                <td className="border border-black px-2 py-1 text-center font-mono font-bold">{printForm.needCoreFtpAccess}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-bold text-[10px]">Need Browser access? (Yes/No)</td>
                <td className="border border-black px-2 py-1 text-center font-mono font-bold">{printForm.needBrowserAccess}</td>
                <td className="border border-black px-2 py-1 font-bold text-[10px]">Browser Port Change? (Yes/No)</td>
                <td className="border border-black px-2 py-1 text-center font-mono font-bold">{printForm.browserPortChange}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-bold text-[10px]">During Transaction hour? (Yes/No)</td>
                <td className="border border-black px-2 py-1 text-center font-mono font-bold">{printForm.duringTxHour}</td>
                <td className="border border-black px-2 py-1 font-bold text-[10px]">Number of Team Member</td>
                <td className="border border-black px-2 py-1 text-center font-mono font-bold">{String(printForm.numTeamMembers).padStart(2, '0')}</td>
              </tr>

              {/* Schedule Ranges */}
              <tr>
                <td className="border border-black px-2 py-1 font-bold">Approximated Schedule</td>
                <td className="border border-black px-2 py-1 text-center font-bold font-mono">Date</td>
                <td colSpan={2} className="border border-black px-2 py-1 font-mono text-center">{printForm.approxScheduleStart} {printForm.approxScheduleEnd ? `– ${printForm.approxScheduleEnd}` : ''}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-bold">Execution Schedule</td>
                <td className="border border-black px-2 py-1 text-center font-bold font-mono">Date</td>
                <td colSpan={2} className="border border-black px-2 py-1 font-mono text-center">{printForm.execScheduleStart} {printForm.execScheduleEnd ? `– ${printForm.execScheduleEnd}` : ''}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-bold">Impact *</td>
                <td colSpan={3} className="border border-black px-2 py-1">{printForm.impact}</td>
              </tr>
            </tbody>
          </table>

          {/* Requester Info Section */}
          <div className="space-y-1">
            <h4 className="font-bold underline text-black">Requester Details:</h4>
            <table className="w-full border-collapse border border-black text-center">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-black px-2 py-1 w-[30%]">Requester Name</th>
                  <th className="border border-black px-2 py-1 w-[25%]">Designation</th>
                  <th className="border border-black px-2 py-1 w-[25%]">Organization</th>
                  <th className="border border-black px-2 py-1 w-[20%]">Sign</th>
                </tr>
              </thead>
              <tbody>
                <tr className="h-10">
                  <td className="border border-black px-2 py-1 font-bold">{printForm.requesterName}</td>
                  <td className="border border-black px-2 py-1">{printForm.requesterDesignation}</td>
                  <td className="border border-black px-2 py-1">{printForm.requesterOrganization}</td>
                  <td className="border border-black px-2 py-1"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TAAJ Committee Opinion Sign Block */}
          <div className="space-y-1">
            <h4 className="font-bold underline text-black">TAAJ Committee Opinion:</h4>
            <table className="w-full border-collapse border border-black text-center">
              <tbody>
                <tr className="h-12">
                  <td className="border border-black px-2 py-1 w-[20%]"></td>
                  <td className="border border-black px-2 py-1 w-[20%]"></td>
                  <td className="border border-black px-2 py-1 w-[20%]"></td>
                  <td className="border border-black px-2 py-1 w-[20%]"></td>
                  <td className="border border-black px-2 py-1 w-[20%]"></td>
                </tr>
                <tr className="bg-slate-100 font-bold text-[9px] h-6">
                  <td className="border border-black px-1 py-0.5">Core Cell</td>
                  <td className="border border-black px-1 py-0.5">Migration Cell</td>
                  <td className="border border-black px-1 py-0.5">User Cell</td>
                  <td className="border border-black px-1 py-0.5">Development & Customization Cell</td>
                  <td className="border border-black px-1 py-0.5">DGM</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Approval Details Sign Block */}
          <div className="space-y-1">
            <h4 className="font-bold underline text-black">Approval Details (CDC & Network):</h4>
            <table className="w-full border-collapse border border-black text-center">
              <tbody>
                <tr className="h-12">
                  <td className="border border-black px-2 py-1 w-[25%]"></td>
                  <td className="border border-black px-2 py-1 w-[25%]"></td>
                  <td className="border border-black px-2 py-1 w-[25%]"></td>
                  <td className="border border-black px-2 py-1 w-[25%]"></td>
                </tr>
                <tr className="bg-slate-100 font-bold text-[9px] h-6">
                  <td className="border border-black px-1 py-0.5">CDC</td>
                  <td className="border border-black px-1 py-0.5">Cell in charge</td>
                  <td className="border border-black px-1 py-0.5">AGM</td>
                  <td className="border border-black px-1 py-0.5">DGM</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Implementers Section */}
          <div className="space-y-1">
            <h4 className="font-bold underline text-black">Implementer Details:</h4>
            <table className="w-full border-collapse border border-black text-center">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-black px-2 py-1 w-[10%]">SL</th>
                  <th className="border border-black px-2 py-1 w-[35%]">Name</th>
                  <th className="border border-black px-2 py-1 w-[20%]">Designation</th>
                  <th className="border border-black px-2 py-1 w-[20%]">Organization</th>
                  <th className="border border-black px-2 py-1 w-[15%]">Signature</th>
                </tr>
              </thead>
              <tbody>
                {parsedImplementers.map((impl, idx) => (
                  <tr key={idx} className="h-8">
                    <td className="border border-black px-2 py-1 font-mono">{idx + 1}.</td>
                    <td className="border border-black px-2 py-1 font-bold text-left">{impl.name}</td>
                    <td className="border border-black px-2 py-1">{impl.designation}</td>
                    <td className="border border-black px-2 py-1">{impl.organization}</td>
                    <td className="border border-black px-2 py-1"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Attended by Section */}
          <div className="space-y-1 pt-1">
            <h4 className="font-bold text-black">Attended by: N/A</h4>
            <table className="w-full border-collapse border border-black text-center">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-black px-2 py-1 w-[10%]">SL#</th>
                  <th className="border border-black px-2 py-1 w-[40%]">Name</th>
                  <th className="border border-black px-2 py-1 w-[20%]">Designation</th>
                  <th className="border border-black px-2 py-1 w-[15%]">Cell</th>
                  <th className="border border-black px-2 py-1 w-[15%]">Signature</th>
                </tr>
              </thead>
              <tbody>
                <tr className="h-8">
                  <td className="border border-black px-2 py-1 font-mono">1.</td>
                  <td className="border border-black px-2 py-1"></td>
                  <td className="border border-black px-2 py-1"></td>
                  <td className="border border-black px-2 py-1">CDC</td>
                  <td className="border border-black px-2 py-1"></td>
                </tr>
                <tr className="h-8">
                  <td className="border border-black px-2 py-1 font-mono">2.</td>
                  <td className="border border-black px-2 py-1"></td>
                  <td className="border border-black px-2 py-1"></td>
                  <td className="border border-black px-2 py-1">CDC</td>
                  <td className="border border-black px-2 py-1"></td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* Global Print Overrides style block */}
        <style jsx global>{`
          @media print {
            body {
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print, header, nav, aside, footer, button {
              display: none !important;
            }
            .print-container {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            table {
              border-color: black !important;
            }
            th, td {
              border-color: black !important;
              color: black !important;
            }
            .bg-slate-100 {
              background-color: #f1f5f9 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-sans">
        
        {/* Page title and Tab control */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
              📝 TAZ কমিটি ফরম
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Data Extraction/Change/Update Request Form for T24 Live Area
            </p>
          </div>

          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('NEW');
                resetForm();
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'NEW' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-655 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {editingFormId ? 'ফরম সংশোধন' : 'নতুন ফরম তৈরি'}
            </button>
            <button
              onClick={() => setActiveTab('ARCHIVE')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'ARCHIVE' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-655 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ইতিহাস ও আর্কাইভ ({archivedForms.length})
            </button>
          </div>
        </div>

        {activeTab === 'NEW' ? (
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="p-6 space-y-6 border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl">
              
              {/* Form Date Picker Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">
                    তারিখ (অবশ্যই কার্যদিবস হতে হবে): <span className="text-red-500">*</span>
                  </label>
                  <CalendarDatePicker 
                    value={formDate} 
                    onChange={setFormDate} 
                    isNonWorkingDay={isNonWorking} 
                  />
                  <p className="text-[10px] text-slate-400">
                    ছুটির দিনসমূহ (শুক্র/শনি ও ব্যাংক ছুটির তারিখসমূহ) ডিজেবল থাকবে।
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Ref (রেফারেন্স নম্বর):</label>
                    <input 
                      type="text" 
                      value={ref} 
                      onChange={(e) => setRef(e.target.value)}
                      placeholder="e.g. JB/CDC/..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">PACS ID:</label>
                    <input 
                      type="text" 
                      value={pacsId} 
                      onChange={(e) => setPacsId(e.target.value)}
                      placeholder="e.g. PACS-001"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Form details section */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <h3 className="text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">রিকুইজিশন বিবরণী</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Title (শিরোনাম):</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title of change request"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Purpose (উদ্দেশ্য):</label>
                    <input 
                      type="text" 
                      value={purpose} 
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Purpose of extraction/change"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Application Name:</label>
                    <input 
                      type="text" 
                      value={applicationName} 
                      onChange={(e) => setApplicationName(e.target.value)}
                      placeholder="Application name"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Version (Routine, Subroutine):</label>
                    <input 
                      type="text" 
                      value={versionInfo} 
                      onChange={(e) => setVersionInfo(e.target.value)}
                      placeholder="Version info"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Routine Details:</label>
                    <textarea 
                      value={routineDetails} 
                      onChange={(e) => setRoutineDetails(e.target.value)}
                      placeholder="Provide routine details"
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Subroutine Details:</label>
                    <textarea 
                      value={subroutineDetails} 
                      onChange={(e) => setSubroutineDetails(e.target.value)}
                      placeholder="Provide subroutine details"
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Yes/No Check Options dropdown grid */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <h3 className="text-xs font-black text-indigo-655 dark:text-indigo-400 uppercase tracking-wider">অ্যাক্সেস ও ট্রানজেকশন প্যারামিটার</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-650 dark:text-slate-400 block">Backend Access?</label>
                    <select 
                      value={needBackendAccess} 
                      onChange={(e) => setNeedBackendAccess(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-xs font-bold cursor-pointer"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-650 dark:text-slate-400 block">Core FTP Access?</label>
                    <select 
                      value={needCoreFtpAccess} 
                      onChange={(e) => setNeedCoreFtpAccess(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-xs font-bold cursor-pointer"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-650 dark:text-slate-400 block">Browser access?</label>
                    <select 
                      value={needBrowserAccess} 
                      onChange={(e) => setNeedBrowserAccess(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-xs font-bold cursor-pointer"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-650 dark:text-slate-400 block">Port Change?</label>
                    <select 
                      value={browserPortChange} 
                      onChange={(e) => setBrowserPortChange(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-xs font-bold cursor-pointer"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-650 dark:text-slate-400 block">During Tx hour?</label>
                    <select 
                      value={duringTxHour} 
                      onChange={(e) => setDuringTxHour(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-xs font-bold cursor-pointer"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Schedules, Team members & Impact */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <h3 className="text-xs font-black text-indigo-655 dark:text-indigo-400 uppercase tracking-wider">শিডিউল, প্রভাব ও টিম</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Number of Team Member (টিম সংখ্যা):</label>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => setNumTeamMembers(Math.max(1, numTeamMembers - 1))}
                        className="text-slate-500 hover:text-red-500 cursor-pointer"
                      >
                        <MinusCircle size={20} />
                      </button>
                      <input 
                        type="number" 
                        min={1} 
                        max={10} 
                        value={numTeamMembers} 
                        onChange={(e) => setNumTeamMembers(Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                        className="w-16 px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-center text-sm font-bold"
                      />
                      <button 
                        type="button" 
                        onClick={() => setNumTeamMembers(Math.min(10, numTeamMembers + 1))}
                        className="text-slate-500 hover:text-indigo-600 cursor-pointer"
                      >
                        <PlusCircle size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Approximated Start Schedule:</label>
                    <input 
                      type="text" 
                      value={approxScheduleStart} 
                      onChange={(e) => setApproxScheduleStart(e.target.value)}
                      placeholder="e.g. 29.12.24 (3:00 PM)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Approximated Finish Schedule:</label>
                    <input 
                      type="text" 
                      value={approxScheduleEnd} 
                      onChange={(e) => setApproxScheduleEnd(e.target.value)}
                      placeholder="e.g. 30.12.24 (10:00 PM)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Execution Start Schedule:</label>
                    <input 
                      type="text" 
                      value={execScheduleStart} 
                      onChange={(e) => setExecScheduleStart(e.target.value)}
                      placeholder="e.g. 29.12.24 (3:00 PM)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Execution Finish Schedule:</label>
                    <input 
                      type="text" 
                      value={execScheduleEnd} 
                      onChange={(e) => setExecScheduleEnd(e.target.value)}
                      placeholder="e.g. 30.12.24 (10:00 PM)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Impact * (প্রভাব):</label>
                    <input 
                      type="text" 
                      value={impact} 
                      onChange={(e) => setImpact(e.target.value)}
                      placeholder="e.g. Service downtime info"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Requester Info Details Form */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <h3 className="text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">অনুরোধকারীর বিবরণ (Requester Details)</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Name (নাম):</label>
                    <input 
                      type="text" 
                      value={requesterName} 
                      onChange={(e) => setRequesterName(e.target.value)}
                      placeholder="Requester Name"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-xl outline-none text-sm font-bold"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Designation (পদবী):</label>
                    <input 
                      type="text" 
                      value={requesterDesignation} 
                      onChange={(e) => setRequesterDesignation(e.target.value)}
                      placeholder="Designation"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-xl outline-none text-sm font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Organization (বিভাগ):</label>
                    <input 
                      type="text" 
                      value={requesterOrganization} 
                      onChange={(e) => setRequesterOrganization(e.target.value)}
                      placeholder="Organization"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-xl outline-none text-sm font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Implementers Details Form Grid */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">বাস্তবায়নকারীর বিবরণ (Implementer Details)</h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">টিম সংখ্যা: {numTeamMembers} জন</span>
                </div>

                <div className="space-y-3">
                  {implementers.map((impl, idx) => (
                    <div key={idx} className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-850 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">বাস্তবায়নকারী #{idx + 1} নাম:</label>
                        <input 
                          type="text"
                          required
                          value={impl.name}
                          onChange={(e) => handleImplementerChange(idx, 'name', e.target.value)}
                          placeholder="Name"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-lg outline-none text-xs font-semibold"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">পদবী:</label>
                        <input 
                          type="text"
                          required
                          value={impl.designation}
                          onChange={(e) => handleImplementerChange(idx, 'designation', e.target.value)}
                          placeholder="Designation"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-lg outline-none text-xs font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">প্রতিষ্ঠান / বিভাগ:</label>
                        <input 
                          type="text"
                          required
                          value={impl.organization}
                          onChange={(e) => handleImplementerChange(idx, 'organization', e.target.value)}
                          placeholder="Organization"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-lg outline-none text-xs font-semibold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </Card>

            {/* Save Form button */}
            <div className="flex items-center gap-3 justify-end">
              {editingFormId && (
                <Button
                  type="button"
                  onClick={resetForm}
                  variant="secondary"
                  size="md"
                  className="font-bold cursor-pointer"
                >
                  সংশোধন বাতিল করুন
                </Button>
              )}
              <Button
                type="submit"
                disabled={saving}
                variant="primary"
                size="md"
                className="font-bold shadow-lg shadow-indigo-500/10 cursor-pointer"
              >
                {saving ? 'সংরক্ষণ হচ্ছে...' : editingFormId ? 'সংশোধন সংরক্ষণ করুন' : 'ফরম তৈরি ও সংরক্ষণ করুন'}
              </Button>
            </div>

          </form>
        ) : (
          /* Archive / History Tab panel */
          <div className="space-y-4">
            {archivedForms.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic text-sm">
                কোনো পূর্বে সংরক্ষিত TAZ কমিটি ফরমের রেকর্ড পাওয়া যায়নি।
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {archivedForms.map((form) => {
                  let team: Implementer[] = [];
                  try {
                    team = JSON.parse(form.implementersJson);
                  } catch (e) {}

                  return (
                    <Card 
                      key={form.id} 
                      className="p-5 border border-slate-100 dark:border-slate-805 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all rounded-2xl"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">Ref: {form.ref || 'N/A'}</span>
                          <span className="px-2.5 py-0.5 text-[9px] font-black rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                            PACS ID: {form.pacsId || 'N/A'}
                          </span>
                        </div>
                        
                        <p className="text-xs font-bold text-slate-650 dark:text-slate-350">{form.title}</p>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-bold">
                          <span>📅 তারিখ: {formatDateToDMY(form.formDate)}</span>
                          <span>👥 টিম সংখ্যা: {form.numTeamMembers} জন</span>
                          <span>👤 অনুরোধকারী: {form.requesterName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setPrintForm(form)}
                          className="p-2 text-indigo-650 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-all cursor-pointer"
                          title="প্রিন্ট প্রিভিউ ও প্রিন্ট করুন"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(form)}
                          className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl transition-all cursor-pointer"
                          title="সম্পাদনা করুন"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(form.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </AuthGuard>
  );
}
