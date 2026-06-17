import React, { useState } from 'react';
import { 
  CheckCircle, 
  Eye, 
  FileSignature, 
  Trash2, 
  AlertCircle, 
  Loader2,
  Printer
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface OfficeOrder {
  id: number;
  orderRef: string;
  orderDate: string;
  category: string;
  employeeName: string;
  cellName: string | null;
  status: string;
  dutiesJson?: string | null;
  duties?: any[];
}

interface BillsTabProps {
  loading: boolean;
  filteredBillMemos: OfficeOrder[];
  handleLoadBillForEditing: (ref: string) => void;
  hasEditPermission: (order: OfficeOrder) => boolean;
  hasDeletePermission: (order: OfficeOrder) => boolean;
  handleDeleteOrder: (id: number) => Promise<void> | void;
  setViewingOrder: (order: OfficeOrder) => void;
}

export default function BillsTab({
  loading,
  filteredBillMemos,
  handleLoadBillForEditing,
  hasEditPermission,
  hasDeletePermission,
  handleDeleteOrder,
  setViewingOrder
}: BillsTabProps) {

  const [selectedBills, setSelectedBills] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const handleBulkDelete = async () => {
    if (!confirm(`আপনি কি নির্বাচিত ${selectedBills.length} টি বিল মেমো মুছে ফেলতে চান?`)) return;
    setActionLoading(true);
    try {
      for (const id of selectedBills) {
        await fetch(`/api/office-orders/${id}`, { method: 'DELETE' });
      }
      setSelectedBills([]);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('কিছু বিল মেমো মুছে ফেলা সম্ভব হয়নি।');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkPrint = async () => {
    if (!confirm(`আপনি কি নির্বাচিত ${selectedBills.length} টি বিল মেমোকে "মুদ্রিত" (Printed) হিসেবে চিহ্নিত করতে চান?`)) return;
    setActionLoading(true);
    try {
      for (const id of selectedBills) {
        await fetch(`/api/office-orders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Printed' })
        });
      }
      setSelectedBills([]);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('কিছু বিল মেমোর স্ট্যাটাস আপডেট করা সম্ভব হয়নি।');
    } finally {
      setActionLoading(false);
    }
  };

  const renderBillMemosGrid = (memosList: OfficeOrder[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memosList.map((order) => (
          <div 
            key={order.id}
            className="group border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 bg-white/30 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between gap-4 shadow-sm text-slate-850 dark:text-slate-100"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    checked={selectedBills.includes(order.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setSelectedBills(prev => [...prev, order.id]);
                      } else {
                        setSelectedBills(prev => prev.filter(id => id !== order.id));
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-350 dark:border-slate-750 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0 select-none"
                  />
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-500/20 font-sans">
                    <CheckCircle size={10} className="text-emerald-555" />
                    {order.status === 'Generated & Printed' || order.status === 'Printed' ? 'জেনারেটেড এন্ড প্রিন্টেড' : order.status}
                  </span>
                </div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase font-sans">
                  {order.category === 'BILL_LATE_SITTING' ? 'লেট সিটিং বিল' : order.category === 'BILL_HOLIDAY' ? 'সরকারি ছুটি বিল' : 'রাত্রীকালীন বিল'}
                </span>
              </div>
              
              <div className="space-y-1.5 text-left">
                <h4 className="text-xs font-extrabold leading-snug font-mono break-all text-slate-800 dark:text-slate-100" title={order.orderRef}>
                  {order.orderRef}
                </h4>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-1 border-t border-slate-100/50 dark:border-slate-800/50 mt-2 font-sans">
                  <div>
                    <span className="text-slate-400 font-medium block">প্রতিনিধি কর্মকর্তা:</span>
                    <span className="text-slate-700 dark:text-slate-350 font-bold">{order.employeeName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">তারিখ:</span>
                    <span className="text-slate-700 dark:text-slate-350 font-bold">
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
                  onClick={() => setViewingOrder(order)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer font-sans"
                  title="বিল মেমো ভিউ করুন"
                >
                  <Eye size={12} />
                  <span>ভিউ</span>
                </button>

                {hasEditPermission(order) && (
                  <button 
                    onClick={() => handleLoadBillForEditing(order.orderRef)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer font-sans"
                    title="বিলিং এ ফিরে এডিট করুন (স্মারক একই থাকবে)"
                  >
                    <FileSignature size={12} />
                    <span>সম্পাদনা (বিলিং)</span>
                  </button>
                )}
              </div>

              {hasDeletePermission(order) && (
                <button 
                  onClick={() => handleDeleteOrder(order.id)}
                  className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-955/30 text-red-500 dark:text-red-400 rounded-lg transition-all cursor-pointer"
                  title="আর্কাইভ থেকে মুছে ফেলুন"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const pendingPrintBillMemos = filteredBillMemos.filter(b => b.status === 'Generated');
  const printedBillMemos = filteredBillMemos.filter(b => b.status === 'Printed' || b.status === 'Generated & Printed' || b.status === 'Modified');

  return (
    <div className="space-y-6">
      {loading || actionLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 size={36} className="text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">লোড হচ্ছে...</p>
        </div>
      ) : filteredBillMemos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600">
            <AlertCircle size={28} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">কোন বিল মেমো সংরক্ষিত নেই</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              নির্বাচিত ফিল্টারের অধীনে কোনো বিল মেমো পাওয়া যায়নি।
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Generated but not printed */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-2 border-b border-amber-200/30 pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              জেনারেটেড কিন্তু প্রিন্ট করা হয়নি ({toBanglaDigits(pendingPrintBillMemos.length)} টি)
            </h3>
            {pendingPrintBillMemos.length > 0 ? (
              renderBillMemosGrid(pendingPrintBillMemos)
            ) : (
              <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 dark:text-slate-500 italic text-xs">
                কোনো প্রিন্ট অপেক্ষমাণ বিল মেমো নেই।
              </div>
            )}
          </div>

          {/* Section 2: Printed/Generated & Printed/Modified */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-2 border-b border-teal-200/30 pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              জেনারেটেড এবং প্রিন্টেড বিল সেকশন ({toBanglaDigits(printedBillMemos.length)} টি)
            </h3>
            {printedBillMemos.length > 0 ? (
              renderBillMemosGrid(printedBillMemos)
            ) : (
              <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 dark:text-slate-500 italic text-xs">
                কোনো প্রিন্টেড বিল মেমো নেই।
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Toolbar for bulk actions */}
      {selectedBills.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-350 select-none">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            <span className="font-sans text-indigo-650 dark:text-indigo-400 text-sm font-extrabold">{toBanglaDigits(selectedBills.length)}</span> টি বিল নির্বাচিত
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedBills([])}
              className="px-3.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              বাতিল
            </button>
            <button
              onClick={handleBulkPrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-105 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/35 rounded-xl text-xs font-bold transition-all cursor-pointer animate-pulse"
            >
              <Printer size={13} />
              বাল্ক প্রিন্ট/অনুমোদন
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 text-rose-655 dark:text-rose-455 border border-rose-100 dark:border-rose-950/35 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 size={13} />
              মুছে ফেলুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
