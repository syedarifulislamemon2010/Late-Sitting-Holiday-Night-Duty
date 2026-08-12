'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  FileText, 
  Receipt, 
  CalendarDays, 
  CheckCheck, 
  ExternalLink,
  Info
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'ORDER' | 'BILL' | 'LEAVE' | 'SYSTEM';
  timestamp: string;
  timeAgo: string;
  link?: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'ORDER' | 'BILL' | 'LEAVE'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load read notifications from localStorage
  useEffect(() => {
    try {
      const storedRead = localStorage.getItem('read_notification_ids');
      if (storedRead) {
        setReadIds(JSON.parse(storedRead));
      }
    } catch {}
  }, []);

  // Fetch notifications periodically
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch {}
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s check
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem('read_notification_ids', JSON.stringify(allIds));
    } catch {}
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      try {
        localStorage.setItem('read_notification_ids', JSON.stringify(updated));
      } catch {}
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'ALL') return true;
    return n.type === filterType;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ORDER':
        return <FileText size={16} className="text-blue-500 shrink-0" />;
      case 'BILL':
        return <Receipt size={16} className="text-emerald-500 shrink-0" />;
      case 'LEAVE':
        return <CalendarDays size={16} className="text-amber-500 shrink-0" />;
      default:
        return <Info size={16} className="text-indigo-500 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="নোটিফিকেশন সেন্টারে ক্লিক করুন"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[9px] font-bold items-center justify-center leading-none">
              {toBanglaDigits(unreadCount > 9 ? '৯+' : unreadCount)}
            </span>
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">নোটিফিকেশন</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 text-[10px] font-bold rounded-full">
                  {toBanglaDigits(unreadCount)}টি নতুন
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck size={14} />
                সব পড়া শেষ
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-2 pt-1 gap-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-primary border-b-2 border-primary'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              সব
            </button>
            <button
              type="button"
              onClick={() => setFilterType('ORDER')}
              className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer ${
                filterType === 'ORDER'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              আদেশ
            </button>
            <button
              type="button"
              onClick={() => setFilterType('BILL')}
              className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer ${
                filterType === 'BILL'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              বিল
            </button>
            <button
              type="button"
              onClick={() => setFilterType('LEAVE')}
              className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer ${
                filterType === 'LEAVE'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 border-b-2 border-amber-600'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              ছুটি
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                কোনো নোটিফিকেশন নেই
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isUnread = !readIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-3 transition-colors flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer ${
                      isUnread ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="mt-0.5 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {item.timeAgo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      {item.link && (
                        <Link
                          href={item.link}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline pt-0.5"
                        >
                          বিস্তারিত দেখুন
                          <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
