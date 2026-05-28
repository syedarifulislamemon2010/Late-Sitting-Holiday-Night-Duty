'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  RefreshCw, 
  Lock, 
  ArrowLeft, 
  Shield, 
  Activity, 
  FileSpreadsheet, 
  UserCheck, 
  Clock, 
  Key, 
  Wifi, 
  Cpu, 
  Database,
  Calendar
} from 'lucide-react';

interface AuditLog {
  id: number;
  username: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  userAgent: string | null;
  details: string;
  createdAt: string;
}

interface UserProfile {
  username: string;
  name: string;
  role: string;
}

export default function AuditLogsPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  // Load session info on mount
  useEffect(() => {
    const cached = localStorage.getItem('currentUser');
    if (cached) {
      try {
        setCurrentUser(JSON.parse(cached));
      } catch (e) {
        console.error('Error parsing cached user:', e);
      }
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setCurrentUser(data.user);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        } else {
          setCurrentUser(null);
          localStorage.removeItem('currentUser');
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const fetchData = async () => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    try {
      setLoadingLogs(true);
      const [logsRes, usersRes] = await Promise.all([
        fetch('/api/audit-logs'),
        fetch('/api/users')
      ]);

      if (logsRes.ok && usersRes.ok) {
        const logsData = await logsRes.json();
        const usersData = await usersRes.json();
        setLogs(Array.isArray(logsData) ? logsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      }
    } catch (err) {
      console.error('Error fetching logs data:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch audit logs and user list if currentUser is ADMIN
  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN') {
      fetchData();
    }
  }, [currentUser]);

  // Convert numbers to Bengali digits
  const toBanglaDigits = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  // Format date and time to Bengali standard
  const formatBengaliDateTime = (dateString: string): string => {
    try {
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) return '---';

      const formattedDate = dateObj.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      let formattedTime = dateObj.toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      // Localize AM/PM strings if the system returned English ones
      formattedTime = formattedTime
        .replace(/AM/g, 'পূর্বাহ্ন')
        .replace(/PM/g, 'অপরাহ্ন')
        .replace(/am/g, 'পূর্বাহ্ন')
        .replace(/pm/g, 'অপরাহ্ন');

      return `${formattedDate}, ${formattedTime}`;
    } catch (e) {
      return '---';
    }
  };

  // Helper to map username to real name
  const getUserDisplayName = (username: string): string => {
    const user = users.find(u => u.username.trim().toLowerCase() === username.trim().toLowerCase());
    return user ? user.name : 'Unknown User';
  };

  // Filter logs by search keyword and action type
  const filteredLogs = logs.filter(log => {
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    
    const userDisplayName = getUserDisplayName(log.username).toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      log.username.toLowerCase().includes(query) ||
      userDisplayName.includes(query) ||
      (log.details && log.details.toLowerCase().includes(query)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(query)) ||
      (log.macAddress && log.macAddress.toLowerCase().includes(query)) ||
      (log.action && log.action.toLowerCase().includes(query)) ||
      (log.entityType && log.entityType.toLowerCase().includes(query));

    return matchesAction && matchesSearch;
  });

  // Calculate quick stats
  const getStats = () => {
    const totalCount = logs.length;
    
    // Helper to check if a date is today
    const isToday = (dateStr: string) => {
      const date = new Date(dateStr);
      const today = new Date();
      return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
    };

    const loginsToday = logs.filter(l => l.action === 'LOGIN' && isToday(l.createdAt)).length;
    const modificationsToday = logs.filter(l => ['UPDATE', 'DELETE'].includes(l.action) && isToday(l.createdAt)).length;
    const creationsToday = logs.filter(l => l.action === 'CREATE' && isToday(l.createdAt)).length;

    return {
      totalCount,
      loginsToday,
      modificationsToday,
      creationsToday
    };
  };

  const stats = getStats();

  // Export to high-fidelity UTF-8 BOM CSV
  const handleExportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = 'সময় ও তারিখ,ব্যবহারকারী,ব্যাংক আইডি,কাজের ধরণ,কাজের বিবরণ,আইপি এড্রেস,ম্যাক এড্রেস';
    const rows = filteredLogs.map(log => {
      const dateStr = formatBengaliDateTime(log.createdAt);
      const user = getUserDisplayName(log.username);
      const cleanDetails = log.details.replace(/"/g, '""');
      return `"${dateStr}","${user}","${log.username}","${log.action}","${cleanDetails}","${log.ipAddress || ''}","${log.macAddress || ''}"`;
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `audit_logs_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Badge styles based on Action type
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'LOGIN': 
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-150/40 dark:border-blue-900/30';
      case 'CREATE': 
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-150/40 dark:border-emerald-900/30';
      case 'UPDATE': 
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-455 border border-amber-150/40 dark:border-amber-900/30';
      case 'DELETE': 
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-455 border border-rose-150/40 dark:border-rose-900/30';
      case 'CHANGE_PASSWORD': 
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-150/40 dark:border-purple-900/30';
      default: 
        return 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-200/50';
    }
  };

  // Action name translation to Bengali
  const getActionNameInBengali = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'লগইন সেশন';
      case 'CREATE': return 'নতুন সংযোজন';
      case 'UPDATE': return 'তথ্য সংশোধন';
      case 'DELETE': return 'রেকর্ড মুছে ফেলা';
      case 'CHANGE_PASSWORD': return 'পাসওয়ার্ড পরিবর্তন';
      default: return action;
    }
  };

  // Wait for auth details to load to prevent layouts shifting or flickering
  if (authLoading && !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 font-sans">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500">নিরাপত্তা স্তর যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  // 1. ACCESS DENIED SCREEN (For standard USER roles)
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[75vh] px-4 font-sans">
        <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-red-200/50 dark:border-red-950/30 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(239,68,68,0.06)] animate-fade-in">
          {/* Top warning styling line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />
          
          <div className="mb-6 inline-flex p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-900/30 animate-pulse">
            <ShieldAlert size={48} />
          </div>

          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-wide mb-3">
            প্রবেশাধিকার সংরক্ষিত
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-medium">
            দুঃখিত, এই পেজটি শুধুমাত্র সিস্টেম অ্যাডমিনদের জন্য সংরক্ষিত। সাধারণ ব্যবহারকারীদের এই তথ্যে প্রবেশ করার অনুমতি নেই।
          </p>

          <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-900 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-650 dark:text-slate-400">
              <Lock size={14} className="text-rose-500" />
              <span>নিরাপত্তা নোটিশ:</span>
            </div>
            <p className="text-[11px] text-slate-450 dark:text-slate-500 leading-relaxed font-semibold">
              আপনার ইউজারনেম (<span className="text-slate-700 dark:text-slate-350 font-bold">@{currentUser?.username || 'অজ্ঞাত'}</span>) এবং বর্তমান আইপি এড্রেস সুরক্ষামূলক সুরক্ষার অংশ হিসেবে লগ ফাইলে রেকর্ড করা হয়েছে।
            </p>
          </div>

          <Link href="/" className="inline-flex items-center justify-center gap-2 px-5 py-3 w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white text-xs font-bold rounded-2xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
            <ArrowLeft size={14} />
            ড্যাশবোর্ডে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  // 2. ADMIN AUDIT LOGS DASHBOARD
  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-wide flex items-center gap-3">
            <Shield className="text-indigo-600" size={28} />
            অডিট লগ (Audit Logs)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            সিস্টেমের সমস্ত ইউজার অ্যাক্টিভিটি, ডাটা সংযোজন, পরিবর্তন, ডিলিট এবং পাসওয়ার্ড পরিবর্তনের রিয়েল-টাইম লগ ট্র্যাকিং।
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loadingLogs}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="লগ রিলোড করুন"
          >
            <RefreshCw size={14} className={loadingLogs ? 'animate-spin' : ''} />
            রিলোড
          </button>
          
          <button
            onClick={handleExportToCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
            title="CSV ফাইলে এক্সপোর্ট করুন"
          >
            <FileSpreadsheet size={14} />
            এক্সপোর্ট করুন
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/20">
            <Database size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">সর্বমোট রেকর্ড</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-1 font-sans">
              {toBanglaDigits(stats.totalCount)} <span className="text-[10px] font-bold text-slate-400">টি</span>
            </p>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-650 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/20">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">আজকের লগইন সেশন</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-1 font-sans">
              {toBanglaDigits(stats.loginsToday)} <span className="text-[10px] font-bold text-slate-400">টি</span>
            </p>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-650 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/20">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">আজকের সংশোধন</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-1 font-sans">
              {toBanglaDigits(stats.modificationsToday)} <span className="text-[10px] font-bold text-slate-400">টি</span>
            </p>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/20">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">আজকের নতুন সংযোজন</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-1 font-sans">
              {toBanglaDigits(stats.creationsToday)} <span className="text-[10px] font-bold text-slate-400">টি</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search Control Panel */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Action filters dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-550 flex items-center gap-1.5 shrink-0">
              <Filter size={14} className="text-slate-400" />
              কাজের ধরণ ফিল্টার:
            </span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer min-w-44 text-slate-700 dark:text-slate-350"
            >
              <option value="ALL">সব কার্যক্রম (All Actions)</option>
              <option value="LOGIN">লগইন সেশন (LOGIN)</option>
              <option value="CREATE">নতুন সংযোজন (CREATE)</option>
              <option value="UPDATE">তথ্য সংশোধন (UPDATE)</option>
              <option value="DELETE">রেকর্ড মুছে ফেলা (DELETE)</option>
              <option value="CHANGE_PASSWORD">পাসওয়ার্ড পরিবর্তন (CHANGE_PASSWORD)</option>
            </select>
          </div>

          {/* Keyword Search input */}
          <div className="relative w-full lg:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ইউজারনেম, কাজের বিবরণ, আইপি বা ম্যাক..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium font-sans placeholder-slate-400"
            />
          </div>
        </div>

        {/* Loading and log counts display */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500">
            <Clock size={13} className="text-slate-400" />
            <span>ফিল্টার অনুযায়ী পাওয়া গেছে: {toBanglaDigits(filteredLogs.length)} টি লগ রেকর্ড</span>
          </div>

          {loadingLogs && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-650 dark:text-indigo-400">
              <RefreshCw size={12} className="animate-spin" />
              <span>রিয়েল-টাইম ডাটা লোড হচ্ছে...</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Table view */}
      {loadingLogs && logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 glass-card rounded-2xl">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">অডিট লগ তালিকা লোড হচ্ছে...</p>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
          <div className="overflow-x-auto max-h-[60vh] no-scrollbar">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-150 dark:border-slate-850">
                  <th className="px-5 py-4 w-44">সময় ও তারিখ</th>
                  <th className="px-5 py-4 w-52">ব্যবহারকারী</th>
                  <th className="px-5 py-4 w-36">কার্যক্রম</th>
                  <th className="px-5 py-4 min-w-80">কাজের বিবরণ</th>
                  <th className="px-5 py-4 w-32">আইপি এড্রেস</th>
                  <th className="px-5 py-4 w-44">ম্যাক এড্রেস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-sans">
                {filteredLogs.map((log) => {
                  const displayName = getUserDisplayName(log.username);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition-colors">
                      {/* Time Column */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-semibold text-xs leading-normal">
                        {formatBengaliDateTime(log.createdAt)}
                      </td>
                      
                      {/* User profile Column */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold flex items-center justify-center text-[11px] uppercase shrink-0">
                            {displayName.trim().charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-slate-800 dark:text-slate-200 font-bold truncate leading-tight">{displayName}</span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">@{log.username}</span>
                          </div>
                        </div>
                      </td>

                      {/* Action Badges Column */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getActionBadgeColor(log.action)}`}>
                          {getActionNameInBengali(log.action)}
                        </span>
                      </td>

                      {/* Details description Column */}
                      <td className="px-5 py-4 text-slate-650 dark:text-slate-350 max-w-md font-semibold text-xs leading-relaxed">
                        {log.details}
                      </td>

                      {/* IP Address Column */}
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-slate-500 dark:text-slate-400 font-bold text-xs">
                        <div className="flex items-center gap-1.5">
                          <Wifi size={12} className="text-slate-400 shrink-0" />
                          <span>{log.ipAddress || '---'}</span>
                        </div>
                      </td>

                      {/* MAC Address Column */}
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-slate-500 dark:text-slate-400 font-bold text-xs">
                        <div className="flex items-center gap-1.5">
                          <Cpu size={12} className="text-slate-400 shrink-0" />
                          <span className="uppercase">{log.macAddress || '---'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50/30 dark:bg-slate-950/10 border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl space-y-3">
          <Database className="mx-auto text-slate-300 dark:text-slate-700" size={40} />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">ফিল্টার অনুযায়ী কোনো অডিট লগ রেকর্ড খুঁজে পাওয়া যায়নি।</p>
        </div>
      )}
    </div>
  );
}
