'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  FileText, 
  Calendar, 
  User, 
  Settings, 
  CornerDownLeft, 
  Sparkles,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

interface SearchResult {
  type: 'employee' | 'duty' | 'leave' | 'order';
  id: number;
  title: string;
  subtitle: string;
  url: string;
}

export default function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Static quick actions mapping
  const quickActions = [
    { title: 'ডিউটি রোস্টার তৈরি করুন (Assign Duty)', url: '/roster', icon: Calendar, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
    { title: 'ছুটির আবেদন করুন (Apply for Leave)', url: '/leave', icon: ClipboardList, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40' },
    { title: 'বিল বিবরণী দেখুন (Open Billing Ledger)', url: '/billing', icon: FileText, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
    { title: 'কর্মকর্তা তালিকা খুলুন (Look up Employee)', url: '/employees', icon: User, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
    { title: 'ব্যবহারকারী সেটিংস (System Settings)', url: '/users', icon: Settings, color: 'text-slate-500 bg-slate-50 dark:bg-slate-900/40' },
  ];

  // 1. Listen for global Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
      // Reset state
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // 2. Debounced API search fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // 3. Close on click outside modal content
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  // 4. Keyboard navigation (ArrowUp, ArrowDown, Enter) inside list
  const handleListKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = query.trim().length >= 2 ? results.length : quickActions.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim().length >= 2) {
        if (results[selectedIndex]) {
          navigate(results[selectedIndex].url);
        }
      } else {
        if (quickActions[selectedIndex]) {
          navigate(quickActions[selectedIndex].url);
        }
      }
    }
  };

  const navigate = (url: string) => {
    setIsOpen(false);
    router.push(url);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-24 px-4 font-sans select-none"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        onKeyDown={handleListKeyDown}
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[500px] animate-in fade-in slide-in-from-top-4 duration-200"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-850">
          <Search size={18} className="text-slate-400 dark:text-slate-500 shrink-0" />
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="যেকোনো কিছু খুঁজুন (যেমন- কর্মকর্তা, বিল, ছুটি, স্মারক)..."
            className="w-full text-slate-800 dark:text-slate-100 text-sm focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 bg-transparent"
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Dynamic Display Area */}
        <div className="overflow-y-auto flex-1 p-2 space-y-3">
          
          {/* Quick Actions (Query is empty) */}
          {query.trim().length < 2 && (
            <div className="space-y-1">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={11} className="text-amber-500 animate-pulse" />
                <span>দ্রুত অ্যাকশন ও নেভিগেশন (Quick Commands)</span>
              </div>
              
              <div className="space-y-0.5">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  const isSelected = selectedIndex === index;
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(action.url)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                        isSelected 
                          ? 'bg-indigo-50/70 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400 scale-[1.005]' 
                          : 'text-slate-700 hover:bg-slate-50/50 dark:text-slate-300 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 shrink-0 ${action.color}`}>
                          <Icon size={14} />
                        </div>
                        <span>{action.title}</span>
                      </div>
                      
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-500 dark:text-indigo-400">
                          <span>যাও</span>
                          <CornerDownLeft size={10} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results Area (Query length >= 2) */}
          {query.trim().length >= 2 && (
            <div className="space-y-1">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {loading ? 'অনুসন্ধান করা হচ্ছে...' : `সার্চ ফলাফল (${results.length}টি পাওয়া গেছে)`}
              </div>

              {loading && (
                <div className="space-y-1 p-2">
                  <div className="h-9 w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl animate-pulse" />
                  <div className="h-9 w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl animate-pulse" />
                  <div className="h-9 w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl animate-pulse" />
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  কোনো ম্যাচিং রেকর্ড পাওয়া যায়নি।
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="space-y-0.5">
                  {results.map((result, index) => {
                    const isSelected = selectedIndex === index;
                    return (
                      <button
                        key={index}
                        onClick={() => navigate(result.url)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${
                          isSelected 
                            ? 'bg-indigo-50/70 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400 scale-[1.005]' 
                            : 'text-slate-700 hover:bg-slate-50/50 dark:text-slate-300 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800 shrink-0 text-slate-550 dark:text-slate-400`}>
                            {result.type === 'employee' && <User size={14} />}
                            {result.type === 'leave' && <ClipboardList size={14} />}
                            {result.type === 'order' && <FileText size={14} />}
                            {result.type === 'duty' && <Calendar size={14} />}
                          </div>
                          <div className="leading-snug">
                            <p className="font-extrabold">{result.title}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{result.subtitle}</p>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-500 dark:text-indigo-400">
                            <span>খুলুন</span>
                            <CornerDownLeft size={10} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer shortcuts helper */}
        <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">↑↓</span>
              নেভিগেট
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">Enter</span>
              সিলেক্ট করুন
            </span>
          </div>
          <span>গ্লোবাল কমান্ড সেন্টার</span>
        </div>
      </div>
    </div>
  );
}
