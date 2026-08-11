'use client';
import logger from '@/lib/logger';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarRange, 
  Receipt, 
  FileText,
  Menu,
  X,
  Trash2,
  CalendarCheck,
  Utensils,
  Languages,
  ChevronLeft,
  ClipboardList,
  AlertCircle,
  TrendingUp,
  HardDrive,
  ClipboardPen,
  LogOut,
  Database,
  HelpCircle
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useLanguage } from '@/context/LanguageContext';


interface UserSession {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER' | 'EMPLOYEE';
  cells: { id: number; name: string }[];
}


export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [targetHref, setTargetHref] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
      const stored = localStorage.getItem('sidebar-collapsed');
      if (stored === 'true') {
        setIsCollapsed(true);
      }
    }, 0);
  }, []);

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
    window.addEventListener('user-profile-updated', loadUser);
    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('user-profile-updated', loadUser);
    };
  }, []);


  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    } catch (err) {
      logger.error('Logout error:', err);
    }
  };

  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  const isEmployee = currentUser?.role === 'EMPLOYEE';
  const isAdmin = currentUser?.role === 'ADMIN';
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const showClosingBill = isAdmin || currentMonth === 6 || currentMonth === 12;

  const rawSections = isEmployee ? [
    {
      title: isEn ? 'My Services' : 'আমার সার্ভিস',
      items: [
        { name: isEn ? 'My Portal' : 'আমার পোর্টাল', href: '/my-portal', icon: LayoutDashboard },
        { name: isEn ? 'Analytics' : 'অ্যানালিটিক্স', href: '/analytics', icon: TrendingUp }
      ]
    }
  ] : [
    {
      title: isEn ? 'Dashboard' : 'ড্যাশবোর্ড',
      items: [
        { name: isEn ? 'Dashboard' : 'ড্যাশবোর্ড', href: '/dashboard', icon: LayoutDashboard },
        { name: isEn ? 'Analytics' : 'অ্যানালিটিক্স', href: '/analytics', icon: TrendingUp }
      ]
    },
    {
      title: isEn ? 'Administration' : 'প্রশাসনিক কার্যক্রম',
      items: [
        { name: isEn ? 'Employees' : 'কর্মকর্তাবৃন্দ', href: '/employees', icon: Users },
        { name: isEn ? 'Duty Orders & Roster' : 'লেট হলি নাইট অর্ডার', href: '/roster', icon: CalendarRange }
      ]
    },
    {
      title: isEn ? 'Bills & Allowances' : 'বিল ও ভাতাসমূহ',
      items: [
        { name: isEn ? 'Bill Preparation' : 'বিল প্রস্তুতকরণ', href: '/billing', icon: Receipt },
        { name: isEn ? 'Lunch Bill Sheet' : 'লাঞ্চ বিল শিট', href: '/lunch-bill', icon: Utensils },
        ...(showClosingBill ? [{ name: isEn ? 'Closing Bill Sheet' : 'ক্লোজিং বিল শিট', href: '/closing-bill', icon: CalendarCheck }] : [])
      ]
    },
    {
      title: isEn ? 'Applications' : 'আবেদনপত্র',
      items: [
        { name: isEn ? 'Leave Application' : 'ছুটির আবেদন', href: '/leave', icon: CalendarCheck },
        { name: isEn ? 'Hardware Requisition' : 'হার্ডওয়্যার রিকুইজিশন', href: '/hardware-requisition', icon: HardDrive },
        { name: isEn ? 'TAZ Committee Form' : 'TAZ কমিটি ফরম', href: '/taz-committee-form', icon: ClipboardPen }
      ]
    },
    {
      title: isEn ? 'System & Settings' : 'সিস্টেম/সেটিংস',
      items: [
        ...(isAdmin ? [
          { name: isEn ? 'Executive Panel' : 'নির্বাহী প্যানেল', href: '/executive', icon: Users },
          { name: isEn ? 'Audit Log' : 'অডিট লগ', href: '/audit', icon: ClipboardList },
          { name: isEn ? 'Backup & Restore' : 'ব্যাকআপ ও পুনরুদ্ধার', href: '/backup', icon: Database }
        ] : [])
      ]
    },
    {
      title: isEn ? 'Other Tools' : 'অন্যান্য',
      items: [
        { name: isEn ? 'Documents Archive' : 'নথিপত্র আর্কাইভ', href: '/documents', icon: FileText },
        ...(isAdmin ? [{ name: isEn ? 'Recycle Bin' : 'রিসাইকেল বিন', href: '/trash', icon: Trash2 }] : []),
        { name: isEn ? 'Help & Guide' : 'সাহায্য ও নির্দেশিকা', href: '/help', icon: HelpCircle }
      ]
    }
  ];

  const sections = rawSections.filter(section => section.items.length > 0);


  return (
    <>
      {/* Mobile Top Navigation */}
      <div className="no-print lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <Link 
          href={isEmployee ? "/my-portal" : "/dashboard"} 
          onClick={(e) => {
            if (typeof window !== 'undefined' && (window as Window & { __unsavedChanges?: boolean }).__unsavedChanges) {
              e.preventDefault();
              setTargetHref(isEmployee ? '/my-portal' : '/dashboard');
              setShowWarningModal(true);
            }
          }}

          className="flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
        >
          <Image src="/janata-bank-logo-real.svg" alt="Janata Bank Logo" width={32} height={32} className="shrink-0 object-contain" />
          <h1 className="font-semibold text-slate-950 dark:text-slate-100 text-xs sm:text-sm leading-tight whitespace-normal">লেট সিটিং, ছুটির দিনে ও রাত্রীকালীন ডিউটি পোর্টাল</h1>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="no-print lg:hidden fixed inset-0 bg-slate-950/20 z-40"
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside 
        className={`no-print fixed top-0 lg:top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/60 transition-all duration-350 ease-in-out lg:translate-x-0 lg:relative ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:sticky lg:h-screen'
        } ${
          isMounted && isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${isOpen ? 'w-72 sm:w-80' : ''}`}
      >
        {/* Collapse toggle button on desktop - Floats on the right middle edge */}
        <button 
          onClick={toggleCollapse}
          className={`hidden lg:flex absolute top-[10%] -right-3.5 items-center justify-center w-7 h-7 rounded-xl bg-white dark:bg-slate-805 border border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-sky-400 shadow-md hover:shadow-lg z-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 hover:scale-105 active:scale-95 ${
            isCollapsed ? 'rotate-180' : ''
          }`}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Sidebar প্রসারিত করুন" : "Sidebar সংকুচিত করুন"}
        >
          <ChevronLeft size={14} className="shrink-0" />
        </button>

        {/* Sidebar Header Logo */}
        <div className={`flex items-center py-5 border-b border-slate-200/60 dark:border-slate-800/60 ${
          isMounted && isCollapsed ? 'lg:px-3 lg:justify-center' : 'px-6 justify-between'
        }`}>
          <Link 
            href={isEmployee ? "/my-portal" : "/"} 
            onClick={(e) => {
              if (typeof window !== 'undefined' && (window as Window & { __unsavedChanges?: boolean }).__unsavedChanges) {
                e.preventDefault();
                setTargetHref(isEmployee ? '/my-portal' : '/');
                setShowWarningModal(true);
              }
            }}
            className="flex items-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg w-full"
          >
            <Image 
              src="/janata-bank-logo-real.svg" 
              alt="Janata Bank Logo" 
              width={36}
              height={36}
              className="shrink-0 object-contain transition-transform group-hover:scale-105" 
            />
            <div className={`transition-all duration-200 overflow-hidden ${
              isMounted && isCollapsed 
                ? 'opacity-0 w-0 ml-0 whitespace-nowrap' 
                : 'opacity-100 w-full ml-3 whitespace-normal'
            }`}>
              <h1 className="font-extrabold text-slate-950 dark:text-slate-100 text-[13px] sm:text-[14px] leading-tight">লেট সিটিং, ছুটির দিনে ও রাত্রীকালীন ডিউটি পোর্টাল</h1>
              <p className="text-[10px] font-bold text-indigo-650 dark:text-sky-400 uppercase tracking-wider mt-1">জনতা ব্যাংক পিএলসি.</p>
            </div>
          </Link>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav 
          role="navigation" 
          aria-label="Main navigation" 
          className={`flex-1 py-6 overflow-y-auto no-scrollbar space-y-4 ${
          isMounted && isCollapsed ? 'px-2' : 'px-4'
        }`}>
          {sections.map((section, secIdx) => (
            <div key={section.title} className="space-y-1.5">
              {/* Clean Divider System / Title Transition */}
              <div className="transition-all duration-300">
                {isMounted && isCollapsed ? (
                  secIdx > 0 ? (
                    <div className="border-t border-slate-205 dark:border-slate-800 my-2 mx-3" />
                  ) : (
                    <div className="h-2" />
                  )
                ) : (
                  section.items.length > 0 && (
                    <h3 className="px-4 text-[10px] font-black tracking-widest text-slate-400/80 dark:text-slate-500 uppercase pt-4 pb-1.5 whitespace-nowrap flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                      <span>{section.title}</span>
                    </h3>
                  )
                )}
              </div>
              
              <div className="space-y-1" role="group" aria-expanded={!isCollapsed}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.name}
                      href={item.href}
                      onClick={(e) => {
                        setIsOpen(false);
                        if (typeof window !== 'undefined' && (window as Window & { __unsavedChanges?: boolean }).__unsavedChanges) {
                          e.preventDefault();
                          setTargetHref(item.href);
                          setShowWarningModal(true);
                        }
                      }}
                      className={`flex items-center transition-all duration-300 ease-in-out group relative rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 mx-2 ${
                        isMounted && isCollapsed 
                          ? 'justify-center py-3 px-0' 
                          : 'px-3.5 py-3 hover:pl-5'
                      } ${
                        isActive 
                          ? 'bg-gradient-to-r from-indigo-50 to-blue-50/20 dark:from-indigo-950/20 dark:to-blue-950/5 text-indigo-650 dark:text-sky-400 font-black' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-805/30 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {/* Vertical Indicator Line */}
                      {isActive && !isCollapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-650 dark:bg-sky-400 rounded-full animate-pulse" />
                      )}
                      
                      <Icon 
                        size={18} 
                        className={`transition-transform duration-300 group-hover:scale-110 shrink-0 ${
                          isActive ? 'text-indigo-650 dark:text-sky-400' : 'text-slate-450 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                        }`} 
                      />
                      
                      <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                        isMounted && isCollapsed 
                          ? 'opacity-0 w-0 ml-0' 
                          : 'opacity-100 w-auto ml-3 font-semibold text-xs sm:text-[13px]'
                      }`}>
                        {item.name}
                      </span>

                      {/* Interactive Hover Tooltip when collapsed */}
                      {isMounted && isCollapsed && (
                        <div className="absolute left-16 opacity-0 pointer-events-none invisible group-hover:opacity-100 group-hover:visible group-hover:left-20 transition-all duration-300 whitespace-nowrap z-50 shadow-xl px-3 py-2 bg-slate-950/95 dark:bg-slate-950/95 border border-slate-800 text-white text-[11px] font-bold rounded-xl leading-none">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Styled Unsaved Changes Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 text-center transform scale-100 transition-all font-sans">
            <div className="mx-auto w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
              <AlertCircle size={32} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                আপনি যে পেইজে আছেন, সেখানে থাকতে চান?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                আপনার কোনো পরিবর্তন অসংরক্ষিত থাকতে পারে। পেজ পরিবর্তন করলে পরিবর্তনগুলো মুছে যাবে।
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer border border-transparent"
              >
                হ্যাঁ
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    (window as Window & { __unsavedChanges?: boolean }).__unsavedChanges = false;
                  }
                  setShowWarningModal(false);
                  window.location.href = targetHref;
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold transition-all border border-red-100 dark:border-red-900/40 cursor-pointer"
              >
                না
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
