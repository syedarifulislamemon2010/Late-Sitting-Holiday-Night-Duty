'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { 
  ClipboardList, 
  Search, 
  RefreshCw, 
  User, 
  ShieldAlert, 
  ArrowRight,
  SlidersHorizontal,
  Clock,
  Database
} from 'lucide-react';

interface AuditLog {
  timestamp: string;
  userId: string | number;
  bankId: string;
  cell: string;
  recordId: string | number;
  actionType: string;
  ipAddress: string;
  userAgent: string;
  details: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedCell, setSelectedCell] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchLogsOnMount = async () => {
      try {
        const res = await fetch('/api/audit');
        if (res.ok && active) {
          const data = await res.json();
          setLogs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchLogsOnMount();
    return () => {
      active = false;
    };
  }, []);

  const handleReload = () => {
    setLoading(true);
    fetchLogs();
  };

  const toBanglaDigits = (numStr: string | number): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return numStr.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
      case 'RESTORE':
      case 'RESTORE_BILL':
      case 'RESTORE_OFFICE_ORDER':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
      case 'UPDATE':
      case 'EDIT':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
      case 'DELETE':
      case 'REMOVE':
      case 'PURGE':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
      case 'LOGIN':
        return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30';
      default:
        return 'bg-slate-50 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400 border border-slate-100 dark:border-slate-800';
    }
  };

  const uniqueActions = Array.from(new Set(logs.map(l => l.actionType).filter(Boolean)));
  const uniqueCells = Array.from(new Set(logs.map(l => l.cell).filter(Boolean)));

  const filteredLogs = logs.filter(log => {
    const logDate = log.timestamp ? log.timestamp.split('T')[0] : '';
    
    const matchesSearch = 
      (log.bankId && log.bankId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.userId && log.userId.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.recordId && log.recordId.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = selectedAction === 'ALL' || log.actionType === selectedAction;
    const matchesCell = selectedCell === 'ALL' || log.cell === selectedCell;
    const matchesStart = !startDate || logDate >= startDate;
    const matchesEnd = !endDate || logDate <= endDate;

    return matchesSearch && matchesAction && matchesCell && matchesStart && matchesEnd;
  });

  const totalCount = filteredLogs.length;
  const uniqueUsers = Array.from(new Set(filteredLogs.map(l => l.bankId))).length;
  const criticalActions = filteredLogs.filter(l => ['DELETE', 'PURGE', 'REMOVE'].includes(l.actionType?.toUpperCase())).length;

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">সিস্টেম অডিট লগ</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">জনতা ব্যাংক পোর্টালের সমস্ত কার্যক্রমের বিস্তারিত সময়ানুক্রমিক রেকর্ড ও অডিট ট্রেইল।</p>
          </div>
          
          <button
            onClick={handleReload}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            রিলোড করুন
          </button>
        </div>

        {/* KPI Cards Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">মোট কার্যক্রম ট্র‍্যাকড</p>
              <h2 className="app-kpi-value text-slate-800 font-sans">{toBanglaDigits(totalCount)}টি</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <ClipboardList size={22} />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">সক্রিয় ইউজার সংখ্যা</p>
              <h2 className="app-kpi-value text-slate-800 font-sans">{toBanglaDigits(uniqueUsers)} জন</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
              <User size={22} />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">সংবেদনশীল অপারেশন</p>
              <h2 className="app-kpi-value text-slate-800 font-sans">{toBanglaDigits(criticalActions)}টি</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <ShieldAlert size={22} />
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 mb-2">
            <SlidersHorizontal size={16} />
            <span>ফিল্টার ও অনুসন্ধান অপশন</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="space-y-1.5">
              <label htmlFor="audit-search" className="text-[10px] font-bold text-slate-400 uppercase">ইউজার, রেকর্ড বা বিবরণ</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search size={15} />
                </span>
                <input
                  id="audit-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ইউজার বা রেকর্ড আইডি..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-sans h-9"
                />
              </div>
            </div>

            {/* Action Select */}
            <div className="space-y-1.5">
              <label htmlFor="audit-action" className="text-[10px] font-bold text-slate-400 uppercase">কার্যক্রমের ধরণ</label>
              <select
                id="audit-action"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-sans h-9 font-semibold text-slate-700"
              >
                <option value="ALL">সব কার্যক্রম</option>
                {uniqueActions.map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>

            {/* Cell Select */}
            <div className="space-y-1.5">
              <label htmlFor="audit-cell" className="text-[10px] font-bold text-slate-400 uppercase">সংশ্লিষ্ট সেল (Cell)</label>
              <select
                id="audit-cell"
                value={selectedCell}
                onChange={(e) => setSelectedCell(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-sans h-9 font-semibold text-slate-700"
              >
                <option value="ALL">সব সেল</option>
                {uniqueCells.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Date Range Picker */}
            <div className="space-y-1.5">
              <label htmlFor="audit-date-range" className="text-[10px] font-bold text-slate-400 uppercase">তারিখের পরিসীমা</label>
              <div className="flex items-center gap-1.5 h-9">
                <input
                  id="audit-date-range"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] focus:outline-none focus:border-indigo-500 font-sans h-9 font-semibold text-slate-700"
                />
                <ArrowRight size={14} className="text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] focus:outline-none focus:border-indigo-500 font-sans h-9 font-semibold text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">অডিট লগ লোড হচ্ছে...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 bg-slate-50/30 border border-dashed border-slate-200 rounded-xl space-y-3">
              <Database className="mx-auto text-slate-300" size={40} />
              <p className="text-sm font-bold text-slate-500">কোনো অডিট রেকর্ড পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-5 py-3.5">সময় (Timestamp)</th>
                    <th className="px-5 py-3.5">ইউজার (Bank ID)</th>
                    <th className="px-5 py-3.5">সংশ্লিষ্ট সেল</th>
                    <th className="px-5 py-3.5">অ্যাকশন</th>
                    <th className="px-5 py-3.5">রেকর্ড আইডি</th>
                    <th className="px-5 py-3.5">কার্যক্রমের বিবরণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log, idx) => {
                    const localTimeStr = new Date(log.timestamp).toLocaleString('bn-BD', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    });

                    return (
                      <tr 
                        key={idx} 
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
                          {toBanglaDigits(localTimeStr)}
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-slate-800">
                          {log.bankId}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                          {log.cell || 'N/A'}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getActionBadgeColor(log.actionType)}`}>
                            {log.actionType}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-500 font-sans">
                          {log.recordId}
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-600 max-w-sm truncate">
                          {log.details}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Audit Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh] animate-in scale-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600">
                <ClipboardList size={18} />
                <h3 className="font-extrabold text-slate-800 text-sm">বিস্তারিত অ্যাক্টিভিটি লগ</h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-extrabold p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto font-sans text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">অ্যাকশন টাইপ</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getActionBadgeColor(selectedLog.actionType)}`}>
                    {selectedLog.actionType}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">সংশ্লিষ্ট সেল</span>
                  <span className="font-semibold text-slate-800 block">{selectedLog.cell || 'N/A'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">ইউজার ব্যাংক আইডি</span>
                  <span className="font-semibold text-slate-800 block">{selectedLog.bankId}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">রেকর্ড আইডি (Record ID)</span>
                  <span className="font-semibold text-slate-800 block">{selectedLog.recordId}</span>
                </div>
                <div className="space-y-1 col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">সময় (Timestamp)</span>
                  <span className="font-semibold text-slate-800 block flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" />
                    {new Date(selectedLog.timestamp).toLocaleString('bn-BD', { hour12: true })}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">আইপি অ্যাড্রেস</span>
                  <span className="font-semibold text-slate-800 block font-sans">{selectedLog.ipAddress}</span>
                </div>
                <div className="space-y-1 col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">ইউজার এজেন্ট (User Agent)</span>
                  <span className="font-semibold text-slate-600 block font-sans text-[10px] leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 overflow-x-auto whitespace-pre-wrap">{selectedLog.userAgent}</span>
                </div>
                <div className="space-y-1 col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">কার্যক্রমের বিবরণ</span>
                  <p className="font-semibold text-slate-800 leading-relaxed text-[11px] bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/50">
                    {selectedLog.details}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
