'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  User, 
  FileText, 
  Calendar, 
  HardDrive, 
  Building2, 
  Layers, 
  ArrowRight, 
  X, 
  Command 
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  href: string;
  icon: any;
}

export default function CommandPalette() {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Navigation pages list
  const pages: SearchResultItem[] = [
    { id: 'p-1', title: 'ডিউটি রোস্টার ও অফিস আদেশ', subtitle: 'Late Sitting, Holiday, Night Shift Duty Management', category: 'পেজ', href: '/roster', icon: Calendar },
    { id: 'p-2', title: 'কর্মকর্তা তালিকা ও ডিরেক্টরি', subtitle: 'Employee Management & Seniority Hierarchy', category: 'পেজ', href: '/employees', icon: User },
    { id: 'p-3', title: 'হার্ডওয়্যার রিকুইজিশন পোর্টাল', subtitle: 'Hardware & UPS Requisition Notes', category: 'পেজ', href: '/hardware-requisition', icon: HardDrive },
    { id: 'p-4', title: 'ছুটির আবেদন ফরম প্রস্তুতকরণ', subtitle: 'Casual, Station Leave & Sandwich Rule', category: 'পেজ', href: '/leave', icon: FileText },
    { id: 'p-5', title: 'ডকুমেন্ট আর্কাইভ ও বিল বিবরণী', subtitle: 'Lunch Bill Sheets & Document Management', category: 'পেজ', href: '/documents', icon: Layers },
    { id: 'p-6', title: 'সেল ও ডিপার্টমেন্ট কন্ট্রোল', subtitle: 'Manage Cell Units & System Access', category: 'পেজ', href: '/users', icon: Building2 },
  ];

  // Listen for Ctrl+K or Cmd+K shortcut key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Fetch search results from APIs dynamically
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    if (!query.trim()) {
      setResults(pages);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [empRes, cellRes] = await Promise.all([
          fetch('/api/employees').then(r => r.ok ? r.json() : []),
          fetch('/api/cells').then(r => r.ok ? r.json() : [])
        ]);

        const qLower = query.toLowerCase();

        // Filter employees (Dual Bangla & English search support)
        const empMatches: SearchResultItem[] = (Array.isArray(empRes) ? empRes : [])
          .filter((emp: any) => 
            emp.name?.toLowerCase().includes(qLower) || 
            emp.nameEn?.toLowerCase().includes(qLower) || 
            emp.bankId?.toLowerCase().includes(qLower) ||
            emp.designation?.toLowerCase().includes(qLower) ||
            emp.designationEn?.toLowerCase().includes(qLower) ||
            emp.fileNo?.toLowerCase().includes(qLower)
          )
          .slice(0, 5)
          .map((emp: any) => ({
            id: `emp-${emp.id}`,
            title: isEn && emp.nameEn ? `${emp.nameEn} (${emp.designationEn || emp.designation})` : `${emp.name} (${emp.designation})`,
            subtitle: `${isEn ? 'Bank ID:' : 'ব্যাংক আইডি:'} ${emp.bankId || 'N/A'} • ${isEn ? 'Mobile:' : 'মোবাইল:'} ${emp.mobile || 'N/A'}`,
            category: isEn ? 'Employee' : 'কর্মকর্তা',
            href: `/employees`,
            icon: User
          }));

        // Filter cells
        const cellMatches: SearchResultItem[] = (Array.isArray(cellRes) ? cellRes : [])
          .filter((c: any) => c.name?.toLowerCase().includes(qLower))
          .slice(0, 3)
          .map((c: any) => ({
            id: `cell-${c.id}`,
            title: `${isEn ? 'Cell:' : 'সেল:'} ${c.name}`,
            subtitle: c.description || (isEn ? 'Online Banking Department' : 'অনলাইন ব্যাংকিং ডিপার্টমেন্ট'),
            category: isEn ? 'Cell' : 'সেল',
            href: `/users`,
            icon: Building2
          }));

        // Filter static page shortcuts
        const pageMatches = pages.filter(p => 
          p.title.toLowerCase().includes(qLower) || 
          p.subtitle.toLowerCase().includes(qLower)
        );

        setResults([...empMatches, ...cellMatches, ...pageMatches]);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Spotlight search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleSelect = useCallback((item: SearchResultItem) => {
    setIsOpen(false);
    router.push(item.href);
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % (results.length || 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-start justify-center pt-16 px-4 animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all font-sans"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search size={20} className="text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="কর্মকর্তার নাম, ব্যাংক আইডি, ডিউটি বা অপশন খুঁজুন... (Ctrl + K)"
            className="w-full pl-3 pr-10 py-1 bg-transparent text-slate-800 dark:text-slate-100 text-sm font-semibold placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400">
              <X size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-mono font-bold rounded-md">
              <Command size={10} /> K
            </div>
          )}
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">
              খোঁজা হচ্ছে...
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400">
              কোনো ফলাফল পাওয়া যায়নি।
            </div>
          ) : (
            results.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs truncate">{item.title}</span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} className={`shrink-0 ml-2 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">↑↓</kbd> নেভিগেট</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">Enter</kbd> নির্বাচন</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">Esc</kbd> বন্ধ করুন</span>
          </div>
          <span className="font-bold text-indigo-500">Janata Bank LHN Portal</span>
        </div>
      </div>
    </div>
  );
}
