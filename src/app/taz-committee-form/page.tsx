'use client';

import { useState, useEffect } from 'react';
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
  FileText,
  PlusCircle,
  MinusCircle,
  Eye,
  RefreshCw,
  Save,
  Trash
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

interface Employee {
  id: number;
  name: string;
  designation: string;
  cellId: number;
  cell?: {
    id: number;
    name: string;
  };
}

interface Cell {
  id: number;
  name: string;
}

// Custom DatePicker in English that disables weekends & holidays
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

  const monthNamesEN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDisplayDate = () => {
    if (!value) return 'Select Date';
    const [y, m, d] = value.split('-');
    return `${parseInt(d, 10)} ${monthNamesEN[parseInt(m, 10) - 1]} ${y}`;
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
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-655 cursor-pointer text-xs"
            >
              ◀
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {monthNamesEN[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-655 cursor-pointer text-xs"
            >
              ▶
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center mb-1 text-[10px] font-bold text-slate-500">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span className="text-rose-500">Fri</span>
            <span className="text-rose-500">Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {days}
          </div>
        </div>
      )}
    </div>
  );
}

const cleanDesignation = (desig: string): string => {
  if (!desig) return '';
  return desig.replace(/\s*\([^)]*\)/g, '').trim();
};

export default function TazCommitteeFormPage() {
  const { currentUser } = useProfile();
  const { showToast } = useToast();

  const [dbHolidays, setDbHolidays] = useState<Holiday[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'NEW' | 'ARCHIVE'>('NEW');
  const [archivedForms, setArchivedForms] = useState<TazForm[]>([]);
  const [editingFormId, setEditingFormId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form States
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [ref, setRef] = useState('');
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

  // Requester Info (defaults to empty, editable)
  const [requesterName, setRequesterName] = useState('');
  const [requesterDesignation, setRequesterDesignation] = useState('');
  const [requesterOrganization, setRequesterOrganization] = useState('Online Banking Department, Head Office, Janata Bank PLC.');

  // Selected cell & officer mapping for implementers
  const [implementerCells, setImplementerCells] = useState<string[]>([]);
  const [implementers, setImplementers] = useState<Implementer[]>([
    { name: '', designation: '', organization: 'Online Banking Department, Head Office, Janata Bank PLC.' }
  ]);

  // Load holidays, employees, cells & history list
  useEffect(() => {
    const initPage = async () => {
      try {
        const [holRes, formsRes, empRes, cellsRes] = await Promise.all([
          fetch('/api/holidays'),
          fetch('/api/taz-committee-forms'),
          fetch('/api/employees'),
          fetch('/api/cells')
        ]);
        if (holRes.ok) {
          const holidays = await holRes.json();
          setDbHolidays(holidays);
        }
        if (formsRes.ok) {
          const forms = await formsRes.json();
          setArchivedForms(forms);
        }
        if (empRes.ok) {
          const empList = await empRes.json();
          setEmployees(empList);
        }
        if (cellsRes.ok) {
          const cellList = await cellsRes.json();
          setCells(cellList);
        }
      } catch (err) {
        console.error('Error loading Taz form dependencies:', err);
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, []);

  // Adjust implementers array length dynamically based on numTeamMembers
  useEffect(() => {
    setImplementers(prev => {
      const copy = [...prev];
      if (copy.length < numTeamMembers) {
        while (copy.length < numTeamMembers) {
          copy.push({ name: '', designation: '', organization: 'Online Banking Department, Head Office, Janata Bank PLC.' });
        }
      } else if (copy.length > numTeamMembers) {
        return copy.slice(0, numTeamMembers);
      }
      return copy;
    });

    setImplementerCells(prev => {
      const copy = [...prev];
      if (copy.length < numTeamMembers) {
        while (copy.length < numTeamMembers) {
          copy.push('');
        }
      } else if (copy.length > numTeamMembers) {
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

  const handleSelectRequesterOfficer = (empIdStr: string) => {
    if (!empIdStr) {
      setRequesterName('');
      setRequesterDesignation('');
      return;
    }
    const emp = employees.find(e => e.id === parseInt(empIdStr, 10));
    if (emp) {
      setRequesterName(emp.name);
      setRequesterDesignation(cleanDesignation(emp.designation));
    }
  };

  const handleSelectImplementerOfficer = (index: number, empIdStr: string) => {
    if (!empIdStr) {
      handleImplementerChange(index, 'name', '');
      handleImplementerChange(index, 'designation', '');
      return;
    }
    const emp = employees.find(e => e.id === parseInt(empIdStr, 10));
    if (emp) {
      handleImplementerChange(index, 'name', emp.name);
      handleImplementerChange(index, 'designation', cleanDesignation(emp.designation));
      handleImplementerChange(index, 'organization', 'Online Banking Department, Head Office, Janata Bank PLC.');
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formDate) {
      showToast('Date selection is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        formDate,
        ref,
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
        throw new Error(data.message || 'Failed to save form data.');
      }

      showToast(editingFormId ? 'Request Form updated successfully!' : 'Request Form created successfully!', 'success');
      
      const formsRes = await fetch('/api/taz-committee-forms');
      if (formsRes.ok) {
        const forms = await formsRes.json();
        setArchivedForms(forms);
      }

      resetForm();
      setActiveTab('ARCHIVE');
    } catch (err: any) {
      showToast(err.message || 'Error occurred while saving.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (form: TazForm) => {
    setEditingFormId(form.id);
    setFormDate(form.formDate);
    setRef(form.ref);
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
    showToast('Loaded request into editor panel.', 'info');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    try {
      const res = await fetch(`/api/taz-committee-forms/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Delete failed.');
      }
      showToast('Record deleted successfully!', 'success');
      setArchivedForms(prev => prev.filter(f => f.id !== id));
      if (editingFormId === id) {
        resetForm();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const resetForm = () => {
    setEditingFormId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setRef('');
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
    setRequesterName('');
    setRequesterDesignation('');
    setRequesterOrganization('Online Banking Department, Head Office, Janata Bank PLC.');
    setImplementers([{ name: '', designation: '', organization: 'Online Banking Department, Head Office, Janata Bank PLC.' }]);
    setImplementerCells(['']);
  };

  const isNonWorking = (dateStr: string) => {
    return isNonWorkingDay(dateStr, dbHolidays);
  };

  const formatDateToDMY = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatDateTimeForPrint = (dateTimeStr: string): string => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = String(date.getFullYear()).slice(-2);
    
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${d}.${m}.${y} (${hours}:${minutes} ${ampm})`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
        
        {/* Page Title & Tab Controllers */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 no-print">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
              📝 TAZ Committee Request Form
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
                activeTab === 'NEW' && !editingFormId
                  ? 'bg-white dark:bg-slate-800 text-indigo-655 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Request
            </button>
            {editingFormId && (
              <button
                onClick={() => setActiveTab('NEW')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  activeTab === 'NEW' && editingFormId
                    ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Edit Mode
              </button>
            )}
            <button
              onClick={() => setActiveTab('ARCHIVE')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'ARCHIVE' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-655 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Request History ({archivedForms.length})
            </button>
          </div>
        </div>

        {/* Dynamic Split Screen Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Controls & Forms (5 Columns width on desktop) */}
          <div className="no-print xl:col-span-5 space-y-6">
            
            {activeTab === 'NEW' ? (
              <form onSubmit={handleSave} className="space-y-6">
                
                {/* Save status notification banner inside the form */}
                {editingFormId && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold">You are currently editing Request ID: #{editingFormId}</span>
                    <button 
                      type="button" 
                      onClick={resetForm} 
                      className="text-xs underline hover:text-amber-700 cursor-pointer font-bold"
                    >
                      Cancel Edit
                    </button>
                  </div>
                )}

                <Card className="p-5 space-y-5 border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl">
                  
                  {/* Date & Ref */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">Date & Reference</h3>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">
                        Request Date: <span className="text-red-500">*</span>
                      </label>
                      <CalendarDatePicker 
                        value={formDate} 
                        onChange={setFormDate} 
                        isNonWorkingDay={isNonWorking} 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 dark:text-slate-350 block">Reference No (Ref):</label>
                      <input 
                        type="text" 
                        value={ref} 
                        onChange={(e) => setRef(e.target.value)}
                        placeholder="e.g. JB/CDC/..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-805 dark:text-slate-100 rounded-xl outline-none text-sm font-semibold"
                      />
                    </div>
                  </div>

                  {/* Requisition Fields */}
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <h3 className="text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">Request Parameters</h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-750 block">Request Title:</label>
                        <input 
                          type="text" 
                          value={title} 
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Title of change request"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-805 dark:text-slate-100 rounded-xl outline-none text-sm"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-750 block">Purpose / Objective:</label>
                        <input 
                          type="text" 
                          value={purpose} 
                          onChange={(e) => setPurpose(e.target.value)}
                          placeholder="Purpose of extraction/change"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-805 dark:text-slate-100 rounded-xl outline-none text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-750 block">Application Name:</label>
                          <input 
                            type="text" 
                            value={applicationName} 
                            onChange={(e) => setApplicationName(e.target.value)}
                            placeholder="Application name"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-805 dark:text-slate-100 rounded-xl outline-none text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-750 block">Version (Routine, Subroutine):</label>
                          <input 
                            type="text" 
                            value={versionInfo} 
                            onChange={(e) => setVersionInfo(e.target.value)}
                            placeholder="Version info"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-805 dark:text-slate-100 rounded-xl outline-none text-xs font-semibold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-755 block">Routine Details:</label>
                        <textarea 
                          value={routineDetails} 
                          onChange={(e) => setRoutineDetails(e.target.value)}
                          placeholder="Provide routine details"
                          rows={2}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 text-slate-805 dark:text-slate-100 rounded-xl outline-none text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-755 block">Subroutine Details:</label>
                        <textarea 
                          value={subroutineDetails} 
                          onChange={(e) => setSubroutineDetails(e.target.value)}
                          placeholder="Provide subroutine details"
                          rows={2}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 text-slate-805 dark:text-slate-100 rounded-xl outline-none text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Access checklist switches */}
                  <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <h3 className="text-xs font-black text-indigo-655 dark:text-indigo-400 uppercase tracking-wider">Access Requirements</h3>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-650 block">Backend Access?</label>
                        <select 
                          value={needBackendAccess} 
                          onChange={(e) => setNeedBackendAccess(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none font-bold cursor-pointer"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-650 block">Core FTP Access?</label>
                        <select 
                          value={needCoreFtpAccess} 
                          onChange={(e) => setNeedCoreFtpAccess(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none font-bold cursor-pointer"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-650 block">Browser access?</label>
                        <select 
                          value={needBrowserAccess} 
                          onChange={(e) => setNeedBrowserAccess(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none font-bold cursor-pointer"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-650 block">Port Change?</label>
                        <select 
                          value={browserPortChange} 
                          onChange={(e) => setBrowserPortChange(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none font-bold cursor-pointer"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-650 block">During Transaction hour?</label>
                      <select 
                        value={duringTxHour} 
                        onChange={(e) => setDuringTxHour(e.target.value)}
                        className="w-48 px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none font-bold cursor-pointer"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  {/* Schedules, Team members & Impact */}
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <h3 className="text-xs font-black text-indigo-655 dark:text-indigo-400 uppercase tracking-wider">Schedule, Impact & Team size</h3>
                    
                    <div className="space-y-3">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-750 block">Number of Team Members:</label>
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
                            className="text-slate-500 hover:text-indigo-650 cursor-pointer"
                          >
                            <PlusCircle size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-650 block">Approx Start Schedule:</label>
                          <input 
                            type="datetime-local" 
                            value={approxScheduleStart} 
                            onChange={(e) => setApproxScheduleStart(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 text-slate-805 dark:text-slate-100 rounded-xl outline-none font-semibold font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-650 block">Approx Finish Schedule:</label>
                          <input 
                            type="datetime-local" 
                            value={approxScheduleEnd} 
                            onChange={(e) => setApproxScheduleEnd(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 text-slate-805 dark:text-slate-100 rounded-xl outline-none font-semibold font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-650 block">Execution Start:</label>
                          <input 
                            type="datetime-local" 
                            value={execScheduleStart} 
                            onChange={(e) => setExecScheduleStart(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 text-slate-805 dark:text-slate-100 rounded-xl outline-none font-semibold font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-650 block">Execution Finish:</label>
                          <input 
                            type="datetime-local" 
                            value={execScheduleEnd} 
                            onChange={(e) => setExecScheduleEnd(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 text-slate-805 dark:text-slate-100 rounded-xl outline-none font-semibold font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-750 block">Impact *:</label>
                        <input 
                          type="text" 
                          value={impact} 
                          onChange={(e) => setImpact(e.target.value)}
                          placeholder="e.g. Service downtime info"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-805 dark:text-slate-100 rounded-xl outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Requester Info Details Form */}
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <h3 className="text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">Requester Details</h3>
                    
                    {/* Search officer dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 block">Search / Select Officer (Optional):</label>
                      <select
                        onChange={(e) => handleSelectRequesterOfficer(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-150 rounded-xl outline-none text-xs font-bold cursor-pointer"
                      >
                        <option value="">-- Select Officer --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.designation})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-750 block">Name:</label>
                        <input 
                          type="text" 
                          value={requesterName} 
                          onChange={(e) => setRequesterName(e.target.value)}
                          placeholder="Requester Name"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-xl outline-none text-xs font-bold"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-750 block">Designation:</label>
                        <input 
                          type="text" 
                          value={requesterDesignation} 
                          onChange={(e) => setRequesterDesignation(e.target.value)}
                          placeholder="Designation"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-xl outline-none text-xs font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-750 block">Organization / Dept:</label>
                        <input 
                          type="text" 
                          value={requesterOrganization} 
                          onChange={(e) => setRequesterOrganization(e.target.value)}
                          placeholder="Organization"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-xl outline-none text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Implementers Details Form Grid */}
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-indigo-655 dark:text-indigo-400 uppercase tracking-wider">Implementer Details</h3>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">Team: {numTeamMembers}</span>
                    </div>

                    <div className="space-y-3">
                      {implementers.map((impl, idx) => {
                        const currentCellId = implementerCells[idx] ? parseInt(implementerCells[idx], 10) : '';
                        const filteredEmps = employees.filter(emp => emp.cellId === currentCellId);

                        return (
                          <div key={idx} className="p-3 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-105 dark:border-slate-850 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400">Implementer #{idx + 1} Selection:</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="text-[9px] font-bold text-slate-500 block">Select Cell:</label>
                                <select
                                  value={implementerCells[idx] || ''}
                                  onChange={(e) => {
                                    const newCells = [...implementerCells];
                                    newCells[idx] = e.target.value;
                                    setImplementerCells(newCells);
                                    handleImplementerChange(idx, 'name', '');
                                    handleImplementerChange(idx, 'designation', '');
                                  }}
                                  className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-150 rounded-lg outline-none text-[11px] font-semibold cursor-pointer"
                                >
                                  <option value="">-- Select Cell --</option>
                                  {cells.map((cell) => (
                                    <option key={cell.id} value={cell.id}>
                                      {cell.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[9px] font-bold text-slate-500 block">Select Officer:</label>
                                <select
                                  disabled={!implementerCells[idx]}
                                  onChange={(e) => handleSelectImplementerOfficer(idx, e.target.value)}
                                  className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-805 dark:text-slate-150 rounded-lg outline-none text-[11px] font-semibold cursor-pointer disabled:bg-slate-100 disabled:dark:bg-slate-950"
                                >
                                  <option value="">-- Select Officer --</option>
                                  {filteredEmps.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                      {emp.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                              <input 
                                type="text"
                                required
                                value={impl.name}
                                onChange={(e) => handleImplementerChange(idx, 'name', e.target.value)}
                                placeholder="Implementer Name"
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-805 dark:text-slate-100 rounded-lg outline-none text-[11px] font-bold"
                              />
                              <input 
                                type="text"
                                required
                                value={impl.designation}
                                onChange={(e) => handleImplementerChange(idx, 'designation', e.target.value)}
                                placeholder="Designation"
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-805 dark:text-slate-100 rounded-lg outline-none text-[11px] font-semibold"
                              />
                              <input 
                                type="text"
                                required
                                value={impl.organization}
                                onChange={(e) => handleImplementerChange(idx, 'organization', e.target.value)}
                                placeholder="Organization"
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-805 dark:text-slate-100 rounded-lg outline-none text-[11px] font-semibold"
                              />
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>

                </Card>

                {/* Save button bottom */}
                <div className="flex items-center gap-3 justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    variant="primary"
                    size="md"
                    className="font-bold shadow-lg shadow-indigo-500/10 cursor-pointer w-full"
                  >
                    <Save size={14} className="mr-2 inline" />
                    {saving ? 'Saving...' : editingFormId ? 'Update Request' : 'Save Request'}
                  </Button>
                </div>

              </form>
            ) : (
              /* Archive / History list on the Left */
              <div className="space-y-4">
                {archivedForms.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 italic text-sm">
                    No TAZ Request Form records found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {archivedForms.map((form) => (
                      <Card 
                        key={form.id} 
                        className="p-5 border border-slate-100 dark:border-slate-805 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col justify-between gap-3 hover:shadow-md transition-all rounded-2xl"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">Ref: {form.ref || 'N/A'}</span>
                            <span className="text-[10px] text-slate-400">ID: #{form.id}</span>
                          </div>
                          
                          <p className="text-xs font-bold text-indigo-650 dark:text-indigo-400">{form.title}</p>
                          
                          <div className="text-[10px] text-slate-400 space-y-0.5 font-semibold">
                            <div>📅 Date: {formatDateToDMY(form.formDate)}</div>
                            <div>👥 Team Size: {form.numTeamMembers}</div>
                            <div>👤 Requester: {form.requesterName}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-2">
                          <button
                            onClick={() => {
                              // Load this form data into live state to display preview on the right
                              setEditingFormId(form.id);
                              setFormDate(form.formDate);
                              setRef(form.ref);
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
                              } catch (e) {}
                              showToast(`Loaded Request #${form.id} in live preview!`, 'success');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-indigo-650 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 dark:hover:bg-indigo-950/20 rounded-lg cursor-pointer"
                            title="Load in Live Preview"
                          >
                            <Eye size={12} /> Live Preview
                          </button>
                          <button
                            onClick={() => handleEdit(form)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg cursor-pointer"
                            title="Edit Form"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(form.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg cursor-pointer"
                            title="Delete Form"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Pixel-Perfect A4 Live Preview (7 Columns width on desktop) */}
          <div className="xl:col-span-7 flex flex-col items-center pb-8">
            
            {/* Live Preview actions toolbar matching 4th picture style */}
            <div className="no-print w-full max-w-[210mm] flex items-center justify-between mb-4 gap-3 bg-transparent p-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Live Previewing Area</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  variant="secondary"
                  className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl px-4 py-2 font-bold text-xs cursor-pointer"
                >
                  ← Dashboard
                </Button>
                <Button 
                  onClick={() => window.print()}
                  variant="secondary"
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-850 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl px-4 py-2 font-bold text-xs cursor-pointer"
                >
                  <Printer size={13} /> Print Preview
                </Button>
                <Button 
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-md rounded-xl px-4 py-2 font-bold text-xs cursor-pointer"
                >
                  <Save size={13} /> {editingFormId ? 'Update Request' : 'Save Request'}
                </Button>
              </div>
            </div>

            {/* Scrollable Container for Preview Sheet */}
            <div className="w-full max-w-full overflow-x-auto flex justify-center pb-4 no-print-scrollbar">
              <div 
                id="taz-print-area" 
                className="w-[210mm] min-h-[297mm] bg-white dark:bg-slate-950 text-black dark:text-slate-200 p-[15mm] border-2 border-slate-350 dark:border-slate-800 rounded-3xl print:border-none print:rounded-none print:shadow-none shadow-[0_15px_50px_rgba(0,0,0,0.06)] relative flex flex-col justify-start shrink-0 font-serif text-[11px] leading-relaxed space-y-4"
              >
                
                {/* Header */}
                <div className="text-center space-y-1">
                  <h1 className="text-[20px] font-bold text-black dark:text-white tracking-wide">Janata Bank PLC.</h1>
                  <h2 className="text-[12px] font-bold text-black dark:text-slate-300 uppercase tracking-wider">Central Data Center (CDC)</h2>
                  <div className="inline-block border-b border-black dark:border-slate-750 pb-0.5">
                    <h3 className="text-[11px] font-bold text-black dark:text-slate-300 italic">
                      Data Extraction/Change/Update Request Form for <span className="bg-black dark:bg-slate-800 text-white dark:text-slate-100 px-1.5 py-0.5 not-italic font-mono font-bold">T24 Live</span> Area
                    </h3>
                  </div>
                </div>

                {/* Form Date */}
                <div className="text-right font-bold text-black dark:text-slate-300 mt-2">
                  Date: {formatDateToDMY(formDate)}
                </div>

                {/* Main Attributes Table Grid - 4 Columns structure using colgroup */}
                <table className="w-full border-collapse border border-black dark:border-slate-700 text-left">
                  <colgroup>
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td colSpan={2} className="border border-black dark:border-slate-700 px-2 py-1 font-bold">
                        Ref: <span className="font-normal font-mono">{ref}</span>
                      </td>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">PACS ID :</td>
                      <td className="border border-black dark:border-slate-700 px-2 py-1"></td>
                    </tr>
                    <tr>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Title</td>
                      <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 break-words">{title}</td>
                    </tr>
                    <tr>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Purpose</td>
                      <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 break-words">{purpose}</td>
                    </tr>
                    <tr>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Application Name</td>
                      <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 break-words">{applicationName}</td>
                    </tr>
                    <tr>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Routine Details</td>
                      <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 whitespace-pre-wrap break-words">{routineDetails}</td>
                    </tr>
                    <tr>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Subroutine Details</td>
                      <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 whitespace-pre-wrap break-words">{subroutineDetails}</td>
                    </tr>
                    <tr>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Version (Routine, Subroutine)</td>
                      <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 break-words">{versionInfo}</td>
                    </tr>
                    
                    {/* Access Flags Checklist Grid */}
                    <tr>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold text-[10px]">Need Backend Access? (Yes/No)</td>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-mono font-bold">{needBackendAccess}</td>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold text-[10px]">Need Core FTP Access? (Yes/No)</td>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-mono font-bold">{needCoreFtpAccess}</td>
                    </tr>
                    <tr>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold text-[10px]">Need Browser access? (Yes/No)</td>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-mono font-bold">{needBrowserAccess}</td>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold text-[10px]">Browser Port Change? (Yes/No)</td>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-mono font-bold">{browserPortChange}</td>
                    </tr>
                    <tr>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold text-[10px]">During Transaction hour? (Yes/No)</td>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-mono font-bold">{duringTxHour}</td>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold text-[10px]">Number of Team Member</td>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-mono font-bold">{String(numTeamMembers).padStart(2, '0')}</td>
                    </tr>

                    {/* Schedule Ranges */}
                    <tr>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Approximated Schedule</td>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-bold font-mono">Date</td>
                      <td colSpan={2} className="border border-black dark:border-slate-700 px-2 py-1 font-mono text-center font-bold whitespace-nowrap">
                        {formatDateTimeForPrint(approxScheduleStart)} {approxScheduleEnd ? ` – ${formatDateTimeForPrint(approxScheduleEnd)}` : ''}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Execution Schedule</td>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-bold font-mono">Date</td>
                      <td colSpan={2} className="border border-black dark:border-slate-700 px-2 py-1 font-mono text-center font-bold whitespace-nowrap">
                        {formatDateTimeForPrint(execScheduleStart)} {execScheduleEnd ? ` – ${formatDateTimeForPrint(execScheduleEnd)}` : ''}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Impact *</td>
                      <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 break-words">{impact}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Requester Info Section */}
                <div className="space-y-1">
                  <h4 className="font-bold underline text-black dark:text-white">Requester Details:</h4>
                  <table className="w-full border-collapse border border-black dark:border-slate-700 text-center">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold">
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[30%]">Requester Name</th>
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[25%]">Designation</th>
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[25%]">Organization</th>
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[20%]">Sign</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-10">
                        <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">{requesterName}</td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1">{requesterDesignation}</td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1">{requesterOrganization}</td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* TAAJ Committee Opinion Sign Block */}
                <div className="space-y-1">
                  <h4 className="font-bold underline text-black dark:text-white">TAAJ Committee Opinion:</h4>
                  <table className="w-full border-collapse border border-black dark:border-slate-700 text-center">
                    <tbody>
                      <tr className="h-12">
                        <td className="border border-black dark:border-slate-700 px-2 py-1 w-[20%]"></td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1 w-[20%]"></td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1 w-[20%]"></td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1 w-[20%]"></td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1 w-[20%]"></td>
                      </tr>
                      <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold text-[9px] h-6">
                        <td className="border border-black dark:border-slate-700 px-1 py-0.5">Core Cell</td>
                        <td className="border border-black dark:border-slate-700 px-1 py-0.5">Migration Cell</td>
                        <td className="border border-black dark:border-slate-700 px-1 py-0.5">User Cell</td>
                        <td className="border border-black dark:border-slate-700 px-1 py-0.5">Development & Customization Cell</td>
                        <td className="border border-black dark:border-slate-700 px-1 py-0.5">DGM</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Approval Details Sign Block */}
                <div className="space-y-1">
                  <h4 className="font-bold underline text-black dark:text-white">Approval Details (CDC & Network):</h4>
                  <table className="w-full border-collapse border border-black dark:border-slate-700 text-center">
                    <tbody>
                      <tr className="h-12">
                        <td className="border border-black dark:border-slate-700 px-2 py-1 w-[25%]"></td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1 w-[25%]"></td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1 w-[25%]"></td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1 w-[25%]"></td>
                      </tr>
                      <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold text-[9px] h-6">
                        <td className="border border-black dark:border-slate-700 px-1 py-0.5">CDC</td>
                        <td className="border border-black dark:border-slate-700 px-1 py-0.5">Cell in charge</td>
                        <td className="border border-black dark:border-slate-700 px-1 py-0.5">AGM</td>
                        <td className="border border-black dark:border-slate-700 px-1 py-0.5">DGM</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Implementers Section */}
                <div className="space-y-1">
                  <h4 className="font-bold underline text-black dark:text-white">Implementer Details:</h4>
                  <table className="w-full border-collapse border border-black dark:border-slate-700 text-center">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold">
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[10%]">SL</th>
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[35%]">Name</th>
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[20%]">Designation</th>
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[20%]">Organization</th>
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[15%]">Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {implementers.map((impl, idx) => (
                        <tr key={idx} className="h-8">
                          <td className="border border-black dark:border-slate-700 px-2 py-1 font-mono">{idx + 1}.</td>
                          <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold text-left">{impl.name}</td>
                          <td className="border border-black dark:border-slate-700 px-2 py-1">{impl.designation}</td>
                          <td className="border border-black dark:border-slate-700 px-2 py-1">{impl.organization}</td>
                          <td className="border border-black dark:border-slate-700 px-2 py-1"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Attended by Section */}
                <div className="space-y-1 pt-1">
                  <h4 className="font-bold text-black dark:text-white">Attended by: N/A</h4>
                  <table className="w-full border-collapse border border-black dark:border-slate-700 text-center">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold">
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[10%]">SL#</th>
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[40%]">Name</th>
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[20%]">Designation</th>
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[15%]">Cell</th>
                        <th className="border border-black dark:border-slate-700 px-2 py-1 w-[15%]">Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-8">
                        <td className="border border-black dark:border-slate-700 px-2 py-1 font-mono">1.</td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1"></td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1"></td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1">CDC</td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1"></td>
                      </tr>
                      <tr className="h-8">
                        <td className="border border-black dark:border-slate-700 px-2 py-1 font-mono">2.</td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1"></td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1"></td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1">CDC</td>
                        <td className="border border-black dark:border-slate-700 px-2 py-1"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Global Print Overrides style block */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 15mm 10mm 15mm;
            }
            body {
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
              overflow: visible !important;
            }
            .no-print, header, nav, aside, footer, button, .no-print * {
              display: none !important;
            }
            main, .flex-1, .p-4, .lg\:p-8, .p-6, .py-6, .xl\:col-span-7, .pb-8 {
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
              display: block !important;
            }
            #taz-print-area {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              min-height: auto !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              box-sizing: border-box !important;
              background: #ffffff !important;
              overflow: visible !important;
              display: block !important;
            }
            #taz-print-area,
            #taz-print-area * {
              background-color: transparent !important;
              color: #000000 !important;
              border-color: #000000 !important;
            }
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}
