'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Settings,
  LogOut
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

  // Theme Syncing - Strictly blue theme
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
      localStorage.getItem('theme') === 'dark';
    
    // Explicitly clean and set variables to the requested light blue theme on initial load
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.setProperty('--primary', '#38bdf8');
      root.style.setProperty('--primary-hover', '#0ea5e9');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--primary', '#0b5e9e');
      root.style.setProperty('--primary-hover', '#094d82');
    }
  }, []);

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

  const userDisplayName = (currentUser?.name || '').replace(/^(জনাব|জনাবা)\s+/, '').trim();

  return (
    <header className="no-print sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between px-4 h-14 font-sans select-none">
      {/* Left section: Brand Logo & Title */}
      <div className="flex items-center gap-2 w-[320px] shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image src="/janata-bank-logo-real.svg" alt="Janata Bank Logo" width={36} height={36} className="shrink-0 object-contain transition-transform group-hover:scale-105" />
          <div className="hidden sm:block leading-none">
            <h1 className="font-extrabold text-slate-950 dark:text-slate-100 text-[16px] sm:text-[18px] leading-tight">লেট সিটিং-হলিডে-নাইট পোর্টাল</h1>
            <p className="text-[11px] font-bold text-[#0b5e9e] dark:text-[#38bdf8] uppercase tracking-wider mt-1">জনতা ব্যাংক পিএলসি.</p>
          </div>
        </Link>
      </div>

      {/* Right section: Corporate Profile Avatar / Janata Bank Badge */}
      <div className="flex items-center gap-3 justify-end w-[320px] shrink-0">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-slate-100 dark:border-slate-800/80 shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50/80 flex items-center justify-center overflow-hidden shrink-0 border border-blue-100">
              <Image src="/janata-bank-logo-real.svg" alt="JB Brand Avatar" width={24} height={24} className="object-contain" />
            </div>
            <span className="hidden md:inline text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[280px] truncate">{userDisplayName}</span>
          </button>

          {/* Premium Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl p-4 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-4 duration-200 z-50">
              {/* Dropdown Profile Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50/80 flex items-center justify-center overflow-hidden shrink-0 border border-blue-100">
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
