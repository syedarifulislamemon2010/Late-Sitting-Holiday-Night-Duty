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
  LogOut,
  UserCheck,
  Trash2,
  CalendarCheck,
  Utensils
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  const isAdministrationCell = currentUser?.cells?.some((c: any) => 
    c.name.includes('প্রশাসন') || 
    c.name.toLowerCase().includes('admin') || 
    c.name.toLowerCase().includes('administration')
  );
  
  const isAdminOrAdminCell = currentUser?.role === 'ADMIN' || isAdministrationCell;

  const currentMonth = new Date().getMonth() + 1; // 1-12
  const showClosingBill = isAdminOrAdminCell || currentMonth === 6 || currentMonth === 12;

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
        { name: 'নির্বাহী প্যানেল', href: '/executive', icon: UserCheck },
        { name: 'কর্মকর্তাবৃন্দ', href: '/employees', icon: Users },
        { name: 'অফিস অর্ডার', href: '/roster', icon: CalendarRange }
      ]
    },
    {
      title: 'বিলিং ও আবেদন',
      items: [
        { name: 'বিল', href: '/billing', icon: Receipt },
        { name: 'লাঞ্চ বিল শিট', href: '/lunch-bill', icon: Utensils },
        ...(showClosingBill ? [{ name: 'ক্লোজিং বিল শিট', href: '/closing-bill', icon: CalendarCheck }] : []),
        { name: 'ছুটি আবেদন', href: '/leave', icon: CalendarCheck }
      ]
    },
    {
      title: 'অন্যান্য',
      items: [
        { name: 'আর্কাইভ', href: '/documents', icon: FileText },
        { name: 'রিসাইকেল বিন', href: '/trash', icon: Trash2 }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Top Navigation */}
      <div className="no-print lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/janata-bank-logo-real.svg" alt="Janata Bank Logo" className="h-8 w-8 shrink-0 object-contain" />
          <h1 className="font-semibold text-slate-950 text-sm leading-tight">লেট সিটিং-হলিডে-নাইট পোর্টাল</h1>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
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
      <aside className={`no-print fixed top-0 lg:top-0 bottom-0 left-0 z-30 flex flex-col w-72 bg-white/90 backdrop-blur-sm border-r border-slate-200/80 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:sticky lg:h-screen'}`}>
        {/* Sidebar Header Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src="/janata-bank-logo-real.svg" alt="Janata Bank Logo" className="h-9 w-9 shrink-0 object-contain" />
            <div>
              <h1 className="font-semibold text-slate-950 text-[15px] leading-tight">লেট সিটিং-হলিডে-নাইট পোর্টাল</h1>
              <p className="text-xs font-medium text-blue-600 tracking-wide mt-0.5">জনতা ব্যাংক পিএলসি.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar space-y-4">
          {sections.map((section, secIdx) => (
            <div key={section.title} className="space-y-1.5">
              {secIdx > 0 && <div className="border-t border-slate-100 my-2.5" />}
              <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group relative ${isActive ? 'bg-blue-50/80 text-blue-600 font-semibold rounded-xl' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-md" />
                      )}
                      <Icon size={18} className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-650'}`} />
                      <span className="text-[15px]">{item.name}</span>
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
