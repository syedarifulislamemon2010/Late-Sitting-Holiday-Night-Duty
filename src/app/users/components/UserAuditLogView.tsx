'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/SkeletonLoader';
import { Shield, Search, FileText, Clock } from 'lucide-react';
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
    return (
      (log.username || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q) ||
      (log.ipAddress || '').toLowerCase().includes(q)
    );
  });

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
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('bn-BD')}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {log.username}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {log.details}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {log.ipAddress || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
