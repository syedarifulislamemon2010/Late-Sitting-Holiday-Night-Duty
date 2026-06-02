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
  Building2,
  Utensils,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notification panel states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }

  // Poll notifications
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside click for both dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Mark single as read and navigate
  const handleNotifClick = async (n: any) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', id: n.id })
      });
      setIsNotifOpen(false);
      if (n.link) {
        window.location.href = n.link;
      } else {
        loadNotifications();
      }
    } catch (err) {
      console.error('Error handling notif click:', err);
      if (n.link) {
        window.location.href = n.link;
      }
    }
  };

  const getNotifIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('লাঞ্চ') || t.includes('lunch')) {
      return <Utensils size={14} className="text-rose-500" />;
    }
    if (t.includes('অফিস') || t.includes('order') || t.includes('নির্দেশ')) {
      return <CalendarRange size={14} className="text-sky-500" />;
    }
    if (t.includes('বিল') || t.includes('billing') || t.includes('টাকা') || t.includes('মঞ্জুর')) {
      return <Receipt size={14} className="text-amber-500" />;
    }
    if (t.includes('মেসেজ') || t.includes('message') || t.includes('চ্যাট')) {
      return <MessageSquare size={14} className="text-emerald-500" />;
    }
    return <Bell size={14} className="text-indigo-500" />;
  };

  const getRelativeTimeStr = (dateStr: string) => {
    const elapsed = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const toBnDigits = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);

    if (seconds < 60) return 'এইমাত্র';
    if (minutes < 60) return `${toBnDigits(minutes)} মিনিট আগে`;
    if (hours < 24) return `${toBnDigits(hours)} ঘণ্টা আগে`;
    return `${toBnDigits(days)} দিন আগে`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
    { name: 'অফিস অর্ডার', href: '/roster', icon: CalendarRange },
    { name: 'বিল', href: '/billing', icon: Receipt },
    { name: 'লাঞ্চ বিল', href: '/lunch-bill', icon: Utensils },
    { name: 'আর্কাইভ', href: '/documents', icon: FileText },
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
          {/* Messenger link */}
          <Link 
            href="/chat"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative cursor-pointer" 
            title="মেসেঞ্জার (চ্যাট)"
          >
            <MessageCircle size={16} />
            <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white font-sans text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">৩</span>
          </Link>
          
          {/* Notifications dynamic */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative cursor-pointer" 
              title="নোটিফিকেশন"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white font-sans text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown List */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-4 duration-200 z-50">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-50 text-base">নোটিফিকেশন প্যানেল</h4>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      সব পঠিত চিহ্নিত করুন
                    </button>
                  )}
                </div>

                {notifications.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto space-y-1.5 no-scrollbar">
                    {notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`flex gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer relative items-start ${!n.isRead ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                          {getNotifIcon(n.title)}
                        </div>
                        <div className="flex-1 leading-tight space-y-1">
                          <p className={`text-xs text-slate-800 dark:text-slate-100 ${!n.isRead ? 'font-extrabold' : 'font-medium'}`}>
                            {n.title}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {n.message}
                          </p>
                          <p className="text-[8px] text-slate-400 font-bold tracking-wide">
                            {getRelativeTimeStr(n.createdAt)}
                          </p>
                        </div>
                        {!n.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-xs text-slate-400 font-bold">কোনো নোটিফিকেশন নেই।</p>
                  </div>
                )}
              </div>
            )}
          </div>
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

          {/* Simplified Premium Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-4 duration-200 z-50">
              {/* Dropdown Profile Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                  {avatarText || 'EM'}
                </div>
                <div className="leading-tight flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-50 text-sm truncate">{userDisplayName}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                    {currentUser?.role === 'ADMIN' ? 'সিস্টেম অ্যাডমিনিস্ট্রেটর' : 'ডিপার্টমেন্টাল ইউজার'}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-1">
                {/* Dark Mode toggle */}
                <button 
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {darkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} />}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {darkMode ? 'হালকা মোড (Light Mode)' : 'ডার্ক মোড (Dark Mode)'}
                    </span>
                  </div>
                </button>

                {/* Log out */}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 transition-colors text-left"
                >
                  <LogOut size={16} />
                  <span className="text-xs font-bold">লগ আউট (Log Out)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
