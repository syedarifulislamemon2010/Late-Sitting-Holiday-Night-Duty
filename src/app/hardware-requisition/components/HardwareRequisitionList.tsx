'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search, Eye, Edit2, Trash2, HardDrive, Printer } from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { HardwareRequisition, HardwareItem } from '../types';

interface HardwareRequisitionListProps {
  requisitions: HardwareRequisition[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onPreview: (req: HardwareRequisition) => void;
  onEdit: (req: HardwareRequisition) => void;
  onDelete: (id: number) => void;
}

export default function HardwareRequisitionList({
  requisitions,
  searchQuery,
  setSearchQuery,
  onPreview,
  onEdit,
  onDelete
}: HardwareRequisitionListProps) {
  const filteredReqs = requisitions.filter(req => {
    const q = searchQuery.toLowerCase();
    return (
      (req.reqNumber || '').toLowerCase().includes(q) ||
      (req.applicantName || '').toLowerCase().includes(q) ||
      (req.applicantCell || '').toLowerCase().includes(q) ||
      (req.reason || '').toLowerCase().includes(q)
    );
  });

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <HardDrive size={18} className="text-indigo-600" />
            <span>📋 সংরক্ষিত হার্ডওয়্যার রিকুইজিশনের তালিকা</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">পূর্বের সংরক্ষিত রিকুইজিশনসমূহ দেখুন, প্রিন্ট করুন অথবা এডিট করুন।</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="রিকুইজিশন নং বা কর্মকর্তার নাম..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
          />
        </div>
      </div>

      {filteredReqs.length === 0 ? (
        <EmptyState
          icon={HardDrive}
          title="কোনো রিকুইজিশন পাওয়া যায়নি"
          description="নতুন হার্ডওয়্যার রিকুইজিশন তৈরি করুন অথবা সার্চ ফিল্টার পরিবর্তন করুন।"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-bold">
                <th className="py-3 px-3">তারিখ</th>
                <th className="py-3 px-3">রিকুইজিশন নং</th>
                <th className="py-3 px-3">আবেদনকারী ও শাখা</th>
                <th className="py-3 px-3">সরঞ্জামের বিবরণ</th>
                <th className="py-3 px-3">কারণ / যৌক্তিকতা</th>
                <th className="py-3 px-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReqs.map(req => {
                let itemsList: HardwareItem[] = [];
                try {
                  if (req.itemsJson) {
                    const parsed = JSON.parse(req.itemsJson);
                    if (Array.isArray(parsed)) itemsList = parsed;
                  }
                } catch (e) {}

                return (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {req.requisitionDate}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {req.reqNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{req.applicantName}</div>
                      <div className="text-[11px] text-slate-500">{req.applicantDesignation} ({req.applicantCell})</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-0.5 max-w-xs">
                        {itemsList.map((it, i) => (
                          <div key={i} className="text-xs text-slate-700 dark:text-slate-300">
                            • {it.itemType} ({it.itemDescription || 'Standard'}) - {toBanglaDigits(it.quantity)} {it.unit}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {req.reason}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPreview(req)}
                          className="p-1.5 h-auto text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          title="প্রিভিউ ও প্রিন্ট"
                        >
                          <Printer size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(req)}
                          className="p-1.5 h-auto text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          title="এডিট"
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDelete(req.id)}
                          className="p-1.5 h-auto text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
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
