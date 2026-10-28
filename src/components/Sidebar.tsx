'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
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
  ChevronLeft,
  ClipboardList,
  AlertCircle,
  TrendingUp,
  HardDrive,
  FileCheck,
  Database,
  HelpCircle
} from 'lucide-react';
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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [targetHref, setTargetHref] = useState('');
  const [hoveredItem, setHoveredItem] = useState<{ name: string; top: number } | null>(null);

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

  useEffect(() => {
    const clearTooltip = () => setHoveredItem(null);
    window.addEventListener('scroll', clearTooltip, true);
    window.addEventListener('resize', clearTooltip);
    return () => {
      window.removeEventListener('scroll', clearTooltip, true);
      window.removeEventListener('resize', clearTooltip);
    };
  }, []);

  const toggleCollapse = () => {
    setHoveredItem(null);
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const { lang } = useLanguage();
  const isEn = lang === 'en';

  const isEmployee = currentUser?.role === 'EMPLOYEE';
  const isAdmin = currentUser?.role === 'ADMIN';
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const showClosingBill = isAdmin || currentMonth === 6 || currentMonth === 12;

  interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }

  const rawGroups: NavItem[][] = isEmployee ? [
    [
      { name: isEn ? 'My Portal' : 'আমার পোর্টাল', href: '/my-portal', icon: LayoutDashboard },
      { name: isEn ? 'Analytics' : 'অ্যানালিটিক্স', href: '/analytics', icon: TrendingUp }
    ]
  ] : [
    // গ্রুপ ১: ড্যাশবোর্ড, অ্যানালিটিক্স, কর্মকর্তাবৃন্দ
    [
      { name: isEn ? 'Dashboard' : 'ড্যাশবোর্ড', href: '/dashboard', icon: LayoutDashboard },
      { name: isEn ? 'Analytics' : 'অ্যানালিটিক্স', href: '/analytics', icon: TrendingUp },
      { name: isEn ? 'Employees' : 'কর্মকর্তাবৃন্দ', href: '/employees', icon: Users }
    ],
    // গ্রুপ ২: ছুটির আবেদন
    [
      { name: isEn ? 'Leave Application' : 'ছুটির আবেদন', href: '/leave', icon: CalendarCheck }
    ],
    // গ্রুপ ৩: লেট হলি নাইট অর্ডার, বিল প্রস্তুতকরণ
    [
      { name: isEn ? 'Duty Orders & Roster' : 'লেট হলি নাইট অর্ডার', href: '/roster', icon: CalendarRange },
      { name: isEn ? 'Bill Preparation' : 'বিল প্রস্তুতকরণ', href: '/billing', icon: Receipt }
    ],
    // গ্রুপ ৪: লাঞ্চ বিল শিট
    [
      { name: isEn ? 'Lunch Bill Sheet' : 'লাঞ্চ বিল শিট', href: '/lunch-bill', icon: Utensils },
      ...(showClosingBill ? [{ name: isEn ? 'Closing Bill Sheet' : 'ক্লোজিং বিল শিট', href: '/closing-bill', icon: CalendarCheck }] : [])
    ],
    // গ্রুপ ৫: হার্ডওয়্যার রিকুইজিশন, TAZ কমিটি ফরম
    [
      { name: isEn ? 'Hardware Requisition' : 'হার্ডওয়্যার রিকুইজিশন', href: '/hardware-requisition', icon: HardDrive },
      { name: isEn ? 'TAZ Committee Form' : 'TAZ কমিটি ফরম', href: '/taz-committee-form', icon: FileCheck }
    ],
    // গ্রুপ ৬: নথিপত্র আর্কাইভ, রিসাইকেল বিন, সাহায্য ও নির্দেশিকা
    [
      { name: isEn ? 'Documents Archive' : 'নথিপত্র আর্কাইভ', href: '/documents', icon: FileText },
      { name: isEn ? 'Recycle Bin' : 'রিসাইকেল বিন', href: '/trash', icon: Trash2 },
      { name: isEn ? 'Help & Guide' : 'সাহায্য ও নির্দেশিকা', href: '/help', icon: HelpCircle }
    ],
    // গ্রুপ ৭: অ্যাডমিন স্পেসিফিক (যদি অ্যাডমিন হন)
    ...(isAdmin ? [
      [
        { name: isEn ? 'Executive Panel' : 'নির্বাহী প্যানেল', href: '/executive', icon: Users },
        { name: isEn ? 'Audit Log' : 'অডিট লগ', href: '/audit', icon: ClipboardList },
        { name: isEn ? 'Backup & Restore' : 'ব্যাকআপ ও পুনরুদ্ধার', href: '/backup', icon: Database }
      ]
    ] : [])
  ];

  const menuGroups = rawGroups.filter(group => group.length > 0);

  return (
    <>
      {/* Mobile Top Navigation */}
      <div className="no-print lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
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
          <Image src="/janata-bank-logo-real.svg" alt="Janata Bank Logo" width={28} height={28} className="shrink-0 object-contain" />
          <h1 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-tight">
            {isEn ? 'LHN Duty Portal' : 'লেট সিটিং, ছুটি ও নাইট ডিউটি পোর্টাল'}
          </h1>
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
        {/* Collapse toggle button on desktop - Floats on the right edge */}
        <button 
          onClick={toggleCollapse}
          className={`hidden lg:flex absolute top-6 -right-3.5 items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-sky-400 shadow-md hover:shadow-lg z-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 hover:scale-105 active:scale-95 ${
            isCollapsed ? 'rotate-180' : ''
          }`}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Sidebar প্রসারিত করুন" : "Sidebar সংকুচিত করুন"}
        >
          <ChevronLeft size={14} className="shrink-0" />
        </button>

        {/* Sidebar Header Logo — Compact 2-Line Header */}
        <div className={`flex items-center py-4 border-b border-slate-200/60 dark:border-slate-800/60 ${
          isMounted && isCollapsed ? 'lg:px-3 lg:justify-center' : 'px-5 justify-between'
        }`}>
          <Link 
            href={isEmployee ? "/my-portal" : "/"} 
            onClick={(e) => {
              const target = isEmployee ? '/my-portal' : '/';
              if (pathname === target) {
                e.preventDefault();
                return;
              }
              if (typeof window !== 'undefined' && (window as Window & { __unsavedChanges?: boolean }).__unsavedChanges) {
                e.preventDefault();
                setTargetHref(target);
                setShowWarningModal(true);
              }
            }}
            className="flex items-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg w-full gap-2.5"
          >
            <Image 
              src="/janata-bank-logo-real.svg" 
              alt="Janata Bank Logo" 
              width={34}
              height={34}
              className="shrink-0 object-contain transition-transform group-hover:scale-105" 
            />
            <div className={`transition-all duration-200 overflow-hidden ${
              isMounted && isCollapsed 
                ? 'opacity-0 w-0 ml-0 whitespace-nowrap' 
                : 'opacity-100 w-full whitespace-normal'
            }`}>
              <h1 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-[13px] leading-tight font-sans">
                {isEn ? 'LHN Duty Portal' : 'লেট সিটিং, ছুটি ও নাইট ডিউটি পোর্টাল'}
              </h1>
              <p className="text-[10px] font-extrabold text-primary dark:text-sky-400 uppercase tracking-wider mt-0.5 font-sans">
                {isEn ? 'Janata Bank PLC.' : 'জনতা ব্যাংক পিএলসি.'}
              </p>
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

        {/* Sidebar Navigation Links (No category titles, clean group dividers) */}
        <nav 
          role="navigation" 
          aria-label="Main navigation" 
          onScroll={() => setHoveredItem(null)}
          className={`flex-1 py-3 overflow-y-auto no-scrollbar space-y-1 ${
          isMounted && isCollapsed ? 'px-2' : 'px-3'
        }`}>
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-0.5">
              {/* Subtle divider between item groups */}
              {groupIdx > 0 && (
                <div className="my-2 mx-2 border-t border-slate-200/60 dark:border-slate-800/60" />
              )}
              
              <div className="space-y-0.5" role="group" aria-expanded={!isCollapsed}>
                {group.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.href}
                      href={item.href}
                      title={isMounted && isCollapsed ? item.name : undefined}
                      onMouseEnter={(e) => {
                        if (isMounted && isCollapsed) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredItem({
                            name: item.name,
                            top: rect.top + rect.height / 2
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredItem(null);
                      }}
                      onClick={(e) => {
                        setHoveredItem(null);
                        setIsOpen(false);
                        if (isActive) {
                          e.preventDefault();
                          return;
                        }
                        if (typeof window !== 'undefined' && (window as Window & { __unsavedChanges?: boolean }).__unsavedChanges) {
                          e.preventDefault();
                          setTargetHref(item.href);
                          setShowWarningModal(true);
                        }
                      }}
                      className={`flex items-center transition-all duration-200 ease-in-out group relative rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${
                        isMounted && isCollapsed 
                          ? 'justify-center py-2.5 px-0 mx-1' 
                          : 'px-3 py-2.5 hover:pl-4 mx-1'
                      } ${
                        isActive 
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-sky-300 font-extrabold shadow-2xs' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {/* Left Accent Bar for Active Item */}
                      {isActive && !isCollapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary dark:bg-sky-400 rounded-r-full" />
                      )}
                      
                      <Icon 
                        size={17} 
                        className={`transition-transform duration-200 group-hover:scale-105 shrink-0 ${
                          isActive ? 'text-primary dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                        }`} 
                      />
                      
                      <span className={`transition-all duration-200 whitespace-nowrap overflow-hidden ${
                        isMounted && isCollapsed 
                          ? 'opacity-0 w-0 ml-0' 
                          : 'opacity-100 w-auto ml-3 text-xs sm:text-[13px]'
                      }`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Floating Tooltip for Collapsed Sidebar on Desktop */}
        {isMounted && isCollapsed && hoveredItem && (
          <div 
            className="hidden lg:flex fixed left-[84px] -translate-y-1/2 z-[9999] pointer-events-none px-3 py-1.5 bg-slate-900 dark:bg-slate-950 border border-slate-700/80 dark:border-slate-800 text-white text-[12px] font-bold rounded-lg shadow-xl whitespace-nowrap items-center animate-in fade-in duration-100"
            style={{ top: hoveredItem.top }}
          >
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-950 border-l border-b border-slate-700/80 dark:border-slate-800 rotate-45" />
            <span className="relative z-10">{hoveredItem.name}</span>
          </div>
        )}
      </aside>

      {/* Styled Unsaved Changes Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 text-center transform scale-100 transition-all font-sans">
            <div className="mx-auto w-14 h-14 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
              <AlertCircle size={28} />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                আপনি কি এই পেজে থাকতে চান?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                আপনার কোনো পরিবর্তন অসংরক্ষিত থাকতে পারে। পেজ পরিবর্তন করলে পরিবর্তনগুলো মুছে যাবে।
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                হ্যাঁ, পেজে থাকুন
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    (window as Window & { __unsavedChanges?: boolean }).__unsavedChanges = false;
                  }
                  setShowWarningModal(false);
                  router.push(targetHref);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all border border-rose-200 dark:border-rose-900/40 cursor-pointer"
              >
                পেজ পরিবর্তন করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
