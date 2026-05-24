'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserCheck, 
  AlertCircle,
  Briefcase,
  Phone,
  Mail
} from 'lucide-react';

interface Executive {
  id: number;
  name: string;
  designation: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
}

const STRICT_DESIGNATIONS = [
  'উপ-মহাব্যবস্থাপক',
  'মহাব্যবস্থাপক',
  'সহকারী মহাব্যবস্থাপক'
];

export default function ExecutivesPage() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExec, setEditingExec] = useState<Executive | null>(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    designation: STRICT_DESIGNATIONS[0],
    phone: '',
    email: ''
  });

  const [errorMessage, setErrorMessage] = useState('');

  // Bulk Import state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
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

  // Fetch initial data
  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/executives');
      const data = await res.json();
      setExecutives(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading executives:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
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
        body: JSON.stringify(form)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save executive');
      }

      setIsModalOpen(false);
      setEditingExec(null);
      setForm({ name: '', designation: STRICT_DESIGNATIONS[0], phone: '', email: '' });
      loadData();
    } catch (err: any) {
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

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError('');
    
    if (!bulkText.trim()) {
      setBulkError('অনুগ্রহ করে কর্মকর্তাদের নামের টেক্সট পেস্ট করুন।');
      return;
    }
    
    // Parse lines
    const parsed = bulkText.split('\n')
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

        // 2. Check for space-wrapped hyphens ' - '
        if (!matched && line.includes(' - ')) {
          const parts = line.split(' - ');
          if (parts.length >= 2) {
            name = parts[0].trim();
            designation = parts.slice(1).join(' - ').trim();
            matched = true;
          }
        }

        // 3. Check for bare hyphen '-' (respecting compound words like DGM)
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
            name = line.substring(0, splitIndex).trim();
            designation = line.substring(splitIndex + 1).trim();
            matched = true;
          }
        }

        if (!matched) {
          name = line;
          designation = ''; // default fallback
        }
        
        const mapDesignation = (rawDesig: string): string => {
          const clean = rawDesig.toLowerCase();
          if (clean.includes('উপ') || clean.includes('dgm') || clean.includes('ডিজিএম')) {
            return STRICT_DESIGNATIONS[0]; // DGM
          }
          if (clean.includes('সহকারী') || clean.includes('agm') || clean.includes('এজিএম')) {
            return STRICT_DESIGNATIONS[2]; // AGM
          }
          if (clean.includes('মহাব্যবস্থাপক') || clean.includes('gm') || clean.includes('জিএম')) {
            return STRICT_DESIGNATIONS[1]; // GM
          }
          return STRICT_DESIGNATIONS[0]; // fallback: DGM
        };
        
        return {
          name,
          designation: mapDesignation(designation),
          phone: '',
          email: ''
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
        setBulkText(prev => prev ? `${prev}\n${textLines}` : textLines);
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

  // Set form for editing
  const startEditExec = (exec: Executive) => {
    setEditingExec(exec);
    setForm({
      name: exec.name,
      designation: STRICT_DESIGNATIONS.includes(exec.designation) ? exec.designation : STRICT_DESIGNATIONS[0],
      phone: exec.phone || '',
      email: exec.email || ''
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Filter lists
  const filteredExecutives = executives.filter(exec => {
    const matchesSearch = exec.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          exec.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-wide">নির্বাহী প্যানেল (Executives)</h1>
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
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBulkText('');
                  setBulkError('');
                  setIsBulkModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-colors border border-slate-250 dark:border-slate-750"
              >
                <Plus size={16} />
                বাল্ক টেক্সট আপলোড
              </button>
              <button
                onClick={() => {
                  setEditingExec(null);
                  setForm({ name: '', designation: STRICT_DESIGNATIONS[0], phone: '', email: '' });
                  setErrorMessage('');
                  setIsModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors"
              >
                <Plus size={16} />
                নতুন নির্বাহী যুক্ত করুন
              </button>
            </div>
          </div>

          {/* Executives Grid */}
          {filteredExecutives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExecutives.map((exec) => (
                <div key={exec.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{exec.name}</h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1">
                          <Briefcase size={12} />
                          {exec.designation}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-950/20 rounded-lg text-[10px] font-bold font-sans">
                        Executive
                      </span>
                    </div>


                  </div>

                  <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => startEditExec(exec)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 transition-colors"
                      title="সম্পাদনা"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => deleteExec(exec.id)}
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
              <UserCheck className="mx-auto text-slate-300" size={32} />
              <h4 className="font-bold text-slate-800 dark:text-slate-100">কোনো নির্বাহী কর্মকর্তা পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-400">খুঁজে পাওয়া ডাটা খালি। অনুগ্রহ করে অন্য নাম লিখুন বা নতুন নির্বাহী যোগ করুন।</p>
            </div>
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">কর্মকর্তার নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: জনাব মোহাম্মদ সোহরাব হোসেন"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">পদবী *</label>
                <select
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold"
                >
                  {STRICT_DESIGNATIONS.map((desig) => (
                    <option key={desig} value={desig}>{desig}</option>
                  ))}
                </select>
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
                <div className="flex justify-between items-center font-sans">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                  প্যাটার্ন: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">নাম - পদবী</code> (যেমন: নাম ও পদবীর মাঝে হাইফেন <strong>-</strong> বা কমা <strong>,</strong> ব্যবহার করুন)। পদবী না দিলে স্বয়ংক্রিয়ভাবে "উপ-মহাব্যবস্থাপক" ধরা হবে।
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:bg-slate-200 dark:disabled:bg-slate-850 disabled:text-slate-400"
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
