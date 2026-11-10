'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/SkeletonLoader';
import { Shield, Search, FileText } from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { AuditLog } from '../types';

interface UserAuditLogViewProps {
  logs: AuditLog[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function UserAuditLogView({
  logs,
  loading,
  searchQuery,
  setSearchQuery
}: UserAuditLogViewProps) {
  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    const user = log.username || log.bankId || '';
    const act = log.action || log.actionType || '';
    const det = log.details || '';
    const ip = log.ipAddress || '';
    return (
      user.toLowerCase().includes(q) ||
      act.toLowerCase().includes(q) ||
      det.toLowerCase().includes(q) ||
      ip.toLowerCase().includes(q)
    );
  });

  const formatLogDate = (log: AuditLog) => {
    const dateVal = log.createdAt || log.timestamp;
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      return toBanglaDigits(d.toLocaleString('bn-BD', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    } catch {
      return '-';
    }
  };

  const getActionBadgeColor = (action?: string) => {
    const act = (action || '').toUpperCase();
    switch (act) {
      case 'CREATE':
      case 'RESTORE':
      case 'RESTORE_BILL':
      case 'RESTORE_OFFICE_ORDER':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      case 'UPDATE':
      case 'EDIT':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'DELETE':
      case 'REMOVE':
      case 'PURGE':
      case 'LOGIN_FAILED':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
      case 'LOGIN':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Shield size={18} className="text-indigo-600" />
            <span>সিস্টেম অডিট ও অ্যাক্টিভিটি লগ (Security Audit)</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">ব্যবহারকারীদের লগইন ও ডাটাবেজ পরিবর্তনের নিরাপত্তা বিবরণী</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ইউজারনেম বা অ্যাকশন দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} columns={4} />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="কোনো লগ রেকর্ড পাওয়া যায়নি"
          description="সাম্প্রতিক সময়ে কোনো নিরাপত্তা অডিট রেকর্ড পাওয়া যায়নি।"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-bold">
                <th className="py-2.5 px-3">সময়</th>
                <th className="py-2.5 px-3">ব্যবহারকারী</th>
                <th className="py-2.5 px-3">কার্যক্রম (Action)</th>
                <th className="py-2.5 px-3">বিস্তারিত</th>
                <th className="py-2.5 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log, idx) => {
                const actionLabel = log.action || log.actionType || 'ACTIVITY';
                const userLabel = log.username || log.bankId || 'Unknown';
                return (
                  <tr key={log.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {formatLogDate(log)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {userLabel}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getActionBadgeColor(actionLabel)}`}>
                        {actionLabel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-md truncate" title={log.details}>
                      {log.details || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
