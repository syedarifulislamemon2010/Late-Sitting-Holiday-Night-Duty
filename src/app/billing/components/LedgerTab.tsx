import React from 'react';
import { 
  Clock, 
  Award, 
  ShieldCheck, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Receipt,
  FileSpreadsheet,
  Printer,
  Eye,
  Trash2
} from 'lucide-react';
import { toBanglaDigits, getBanglaDate } from '@/lib/bengali-converter';

interface MetricState {
  totalLateSittingBill: number;
  totalLateAllowance1: number;
  totalLateAllowance2: number;
  totalHolidayBill: number;
  totalHolidayAllowance1: number;
  totalHolidayAllowance2: number;
  totalNightBill: number;
  totalNightAllowance1: number;
  totalNightAllowance2: number;
  grandTotal: number;
}

interface Cell {
  id: number;
  name: string;
  description: string | null;
}

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

interface LedgerTabProps {
  loading: boolean;
  showOrderWarning: boolean;
  metrics: MetricState;
  allActiveOfficeOrders: OfficeOrder[];
  findAssociatedBill: (order: OfficeOrder) => any;
  handleLoadBillForEditing: (ref: string) => void;
  handleGenerateBillFromOrder: (order: OfficeOrder) => void;
  ledgerGrandTotal: number;
  selectedMonth: string;
  setIsLedgerPrintMode: (val: boolean) => void;
  setViewingOrder: (order: OfficeOrder) => void;
  handleDeleteOrder: (id: number) => Promise<void> | void;
  hasDeletePermission: (order: OfficeOrder) => boolean;
}

export default function LedgerTab({
  loading,
  showOrderWarning,
  metrics,
  allActiveOfficeOrders,
  findAssociatedBill,
  handleLoadBillForEditing,
  handleGenerateBillFromOrder,
  ledgerGrandTotal,
  selectedMonth,
  setIsLedgerPrintMode,
  setViewingOrder,
  handleDeleteOrder,
  hasDeletePermission
}: LedgerTabProps) {

  const handleExportToCSV = () => {
    const exportData = allActiveOfficeOrders.map((order, idx) => {
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
    link.setAttribute('download', `Billing_Ledger_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {showOrderWarning && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 font-sans font-medium text-sm animate-fade-in mb-6 animate-fade-in">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <p>নির্বাচিত মাস ও সেলের জন্য কোনো &quot;জেনারেটেড এন্ড প্রিন্টেড&quot; অফিস আদেশ পাওয়া যায়নি। আগে অফিস আদেশ জেনারেট করুন, তারপর বিল প্রস্তুত করতে পারবেন।</p>
        </div>
      )}

      {loading ? (
        /* KPI Loading state */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
        </div>
      ) : (
        /* Detailed Allowance Cost KPI Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Metric 1: Late Sitting Allowance splits */}
          <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="app-metadata-text font-medium text-slate-500 uppercase tracking-wider text-[10px]">লেট সিটিং বিল (Snacks + Travel)</p>
                <h3 className="app-kpi-value text-slate-800 dark:text-slate-100 font-sans text-xl font-bold">৳{toBanglaDigits(metrics.totalLateSittingBill.toLocaleString('en-US'))}</h3>
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Clock size={16} />
              </div>
            </div>
            <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-4 space-y-0.5 text-[10px]">
              <p>• নাস্তা বরাদ্দ (৳১০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits(metrics.totalLateAllowance1.toLocaleString('en-US'))}</span></p>
              <p>• যাতায়াত বরাদ্দ (৳২০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits(metrics.totalLateAllowance2.toLocaleString('en-US'))}</span></p>
            </div>
          </div>

          {/* Metric 2: Holiday Duty Allowance splits */}
          <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="app-metadata-text font-medium text-slate-500 uppercase tracking-wider text-[10px]">হলিডে ডিউটি বিল (Lunch + Travel)</p>
                <h3 className="app-kpi-value text-slate-800 dark:text-slate-100 font-sans text-xl font-bold">৳{toBanglaDigits(metrics.totalHolidayBill.toLocaleString('en-US'))}</h3>
              </div>
              <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg">
                <Award size={16} />
              </div>
            </div>
            <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-4 space-y-0.5 text-[10px]">
              <p>• দুপুরের খাবার (৳২৫০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits(metrics.totalHolidayAllowance1.toLocaleString('en-US'))}</span></p>
              <p>• যাতায়াত বরাদ্দ (৳২৫০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits(metrics.totalHolidayAllowance2.toLocaleString('en-US'))}</span></p>
            </div>
          </div>

          {/* Metric 3: Night Shift Allowance splits */}
          <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <p className="app-metadata-text font-medium text-slate-500 uppercase tracking-wider text-[10px]">নাইট শিফট বিল (Dinner + Travel)</p>
                <h3 className="app-kpi-value text-slate-800 dark:text-slate-100 font-sans text-xl font-bold">৳{toBanglaDigits(metrics.totalNightBill.toLocaleString('en-US'))}</h3>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-4 space-y-0.5 text-[10px]">
              <p>• রাতের খাবার (৳৬০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits(metrics.totalNightAllowance1.toLocaleString('en-US'))}</span></p>
              <p>• যাতায়াত বরাদ্দ (৳৪০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits(metrics.totalNightAllowance2.toLocaleString('en-US'))}</span></p>
            </div>
          </div>

          {/* Metric 4: Grand Total */}
          <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between bg-gradient-to-tr from-indigo-950/30 to-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="app-metadata-text font-medium text-emerald-500 dark:text-emerald-400 uppercase tracking-wider text-[10px]">সর্বমোট প্রদেয় বিল (Grand Total)</p>
                <h3 className="app-kpi-value text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400 font-sans text-xl font-bold">৳{toBanglaDigits(metrics.grandTotal.toLocaleString('en-US'))}</h3>
              </div>
              <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-4 space-y-0.5 text-[10px]">
              <p>• সর্বমোট আপ্যায়ন ব্যয়: <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits((metrics.totalLateAllowance1 + metrics.totalHolidayAllowance1 + metrics.totalNightAllowance1).toLocaleString('en-US'))}</span></p>
              <p>• সর্বমোট যাতায়াত ব্যয়: <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits((metrics.totalLateAllowance2 + metrics.totalHolidayAllowance2 + metrics.totalNightAllowance2).toLocaleString('en-US'))}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Aggregated Officers Ledger Table Grouped By Cell */}
      <div className="glass-card p-6 rounded-2xl space-y-4 border border-slate-200 dark:border-slate-800 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base font-sans">আপ্যায়ন বিলিং খতিয়ান (Monthly Billing Ledger)</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">জেনারেটেড ও প্রিন্টকৃত অফিস আদেশ এবং তাদের বিল প্রস্তুতকরণ খতিয়ান।</p>
          </div>
          {allActiveOfficeOrders.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsLedgerPrintMode(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all border border-indigo-100 dark:border-indigo-950/30 cursor-pointer font-sans"
              >
                <Printer size={14} />
                <span>প্রিন্ট প্রিভিউ</span>
              </button>
              <button
                onClick={handleExportToCSV}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer font-sans"
              >
                <FileSpreadsheet size={14} className="text-emerald-500" />
                <span>Excel/CSV এক্সপোর্ট</span>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
        ) : allActiveOfficeOrders.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
            <table className="w-full text-left text-xs leading-normal">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider font-sans">
                  <th className="px-4 py-3.5 text-center w-12">#</th>
                  <th className="px-5 py-3.5">স্মারক নম্বর (Order Reference)</th>
                  <th className="px-5 py-3.5 text-center">আদেশের তারিখ</th>
                  <th className="px-5 py-3.5 text-center">ক্যাটাগরি</th>
                  <th className="px-5 py-3.5">কর্মকর্তা (payee)</th>
                  <th className="px-5 py-3.5 text-center">ডিউটি তথ্য</th>
                  <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {allActiveOfficeOrders.map((order, idx) => {
                  const bill = findAssociatedBill(order);
                  const isBilled = !!bill;

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
                  let apyaonName = 'নাস্তা';
                  let transportName = 'যাতায়াত';
                  if (order.category === 'HOLIDAY') {
                    transportRate = 250;
                    apyaonRate = 250;
                    apyaonName = 'দুপুরের খাবার';
                  } else if (order.category === 'NIGHT_SHIFT') {
                    transportRate = 400;
                    apyaonRate = 600;
                    apyaonName = 'রাতের খাবার';
                  }
                  const billTotal = totalDays * (apyaonRate + transportRate);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                      <td className="px-4 py-4 text-center font-sans font-bold text-slate-400">
                        {toBanglaDigits(idx + 1)}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 break-all max-w-[220px]">
                        {order.orderRef}
                      </td>
                      <td className="px-5 py-4 text-center font-sans">
                        {order.orderDate}
                      </td>
                      <td className="px-5 py-4 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.category === 'LATE_SITTING'
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                            : order.category === 'HOLIDAY'
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {order.category === 'LATE_SITTING' ? 'লেট সিটিং' : order.category === 'HOLIDAY' ? 'সরকারি ছুটি' : 'রাত্রীকালীন'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {order.employeeName}
                      </td>
                      <td className="px-5 py-4 font-sans text-center">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {toBanglaDigits(totalDays)} দিন (৳{toBanglaDigits(billTotal)}/- টাকা)
                        </div>
                        <div className="mt-1 text-[10px] text-slate-450 dark:text-slate-500 font-sans space-y-0.5 text-center flex flex-col items-center">
                          <div>• {apyaonName} (৳{toBanglaDigits(apyaonRate)}): ৳{toBanglaDigits(totalDays * apyaonRate)}/-</div>
                          <div>• {transportName} (৳{toBanglaDigits(transportRate)}): ৳{toBanglaDigits(totalDays * transportRate)}/-</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isBilled ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleLoadBillForEditing(bill.orderRef)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-955/20 dark:hover:bg-teal-900/30 text-teal-650 dark:text-teal-400 rounded-lg text-[10px] font-extrabold transition-all border border-teal-100 dark:border-teal-950/30 cursor-pointer font-sans"
                                title="বিল সম্পাদন করুন"
                              >
                                <CheckCircle size={12} className="text-teal-500" />
                                <span>বিল সম্পাদন</span>
                              </button>
                              <button 
                                onClick={() => setViewingOrder(bill)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold transition-all border border-indigo-100 dark:border-indigo-950/30 cursor-pointer font-sans"
                                title="বিল বিবরণী দেখুন ও প্রিন্ট করুন"
                              >
                                <Eye size={12} />
                                <span>দেখুন</span>
                              </button>
                              {hasDeletePermission(bill) && (
                                <button 
                                  onClick={() => handleDeleteOrder(bill.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer font-sans"
                                  title="বিল বিবরণী মুছে ফেলুন"
                                >
                                  <Trash2 size={12} />
                                  <span>মুছুন</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleGenerateBillFromOrder(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold transition-all border border-amber-100 dark:border-amber-950/30 cursor-pointer font-sans"
                              title="বিল জেনারেট করুন"
                            >
                              <Receipt size={13} />
                              <span>বিল জেনারেট করুন</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold font-sans">
                <tr>
                  <td colSpan={5} className="px-5 py-4 text-right font-extrabold text-sm text-slate-700 dark:text-slate-350">
                    সর্বমোট:
                  </td>
                  <td className="px-5 py-4 text-center font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                    ৳{toBanglaDigits(ledgerGrandTotal.toLocaleString('en-US'))}/- টাকা
                  </td>
                  <td className="px-5 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 dark:text-slate-500 italic">
            কোনো অপেক্ষমান বিল অফিস আদেশ পাওয়া যায়নি।
          </div>
        )}
      </div>
    </>
  );
}
