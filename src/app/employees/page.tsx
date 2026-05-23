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

    if (!empForm.name.trim() || !empForm.designation.trim() || !empForm.cellId) {
      setErrorMessage('নাম, পদবী এবং সেল অবশ্যই পূরণ করতে হবে।');
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
                          emp.designation.toLowerCase().includes(searchQuery.toLowerCase());
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
                  placeholder="কর্মকর্তার নাম বা পদবী দিয়ে খুঁজুন..."
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

          {/* Officers List Grid */}
          {filteredEmployees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{emp.name}</h3>
                        <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1">
                          <Briefcase size={12} />
                          {emp.designation}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-950/20 rounded-lg text-[10px] font-bold font-sans">
                        {emp.cell.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => startEditEmp(emp)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 transition-colors"
                      title="সম্পাদনা"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => deleteEmployee(emp.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  ২. কর্মকর্তার নাম ও পদবী (প্রতি লাইনে একজন) *
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder={`যেমন:\nজনাব মোঃ আশরাফুল ইসলাম - সিনিয়র অফিসার-আইটি (এসও-আইটি)\nজনাব সামিউল হক - অফিসার-আইটি (ও-আইটি)`}
                  value={bulkEmpText}
                  onChange={(e) => setBulkEmpText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
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
                  disabled={bulkImporting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:bg-slate-300 dark:disabled:bg-slate-800"
                >
                  {bulkImporting ? 'আমদানি হচ্ছে...' : 'ইম্পোর্ট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
