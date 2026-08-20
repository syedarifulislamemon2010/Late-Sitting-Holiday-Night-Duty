'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search, Eye, Edit2, Trash2, FileText, Printer } from 'lucide-react';
import { TazForm } from '../types';

interface TazFormsListProps {
  forms: TazForm[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onPreview: (form: TazForm) => void;
  onEdit: (form: TazForm) => void;
  onDelete: (id: number) => void;
}

export default function TazFormsList({
  forms,
  searchQuery,
  setSearchQuery,
  onPreview,
  onEdit,
  onDelete
}: TazFormsListProps) {
  const filteredForms = forms.filter(f => {
    const q = searchQuery.toLowerCase();
    return (
      (f.title || '').toLowerCase().includes(q) ||
      (f.pacsId || '').toLowerCase().includes(q) ||
      (f.ref || '').toLowerCase().includes(q) ||
      (f.requesterName || '').toLowerCase().includes(q)
    );
  });

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            📋 সংরক্ষিত তায কমিটি ফর্মের তালিকা
          </h3>
          <p className="text-xs text-slate-500">পূর্বের সংরক্ষিত ফর্মসমূহ দেখুন, প্রিন্ট করুন অথবা এডিট করুন।</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="PACS ID বা শিরোনাম দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
          />
        </div>
      </div>

      {filteredForms.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="কোনো ফর্ম পাওয়া যায়নি"
          description="নতুন ফর্ম তৈরি করে সংরক্ষণ করুন অথবা ফিল্টার পরিবর্তন করুন।"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-bold">
                <th className="py-3 px-3">তারিখ</th>
                <th className="py-3 px-3">PACS ID</th>
                <th className="py-3 px-3">শিরোনাম ও উদ্দেশ্য</th>
                <th className="py-3 px-3">আবেদনকারী</th>
                <th className="py-3 px-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredForms.map(form => (
                <tr key={form.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {form.formDate}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {form.pacsId}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800 dark:text-slate-100">{form.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{form.purpose}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-medium text-slate-700 dark:text-slate-200">{form.requesterName}</div>
                    <div className="text-[10px] text-slate-400">{form.requesterDesignation}</div>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPreview(form)}
                        className="p-1.5 h-auto text-xs text-indigo-600 hover:bg-indigo-50"
                        title="প্রিভিউ ও প্রিন্ট"
                      >
                        <Printer size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(form)}
                        className="p-1.5 h-auto text-xs text-amber-600 hover:bg-amber-50"
                        title="এডিট"
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(form.id)}
                        className="p-1.5 h-auto text-xs text-rose-600 hover:bg-rose-50"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
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
