'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Trash2, 
  Receipt, 
  FileSignature 
} from 'lucide-react';
import { OfficeOrder, UserSession } from '../types';

interface OrdersTabProps {
  currentUser: UserSession | null;
  officeOrders: OfficeOrder[];
  loadingOrders: boolean;
  orderSearchQuery: string;
  setOrderSearchQuery: (query: string) => void;
  showOrdersFilters: boolean;
  setShowOrdersFilters: (show: boolean) => void;
  ordersFilterCategory: string;
  setOrdersFilterCategory: (cat: string) => void;
  ordersFilterStatus: string;
  setOrdersFilterStatus: (status: string) => void;
  ordersFilterCell: string;
  setOrdersFilterCell: (cell: string) => void;
  onViewOrder: (order: OfficeOrder) => void;
  onDeleteOrder: (id: number) => void;
  hasEditPermission: (order: OfficeOrder) => boolean;
  hasDeletePermission: (order: OfficeOrder) => boolean;
}

export default function OrdersTab({
  currentUser,
  officeOrders,
  loadingOrders,
  orderSearchQuery,
  setOrderSearchQuery,
  showOrdersFilters,
  setShowOrdersFilters,
  ordersFilterCategory,
  setOrdersFilterCategory,
  ordersFilterStatus,
  setOrdersFilterStatus,
  ordersFilterCell,
  setOrdersFilterCell,
  onViewOrder,
  onDeleteOrder,
  hasEditPermission,
  hasDeletePermission,
}: OrdersTabProps) {
  const getNormalizedRef = (ref: string) => {
    if (!ref) return '';
    let clean = ref;
    if (clean.endsWith('/বিল')) {
      clean = clean.replace(/\/বিল$/, '');
    }
    const parts = clean.split('/');
    if (parts.length >= 3) {
      parts.splice(2, 1);
    }
    return parts.join('/');
  };

  const archivedBillNormalizedRefs = new Set(
    officeOrders
      .filter((o: OfficeOrder) => o.category?.startsWith('BILL_') || o.orderRef?.endsWith('/বিল'))
      .map((o: OfficeOrder) => getNormalizedRef(o.orderRef))
  );

  const uniqueCellsInOrders = Array.from(
    new Set(officeOrders.map(o => o.cellName).filter(Boolean))
  ) as string[];

  const officeOrdersList = officeOrders.filter(
    (order: OfficeOrder) => !order.category?.startsWith('BILL_') && order.status !== 'Deleted'
  );

  const filteredOfficeOrders = officeOrdersList.filter((order: OfficeOrder) => {
    const matchesSearch = 
      order.orderRef.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.employeeName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (order.cellName || '').toLowerCase().includes(orderSearchQuery.toLowerCase());

    let matchesCategory = true;
    if (ordersFilterCategory !== 'ALL') {
      matchesCategory = order.category === ordersFilterCategory;
    }

    let matchesStatus = true;
    if (ordersFilterStatus !== 'ALL') {
      const isOrderBilled = archivedBillNormalizedRefs.has(getNormalizedRef(order.orderRef));
      if (ordersFilterStatus === 'billed') {
        matchesStatus = isOrderBilled;
      } else if (ordersFilterStatus === 'pending') {
        matchesStatus = !isOrderBilled;
      }
    }

    let matchesCell = true;
    if (ordersFilterCell !== 'ALL') {
      matchesCell = order.cellName === ordersFilterCell;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesCell;
  });

  const pendingBillingOfficeOrders = filteredOfficeOrders.filter(
    (o: OfficeOrder) => !archivedBillNormalizedRefs.has(getNormalizedRef(o.orderRef))
  );

  const billedOfficeOrders = filteredOfficeOrders.filter(
    (o: OfficeOrder) => archivedBillNormalizedRefs.has(getNormalizedRef(o.orderRef))
  );

  const renderOrdersGrid = (ordersList: OfficeOrder[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ordersList.map((order) => {
          const isOrderBilled = archivedBillNormalizedRefs.has(getNormalizedRef(order.orderRef));
          
          return (
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
                  <div className="flex items-center gap-1.5">
                    {isOrderBilled ? (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-extrabold border border-emerald-500/20">
                        বিল সম্পাদিত
                      </span>
                    ) : (
                      <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-full font-extrabold border border-rose-500/20 animate-pulse">
                        বিল সম্পাদন করুন
                      </span>
                    )}
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase">
                      {order.category === 'LATE_SITTING' ? 'লেট সিটিং' : order.category === 'HOLIDAY' ? 'সরকারি ছুটি' : 'রাত্রীকালীন'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-snug font-mono break-all" title={order.orderRef}>
                    {order.orderRef}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-1 border-t border-slate-100/50 dark:border-slate-800/50 mt-2">
                    <div>
                      <span className="text-slate-400 font-medium block">আদেশের তারিখ:</span>
                      <span>{order.orderDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">কর্মকর্তা:</span>
                      <span className="truncate block" title={order.employeeName}>{order.employeeName}</span>
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
                    title="অর্ডারটি ভিউ করুন"
                  >
                    <Eye size={12} />
                    <span>ভিউ</span>
                  </button>

                  {(() => {
                    const norm = getNormalizedRef(order.orderRef);
                    const existingBill = officeOrders.find(o => o.category?.startsWith('BILL_') && getNormalizedRef(o.orderRef) === norm);
                    return existingBill ? (
                      <>
                        <button 
                          onClick={() => {
                            window.location.href = `/billing?edit_ref=${encodeURIComponent(existingBill.orderRef)}&from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-lg text-[10px] font-extrabold transition-all border border-teal-100 dark:border-teal-950/30 cursor-pointer"
                          title="বিলটি সম্পাদন করুন"
                        >
                          <Receipt size={12} />
                          <span>বিল সম্পাদন</span>
                        </button>
                        <button 
                          onClick={() => onViewOrder(existingBill)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold transition-all border border-indigo-100 dark:border-indigo-950/30 cursor-pointer"
                          title="বিল বিবরণী দেখুন ও প্রিন্ট করুন"
                        >
                          <Eye size={12} />
                          <span>দেখুন</span>
                        </button>
                        {hasDeletePermission(existingBill) && (
                          <button 
                            onClick={() => onDeleteOrder(existingBill.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg text-[10px] font-bold transition-all border border-red-100 dark:border-red-950/30 cursor-pointer"
                            title="বিল বিবরণী মুছে ফেলুন"
                          >
                            <Trash2 size={12} />
                            <span>মুছুন</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button 
                        onClick={() => {
                          window.location.href = `/billing?orderRef=${encodeURIComponent(order.orderRef)}&from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-extrabold transition-all border border-amber-100 dark:border-amber-950/30 cursor-pointer"
                        title="বিল জেনারেট করুন"
                      >
                        <Receipt size={12} />
                        <span>বিল জেনারেট করুন</span>
                      </button>
                    );
                  })()}
                  
                  {hasEditPermission(order) && (
                    <button 
                      onClick={() => {
                        window.location.href = `/roster?edit_ref=${encodeURIComponent(order.orderRef)}&from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                      title="রোস্টারে ফিরে এডিট করুন (স্মারক একই থাকবে)"
                    >
                      <FileSignature size={12} />
                      <span>সম্পাদনা (রোস্টার)</span>
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
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="min-h-[500px]">
        <div className="space-y-6">
          
          {/* Search Bar & Advanced Filters for Orders */}
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
                  onClick={() => setShowOrdersFilters(!showOrdersFilters)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    showOrdersFilters || ordersFilterCategory !== 'ALL' || ordersFilterStatus !== 'ALL' || ordersFilterCell !== 'ALL'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400 font-bold'
                      : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Filter size={14} />
                  <span>ফিল্টারসমূহ</span>
                  {(ordersFilterCategory !== 'ALL' || ordersFilterStatus !== 'ALL' || ordersFilterCell !== 'ALL') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {showOrdersFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ডিউটি টাইপ</label>
                  <select
                    value={ordersFilterCategory}
                    onChange={(e) => setOrdersFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">সকল ক্যাটাগরি (All)</option>
                    <option value="LATE_SITTING">লেট সিটিং (Late Sitting)</option>
                    <option value="HOLIDAY">সরকারি ছুটি (Holiday)</option>
                    <option value="NIGHT_SHIFT">রাত্রীকালীন (Night Shift)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">বিল স্ট্যাটাস</label>
                  <select
                    value={ordersFilterStatus}
                    onChange={(e) => setOrdersFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">সকল স্ট্যাটাস (All)</option>
                    <option value="pending">বিল সম্পাদন করুন (Pending)</option>
                    <option value="billed">বিল সম্পাদিত (Billed)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">শাখা/সেল</label>
                  <select
                    value={ordersFilterCell}
                    onChange={(e) => setOrdersFilterCell(e.target.value)}
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

          {/* Grid lists of office orders */}
          {loadingOrders ? (
            <TableSkeleton rows={6} columns={5} />
          ) : filteredOfficeOrders.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="কোনো সূত্র সংরক্ষিত নেই"
              description={orderSearchQuery ? 'অনুসন্ধানকৃত স্মারক সূত্র অনুযায়ী কোনো তথ্য পাওয়া যায়নি।' : 'ডিউটি শিডিউল পেজে প্রিন্ট প্রিভিউ বা পিডিএফ ডাউনলোড করা হলে, সূত্রটি এখানে স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।'}
            />
          ) : (
            <div className="space-y-8">
              {/* Section 1: Pending Billing */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-2 border-b border-amber-200/30 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  বিল প্রস্তুত করা হয়নি এমন অফিস আদেশ (Pending Billing) - {pendingBillingOfficeOrders.length} টি
                </h3>
                {pendingBillingOfficeOrders.length > 0 ? (
                  renderOrdersGrid(pendingBillingOfficeOrders)
                ) : (
                  <EmptyState
                    icon={AlertCircle}
                    title="কোনো অপেক্ষমাণ অফিস আদেশ নেই"
                    description="বর্তমানে কোনো বিল অপেক্ষমাণ অফিস আদেশ পাওয়া যায়নি।"
                    className="py-8"
                  />
                )}
              </div>

              {/* Section 2: Already Billed */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-2 border-b border-teal-200/30 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  ইতিমধ্যেই বিল প্রস্তুত সম্পন্ন হয়েছে (Already Billed) - {billedOfficeOrders.length} টি
                </h3>
                {billedOfficeOrders.length > 0 ? (
                  renderOrdersGrid(billedOfficeOrders)
                ) : (
                  <EmptyState
                    icon={AlertCircle}
                    title="কোনো প্রস্তুতকৃত অফিস আদেশ নেই"
                    description="বর্তমানে কোনো বিল প্রস্তুতকৃত অফিস আদেশ পাওয়া যায়নি।"
                    className="py-8"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
