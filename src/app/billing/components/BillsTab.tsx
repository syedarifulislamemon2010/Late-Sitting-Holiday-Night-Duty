import React, { useState } from 'react';
import { 
  CheckCircle, 
  Eye, 
  FileSignature, 
  Trash2, 
  AlertCircle, 
  Loader2,
  Printer,
  Download,
  ChevronLeft
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

const getSlotName = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  const banglaMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const monthName = banglaMonths[monthNum - 1] || '';
  
  let dayStr = '';
  if (day === 1) dayStr = '১লা';
  else if (day === 2) dayStr = '২রা';
  else if (day === 3) dayStr = '৩রা';
  else if (day === 4) dayStr = '৪ঠা';
  else if (day >= 5 && day <= 18) dayStr = `${toBanglaDigits(day)}ই`;
  else dayStr = `${toBanglaDigits(day)}শে`;
  
  return `${dayStr} ${monthName}, ${toBanglaDigits(year)}`;
};

interface BillsTabProps {
  loading: boolean;
  filteredBillMemos: OfficeOrder[];
  handleLoadBillForEditing: (ref: string) => void;
  hasEditPermission: (order: OfficeOrder) => boolean;
  hasDeletePermission: (order: OfficeOrder) => boolean;
  handleDeleteOrder: (id: number) => Promise<void> | void;
  setViewingOrder: (order: OfficeOrder) => void;
  onBulkPrintPreview: (orders: OfficeOrder[]) => void;
}

export default function BillsTab({
  loading,
  filteredBillMemos,
  handleLoadBillForEditing,
  hasEditPermission,
  hasDeletePermission,
  handleDeleteOrder,
  setViewingOrder,
  onBulkPrintPreview
}: BillsTabProps) {

  const [selectedBills, setSelectedBills] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const pendingPrintBillMemos = filteredBillMemos.filter(b => b.status === 'Generated');
  const printedBillMemos = filteredBillMemos.filter(b => b.status === 'Printed' || b.status === 'Generated & Printed' || b.status === 'Modified');

  const { groupedPrintedMemos, sortedPrintedDates } = React.useMemo(() => {
    const groups: Record<string, OfficeOrder[]> = {};
    printedBillMemos.forEach(memo => {
      const dateKey = memo.orderDate;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(memo);
    });
    const sortedPrintedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return { groupedPrintedMemos: groups, sortedPrintedDates };
  }, [printedBillMemos]);

  const handleBulkExportCSV = () => {
    const selectedOrders = filteredBillMemos.filter(order => selectedBills.includes(order.id));
    const exportData = selectedOrders.map((order, idx) => {
      let dutiesList = order.duties || [];
      if (dutiesList.length === 0 && order.dutiesJson) {
        try {
          dutiesList = JSON.parse(order.dutiesJson);
        } catch (e) {
          console.error(e);
        }
      }
      const totalDays = dutiesList.reduce((sum: number, d: any) => sum + (Array.isArray(d.dates) ? d.dates.length : (d.days || 0)), 0);
      
      let transportRate = 200;
      let apyaonRate = 100;
      if (order.category === 'HOLIDAY') {
        transportRate = 250;
        apyaonRate = 250;
      } else if (order.category === 'NIGHT_SHIFT') {
        transportRate = 400;
        apyaonRate = 600;
      }
      const billTotal = totalDays * (apyaonRate + transportRate);
      const categoryLabel = order.category === 'LATE_SITTING' ? 'লেট সিটিং' : order.category === 'HOLIDAY' ? 'ছুটির দিন' : 'নাইট শিফট';

      return {
        sl: idx + 1,
        ref: order.orderRef,
        date: order.orderDate,
        category: categoryLabel,
        payee: order.employeeName,
        days: totalDays,
        total: billTotal
      };
    });

    const headers = ['ক্রমিক নং', 'স্মারক নম্বর', 'আদেশের তারিখ', 'ক্যাটাগরি', 'কর্মকর্তা (Payee)', 'ডিউটি দিন', 'সর্বমোট বিল'];
    const rows = exportData.map(item => [
      item.sl,
      item.ref,
      item.date,
      item.category,
      item.payee,
      item.days,
      item.total
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Selected_Bills_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkPrint = async () => {
    setActionLoading(true);
    try {
      for (const id of selectedBills) {
        await fetch(`/api/office-orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Printed' })
        });
      }
      setSelectedBills([]);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('কিছু বিল মেমো প্রিন্টেড চিহ্নিত করা সম্ভব হয়নি।');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkPrintPreview = () => {
    const selectedOrders = filteredBillMemos.filter(order => selectedBills.includes(order.id));
    onBulkPrintPreview(selectedOrders);
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
            
            {sortedPrintedDates.length > 0 ? (
              <div className="space-y-6">
                {/* 1. Latest Date Section (Open by default) */}
                {(() => {
                  const latestDate = sortedPrintedDates[0];
                  const latestMemos = groupedPrintedMemos[latestDate] || [];
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-lg font-mono">
                          সর্বশেষ স্লট: {getSlotName(latestDate)} ({toBanglaDigits(latestMemos.length)} টি বিল)
                        </span>
                      </div>
                      {renderBillMemosGrid(latestMemos)}
                    </div>
                  );
                })()}

                {/* 2. Older Dates Accordions */}
                {sortedPrintedDates.length > 1 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1.5 font-sans">
                      পূর্ববর্তী স্লটসমূহ (Older Slots)
                    </h4>
                    {sortedPrintedDates.slice(1).map((dateKey) => {
                      const isExpanded = !!expandedDates[dateKey];
                      const memos = groupedPrintedMemos[dateKey] || [];
                      return (
                        <div key={dateKey} className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white/30 dark:bg-slate-900/10 shadow-sm hover:border-slate-350 dark:hover:border-slate-705 transition-all">
                          {/* Accordion Header */}
                          <div 
                            className="p-3 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-4 cursor-pointer select-none"
                            onClick={() => setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }))}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-350 font-mono">
                                📂 {getSlotName(dateKey)}
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold font-sans">
                                {toBanglaDigits(memos.length)} টি বিল
                              </span>
                            </div>
                            <span className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                              {isExpanded ? (
                                <ChevronLeft size={16} className="rotate-90" />
                              ) : (
                                <ChevronLeft size={16} className="-rotate-90" />
                              )}
                            </span>
                          </div>

                          {/* Accordion Content */}
                          {isExpanded && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
                              {renderBillMemosGrid(memos)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
              onClick={handleBulkPrintPreview}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-105 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/35 rounded-xl text-xs font-bold transition-all cursor-pointer animate-pulse"
            >
              <Printer size={13} />
              বাল্ক প্রিন্ট প্রিভিউ
            </button>
            <button
              onClick={handleBulkExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-955/20 text-emerald-655 dark:text-emerald-455 border border-emerald-100 dark:border-emerald-950/35 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Download size={13} />
              বাল্ক এক্সপোর্ট
            </button>
            <button
              onClick={handleBulkPrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              মুদ্রিত চিহ্নিত করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
