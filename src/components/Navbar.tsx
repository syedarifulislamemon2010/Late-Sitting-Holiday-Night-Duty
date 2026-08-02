'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Settings,
  LogOut,
  Search,
  Sun,
  Moon,
  Languages
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface UserSession {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
  cells: { id: number; name: string }[];
}

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load user from localStorage
  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };
    
    loadUser();
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  // Theme Syncing - checks and sets dark mode class
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = storedTheme === 'dark' || (!storedTheme && systemDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname === '/') return;
    const routeMap: Record<string, string> = {
      '/roster': 'ডিউটি রোস্টার',
      '/billing': 'বিল ও ভাতার বিবরণী',
      '/leave': 'ছুটির আবেদন',
      '/hardware-requisition': 'হার্ডওয়্যার রিকুইজিশন',
      '/employees': 'কর্মকর্তাবৃন্দ',
      '/audit': 'অডিট লগ',
      '/users': 'সেটিংস',
      '/documents': 'আর্কাইভ',
      '/trash': 'রিসাইকেল বিন',
      '/lunch-bill': 'লাঞ্চ বিল শিট',
      '/closing-bill': 'ক্লোজিং বিল শিট'
    };
    const cleanPath = '/' + pathname.replace(/^\//, '').split('/')[0];
    const title = routeMap[cleanPath];
    if (title) {
      const stored = localStorage.getItem('recentModules');
      let list: { title: string; url: string }[] = [];
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch {}
      }
      list = list.filter(item => item.url !== pathname);
      list.unshift({ title, url: pathname });
      list = list.slice(0, 4);
      localStorage.setItem('recentModules', JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    }
  }, [pathname]);

  const getBreadcrumbs = () => {
    const cleanPath = pathname.replace(/^\//, '').split('/')[0];
    if (pathname === '/' || cleanPath === 'dashboard' || cleanPath === '') {
      return (
        <Link href="/dashboard" className="text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base hover:text-[#0b5e9e] dark:hover:text-sky-400 transition-colors" style={{ letterSpacing: 'normal' }}>
          ড্যাশবোর্ড
        </Link>
      );
    }

    const routeMap: Record<string, { section: string; title: string }> = {
      'executive': { section: 'প্রশাসনিক কার্যক্রম', title: 'নির্বাহী প্যানেল' },
      'audit': { section: 'প্রশাসনিক কার্যক্রম', title: 'অডিট লগ' },
      'employees': { section: 'প্রশাসনিক কার্যক্রম', title: 'কর্মকর্তাবৃন্দ' },
      'roster': { section: 'প্রশাসনিক কার্যক্রম', title: 'অফিস আদেশ ও ডিউটি রোস্টার' },
      'billing': { section: 'বিল ও ভাতাসমূহ', title: 'বিল ও ভাতার বিবরণী' },
      'lunch-bill': { section: 'বিল ও ভাতাসমূহ', title: 'লাঞ্চ বিল শিট' },
      'closing-bill': { section: 'বিল ও ভাতাসমূহ', title: 'ক্লোজিং বিল শিট' },
      'leave': { section: 'আবেদনপত্র', title: 'ছুটির আবেদন' },
      'hardware-requisition': { section: 'আবেদনপত্র', title: 'হার্ডওয়্যার রিকুইজিশন' },
      'documents': { section: 'অন্যান্য', title: 'আর্কাইভ' },
      'trash': { section: 'অন্যান্য', title: 'রিসাইকেল বিন' },
      'users': { section: 'সেটিংস', title: 'ব্যবহারকারী সেটিংস' }
    };

    const item = routeMap[cleanPath];

    if (!item) {
      return (
        <span className="text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm" style={{ letterSpacing: 'normal' }}>
          লেট সিটিং, ছুটির দিনে ও রাত্রীকালীন ডিউটি পোর্টাল
        </span>
      );
    }

    const sectionUrls: Record<string, string> = {
      'প্রশাসনিক কার্যক্রম': '/employees',
      'বিল ও ভাতাসমূহ': '/billing',
      'আবেদনপত্র': '/leave',
      'অন্যান্য': '/documents',
      'সেটিংস': '/users'
    };

    return (
      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 select-none">
        <Link 
          href={sectionUrls[item.section] || '#'} 
          className="hover:text-[#0b5e9e] dark:hover:text-sky-400 transition-colors" 
          style={{ letterSpacing: 'normal' }}
        >
          {item.section}
        </Link>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <Link 
          href={pathname} 
          className="text-slate-800 dark:text-slate-200 font-bold hover:text-[#0b5e9e] dark:hover:text-sky-400 transition-colors" 
          style={{ letterSpacing: 'normal' }}
        >
          {item.title}
        </Link>
      </div>
    );
  };

  const userDisplayName = (currentUser?.name || '').replace(/^(জনাব|জনাবা)\s+/, '').trim();

  const [lang, setLang] = useState<'bn' | 'en'>('bn');

  useEffect(() => {
    const storedLang = (localStorage.getItem('lang') as 'bn' | 'en') || 'bn';
    setLang(storedLang);
  }, []);

  const toggleLang = () => {
    const nextLang = lang === 'bn' ? 'en' : 'bn';
    setLang(nextLang);
    localStorage.setItem('lang', nextLang);
    window.dispatchEvent(new Event('languageChange'));
  };

  return (
    <header className="no-print sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between px-4 h-14 font-sans select-none">
      {/* Left section: Breadcrumbs */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {getBreadcrumbs()}
      </div>

      {/* Center section: Search Trigger Button */}
      <div className="hidden sm:flex items-center flex-1 max-w-[200px] md:max-w-xs justify-center mx-4">
        <button 
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
            window.dispatchEvent(event);
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-all cursor-pointer text-xs"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-slate-400 dark:text-slate-500" />
            <span className="font-semibold text-[11px] text-slate-550 dark:text-slate-400">সার্চ করুন...</span>
          </div>
          <span className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-sans text-[9px] font-bold shadow-xs">Ctrl + K</span>
        </button>
      </div>

      {/* Right section: Corporate Profile Avatar & Control Buttons */}
      <div className="flex items-center gap-2.5 justify-end w-[260px] md:w-[340px] shrink-0">
        {/* Language Switcher Toggle Button */}
        <button 
          onClick={toggleLang}
          className="px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          title={lang === 'bn' ? "Switch to English" : "বাংলায় সুইচ করুন"}
        >
          <Languages size={15} className="text-indigo-600 dark:text-indigo-400" />
          <span className="font-mono text-[11px] uppercase tracking-wider">{lang === 'bn' ? 'BN' : 'EN'}</span>
        </button>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all cursor-pointer shadow-xs flex items-center justify-center"
          title={isDark ? "লাইট মোড" : "ডার্ক মোড"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-slate-100 dark:border-slate-800/80 shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50/80 dark:bg-blue-950/20 flex items-center justify-center overflow-hidden shrink-0 border border-blue-100 dark:border-blue-900/30">
              <Image src="/janata-bank-logo-real.svg" alt="JB Brand Avatar" width={24} height={24} className="object-contain" />
            </div>
            <span className="hidden md:inline text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[280px] truncate">{userDisplayName}</span>
          </button>

          {/* Premium Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl p-4 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-4 duration-200 z-50">
              {/* Dropdown Profile Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 flex items-center justify-center overflow-hidden shrink-0 border border-blue-100 dark:border-blue-900/30">
                  <Image src="/janata-bank-logo-real.svg" alt="JB Brand Avatar" width={32} height={32} className="object-contain" />
                </div>
                <div className="leading-tight flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-50 text-sm whitespace-normal break-words">{userDisplayName}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                    {currentUser?.role === 'ADMIN' ? 'সিস্টেম অ্যাডমিনিস্ট্রেটর' : 'ডিপার্টমেন্টাল ইউজার'}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-1">
                {/* Settings */}
                <Link
                  href="/users"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-sm font-semibold"
                >
                  <Settings size={16} className="text-slate-500" />
                  <span>সেটিংস (Settings)</span>
                </Link>

                {/* Log out */}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 transition-colors text-left cursor-pointer text-sm font-semibold border-t border-dashed border-slate-100 dark:border-slate-800 pt-3 mt-2"
                >
                  <LogOut size={16} />
                  <span>লগ আউট (Log Out)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
