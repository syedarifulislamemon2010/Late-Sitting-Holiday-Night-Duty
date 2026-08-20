import React from 'react';
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Edit3, 
  Trash2, 
  Users, 
  Printer, 
  AlertCircle, 
  Banknote,
  FileSpreadsheet,
  ArrowRightLeft
} from 'lucide-react';
import { toBanglaDigits, getBanglaDate } from '@/lib/bengali-converter';
import { getCategoryConfig } from '@/lib/category-colors';
import { EmptyState } from '@/components/ui/EmptyState';

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
  deduction?: number;
  deductions?: number;
}

interface PayeeSummary {
  payeeName: string;
  designation: string;
  billCount: number;
  transportAllowance: number;
  apyaonAllowance: number;
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
  payeesSummary: PayeeSummary[];
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

  // Check if any employee has deductions to conditionally show "কর্তন" column
  const hasAnyDeductions = React.useMemo(() => {
    return reportData.employeesBreakdown.some((r: EmployeeBreakdown) => (r.deduction && r.deduction > 0) || (r.deductions && r.deductions > 0));
  }, [reportData.employeesBreakdown]);

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
      toBanglaDigits(idx + 1),
      record.employeeName,
      record.designation,
      toBanglaDigits(record.lateSittingDays),
      toBanglaDigits(record.lateSittingAmount),
      toBanglaDigits(record.holidayDays),
      toBanglaDigits(record.holidayAmount),
      toBanglaDigits(record.nightShiftDays),
      toBanglaDigits(record.nightShiftAmount),
      toBanglaDigits(record.totalDays),
      toBanglaDigits(record.grandTotal)
    ]);

    // Add totals row
    rows.push([
      'সর্বমোট',
      '',
      '',
      toBanglaDigits(reportData.totalLateDays),
      toBanglaDigits(reportData.totalLateAmount),
      toBanglaDigits(reportData.totalHolidayDays),
      toBanglaDigits(reportData.totalHolidayAmount),
      toBanglaDigits(reportData.totalNightDays),
      toBanglaDigits(reportData.totalNightAmount),
      toBanglaDigits(reportData.totalDaysSum),
      toBanglaDigits(reportData.grandTotalSum)
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
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 font-sans">
            <Calendar size={18} className="text-primary" />
            বিলিং স্লট গ্রুপসমূহ (Billing Slots / Groups)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            জেনারেটকৃত বিলের তারিখ ভিত্তিক স্লট গ্রুপসমূহ এবং তাদের অধীনে থাকা অফিস আদেশ ও বিল মেমোর তালিকা।
          </p>
        </div>
        
        {billGroups.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="কোনো বিলিং স্লট গ্রুপ পাওয়া যায়নি"
            description="বর্তমানে কোনো বিলিং স্লট বা তারিখ-ভিত্তিক গ্রুপ বিদ্যমান নেই।"
          />
        ) : (
          <div className="space-y-4">
            {billGroups.map((group) => {
              const isExpanded = !!expandedSlots[group.date];
              const slotTotalAmount = group.bills.reduce((sum, b) => {
                let innerTotal = 0;
                let dutiesList: OrderDuty[] = (b.duties as OrderDuty[]) || [];
                if (dutiesList.length === 0 && b.dutiesJson) {
                  try { dutiesList = JSON.parse(b.dutiesJson); } catch {}
                }
                dutiesList.forEach((d: OrderDuty) => {
                  innerTotal += Number(d.grandTotal || 0);
                });
                return sum + innerTotal;
              }, 0);

              return (
                <div key={group.date} className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                  {/* Cohesive Group Header */}
                  <div 
                    className="p-4 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                    onClick={() => toggleSlot(group.date)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-primary dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/30 shrink-0">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                          {group.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                          গ্রুপ তারিখ: <span className="font-semibold text-slate-600 dark:text-slate-300">{getBanglaDate(group.date)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center">
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-sans">
                        <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                          {toBanglaDigits(group.bills.length)} টি বিল
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          ৳{toBanglaDigits(slotTotalAmount)}/-
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportDate(group.date);
                        }}
                        className="h-8 px-3 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-all cursor-pointer font-sans shadow-xs flex items-center gap-1.5"
                        title="এই স্লটের সমন্বিত প্রতিবেদন দেখুন"
                      >
                        <Eye size={12} />
                        <span>রিপোর্ট দেখুন</span>
                      </button>

                      <button 
                        type="button"
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        aria-label={isExpanded ? 'স্লট সংক্ষেপ করুন' : 'স্লট বিস্তারিত দেখুন'}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Slot Body (Table of pairs) */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
                      <table className="w-full text-left text-xs leading-normal font-sans border-collapse">
                        <thead>
                          <tr className="bg-slate-100/50 dark:bg-slate-900/80 border-b border-slate-150 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-3 py-3 text-center w-12">#</th>
                            <th className="px-3.5 py-3 min-w-[130px]">কর্মকর্তার নাম (Payee)</th>
                            <th className="px-3 py-3 text-center w-28">ক্যাটাগরি</th>
                            <th className="px-3.5 py-3 min-w-[170px]">অফিস আদেশ (Office Order)</th>
                            <th className="px-3.5 py-3 min-w-[170px]">বিল মেমো (Bill Memo)</th>
                            <th className="px-3.5 py-3 text-center min-w-[110px]">ডিউটি ও বিল</th>
                            <th className="px-3 py-3 text-center w-36">গ্রুপ পরিবর্তন (Shift Slot)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                          {group.bills.map((bill, bIdx) => {
                            const order = findMatchingOfficeOrder(bill);
                            let dutiesList: OrderDuty[] = bill.duties || [];
                            if (dutiesList.length === 0 && bill.dutiesJson) {
                              try { dutiesList = JSON.parse(bill.dutiesJson); } catch {}
                            }
                            const totalDays = dutiesList.reduce((sum, d) => sum + Number(d.days || (Array.isArray(d.dates) && d.dates.length) || 0), 0);
                            const grandTotal = dutiesList.reduce((sum, d) => sum + Number(d.grandTotal || 0), 0);

                            const catConfig = getCategoryConfig(bill.category);

                            return (
                              <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                                <td className="px-3 py-3 text-center font-mono font-bold text-slate-400">
                                  {toBanglaDigits(bIdx + 1)}
                                </td>
                                <td className="px-3.5 py-3 font-bold text-slate-800 dark:text-slate-100 text-xs">
                                  {bill.employeeName}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catConfig.badgeClass}`}>
                                    {catConfig.label}
                                  </span>
                                </td>
                                
                                {/* Office Order Column with Micro-label & Dedicated Actions */}
                                <td className="px-3.5 py-3">
                                  {order ? (
                                    <div className="space-y-1">
                                      <div 
                                        className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[170px] cursor-help"
                                        title={order.orderRef}
                                      >
                                        {order.orderRef}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button 
                                          onClick={() => window.open(`/documents/preview?id=${order.id}&source=office-order`, '_blank')}
                                          className="h-6 px-2 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] text-slate-700 dark:text-slate-200 flex items-center gap-1 font-semibold transition-all cursor-pointer"
                                          title="অফিস আদেশ প্রিভিউ দেখুন"
                                        >
                                          <Eye size={10} className="text-primary" /> আদেশ
                                        </button>
                                        {hasDeletePermission(order) && (
                                          <>
                                            <button 
                                              onClick={() => {
                                                window.location.href = `/roster?edit_ref=${encodeURIComponent(order.orderRef)}&from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                                              }}
                                              className="h-6 px-2 rounded bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 text-[10px] text-teal-700 dark:text-teal-300 flex items-center gap-1 font-semibold transition-all cursor-pointer"
                                              title="অফিস আদেশ সম্পাদন করুন"
                                            >
                                              <Edit3 size={10} /> এডিট
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteOrder(order.id)}
                                              className="h-6 px-1.5 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-0.5 font-semibold transition-all cursor-pointer"
                                              title="অফিস আদেশ মুছুন"
                                            >
                                              <Trash2 size={10} />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">অর্ডার পাওয়া যায়নি</span>
                                  )}
                                </td>

                                {/* Bill Memo Column with Micro-label & Dedicated Actions */}
                                <td className="px-3.5 py-3">
                                  <div className="space-y-1">
                                    <div 
                                      className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[170px] cursor-help"
                                      title={bill.orderRef}
                                    >
                                      {bill.orderRef}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button 
                                        onClick={() => window.open(`/documents/preview?id=${bill.id}&source=bill`, '_blank')}
                                        className="h-6 px-2 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] text-slate-700 dark:text-slate-200 flex items-center gap-1 font-semibold transition-all cursor-pointer"
                                        title="বিল মেমো প্রিভিউ দেখুন"
                                      >
                                        <Eye size={10} className="text-primary" /> মেমো
                                      </button>
                                      {hasDeletePermission(bill) && (
                                        <>
                                          <button 
                                            onClick={() => handleLoadBillForEditing(bill.orderRef)}
                                            className="h-6 px-2 rounded bg-primary/10 hover:bg-primary/20 text-[10px] text-primary dark:text-blue-300 flex items-center gap-1 font-bold transition-all cursor-pointer"
                                            title="বিল সম্পাদন করুন"
                                          >
                                            <Edit3 size={10} /> এডিট
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteOrder(bill.id)}
                                            className="h-6 px-1.5 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-0.5 font-semibold transition-all cursor-pointer"
                                            title="বিল মেমো মুছুন"
                                          >
                                            <Trash2 size={10} />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Duty & Total Amount */}
                                <td className="px-3.5 py-3 text-center font-sans">
                                  <div className="font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                                    {toBanglaDigits(totalDays)} দিন
                                  </div>
                                  <div className="text-[11px] text-primary dark:text-blue-400 font-black tabular-nums">
                                    ৳{toBanglaDigits(grandTotal)}/-
                                  </div>
                                </td>

                                {/* Shift Slot Reassignment */}
                                <td className="px-3 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <ArrowRightLeft size={11} className="text-slate-400 shrink-0" />
                                    <select
                                      value={bill.orderDate}
                                      onChange={(e) => handleChangeBillGroup(bill.id, bill, e.target.value)}
                                      className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer font-sans max-w-[130px] truncate"
                                      title="স্লট গ্রুপ পরিবর্তন করুন"
                                    >
                                      {billGroups.map(g => (
                                        <option key={g.date} value={g.date}>{g.name}</option>
                                      ))}
                                      <option value="custom">নতুন গ্রুপ তারিখ...</option>
                                    </select>
                                  </div>
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
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 font-sans">
              <Calendar size={16} className="text-primary" />
              নির্বাচিত তারিখের সমন্বিত প্রতিবেদন (Consolidated Daily Report)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              তারিখ: <span className="font-semibold text-slate-600 dark:text-slate-300">{getBanglaDate(reportDate)}</span> ({reportDate}) | মোট বিল: <span className="font-semibold text-slate-600 dark:text-slate-300">{toBanglaDigits(reportData.totalBillsCount)} টি</span> | সর্বমোট পরিমাণ: <span className="font-bold text-primary dark:text-blue-400">৳{toBanglaDigits(reportData.grandTotalSum)}/-</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full md:w-auto px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40 font-sans shadow-xs cursor-pointer"
              />
            </div>
            <button
              onClick={() => setIsReportPrintMode(true)}
              disabled={reportData.totalBillsCount === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md font-sans disabled:cursor-not-allowed"
            >
              <Printer size={14} />
              <span>প্রিন্ট রিপোর্ট</span>
            </button>
          </div>
        </div>

        {reportData.totalBillsCount === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="নির্বাচিত তারিখে কোনো বিল জেনারেট করা হয়নি"
            description={`${getBanglaDate(reportDate)} তারিখে কোনো অফিস আদেশ স্মারক বিবরণীর বিল জেনারেট করা পাওয়া যায়নি। অনুগ্রহ করে অন্য তারিখ নির্বাচন করুন।`}
          />
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Cards Grid — Unified with Category Tokens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Bills */}
              <div className="p-5 bg-gradient-to-br from-indigo-50 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/10 border border-indigo-100/60 dark:border-indigo-950/60 rounded-2xl shadow-xs">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-sans">মোট জেনারেটকৃত বিল</p>
                <h4 className="text-2xl font-black text-indigo-950 dark:text-indigo-200 mt-1.5 font-sans tabular-nums">{toBanglaDigits(reportData.totalBillsCount)} টি</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">আজকের জেনারেটকৃত মোট বিলের সংখ্যা</p>
              </div>

              {/* Card 2: Total Worked Days */}
              <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 border border-purple-100/60 dark:border-purple-950/60 rounded-2xl shadow-xs">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 font-sans">মোট ডিউটি দিন</p>
                <h4 className="text-2xl font-black text-purple-950 dark:text-purple-200 mt-1.5 font-sans tabular-nums">{toBanglaDigits(reportData.totalDaysSum)} দিন</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">কর্মকর্তাদের মোট পালিত দায়িত্বের পরিমাণ</p>
              </div>

              {/* Card 3: Allowances Breakdown */}
              <div className="p-5 bg-gradient-to-br from-sky-50 to-sky-100/30 dark:from-sky-950/20 dark:to-sky-900/10 border border-sky-100/60 dark:border-sky-950/60 rounded-2xl shadow-xs flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-sky-600 dark:text-sky-400 font-sans">ভাতার বিভাজন</p>
                  <div className="flex items-center justify-between mt-1.5 font-sans">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">যাতায়াত:</span>
                    <span className="text-xs font-black text-sky-950 dark:text-sky-200 tabular-nums">{toBanglaDigits(reportData.totalTransport)}/- BDT</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 font-sans">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">আপ্যায়ন:</span>
                    <span className="text-xs font-black text-sky-950 dark:text-sky-200 tabular-nums">{toBanglaDigits(reportData.totalApyaon)}/- BDT</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 font-sans border-t border-dashed border-sky-200 dark:border-sky-800/50 pt-1">
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">লেট সিটিং:</span>
                    <span className="text-xs font-bold text-purple-950 dark:text-purple-200 tabular-nums">{toBanglaDigits(reportData.lateSittingAmount)}/- BDT</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 font-sans">
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">ছুটির দিন:</span>
                    <span className="text-xs font-bold text-sky-950 dark:text-sky-200 tabular-nums">{toBanglaDigits(reportData.holidayAmount)}/- BDT</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 font-sans">
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">রাত্রিকালীন:</span>
                    <span className="text-xs font-bold text-blue-950 dark:text-blue-200 tabular-nums">{toBanglaDigits(reportData.nightShiftAmount)}/- BDT</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Grand Total */}
              <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-500/20 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-sans">সর্বমোট প্রদেয় বিল</p>
                  <h4 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1.5 font-sans tabular-nums">{toBanglaDigits(reportData.grandTotalSum)}/- BDT</h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium font-sans">{getBanglaNumberWords(reportData.grandTotalSum)}</p>
                </div>
                <div className="absolute right-[-10px] bottom-[-10px] text-emerald-500/15 dark:text-emerald-400/10 pointer-events-none">
                  <Banknote size={80} />
                </div>
              </div>
            </div>

            {/* Category-wise Breakdown Pills / Legend (Aligned with single source of truth) */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl flex flex-wrap gap-4 items-center justify-around">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-purple-600 dark:bg-purple-400 ring-2 ring-purple-500/20" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">লেট-সিটিং বিল</p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 font-sans tabular-nums">{toBanglaDigits(reportData.totalLateAmount)}/- টাকা</p>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-100 dark:border-slate-800 hidden md:block" />
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-sky-600 dark:bg-sky-400 ring-2 ring-sky-500/20" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">ছুটির দিনের বিল</p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 font-sans tabular-nums">{toBanglaDigits(reportData.totalHolidayAmount)}/- টাকা</p>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-100 dark:border-slate-800 hidden md:block" />
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400 ring-2 ring-blue-500/20" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">রাত্রিকালীন শিফট বিল</p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 font-sans tabular-nums">{toBanglaDigits(reportData.totalNightAmount)}/- টাকা</p>
                </div>
              </div>
            </div>

            {/* Table 1: Payee Bill Summary */}
            <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80 mb-6">
              <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-4">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 font-sans">
                  <Users size={14} className="text-primary" />
                  ১. কর্মকর্তা ভিত্তিক বিলের সারসংক্ষেপ (Payee Bill Summary)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80">
                      <th className="p-3 text-center w-12">#</th>
                      <th className="p-3">কর্মকর্তার নাম ও পদবী (Payee Name & Designation)</th>
                      <th className="p-3 text-center w-28">বিলের সংখ্যা</th>
                      <th className="p-3 text-right w-36">যাতায়াত ভাতা (টাকা)</th>
                      <th className="p-3 text-right w-36">আপ্যায়ন ভাতা (টাকা)</th>
                      <th className="p-3 text-right pr-6 w-44">মোট বিলের পরিমাণ (টাকা)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs font-medium">
                    {reportData.payeesSummary?.map((payee, idx) => {
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                          <td className="p-3 text-center font-mono text-[10px] text-slate-400">{toBanglaDigits(idx + 1)}</td>
                          <td className="p-3 text-slate-800 dark:text-slate-100 font-bold">
                            {payee.payeeName} {payee.designation ? `(${payee.designation})` : ''}
                          </td>
                          <td className="p-3 text-center font-bold tabular-nums">{toBanglaDigits(payee.billCount)} টি</td>
                          <td className="p-3 text-right font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">৳{toBanglaDigits(payee.transportAllowance || 0)}/-</td>
                          <td className="p-3 text-right font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">৳{toBanglaDigits(payee.apyaonAllowance || 0)}/-</td>
                          <td className="p-3 text-right pr-6 font-black text-primary dark:text-blue-400 tabular-nums">৳{toBanglaDigits(payee.grandTotal)}/-</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-100/60 dark:bg-slate-900/60 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                      <td className="p-3 text-center"></td>
                      <td className="p-3 text-left font-black font-sans">সর্বমোট</td>
                      <td className="p-3 text-center font-black tabular-nums">
                        {toBanglaDigits(reportData.payeesSummary?.reduce((sum, p) => sum + p.billCount, 0) || 0)} টি
                      </td>
                      <td className="p-3 text-right font-black tabular-nums">
                        ৳{toBanglaDigits(reportData.payeesSummary?.reduce((sum, p) => sum + (p.transportAllowance || 0), 0) || 0)}/-
                      </td>
                      <td className="p-3 text-right font-black tabular-nums">
                        ৳{toBanglaDigits(reportData.payeesSummary?.reduce((sum, p) => sum + (p.apyaonAllowance || 0), 0) || 0)}/-
                      </td>
                      <td className="p-3 text-right pr-6 font-black text-primary dark:text-blue-400 text-sm tabular-nums">
                        ৳{toBanglaDigits(reportData.payeesSummary?.reduce((sum, p) => sum + p.grandTotal, 0) || 0)}/-
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Consolidated Payee Statement (Conditionally Hiding Deduction Column) */}
            <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80">
              <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 font-sans">
                  <Users size={14} className="text-primary" />
                  ২. কর্মচারী ভিত্তিক সমন্বিত বিস্তারিত বিবরণী (Consolidated Payee Details)
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
                      <th className="p-3 text-center w-10">#</th>
                      <th className="p-3 w-48">কর্মকর্তার নাম</th>
                      <th className="p-3 w-40">পদবী</th>
                      <th className="p-3 text-center">লেট-সিটিং দিন (টাকা)</th>
                      <th className="p-3 text-center">ছুটির দিন (টাকা)</th>
                      <th className="p-3 text-center">নাইট শিফট দিন (টাকা)</th>
                      <th className="p-3 text-center w-16">মোট দিন</th>
                      <th className="p-3 text-right pr-4 w-32">সর্বমোট (টাকা)</th>
                      {hasAnyDeductions && <th className="p-3 text-center w-20">কর্তন</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs font-medium">
                    {reportData.employeesBreakdown.map((record, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                        <td className="p-3 text-center font-mono text-[10px] text-slate-400">{toBanglaDigits(idx + 1)}</td>
                        <td className="p-3 text-slate-800 dark:text-slate-100 font-bold">{record.employeeName}</td>
                        <td className="p-3 text-slate-400 text-[10px]">{record.designation}</td>
                        <td className="p-3 text-center tabular-nums">
                          {record.lateSittingDays > 0 ? (
                            <span>{toBanglaDigits(record.lateSittingDays)} দিন (৳{toBanglaDigits(record.lateSittingAmount)}/-)</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center tabular-nums">
                          {record.holidayDays > 0 ? (
                            <span>{toBanglaDigits(record.holidayDays)} দিন (৳{toBanglaDigits(record.holidayAmount)}/-)</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center tabular-nums">
                          {record.nightShiftDays > 0 ? (
                            <span>{toBanglaDigits(record.nightShiftDays)} দিন (৳{toBanglaDigits(record.nightShiftAmount)}/-)</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold tabular-nums">{toBanglaDigits(record.totalDays)}</td>
                        <td className="p-3 text-right pr-4 font-black text-primary dark:text-blue-400 tabular-nums">৳{toBanglaDigits(record.grandTotal)}/-</td>
                        {hasAnyDeductions && <td className="p-3 text-center text-slate-400 font-bold">-</td>}
                      </tr>
                    ))}
                    <tr className="bg-slate-100/60 dark:bg-slate-900/60 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                      <td className="p-3 text-center"></td>
                      <td className="p-3 text-left font-black font-sans" colSpan={2}>সর্বমোট</td>
                      <td className="p-3 text-center font-black tabular-nums">
                        {reportData.totalLateDays > 0 ? (
                          <span>{toBanglaDigits(reportData.totalLateDays)} দিন (৳{toBanglaDigits(reportData.totalLateAmount)}/-)</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-black tabular-nums">
                        {reportData.totalHolidayDays > 0 ? (
                          <span>{toBanglaDigits(reportData.totalHolidayDays)} দিন (৳{toBanglaDigits(reportData.totalHolidayAmount)}/-)</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-black tabular-nums">
                        {reportData.totalNightDays > 0 ? (
                          <span>{toBanglaDigits(reportData.totalNightDays)} দিন (৳{toBanglaDigits(reportData.totalNightAmount)}/-)</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-black tabular-nums">{toBanglaDigits(reportData.totalDaysSum)}</td>
                      <td className="p-3 text-right pr-4 font-black text-primary dark:text-blue-400 text-sm tabular-nums">৳{toBanglaDigits(reportData.grandTotalSum)}/-</td>
                      {hasAnyDeductions && <td className="p-3 text-center text-slate-400 font-bold">-</td>}
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
