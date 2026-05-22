'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarRange, 
  Receipt, 
  FileText,
  Sun, 
  Moon,
  Menu,
  X,
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      // Force page reload to clear AuthGuard session
      window.location.reload();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { name: 'ড্যাশবোর্ড', href: '/', icon: LayoutDashboard },
    { name: 'কর্মকর্তাবৃন্দ ও সেল', href: '/employees', icon: Users },
    { name: 'রোস্টার ও জিও', href: '/roster', icon: CalendarRange },
    { name: 'আপ্যায়ন বিল নোট', href: '/billing', icon: Receipt },
    { name: 'পিডিএফ আর্কাইভ', href: '/documents', icon: FileText },

  ];

  return (
    <>
      {/* Mobile Top Navigation */}
      <div className="no-print lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/janata-bank-logo-original.png" alt="Janata Bank PLC" className="h-8 object-contain" />
          <h1 className="font-bold text-slate-800 dark:text-slate-100 font-sans tracking-wide">ডিউটি পোর্টাল</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {darkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="no-print lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside className={`no-print fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:sticky lg:h-screen'}`}>
        {/* Sidebar Header Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/janata-bank-logo-original.png" alt="Janata Bank PLC" className="h-10 object-contain" />
            <div>
              <h1 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">ডিউটি পোর্টাল</h1>
              <p className="text-[10px] font-medium text-[#00BCD4] dark:text-[#4DD0E1] uppercase tracking-wider">জনতা ব্যাংক পিএলসি.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 shadow-sm shadow-indigo-50/50 dark:shadow-none font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'}`}
              >
                <Icon size={18} className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center justify-between px-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium font-sans">থিম পরিবর্তন</span>
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-sm bg-white dark:bg-slate-900"
              title={darkMode ? 'হালকা মোড' : 'ডার্ক মোড'}
            >
              {darkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} />}
            </button>
          </div>
          
          <div className="px-3 py-2 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-950/30 rounded-xl flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-[11px] leading-tight">
              <p className="font-semibold text-slate-700 dark:text-slate-300">ডাটাবেজ কানেক্টেড</p>
              <p className="text-slate-400 dark:text-slate-500">PostgreSQL (Neon)</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl text-xs font-semibold transition-colors"
          >
            <LogOut size={14} />
            লগআউট করুন
          </button>
        </div>
      </aside>
    </>
  );
}
