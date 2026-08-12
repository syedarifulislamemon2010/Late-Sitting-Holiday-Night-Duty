'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  X, 
  Calendar, 
  Building2, 
  CheckCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { toBanglaDigits, getBanglaNumberWords } from '@/lib/bengali-converter';

interface SummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCells?: { id: number; name: string }[];
}

interface EmployeeSummaryItem {
  id: number;
  name: string;
  designation: string;
  bankId: string;
  lateDays: number;
  holidayDays: number;
  nightDays: number;
  totalDays: number;
  lateBill: number;
  holidayBill: number;
  nightBill: number;
  totalBill: number;
}

export default function SummaryReportModal({ isOpen, onClose, availableCells = [] }: SummaryReportModalProps) {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedCellId, setSelectedCellId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<{
    cellName: string;
    periodLabel: string;
    employees: EmployeeSummaryItem[];
    totals: {
      lateDays: number;
      holidayDays: number;
      nightDays: number;
      totalDays: number;
      lateBill: number;
      holidayBill: number;
      nightBill: number;
      totalBill: number;
    };
  } | null>(null);

  const monthOptions = [
    { value: 'all', label: 'সমগ্র বছর (১২ মাস)' },
    { value: '01', label: 'জানুয়ারি' },
    { value: '02', label: 'ফেব্রুয়ারি' },
    { value: '03', label: 'মার্চ' },
    { value: '04', label: 'এপ্রিল' },
    { value: '05', label: 'মে' },
    { value: '06', label: 'জুন' },
    { value: '07', label: 'জুলাই' },
    { value: '08', label: 'আগস্ট' },
    { value: '09', label: 'সেপ্টেম্বর' },
    { value: '10', label: 'অক্টোবর' },
    { value: '11', label: 'নভেম্বর' },
    { value: '12', label: 'ডিসেম্বর' },
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedYear) queryParams.set('year', selectedYear);
      if (selectedMonth && selectedMonth !== 'all') queryParams.set('month', `${selectedYear}-${selectedMonth}`);

      const res = await fetch(`/api/duties?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Support both direct Array response and object with duties key
        const dutiesList: any[] = Array.isArray(data) ? data : (data.duties || []);

        // Aggregate by employee
        const empMap = new Map<number, EmployeeSummaryItem>();

        dutiesList.forEach((d: any) => {
          const emp = d.employee;
          if (!emp) return;

          // Robust Client-side Cell Filter Validation
          if (selectedCellId !== 'all') {
            const targetCellId = parseInt(selectedCellId, 10);
            const empCellId = emp.cellId ?? emp.cell?.id ?? d.cellId;
            if (empCellId !== undefined && empCellId !== null && Number(empCellId) !== targetCellId) {
              return;
            }
          }

          const existing = empMap.get(emp.id) || {
            id: emp.id,
            name: emp.name,
            designation: emp.designation,
            bankId: emp.bankId || 'N/A',
            lateDays: 0,
            holidayDays: 0,
            nightDays: 0,
            totalDays: 0,
            lateBill: 0,
            holidayBill: 0,
            nightBill: 0,
            totalBill: 0,
          };

          const bill = Number(d.totalBill) || 0;

          if (d.type === 'LATE_SITTING') {
            existing.lateDays += 1;
            existing.lateBill += bill;
          } else if (d.type === 'HOLIDAY') {
            existing.holidayDays += 1;
            existing.holidayBill += bill;
          } else if (d.type === 'NIGHT_SHIFT') {
            existing.nightDays += 1;
            existing.nightBill += bill;
          }

          existing.totalDays = existing.lateDays + existing.holidayDays + existing.nightDays;
          existing.totalBill = existing.lateBill + existing.holidayBill + existing.nightBill;

          empMap.set(emp.id, existing);
        });

        const employeesArr = Array.from(empMap.values());

        const totals = employeesArr.reduce(
          (acc, item) => {
            acc.lateDays += item.lateDays;
            acc.holidayDays += item.holidayDays;
            acc.nightDays += item.nightDays;
            acc.totalDays += item.totalDays;
            acc.lateBill += item.lateBill;
            acc.holidayBill += item.holidayBill;
            acc.nightBill += item.nightBill;
            acc.totalBill += item.totalBill;
            return acc;
          },
          {
            lateDays: 0,
            holidayDays: 0,
            nightDays: 0,
            totalDays: 0,
            lateBill: 0,
            holidayBill: 0,
            nightBill: 0,
            totalBill: 0,
          }
        );

        let cellName = 'সকল সেল';
        if (selectedCellId !== 'all') {
          const found = availableCells.find(c => String(c.id) === selectedCellId);
          if (found) cellName = found.name;
        }

        let periodLabel = `${toBanglaDigits(selectedYear)} খ্রি.`;
        if (selectedMonth !== 'all') {
          const mObj = monthOptions.find(m => m.value === selectedMonth);
          if (mObj) periodLabel = `${mObj.label}, ${toBanglaDigits(selectedYear)}`;
        }

        setReportData({
          cellName,
          periodLabel,
          employees: employeesArr,
          totals,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateReport();
    }
  }, [isOpen, selectedYear, selectedMonth, selectedCellId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Screen only */}
        <div className="no-print p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100">
                সমাপনী সামারি রিপোর্ট তৈরি করুন
              </h3>
              <p className="text-xs text-slate-500">
                সেল-ওয়াইজ নাইট ডিউটি, হলিডে ও লেট সিটিং সম্মানী ভাতার চূড়ান্ত সমাপনী প্রতিবেদন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !reportData}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Printer size={15} />
              প্রিন্ট / PDF করুন
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar - Screen only */}
        <div className="no-print p-4 bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Year Select */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Calendar size={12} />
              বছর নির্বাচন
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="2026">২০২৬ খ্রি.</option>
              <option value="2025">২০২৫ খ্রি.</option>
              <option value="2027">২০২৭ খ্রি.</option>
            </select>
          </div>

          {/* Month Select */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Calendar size={12} />
              মাস নির্বাচন
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
            >
              {monthOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Cell Select */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Building2 size={12} />
              সেল/বিভাগ নির্বাচন
            </label>
            <select
              value={selectedCellId}
              onChange={(e) => setSelectedCellId(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">সকল সেল (All Cells)</option>
              {availableCells.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Report Content - Print Friendly Printable Layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 print:p-0 print:overflow-visible print:bg-white print:text-black">
          <style jsx global>{`
            @media print {
              body {
                font-size: 13px !important;
                background: #fff !important;
                color: #000 !important;
              }
              table {
                font-size: 12px !important;
                width: 100% !important;
              }
              th, td {
                font-size: 12px !important;
                padding: 6px 8px !important;
                border-color: #333 !important;
              }
              .print-font-lg {
                font-size: 14px !important;
              }
              .print-font-md {
                font-size: 12px !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span>সমাপনী সামারি রিপোর্ট তৈরি হচ্ছে...</span>
            </div>
          ) : reportData ? (
            <div className="space-y-6 print:space-y-4 font-sans max-w-4xl mx-auto">
              {/* Official Header Block */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 print:text-black">
                  জনতা ব্যাংক পিএলসি.
                </h1>
                <h2 className="text-sm sm:text-base font-semibold text-slate-700 print:text-slate-800">
                  অনলাইন ব্যাংকিং ডিপার্টমেন্ট, প্রধান কার্যালয়, ঢাকা
                </h2>
                <div className="pt-2">
                  <span className="inline-block px-4 py-1 bg-slate-100 print:bg-slate-200 text-slate-900 font-bold text-xs sm:text-sm rounded-full border border-slate-300">
                    সম্মানী ভাতা ও ডিউটি সমাপনী সামারি রিপোর্ট ({reportData.periodLabel})
                  </span>
                </div>
                <p className="text-xs text-slate-600 pt-1 font-semibold">
                  সেল: <strong className="text-slate-900">{reportData.cellName}</strong>
                </p>
              </div>

              {/* KPI Key Figures Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 print:bg-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">মোট কর্মচারী</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {toBanglaDigits(reportData.employees.length)} জন
                  </span>
                </div>
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 print:bg-slate-100 rounded-xl border border-blue-100 dark:border-blue-900/40 text-center">
                  <span className="text-[10px] font-bold text-blue-600 block">লেট সিটিং (দিন/টাকা)</span>
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-300">
                    {toBanglaDigits(reportData.totals.lateDays)} দিন / ৳{toBanglaDigits(reportData.totals.lateBill.toLocaleString('bn-BD'))}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 print:bg-slate-100 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-center">
                  <span className="text-[10px] font-bold text-emerald-600 block">ছুটির দিন (দিন/টাকা)</span>
                  <span className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                    {toBanglaDigits(reportData.totals.holidayDays)} দিন / ৳{toBanglaDigits(reportData.totals.holidayBill.toLocaleString('bn-BD'))}
                  </span>
                </div>
                <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 print:bg-slate-100 rounded-xl border border-purple-100 dark:border-purple-900/40 text-center">
                  <span className="text-[10px] font-bold text-purple-600 block">সর্বমোট প্রদেয় বিল</span>
                  <span className="text-sm font-bold text-purple-950 dark:text-purple-300">
                    ৳{toBanglaDigits(reportData.totals.totalBill.toLocaleString('bn-BD'))}
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-300 dark:border-slate-700 text-center">
                      <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-10">ক্র.মি.</th>
                      <th className="p-2 border-r border-slate-300 dark:border-slate-700 text-left">কর্মকর্তা/কর্মচারীর নাম ও পদবী</th>
                      <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-20">ব্যাংক আইডি</th>
                      <th className="p-2 border-r border-slate-300 dark:border-slate-700">লেট সিটিং (দিন)</th>
                      <th className="p-2 border-r border-slate-300 dark:border-slate-700">ছুটির দিন (দিন)</th>
                      <th className="p-2 border-r border-slate-300 dark:border-slate-700">নাইট শিফট (দিন)</th>
                      <th className="p-2 border-r border-slate-300 dark:border-slate-700">মোট দিন</th>
                      <th className="p-2 text-right">মোট প্রাপ্য বিল (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {reportData.employees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-400">
                          কোনো ডিউটি রেকর্ড পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      reportData.employees.map((emp, idx) => (
                        <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800 font-semibold">{toBanglaDigits(idx + 1)}</td>
                          <td className="p-2 border-r border-slate-200 dark:border-slate-800">
                            <span className="font-bold block text-slate-900 dark:text-slate-100">{emp.name}</span>
                            <span className="text-[10px] text-slate-500 block">{emp.designation}</span>
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300">{toBanglaDigits(emp.bankId)}</td>
                          <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800 font-semibold">{toBanglaDigits(emp.lateDays)}</td>
                          <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800 font-semibold">{toBanglaDigits(emp.holidayDays)}</td>
                          <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800 font-semibold">{toBanglaDigits(emp.nightDays)}</td>
                          <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold">{toBanglaDigits(emp.totalDays)}</td>
                          <td className="p-2 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                            ৳{toBanglaDigits(emp.totalBill.toLocaleString('bn-BD'))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold border-t-2 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                      <td colSpan={3} className="p-2 text-right border-r border-slate-300 dark:border-slate-700">সর্বমোট (Total):</td>
                      <td className="p-2 text-center border-r border-slate-300 dark:border-slate-700">{toBanglaDigits(reportData.totals.lateDays)}</td>
                      <td className="p-2 text-center border-r border-slate-300 dark:border-slate-700">{toBanglaDigits(reportData.totals.holidayDays)}</td>
                      <td className="p-2 text-center border-r border-slate-300 dark:border-slate-700">{toBanglaDigits(reportData.totals.nightDays)}</td>
                      <td className="p-2 text-center border-r border-slate-300 dark:border-slate-700">{toBanglaDigits(reportData.totals.totalDays)}</td>
                      <td className="p-2 text-right font-mono text-sm text-primary dark:text-sky-400">
                        ৳{toBanglaDigits(reportData.totals.totalBill.toLocaleString('bn-BD'))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount in Words */}
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                কথায়: <strong>{getBanglaNumberWords(reportData.totals.totalBill)} টাকা মাত্র।</strong>
              </p>

              {/* Signature Block */}
              <div className="pt-16 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-800 dark:text-slate-200 print:text-black">
                <div className="space-y-1">
                  <div className="border-t border-slate-400 dark:border-slate-600 pt-1.5 w-3/4 mx-auto">
                    প্রস্তুতকারী
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="border-t border-slate-400 dark:border-slate-600 pt-1.5 w-3/4 mx-auto">
                    সেল ইনচার্জ
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="border-t border-slate-400 dark:border-slate-600 pt-1.5 w-3/4 mx-auto">
                    সহকারী মহাব্যবস্থাপক (এজিএম)
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
