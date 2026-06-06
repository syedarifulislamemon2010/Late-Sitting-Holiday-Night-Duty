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
  Menu,
  X,
  Trash2,
  CalendarCheck,
  Utensils,
  Languages,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') {
      setIsCollapsed(true);
    }
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
    // Keep white theme active by default
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  const currentMonth = new Date().getMonth() + 1; // 1-12
  const showClosingBill = isAdmin || currentMonth === 6 || currentMonth === 12;

  const sections = [
    {
      title: 'ড্যাশবোর্ড',
      items: [
        { name: 'ড্যাশবোর্ড', href: '/', icon: LayoutDashboard }
      ]
    },
    {
      title: 'প্রশাসনিক কার্যক্রম',
      items: [
        ...(isAdmin ? [{ name: 'নির্বাহী প্যানেল', href: '/executive', icon: Users }] : []),
        { name: 'কর্মকর্তাবৃন্দ', href: '/employees', icon: Users },
        { name: 'অফিস অর্ডার', href: '/roster', icon: CalendarRange }
      ]
    },
    {
      title: 'বিল ও ভাতাসমূহ',
      items: [
        { name: 'বিল', href: '/billing', icon: Receipt },
        { name: 'লাঞ্চ বিল শিট', href: '/lunch-bill', icon: Utensils },
        ...(showClosingBill ? [{ name: 'ক্লোজিং বিল শিট', href: '/closing-bill', icon: CalendarCheck }] : [])
      ]
    },
    {
      title: 'আবেদনপত্র',
      items: [
        { name: 'ছুটি আবেদন', href: '/leave', icon: CalendarCheck }
      ]
    },
    {
      title: 'অন্যান্য',
      items: [
        { name: 'বাংলা কনভার্টার', href: '/converter', icon: Languages },
        { name: 'আর্কাইভ', href: '/documents', icon: FileText },
        { name: 'রিসাইকেল বিন', href: '/trash', icon: Trash2 }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Top Navigation */}
      <div className="no-print lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <Link href="/" className="flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0b5e9e] rounded-lg">
          <img src="/janata-bank-logo-real.svg" alt="Janata Bank Logo" className="h-8 w-8 shrink-0 object-contain" />
          <h1 className="font-semibold text-slate-950 text-sm leading-tight">লেট সিটিং-হলিডে-নাইট পোর্টাল</h1>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="no-print lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside 
        className={`no-print fixed top-0 lg:top-0 bottom-0 left-0 z-30 flex flex-col bg-white/90 backdrop-blur-sm border-r border-slate-200/80 transition-all duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:sticky lg:h-screen'
        } ${
          isMounted && isCollapsed ? 'lg:w-20' : 'lg:w-72'
        } ${isOpen ? 'w-72' : ''}`}
      >
        {/* Sidebar Header Logo */}
        <div className={`flex items-center justify-between py-5 border-b border-slate-100 ${
          isMounted && isCollapsed ? 'lg:px-3 lg:justify-center' : 'px-6'
        }`}>
          <Link 
            href="/" 
            className="flex items-center gap-3 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0b5e9e] focus:ring-offset-2 rounded-lg"
          >
            <img 
              src="/janata-bank-logo-real.svg" 
              alt="Janata Bank Logo" 
              className="h-9 w-9 shrink-0 object-contain transition-transform group-hover:scale-105" 
            />
            {!(isMounted && isCollapsed) && (
              <div className="whitespace-nowrap transition-opacity duration-200">
                <h1 className="font-extrabold text-slate-950 text-[15px] sm:text-[16px] leading-tight">লেট সিটিং-হলিডে-নাইট পোর্টাল</h1>
                <p className="text-[10px] font-bold text-[#0b5e9e] uppercase tracking-wider mt-1">জনতা ব্যাংক পিএলসি.</p>
              </div>
            )}
          </Link>
          
          {/* Collapse toggle button on desktop */}
          {!(isMounted && isCollapsed) ? (
            <button 
              onClick={toggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0b5e9e]"
              title="Sidebar সংকুচিত করুন"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <button 
              onClick={toggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0b5e9e]"
              title="Sidebar প্রসারিত করুন"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          )}

          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className={`flex-1 py-6 overflow-y-auto no-scrollbar space-y-4 ${
          isMounted && isCollapsed ? 'px-2' : 'px-4'
        }`}>
          {sections.map((section, secIdx) => (
            <div key={section.title} className="space-y-1.5">
              {secIdx > 0 && <div className="border-t border-slate-100 my-2.5" />}
              
              {!(isMounted && isCollapsed) ? (
                <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider transition-all duration-200">
                  {section.title}
                </h3>
              ) : (
                <div className="h-2" />
              )}
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center transition-all duration-200 group relative border-l-4 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-[#0b5e9e] ${
                        isMounted && isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                      } ${
                        isActive 
                          ? 'bg-[#0b5e9e]/5 text-[#0b5e9e] border-[#0b5e9e] font-bold' 
                          : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      title={isMounted && isCollapsed ? item.name : undefined}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon 
                        size={18} 
                        className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${
                          isActive ? 'text-[#0b5e9e]' : 'text-slate-400 group-hover:text-slate-600'
                        }`} 
                      />
                      
                      {!(isMounted && isCollapsed) && (
                        <span className="app-sidebar-text">{item.name}</span>
                      )}

                      {/* Left-side active indicator bar */}
                      {isActive && (isMounted && isCollapsed) && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#0b5e9e]" />
                      )}

                      {/* Tooltip on hover when collapsed */}
                      {isMounted && isCollapsed && (
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-950 text-white text-[12px] font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-md">
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
    </>
  );
}
