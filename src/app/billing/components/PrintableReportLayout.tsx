import React from 'react';
import { Printer, ChevronLeft } from 'lucide-react';
import { getBanglaDate, getBanglaNumberWords, toBanglaDigits } from '@/lib/bengali-converter';

interface PayeeSummaryItem {
  payeeName: string;
  designation?: string;
  billCount: number;
  transportAllowance?: number;
  apyaonAllowance?: number;
  grandTotal: number;
}

interface EmployeeBreakdownItem {
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

interface ReportDataStructure {
  totalBillsCount: number;
  totalDays: number;
  totalTransport: number;
  totalApyaon: number;
  grandTotal: number;
  lateSittingAmount: number;
  holidayAmount: number;
  nightShiftAmount: number;
  employeesBreakdown: EmployeeBreakdownItem[];
  payeesSummary: PayeeSummaryItem[];
  totalLateDays: number;
  totalLateAmount: number;
  totalHolidayDays: number;
  totalHolidayAmount: number;
  totalNightDays: number;
  totalNightAmount: number;
  totalDaysSum: number;
  grandTotalSum: number;
}

interface PrintableReportLayoutProps {
  reportData: ReportDataStructure;
  reportDate: string;
  setIsReportPrintMode: (val: boolean) => void;
}

export default function PrintableReportLayout({
  reportData,
  reportDate,
  setIsReportPrintMode,
}: PrintableReportLayoutProps) {
  const { 
    totalBillsCount, 
    totalDays, 
    totalTransport, 
    totalApyaon, 
    grandTotal, 
    lateSittingAmount, 
    holidayAmount, 
    nightShiftAmount, 
    employeesBreakdown = [],
    payeesSummary = [],
    totalLateDays,
    totalLateAmount,
    totalHolidayDays,
    totalHolidayAmount,
    totalNightDays,
    totalNightAmount,
    totalDaysSum,
    grandTotalSum
  } = reportData;

  return (
    <div className="print-report-layout max-w-4xl mx-auto bg-white p-8 border border-slate-200 shadow-md font-sans text-black" style={{ fontFamily: "'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', sans-serif", color: '#000', lineHeight: '1.4' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 1in !important;
          }
          .no-print { display: none !important; }
          body {
            background: #fff !important;
            color: #000 !important;
            font-family: 'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', sans-serif !important;
          }
          .print-report-layout {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}} />

      {/* Back Controls (No-print) */}
      <div className="no-print flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <button
          onClick={() => setIsReportPrintMode(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>রিপোর্ট ভিউয়ে ফিরে যান</span>
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
        >
          <Printer size={16} />
          <span>প্রিন্ট করুন (Print Report)</span>
        </button>
      </div>

      {/* Header Statement */}
      <div className="text-center space-y-1 mb-6">
        <h2 className="text-xl font-bold">জনতা ব্যাংক পিএলসি.</h2>
        <h3 className="text-base font-semibold">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h3>
        <p className="text-xs text-slate-700">প্রধান কার্যালয়, ঢাকা</p>
        <div className="pt-2">
          <h4 className="text-sm font-bold underline inline-block">
            ডিউটি বিল সারসংক্ষেপ ও প্রাপক বিবরণী
          </h4>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          তারিখ: {getBanglaDate(reportDate)}
        </p>
      </div>

      {/* Summary Box */}
      <div className="mb-6 p-4 border border-black rounded-lg bg-slate-50/50">
        <h5 className="font-bold text-xs mb-2 border-b border-black/20 pb-1">সারসংক্ষেপ তথ্য (Overview):</h5>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p><strong>মোট প্রস্তুতকৃত বিল:</strong> {toBanglaDigits(totalBillsCount)} টি</p>
            <p><strong>মোট কার্যকর দিন:</strong> {toBanglaDigits(totalDays)} দিন</p>
            <p><strong>মোট যাতায়াত ভাতা:</strong> {toBanglaDigits(totalTransport)}/- টাকা</p>
            <p><strong>মোট আপ্যায়ন ভাতা:</strong> {toBanglaDigits(totalApyaon)}/- টাকা</p>
          </div>
          <div>
            <p><strong>লেট-সিটিং ভাতা:</strong> {toBanglaDigits(lateSittingAmount)}/- টাকা</p>
            <p><strong>ছুটির দিন ভাতা:</strong> {toBanglaDigits(holidayAmount)}/- টাকা</p>
            <p><strong>নাইট শিফট ভাতা:</strong> {toBanglaDigits(nightShiftAmount)}/- টাকা</p>
            <p className="text-sm font-extrabold text-indigo-900 mt-1">
              <strong>সর্বমোট দাবীকৃত অর্থ:</strong> {toBanglaDigits(grandTotal)}/- টাকা
            </p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-black/20 text-xs font-bold">
          কথায়: {getBanglaNumberWords(grandTotal)} মাত্র।
        </div>
      </div>

      {/* Table: Payee Wise Summary for Accounts */}
      <div className="mb-6">
        <h3 className="text-sm font-bold mb-2">১. প্রাপক অনুযায়ী বিল বিবরণী (Payee-wise Summary for Accounts):</h3>
        <table className="w-full text-xs border-collapse" style={{ border: '1px solid #000' }}>
          <thead>
            <tr className="bg-slate-50 text-center font-bold" style={{ borderBottom: '1px solid #000' }}>
              <th className="p-1.5 border-r border-black w-10" style={{ borderRight: '1px solid #000' }}>ক্রমিক</th>
              <th className="p-1.5 border-r border-black text-left pl-2" style={{ borderRight: '1px solid #000' }}>কর্মকর্তার নাম ও পদবী (Payee Name & Designation)</th>
              <th className="p-1.5 border-r border-black w-24 text-center" style={{ borderRight: '1px solid #000' }}>বিলের সংখ্যা</th>
              <th className="p-1.5 border-r border-black w-28 text-right pr-2" style={{ borderRight: '1px solid #000' }}>যাতায়াত ভাতা</th>
              <th className="p-1.5 border-r border-black w-28 text-right pr-2" style={{ borderRight: '1px solid #000' }}>আপ্যায়ন ভাতা</th>
              <th className="p-1.5 text-right pr-4 w-36">মোট বিলের পরিমাণ (টাকা)</th>
            </tr>
          </thead>
          <tbody>
            {payeesSummary.map((payee: PayeeSummaryItem, idx: number) => {
              return (
                <tr key={idx} style={{ borderTop: '1px solid #000' }}>
                  <td className="p-1.5 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(idx + 1)}</td>
                  <td className="p-1.5 border-r border-black text-left pl-2 font-bold" style={{ borderRight: '1px solid #000' }}>
                    {payee.payeeName} {payee.designation ? `(${payee.designation})` : ''}
                  </td>
                  <td className="p-1.5 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(payee.billCount)} টি</td>
                  <td className="p-1.5 border-r border-black text-right pr-2 font-bold" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(payee.transportAllowance || 0)}/-</td>
                  <td className="p-1.5 border-r border-black text-right pr-2 font-bold" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(payee.apyaonAllowance || 0)}/-</td>
                  <td className="p-1.5 text-right pr-4 font-bold">{toBanglaDigits(payee.grandTotal)}/-</td>
                </tr>
              );
            })}
            <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <td className="p-1.5 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}></td>
              <td className="p-1.5 border-r border-black text-left pl-2 font-bold" style={{ borderRight: '1px solid #000' }}>সর্বমোট</td>
              <td className="p-1.5 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: PayeeSummaryItem) => sum + p.billCount, 0))} টি
              </td>
              <td className="p-1.5 border-r border-black text-right pr-2 font-bold" style={{ borderRight: '1px solid #000' }}>
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: PayeeSummaryItem) => sum + (p.transportAllowance || 0), 0))}/-
              </td>
              <td className="p-1.5 border-r border-black text-right pr-2 font-bold" style={{ borderRight: '1px solid #000' }}>
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: PayeeSummaryItem) => sum + (p.apyaonAllowance || 0), 0))}/-
              </td>
              <td className="p-1.5 text-right pr-4 font-bold">
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: PayeeSummaryItem) => sum + p.grandTotal, 0))}/-
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table: Employee Breakdown for Print */}
      <div className="mb-8">
        <h3 className="text-sm font-bold mb-2">২. কর্মকর্তা ভিত্তিক সমন্বিত প্রাপ্তির বিবরণী (Payee Detailed Statement):</h3>
        <table className="w-full text-xs border-collapse" style={{ border: '1px solid #000' }}>
          <thead>
            <tr className="bg-slate-50 text-center font-bold" style={{ borderBottom: '1px solid #000' }}>
              <th className="p-1 border-r border-black w-7" style={{ borderRight: '1px solid #000' }}>#</th>
              <th className="p-1 border-r border-black w-36" style={{ borderRight: '1px solid #000', textAlign: 'left', paddingLeft: '4px' }}>কর্মকর্তার নাম</th>
              <th className="p-1 border-r border-black w-32" style={{ borderRight: '1px solid #000', textAlign: 'left', paddingLeft: '4px' }}>পদবী</th>
              <th className="p-1 border-r border-black w-24" style={{ borderRight: '1px solid #000' }}>লেট-সিটিং (দিন/টাকা)</th>
              <th className="p-1 border-r border-black w-24" style={{ borderRight: '1px solid #000' }}>ছুটির দিন (দিন/টাকা)</th>
              <th className="p-1 border-r border-black w-24" style={{ borderRight: '1px solid #000' }}>নাইট শিফট (দিন/টাকা)</th>
              <th className="p-1 border-r border-black w-12" style={{ borderRight: '1px solid #000' }}>মোট দিন</th>
              <th className="p-1 border-r border-black text-right pr-2 w-24" style={{ borderRight: '1px solid #000' }}>সর্বমোট (টাকা)</th>
              <th className="p-1 text-center w-16">কর্তন</th>
            </tr>
          </thead>
          <tbody>
            {employeesBreakdown.map((record: EmployeeBreakdownItem, idx: number) => (
              <tr key={idx} style={{ borderTop: '1px solid #000' }}>
                <td className="p-1 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(idx + 1)}</td>
                <td className="p-1 border-r border-black font-bold" style={{ borderRight: '1px solid #000', textAlign: 'left', paddingLeft: '4px' }}>{record.employeeName}</td>
                <td className="p-1 border-r border-black" style={{ borderRight: '1px solid #000', textAlign: 'left', paddingLeft: '4px' }}>{record.designation}</td>
                <td className="p-1 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>
                  {record.lateSittingDays > 0 ? `${toBanglaDigits(record.lateSittingDays)} (${toBanglaDigits(record.lateSittingAmount)}/-)` : '-'}
                </td>
                <td className="p-1 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>
                  {record.holidayDays > 0 ? `${toBanglaDigits(record.holidayDays)} (${toBanglaDigits(record.holidayAmount)}/-)` : '-'}
                </td>
                <td className="p-1 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>
                  {record.nightShiftDays > 0 ? `${toBanglaDigits(record.nightShiftDays)} (${toBanglaDigits(record.nightShiftAmount)}/-)` : '-'}
                </td>
                <td className="p-1 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>
                  {toBanglaDigits(record.totalDays)}
                </td>
                <td className="p-1 border-r border-black text-right pr-2 font-bold" style={{ borderRight: '1px solid #000' }}>
                  {toBanglaDigits(record.grandTotal)}/-
                </td>
                <td className="p-1 text-center font-medium">
                  {record.deduction || record.deductions ? `${toBanglaDigits(record.deduction || record.deductions || 0)}/-` : '-'}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <td colSpan={3} className="p-1.5 border-r border-black text-right pr-2" style={{ borderRight: '1px solid #000' }}>মোট যোগফল:</td>
              <td className="p-1.5 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>
                {toBanglaDigits(totalLateDays)} ({toBanglaDigits(totalLateAmount)}/-)
              </td>
              <td className="p-1.5 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>
                {toBanglaDigits(totalHolidayDays)} ({toBanglaDigits(totalHolidayAmount)}/-)
              </td>
              <td className="p-1.5 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>
                {toBanglaDigits(totalNightDays)} ({toBanglaDigits(totalNightAmount)}/-)
              </td>
              <td className="p-1.5 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>
                {toBanglaDigits(totalDaysSum)} দিন
              </td>
              <td className="p-1.5 border-r border-black text-right pr-2 font-bold" style={{ borderRight: '1px solid #000' }}>
                {toBanglaDigits(grandTotalSum)}/-
              </td>
              <td className="p-1.5 text-center">-</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature Section */}
      <div className="mt-16 flex justify-between items-end text-xs font-semibold">
        <div className="text-center space-y-1">
          <div className="w-40 border-t border-black mb-1"></div>
          <p>প্রস্তুতকারী</p>
          <p className="text-[10px] text-slate-500">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
        </div>
        <div className="text-center space-y-1">
          <div className="w-40 border-t border-black mb-1"></div>
          <p>যাচাইকারী কর্মকর্তা</p>
          <p className="text-[10px] text-slate-500">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
        </div>
        <div className="text-center space-y-1">
          <div className="w-40 border-t border-black mb-1"></div>
          <p>অনুমোদনকারী কর্মকর্তা</p>
          <p className="text-[10px] text-slate-500">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
        </div>
      </div>
    </div>
  );
}
