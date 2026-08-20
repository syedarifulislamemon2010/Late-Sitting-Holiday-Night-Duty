import React from 'react';
import { 
  CheckCircle, 
  Eye, 
  Receipt, 
  FileSignature, 
  Trash2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { getCategoryConfig } from '@/lib/category-colors';

interface Cell {
  id: number;
  name: string;
  description: string | null;
}

import { OrderDuty } from '../types';

interface OfficeOrder {
  id: number;
  orderRef: string;
  orderDate: string;
  category: string;
  employeeName: string;
  cellName: string | null;
  status: string;
  dutiesJson?: string | null;
  duties?: OrderDuty[];
}

interface OrdersTabProps {
  loading: boolean;
  pendingBillingOfficeOrders: OfficeOrder[];
  archivedBillNormalizedRefs: Set<string>;
  getNormalizedRef: (ref: string) => string;
  archivedOrders: OfficeOrder[];
  handleLoadBillForEditing: (ref: string) => void;
  handleGenerateBillFromOrder: (order: OfficeOrder) => void;
  hasEditPermission: (order: OfficeOrder) => boolean;
  hasDeletePermission: (order: OfficeOrder) => boolean;
  handleDeleteOrder: (id: number) => Promise<void> | void;
  setViewingOrder: (order: OfficeOrder) => void;
}

export default function OrdersTab({
  loading,
  pendingBillingOfficeOrders,
  archivedBillNormalizedRefs,
  getNormalizedRef,
  archivedOrders,
  handleLoadBillForEditing,
  handleGenerateBillFromOrder,
  hasEditPermission,
  hasDeletePermission,
  handleDeleteOrder,
  setViewingOrder
}: OrdersTabProps) {

  const renderOrdersGrid = (ordersList: OfficeOrder[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ordersList.map((order) => {
          const isOrderBilled = archivedBillNormalizedRefs.has(getNormalizedRef(order.orderRef));
          
          return (
            <div 
              key={order.id}
              className="group border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 bg-white/30 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between gap-4 shadow-sm text-slate-850 dark:text-slate-100"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-500/20 font-sans">
                    <CheckCircle size={10} className="text-emerald-505" />
                    {order.status === 'Generated & Printed' || order.status === 'Printed' ? 'জেনারেটেড এন্ড প্রিন্টেড' : order.status}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isOrderBilled ? (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 px-2.5 py-0.5 rounded-full font-extrabold border border-emerald-500/20 font-sans">
                        বিল সম্পাদিত
                      </span>
                    ) : (
                      <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-450 px-2.5 py-0.5 rounded-full font-extrabold border border-rose-500/20 animate-pulse font-sans">
                        বিল সম্পাদন করুন
                      </span>
                    )}
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border font-sans ${getCategoryConfig(order.category).badgeClass}`}>
                      {getCategoryConfig(order.category).label}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1.5 text-left">
                  <h4 className="text-xs font-extrabold leading-snug font-mono break-all text-slate-800 dark:text-slate-100" title={order.orderRef}>
                    {order.orderRef}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-1 border-t border-slate-100/50 dark:border-slate-800/50 mt-2 font-sans">
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
                    onClick={() => setViewingOrder(order)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer font-sans"
                    title="অর্ডারটি ভিউ করুন"
                  >
                    <Eye size={12} />
                    <span>ভিউ</span>
                  </button>

                  {(() => {
                    const norm = getNormalizedRef(order.orderRef);
                    const existingBill = archivedOrders.find(o => o.category?.startsWith('BILL_') && getNormalizedRef(o.orderRef) === norm);
                    return existingBill ? (
                      <>
                        <button 
                          onClick={() => {
                            handleLoadBillForEditing(existingBill.orderRef);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-955/20 text-teal-650 dark:text-teal-450 rounded-lg text-[10px] font-extrabold transition-all border border-teal-100 dark:border-teal-950/30 cursor-pointer font-sans"
                          title="বিলটি সম্পাদন করুন"
                        >
                          <Receipt size={12} />
                          <span>বিল সম্পাদন</span>
                        </button>
                        <button 
                          onClick={() => setViewingOrder(existingBill)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-955/20 text-indigo-655 dark:text-indigo-455 rounded-lg text-[10px] font-extrabold transition-all border border-indigo-100 dark:border-indigo-950/30 cursor-pointer font-sans"
                          title="বিল বিবরণী দেখুন ও প্রিন্ট করুন"
                        >
                          <Eye size={12} />
                          <span>দেখুন</span>
                        </button>
                        {hasDeletePermission(existingBill) && (
                          <button 
                            onClick={() => handleDeleteOrder(existingBill.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg text-[10px] font-bold transition-all border border-red-100 dark:border-red-950/30 cursor-pointer"
                            title="বিল বিবরণী মুছে ফেলুন"
                          >
                            <Trash2 size={12} />
                            <span>মুছুন</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button 
                        onClick={() => handleGenerateBillFromOrder(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-extrabold transition-all border border-amber-100 dark:border-amber-950/30 cursor-pointer font-sans"
                        title="বিল জেনারেট করুন"
                      >
                        <Receipt size={12} />
                        <span>বিল জেনারেট করুন</span>
                      </button>
                    );
                  })()}
                  
                  {hasEditPermission(order) && (
                    <button 
                      onClick={() => window.location.href = `/roster?edit_ref=${encodeURIComponent(order.orderRef)}&from=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer font-sans"
                      title="রোস্টারে ফিরে এডিট করুন (স্মারক একই থাকবে)"
                    >
                      <FileSignature size={12} />
                      <span>সম্পাদনা (রোস্টার)</span>
                    </button>
                  )}
                </div>

                {hasDeletePermission(order) && (
                  <button 
                    onClick={() => handleDeleteOrder(order.id)}
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
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 size={36} className="text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">আর্কাইভ লোড হচ্ছে...</p>
        </div>
      ) : pendingBillingOfficeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600">
            <AlertCircle size={28} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">কোনো অপেক্ষমাণ বিল অফিস আদেশ নেই</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              নির্বাচিত ফিল্টারের অধীনে কোনো বিল অপেক্ষমাণ অফিস আদেশ পাওয়া যায়নি।
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-2 border-b border-amber-200/30 pb-2 font-sans">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              বিল অপেক্ষমাণ অফিস আদেশ - {toBanglaDigits(pendingBillingOfficeOrders.length)} টি
            </h3>
            {pendingBillingOfficeOrders.length > 0 ? (
              renderOrdersGrid(pendingBillingOfficeOrders)
            ) : (
              <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 dark:text-slate-500 italic text-xs font-sans">
                কোনো বিল অপেক্ষমাণ অফিস আদেশ নেই।
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
