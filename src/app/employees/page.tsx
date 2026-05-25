'use client';

import { useState, useEffect } from 'react';
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
  CreditCard
} from 'lucide-react';

interface Cell {
  id: number;
  name: string;
  description: string | null;
  _count?: {
    employees: number;
  };
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
  const [activeTab, setActiveTab] = useState<'employees' | 'cells'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cellFilter, setCellFilter] = useState('all');

  // Modals state
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editingCell, setEditingCell] = useState<Cell | null>(null);
  const [profileEmp, setProfileEmp] = useState<Employee | null>(null);

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
    designation: STRICT_DESIGNATIONS[0],
    bankId: '',
    fileNo: '',
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
  const [customApiKey, setCustomApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    if (cells.length > 0 && !bulkEmpCellId) {
      setBulkEmpCellId(cells[0].id.toString());
    }
  }, [cells, bulkEmpCellId]);

  // Fetch initial data
  async function loadData() {
    setLoading(true);
    try {
      const [empRes, cellRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/cells')
      ]);
      const empData = await empRes.json();
      const cellData = await cellRes.json();
      
      setEmployees(Array.isArray(empData) ? empData : []);
      setCells(Array.isArray(cellData) ? cellData : []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
      setEmpForm({ name: '', designation: STRICT_DESIGNATIONS[0], bankId: '', fileNo: '', cellId: '' });
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message === 'cell_required' ? 'অনুগ্রহ করে সেল সিলেক্ট করুন।' : 'সার্ভার সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
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
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Delete Officer
  const deleteEmployee = async (id: number) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই কর্মকর্তাকে মুছে ফেলতে চান? এর ফলে তার সব ডিউটি হিস্ট্রি ডিলিট হবে।')) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error('Error deleting officer:', err);
    }
  };

  // Delete Cell
  const deleteCell = async (cell: Cell) => {
    if (cell._count && cell._count.employees > 0) {
      alert('এই সেলে কর্মকর্তা কর্মরত রয়েছে! সেলটি ডিলিট করার আগে কর্মকর্তাদের অন্য সেলে স্থানান্তর করুন।');
      return;
    }
    if (!confirm(`আপনি কি নিশ্চিতভাবে "${cell.name}" সেলটি মুছে ফেলতে চান?`)) return;
    
    try {
      const res = await fetch(`/api/cells/${cell.id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.error === 'cell_has_employees' ? 'সেলটি ডিলিট করা যাচ্ছে না কারণ এতে কর্মকর্তা কর্মরত আছে।' : 'সেল মুছে ফেলতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      console.error('Error deleting cell:', err);
    }
  };

  const handleBulkEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError('');
    
    if (!bulkEmpCellId) {
      setBulkError('অনুগ্রহ করে সেল সিলেক্ট করুন।');
      return;
    }
    
    if (!bulkEmpText.trim()) {
      setBulkError('অনুগ্রহ করে কর্মকর্তাদের নামের টেক্সট পেস্ট করুন।');
      return;
    }
    
    // Parse lines
    const parsed = bulkEmpText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        let name = '';
        let designation = '';
        let matched = false;

        // 1. Try splitting by tab, pipe, comma first as they are highly unambiguous
        const primarySeps = ['\t', ' | ', '|', ' , ', ','];
        for (const sep of primarySeps) {
          if (line.includes(sep)) {
            const parts = line.split(sep);
            if (parts.length >= 2) {
              name = parts[0].trim();
              designation = parts.slice(1).join(sep).trim();
              matched = true;
              break;
            }
          }
        }

        // 2. If not matched, check for space-wrapped hyphens ' - '
        if (!matched && line.includes(' - ')) {
          const parts = line.split(' - ');
          if (parts.length >= 2) {
            name = parts[0].trim();
            designation = parts.slice(1).join(' - ').trim();
            matched = true;
          }
        }

        // 3. If still not matched, check for bare hyphen '-' ensuring it's not part of a known word
        if (!matched && line.includes('-')) {
          let splitIndex = -1;
          let currentPos = 0;
          while (true) {
            const idx = line.indexOf('-', currentPos);
            if (idx === -1) break;

            const leftContext = line.substring(0, idx).trim();
            const rightContext = line.substring(idx + 1).trim();

            // Ignore internal hyphens of compound designations
            const isInternalHyphen = 
              leftContext.endsWith('উপ') || 
              leftContext.endsWith('সহকারী') || 
              leftContext.endsWith('অফিসার') || 
              leftContext.endsWith('এসো') ||
              leftContext.endsWith('এসও') ||
              leftContext.endsWith('এজিএম') ||
              leftContext.endsWith('ডিজিএম') ||
              leftContext.endsWith('জিএম') ||
              rightContext.startsWith('মহাব্যবস্থাপক') ||
              rightContext.startsWith('আইটি');

            if (!isInternalHyphen) {
              splitIndex = idx;
              break;
            }
            currentPos = idx + 1;
          }

          if (splitIndex !== -1) {
            name = line.substring(0, splitIndex).trim();
            designation = line.substring(splitIndex + 1).trim();
            matched = true;
          }
        }

        if (!matched) {
          name = line;
          designation = ''; // default fallback will handle it
        }
        
        const mapDesignation = (rawDesig: string): string => {
          const clean = rawDesig.toLowerCase();
          if (clean.includes('এসপিও') || clean.includes('সিনিয়র প্রিন্সিপাল') || clean.includes('spo')) {
            return STRICT_DESIGNATIONS[0];
          }
          if (clean.includes('পিও') || clean.includes('প্রিন্সিপাল') || clean.includes('po')) {
            return STRICT_DESIGNATIONS[1];
          }
          if (clean.includes('এসও') || clean.includes('সিনিয়র অফিসার') || clean.includes('so') || clean.includes('এসো')) {
            return STRICT_DESIGNATIONS[2];
          }
          return STRICT_DESIGNATIONS[3]; // default: Officer-IT
        };
        
        return {
          name,
          designation: mapDesignation(designation),
          cellId: parseInt(bulkEmpCellId, 10),
          bankId: '',
          fileNo: ''
        };
      });
      
    if (parsed.length === 0) {
      setBulkError('কোনো কর্মকর্তা তথ্য পাওয়া যায়নি। সঠিক ফরম্যাটে লিখুন।');
      return;
    }
    
    setBulkImporting(true);
    try {
      // SEQUENTIAL INSERTS to prevent Neon Postgres pool timeout
      for (const emp of parsed) {
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emp)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || err.error || 'Failed to save bulk');
        }
      }
      
      setIsBulkEmpModalOpen(false);
      setBulkEmpText('');
      setBulkError('');
      loadData();
    } catch (err: any) {
      setBulkError(err.message || 'আমদানিতে কিছু সমস্যা হয়েছে। অনুগ্রহ করে ডেটা চেক করে পুনরায় চেষ্টা করুন।');
    } finally {
      setBulkImporting(false);
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
        const textLines = data.employees.map((emp: any) => `${emp.name} - ${emp.designation}`).join('\n');
        setBulkEmpText(prev => prev ? `${prev}\n${textLines}` : textLines);
      }
    } catch (err: any) {
      setBulkError(err.message || 'ছবি থেকে তথ্য বের করতে সমস্যা হয়েছে।');
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

  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowKeyInput(false);
  };

  // Set forms for editing
  const startEditEmp = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpForm({
      name: emp.name,
      designation: STRICT_DESIGNATIONS.includes(emp.designation) ? emp.designation : STRICT_DESIGNATIONS[0],
      bankId: emp.bankId || '',
      fileNo: emp.fileNo || '',
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

  // Filter lists
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (emp.bankId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (emp.fileNo || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCell = cellFilter === 'all' || emp.cellId.toString() === cellFilter;
    return matchesSearch && matchesCell;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Tabs Toggler */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-wide">কর্মকর্তা ও সেল ডিরেক্টরি</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">কর্মকর্তাবৃন্দ এবং সেল (Cell) ম্যানেজমেন্ট প্যানেল।</p>
        </div>
        
        {/* TAB CONTROLLERS */}
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
              <select
                value={cellFilter}
                onChange={(e) => setCellFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="all">সকল সেল (All Cells)</option>
                {cells.map(c => (
                  <option key={c.id} value={c.id.toString()}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
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
                  setEmpForm({ name: '', designation: STRICT_DESIGNATIONS[0], bankId: '', fileNo: '', cellId: cells[0]?.id.toString() || '' });
                  setErrorMessage('');
                  setIsEmpModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors"
              >
                <Plus size={16} />
                নতুন কর্মকর্তা যোগ করুন
              </button>
            </div>
          </div>

          {/* Grouped Officers List by Cell */}
          {filteredEmployees.length > 0 ? (
            <div className="space-y-10">
              {cells
                .filter(cell => {
                  const cellEmps = filteredEmployees.filter(emp => emp.cellId === cell.id);
                  return cellEmps.length > 0;
                })
                .map((cell) => {
                  const cellEmps = filteredEmployees
                    .filter(emp => emp.cellId === cell.id)
                    .sort((a, b) => {
                      const aNum = parseInt(a.bankId || '0', 10);
                      const bNum = parseInt(b.bankId || '0', 10);
                      if (isNaN(aNum) || isNaN(bNum)) {
                        return (a.bankId || '').localeCompare(b.bankId || '');
                      }
                      return aNum - bNum;
                    });
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
                            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-wide">{cell.name}</h3>
                            {cell.description && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold mt-0.5">{cell.description}</p>
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
                          const pal = getPalette(emp.cellId);
                          return (
                            <div key={emp.id} className={`p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all duration-300 group ${pal.border} ${pal.bg}`}>
                              <div className="space-y-4 cursor-pointer" onClick={() => setProfileEmp(emp)}>
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-tight group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">{emp.name}</h3>
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1.5">
                                      <Briefcase size={12} className="text-slate-400" />
                                      {emp.designation}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                  <div className="flex items-center gap-1">
                                    <Hash size={12} className="text-slate-400" />
                                    <span>ব্যাংক আইডি: <strong>{emp.bankId}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <CreditCard size={12} className="text-slate-400" />
                                    <span>নথি নং: <strong className="font-mono">{emp.fileNo}</strong></span>
                                  </div>
                                </div>
                              </div>

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
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteEmployee(emp.id);
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-250 dark:border-slate-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 hover:text-red-650 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
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
              <h4 className="font-bold text-slate-800 dark:text-slate-100">কোনো কর্মকর্তা পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-400">খুঁজে পাওয়া ডাটা খালি। অনুগ্রহ করে অন্য নাম লিখুন বা নতুন কর্মকর্তা যোগ করুন।</p>
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
            <button
              onClick={() => {
                setEditingCell(null);
                setCellForm({ name: '', description: '' });
                setErrorMessage('');
                setIsCellModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
              নতুন সেল (Cell) যোগ করুন
            </button>
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

                <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => startEditCell(cell)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => deleteCell(cell)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">কর্মকর্তার নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: জনাব মোঃ আশরাফুল ইসলাম"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">পদবী *</label>
                <select
                  value={empForm.designation}
                  onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                >
                  {STRICT_DESIGNATIONS.map((desig) => (
                    <option key={desig} value={desig}>{desig}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ব্যাংক আইডি *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: 026799"
                  value={empForm.bankId}
                  onChange={(e) => setEmpForm({ ...empForm, bankId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">নথি নম্বর (File No) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: SO(Com)-026799"
                  value={empForm.fileNo}
                  onChange={(e) => setEmpForm({ ...empForm, fileNo: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">সেল সিলেক্ট করুন *</label>
                <select
                  value={empForm.cellId}
                  onChange={(e) => setEmpForm({ ...empForm, cellId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                >
                  {cells.map((c) => (
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">সেলের নাম *</label>
                <input
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
          BULK EMPLOYEE IMPORT MODAL
      ---------------------------------------------------- */}
      {isBulkEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100">
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">১. সেল সিলেক্ট করুন *</label>
                <select
                  required
                  value={bulkEmpCellId}
                  onChange={(e) => setBulkEmpCellId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="">সেল নির্বাচন করুন</option>
                  {cells.map((c) => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    ২. কর্মকর্তার নাম ও পদবী (প্রতি লাইনে একজন) *
                  </label>
                  {isImageImportLoading && (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-450 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 border border-indigo-600 border-t-transparent rounded-full animate-spin inline-block" />
                      বিশ্লেষণ করা হচ্ছে...
                    </span>
                  )}
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder={`যেমন:\nজনাব মোঃ আশরাফুল ইসলাম - সিনিয়র অফিসার-আইটি (এসও-আইটি)\nজনাব সামিউল হক - অফিসার-আইটি (ও-আইটি)\n\n(অথবা কর্মকর্তাদের তালিকার কোনো ছবি এখানে সরাসরি Ctrl+V দিয়ে পেস্ট করুন)`}
                  value={bulkEmpText}
                  onChange={(e) => setBulkEmpText(e.target.value)}
                  onPaste={handleTextareaPaste}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
                  disabled={isImageImportLoading}
                />
                <p className="text-[10px] text-slate-400">
                  প্যাটার্ন: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">নাম - পদবী</code> (যেমন: নাম ও পদবীর মাঝে হাইফেন <strong>-</strong> বা কমা <strong>,</strong> ব্যবহার করুন)। পদবী না দিলে স্বয়ংক্রিয়ভাবে "অফিসার-আইটি" ধরা হবে।
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
              </div>

              {/* Grid of Attributes */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">পদবী</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{profileEmp.designation}</p>
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
              </div>

              {/* Close Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setProfileEmp(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
                >
                  বন্ধ করুন
                </button>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
