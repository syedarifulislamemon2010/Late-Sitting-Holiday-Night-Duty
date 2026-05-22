'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
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
}

export default function RosterPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  // Office Order (জিও) custom edit fields
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [memoNo, setMemoNo] = useState('স্মারক নং: ৪৬.০২.০০০০.০০১.১৯.০০২.২৬-১৫৪');
  const [issuingOffice, setIssuingOffice] = useState('প্রশাসনিক সেল, ডিউটি পোর্টাল কার্যালয়');
  const [signingOfficer, setSigningOfficer] = useState('জনাব চৌধুরী আশিকুর রহমান');
  const [signingDesignation] = useState('ডিজিএম/উপ-মহাব্যবস্থাপক'); // STRICTLY LOCKED TO DGM
  const [signingPhone, setSigningPhone] = useState('০২-৯৫৫৫৬৬৬');
  const [signingEmail, setSigningEmail] = useState('ashikur.rahman@office.gov.bd');
  const [copies, setCopies] = useState([
    'মহাপরিচালক, ডিউটি পোর্টাল অধিদপ্তর, ঢাকা।',
    'হিসাবরক্ষণ কর্মকর্তা, সংশ্লিষ্ট কার্যালয়।',
    'ব্যক্তিগত নথি / অফিস কপি।'
  ]);
  const [newCopyText, setNewCopyText] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const [empRes, cellRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/cells')
      ]);
      const empData = await empRes.json();
      const cellData = await cellRes.json();
      
      setEmployees(Array.isArray(empData) ? empData : []);
      setCells(Array.isArray(cellData) ? cellData : []);
    } catch (err) {
      console.error('Error loading static data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Fetch duties based on selected month & filters
  async function loadDuties() {
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
      setDuties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading duties:', err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadDuties();
  }, [selectedMonth, selectedCell]);

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (assignmentForm.selectedEmployeeIds.length === 0) {
      setErrorMessage('ডিউটি বরাদ্দ করার জন্য অন্তত একজন কর্মকর্তা নির্বাচন করুন।');
      return;
    }
    
    if (!assignmentForm.date) {
      setErrorMessage('ডিউটির তারিখ নির্বাচন করুন।');
      return;
    }

    try {
      setSubmitting(true);
      const assignments = assignmentForm.selectedEmployeeIds.map(empId => ({
        employeeId: empId,
        type: assignmentForm.type,
        date: assignmentForm.date,
        description: assignmentForm.description.trim() || undefined
      }));

      const res = await fetch('/api/duties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save roster');
      }

      // Reset form selection but keep the date and type for consecutive entries
      setAssignmentForm(prev => ({
        ...prev,
        selectedEmployeeIds: [],
        description: ''
      }));
      
      // Reload duties list
      loadDuties();
      
      // Show success toast/alert
      alert('ডিউটি রোস্টার সফলভাবে সংরক্ষণ করা হয়েছে!');
    } catch (err: any) {
      console.error('Error assigning roster:', err);
      setErrorMessage('রোস্টার সংরক্ষণ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
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

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------
          NORMAL VIEW MODE
      ---------------------------------------------------- */}
      {!isPrintMode ? (
        <>
          {/* Header Dashboard Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-wide">ডিউটি রোস্টার ও অফিস আদেশ</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">কর্মকর্তাদের রোস্টার তৈরি করুন এবং সরকারি প্রটোকলে অফিস আদেশ (জিও) জেনারেট করুন।</p>
            </div>
            
            <button
              onClick={() => setIsPrintMode(true)}
              disabled={duties.length === 0}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${duties.length > 0 ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-95' : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'}`}
            >
              <Printer size={16} />
              অফিস আদেশ (A4 Size) দেখুন ও প্রিন্ট করুন
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* LEFT COLUMN: Assign New Duty Form */}
            <div className="glass-card p-6 rounded-2xl space-y-6 xl:col-span-1 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Calendar size={18} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">ডিউটি অ্যাসাইনমেন্ট প্যানেল</h3>
              </div>

              <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2 animate-pulse">
                    <AlertCircle size={14} />
                    {errorMessage}
                  </div>
                )}

                {/* Duty Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">১. ডিউটির ক্যাটাগরি</label>
                  <select
                    value={assignmentForm.type}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, type: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LATE_SITTING">Late Sitting (লেট সিটিং)</option>
                    <option value="HOLIDAY">Holiday Duty (সরকারি ছুটি)</option>
                    <option value="NIGHT_SHIFT">Night Shift (রাত্রীকালীন ডিউটি)</option>
                  </select>
                </div>

                {/* Duty Date Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">২. ডিউটির তারিখ</label>
                  <input
                    type="date"
                    required
                    value={assignmentForm.date}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                {/* Duty Description Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">৩. কাজের বিবরণ/মন্তব্য (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="যেমন: জরুরি নথি ফাইল প্রস্তুতকরণ"
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Officer Selector Multi-select checkboxes */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">৪. কর্মকর্তা নির্বাচন করুন ({assignmentForm.selectedEmployeeIds.length} জন সিলেক্টেড)</label>
                  </div>
                  
                  {/* Internal search inside form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="খুঁজুন..."
                      value={formSearchQuery}
                      onChange={(e) => setFormSearchQuery(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs focus:outline-none"
                    />
                    <select
                      value={formCellFilter}
                      onChange={(e) => setFormCellFilter(e.target.value)}
                      className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs focus:outline-none"
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
                      className="flex-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-400 py-1 rounded transition-colors"
                    >
                      সব সিলেক্ট করুন
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllFilteredEmployees}
                      className="flex-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-400 py-1 rounded transition-colors"
                    >
                      সব বাদ দিন
                    </button>
                  </div>

                  {/* Officers Checkboxes scrollbox */}
                  <div className="max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-800/80 rounded-xl p-2 bg-slate-50/20 dark:bg-slate-950/10 space-y-1.5">
                    {filteredFormEmployees.length > 0 ? (
                      filteredFormEmployees.map(emp => {
                        const isChecked = assignmentForm.selectedEmployeeIds.includes(emp.id);
                        return (
                           <div 
                            key={emp.id}
                            onClick={() => handleEmployeeToggle(emp.id)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${isChecked ? 'bg-indigo-50/40 border-indigo-200/50 dark:bg-indigo-950/20 dark:border-indigo-800/30' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                                {isChecked && <Check size={10} strokeWidth={3} />}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{emp.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{emp.designation}</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded uppercase font-sans">{emp.cell.name}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[11px] text-center text-slate-400 py-4">কর্মকর্তা পাওয়া যায়নি</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-sm font-semibold transition-colors shadow-md mt-4"
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'ডিউটি অ্যাসাইন করুন'}
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: Roster Monthly List Grid */}
            <div className="glass-card p-6 rounded-2xl xl:col-span-2 space-y-6 border border-slate-200 dark:border-slate-800">
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
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <table className="w-full text-left text-xs leading-normal">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="px-5 py-3.5">তারিখ</th>
                        <th className="px-5 py-3.5">কর্মকর্তা</th>
                        <th className="px-5 py-3.5">পদবী ও সেল</th>
                        <th className="px-5 py-3.5">ডিউটির ক্যাটাগরি</th>
                        <th className="px-5 py-3.5">মোট বিল</th>
                        <th className="px-5 py-3.5 no-print">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                      {duties.map((duty) => (
                        <tr key={duty.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                          <td className="px-5 py-4 font-sans font-semibold text-slate-800 dark:text-slate-200">
                            {duty.date}
                            <p className="text-[10px] text-slate-400 mt-0.5 font-normal">{getBanglaDate(duty.date)}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{duty.employee.name}</p>
                            {duty.description && <p className="text-[10px] text-slate-400 font-normal italic mt-0.5">মন্তব্য: {duty.description}</p>}
                          </td>
                          <td className="px-5 py-4 font-sans text-[11px]">
                            {duty.employee.designation}
                            <span className="ml-2 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded text-[9px] font-bold">{duty.employee.cell.name}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${getDutyBadgeStyles(duty.type)}`}>
                              {duty.type === 'LATE_SITTING' ? 'Late Sitting (লেট সিটিং)' : duty.type === 'HOLIDAY' ? 'Holiday Duty (সরকারি ছুটি)' : 'Night Shift (রাত্রীকালীন ডিউটি)'}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold text-indigo-600 dark:text-indigo-400 font-sans">
                            ৳{duty.totalBill.toLocaleString('bn-BD')}
                          </td>
                          <td className="px-5 py-4 no-print">
                            <button
                              onClick={() => deleteDuty(duty.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors"
                              title="ডিলিট"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center space-y-3 max-w-sm mx-auto">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                    <Calendar size={22} />
                  </div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300">কোনো ডিউটি রেকর্ড নেই</h4>
                  <p className="text-[11px] text-slate-400">ফিল্টারকৃত মাস বা সেলে কোনো কর্মকর্তার ডিউটি বরাদ্দ করা নেই। নতুন ডিউটি যোগ করুন।</p>
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
          {/* Back Controls (No-print) */}
          <div className="no-print flex items-center justify-between glass-card p-4 rounded-2xl">
            <button
              onClick={() => setIsPrintMode(false)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ChevronLeft size={16} />
              ফিরে যান (রোস্টার ভিউ)
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-md"
              >
                <Printer size={14} />
                প্রিন্ট করুন (A4 Size)
              </button>
            </div>
          </div>

          {/* Configurator Panel (No-print) */}
          <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-4 lg:col-span-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">অফিস আদেশ সেটিংস</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">স্মারক নম্বর (Memo No)</label>
                  <input
                    type="text"
                    value={memoNo}
                    onChange={(e) => setMemoNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">অনুমোদনকারী কার্যালয়</label>
                  <input
                    type="text"
                    value={issuingOffice}
                    onChange={(e) => setIssuingOffice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">স্বাক্ষরকারী কর্মকর্তা</label>
                  <input
                    type="text"
                    value={signingOfficer}
                    onChange={(e) => setSigningOfficer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">কর্মকর্তার পদবী (লকড)</label>
                  <input
                    type="text"
                    value={signingDesignation}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs cursor-not-allowed text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">কর্মকর্তার ফোন</label>
                  <input
                    type="text"
                    value={signingPhone}
                    onChange={(e) => setSigningPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">কর্মকর্তার ইমেইল</label>
                  <input
                    type="text"
                    value={signingEmail}
                    onChange={(e) => setSigningEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Copy Forwarded configurations */}
            <div className="space-y-3 lg:col-span-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">অনুলিপি প্রাপকসমূহ</h3>
              
              <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800/80 p-2 rounded-xl bg-slate-50/20">
                {copies.map((copy, index) => (
                  <div key={index} className="flex justify-between items-center text-xs p-1.5 border-b border-slate-50 dark:border-slate-800 last:border-none">
                    <span className="truncate">{index + 1}. {copy}</span>
                    <button onClick={() => removeCopyRecipient(index)} className="text-red-500 hover:text-red-700 ml-2 font-sans font-bold">×</button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="অনুলিপি প্রাপক লিখুন..."
                  value={newCopyText}
                  onChange={(e) => setNewCopyText(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs"
                />
                <button
                  onClick={addCopyRecipient}
                  className="p-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Print Mock Sheet */}
          <div className="flex justify-center p-4 bg-slate-100/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-x-auto shadow-inner font-serif">
            {/* Renders exactly like A4 Page in Print Preview */}
            <div className="print-a4-layout w-[210mm] min-h-[297mm] bg-white border border-slate-200 text-black p-[20mm] shadow-xl flex flex-col justify-between" style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: '"Nikosh", "SolaimanLipi", "Noto Sans Bengali", serif' }}>
              
              {/* Official Header */}
              <div className="space-y-4 text-center">
                {/* Government Logo / Seal */}
                <div className="w-14 h-14 border border-slate-300 rounded-full flex items-center justify-center mx-auto text-[9px] font-sans font-semibold text-slate-400 tracking-tighter">
                  GOVT SEAL
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-lg font-bold">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</h2>
                  <h3 className="text-sm font-semibold">{issuingOffice}</h3>
                  <h4 className="text-xs">ডিউটি পোর্টাল সদর দপ্তর, ঢাকা</h4>
                </div>

                <div className="flex justify-between items-center text-xs pt-4 border-b border-black pb-2">
                  <span className="font-semibold">{memoNo}</span>
                  <div className="text-right">
                    <p>তারিখ: {getBanglaDate(new Date().toISOString().split('T')[0])} খ্রিস্টাব্দ</p>
                  </div>
                </div>
              </div>

              {/* Title and Main Body */}
              <div className="flex-1 space-y-6 pt-6 text-sm text-justify leading-relaxed">
                <h2 className="text-center text-base font-bold underline">অফিস আদেশ</h2>
                
                <p>
                  সংশ্লিষ্ট সকলের অবগতির জন্য জানানো যাচ্ছে যে, দাপ্তরিক কার্যক্রম পরিচালনার স্বার্থে ও জরুরি প্রাশাসনিক কাজ সম্পাদনের নিমিত্তে নিম্নবর্ণিত কর্মকর্তাবৃন্দকে তাদের নামের পার্শ্বে উল্লিখিত তারিখ ও সময়ে দায়িত্ব (লেট সিটিং/ছুটির দিনের ডিউটি/রাত্রিকালীন দায়িত্ব) পালনের জন্য নির্দেশ প্রদান করা হলো:
                </p>

                {/* Duty Table */}
                <table className="w-full border-collapse border border-black text-xs text-center">
                  <thead>
                    <tr className="bg-slate-100/60 font-bold border-b border-black">
                      <th className="border border-black p-2 w-[10%]">ক্রমিক</th>
                      <th className="border border-black p-2 text-left">কর্মকর্তার নাম ও পদবী</th>
                      <th className="border border-black p-2 w-[15%]">সেল</th>
                      <th className="border border-black p-2 w-[25%]">ডিউটির ক্যাটাগরি</th>
                      <th className="border border-black p-2 w-[20%]">তারিখ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duties.map((duty, index) => (
                      <tr key={duty.id}>
                        <td className="border border-black p-2 font-sans">{(index + 1).toLocaleString('bn-BD')}</td>
                        <td className="border border-black p-2 text-left">
                          <p className="font-bold">{duty.employee.name}</p>
                          <p className="text-[10px] text-slate-700">{duty.employee.designation}</p>
                        </td>
                        <td className="border border-black p-2">{duty.employee.cell.name}</td>
                        <td className="border border-black p-2">
                          {duty.type === 'LATE_SITTING' ? 'Late Sitting (লেট সিটিং)' : duty.type === 'HOLIDAY' ? 'Holiday Duty (সরকারি ছুটি)' : 'Night Shift (রাত্রীকালীন ডিউটি)'}
                        </td>
                        <td className="border border-black p-2 font-sans">{duty.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p>
                  উল্লিখিত ডিউটি পালনের জন্য নিয়োজিত কর্মকর্তাগণ প্রচলিত সরকারি বিধিমালা অনুযায়ী নির্ধারিত আপ্যায়ন ও যাতায়াত ভাতা (Late Sitting: ৳৩০০, Holiday Duty: ৳৫০০, Night Shift: ৳১০০০) প্রাপ্য হবেন। যথাযথ কর্তৃপক্ষের অনুমোদনক্রমে এই আদেশ জারি করা হলো।
                </p>
              </div>

              {/* Signature Section */}
              <div className="flex justify-between items-start pt-10 text-xs">
                <div className="w-[45%] text-left space-y-1">
                  {copies.length > 0 && (
                    <>
                      <p className="font-bold underline">অনুলিপি (সদয় জ্ঞাতার্থে ও কার্যার্থে):</p>
                      <ol className="list-decimal pl-4 space-y-0.5">
                        {copies.map((copy, idx) => <li key={idx}>{copy}</li>)}
                      </ol>
                    </>
                  )}
                </div>
                
                <div className="w-[45%] text-right space-y-1 pt-4">
                  <div className="h-10" /> {/* Space for physical signature */}
                  <p className="font-bold">({signingOfficer})</p>
                  <p>{signingDesignation}</p>
                  <p>ফোন: {signingPhone}</p>
                  <p>ইমেইল: {signingEmail}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
