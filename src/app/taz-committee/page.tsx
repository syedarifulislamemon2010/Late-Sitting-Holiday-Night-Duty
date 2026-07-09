'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/context/ProfileContext';
import {
  DEFAULT_2026_HOLIDAYS,
  isNonWorkingDay as libIsNonWorkingDay,
  Holiday
} from '@/lib/leave-calculator';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import {
  Printer,
  ArrowLeft,
  ClipboardPen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ──────────────────────────────────────────────────────
// CalendarDatePicker
// ──────────────────────────────────────────────────────
interface CalendarDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  disableHolidays?: boolean;
  isNonWorkingDay: (dateStr: string) => boolean;
  placeholder?: string;
  disabled?: boolean;
}

function CalendarDatePicker({
  value,
  onChange,
  disableHolidays = true,
  isNonWorkingDay,
  placeholder = 'Select Date',
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
    if (isOpen) document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleSelectDay = (day: number) => {
    const s = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(s);
    setIsOpen(false);
  };

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const formatDDMMYYYY = (v: string) => {
    if (!v) return placeholder;
    const [y, m, d] = v.split('-');
    return `${d}/${m}/${y}`;
  };

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(<div key={`e-${i}`} className="w-8 h-8" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isHoliday = isNonWorkingDay(dateStr);
    const isDayDisabled = disableHolidays && isHoliday;
    const isSelected = value === dateStr;
    days.push(
      <button key={`d-${d}`} type="button" disabled={isDayDisabled} onClick={() => handleSelectDay(d)}
        className={`w-8 h-8 flex items-center justify-center text-xs rounded-xl transition-all ${
          isSelected ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-500/30'
            : isDayDisabled ? 'text-rose-500 bg-rose-50/10 dark:bg-rose-950/5 cursor-not-allowed opacity-40 font-medium'
            : isHoliday ? 'text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer font-semibold'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-semibold'
        }`}
        title={isHoliday ? (isDayDisabled ? 'Holiday (Disabled)' : 'Holiday') : undefined}
      >{d}</button>
    );
  }

  return (
    <div className="relative calendar-picker-container font-sans w-full">
      <button type="button" disabled={disabled} onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-semibold text-left cursor-pointer transition-all disabled:bg-slate-100 disabled:dark:bg-slate-950 disabled:cursor-not-allowed flex items-center justify-between shadow-sm text-sm"
      >
        <span>{formatDDMMYYYY(value)}</span>
        <span className="text-xs text-slate-450 dark:text-slate-400">📅</span>
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-3 animate-in fade-in slide-in-from-top-1 duration-150 select-none">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-900 pb-2">
            <button type="button" onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer text-xs font-extrabold">◀</button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{monthNames[month]} {year}</span>
            <button type="button" onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer text-xs font-extrabold">▶</button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center mb-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span>
            <span className="text-rose-500 font-bold">Fri</span><span className="text-rose-500 font-bold">Sat</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center">{days}</div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// DateTimeRangePicker (Start date+time → End date+time)
// ──────────────────────────────────────────────────────
interface DateTimeRangePickerProps {
  startDate: string; startTime: string;
  endDate: string; endTime: string;
  onStartDateChange: (d: string) => void; onStartTimeChange: (t: string) => void;
  onEndDateChange: (d: string) => void; onEndTimeChange: (t: string) => void;
  isNonWorkingDay: (dateStr: string) => boolean;
}

function TimeSelector({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const parseTime = (t: string) => {
    if (!t) return { hours: '12', minutes: '00', ampm: 'AM' };
    const [hh, mm] = t.split(':');
    let h = parseInt(hh, 10);
    const m = mm || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return { hours: String(h).padStart(2, '0'), minutes: m.padStart(2, '0'), ampm };
  };
  const { hours, minutes, ampm } = parseTime(value);
  const updateTime = (h: string, m: string, ap: string) => {
    let h24 = parseInt(h, 10);
    if (ap === 'PM' && h24 !== 12) h24 += 12;
    if (ap === 'AM' && h24 === 12) h24 = 0;
    onChange(`${String(h24).padStart(2, '0')}:${m}`);
  };
  const cls = "w-14 px-1 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500";
  return (
    <div className="flex items-center gap-1">
      <select value={hours} onChange={e => updateTime(e.target.value, minutes, ampm)} className={cls}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</option>)}
      </select>
      <span className="text-slate-500 dark:text-slate-400 font-bold text-xs">:</span>
      <select value={minutes} onChange={e => updateTime(hours, e.target.value, ampm)} className={cls}>
        {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</option>)}
      </select>
      <select value={ampm} onChange={e => updateTime(hours, minutes, e.target.value)} className={cls}>
        <option value="AM">AM</option><option value="PM">PM</option>
      </select>
    </div>
  );
}

function DateTimeRangePicker({ startDate, startTime, endDate, endTime, onStartDateChange, onStartTimeChange, onEndDateChange, onEndTimeChange, isNonWorkingDay }: DateTimeRangePickerProps) {
  return (
    <div className="space-y-3">
      <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-1.5">
        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Start</span>
        <CalendarDatePicker value={startDate} onChange={onStartDateChange} isNonWorkingDay={isNonWorkingDay} disableHolidays={false} placeholder="Start Date" />
        {startDate && <TimeSelector value={startTime} onChange={onStartTimeChange} />}
      </div>
      <div className="flex justify-center"><span className="text-xs font-bold text-slate-400 dark:text-slate-500">▼ to ▼</span></div>
      <div className="p-2.5 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/30 space-y-1.5">
        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">End</span>
        <CalendarDatePicker value={endDate} onChange={onEndDateChange} isNonWorkingDay={isNonWorkingDay} disableHolidays={false} placeholder="End Date" />
        {endDate && <TimeSelector value={endTime} onChange={onEndTimeChange} />}
      </div>
    </div>
  );
}


// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────
const fmtDate = (v: string) => {
  if (!v) return '';
  const [y, m, d] = v.split('-');
  return `${d}/${m}/${y}`;
};

const fmtTime12 = (t: string) => {
  if (!t) return '';
  const [hh, mm] = t.split(':');
  let h = parseInt(hh, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${mm} ${ampm}`;
};

const fmtDateTimeRange = (sd: string, st: string, ed: string, et: string) => {
  if (!sd) return '';
  let result = fmtDate(sd);
  if (st) result += `, ${fmtTime12(st)}`;
  if (ed) {
    result += ` to ${fmtDate(ed)}`;
    if (et) result += `, ${fmtTime12(et)}`;
  }
  return result;
};


// ──────────────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────────────
export default function TazCommitteePage() {
  const { currentUser } = useProfile();
  const [dbHolidays, setDbHolidays] = useState<Holiday[]>([]);

  // Form state
  const [formDate, setFormDate] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  });
  const [ref, setRef] = useState('');
  const [pacsId, setPacsId] = useState('');
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [appName, setAppName] = useState('');
  const [routineDetails, setRoutineDetails] = useState('');
  const [subroutineDetails, setSubroutineDetails] = useState('');
  const [version, setVersion] = useState('');
  const [needBackend, setNeedBackend] = useState('');
  const [needCoreFtp, setNeedCoreFtp] = useState('');
  const [needBrowser, setNeedBrowser] = useState('');
  const [browserPortChange, setBrowserPortChange] = useState('');
  const [duringTransaction, setDuringTransaction] = useState('');
  const [teamMemberCount, setTeamMemberCount] = useState('');
  const [impact, setImpact] = useState('');

  // Approximated Schedule (range)
  const [approxStartDate, setApproxStartDate] = useState('');
  const [approxStartTime, setApproxStartTime] = useState('');
  const [approxEndDate, setApproxEndDate] = useState('');
  const [approxEndTime, setApproxEndTime] = useState('');

  // Execution Schedule (range)
  const [execStartDate, setExecStartDate] = useState('');
  const [execStartTime, setExecStartTime] = useState('');
  const [execEndDate, setExecEndDate] = useState('');
  const [execEndTime, setExecEndTime] = useState('');

  // Requester
  const [requesterName, setRequesterName] = useState('');
  const [requesterDesignation, setRequesterDesignation] = useState('');
  const [requesterOrganization, setRequesterOrganization] = useState('');

  // Implementers (4 rows)
  const [implementers, setImplementers] = useState(
    Array.from({ length: 4 }, () => ({ name: '', designation: '', organization: '' }))
  );

  // Attended by (2 rows)
  const [attendees, setAttendees] = useState([
    { name: '', designation: '', cell: 'CDC' },
    { name: '', designation: '', cell: 'CDC' }
  ]);

  // Collapse state
  const [exp, setExp] = useState({ main: true, requester: true, implementer: true, attended: true });
  const toggle = (k: keyof typeof exp) => setExp(p => ({ ...p, [k]: !p[k] }));

  // Load holidays
  useEffect(() => {
    fetch('/api/holidays').then(r => r.json()).then((d: Holiday[]) => setDbHolidays(d)).catch(() => setDbHolidays([]));
  }, []);

  const isNonWorkingDay = (dateStr: string) => libIsNonWorkingDay(dateStr, dbHolidays);

  // Auto-correct form date if it lands on a holiday
  useEffect(() => {
    if (formDate && isNonWorkingDay(formDate)) {
      const d = new Date(formDate);
      for (let i = 0; i < 10; i++) {
        d.setDate(d.getDate() - 1);
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!isNonWorkingDay(ds)) { setFormDate(ds); break; }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formDate, dbHolidays]);

  const handlePrint = () => { setTimeout(() => window.print(), 200); };

  const updateImpl = (i: number, f: string, v: string) =>
    setImplementers(p => p.map((x, idx) => idx === i ? { ...x, [f]: v } : x));
  const updateAtt = (i: number, f: string, v: string) =>
    setAttendees(p => p.map((x, idx) => idx === i ? { ...x, [f]: v } : x));

  const inputCls = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-medium text-sm transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600";
  const selectCls = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-medium text-sm transition-all shadow-sm cursor-pointer";
  const labelCls = "block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1";

  return (
    <AuthGuard>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0.6in 0.5in; }
          body, html { background: white !important; }
          .no-print, nav, aside, footer, header { display: none !important; }
          #taz-print-preview { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; background: white !important; }
          #taz-print-preview * { color: #000 !important; border-color: #000 !important; background: transparent !important; }
          #taz-print-preview table { border-collapse: collapse !important; }
          #taz-print-preview td, #taz-print-preview th { border: 1px solid #000 !important; padding: 3px 5px !important; }
          #taz-print-preview .bg-slate-50, #taz-print-preview .bg-slate-900 { background: transparent !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Header */}
        <div className="no-print sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"><ArrowLeft size={18} /></Link>
              <div className="flex items-center gap-2">
                <ClipboardPen size={20} className="text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">TAZ Committee Form</h1>
              </div>
            </div>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer">
              <Printer size={16} /><span className="hidden sm:inline">Print Preview</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
          <div className="grid xl:grid-cols-12 gap-6">

            {/* ═══ LEFT: Form ═══ */}
            <div className="xl:col-span-4 space-y-4 no-print">

              {/* Main Fields */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <button type="button" onClick={() => toggle('main')} className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-b border-slate-200 dark:border-slate-800 cursor-pointer">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">📋 Request Information</h2>
                  {exp.main ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>
                {exp.main && (
                  <div className="p-4 space-y-3">
                    <div>
                      <label className={labelCls}>Date</label>
                      <CalendarDatePicker value={formDate} onChange={setFormDate} isNonWorkingDay={isNonWorkingDay} disableHolidays={true} placeholder="Select Date" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={labelCls}>Ref</label><input type="text" value={ref} onChange={e => setRef(e.target.value)} className={inputCls} placeholder="Reference No." /></div>
                      <div><label className={labelCls}>PACS ID</label><input type="text" value={pacsId} onChange={e => setPacsId(e.target.value)} className={inputCls} placeholder="PACS ID" /></div>
                    </div>
                    <div><label className={labelCls}>Title</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="Request Title" /></div>
                    <div><label className={labelCls}>Purpose</label><textarea value={purpose} onChange={e => setPurpose(e.target.value)} className={inputCls + ' min-h-[60px] resize-y'} placeholder="Purpose of the request" /></div>
                    <div><label className={labelCls}>Application Name</label><input type="text" value={appName} onChange={e => setAppName(e.target.value)} className={inputCls} placeholder="Application Name" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={labelCls}>Routine Details</label><input type="text" value={routineDetails} onChange={e => setRoutineDetails(e.target.value)} className={inputCls} placeholder="Routine Details" /></div>
                      <div><label className={labelCls}>Subroutine Details</label><input type="text" value={subroutineDetails} onChange={e => setSubroutineDetails(e.target.value)} className={inputCls} placeholder="Subroutine Details" /></div>
                    </div>
                    <div><label className={labelCls}>Version (Routine, Subroutine)</label><input type="text" value={version} onChange={e => setVersion(e.target.value)} className={inputCls} placeholder="e.g. v1.2, v3.0" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={labelCls}>Need Backend Access?</label><select value={needBackend} onChange={e => setNeedBackend(e.target.value)} className={selectCls}><option value="">-- Select --</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
                      <div><label className={labelCls}>Need Core FTP Access?</label><select value={needCoreFtp} onChange={e => setNeedCoreFtp(e.target.value)} className={selectCls}><option value="">-- Select --</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
                      <div><label className={labelCls}>Need Browser Access?</label><select value={needBrowser} onChange={e => setNeedBrowser(e.target.value)} className={selectCls}><option value="">-- Select --</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
                      <div><label className={labelCls}>Browser Port Change?</label><select value={browserPortChange} onChange={e => setBrowserPortChange(e.target.value)} className={selectCls}><option value="">-- Select --</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
                      <div><label className={labelCls}>During Transaction Hour?</label><select value={duringTransaction} onChange={e => setDuringTransaction(e.target.value)} className={selectCls}><option value="">-- Select --</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
                      <div><label className={labelCls}>Number of Team Member</label><input type="number" min="0" value={teamMemberCount} onChange={e => setTeamMemberCount(e.target.value)} className={inputCls} placeholder="0" /></div>
                    </div>
                    <div>
                      <label className={labelCls}>Approximated Schedule (Start → End)</label>
                      <DateTimeRangePicker startDate={approxStartDate} startTime={approxStartTime} endDate={approxEndDate} endTime={approxEndTime} onStartDateChange={setApproxStartDate} onStartTimeChange={setApproxStartTime} onEndDateChange={setApproxEndDate} onEndTimeChange={setApproxEndTime} isNonWorkingDay={isNonWorkingDay} />
                    </div>
                    <div>
                      <label className={labelCls}>Execution Schedule (Start → End)</label>
                      <DateTimeRangePicker startDate={execStartDate} startTime={execStartTime} endDate={execEndDate} endTime={execEndTime} onStartDateChange={setExecStartDate} onStartTimeChange={setExecStartTime} onEndDateChange={setExecEndDate} onEndTimeChange={setExecEndTime} isNonWorkingDay={isNonWorkingDay} />
                    </div>
                    <div><label className={labelCls}>Impact *</label><textarea value={impact} onChange={e => setImpact(e.target.value)} className={inputCls + ' min-h-[60px] resize-y'} placeholder="Describe the impact" /></div>
                  </div>
                )}
              </div>

              {/* Requester */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <button type="button" onClick={() => toggle('requester')} className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-slate-200 dark:border-slate-800 cursor-pointer">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">👤 Requester Details</h2>
                  {exp.requester ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>
                {exp.requester && (
                  <div className="p-4 space-y-3">
                    <div><label className={labelCls}>Requester Name</label><input type="text" value={requesterName} onChange={e => setRequesterName(e.target.value)} className={inputCls} placeholder="Full Name" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={labelCls}>Designation</label><input type="text" value={requesterDesignation} onChange={e => setRequesterDesignation(e.target.value)} className={inputCls} placeholder="Designation" /></div>
                      <div><label className={labelCls}>Organization</label><input type="text" value={requesterOrganization} onChange={e => setRequesterOrganization(e.target.value)} className={inputCls} placeholder="Organization" /></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Implementers */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <button type="button" onClick={() => toggle('implementer')} className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-slate-200 dark:border-slate-800 cursor-pointer">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">🛠️ Implementer Details</h2>
                  {exp.implementer ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>
                {exp.implementer && (
                  <div className="p-4 space-y-3">
                    {implementers.map((impl, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">#{idx + 1}</span>
                        <input type="text" value={impl.name} onChange={e => updateImpl(idx, 'name', e.target.value)} className={inputCls} placeholder="Name" />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={impl.designation} onChange={e => updateImpl(idx, 'designation', e.target.value)} className={inputCls} placeholder="Designation" />
                          <input type="text" value={impl.organization} onChange={e => updateImpl(idx, 'organization', e.target.value)} className={inputCls} placeholder="Organization" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attended by */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <button type="button" onClick={() => toggle('attended')} className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-b border-slate-200 dark:border-slate-800 cursor-pointer">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">📝 Attended by: N/A</h2>
                  {exp.attended ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>
                {exp.attended && (
                  <div className="p-4 space-y-3">
                    {attendees.map((att, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">#{idx + 1}</span>
                        <input type="text" value={att.name} onChange={e => updateAtt(idx, 'name', e.target.value)} className={inputCls} placeholder="Name" />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={att.designation} onChange={e => updateAtt(idx, 'designation', e.target.value)} className={inputCls} placeholder="Designation" />
                          <input type="text" value={att.cell} onChange={e => updateAtt(idx, 'cell', e.target.value)} className={inputCls} placeholder="Cell" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ═══ RIGHT: Print Preview ═══ */}
            <div className="xl:col-span-8">
              <div id="taz-print-preview" className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg mx-auto" style={{ maxWidth: '210mm', minHeight: '297mm', fontFamily: "'Times New Roman', 'Nirmala UI', serif" }}>
                <div className="p-8 sm:p-10" style={{ fontSize: '12px', lineHeight: '1.6', color: '#000' }}>

                  {/* Header */}
                  <div className="text-center mb-4">
                    <h1 className="font-extrabold text-slate-900 dark:text-slate-100" style={{ fontSize: '16px' }}>Janata Bank PLC.</h1>
                    <h2 className="font-bold text-slate-800 dark:text-slate-200" style={{ fontSize: '14px' }}>Central Data Center (CDC)</h2>
                    <div className="mt-2">
                      <span className="text-slate-700 dark:text-slate-300" style={{ fontSize: '13px' }}>
                        Data Extraction/Change/Update Request Form for{' '}
                        <span className="font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-1.5 py-0.5 rounded text-xs">T24 Live</span>
                        {' '}Area
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-right mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200" style={{ fontSize: '13px' }}>Date: </span>
                    <span className="text-slate-700 dark:text-slate-300" style={{ fontSize: '13px' }}>{fmtDate(formDate)}</span>
                  </div>

                  {/* Main Table */}
                  <table className="w-full border-collapse border border-slate-400 dark:border-slate-600 mb-4" style={{ fontSize: '11.5px' }}>
                    <tbody>
                      <tr>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900" style={{ width: '25%' }}>Ref:</td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300" style={{ width: '25%' }}>{ref}</td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 text-right" style={{ width: '25%' }}>PACS ID :</td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300" style={{ width: '25%' }}>{pacsId}</td>
                      </tr>
                      <tr><td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">Title</td><td colSpan={3} className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300">{title}</td></tr>
                      <tr><td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">Purpose</td><td colSpan={3} className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{purpose}</td></tr>
                      <tr><td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">Application Name</td><td colSpan={3} className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300">{appName}</td></tr>
                      <tr><td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">Routine Details</td><td colSpan={3} className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300">{routineDetails}</td></tr>
                      <tr><td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">Subroutine Details</td><td colSpan={3} className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300">{subroutineDetails}</td></tr>
                      <tr><td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">Version (Routine, Subroutine)</td><td colSpan={3} className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300">{version}</td></tr>
                      {/* Yes/No paired rows */}
                      <tr>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900" style={{ fontSize: '10.5px' }}>Need Backend Access? <span className="font-normal text-slate-500">(Yes/No)</span></td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300">{needBackend}</td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900" style={{ fontSize: '10.5px' }}>Need Core FTP Access? <span className="font-normal text-slate-500">(Yes/No)</span></td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300">{needCoreFtp}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900" style={{ fontSize: '10.5px' }}>Need Browser access? <span className="font-normal text-slate-500">(Yes/No)</span></td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300">{needBrowser}</td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900" style={{ fontSize: '10.5px' }}>Browser Port Change? <span className="font-normal text-slate-500">(Yes/No)</span></td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300">{browserPortChange}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900" style={{ fontSize: '10.5px' }}>During Transaction hour? <span className="font-normal text-slate-500">(Yes/No)</span></td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300">{duringTransaction}</td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900" style={{ fontSize: '10.5px' }}>Number of Team Member</td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300">{teamMemberCount}</td>
                      </tr>
                      {/* Approximated Schedule */}
                      <tr>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">Approximated Schedule</td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 text-center">Date</td>
                        <td colSpan={2} className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300" style={{ fontSize: '10.5px' }}>{fmtDateTimeRange(approxStartDate, approxStartTime, approxEndDate, approxEndTime)}</td>
                      </tr>
                      {/* Execution Schedule */}
                      <tr>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">Execution Schedule</td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 text-center">Date</td>
                        <td colSpan={2} className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300" style={{ fontSize: '10.5px' }}>{fmtDateTimeRange(execStartDate, execStartTime, execEndDate, execEndTime)}</td>
                      </tr>
                      {/* Impact */}
                      <tr><td className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">Impact *</td><td colSpan={3} className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{impact}</td></tr>
                    </tbody>
                  </table>

                  {/* Requester Details */}
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 underline mb-2" style={{ fontSize: '12.5px' }}>Requester Details:</h3>
                    <table className="w-full border-collapse border border-slate-400 dark:border-slate-600" style={{ fontSize: '11.5px' }}>
                      <thead><tr className="bg-slate-50 dark:bg-slate-900">
                        <th className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-left font-bold text-slate-800 dark:text-slate-200" style={{ width: '30%' }}>Requester Name</th>
                        <th className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-left font-bold text-slate-800 dark:text-slate-200" style={{ width: '25%' }}>Designation</th>
                        <th className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-left font-bold text-slate-800 dark:text-slate-200" style={{ width: '25%' }}>Organization</th>
                        <th className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-left font-bold text-slate-800 dark:text-slate-200" style={{ width: '20%' }}>Sign</th>
                      </tr></thead>
                      <tbody><tr>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-3 text-slate-700 dark:text-slate-300">{requesterName}</td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-3 text-slate-700 dark:text-slate-300">{requesterDesignation}</td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-3 text-slate-700 dark:text-slate-300">{requesterOrganization}</td>
                        <td className="border border-slate-400 dark:border-slate-600 px-2 py-3"></td>
                      </tr></tbody>
                    </table>
                  </div>

                  {/* TAAJ Committee Opinion */}
                  <div className="mb-4">
                    <div className="border border-slate-400 dark:border-slate-600 p-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2 px-1" style={{ fontSize: '11.5px' }}>TAAJ Committee Opinion:</h3>
                      <table className="w-full border-collapse border border-slate-400 dark:border-slate-600" style={{ fontSize: '11px' }}>
                        <tbody>
                          <tr>{[1,2,3,4,5].map(i => <td key={i} className="border border-slate-400 dark:border-slate-600 px-2 text-center" style={{ height: '65px', width: '20%' }}></td>)}</tr>
                          <tr className="bg-slate-50 dark:bg-slate-900">
                            <td className="border border-slate-400 dark:border-slate-600 px-1 py-1 text-center font-bold text-slate-800 dark:text-slate-200" style={{ fontSize: '10px' }}>Core Cell</td>
                            <td className="border border-slate-400 dark:border-slate-600 px-1 py-1 text-center font-bold text-slate-800 dark:text-slate-200" style={{ fontSize: '10px' }}>Migration Cell</td>
                            <td className="border border-slate-400 dark:border-slate-600 px-1 py-1 text-center font-bold text-slate-800 dark:text-slate-200" style={{ fontSize: '10px' }}>User Cell</td>
                            <td className="border border-slate-400 dark:border-slate-600 px-1 py-1 text-center font-bold text-slate-800 dark:text-slate-200" style={{ fontSize: '10px' }}>Development &<br/>Customization Cell</td>
                            <td className="border border-slate-400 dark:border-slate-600 px-1 py-1 text-center font-bold text-slate-800 dark:text-slate-200" style={{ fontSize: '10px' }}>DGM</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Approval Details */}
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 underline mb-2" style={{ fontSize: '12.5px' }}>Approval Details (CDC & Network):</h3>
                    <table className="w-full border-collapse border border-slate-400 dark:border-slate-600" style={{ fontSize: '11px' }}>
                      <tbody>
                        <tr>{[1,2,3,4].map(i => <td key={i} className="border border-slate-400 dark:border-slate-600 px-2 text-center" style={{ height: '65px', width: '25%' }}></td>)}</tr>
                        <tr className="bg-slate-50 dark:bg-slate-900">
                          {['CDC','Cell in charge','AGM','DGM'].map(l => <td key={l} className="border border-slate-400 dark:border-slate-600 px-2 py-1 text-center font-bold text-slate-800 dark:text-slate-200" style={{ fontSize: '11px' }}>{l}</td>)}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Implementer Details */}
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 underline mb-2" style={{ fontSize: '12.5px' }}>Implementer Details:</h3>
                    <table className="w-full border-collapse border border-slate-400 dark:border-slate-600" style={{ fontSize: '11.5px' }}>
                      <thead><tr className="bg-slate-50 dark:bg-slate-900">
                        {['SL','Name','Designation','Organization','Signature'].map((h,i) => <th key={h} className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-center font-bold text-slate-800 dark:text-slate-200" style={{ width: i===0?'8%':i===4?'20%':'24%' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>{implementers.map((impl, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-400 dark:border-slate-600 px-2 py-2 text-center text-slate-700 dark:text-slate-300">{idx+1}.</td>
                          <td className="border border-slate-400 dark:border-slate-600 px-2 py-2 text-slate-700 dark:text-slate-300">{impl.name}</td>
                          <td className="border border-slate-400 dark:border-slate-600 px-2 py-2 text-slate-700 dark:text-slate-300">{impl.designation}</td>
                          <td className="border border-slate-400 dark:border-slate-600 px-2 py-2 text-slate-700 dark:text-slate-300">{impl.organization}</td>
                          <td className="border border-slate-400 dark:border-slate-600 px-2 py-2"></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>

                  {/* Attended by */}
                  <div className="mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 underline mb-2" style={{ fontSize: '12.5px' }}>Attended by: N/A</h3>
                    <table className="w-full border-collapse border border-slate-400 dark:border-slate-600" style={{ fontSize: '11.5px' }}>
                      <thead><tr className="bg-slate-50 dark:bg-slate-900">
                        {['SL#','Name','Designation','Cell','Signature'].map((h,i) => <th key={h} className="border border-slate-400 dark:border-slate-600 px-2 py-1.5 text-center font-bold text-slate-800 dark:text-slate-200" style={{ width: i===0?'8%':i===4?'20%':'24%' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>{attendees.map((att, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-400 dark:border-slate-600 px-2 py-2 text-center text-slate-700 dark:text-slate-300">{idx+1}.</td>
                          <td className="border border-slate-400 dark:border-slate-600 px-2 py-2 text-slate-700 dark:text-slate-300">{att.name}</td>
                          <td className="border border-slate-400 dark:border-slate-600 px-2 py-2 text-slate-700 dark:text-slate-300">{att.designation}</td>
                          <td className="border border-slate-400 dark:border-slate-600 px-2 py-2 text-center text-slate-700 dark:text-slate-300">{att.cell}</td>
                          <td className="border border-slate-400 dark:border-slate-600 px-2 py-2"></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
