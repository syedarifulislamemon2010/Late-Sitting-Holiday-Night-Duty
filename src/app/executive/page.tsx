'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserCheck, 
  AlertCircle,
  Briefcase,
  Download,
  Eye,
  Printer,
  Loader2,
  X,
  Filter
} from 'lucide-react';

interface Executive {
  id: number;
  name: string;
  designation: string;
  phone: string | null;
  email: string | null;
  bankId: string | null;
  fileNo: string | null;
  createdAt: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
}

const STRICT_DESIGNATIONS = [
  'মহাব্যবস্থাপক',
  'উপ-মহাব্যবস্থাপক',
  'সহকারী মহাব্যবস্থাপক'
];



const extractNickname = (nameStr: string): string => {
  const clean = nameStr.trim();
  
  // Custom exact overrides for Janata Bank PLC IT Officers/Executives
  if (clean.includes('সোহরাব')) return 'সোহরাব';
  if (clean.includes('আশিকুর')) return 'আশিকুর';
  if (clean.includes('ইমন')) return 'ইমন';
  
  const parts = clean.split(/\s+/);
  if (parts.length === 0) return 'ইউ';
  
  const prefixes = [
    'নথিপত্র', 'জনাব', 'মুhammad', 'muhammad', 'মুহাম্মদ', 'মোহাম্মদ', 'মোহাম্মাদ', 'মো', 'মোঃ', 'মোহা', 'শ্রী', 'ডা', 'ডাঃ', 'ড', 'ডক্টর', 'মহম্মদ', 'মিসেস', 'মিস', 'এসএম'
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



export default function ExecutivesPage() {
  const { currentUser } = useProfile();
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterDesignation, setFilterDesignation] = useState('ALL');
  const [filterPhoneStatus, setFilterPhoneStatus] = useState('ALL');
  const [filterBankIdStatus, setFilterBankIdStatus] = useState('ALL');
  const [filterFileNoStatus, setFilterFileNoStatus] = useState('ALL');
  
  // Printing states
  const [generating, setGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExec, setEditingExec] = useState<Executive | null>(null);
  const [profileExec, setProfileExec] = useState<Executive | null>(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    designation: STRICT_DESIGNATIONS[0],
    bankId: '',
    fileNo: ''
  });

  const [errorMessage, setErrorMessage] = useState('');

  // Bulk Import state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
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

  // Fetch initial data
  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/executives');
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : [];
      // Filter out GMs strictly, leaving only DGMs and AGMs
      const filteredExecs = rawList.filter(e => {
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
      console.error('Error loading executives:', err);
    } finally {
      setLoading(false);
    }
  }


  // Redirect if not admin
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role !== 'ADMIN') {
        window.location.href = '/';
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!form.name.trim() || !form.designation.trim()) {
      setErrorMessage('নাম এবং পদবী অবশ্যই পূরণ করতে হবে।');
      return;
    }

    try {
      const url = editingExec ? `/api/executives/${editingExec.id}` : '/api/executives';
      const method = editingExec ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          designation: form.designation.trim(),
          bankId: form.bankId.trim() || null,
          fileNo: form.fileNo.trim() || null
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save executive');
      }

      setIsModalOpen(false);
      setEditingExec(null);
      setForm({ name: '', designation: STRICT_DESIGNATIONS[0], bankId: '', fileNo: '' });
      loadData();
    } catch (err) {
      console.error(err);
      setErrorMessage('সার্ভার সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    }
  };

  // Delete Executive
  const deleteExec = async (id: number) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই নির্বাহী কর্মকর্তাকে মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/executives/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error('Error deleting executive:', err);
    }
  };

  const generateEmployeeList = async (): Promise<string | null> => {
    setGenerating(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/documents/generate-employee-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cellFilter: 'executives' })
      });
      const data = await res.json();
      if (res.ok && data.success && data.filePath) {
        return data.filePath;
      } else {
        setErrorMessage(data.message || 'নির্বাহী তালিকা প্রস্তুত করতে ব্যর্থ হয়েছে।');
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

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError('');
    
    if (!bulkText.trim()) {
      setBulkError('অনুগ্রহ করে কর্মকর্তাদের নামের টেক্সট পেস্ট করুন।');
      return;
    }
    
    // Parse lines
    const rawLines = bulkText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (rawLines.length === 0) {
      setBulkError('কোনো কর্মকর্তা তথ্য পাওয়া যায়নি। সঠিক ফরম্যাটে লিখুন।');
      return;
    }

    // Detect if first line is a header
    const testLine = rawLines[0];
    const testParts: string[] = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < testLine.length; i++) {
      const char = testLine[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        testParts.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    testParts.push(currentField.trim());

    const cleanedFirstRow = testParts.map(p => {
      let s = p;
      if (s.startsWith('"') && s.endsWith('"')) s = s.substring(1, s.length - 1);
      if (s.startsWith("'") && s.endsWith("'")) s = s.substring(1, s.length - 1);
      return s.trim().toLowerCase();
    });

    const isHeader = cleanedFirstRow.some(h => 
      h.includes('নাম') || h.includes('name') || 
      h.includes('পদব') || h.includes('designation') || 
      h.includes('ব্যাংক') || h.includes('bank') || 
      h.includes('নথি') || h.includes('file')
    );

    const dataLines = isHeader ? rawLines.slice(1) : rawLines;

    const parsed = dataLines.map(line => {
      let name = '';
      let designation = '';
      let bankId = '';
      let fileNo = '';
      let matched = false;

      // Helper function to clean quotes from start and end
      const cleanQuotes = (str: string): string => {
        let clean = str.trim();
        while ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
          clean = clean.substring(1, clean.length - 1).trim();
        }
        if (clean.startsWith('"')) clean = clean.substring(1).trim();
        if (clean.endsWith('"')) clean = clean.substring(0, clean.length - 1).trim();
        if (clean.startsWith("'")) clean = clean.substring(1).trim();
        if (clean.endsWith("'")) clean = clean.substring(0, clean.length - 1).trim();
        return clean;
      };

      // 1. Try parsing as CSV first (automatically strips surrounding double quotes)
      const csvParts: string[] = [];
      let currentCsvField = '';
      let inCsvQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inCsvQuotes = !inCsvQuotes;
        } else if (char === ',' && !inCsvQuotes) {
          csvParts.push(currentCsvField.trim());
          currentCsvField = '';
        } else {
          currentCsvField += char;
        }
      }
      csvParts.push(currentCsvField.trim());

      if (csvParts.length >= 2 && line.includes(',')) {
        name = cleanQuotes(csvParts[0]);
        designation = cleanQuotes(csvParts[1]);
        bankId = cleanQuotes(csvParts[2] || '');
        fileNo = cleanQuotes(csvParts[3] || '');
        matched = true;
      }

      // 2. Try splitting by tab, pipe, comma first as they are highly unambiguous
      if (!matched) {
        const primarySeps = ['\t', ' | ', '|', ' , ', ','];
        for (const sep of primarySeps) {
          if (line.includes(sep)) {
            const parts = line.split(sep);
            if (parts.length >= 2) {
              name = cleanQuotes(parts[0]);
              designation = cleanQuotes(parts.slice(1).join(sep));
              if (parts.length >= 4) {
                bankId = cleanQuotes(parts[2] || '');
                fileNo = cleanQuotes(parts[3] || '');
              } else if (parts.length === 3) {
                bankId = cleanQuotes(parts[2] || '');
              }
              matched = true;
              break;
            }
          }
        }
      }

      // 3. Check for space-wrapped hyphens ' - '
      if (!matched && line.includes(' - ')) {
        const parts = line.split(' - ');
        if (parts.length >= 2) {
          name = cleanQuotes(parts[0]);
          designation = cleanQuotes(parts.slice(1).join(' - '));
          matched = true;
        }
      }

      // 4. Check for bare hyphen '-' (respecting compound words like DGM)
      if (!matched && line.includes('-')) {
        let splitIndex = -1;
        let currentPos = 0;
        while (true) {
          const idx = line.indexOf('-', currentPos);
          if (idx === -1) break;

          const leftContext = line.substring(0, idx).trim();
          const rightContext = line.substring(idx + 1).trim();

          const isInternalHyphen = 
            leftContext.endsWith('উপ') || 
            leftContext.endsWith('সহকারী') || 
            leftContext.endsWith('অফিসার') || 
            leftContext.endsWith('এসো') ||
            leftContext.endsWith('এসো-আইটি') ||
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
          name = cleanQuotes(line.substring(0, splitIndex));
          designation = cleanQuotes(line.substring(splitIndex + 1));
          matched = true;
        }
      }

      if (!matched) {
        name = cleanQuotes(line);
        designation = ''; // default fallback
      }
      
      const mapDesignation = (rawDesig: string): string => {
        const clean = rawDesig.toLowerCase();
        if (clean.includes('উপ') || clean.includes('dgm') || clean.includes('ডিজিএম')) {
          return STRICT_DESIGNATIONS[1]; // DGM
        }
        if (clean.includes('সহকারী') || clean.includes('agm') || clean.includes('এজিএম')) {
          return STRICT_DESIGNATIONS[2]; // AGM
        }
        if (clean.includes('মহাব্যবস্থাপক') || clean.includes('gm') || clean.includes('জিএম')) {
          return STRICT_DESIGNATIONS[0]; // GM
        }
        return STRICT_DESIGNATIONS[1]; // fallback: DGM
      };
      
      return {
        name: name,
        designation: mapDesignation(designation),
        phone: '',
        email: '',
        bankId: bankId ? bankId : null,
        fileNo: fileNo ? fileNo : null
      };
    });
      
    if (parsed.length === 0) {
      setBulkError('কোনো কর্মকর্তা তথ্য পাওয়া যায়নি। সঠিক ফরম্যাটে লিখুন।');
      return;
    }
    
    setBulkImporting(true);
    try {
      // SEQUENTIAL INSERTS to prevent Neon connection pool exhaustion
      for (const exec of parsed) {
        const res = await fetch('/api/executives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exec)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || err.error || 'Failed to save bulk');
        }
      }
      
      setIsBulkModalOpen(false);
      setBulkText('');
      setBulkError('');
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'আমদানিতে কিছু সমস্যা হয়েছে। অনুগ্রহ করে ডেটা চেক করে পুনরায় চেষ্টা করুন।';
      setBulkError(msg);
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
        const textLines = data.employees.map((emp: { name: string; designation: string }) => `${emp.name} - ${emp.designation}`).join('\n');
        setBulkText(prev => prev ? `${prev}\n${textLines}` : textLines);
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



  const exportExecutivesToCSV = () => {
    let csvContent = '\uFEFFনাম,পদবী,ব্যাংক আইডি,নথি নম্বর\n';
    filteredExecutives.forEach(exec => {
      const name = `"${exec.name.replace(/"/g, '""')}"`;
      const designation = `"${exec.designation.replace(/"/g, '""')}"`;
      const bankId = `"${(exec.bankId || '').replace(/"/g, '""')}"`;
      const fileNo = `"${(exec.fileNo || '').replace(/"/g, '""')}"`;
      csvContent += `${name},${designation},${bankId},${fileNo}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `executives_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Set form for editing
  const startEditExec = (exec: Executive) => {
    setEditingExec(exec);
    setForm({
      name: exec.name,
      designation: STRICT_DESIGNATIONS.includes(exec.designation) ? exec.designation : STRICT_DESIGNATIONS[0],
      bankId: exec.bankId || '',
      fileNo: exec.fileNo || ''
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Filter and Sort lists by designation priority (GM -> DGM -> AGM)
  const desigPriority: Record<string, number> = {
    'মহাব্যবস্থাপক': 1,
    'উপ-মহাব্যবস্থাপক': 2,
    'সহকারী মহাব্যবস্থাপক': 3
  };

  const filteredExecutives = executives.filter(exec => {
    const matchesSearch = exec.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          exec.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (exec.bankId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (exec.fileNo || '').toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesDesignation = filterDesignation === 'ALL' || exec.designation === filterDesignation;
    const matchesPhone = filterPhoneStatus === 'ALL' || 
      (filterPhoneStatus === 'has_phone' && exec.phone && exec.phone.trim().length > 0) ||
      (filterPhoneStatus === 'no_phone' && (!exec.phone || exec.phone.trim().length === 0));
    const matchesBankId = filterBankIdStatus === 'ALL' || 
      (filterBankIdStatus === 'has_bank_id' && exec.bankId && exec.bankId.trim().length > 0) ||
      (filterBankIdStatus === 'no_bank_id' && (!exec.bankId || exec.bankId.trim().length === 0));
    const matchesFileNo = filterFileNoStatus === 'ALL' || 
      (filterFileNoStatus === 'has_file_no' && exec.fileNo && exec.fileNo.trim().length > 0) ||
      (filterFileNoStatus === 'no_file_no' && (!exec.fileNo || exec.fileNo.trim().length === 0));

    return matchesSearch && matchesDesignation && matchesPhone && matchesBankId && matchesFileNo;
  }).sort((a, b) => {
    const prioA = desigPriority[a.designation] || 99;
    const prioB = desigPriority[b.designation] || 99;
    if (prioA !== prioB) {
      return prioA - prioB;
    }
    return (a.fileNo || '').localeCompare(b.fileNo || '', undefined, { numeric: true, sensitivity: 'base' });
  });

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0b5e9e]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">নির্বাহী প্যানেল (Executives)</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">জনতা ব্যাংক পিএলসি. এর মহাব্যবস্থাপক, উপ-মহাব্যবস্থাপক এবং সহকারী মহাব্যবস্থাপক বৃন্দের তালিকা।</p>
        </div>
      </div>

      {loading ? (
        /* Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Menu */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
            <div className="flex flex-1 gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="নির্বাহী কর্মকর্তার নাম বা পদবী দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/30 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
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

            <div className="flex gap-2">
              <button
                onClick={exportExecutivesToCSV}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-100/50 dark:shadow-none transition-all duration-200 hover:-translate-y-0.5"
              >
                <Download size={16} />
                এক্সপোর্ট করুন
              </button>
              <button
                onClick={async () => {
                  const path = await generateEmployeeList();
                  if (path) {
                    setIframeUrl(path);
                    setIsPreviewOpen(true);
                  }
                }}
                disabled={generating}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Eye size={16} />
                প্রিন্ট প্রিভিউ
              </button>
              <button
                onClick={async () => {
                  const path = await generateEmployeeList();
                  if (path) {
                    const printIframe = document.getElementById('silent-print-iframe') as HTMLIFrameElement;
                    if (printIframe) {
                      printIframe.src = path;
                      printIframe.onload = () => {
                        printIframe.contentWindow?.focus();
                        printIframe.contentWindow?.print();
                      };
                    }
                  }
                }}
                disabled={generating}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors cursor-pointer disabled:opacity-50"
              >
                {generating ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
                ডাউনলোড পিডিএফ
              </button>
              {currentUser?.role === 'ADMIN' && (
                <>
                  <button
                    onClick={() => {
                      setBulkText('');
                      setBulkError('');
                      setIsBulkModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <Plus size={16} />
                    বাল্ক টেক্সট আপলোড
                  </button>
                  <button
                    onClick={() => {
                      setEditingExec(null);
                      setForm({ name: '', designation: STRICT_DESIGNATIONS[0], bankId: '', fileNo: '' });
                      setErrorMessage('');
                      setIsModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors"
                  >
                    <Plus size={16} />
                    নতুন নির্বাহী যুক্ত করুন
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
                    <option key={d} value={d}>{d}</option>
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

          {/* Executives Grid */}
          {filteredExecutives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExecutives.map((exec) => {
                const dgmIndices = filteredExecutives
                  .filter(e => e.designation.includes('উপ-মহাব্যবস্থাপক') || e.designation.includes('ডিজিএম') || e.designation.toLowerCase().includes('dgm'))
                  .map(e => e.id);
                const dgmRank = dgmIndices.indexOf(exec.id) + 1;
                const isDGM = dgmRank > 0;
                
                let accentColor = '#0ea5e9'; // default sky-blue for AGMs
                let borderClass = 'border-sky-200 dark:border-sky-900/50';
                let bgClass = 'bg-sky-50/10 dark:bg-sky-950/5 text-sky-800 dark:text-sky-300';
                let textClass = 'text-sky-800 dark:text-sky-200 group-hover:text-sky-950';
                let badgeClass = 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30';
                
                if (isDGM) {
                  if (dgmRank === 1) {
                    // Royal Blue
                    accentColor = '#2563eb';
                    borderClass = 'border-blue-200 dark:border-blue-900/50';
                    bgClass = 'bg-blue-50/10 dark:bg-blue-950/5 text-blue-800 dark:text-blue-300';
                    textClass = 'text-blue-800 dark:text-blue-200 group-hover:text-blue-950';
                    badgeClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
                  } else if (dgmRank === 2) {
                    // Amber/Orange
                    accentColor = '#d97706';
                    borderClass = 'border-amber-200 dark:border-amber-900/50';
                    bgClass = 'bg-amber-50/10 dark:bg-amber-950/5 text-amber-800 dark:text-amber-300';
                    textClass = 'text-amber-800 dark:text-amber-250 group-hover:text-amber-950';
                    badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
                  } else {
                    // Teal
                    accentColor = '#0d9488';
                    borderClass = 'border-teal-200 dark:border-teal-900/50';
                    bgClass = 'bg-teal-50/10 dark:bg-teal-950/5 text-teal-800 dark:text-teal-300';
                    textClass = 'text-teal-800 dark:text-teal-250 group-hover:text-teal-950';
                    badgeClass = 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30';
                  }
                }
                
                return (
                  <div key={exec.id} className={`p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all duration-300 group border-l-3 ${borderClass} ${bgClass}`} style={{ borderLeft: `3px solid ${accentColor}` }}>
                    <div className="space-y-4 cursor-pointer" onClick={() => setProfileExec(exec)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className={`font-extrabold text-base leading-tight transition-colors ${textClass}`}>{exec.name}</h3>
                          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1.5">
                            <Briefcase size={12} className="text-slate-450" />
                            {exec.designation}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans ${badgeClass} shrink-0`}>
                          Executive
                        </span>
                      </div>

                      {(exec.bankId || exec.fileNo) && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                          {exec.bankId && (
                            <div className="flex items-center gap-1">
                              <span className="font-bold">আইডি: {exec.bankId}</span>
                            </div>
                          )}
                          {exec.fileNo && (
                            <div className="flex items-center gap-1">
                              <span className="font-bold">নথি নং: {exec.fileNo}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {currentUser?.role === 'ADMIN' && (
                      <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-200/50 dark:border-slate-800/80 font-sans">
                        <button
                          onClick={() => startEditExec(exec)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                          title="সম্পাদনা"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => deleteExec(exec.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="max-w-md mx-auto text-center space-y-3 p-12">
              <UserCheck className="mx-auto text-slate-350" size={32} />
              <h4 className="font-bold text-slate-800 dark:text-slate-100">কোনো নির্বাহী কর্মকর্তা পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-400">খুঁজে পাওয়া ডাটা খালি। অনুগ্রহ করে অন্য নাম লিখুন বা নতুন নির্বাহী যোগ করুন।</p>
            </Card>
          )}
        </div>
      )}

      {/* EXECUTIVE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                {editingExec ? 'নির্বাহী তথ্য সম্পাদনা' : 'নতুন নির্বাহী কর্মকর্তা যোগ করুন'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-sans text-xl">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="exec_name" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">কর্মকর্তার নাম *</label>
                <input
                  id="exec_name"
                  type="text"
                  required
                  placeholder="যেমন: জনাব মোহাম্মদ সোহরাব হোসেন"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="exec_designation" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">পদবী *</label>
                <select
                  id="exec_designation"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold"
                >
                  {STRICT_DESIGNATIONS.map((desig) => (
                    <option key={desig} value={desig}>{desig}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="exec_bankId" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ব্যাংক আইডি (ঐচ্ছিক)</label>
                <input
                  id="exec_bankId"
                  type="text"
                  placeholder="যেমন: 026799"
                  value={form.bankId}
                  onChange={(e) => setForm({ ...form, bankId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="exec_fileNo" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ব্যক্তিগত নথি নম্বর (File No) (ঐচ্ছিক)</label>
                <input
                  id="exec_fileNo"
                  type="text"
                  placeholder="যেমন: DGM(Com)-026799"
                  value={form.fileNo}
                  onChange={(e) => setForm({ ...form, fileNo: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>



              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
          BULK EXECUTIVE IMPORT MODAL
      ---------------------------------------------------- */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 font-sans">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                নির্বাহী বাল্ক টেক্সট আপলোড (Bulk Import)
              </h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-sans text-xl">×</button>
            </div>
            
            <form onSubmit={handleBulkSubmit} className="p-6 space-y-4 font-sans">
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
                  নির্বাহী কর্মকর্তাদের নামের তালিকা সম্বলিত কোনো ইমেজ বা স্ক্রিনশট কপি করা থাকলে সরাসরি এই টেক্সটবক্সে পেস্ট (<kbd className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded shadow-sm text-[10px] font-sans font-bold">Ctrl + V</kbd>) করুন! কৃত্রিম বুদ্ধিমত্তা ছবি থেকে সকল নাম ও পদবী স্বয়ংক্রিয়ভাবে টেক্সট হিসেবে রূপান্তর করে দেবে।
                </p>
              </div>

              <div className="space-y-1.5 font-sans">
                <label htmlFor="bulk_exec_file" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  অথবা CSV / Text ফাইল আপলোড করুন
                </label>
                <input
                  id="bulk_exec_file"
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      setBulkText(text);
                    };
                    reader.readAsText(file);
                  }}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950/40 dark:file:text-indigo-400 hover:file:bg-indigo-100 transition-all cursor-pointer border border-dashed border-slate-300 dark:border-slate-800 p-2 rounded-xl bg-slate-50/20"
                />
              </div>

              <div className="space-y-1.5 font-sans">
                <div className="flex justify-between items-center font-sans">
                  <label htmlFor="bulk_exec_text" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    নির্বাহী কর্মকর্তার নাম ও পদবী (প্রতি লাইনে একজন) *
                  </label>
                  {isImageImportLoading && (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-450 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 border border-indigo-600 border-t-transparent rounded-full animate-spin inline-block" />
                      বিশ্লেষণ করা হচ্ছে...
                    </span>
                  )}
                </div>
                <textarea
                  id="bulk_exec_text"
                  required
                  rows={8}
                  placeholder={`যেমন:\nজনাব চৌধুরী আশিকুর রহমান - উপ-মহাব্যবস্থাপক\nজনাব মোহাম্মদ সোহরাব হোসেন - সহকারী মহাব্যবস্থাপক\n\n(অথবা নির্বাহী কর্মকর্তাদের তালিকার কোনো ছবি এখানে সরাসরি Ctrl+V দিয়ে পেস্ট করুন)`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  onPaste={handleTextareaPaste}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
                  disabled={isImageImportLoading}
                />
                <p className="text-[10px] text-slate-400">
                  প্যাটার্ন: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">নাম - পদবী</code> (যেমন: নাম ও পদবীর মাঝে হাইফেন <strong>-</strong> বা কমা <strong>,</strong> ব্যবহার করুন)। পদবী না দিলে স্বয়ংক্রিয়ভাবে &quot;উপ-মহাব্যবস্থাপক&quot; ধরা হবে।
                </p>
              </div>


              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 font-sans">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={bulkImporting || isImageImportLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400"
                >
                  {bulkImporting ? 'আমদানি হচ্ছে...' : 'ইম্পোর্ট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          EXECUTIVE DETAILS PROFILE MODAL
      ---------------------------------------------------- */}
      {profileExec && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans"
          onClick={() => setProfileExec(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-up text-slate-800 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Cover Image */}
            <div className="h-28 bg-gradient-to-r from-indigo-500 to-violet-600 relative flex items-end justify-center">
              <div className="absolute -bottom-10 px-3 h-20 min-w-20 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-100 flex items-center justify-center text-indigo-650 text-sm font-extrabold shadow-md">
                {extractNickname(profileExec.name)}
              </div>
            </div>

            {/* Profile Info Details */}
            <div className="pt-14 pb-8 px-6 text-center space-y-6">
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-50 text-lg leading-tight">{profileExec.name}</h4>
              </div>

              {/* Grid of Attributes */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">পদবী</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{profileExec.designation}</p>
                </div>
                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ব্যাংক আইডি</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 font-sans">{profileExec.bankId || 'প্রদান করা হয়নি'}</p>
                </div>
                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ব্যক্তিগত নথি নং</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 font-sans">{profileExec.fileNo || 'প্রদান করা হয়নি'}</p>
                </div>
              </div>

              {/* Close Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setProfileExec(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
                >
                  বন্ধ করুন
                </button>
                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      const exec = profileExec;
                      setProfileExec(null);
                      startEditExec(exec);
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
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-scale-up h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">নির্বাহী ডিরেক্টরি প্রিন্ট প্রিভিউ</h4>
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
            <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/10 p-4 relative">
              <iframe 
                id="preview-print-iframe"
                src={iframeUrl}
                className="w-full h-full border border-slate-100 dark:border-slate-800 rounded-2xl shadow-inner bg-white"
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
    </div>
  );
}

