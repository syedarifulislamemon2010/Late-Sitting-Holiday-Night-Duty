'use client';

import { useState, useEffect } from 'react';
import { sortEmployeesBySeniority } from '@/lib/seniority';
import { useProfile } from '@/context/ProfileContext';
import InlineEdit from '@/components/InlineEdit';
import { TableSkeleton, CardSkeleton } from "@/components/SkeletonLoader";
import { useLanguage } from '@/context/LanguageContext';


import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Users, 
  Building2, 
  AlertCircle,
  Briefcase,
  Hash,
  CreditCard,
  Download,
  Printer,
  Eye,
  X,
  Phone,
  Loader2,
  Filter
} from 'lucide-react';

interface Cell {
  id: number;
  name: string;
  description: string | null;
  _count?: {
    employees: number;
  };
}

interface User {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
  cells?: { id: number; name: string }[];
}

interface Executive {
  id: number;
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  phone: string | null;
}

interface BulkEmployeeInput {
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  mobile: string | null;
  cellName: string;
}

interface Employee {
  id: number;
  name: string;
  nameEn?: string | null;
  designation: string;
  designationEn?: string | null;
  bankId: string | null;
  fileNo: string | null;
  mobile: string | null;
  cellId: number;
  cell: Cell;
  dutyType?: string;
}

const extractNickname = (nameStr: string): string => {
  const clean = nameStr.trim();
  
  // Custom exact overrides for Janata Bank PLC IT Officers
  if (clean.includes('মনোয়ার')) return 'মনোয়ার';
  if (clean.includes('প্রদীপ্ত')) return 'প্রদীপ্ত';
  if (clean.includes('মারুফ')) return 'মারুফ';
  if (clean.includes('জোবায়ের')) return 'জোবায়ের';
  if (clean.includes('ইমন')) return 'ইমন';
  if (clean.includes('কিবরিয়া') || clean.includes('কিবর')) return 'কিবরিয়া';
  if (clean.includes('সাইফ')) return 'সাইফ';
  if (clean.includes('দেবাশীষ')) return 'দেবাশীষ';
  if (clean.includes('শাহিন')) return 'শাহিন';
  if (clean.includes('সৈকত')) return 'সৈকত';
  if (clean.includes('বাহার')) return 'বাহার';
  if (clean.includes('রিয়াজ')) return 'রিয়াজ';
  if (clean.includes('রবিউল')) return 'রবিউল';
  if (clean.includes('হাদীউজ্জামান') || clean.includes('বাপ্পী')) return 'বাপ্পী';
  if (clean.includes('আরিফুল ইসলাম')) return 'আরিফ'; // Avoid matching 'আরিফুল ইসলাম ইমন'
  if (clean.includes('রাশেদ')) return 'রাশেদ';
  if (clean.includes('জাকির')) return 'জাকির';
  if (clean.includes('ফাতিহ')) return 'ফাতিহ';
  
  // Rule-based fallback
  const parts = clean.split(/\s+/);
  if (parts.length === 0) return 'ইউ';
  
  // Cleaned prefixes (no punctuation, including common variations)
  const prefixes = [
    'জনাব', 'মুhammad', 'muhammad', 'মুহাম্মদ', 'মোহাম্মদ', 'মোহাম্মাদ', 'মো', 'মোঃ', 'মোহা', 'শ্রী', 'ডা', 'ডাঃ', 'ড', 'ডক্টর', 'মহম্মদ', 'মিসেস', 'মিস', 'এসএম'
  ];
  
  for (let i = 0; i < parts.length; i++) {
    const word = parts[i];
    const cleanedWord = word.replace(/[.,:;ঃ]/g, '').trim();
    if (!prefixes.includes(cleanedWord) && cleanedWord.length > 0) {
      return word.substring(0, 10);
    }
  }
  
  return parts[0] ? parts[0].substring(0, 10) : 'ইউ';
};



const STRICT_DESIGNATIONS = [
  'সিনিয়র প্রিন্সিপাল অফিসার (এসপিও)',
  'প্রিন্সিপাল অফিসার (পিও)',
  'সিনিয়র অফিসার-আইটি (এসও-আইটি)',
  'অফিসার-আইটি (ও-আইটি)'
];

export default function EmployeesPage() {
  const { currentUser } = useProfile();
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';
  const [activeTab, setActiveTab] = useState<'employees' | 'cells'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cellFilter, setCellFilter] = useState('select');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterDesignation, setFilterDesignation] = useState('ALL');
  const [filterPhoneStatus, setFilterPhoneStatus] = useState('ALL');
  const [filterBankIdStatus, setFilterBankIdStatus] = useState('ALL');
  const [filterFileNoStatus, setFilterFileNoStatus] = useState('ALL');
  const [isBulkCellModalOpen, setIsBulkCellModalOpen] = useState(false);
  const [bulkCellText, setBulkCellText] = useState('');
  const [bulkCellError, setBulkCellError] = useState('');
  const [bulkCellImporting, setBulkCellImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';
  const isAdminOrAdminCell = isAdmin;

  // Modals state
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editingCell, setEditingCell] = useState<Cell | null>(null);
  const [profileEmp, setProfileEmp] = useState<Employee | null>(null);
  
  const isSelfEditingOnly = !!(editingEmp && currentUser?.role !== 'ADMIN' && editingEmp.bankId?.trim() === currentUser?.username?.trim());

  const [selectedEmps, setSelectedEmps] = useState<number[]>([]);

  const handleInlineSave = async (empId: number, field: string, value: string) => {
    try {
      const res = await fetch(`/api/employees/${empId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'সংশোধন ব্যর্থ হয়েছে।');
      }
      await loadData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`আপনি কি নির্বাচিত ${selectedEmps.length} জন কর্মকর্তাকে সরিয়ে দিতে চান?`)) return;
    setLoading(true);
    try {
      for (const id of selectedEmps) {
        await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      }
      setSelectedEmps([]);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('কিছু কর্মকর্তার ডেটা ডিলিট করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  // Helper for premium HSL color palettes
  const getPalette = (cellId: number) => {
    const palettes = [
      {
        name: 'indigo',
        border: 'border-indigo-200 dark:border-indigo-900/50',
        bg: 'bg-indigo-50/20 dark:bg-indigo-950/5',
        badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400',
        text: 'text-indigo-650 dark:text-indigo-400'
      },
      {
        name: 'emerald',
        border: 'border-emerald-200 dark:border-emerald-900/50',
        bg: 'bg-emerald-50/20 dark:bg-emerald-950/5',
        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
        text: 'text-emerald-650 dark:text-emerald-400'
      },
      {
        name: 'amber',
        border: 'border-amber-200 dark:border-amber-900/50',
        bg: 'bg-amber-50/20 dark:bg-amber-950/5',
        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
        text: 'text-amber-650 dark:text-amber-400'
      },
      {
        name: 'rose',
        border: 'border-rose-200 dark:border-rose-900/50',
        bg: 'bg-rose-50/20 dark:bg-rose-950/5',
        badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-455',
        text: 'text-rose-650 dark:text-rose-400'
      },
      {
        name: 'violet',
        border: 'border-violet-200 dark:border-violet-900/50',
        bg: 'bg-violet-50/20 dark:bg-violet-950/5',
        badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
        text: 'text-violet-650 dark:text-violet-400'
      },
      {
        name: 'cyan',
        border: 'border-cyan-200 dark:border-cyan-900/50',
        bg: 'bg-cyan-50/20 dark:bg-cyan-950/5',
        badge: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400',
        text: 'text-cyan-650 dark:text-cyan-400'
      },
      {
        name: 'teal',
        border: 'border-teal-200 dark:border-teal-900/50',
        bg: 'bg-teal-50/20 dark:bg-teal-950/5',
        badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400',
        text: 'text-teal-650 dark:text-teal-400'
      },
      {
        name: 'sky',
        border: 'border-sky-200 dark:border-sky-900/50',
        bg: 'bg-sky-50/20 dark:bg-sky-950/5',
        badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-405',
        text: 'text-sky-650 dark:text-sky-400'
      }
    ];
    return palettes[cellId % palettes.length];
  };

  // Helper for Bangla digits
  const toBanglaDigits = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  // Form states
  const [empForm, setEmpForm] = useState({
    name: '',
    nameEn: '',
    designation: STRICT_DESIGNATIONS[0],
    designationEn: '',
    bankId: '',
    fileNo: '',
    mobile: '',
    cellId: ''
  });
  const [cellForm, setCellForm] = useState({
    name: '',
    description: ''
  });

  const [errorMessage, setErrorMessage] = useState('');

  // Bulk Import states
  const [isBulkEmpModalOpen, setIsBulkEmpModalOpen] = useState(false);
  const [bulkEmpText, setBulkEmpText] = useState('');
  const [bulkEmpCellId, setBulkEmpCellId] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // Image paste parsing states
  const [isImageImportLoading, setIsImageImportLoading] = useState(false);
  const [customApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ai_api_key') || '';
    }
    return '';
  });

  const allowedCellIds = (() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN') return cells.map(c => c.id);
    const ids = new Set<number>();
    if (currentUser.cells) {
      currentUser.cells.forEach(c => ids.add(c.id));
    }
    const emp = employees.find(e => e.bankId?.trim() === currentUser.username?.trim());
    if (emp) {
      ids.add(emp.cellId);
    }
    return Array.from(ids);
  })();

  const ownEmployee = employees.find(emp => emp.bankId?.trim() === currentUser?.username?.trim());
  const ownCellId = ownEmployee ? ownEmployee.cellId : (currentUser?.cells?.[0]?.id || null);

  const selectableCells = (() => {
    if (cellFilter === 'select') {
      return [];
    }
    if (cellFilter === 'all') {
      return cells;
    }
    if (cellFilter === 'executives') {
      return [];
    }
    return cells.filter(cell => cell.id.toString() === cellFilter);
  })();

  const formSelectableCells = (() => {
    if (!currentUser || currentUser.role === 'ADMIN') {
      return cells;
    }
    return cells.filter(cell => allowedCellIds.includes(cell.id));
  })();



  const generateEmployeeList = async (): Promise<string | null> => {
    setGenerating(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/documents/generate-employee-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cellFilter })
      });
      const data = await res.json();
      if (res.ok && data.success && data.filePath) {
        return data.filePath;
      } else {
        setErrorMessage(data.message || 'কর্মকর্তা তালিকা প্রস্তুত করতে ব্যর্থ হয়েছে।');
        return null;
      }
    } catch (err) {
      console.error('Error generating employee list:', err);
      setErrorMessage('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const handleDirectPrint = async () => {
    const path = await generateEmployeeList();
    if (path) {
      const iframe = document.getElementById('silent-print-iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.src = path;
        iframe.onload = () => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        };
      }
    }
  };

  const handlePrintPreview = async () => {
    const path = await generateEmployeeList();
    if (path) {
      setIframeUrl(path);
      setIsPreviewOpen(true);
    }
  };

  // Fetch initial data
  async function loadData() {
    setLoading(true);
    try {
      const [empRes, cellRes, execRes] = await Promise.all([
        fetch('/api/employees?directory=true'),
        fetch('/api/cells'),
        fetch('/api/executives')
      ]);
      const empData = await empRes.json();
      const cellData = await cellRes.json();
      const execData = await execRes.json();
      
      setEmployees(Array.isArray(empData) ? empData : []);
      setCells(Array.isArray(cellData) ? cellData : []);

      // Filter out GMs strictly, leaving only DGMs and AGMs
      const filteredExecs = (Array.isArray(execData) ? execData : []).filter(e => {
        const d = e.designation.trim();
        return (
          d.includes('উপ-মহাব্যবস্থাপক') || 
          d.includes('সহকারী মহাব্যবস্থাপক') || 
          d.includes('ডিজিএম') || 
          d.includes('এজিএম') || 
          d.toLowerCase().includes('dgm') || 
          d.toLowerCase().includes('agm')
        ) && !(
          d.includes('মহাব্যবস্থাপক') && 
          !d.includes('উপ-') && 
          !d.includes('সহকারী')
        );
      });
      setExecutives(filteredExecs);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!isAdminOrAdminCell && ownCellId) {
      timer = setTimeout(() => {
        setCellFilter(ownCellId.toString());
      }, 0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAdminOrAdminCell, ownCellId]);

  // Handle Officer Form Submit
  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!empForm.name.trim() || !empForm.designation.trim() || !empForm.cellId || !empForm.bankId.trim() || !empForm.fileNo.trim()) {
      setErrorMessage('নাম, পদবী, ব্যাংক আইডি, নথি নম্বর এবং সেল অবশ্যই পূরণ করতে হবে।');
      return;
    }

    try {
      const url = editingEmp ? `/api/employees/${editingEmp.id}` : '/api/employees';
      const method = editingEmp ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empForm)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save officer');
      }

      setIsEmpModalOpen(false);
      setEditingEmp(null);
      setEmpForm({ name: '', nameEn: '', designation: STRICT_DESIGNATIONS[0], designationEn: '', bankId: '', fileNo: '', mobile: '', cellId: '' });
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setErrorMessage(msg === 'cell_required' ? 'অনুগ্রহ করে সেল সিলেক্ট করুন।' : 'সার্ভার সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    }
  };

  // Handle Cell Form Submit
  const handleCellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!cellForm.name.trim()) {
      setErrorMessage('সেলের নাম অবশ্যই পূরণ করতে হবে।');
      return;
    }

    try {
      const url = editingCell ? `/api/cells/${editingCell.id}` : '/api/cells';
      const method = editingCell ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cellForm)
      });
      
      if (!res.ok) {
        const err = await res.json();
        if (err.error === 'cell_exists') {
          throw new Error('এই নামের সেল ইতিমধ্যেই যোগ করা আছে।');
        }
        throw new Error('Failed to save cell');
      }

      setIsCellModalOpen(false);
      setEditingCell(null);
      setCellForm({ name: '', description: '' });
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'সেল সংরক্ষণ করতে সমস্যা হয়েছে।';
      setErrorMessage(msg);
    }
  };

  // Delete Officer
  const deleteEmployee = async (id: number) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই কর্মকর্তাকে মুছে ফেলতে চান? এর ফলে তার সব ডিউটি হিস্ট্রি ডিলিট হবে।")) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (res.ok) loadData();
    } catch (err) {
      console.error("Error deleting officer:", err);
    }
  };

  // Delete Cell
  const deleteCell = async (cell: Cell) => {
    if (cell._count && cell._count.employees > 0) {
      alert("এই সেলে কর্মকর্তা কর্মরত রয়েছে! সেলটি ডিলিট করার আগে কর্মকর্তাদের অন্য সেলে স্থানান্তর করুন।");
      return;
    }
    if (!confirm(`আপনি কি নিশ্চিতভাবে "${cell.name}" সেলটি মুছে ফেলতে চান?`)) return;
    
    try {
      const res = await fetch(`/api/cells/${cell.id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.error === "cell_has_employees" ? "সেলটি ডিলিট করা যাচ্ছে না কারণ এতে কর্মকর্তা কর্মরত আছে।" : "সেল মুছে ফেলতে সমস্যা হয়েছে।");
      }
    } catch (err) {
      console.error("Error deleting cell:", err);
    }
  };

  const handleBulkEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError('');
    
    if (!bulkEmpText.trim()) {
      setBulkError('অনুগ্রহ করে কর্মকর্তাদের নামের টেক্সট পেস্ট করুন।');
      return;
    }
    
    const lines = bulkEmpText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      setBulkError('কোনো কর্মকর্তা তথ্য পাওয়া যায়নি।');
      return;
    }

    const parseRow = (line: string): string[] => {
      const row: string[] = [];
      let col = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            col += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if ((char === ',' || char === '\t' || char === '|' || char === ';') && !inQuotes) {
          row.push(col.trim());
          col = '';
        } else {
          col += char;
        }
      }
      row.push(col.trim());
      return row;
    };

    const mapDesignation = (rawDesig: string): string => {
      const clean = (rawDesig || '').toLowerCase();
      if (clean.includes('এসপিও') || clean.includes('সিনিয়র প্রিন্সিপাল') || clean.includes('spo')) {
        return STRICT_DESIGNATIONS[0];
      }
      if (clean.includes('পিও') || clean.includes('প্রিন্সিপাল') || clean.includes('po')) {
        return STRICT_DESIGNATIONS[1];
      }
      if (clean.includes('এসো') || clean.includes('এসও') || clean.includes('so') || clean.includes('সিনিয়র অফিসার') || clean.includes('so-it') || clean.includes('অফিসার-আইটি (এসও-আইটি)')) {
        return STRICT_DESIGNATIONS[2];
      }
      return STRICT_DESIGNATIONS[3]; // default: Officer-IT
    };

    let hasHeader = false;
    let nameIdx = 0;
    let desigIdx = 1;
    let bankIdx = 2;
    let fileIdx = 3;
    let mobileIdx = 4;
    let cellIdx = 5;

    // Detect if first line is a header
    const firstRow = parseRow(lines[0]).map(c => c.trim().toLowerCase());
    const headerMatches = firstRow.some(h => 
      h.includes('নাম') || h.includes('name') || 
      h.includes('পদব') || h.includes('designation') || 
      h.includes('ব্যাংক') || h.includes('bank') || 
      h.includes('নথি') || h.includes('file') || 
      h.includes('মোবাইল') || h.includes('mobile') || 
      h.includes('সেল') || h.includes('cell')
    );

    if (headerMatches) {
      hasHeader = true;
      nameIdx = firstRow.findIndex(h => h.includes('নাম') || h.includes('name'));
      desigIdx = firstRow.findIndex(h => h.includes('পদব') || h.includes('designation'));
      bankIdx = firstRow.findIndex(h => h.includes('ব্যাংক') || h.includes('bank') || h.includes('আইডি') || h.includes('id'));
      fileIdx = firstRow.findIndex(h => h.includes('নথি') || h.includes('file'));
      mobileIdx = firstRow.findIndex(h => h.includes('মোবাইল') || h.includes('mobile') || h.includes('ফোন') || h.includes('phone'));
      cellIdx = firstRow.findIndex(h => h.includes('সেল') || h.includes('cell'));
    }

    const startRowIdx = hasHeader ? 1 : 0;
    const parsed: BulkEmployeeInput[] = [];

    for (let idx = startRowIdx; idx < lines.length; idx++) {
      const line = lines[idx];
      if (!line) continue;

      let name = '';
      let designation = '';
      let bankId = '';
      let fileNo = '';
      let mobile = '';
      let cellName = '';

      const row = parseRow(line);
      if (row.length === 1 && line.includes(' - ')) {
        const parts = line.split(' - ');
        name = parts[0].trim();
        designation = parts.slice(1).join(' - ').trim();
      } else if (hasHeader) {
        name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].replace(/^["']|["']$/g, '').trim() : '';
        designation = desigIdx !== -1 && row[desigIdx] ? row[desigIdx].replace(/^["']|["']$/g, '').trim() : '';
        bankId = bankIdx !== -1 && row[bankIdx] ? row[bankIdx].replace(/^["']|["']$/g, '').trim() : '';
        fileNo = fileIdx !== -1 && row[fileIdx] ? row[fileIdx].replace(/^["']|["']$/g, '').trim() : '';
        mobile = mobileIdx !== -1 && row[mobileIdx] ? row[mobileIdx].replace(/^["']|["']$/g, '').trim() : '';
        cellName = cellIdx !== -1 && row[cellIdx] ? row[cellIdx].replace(/^["']|["']$/g, '').trim() : '';
      } else {
        name = row[0] ? row[0].replace(/^["']|["']$/g, '').trim() : '';
        designation = row[1] ? row[1].replace(/^["']|["']$/g, '').trim() : '';
        bankId = row[2] ? row[2].replace(/^["']|["']$/g, '').trim() : '';
        fileNo = row[3] ? row[3].replace(/^["']|["']$/g, '').trim() : '';
        mobile = row[4] ? row[4].replace(/^["']|["']$/g, '').trim() : '';
        cellName = row[5] ? row[5].replace(/^["']|["']$/g, '').trim() : '';
      }

      if (!name) continue;

      parsed.push({
        name,
        designation: mapDesignation(designation),
        bankId: bankId || null,
        fileNo: fileNo || null,
        mobile: mobile || null,
        cellName
      });
    }

    if (parsed.length === 0) {
      setBulkError('কোনো সঠিক কর্মকর্তা তথ্য পাওয়া যায়নি।');
      return;
    }

    setBulkImporting(true);
    try {
      let currentCells = [...cells];

      for (const emp of parsed) {
        let cellId: number | null = null;

        // 1. Resolve cell by name
        if (emp.cellName) {
          const matchedCell = currentCells.find(c => c.name.trim().toLowerCase() === emp.cellName.trim().toLowerCase());
          if (matchedCell) {
            cellId = matchedCell.id;
          } else if (currentUser?.role === 'ADMIN') {
            const cellRes = await fetch('/api/cells', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: emp.cellName.trim(), description: '' })
            });
            if (cellRes.ok) {
              const newCell = await cellRes.json();
              currentCells.push(newCell);
              setCells(prev => [...prev, newCell]);
              cellId = newCell.id;
            } else {
              const err = await cellRes.json();
              if (err.error === 'cell_exists') {
                // Try fetching cells again or look it up (race condition safety)
                const cellsRes = await fetch('/api/cells');
                const updatedCells = await cellsRes.json();
                if (Array.isArray(updatedCells)) {
                  setCells(updatedCells);
                  currentCells = updatedCells;
                  const retryMatch = updatedCells.find(c => c.name.trim().toLowerCase() === emp.cellName.trim().toLowerCase());
                  if (retryMatch) cellId = retryMatch.id;
                }
              }
            }
          }
        }

        // 2. Fallback to dropdown cell
        if (!cellId && bulkEmpCellId) {
          cellId = parseInt(bulkEmpCellId, 10);
        }

        // 3. Fallback to own cell
        if (!cellId) {
          cellId = ownCellId;
        }

        if (!cellId) {
          throw new Error(`"${emp.name}" কর্মকর্তার জন্য কোনো সেল পাওয়া যায়নি বা নির্বাচন করা হয়নি।`);
        }

        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: emp.name,
            designation: emp.designation,
            bankId: emp.bankId,
            fileNo: emp.fileNo,
            mobile: emp.mobile,
            cellId
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || err.error || `"${emp.name}" কর্মকর্তাকে সংরক্ষণ করতে ব্যর্থ হয়েছে।`);
        }
      }

      setIsBulkEmpModalOpen(false);
      setBulkEmpText('');
      setBulkError('');
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'আমদানিতে ত্রুটি হয়েছে। অনুগ্রহ করে ডেটা চেক করে পুনরায় চেষ্টা করুন।';
      setBulkError(msg);
    } finally {
      setBulkImporting(false);
    }
  };

  const handleBulkCellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkCellError("");
    
    if (!bulkCellText.trim()) {
      setBulkCellError("অনুগ্রহ করে সেলের নামগুলো পেস্ট করুন।");
      return;
    }
    
    const lines = bulkCellText.split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);
      
    if (lines.length === 0) {
      setBulkCellError("কোনো সেলের নাম পাওয়া যায়নি।");
      return;
    }
    
    setBulkCellImporting(true);
    try {
      for (const name of lines) {
        const exists = cells.some(c => c.name.trim().toLowerCase() === name.toLowerCase());
        if (exists) continue;

        const res = await fetch("/api/cells", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description: "" })
        });
        
        if (!res.ok) {
          const err = await res.json();
          if (err.error !== "cell_exists") {
            throw new Error(err.message || err.error || `"${name}" সেলটি সংরক্ষণ করতে ব্যর্থ হয়েছে।`);
          }
        }
      }
      
      setIsBulkCellModalOpen(false);
      setBulkCellText("");
      setBulkCellError("");
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'সেল আমদানি করতে সমস্যা হয়েছে।';
      setBulkCellError(msg);
    } finally {
      setBulkCellImporting(false);
    }
  };

  const parseImageAndPopulate = async (base64Data: string, fileType: string) => {
    setIsImageImportLoading(true);
    setBulkError('');
    
    try {
      const res = await fetch('/api/employees/parse-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          fileType: fileType,
          customApiKey: customApiKey
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'ইমেজ পার্স করতে ব্যর্থ হয়েছে।');
      }

      if (data.employees && Array.isArray(data.employees)) {
        const textLines = data.employees.map((emp: { name: string; designation: string }) => `${emp.name} - ${emp.designation}`).join('\n');
        setBulkEmpText(prev => prev ? `${prev}\n${textLines}` : textLines);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ছবি থেকে তথ্য বের করতে সমস্যা হয়েছে।';
      setBulkError(msg);
    } finally {
      setIsImageImportLoading(false);
    }
  };

  const handleTextareaPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          await parseImageAndPopulate(base64Data, file.type);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };



  // Set forms for editing
  const startEditEmp = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpForm({
      name: emp.name,
      nameEn: emp.nameEn || '',
      designation: STRICT_DESIGNATIONS.includes(emp.designation) ? emp.designation : STRICT_DESIGNATIONS[0],
      designationEn: emp.designationEn || '',
      bankId: emp.bankId || '',
      fileNo: emp.fileNo || '',
      mobile: emp.mobile || '',
      cellId: emp.cellId.toString()
    });
    setErrorMessage('');
    setIsEmpModalOpen(true);
  };

  const startEditCell = (cell: Cell) => {
    setEditingCell(cell);
    setCellForm({
      name: cell.name,
      description: cell.description || ''
    });
    setErrorMessage('');
    setIsCellModalOpen(true);
  };

  const exportEmployeesToCSV = () => {
    let csvContent = '\uFEFFনাম,পদবী,ব্যাংক আইডি,নথি নং,মোবাইল নম্বর,সেল\n';
    filteredEmployees.forEach(emp => {
      const name = `"${emp.name.replace(/"/g, '""')}"`;
      const designation = `"${emp.designation.replace(/"/g, '""')}"`;
      const bankId = `"${(emp.bankId || '').replace(/"/g, '""')}"`;
      const fileNo = `"${(emp.fileNo || '').replace(/"/g, '""')}"`;
      const mobile = `"${(emp.mobile || '').replace(/"/g, '""')}"`;
      const cellName = `"${(emp.cell?.name || '').replace(/"/g, '""')}"`;
      csvContent += `${name},${designation},${bankId},${fileNo},${mobile},${cellName}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCellsToCSV = () => {
    let csvContent = '\uFEFFসেলের নাম,কর্মকর্তা সংখ্যা\n';
    cells.forEach(cell => {
      const name = `"${cell.name.replace(/"/g, '""')}"`;
      const empCount = cell._count?.employees || 0;
      csvContent += `${name},${empCount}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cells_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter lists
  const filteredEmployees = employees.filter(emp => {
    const isAdditional = emp.dutyType === 'ADDITIONAL';
    const isSelf = !!(emp.bankId && currentUser?.username && emp.bankId.trim() === currentUser.username.trim());
    if (isAdditional && currentUser?.role !== 'ADMIN' && !isSelf) {
      return false;
    }

    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (emp.bankId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (emp.fileNo || '').toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCell = false;
    if (cellFilter === 'select') {
      matchesCell = false;
    } else if (cellFilter === 'all') {
      matchesCell = true;
    } else if (cellFilter === 'executives') {
      matchesCell = false;
    } else {
      matchesCell = emp.cellId.toString() === cellFilter;
    }
    
    const matchesDesignation = filterDesignation === 'ALL' || emp.designation === filterDesignation;
    const matchesPhone = filterPhoneStatus === 'ALL' || 
      (filterPhoneStatus === 'has_phone' && emp.mobile && emp.mobile.trim().length > 0) ||
      (filterPhoneStatus === 'no_phone' && (!emp.mobile || emp.mobile.trim().length === 0));
    const matchesBankId = filterBankIdStatus === 'ALL' || 
      (filterBankIdStatus === 'has_bank_id' && emp.bankId && emp.bankId.trim().length > 0) ||
      (filterBankIdStatus === 'no_bank_id' && (!emp.bankId || emp.bankId.trim().length === 0));
    const matchesFileNo = filterFileNoStatus === 'ALL' || 
      (filterFileNoStatus === 'has_file_no' && emp.fileNo && emp.fileNo.trim().length > 0) ||
      (filterFileNoStatus === 'no_file_no' && (!emp.fileNo || emp.fileNo.trim().length === 0));

    return matchesSearch && matchesCell && matchesDesignation && matchesPhone && matchesBankId && matchesFileNo;
  });

  const filteredExecutives = executives.filter(exec => {
    const matchesSearch = exec.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          exec.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (exec.bankId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (exec.fileNo || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPhone = filterPhoneStatus === 'ALL' || 
      (filterPhoneStatus === 'has_phone' && exec.phone && exec.phone.trim().length > 0) ||
      (filterPhoneStatus === 'no_phone' && (!exec.phone || exec.phone.trim().length === 0));
    const matchesBankId = filterBankIdStatus === 'ALL' || 
      (filterBankIdStatus === 'has_bank_id' && exec.bankId && exec.bankId.trim().length > 0) ||
      (filterBankIdStatus === 'no_bank_id' && (!exec.bankId || exec.bankId.trim().length === 0));
    const matchesFileNo = filterFileNoStatus === 'ALL' || 
      (filterFileNoStatus === 'has_file_no' && exec.fileNo && exec.fileNo.trim().length > 0) ||
      (filterFileNoStatus === 'no_file_no' && (!exec.fileNo || exec.fileNo.trim().length === 0));

    return matchesSearch && matchesPhone && matchesBankId && matchesFileNo;
  });

  const sortExecutives = (execs: Executive[]) => {
    return [...execs].sort((a, b) => {
      const priority = (desig: string) => {
        const d = desig.toLowerCase();
        if (d.includes('উপ-মহাব্যবস্থাপক') || d.includes('ডিজিএম') || d.includes('dgm')) return 1;
        if (d.includes('সহকারী মহাব্যবস্থাপক') || d.includes('এজিএম') || d.includes('agm')) return 2;
        return 3;
      };
      const pA = priority(a.designation);
      const pB = priority(b.designation);
      if (pA !== pB) return pA - pB;
      return (a.fileNo || '').localeCompare(b.fileNo || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  };


  const sortedFilteredExecutives = sortExecutives(filteredExecutives);

  if (loading) return (
    <div className="p-6 space-y-6">
      <CardSkeleton count={3} />
      <TableSkeleton rows={6} columns={4} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Tabs Toggler */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">কর্মকর্তা ও সেল ডিরেক্টরি</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">কর্মকর্তাবৃন্দ এবং সেল (Cell) ম্যানেজমেন্ট প্যানেল।</p>
        </div>
        
        {/* TAB CONTROLLERS */}
        {isAdminOrAdminCell && (
          <div className="flex bg-slate-200/60 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800/80 self-start md:self-auto shadow-inner">
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'employees' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <Users size={14} />
              কর্মকর্তাবৃন্দ
            </button>
            <button
              onClick={() => setActiveTab('cells')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'cells' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <Building2 size={14} />
              সেলসমূহ
            </button>
          </div>
        )}
      </div>

      {loading ? (
        /* Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : activeTab === 'employees' ? (
        // ----------------------------------------------------
        // EMPLOYEES TAB
        // ----------------------------------------------------
        <div className="space-y-6">
          {/* Controls Menu */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="কর্মকর্তার নাম, পদবী, ব্যাংক আইডি বা নথি নং দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/30 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              {/* Cell Selector Filter */}
              {isAdminOrAdminCell && (
                <select
                  value={cellFilter}
                  onChange={(e) => setCellFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
                >
                  <option value="select">সিলেক্ট করুন (Select Cell)</option>
                  <option value="all">সকল সেলের কর্মকর্তা (All Cells)</option>
                  <option value="executives">নির্বাহী কর্মকর্তা (Executives)</option>
                  {cells.map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                </select>
              )}
              {/* Advanced Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  showAdvancedFilters || filterDesignation !== 'ALL' || filterPhoneStatus !== 'ALL' || filterBankIdStatus !== 'ALL' || filterFileNoStatus !== 'ALL'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400 font-bold'
                    : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350'
                }`}
              >
                <Filter size={14} />
                <span>ফিল্টারসমূহ</span>
                {(filterDesignation !== 'ALL' || filterPhoneStatus !== 'ALL' || filterBankIdStatus !== 'ALL' || filterFileNoStatus !== 'ALL') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
              <button
                onClick={exportEmployeesToCSV}
                disabled={cellFilter === 'select'}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-100/50 dark:shadow-none transition-all duration-200 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <Download size={16} />
                এক্সপোর্ট করুন
              </button>
              
              <button
                onClick={handlePrintPreview}
                disabled={generating || cellFilter === 'select'}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-colors border border-slate-250 dark:border-slate-750 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? <Loader2 className="animate-spin" size={16} /> : <Eye size={16} />}
                প্রিন্ট প্রিভিউ
              </button>
              
              <button
                onClick={handleDirectPrint}
                disabled={generating || cellFilter === 'select'}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
                ডাউনলোড পিডিএফ
              </button>
              {(currentUser?.role === 'ADMIN' || allowedCellIds.length > 0) && selectableCells.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      setBulkEmpText('');
                      setBulkError('');
                      setIsBulkEmpModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-colors border border-slate-250 dark:border-slate-750"
                  >
                    <Plus size={16} />
                    বাল্ক টেক্সট আপলোড
                  </button>
                  <button
                    onClick={() => {
                      setEditingEmp(null);
                      setEmpForm({ name: '', nameEn: '', designation: STRICT_DESIGNATIONS[0], designationEn: '', bankId: '', fileNo: '', mobile: '', cellId: formSelectableCells[0]?.id.toString() || '' });
                      setErrorMessage('');
                      setIsEmpModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors"
                  >
                    <Plus size={16} />
                    নতুন কর্মকর্তা যোগ করুন
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 animate-fadeIn">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">পদবী (Designation)</label>
                <select
                  value={filterDesignation}
                  onChange={(e) => setFilterDesignation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-755 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">সকল পদবী (All)</option>
                  {STRICT_DESIGNATIONS.map(d => (
                    <option key={d} value={d}>{d.replace(' (এসপিও)', '').replace(' (পিও)', '').replace(' (এসও-আইটি)', '').replace(' (ও-আইটি)', '')}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">মোবাইল নম্বর</label>
                <select
                  value={filterPhoneStatus}
                  onChange={(e) => setFilterPhoneStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-755 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">সবাই (All)</option>
                  <option value="has_phone">মোবাইল নম্বর আছে</option>
                  <option value="no_phone">মোবাইল নম্বর নেই</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ব্যাংক আইডি</label>
                <select
                  value={filterBankIdStatus}
                  onChange={(e) => setFilterBankIdStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-855 bg-white dark:bg-slate-955 text-xs font-semibold text-slate-755 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">সবাই (All)</option>
                  <option value="has_bank_id">ব্যাংক আইডি আছে</option>
                  <option value="no_bank_id">ব্যাংক আইডি নেই</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">নথি নম্বর</label>
                <select
                  value={filterFileNoStatus}
                  onChange={(e) => setFilterFileNoStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-755 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">সবাই (All)</option>
                  <option value="has_file_no">নথি নম্বর আছে</option>
                  <option value="no_file_no">নথি নম্বর নেই</option>
                </select>
              </div>
            </div>
          )}

          {/* Grouped Officers List by Cell */}
          {(filteredEmployees.length > 0 || (isAdminOrAdminCell && cellFilter === 'executives' && sortedFilteredExecutives.length > 0)) ? (
            <div className="space-y-10">
              
              {/* 1. Executive Panel (DGM & AGM) */}
              {isAdminOrAdminCell && cellFilter === 'executives' && sortedFilteredExecutives.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Executive Header Badge */}
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-955/5 shadow-xs" style={{ borderLeft: '4px solid #db2777' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-center text-rose-600 animate-pulse">
                        <Users size={16} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-rose-800 dark:text-rose-300 text-sm tracking-wide">নির্বাহী প্যানেল (ডিজিএম ও এজিএম)</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold mt-0.5">অনলাইন ব্যাংকিং ডিপার্টমেন্টের উপ-মহাব্যবস্থাপক ও সহকারী মহাব্যবস্থাপকগণ।</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                      {toBanglaDigits(sortedFilteredExecutives.length)} জন নির্বাহী কর্মকর্তা
                    </span>
                  </div>

                  {/* Executives Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedFilteredExecutives.map((exec) => {
                      const dgmIndices = sortedFilteredExecutives
                        .filter(e => e.designation.includes('উপ-মহাব্যবস্থাপক') || e.designation.includes('ডিজিএম') || e.designation.toLowerCase().includes('dgm'))
                        .map(e => e.id);
                      const dgmRank = dgmIndices.indexOf(exec.id) + 1;
                      const isDGM = dgmRank > 0;
                      
                      let accentColor = '#db2777'; // default rose/pink for AGMs
                      let borderClass = 'border-rose-200 dark:border-rose-900/50';
                      let bgClass = 'bg-rose-50/10 dark:bg-rose-955/5 text-rose-850 dark:text-rose-300';
                      let textClass = 'text-rose-800 dark:text-rose-200 group-hover:text-rose-900';
                      
                      if (isDGM) {
                        if (dgmRank === 1) {
                          accentColor = '#2563eb'; // Royal Blue for 1st DGM
                          borderClass = 'border-blue-200 dark:border-blue-900/50';
                          bgClass = 'bg-blue-50/10 dark:bg-blue-955/5 text-blue-850 dark:text-blue-300';
                          textClass = 'text-blue-800 dark:text-blue-200 group-hover:text-blue-950';
                        } else if (dgmRank === 2) {
                          accentColor = '#d97706'; // Amber/Orange for 2nd DGM
                          borderClass = 'border-amber-200 dark:border-amber-900/50';
                          bgClass = 'bg-amber-50/10 dark:bg-amber-955/5 text-amber-850 dark:text-amber-300';
                          textClass = 'text-amber-800 dark:text-amber-250 group-hover:text-amber-950';
                        } else {
                          accentColor = '#0d9488'; // Teal for subsequent DGMs
                          borderClass = 'border-teal-200 dark:border-teal-900/50';
                          bgClass = 'bg-teal-50/10 dark:bg-teal-955/5 text-teal-850 dark:text-teal-300';
                          textClass = 'text-teal-800 dark:text-teal-250 group-hover:text-teal-950';
                        }
                      }
                      
                      return (
                        <div key={exec.id} className={`p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all duration-300 group border-l-3 ${borderClass} ${bgClass}`} style={{ borderLeft: `3px solid ${accentColor}` }}>
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className={`app-card-title transition-colors ${textClass}`}>{exec.name}</h3>
                                <p className="text-[13px] sm:text-[14px] font-medium text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1.5">
                                  <Briefcase size={12} className="text-slate-400" />
                                  {exec.designation}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 app-metadata-text text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                              <div className="flex items-center gap-1">
                                <Hash size={12} className="text-slate-400" />
                                <span>ব্যাংক আইডি: <strong>{exec.bankId || '-'}</strong></span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CreditCard size={12} className="text-slate-400" />
                                <span>নথি নং: <strong className="font-mono">{exec.fileNo || '-'}</strong></span>
                              </div>
                            </div>

                            <div className="mt-2 app-metadata-text text-slate-500 dark:text-slate-400 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800/80">
                              <span>মোবাইল নম্বর: <strong className="font-sans">{exec.phone ? toBanglaDigits(exec.phone) : '-'}</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Cell Groups */}
              {cells
                .filter(cell => {
                  const cellEmps = filteredEmployees.filter(emp => emp.cellId === cell.id);
                  return cellEmps.length > 0;
                })
                .map((cell) => {
                  const cellEmps = sortEmployeesBySeniority(
                    filteredEmployees.filter(emp => emp.cellId === cell.id)
                  );
                  const cellPal = getPalette(cell.id);
                  
                  return (
                    <div key={cell.id} className="space-y-4">
                      
                      {/* Cell Group Header Badge */}
                      <div className={`flex items-center justify-between p-4 rounded-2xl ${cellPal.border} ${cellPal.bg} shadow-xs`}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-center text-slate-700 dark:text-slate-350">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <h3 className="app-card-title text-slate-800 dark:text-slate-100 tracking-wide">{cell.name}</h3>
                            {cell.description && (
                              <p className="app-metadata-text text-slate-400 dark:text-slate-550 font-bold mt-0.5">{cell.description}</p>
                            )}
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans ${cellPal.badge}`}>
                          {toBanglaDigits(cellEmps.length)} জন কর্মকর্তা
                        </span>
                      </div>

                      {/* Employees Grid in this Cell */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cellEmps.map((emp) => {
                          const firstSpoId = cellEmps.find(e => e.designation === 'সিনিয়র প্রিন্সিপাল অফিসার (এসপিও)')?.id || null;
                          const isCellIncharge = emp.dutyType === 'INCHARGE' || emp.id === firstSpoId;
                          const pal = getPalette(emp.cellId);
                          const canUserEdit = currentUser?.role === 'ADMIN' || allowedCellIds.includes(emp.cellId);
                          const isSelf = !!(emp.bankId && currentUser?.username && emp.bankId.trim() === currentUser.username.trim());
                          const canInlineEdit = currentUser?.role === 'ADMIN' || isSelf;
                          
                          return (
                            <div key={emp.id} className={`p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all duration-300 group border-l-3 ${isCellIncharge ? 'border-teal-200 dark:border-teal-900/50 bg-teal-50/10 dark:bg-teal-955/5 shadow-xs' : pal.border} ${isCellIncharge ? '' : pal.bg}`} style={isCellIncharge ? { borderLeft: '3px solid #0d9488' } : {}}>
                              <div className="space-y-4 cursor-pointer" onClick={() => setProfileEmp(emp)}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-2">
                                    {canUserEdit && (
                                      <input 
                                        type="checkbox"
                                        checked={selectedEmps.includes(emp.id)}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          if (e.target.checked) {
                                            setSelectedEmps(prev => [...prev, emp.id]);
                                          } else {
                                            setSelectedEmps(prev => prev.filter(id => id !== emp.id));
                                          }
                                        }}
                                        className="w-4.5 h-4.5 rounded-lg border-slate-350 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0 mt-1 select-none"
                                      />
                                    )}
                                    <div>
                                      <h3 className={`app-card-title transition-colors flex flex-wrap items-center gap-1.5 ${isCellIncharge ? 'text-teal-700 dark:text-teal-400 group-hover:text-teal-800' : 'text-slate-800 dark:text-slate-100 group-hover:text-indigo-650 dark:group-hover:text-indigo-400'}`}>
                                        <span>{isEn && emp.nameEn ? emp.nameEn : emp.name}</span>
                                        {emp.dutyType === 'INCHARGE' ? (
                                          <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800 text-[9px] font-extrabold rounded-lg">
                                            {isEn ? 'Cell Incharge' : 'সেল ইনচার্জ'}
                                          </span>
                                        ) : emp.dutyType === 'ADDITIONAL' ? (
                                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[9px] font-extrabold rounded-lg">
                                            {isEn ? 'Additional Duty' : 'অতিরিক্ত দায়িত্ব'}
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-[9px] font-extrabold rounded-lg">
                                            {isEn ? 'Primary Duty' : 'মূল দায়িত্ব'}
                                          </span>
                                        )}
                                      </h3>
                                      <div className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 min-h-[26px]">
                                        <Briefcase size={12} className="text-slate-400 shrink-0" />
                                        <InlineEdit
                                          value={isEn && emp.designationEn ? emp.designationEn : emp.designation}
                                          placeholder={isEn ? "Enter designation" : "পদবী লিখুন"}
                                          onSave={(val) => handleInlineSave(emp.id, isEn ? 'designationEn' : 'designation', val)}
                                          canEdit={canInlineEdit}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 app-metadata-text text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                  <div className="flex items-center gap-1 min-h-[26px]">
                                    <Hash size={12} className="text-slate-400 shrink-0" />
                                    <span className="flex items-center gap-1">আইডি: 
                                      <InlineEdit
                                        value={emp.bankId || ''}
                                        placeholder="আইডি"
                                        onSave={(val) => handleInlineSave(emp.id, 'bankId', val)}
                                        canEdit={canInlineEdit}
                                        className="font-bold inline-block"
                                      />
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 min-h-[26px]">
                                    <CreditCard size={12} className="text-slate-400 shrink-0" />
                                    <span className="flex items-center gap-1">নথি: 
                                      <InlineEdit
                                        value={emp.fileNo || ''}
                                        placeholder="নথি"
                                        onSave={(val) => handleInlineSave(emp.id, 'fileNo', val)}
                                        canEdit={canInlineEdit}
                                        className="font-mono font-bold inline-block"
                                      />
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 col-span-2 min-h-[26px]">
                                    <Phone size={12} className="text-slate-400 shrink-0" />
                                    <span className="flex items-center gap-1">মোবাইল: 
                                      <InlineEdit
                                        value={emp.mobile || ''}
                                        placeholder="তথ্য নেই"
                                        onSave={(val) => handleInlineSave(emp.id, 'mobile', val)}
                                        canEdit={canInlineEdit}
                                        className="font-sans font-bold inline-block"
                                      />
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {(currentUser?.role === 'ADMIN' || allowedCellIds.includes(emp.cellId) || (emp.bankId && currentUser?.username && emp.bankId.trim() === currentUser.username.trim())) && (
                                <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-200/50 dark:border-slate-800/80 font-sans">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditEmp(emp);
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-250 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                                    title="সম্পাদনা"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  {(currentUser?.role === 'ADMIN' || allowedCellIds.includes(emp.cellId)) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteEmployee(emp.id);
                                      }}
                                      className="p-1.5 rounded-lg border border-slate-250 dark:border-slate-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 hover:text-red-650 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
                                      title="муছে ফেলুন"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="glass-card p-12 text-center rounded-2xl max-w-md mx-auto space-y-3">
              <Users className="mx-auto text-slate-300" size={32} />
              <h4 className="font-bold text-slate-800 dark:text-slate-100">
                {cellFilter === 'select' ? 'সেল নির্বাচন করুন' : 'কোনো কর্মকর্তা পাওয়া যায়নি'}
              </h4>
              <p className="text-xs text-slate-400">
                {cellFilter === 'select' 
                  ? 'অনুগ্রহ করে ড্রপডাউন মেনু থেকে কোনো সেল বা অপশন নির্বাচন করুন।' 
                  : 'খুঁজে পাওয়া ডাটা খালি। অনুগ্রহ করে অন্য নাম লিখুন বা নতুন কর্মকর্তা যোগ করুন।'}
              </p>
            </div>
          )}
        </div>
      ) : (
        // ----------------------------------------------------
        // CELLS TAB (Dynamic Cell Management)
        // ----------------------------------------------------
        <div className="space-y-6">
          {/* Headline Controls */}
          <div className="flex items-center justify-between glass-card p-4 rounded-2xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">সেল তালিকা ও কর্মকর্তা ভলিউম</span>
            <div className="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
              <button
                onClick={exportCellsToCSV}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-100/50 dark:shadow-none transition-all duration-200 hover:-translate-y-0.5"
              >
                <Download size={16} />
                সেলসমূহ এক্সপোর্ট
              </button>
              {currentUser?.role === "ADMIN" && (
                <>
                  <button
                    onClick={() => {
                      setBulkCellText("");
                      setBulkCellError("");
                      setIsBulkCellModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-colors border border-slate-250 dark:border-slate-750 cursor-pointer"
                  >
                    <Plus size={16} />
                    বাল্ক সেল আপলোড
                  </button>
                  <button
                    onClick={() => {
                      setEditingCell(null);
                      setCellForm({ name: "", description: "" });
                      setErrorMessage("");
                      setIsCellModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <Plus size={16} />
                    নতুন সেল (Cell) যোগ করুন
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cells List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cells.map((cell) => (
              <div key={cell.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{cell.name}</h3>
                    <span className="px-2.5 py-1 bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-950/20 rounded-lg text-xs font-bold font-sans">
                      {cell._count?.employees || 0} জন কর্মরত
                    </span>
                  </div>
                </div>

                {currentUser?.role === 'ADMIN' && (
                  <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => startEditCell(cell)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => deleteCell(cell)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          EMPLOYEE MODAL (OFFICER)
      ---------------------------------------------------- */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                {editingEmp ? 'কর্মকর্তার তথ্য সম্পাদনা' : 'নতুন কর্মকর্তা যোগ করুন'}
              </h3>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">×</button>
            </div>
            
            <form onSubmit={handleEmpSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="emp_name" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">কর্মকর্তার নাম *</label>
                <input
                  id="emp_name"
                  type="text"
                  required
                  placeholder="যেমন: জনাব মোঃ আশরাফুল ইসলাম"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="emp_nameEn" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ইংরেজি নাম (Name in English)</label>
                <input
                  id="emp_nameEn"
                  type="text"
                  placeholder="যেমন: Md. Ashraful Islam"
                  value={empForm.nameEn}
                  onChange={(e) => setEmpForm({ ...empForm, nameEn: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="emp_designation" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">পদবী (বাংলা) *</label>
                <select
                  id="emp_designation"
                  value={empForm.designation}
                  disabled={isSelfEditingOnly}
                  onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 ${isSelfEditingOnly ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900/60' : ''}`}
                >
                  {STRICT_DESIGNATIONS.map((desig) => (
                    <option key={desig} value={desig}>{desig}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="emp_designationEn" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ইংরেজি পদবী (Designation in English)</label>
                <input
                  id="emp_designationEn"
                  type="text"
                  placeholder="যেমন: Senior Officer (IT)"
                  value={empForm.designationEn}
                  onChange={(e) => setEmpForm({ ...empForm, designationEn: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="emp_bankId" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ব্যাংক আইডি *</label>
                <input
                  id="emp_bankId"
                  type="text"
                  required
                  disabled={isSelfEditingOnly}
                  placeholder="যেমন: 026799"
                  value={empForm.bankId}
                  onChange={(e) => setEmpForm({ ...empForm, bankId: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 ${isSelfEditingOnly ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900/60' : ''}`}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="emp_fileNo" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">নথি নম্বর (File No) *</label>
                <input
                  id="emp_fileNo"
                  type="text"
                  required
                  disabled={isSelfEditingOnly}
                  placeholder="যেমন: SO(Com)-026799"
                  value={empForm.fileNo}
                  onChange={(e) => setEmpForm({ ...empForm, fileNo: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 ${isSelfEditingOnly ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900/60' : ''}`}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="emp_mobile" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">মোবাইল নম্বর</label>
                <input
                  id="emp_mobile"
                  type="text"
                  placeholder="যেমন: 017XXXXXXXX"
                  value={empForm.mobile || ''}
                  onChange={(e) => setEmpForm({ ...empForm, mobile: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="emp_cellId" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">সেল সিলেক্ট করুন *</label>
                <select
                  id="emp_cellId"
                  value={empForm.cellId}
                  disabled={isSelfEditingOnly}
                  onChange={(e) => setEmpForm({ ...empForm, cellId: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold ${isSelfEditingOnly ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900/60' : ''}`}
                >
                  {formSelectableCells.map((c) => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          CELL MODAL
      ---------------------------------------------------- */}
      {isCellModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                {editingCell ? 'সেল তথ্য সম্পাদনা' : 'নতুন সেল (Cell) যোগ করুন'}
              </h3>
              <button onClick={() => setIsCellModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">×</button>
            </div>
            
            <form onSubmit={handleCellSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="cell_name" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">সেলের নাম *</label>
                <input
                  id="cell_name"
                  type="text"
                  required
                  placeholder="যেমন: R9, R22, JBNS ইত্যাদি"
                  value={cellForm.name}
                  onChange={(e) => setCellForm({ ...cellForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>



              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCellModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm"
                >
                  সেল সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          BULK CELL IMPORT MODAL
      ---------------------------------------------------- */}
      {isBulkCellModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                সেল বাল্ক টেক্সট আপলোড (Bulk Import Cells)
              </h3>
              <button onClick={() => setIsBulkCellModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-sans text-xl">×</button>
            </div>
            
            <form onSubmit={handleBulkCellSubmit} className="p-6 space-y-4">
              {bulkCellError && (
                <div className="p-3 bg-red-50 dark:bg-red-955/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-955/30 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  {bulkCellError}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="bulk_cell_file" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  অথবা CSV / Text ফাইল আপলোড করুন
                </label>
                <input
                  id="bulk_cell_file"
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      setBulkCellText(text);
                    };
                    reader.readAsText(file);
                  }}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950/40 dark:file:text-indigo-400 hover:file:bg-indigo-100 transition-all cursor-pointer border border-dashed border-slate-300 dark:border-slate-800 p-2 rounded-xl bg-slate-50/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="bulk_cell_text" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  সেলের নামসমূহ (প্রতি লাইনে একটি) *
                </label>
                <textarea
                  id="bulk_cell_text"
                  required
                  rows={8}
                  placeholder="যেমন:\nR9\nR22\nJBNS\nCBS Integrated Development Cell"
                  value={bulkCellText}
                  onChange={(e) => setBulkCellText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-955/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 font-sans">
                <button
                  type="button"
                  onClick={() => setIsBulkCellModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={bulkCellImporting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400"
                >
                  {bulkCellImporting ? "আমদানি হচ্ছে..." : "ইম্পোর্ট করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          BULK EMPLOYEE IMPORT MODAL
      ---------------------------------------------------- */}
      {isBulkEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                কর্মকর্তা বাল্ক টেক্সট আপলোড (Bulk Import)
              </h3>
              <button onClick={() => setIsBulkEmpModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-sans text-xl">×</button>
            </div>
            
            <form onSubmit={handleBulkEmpSubmit} className="p-6 space-y-4">
              {bulkError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  {bulkError}
                </div>
              )}

              {/* Informative Clipboard Paste Banner */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-xl text-xs space-y-1">
                <p className="font-bold text-indigo-700 dark:text-indigo-400">💡 ক্লিপবোর্ড ইমেজ ইম্পোর্ট (Clipboard Image Import):</p>
                <p className="text-slate-600 dark:text-slate-400 leading-normal">
                  কর্মকর্তাদের নামের তালিকা সম্বলিত কোনো ইমেজ বা স্ক্রিনশট কপি করা থাকলে সরাসরি এই টেক্সটবক্সে পেস্ট (<kbd className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded shadow-sm text-[10px] font-sans font-bold">Ctrl + V</kbd>) করুন! কৃত্রিম বুদ্ধিমত্তা ছবি থেকে সকল নাম ও পদবী স্বয়ংক্রিয়ভাবে টেক্সট হিসেবে রূপান্তর করে দেবে।
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="bulk_emp_cell_id" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">১. সেল সিলেক্ট করুন (ঐচ্ছিক)</label>
                <select
                  id="bulk_emp_cell_id"
                  value={bulkEmpCellId}
                  onChange={(e) => setBulkEmpCellId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-955/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="">সেল নির্বাচন করুন (Select Cell)</option>
                  {cells.map((c) => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="bulk_cell_file" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  অথবা CSV / Text ফাইল আপলোড করুন
                </label>
                <input
                  id="bulk_cell_file"
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      setBulkEmpText(text);
                    };
                    reader.readAsText(file);
                  }}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950/40 dark:file:text-indigo-400 hover:file:bg-indigo-100 transition-all cursor-pointer border border-dashed border-slate-300 dark:border-slate-800 p-2 rounded-xl bg-slate-50/20"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="bulk_emp_text" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    ২. কর্মকর্তার নাম ও পদবী (প্রতি লাইনে একজন) *
                  </label>
                  {isImageImportLoading && (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-455 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 border border-indigo-600 border-t-transparent rounded-full animate-spin inline-block" />
                      ... বিশ্লেষণ করা হচ্ছে ...
                    </span>
                  )}
                </div>
                <textarea
                  id="bulk_emp_text"
                  required
                  rows={8}
                  placeholder={`যেমন (হেডার সহ অথবা ছাড়া):\nনাম,পদবী,ব্যাংক আইডি,নথি নং,মোবাইল নম্বর,সেল\nজনাব মোঃ আশরাফুল ইসলাম,সিনিয়র অফিসার,026799,SO(Com)-026799,01712345678,CBS Integrated Development Cell\nজনাব সামিউল হক,অফিসার-আইটি,026800,O(Com)-026800,01712345679,R9`}
                  value={bulkEmpText}
                  onChange={(e) => setBulkEmpText(e.target.value)}
                  onPaste={handleTextareaPaste}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-955/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
                  disabled={isImageImportLoading}
                />
                <p className="text-[10px] text-slate-400">
                  প্যাটার্ন: কমা (,) বা ট্যাব বা সেমিকোলন দিয়ে আলাদা করে কলামগুলো দিন: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">নাম,পদবী,ব্যাংক আইডি,নথি নং,মোবাইল নম্বর,সেল</code>। সেল নির্বাচন করা না থাকলে নিজ নিজ সেল অনুযায়ী স্বয়ংক্রিয়ভাবে অ্যাসাইন হবে।
                </p>
              </div>


              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 font-sans">
                <button
                  type="button"
                  onClick={() => setIsBulkEmpModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={bulkImporting || isImageImportLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:bg-slate-200 dark:disabled:bg-slate-850 disabled:text-slate-400"
                >
                  {bulkImporting ? 'আমদানি হচ্ছে...' : 'ইম্পোর্ট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          OFFICER DETAILS PROFILE MODAL
      ---------------------------------------------------- */}
      {profileEmp && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans"
          onClick={() => setProfileEmp(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Cover Image */}
            <div className="h-28 bg-gradient-to-r from-indigo-500 to-violet-600 relative flex items-end justify-center">
              <div className="absolute -bottom-10 px-3 h-20 min-w-20 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-100 flex items-center justify-center text-indigo-650 text-sm font-extrabold shadow-md">
                {extractNickname(profileEmp.name)}
              </div>
            </div>

            {/* Profile Info Details */}
            <div className="pt-14 pb-8 px-6 text-center space-y-6">
              <div>
                <h4 className="font-extrabold text-slate-850 dark:text-slate-50 text-lg leading-tight">{profileEmp.name}</h4>
                {profileEmp.nameEn && (
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans mt-0.5">{profileEmp.nameEn}</p>
                )}
              </div>

              {/* Grid of Attributes */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">পদবী</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{profileEmp.designation}</p>
                  {profileEmp.designationEn && (
                    <p className="text-[11px] font-semibold text-slate-500 font-sans">{profileEmp.designationEn}</p>
                  )}
                </div>
                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">সেল</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{profileEmp.cell?.name || 'লোডিং...'}</p>
                </div>
                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ব্যাংক আইডি</span>
                  <p className="text-xs font-bold text-slate-850 dark:text-slate-150 font-sans">{profileEmp.bankId || 'প্রদান করা হয়নি'}</p>
                </div>
                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ব্যক্তিগত নথি নং</span>
                  <p className="text-xs font-bold text-slate-850 dark:text-slate-150 font-sans">{profileEmp.fileNo || 'প্রদান করা হয়নি'}</p>
                </div>
                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1.5 col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">মোবাইল নম্বর</span>
                  <p className="text-xs font-bold text-slate-850 dark:text-slate-150 font-sans">{profileEmp.mobile || 'প্রদান করা হয়নি'}</p>
                </div>
              </div>

              {/* Close Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setProfileEmp(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
                >
                  বন্ধ করুন
                </button>
                {(currentUser?.role === 'ADMIN' || allowedCellIds.includes(profileEmp.cellId) || (profileEmp.bankId && currentUser?.username && profileEmp.bankId.trim() === currentUser.username.trim())) && (
                  <button
                    onClick={() => {
                      const emp = profileEmp;
                      setProfileEmp(null);
                      startEditEmp(emp);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    সম্পাদনা করুন
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Premium In-Page Print Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-955 w-full max-w-5xl rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-scale-up h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-855 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-slate-850 dark:text-slate-50 text-sm">কর্মকর্তা ডিরেক্টরি প্রিন্ট প্রিভিউ</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">নতুন ট্যাবে ওপেন না করে সরাসরি ড্যাশবোর্ড থেকে প্রিভিউ করুন।</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const iframe = document.getElementById('preview-print-iframe') as HTMLIFrameElement;
                    if (iframe) {
                      iframe.contentWindow?.focus();
                      iframe.contentWindow?.print();
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Printer size={13} />
                  প্রিন্ট করুন
                </button>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-slate-50/50 dark:bg-slate-955/10 p-4 relative">
              <iframe 
                id="preview-print-iframe"
                src={iframeUrl}
                className="w-full h-full border border-slate-150 dark:border-slate-850 rounded-2xl shadow-inner bg-white"
              />
            </div>

          </div>
        </div>
      )}

      {/* Hidden Iframe for silent printing */}
      <iframe 
        id="silent-print-iframe" 
        className="hidden" 
        style={{ width: '0px', height: '0px', border: '0px' }}
      />

      {/* Bulk actions floating toolbar */}
      {selectedEmps.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300 select-none">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            <span className="font-sans text-indigo-600 dark:text-indigo-400 text-sm font-extrabold">{toBanglaDigits(selectedEmps.length)}</span> জন কর্মকর্তা নির্বাচিত
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedEmps([])}
              className="px-3.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              বাতিল করুন
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 text-rose-655 dark:text-rose-455 border border-rose-100 dark:border-rose-950/35 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 size={13} />
              নির্বাচিত মুছুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


