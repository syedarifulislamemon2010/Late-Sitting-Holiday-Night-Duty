import React from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit3, 
  Trash2, 
  Users, 
  Printer, 
  AlertCircle, 
  Banknote,
  FileSpreadsheet
} from 'lucide-react';
import { toBanglaDigits, getBanglaDate } from '@/lib/bengali-converter';

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

interface BillGroup {
  date: string;
  name: string;
  bills: OfficeOrder[];
}

interface EmployeeBreakdown {
  employeeName: string;
  designation: string;
  lateSittingDays: number;
  lateSittingAmount: number;
  holidayDays: number;
  holidayAmount: number;
  nightShiftDays: number;
  nightShiftAmount: number;
  totalDays: number;
  grandTotal: number;
}

interface ReportData {
  totalBillsCount: number;
  grandTotalSum: number;
  totalDaysSum: number;
  totalTransport: number;
  totalApyaon: number;
  lateSittingAmount: number;
  holidayAmount: number;
  nightShiftAmount: number;
  totalLateDays: number;
  totalLateAmount: number;
  totalHolidayDays: number;
  totalHolidayAmount: number;
  totalNightDays: number;
  totalNightAmount: number;
  employeesBreakdown: EmployeeBreakdown[];
}

interface ReportsTabProps {
  billGroups: BillGroup[];
  expandedSlots: Record<string, boolean>;
  toggleSlot: (date: string) => void;
  findMatchingOfficeOrder: (bill: OfficeOrder) => OfficeOrder | undefined;
  hasDeletePermission: (order: OfficeOrder) => boolean;
  handleDeleteOrder: (id: number) => Promise<void> | void;
  handleLoadBillForEditing: (ref: string) => void;
  handleChangeBillGroup: (billId: number, bill: OfficeOrder, targetDate: string) => Promise<void> | void;
  reportDate: string;
  setReportDate: (date: string) => void;
  reportData: ReportData;
  setIsReportPrintMode: (mode: boolean) => void;
  getBanglaNumberWords: (num: number) => string;
}

export default function ReportsTab({
  billGroups,
  expandedSlots,
  toggleSlot,
  findMatchingOfficeOrder,
  hasDeletePermission,
  handleDeleteOrder,
  handleLoadBillForEditing,
  handleChangeBillGroup,
  reportDate,
  setReportDate,
  reportData,
  setIsReportPrintMode,
  getBanglaNumberWords
}: ReportsTabProps) {

  const handleExportReportCSV = () => {
    const headers = [
      'ক্রমিক নং', 
      'কর্মকর্তার নাম', 
      'পদবী', 
      'লেট-সিটিং দিন', 
      'লেট-সিটিং টাকা', 
      'ছুটির দিন', 
      'ছুটির টাকা', 
      'নাইট শিফট দিন', 
      'নাইট শিফট টাকা', 
      'মোট দিন', 
      'সর্বমোট প্রদেয় টাকা'
    ];
    
    const rows = reportData.employeesBreakdown.map((record, idx) => [
      idx + 1,
      record.employeeName,
      record.designation,
      record.lateSittingDays,
      record.lateSittingAmount,
      record.holidayDays,
      record.holidayAmount,
      record.nightShiftDays,
      record.nightShiftAmount,
      record.totalDays,
      record.grandTotal
    ]);

    // Add totals row
    rows.push([
      'সর্বমোট',
      '',
      '',
      reportData.totalLateDays,
      reportData.totalLateAmount,
      reportData.totalHolidayDays,
      reportData.totalHolidayAmount,
      reportData.totalNightDays,
      reportData.totalNightAmount,
      reportData.totalDaysSum,
      reportData.grandTotalSum
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daily_Report_Payee_Statement_${reportDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Slot Groups Collapsible Cards */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 font-sans">
            <Calendar size={16} className="text-indigo-500" />
            বিলিং স্লট গ্রুপসমূহ (Billing Slots / Groups)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            জেনারেটকৃত বিলের তারিখ ভিত্তিক স্লট গ্রুপসমূহ এবং তাদের অধীনে থাকা অফিস আদেশ ও বিল মেমোর তালিকা।
          </p>
        </div>
        
        {billGroups.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 dark:text-slate-500 italic text-xs font-sans">
            কোনো বিলিং স্লট গ্রুপ পাওয়া যায়নি।
          </div>
        ) : (
          <div className="space-y-4">
            {billGroups.map((group) => {
              const isExpanded = !!expandedSlots[group.date];
              const slotTotalAmount = group.bills.reduce((sum, b) => {
                let innerTotal = 0;
                let dutiesList: any[] = (b.duties as any) || [];
                if (dutiesList.length === 0 && b.dutiesJson) {
                  try { dutiesList = JSON.parse(b.dutiesJson); } catch {}
                }
                dutiesList.forEach((d: any) => {
                  innerTotal += Number(d.grandTotal || 0);
                });
                return sum + innerTotal;
              }, 0);

              return (
                <div key={group.date} className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all">
                  {/* Slot Header */}
                  <div 
                    className="p-4 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-4 cursor-pointer select-none"
                    onClick={() => toggleSlot(group.date)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {group.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans">
                          গ্রুপ তারিখ: {getBanglaDate(group.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-350 font-sans">
                          {toBanglaDigits(group.bills.length)} টি বিল
                        </span>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-sans">
                          ৳{toBanglaDigits(slotTotalAmount)}/- BDT
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportDate(group.date);
                        }}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer font-sans shadow-sm"
                      >
                        রিপোর্ট ভিউ
                      </button>

                      <button className="text-slate-400 hover:text-slate-605 transition-colors">
                        {isExpanded ? <ChevronLeft size={16} className="rotate-90" /> : <ChevronRight size={16} className="rotate-90" />}
                      </button>
                    </div>
                  </div>

                  {/* Slot Body (Table of pairs) */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto">
                      <table className="w-full text-left text-xs leading-normal font-sans border-collapse">
                        <thead>
                          <tr className="bg-slate-100/30 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-4 py-3 text-center w-12">#</th>
                            <th className="px-4 py-3">কর্মকর্তার নাম (Payee)</th>
                            <th className="px-4 py-3 text-center">ক্যাটাগরি</th>
                            <th className="px-4 py-3">অফিস আদেশ (Office Order)</th>
                            <th className="px-4 py-3">বিল মেমো (Bill Memo)</th>
                            <th className="px-4 py-3 text-center">ডিউটি তথ্য ও বিল</th>
                            <th className="px-4 py-3 text-center">গ্রুপ পরিবর্তন (Shift Slot)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium">
                          {group.bills.map((bill, bIdx) => {
                            const order = findMatchingOfficeOrder(bill);
                            let dutiesList: any[] = (bill.duties as any) || [];
                            if (dutiesList.length === 0 && bill.dutiesJson) {
                              try { dutiesList = JSON.parse(bill.dutiesJson); } catch {}
                            }
                            const totalDays = dutiesList.reduce((sum, d) => sum + Number(d.days || (d.dates && d.dates.length) || 0), 0);
                            const grandTotal = dutiesList.reduce((sum, d) => sum + Number(d.grandTotal || 0), 0);

                            return (
                              <tr key={bill.id} className="hover:bg-slate-50/20 text-slate-600 dark:text-slate-300">
                                <td className="px-4 py-3 text-center font-sans font-bold text-slate-400">
                                  {toBanglaDigits(bIdx + 1)}
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 font-sans">
                                  {bill.employeeName}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    bill.category === 'BILL_LATE_SITTING'
                                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                      : bill.category === 'BILL_HOLIDAY'
                                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    {bill.category === 'BILL_LATE_SITTING' ? 'লেট সিটিং' : bill.category === 'BILL_HOLIDAY' ? 'সরকারি ছুটি' : 'রাত্রিকালীন'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {order ? (
                                    <div className="space-y-1">
                                      <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all max-w-[180px]">
                                        {order.orderRef}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <button 
                                          onClick={() => {
                                            window.open(`/documents/preview?id=${order.id}&source=office-order`, '_blank');
                                          }}
                                          className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 cursor-pointer font-sans font-semibold"
                                        >
                                          <Eye size={10} /> ভিউ
                                        </button>
                                        {hasDeletePermission(order) && (
                                          <>
                                            <span className="text-slate-300">|</span>
                                            <button 
                                              onClick={() => {
                                                window.location.href = `/roster?edit_ref=${encodeURIComponent(order.orderRef)}`;
                                              }}
                                              className="text-[10px] text-teal-600 hover:text-teal-800 hover:underline flex items-center gap-0.5 cursor-pointer font-sans font-semibold"
                                            >
                                              <Edit3 size={10} /> সম্পাদনা
                                            </button>
                                            <span className="text-slate-300">|</span>
                                            <button 
                                              onClick={() => handleDeleteOrder(order.id)}
                                              className="text-[10px] text-red-500 hover:text-red-700 hover:underline flex items-center gap-0.5 cursor-pointer font-sans font-semibold"
                                            >
                                              <Trash2 size={10} /> ডিলিট
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">অর্ডার পাওয়া যায়নি</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all max-w-[180px]">
                                      {bill.orderRef}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button 
                                        onClick={() => {
                                          window.open(`/documents/preview?id=${bill.id}&source=bill`, '_blank');
                                        }}
                                        className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 cursor-pointer font-sans font-semibold"
                                      >
                                        <Eye size={10} /> ভিউ
                                      </button>
                                      {hasDeletePermission(bill) && (
                                        <>
                                          <span className="text-slate-300">|</span>
                                          <button 
                                            onClick={() => handleLoadBillForEditing(bill.orderRef)}
                                            className="text-[10px] text-teal-600 hover:text-teal-800 hover:underline flex items-center gap-0.5 cursor-pointer font-sans font-semibold"
                                          >
                                            <Edit3 size={10} /> সম্পাদনা
                                          </button>
                                          <span className="text-slate-300">|</span>
                                          <button 
                                            onClick={() => handleDeleteOrder(bill.id)}
                                            className="text-[10px] text-red-500 hover:text-red-700 hover:underline flex items-center gap-0.5 cursor-pointer font-sans font-semibold"
                                          >
                                            <Trash2 size={10} /> ডিলিট
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center font-sans">
                                  <div className="font-bold text-slate-800 dark:text-slate-200">
                                    {toBanglaDigits(totalDays)} দিন
                                  </div>
                                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                    ৳{toBanglaDigits(grandTotal)}/-
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <select
                                    value={bill.orderDate}
                                    onChange={(e) => handleChangeBillGroup(bill.id, bill, e.target.value)}
                                    className="px-2 py-1 rounded border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 font-sans"
                                  >
                                    {billGroups.map(g => (
                                      <option key={g.date} value={g.date}>{g.name}</option>
                                    ))}
                                    <option value="custom">নতুন গ্রুপ তারিখ...</option>
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Consolidated Daily Report Section */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 glass-card rounded-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 flex items-center gap-2 font-sans">
              <Calendar size={16} className="text-indigo-500" />
              নির্বাচিত তারিখের সমন্বিত প্রতিবেদন (Consolidated Daily Report)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              তারিখ: {getBanglaDate(reportDate)} ({reportDate}) | মোট বিল: {toBanglaDigits(reportData.totalBillsCount)} টি | সর্বমোট পরিমাণ: ৳{toBanglaDigits(reportData.grandTotalSum)}/-
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full md:w-auto px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
              />
            </div>
            <button
              onClick={() => setIsReportPrintMode(true)}
              disabled={reportData.totalBillsCount === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md font-sans"
            >
              <Printer size={14} />
              প্রিন্ট রিপোর্ট
            </button>
          </div>
        </div>

        {reportData.totalBillsCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 glass-card rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 font-sans">নির্বাচিত তারিখে কোনো বিল জেনারেট করা হয়নি</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[320px] mx-auto font-sans">
                {getBanglaDate(reportDate)} তারিখে কোনো অফিস আদেশ স্মারক বিবরণীর বিল জেনারেট করা পাওয়া যায়নি। অনুগ্রহ করে অন্য তারিখ নির্বাচন করুন।
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Bills */}
              <div className="p-5 bg-gradient-to-br from-indigo-50 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/10 border border-indigo-100/50 dark:border-indigo-950/50 rounded-2xl shadow-sm">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-sans">মোট জেনারেটকৃত বিল</p>
                <h4 className="text-2xl font-extrabold text-indigo-950 dark:text-indigo-350 mt-1.5 font-sans">{toBanglaDigits(reportData.totalBillsCount)} টি</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-sans">আজকের জেনারেটকৃত মোট বিলের সংখ্যা</p>
              </div>

              {/* Card 2: Total Worked Days */}
              <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 border border-purple-100/50 dark:border-purple-950/50 rounded-2xl shadow-sm">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 font-sans">মোট ডিউটি দিন</p>
                <h4 className="text-2xl font-extrabold text-purple-950 dark:text-indigo-350 mt-1.5 font-sans">{toBanglaDigits(reportData.totalDaysSum)} দিন</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-sans">কর্মকর্তাদের মোট পালিত দায়িত্বের পরিমাণ</p>
              </div>

              {/* Card 3: Allowances Breakdown */}
              <div className="p-5 bg-gradient-to-br from-cyan-50 to-cyan-100/30 dark:from-cyan-950/20 dark:to-cyan-900/10 border border-cyan-100/50 dark:border-cyan-950/50 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-sans">ভাতার বিভাজন</p>
                  <div className="flex items-center justify-between mt-1.5 font-sans">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">যাতায়াত:</span>
                    <span className="text-xs font-extrabold text-cyan-950 dark:text-indigo-300">{toBanglaDigits(reportData.totalTransport)}/- BDT</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 font-sans">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">আপ্যায়ন:</span>
                    <span className="text-xs font-extrabold text-cyan-950 dark:text-indigo-300">{toBanglaDigits(reportData.totalApyaon)}/- BDT</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 font-sans border-t border-dashed border-cyan-200 dark:border-cyan-800/50 pt-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">লেট সিটিং:</span>
                    <span className="text-xs font-extrabold text-cyan-950 dark:text-indigo-300">{toBanglaDigits(reportData.lateSittingAmount)}/- BDT</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 font-sans">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">ছুটির দিন:</span>
                    <span className="text-xs font-extrabold text-cyan-950 dark:text-indigo-300">{toBanglaDigits(reportData.holidayAmount)}/- BDT</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 font-sans">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">রাত্রিকালীন:</span>
                    <span className="text-xs font-extrabold text-cyan-950 dark:text-indigo-300">{toBanglaDigits(reportData.nightShiftAmount)}/- BDT</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Grand Total */}
              <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-500/20 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-sans">সর্বমোট প্রদেয় বিল</p>
                  <h4 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1.5 font-sans">{toBanglaDigits(reportData.grandTotalSum)}/- BDT</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium font-sans">{getBanglaNumberWords(reportData.grandTotalSum)}</p>
                </div>
                <div className="absolute right-[-10px] bottom-[-10px] text-emerald-500/10 dark:text-emerald-500/5 pointer-events-none">
                  <Banknote size={80} />
                </div>
              </div>
            </div>

            {/* Category-wise Breakdown Pills */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-wrap gap-4 items-center justify-around">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-sans">লেট-সিটিং বিল</p>
                  <p className="text-xs font-extrabold text-slate-700 dark:text-slate-350 font-sans">{toBanglaDigits(reportData.totalLateAmount)}/- টাকা</p>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 hidden md:block" />
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-teal-500" />
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-sans">ছুটির দিনের বিল</p>
                  <p className="text-xs font-extrabold text-slate-700 dark:text-slate-350 font-sans">{toBanglaDigits(reportData.totalHolidayAmount)}/- টাকা</p>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 hidden md:block" />
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-sans">রাত্রিকালীন শিফট বিল</p>
                  <p className="text-xs font-extrabold text-slate-700 dark:text-slate-350 font-sans">{toBanglaDigits(reportData.totalNightAmount)}/- টাকা</p>
                </div>
              </div>
            </div>

            {/* Table: Consolidated Payee Statement */}
            <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80">
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-350 flex items-center gap-2 font-sans">
                  <Users size={14} className="text-indigo-500" />
                  ১. কর্মকর্তা ভিত্তিক সমন্বিত বিবরণী (Consolidated Payee Details)
                </h4>
                <button
                  onClick={handleExportReportCSV}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer font-sans"
                >
                  <FileSpreadsheet size={12} className="text-emerald-500" />
                  <span>CSV এক্সপোর্ট</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80">
                      <th className="p-3 text-center w-12">#</th>
                      <th className="p-3">কর্মকর্তার নাম</th>
                      <th className="p-3">পদবী</th>
                      <th className="p-3 text-center">লেট-সিটিং দিন (টাকা)</th>
                      <th className="p-3 text-center">ছুটির দিন দিন (টাকা)</th>
                      <th className="p-3 text-center">নাইট শিফট দিন (টাকা)</th>
                      <th className="p-3 text-center">মোট দিন</th>
                      <th className="p-3 text-right pr-6">সর্বমোট প্রদেয় (টাকা)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs font-medium">
                    {reportData.employeesBreakdown.map((record, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 text-slate-600 dark:text-slate-350">
                        <td className="p-3 text-center font-mono text-[10px] text-slate-450">{toBanglaDigits(idx + 1)}</td>
                        <td className="p-3 text-slate-800 dark:text-slate-200 font-bold">{record.employeeName}</td>
                        <td className="p-3 text-slate-400 text-[10px]">{record.designation}</td>
                        <td className="p-3 text-center">
                          {record.lateSittingDays > 0 ? (
                            <span>{toBanglaDigits(record.lateSittingDays)} দিন ({toBanglaDigits(record.lateSittingAmount)}/-)</span>
                          ) : (
                            <span className="text-slate-350 dark:text-slate-700">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {record.holidayDays > 0 ? (
                            <span>{toBanglaDigits(record.holidayDays)} দিন ({toBanglaDigits(record.holidayAmount)}/-)</span>
                          ) : (
                            <span className="text-slate-350 dark:text-slate-700">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {record.nightShiftDays > 0 ? (
                            <span>{toBanglaDigits(record.nightShiftDays)} দিন ({toBanglaDigits(record.nightShiftAmount)}/-)</span>
                          ) : (
                            <span className="text-slate-350 dark:text-slate-700">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold">{toBanglaDigits(record.totalDays)}</td>
                        <td className="p-3 text-right pr-6 font-extrabold text-slate-800 dark:text-slate-200">{toBanglaDigits(record.grandTotal)}/-</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100/50 dark:bg-slate-900/60 font-bold text-slate-850 dark:text-slate-200 border-t-2 border-slate-300 dark:border-slate-700">
                      <td className="p-3 text-center"></td>
                      <td className="p-3 text-left font-extrabold font-sans" colSpan={2}>সর্বমোট</td>
                      <td className="p-3 text-center font-bold">
                        {reportData.totalLateDays > 0 ? (
                          <span>{toBanglaDigits(reportData.totalLateDays)} দিন ({toBanglaDigits(reportData.totalLateAmount)}/-)</span>
                        ) : (
                          <span className="text-slate-350 dark:text-slate-700">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold">
                        {reportData.totalHolidayDays > 0 ? (
                          <span>{toBanglaDigits(reportData.totalHolidayDays)} দিন ({toBanglaDigits(reportData.totalHolidayAmount)}/-)</span>
                        ) : (
                          <span className="text-slate-350 dark:text-slate-700">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold">
                        {reportData.totalNightDays > 0 ? (
                          <span>{toBanglaDigits(reportData.totalNightDays)} দিন ({toBanglaDigits(reportData.totalNightAmount)}/-)</span>
                        ) : (
                          <span className="text-slate-350 dark:text-slate-700">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold">{toBanglaDigits(reportData.totalDaysSum)}</td>
                      <td className="p-3 text-right pr-6 font-extrabold text-slate-950 dark:text-slate-100">{toBanglaDigits(reportData.grandTotalSum)}/-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
