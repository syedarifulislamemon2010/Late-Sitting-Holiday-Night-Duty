'use client';

import { useState, useEffect } from 'react';
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
}

const toBanglaDigits = (num: number | string) => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, d => bn[parseInt(d, 10)]);
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
  const [memoNo, setMemoNo] = useState('স্মারক নং: ৪৬.০২.০০০০.০০১.১৯.০০২.২৬-১৫৪');
  const [issuingOffice, setIssuingOffice] = useState('প্রশাসনিক সেল, ডিউটি পোর্টাল কার্যালয়');
  const [signingOfficer, setSigningOfficer] = useState('জনাব চৌধুরী আশিকুর রহমান');
  const [signingDesignation] = useState('উপ-মহাব্যবস্থাপক');
  const [signingPhone, setSigningPhone] = useState('০২-৯৫৫৫৬৬৬');
  const [signingEmail, setSigningEmail] = useState('ashikur.rahman@office.gov.bd');
  const [copies, setCopies] = useState([
    'মহাপরিচালক, ডিউটি পোর্টাল অধিদপ্তর, ঢাকা।',
    'হিসাবরক্ষণ কর্মকর্তা, সংশ্লিষ্ট কার্যালয়।',
    'ব্যক্তিগত নথি / অফিস কপি।'
  ]);
  const [newCopyText, setNewCopyText] = useState('');
  const [executives, setExecutives] = useState<any[]>([]);

  // New customizable parameters for Janata Bank Office Order
  const [printCategory, setPrintCategory] = useState<'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT'>('LATE_SITTING');
  const [payeeEmployeeId, setPayeeEmployeeId] = useState<string>('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [randomNumber, setRandomNumber] = useState(() => Math.floor(10 + Math.random() * 90));
  
  const LATE_SITTING_TEMPLATE = `T24 Online Banking Software Customization এবং Development সংক্রান্ত কার্যাদি সুচারুরূপে সম্পাদনের নিমিত্তে  অত্র ডিপার্টমেন্টের নিম্ন বর্ণিত কর্মকর্তাগণকে তাদের নামের পাশে বর্ণিত তারিখে অফিস <strong>ছুটির পর (Late Sitting)</strong> কর্মস্থলে উপস্থিত থেকে কর্ম সম্পাদনের নির্দেশ প্রদান করা হলঃ`;

  const NIGHT_SHIFT_TEMPLATE = `T24 Online Banking Software Customization এবং Development সংক্রান্ত কার্যাদি সুচারুরূপে সম্পাদনের নিমিত্তে  অত্র ডিপার্টমেন্টের নিম্ন বর্ণিত কর্মকর্তাগণকে তাদের নামের পাশে বর্ণিত তারিখে অফিস <strong>রাত্রিকালীন (Night Shift)</strong> কর্মস্থলে উপস্থিত থেকে কর্ম সম্পাদনের নির্দেশ প্রদান করা হলঃ`;

  const HOLIDAY_TEMPLATE = `T24 Online Banking Software Customization এবং Development সংক্রান্ত কার্যাদি সুচারুরূপে সম্পাদনের নিমিত্তে  অত্র ডিপার্টমেন্টের নিম্ন বর্ণিত কর্মকর্তাগণকে তাদের নামের পাশে বর্ণিত তারিখে অফিস <strong>ছুটির দিনে (Holiday)</strong> কর্মস্থলে উপস্থিত থেকে কর্ম সম্পাদনের নির্দেশ প্রদান করা হলঃ`;

  const [orderText, setOrderText] = useState(LATE_SITTING_TEMPLATE);
  const [orderRef, setOrderRef] = useState('');

  // Automatically select first employee of the duty table as payee representative by default
  useEffect(() => {
    const tableEmps = getGroupedDuties();
    if (tableEmps.length > 0) {
      setPayeeEmployeeId(tableEmps[0].employee.id.toString());
    } else {
      setPayeeEmployeeId('');
    }
  }, [selectedCell, duties, printCategory]);

  // Sync templates and orderRef dynamically
  useEffect(() => {
    let template = LATE_SITTING_TEMPLATE;
    if (printCategory === 'NIGHT_SHIFT') template = NIGHT_SHIFT_TEMPLATE;
    if (printCategory === 'HOLIDAY') template = HOLIDAY_TEMPLATE;
    setOrderText(template);

    let empName = 'ইমন';
    if (payeeEmployeeId) {
      const emp = employees.find(e => e.id.toString() === payeeEmployeeId);
      if (emp) {
        empName = emp.name.replace(/^জনাব\s+/, '');
      }
    }
    const catBangla = printCategory === 'LATE_SITTING' ? 'লেট-সিটিং' : printCategory === 'HOLIDAY' ? 'অফ-ডে' : 'নাইট';
    const bnYear = toBanglaDigits('2026');
    const bnRand = toBanglaDigits(randomNumber);
    setOrderRef(`৯১০৩/ডেভ/${empName}/${catBangla}/অফিস-নির্দেশ/${bnYear}/${bnRand}`);
  }, [printCategory, payeeEmployeeId, employees, randomNumber]);

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

  const getGroupedDuties = () => {
    const filtered = duties.filter(d => {
      const matchesCell = selectedCell === 'all' || d.employee.cellId.toString() === selectedCell;
      const matchesCategory = d.type === printCategory;
      return matchesCell && matchesCategory;
    });

    const groupedMap = new Map<number, { employee: Employee; dates: string[]; description: string }>();
    filtered.forEach(d => {
      const empId = d.employee.id;
      if (!groupedMap.has(empId)) {
        groupedMap.set(empId, {
          employee: d.employee,
          dates: [],
          description: d.description || 'Development সংক্রান্ত কাজ'
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

    return Array.from(groupedMap.values());
  };

  async function loadData() {
    try {
      setLoading(true);
      const [empRes, cellRes, execRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/cells'),
        fetch('/api/executives')
      ]);
      const empData = await empRes.json();
      const cellData = await cellRes.json();
      const execData = await execRes.json();
      
      setEmployees(Array.isArray(empData) ? empData : []);
      setCells(Array.isArray(cellData) ? cellData : []);
      setExecutives(Array.isArray(execData) ? execData : []);
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
    
    let assignments: any[] = [];

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
          opt1Assignments[empId].forEach(dateStr => {
            assignments.push({
              employeeId: empId,
              type: assignmentForm.type,
              date: dateStr,
              description: assignmentForm.description.trim() || undefined
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

      assignments = assignmentForm.selectedEmployeeIds.map(empId => ({
        employeeId: empId,
        type: assignmentForm.type,
        date: assignmentForm.date,
        description: assignmentForm.description.trim() || undefined
      }));
    }

    try {
      setSubmitting(true);

      const res = await fetch('/api/duties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.error === 'duplicate_duty_on_date') {
          throw new Error('duplicate_duty_on_date');
        }
        if (err.error === 'late_sitting_on_holiday') {
          throw new Error('late_sitting_on_holiday');
        }
        if (err.error === 'holiday_duty_on_working_day') {
          throw new Error('holiday_duty_on_working_day');
        }
        throw new Error(err.error || 'Failed to save roster');
      }

      // Reset form selection but keep the date and type for consecutive entries
      if (entryMode === 'EMPLOYEE_WISE') {
        setOpt1Assignments({});
      } else {
        setAssignmentForm(prev => ({
          ...prev,
          selectedEmployeeIds: [],
          description: ''
        }));
      }
      
      // Reload duties list
      loadDuties();
      
      // Show success toast/alert
      alert('ডিউটি রোস্টার সফলভাবে সংরক্ষণ করা হয়েছে!');
    } catch (err: any) {
      console.error('Error assigning roster:', err);
      if (err.message === 'duplicate_duty_on_date') {
        setErrorMessage('এই তারিখের মধ্যে কোনো কোনো কর্মকর্তার জন্য ইতিমধ্যে অন্য ডিউটি বা লেট সিটিং বরাদ্দ আছে। ডুপ্লিকেট এন্ট্রি করা সম্ভব নয়।');
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
          description: editForm.description.trim() || undefined
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
              অফিস আদেশ (লিগ্যাল সাইজ) দেখুন ও প্রিন্ট করুন
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

              {/* Entry Option Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('EMPLOYEE_WISE');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${entryMode === 'EMPLOYEE_WISE' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  অপশন ১: সেল ও এমপ্লয়ী ভিত্তিক (মাল্টিপল ডেট)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('DATE_WISE');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${entryMode === 'DATE_WISE' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  অপশন ২: তারিখ ভিত্তিক (এমপ্লয়ী সিলেক্ট)
                </button>
              </div>

              <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2 animate-pulse">
                    <AlertCircle size={14} />
                    {errorMessage}
                  </div>
                )}

                {/* Common Field 1: Duty Type Selection */}
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

                {/* Common Field 2: Duty Description Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">২. কাজের বিবরণ/মন্তব্য (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="যেমন: জরুরি নথি ফাইল প্রস্তুতকরণ"
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Mode Specific Layouts */}
                {entryMode === 'EMPLOYEE_WISE' ? (
                  /* ========================================================
                     OPTION 1: Cell & Employee wise (Multi-date picker)
                     ======================================================== */
                  <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">৩. সেল সিলেক্ট করুন</label>
                      <select
                        value={opt1CellId}
                        onChange={(e) => {
                          setOpt1CellId(e.target.value);
                          setOpt1Assignments({}); // Reset assignments when cell changes to keep it clean
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                      >
                        {cells.map(c => (
                          <option key={c.id} value={c.id.toString()}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        ৪. কর্মকর্তা ও তারিখসমূহ নির্বাচন করুন
                      </label>
                      
                      <div className="max-h-80 overflow-y-auto border border-slate-100 dark:border-slate-800/80 rounded-xl p-2 bg-slate-50/20 dark:bg-slate-950/10 space-y-2">
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
                                    
                                    {isChecked && (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="date"
                                          onChange={(e) => {
                                            handleOpt1AddDate(emp.id, e.target.value);
                                            e.target.value = ''; // Reset
                                          }}
                                          className="px-1.5 py-1 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] focus:outline-none focus:border-indigo-500 font-sans"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {isChecked && (
                                    <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-100/60 dark:border-slate-800/60">
                                      {opt1Assignments[emp.id] && opt1Assignments[emp.id].length > 0 ? (
                                        opt1Assignments[emp.id].map(date => (
                                          <span key={date} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold font-sans bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-800/30">
                                            {date}
                                            <button 
                                              type="button" 
                                              onClick={() => handleOpt1RemoveDate(emp.id, date)}
                                              className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 font-bold ml-0.5"
                                            >
                                              ×
                                            </button>
                                          </span>
                                        ))
                                      ) : (
                                        <p className="text-[9px] text-slate-400 italic">তারিখ পিক করতে ডানদিকের ডেটবক্স ব্যবহার করুন।</p>
                                      )}
                                    </div>
                                  )}
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
                  <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    {/* Duty Date Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">৩. ডিউটির তারিখ</label>
                      <input
                        type="date"
                        required
                        value={assignmentForm.date}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, date: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-sans"
                      />
                    </div>

                    {/* Officer Selector Multi-select checkboxes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                  </div>
                )}

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
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-md animate-pulse"
              >
                <Printer size={14} />
                প্রিন্ট করুন (A4 Size)
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
                  <label className="text-xs font-bold text-slate-500">৩. আদেশ অনুমোদনকারী ডিজিএম (Order By)</label>
                  <select
                    value={signingOfficer}
                    onChange={(e) => setSigningOfficer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select DGM (ডিজিএম নির্বাচন)</option>
                    {executives
                      .filter(ex => ex.designation === 'উপ-মহাব্যবস্থাপক')
                      .map(ex => (
                        <option key={ex.id} value={ex.name}>{ex.name}</option>
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

          {/* Interactive Print Mock Sheet */}
          <div className="flex justify-center p-4 bg-slate-100/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-x-auto shadow-inner font-serif">
            {/* Renders exactly like A4 Page in Print Preview with standard 1.0 inch margins all around */}
            <div className="print-a4-layout w-[210mm] min-h-[297mm] bg-white border border-slate-200 text-black shadow-xl flex flex-col justify-between overflow-hidden relative" style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: '"Nikosh", "SolaimanLipi", "Noto Sans Bengali", serif', padding: '1.0in', boxSizing: 'border-box' }}>
              
              {/* Janata Bank PLC Redesigned Header to match mockup logo exactly */}
              <div className="w-full flex justify-between items-start border-b-2 border-[#0b5e9e] pb-2">
                {/* Left side: Logo & Tagline */}
                <div className="flex items-start gap-2 text-left">
                  <svg viewBox="0 0 512 512" className={`${printLogoSize} text-[#0b5e9e] shrink-0`} fill="none">
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
                    <h2 className="text-[19px] font-extrabold text-[#0b5e9e]">জনতা ব্যাংক পিএলসি.</h2>
                    <p className="text-[9.5px] font-bold text-[#555555] mt-1.5">উন্নয়নে আপনার বিশ্বস্ত অংশীদার</p>
                  </div>
                </div>

                {/* Right side: Department */}
                <div className="text-right font-serif leading-none mt-2">
                  <h3 className="text-[13.5px] font-bold text-black">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h3>
                </div>
              </div>

              {/* Sub-header line: Reference and Date */}
              <div className="w-full flex justify-between items-center text-[10.5px] font-serif pt-1.5 pb-1 border-b border-black/10 mt-1">
                <span className="font-bold">সূত্রঃ {orderRef}</span>
                <span className="font-bold">
                  তারিখঃ {toBanglaDigits(new Date(orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং
                </span>
              </div>

              {/* Title and Main Body */}
              <div className="flex-1 flex flex-col justify-start pt-3 space-y-4 text-[11px]">
                <div className="space-y-4">
                  <h2 className="text-center text-[14.5px] font-extrabold underline decoration-black underline-offset-4">
                    অফিস নির্দেশ
                  </h2>
                  
                  <p 
                    className="text-justify leading-relaxed mt-3 text-[11px] text-slate-950 text-indent-8"
                    dangerouslySetInnerHTML={{ __html: orderText }}
                  />

                  {/* Redesigned Printed Duty Table Grouped by Employee */}
                  {getGroupedDuties().length > 0 ? (
                    <table className="w-full border-collapse border border-black text-center mt-3 text-[10.5px]">
                      <thead>
                        <tr className="bg-slate-50 font-bold border-b border-black text-[9.5px]">
                          <th className="border border-black p-1.5 w-[8%] text-center">ক্রমিক নং</th>
                          <th className="border border-black p-1.5 text-left pl-3 w-[30%]">নির্বাহী/ কর্মকর্তার নাম</th>
                          <th className="border border-black p-1.5 text-center w-[12%]">পদবী</th>
                          <th className="border border-black p-1.5 text-left pl-3 w-[25%]">কাজের বিবরণ</th>
                          <th className="border border-black p-1.5 text-center w-[25%]">তারিখ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getGroupedDuties().map((group, index) => (
                          <tr key={group.employee.id} className="text-black text-[10px]">
                            <td className="border border-black p-1.5 text-center font-serif">
                              {toBanglaDigits(index + 1)}
                            </td>
                            <td className="border border-black p-1.5 text-left pl-3 leading-tight font-extrabold text-[10px]">
                              {group.employee.name.startsWith('জনাব') ? group.employee.name : `জনাব ${group.employee.name}`}
                            </td>
                            <td className="border border-black p-1.5 text-center font-semibold text-[9.5px]">
                              {getShortDesignation(group.employee.designation)}
                            </td>
                            <td className="border border-black p-1.5 text-left pl-3 leading-tight">
                              {group.description}
                            </td>
                            <td className="border border-black p-1.5 text-center font-serif text-[9px] leading-snug tracking-tight">
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

                {/* Redesigned bottom-left signature aligned exactly like mockup with 1.0 inch top space below table */}
                <div className="flex justify-between items-start text-xs font-serif" style={{ marginTop: '1.0in' }}>
                  <div className="w-[50%] text-left space-y-0.5 pl-3 leading-tight">
                    <p className="font-extrabold text-[11px] text-black">({signingOfficer || 'ডিজিএম নাম সিলেক্ট করুন'})</p>
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

              {/* Edit Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">৩. কাজের বিবরণ/মন্তব্য (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: জরুরি নথি ফাইল প্রস্তুতকরণ"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
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
