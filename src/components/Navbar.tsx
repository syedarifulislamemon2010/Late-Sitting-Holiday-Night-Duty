'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  CalendarRange, 
  Receipt, 
  FileText, 
  Trash2, 
  Shield,
  Search,
  Bell,
  MessageCircle,
  ChevronRight,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  MessageSquare,
  LogOut,
  User,
  Grid,
  Building2
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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

  // Theme Syncing
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
      localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent closing dropdown
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    const root = document.documentElement;
    if (nextDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    // Trigger window storage event or dynamic style reload
    const activeColor = localStorage.getItem('themeColor') || 'blue';
    const themes = [
      { key: 'blue', primary: '#0b5e9e', hover: '#094d82', darkPrimary: '#38bdf8', darkHover: '#0ea5e9' },
      { key: 'indigo', primary: '#4f46e5', hover: '#4338ca', darkPrimary: '#818cf8', darkHover: '#6366f1' },
      { key: 'emerald', primary: '#10b981', hover: '#059669', darkPrimary: '#34d399', darkHover: '#059669' },
      { key: 'violet', primary: '#7c3aed', hover: '#6d28d9', darkPrimary: '#a78bfa', darkHover: '#7c3aed' },
      { key: 'rose', primary: '#e11d48', hover: '#be123c', darkPrimary: '#fb7185', darkHover: '#e11d48' },
      { key: 'amber', primary: '#d97706', hover: '#b45309', darkPrimary: '#fbbf24', darkHover: '#d97706' }
    ];
    const theme = themes.find(t => t.key === activeColor) || themes[0];
    if (nextDark) {
      root.style.setProperty('--primary', theme.darkPrimary);
      root.style.setProperty('--primary-hover', theme.darkHover);
    } else {
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--primary-hover', theme.hover);
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
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      localStorage.removeItem('currentUser');
      window.location.reload();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Middle Nav Tabs - Facebook style
  const navTabs = [
    { name: 'ড্যাশবোর্ড', href: '/', icon: LayoutDashboard },
    { name: 'নির্বাহী প্যানেল', href: '/executive', icon: UserCheck },
    { name: 'কর্মকর্তাবৃন্দ', href: '/employees', icon: Users },
    { name: 'সেল', href: '/employees', icon: Building2 },
    { name: 'অফিস অর্ডার', href: '/roster', icon: CalendarRange },
    { name: 'বিল', href: '/billing', icon: Receipt },
    { name: 'আর্কাইভ', href: '/documents', icon: FileText },
    { name: 'বিন', href: '/trash', icon: Trash2 },
    { name: 'সেটিংস', href: '/users', icon: Settings },
  ];

  const userDisplayName = currentUser?.name || 'Syed Ariful Islam Emon';
  // Standard Facebook-like initials avatar
  const avatarText = userDisplayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <header className="no-print sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between px-4 h-14 font-sans select-none">
      {/* Left section: Facebook Search and Brand Logo */}
      <div className="flex items-center gap-2 w-[280px] shrink-0">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
            <svg viewBox="0 0 512 512" className="h-6 w-6 shrink-0" fill="currentColor">
              <path d="M175.7,351.4c-53.1,0-96.4-43.3-96.4-96.4c0-24.9,9.5-48.6,26.6-66.5l8.2,7.9c-15.1,15.8-23.5,36.7-23.5,58.7c0,46.9,38.1,85.1,85,85.1c46.9,0,85.1-38.2,85.1-85.1v-97.7h11.4v97.7C272.1,308.1,228.9,351.4,175.7,351.4z"/>
              <path d="M175.7,329.1c-41.3,0-74.9-33.6-74.9-74.9c0-19.4,7.3-37.7,20.7-51.7l8.2,7.9c-11.3,11.8-17.5,27.4-17.5,43.9c0,35.1,28.5,63.6,63.5,63.6c35.1,0,63.6-28.5,63.6-63.6v-96.9h11.4v96.9C250.7,295.4,217,329.1,175.7,329.1z"/>
            </svg>
          </div>
          <div className="hidden sm:block leading-none">
            <h1 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-wide">লেট সিটিং-হলিডে-নাইট পোর্টাল</h1>
            <p className="text-[8px] font-bold text-primary uppercase tracking-widest mt-0.5">Janata Bank PLC.</p>
          </div>
        </Link>
        
        {/* Facebook search bar mockup */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-full ml-2 w-48 border border-transparent focus-within:border-slate-200 dark:focus-within:border-slate-700 transition-all">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="পোর্টাল খুঁজুন..." 
            className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-700 dark:text-slate-200"
          />
        </div>
      </div>


      {/* Right section: User Profile Avatar & Notification Badges */}
      <div className="flex items-center gap-3 justify-end w-[280px] shrink-0">
        
        {/* Mock Notification Icons like Facebook */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Messenger mock */}
          <button className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative" title="মেসেঞ্জার">
            <MessageCircle size={16} />
            <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white font-sans text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">৩</span>
          </button>
          
          {/* Notifications mock */}
          <button className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative" title="নোটিফিকেশন">
            <Bell size={16} />
            <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white font-sans text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">৫</span>
          </button>
        </div>

        {/* Facebook active profile image clicking triggers dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primary flex items-center justify-center text-white font-bold text-xs shadow-inner overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
              {avatarText || 'EM'}
            </div>
            <span className="hidden md:inline text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">{userDisplayName}</span>
          </button>

          {/* Facebook Dropdown Menu - PERFECT visual replica of Image 4 */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-4 duration-200 z-50">
              
              {/* Dropdown Profile Header */}
              <div className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-primary flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                  {avatarText || 'EM'}
                </div>
                <div className="leading-tight flex-1">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-50 text-base">{userDisplayName}</h4>
                  <p className="text-xs text-slate-400 font-medium font-sans mt-0.5">{currentUser?.role === 'ADMIN' ? 'সিস্টেম অ্যাডমিনিস্ট্রেটর' : 'ডিপার্টমেন্টাল ইউজার'}</p>
                </div>
              </div>

              {/* See all profiles button */}
              <div className="mt-2.5 mb-1.5 px-2">
                <button className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                  <Grid size={16} />
                  See all profiles
                </button>
              </div>

              <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-2" />

              {/* List of Facebook Standard Options */}
              <div className="space-y-1">
                {/* Settings & privacy */}
                <button className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                      <Settings size={18} className="stroke-[2px]" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Settings & privacy</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>

                {/* Help & support */}
                <button className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                      <HelpCircle size={18} className="stroke-[2px]" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Help & support</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>

                {/* Display & accessibility (Dark mode toggle on click) */}
                <button 
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                      {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} />}
                    </div>
                    <div className="text-left leading-none">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Display & accessibility</p>
                      <p className="text-[10px] text-slate-400 mt-1">{darkMode ? 'হালকা মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>

                {/* Give feedback */}
                <button className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                      <MessageSquare size={18} className="stroke-[2px]" />
                    </div>
                    <div className="text-left leading-tight">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">Give feedback</span>
                      <span className="text-[10px] text-slate-400">CTRL B</span>
                    </div>
                  </div>
                </button>

                {/* Log out */}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-rose-600 dark:text-rose-400 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-rose-500 dark:text-rose-400">
                      <LogOut size={18} className="stroke-[2px]" />
                    </div>
                    <span className="text-sm font-bold">Log out</span>
                  </div>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}
