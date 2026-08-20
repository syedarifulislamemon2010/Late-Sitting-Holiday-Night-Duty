'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Eye, 
  Trash2, 
  Receipt, 
  FileSignature 
} from 'lucide-react';
import { OfficeOrder, UserSession } from '../types';

interface BillsTabProps {
  currentUser: UserSession | null;
  officeOrders: OfficeOrder[];
  loadingOrders: boolean;
  orderSearchQuery: string;
  setOrderSearchQuery: (query: string) => void;
  showBillsFilters: boolean;
  setShowBillsFilters: (show: boolean) => void;
  billsFilterCategory: string;
  setBillsFilterCategory: (cat: string) => void;
  billsFilterCell: string;
  setBillsFilterCell: (cell: string) => void;
  onViewOrder: (order: OfficeOrder) => void;
  onDeleteOrder: (id: number) => void;
  hasEditPermission: (order: OfficeOrder) => boolean;
  hasDeletePermission: (order: OfficeOrder) => boolean;
}

export default function BillsTab({
  currentUser,
  officeOrders,
  loadingOrders,
  orderSearchQuery,
  setOrderSearchQuery,
  showBillsFilters,
  setShowBillsFilters,
  billsFilterCategory,
  setBillsFilterCategory,
  billsFilterCell,
  setBillsFilterCell,
  onViewOrder,
  onDeleteOrder,
  hasEditPermission,
  hasDeletePermission,
}: BillsTabProps) {
  const uniqueCellsInOrders = Array.from(
    new Set(officeOrders.map(o => o.cellName).filter(Boolean))
  ) as string[];

  const billMemosList = officeOrders.filter(
    (order: OfficeOrder) => order.category?.startsWith('BILL_') && order.status !== 'Deleted'
  );

  const filteredBillMemos = billMemosList.filter((order) => {
    const matchesSearch = 
      order.orderRef.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.employeeName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (order.cellName || '').toLowerCase().includes(orderSearchQuery.toLowerCase());

    let matchesCategory = true;
    if (billsFilterCategory !== 'ALL') {
      matchesCategory = order.category === billsFilterCategory;
    }

    let matchesCell = true;
    if (billsFilterCell !== 'ALL') {
      matchesCell = order.cellName === billsFilterCell;
    }

    return matchesSearch && matchesCategory && matchesCell;
  });

  return (
    <div className="space-y-6">
      <Card className="min-h-[500px]">
        <div className="space-y-6">
          
          {/* Search Bar & Advanced Filters for Bills */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="স্মারক সূত্র নম্বর বা কর্মকর্তার নাম দিয়ে অনুসন্ধান করুন..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBillsFilters(!showBillsFilters)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    showBillsFilters || billsFilterCategory !== 'ALL' || billsFilterCell !== 'ALL'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400 font-bold'
                      : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Filter size={14} />
                  <span>ফিল্টারসমূহ</span>
                  {(billsFilterCategory !== 'ALL' || billsFilterCell !== 'ALL') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {showBillsFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">বিল টাইপ</label>
                  <select
                    value={billsFilterCategory}
                    onChange={(e) => setBillsFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">সকল বিল টাইপ (All)</option>
                    <option value="BILL_LATE_SITTING">লেট সিটিং বিল (Late Sitting Bill)</option>
                    <option value="BILL_HOLIDAY">সরকারি ছুটি বিল (Holiday Bill)</option>
                    <option value="BILL_NIGHT_SHIFT">রাত্রীকালীন বিল (Night Shift Bill)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">শাখা/সেল</label>
                  <select
                    value={billsFilterCell}
                    onChange={(e) => setBillsFilterCell(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">সকল সেল (All)</option>
                    {uniqueCellsInOrders.map((cell) => (
                      <option key={cell} value={cell}>{cell}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Grid lists of bill memos */}
          {loadingOrders ? (
            <TableSkeleton rows={6} columns={5} />
          ) : filteredBillMemos.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="কোনো বিল স্মারক সংরক্ষিত নেই"
              description={orderSearchQuery ? 'অনুসন্ধানকৃত স্মারক সূত্র অনুযায়ী কোনো তথ্য পাওয়া যায়নি।' : 'ডিউটি বিল বিবরণী পেজে প্রিন্ট প্রিভিউ বা পিডিএফ ডাউনলোড করা হলে, বিবরণীটি এখানে স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।'}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBillMemos.map((order) => (
                <div 
                  key={order.id}
                  className="group border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 bg-white/30 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-500/20">
                        <CheckCircle size={10} className="text-emerald-500" />
                        {order.status === 'Generated & Printed' || order.status === 'Printed' ? 'জেনারেটেড এন্ড প্রিন্টেড' : order.status}
                      </span>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase">
                        {order.category === 'BILL_LATE_SITTING' ? 'লেট সিটিং বিল' : order.category === 'BILL_HOLIDAY' ? 'সরকারি ছুটি বিল' : 'রাত্রীকালীন বিল'}
                      </span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-snug font-mono break-all" title={order.orderRef}>
                        {order.orderRef}
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-1 border-t border-slate-100/50 dark:border-slate-800/50 mt-2">
                        <div>
                          <span className="text-slate-400 font-medium block">প্রতিনিধি কর্মকর্তা:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{order.employeeName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block">তারিখ:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">
                            {toBanglaDigits(new Date(order.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 font-medium block">শাখা/সেল:</span>
                          <span>{order.cellName || 'আইটি বিভাগ'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => onViewOrder(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
                        title="বিল মেমো ভিউ করুন"
                      >
                        <Eye size={12} />
                        <span>ভিউ</span>
                      </button>

                      {hasEditPermission(order) && (
                        <button 
                          onClick={() => {
                            window.location.href = `/billing?edit_ref=${encodeURIComponent(order.orderRef)}&from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                          title="বিলিং এ ফিরে এডিট করুন (স্মারক একই থাকবে)"
                        >
                          <FileSignature size={12} />
                          <span>সম্পাদনা (বিলিং)</span>
                        </button>
                      )}
                    </div>

                    {hasDeletePermission(order) && (
                      <button 
                        onClick={() => onDeleteOrder(order.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg transition-all cursor-pointer"
                        title="আর্কাইভ থেকে মুছে ফেলুন"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
