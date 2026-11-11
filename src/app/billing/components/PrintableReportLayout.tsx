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
    <div
      className="print-report-layout max-w-5xl mx-auto bg-white p-8 border border-slate-200 shadow-md font-sans text-black"
      style={{
        fontFamily: "'Kalpurush', 'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
        color: '#000',
        fontSize: '12pt',
        lineHeight: '1.4'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 12mm 15mm !important;
          }
          .no-print { display: none !important; }
          body {
            background: #fff !important;
            color: #000 !important;
            font-family: 'Kalpurush', 'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', sans-serif !important;
            font-size: 12pt !important;
          }
          .print-report-layout {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            font-size: 12pt !important;
            line-height: 1.35 !important;
          }
          table {
            font-size: 12pt !important;
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            font-size: 12pt !important;
            border: 1px solid #000 !important;
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
      <div className="text-center space-y-1 mb-5">
        <h2 className="font-bold tracking-tight" style={{ fontSize: '18pt' }}>জনতা ব্যাংক পিএলসি.</h2>
        <h3 className="font-bold" style={{ fontSize: '14pt' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h3>
        <p className="text-slate-700" style={{ fontSize: '12pt' }}>প্রধান কার্যালয়, ঢাকা</p>
        <div className="pt-2">
          <h4 className="font-bold underline inline-block" style={{ fontSize: '14pt' }}>
            ডিউটি বিল সারসংক্ষেপ ও প্রাপক বিবরণী
          </h4>
        </div>
        <p className="text-slate-700 mt-1 font-semibold" style={{ fontSize: '12pt' }}>
          তারিখ: {getBanglaDate(reportDate)}
        </p>
      </div>

      {/* Summary Box */}
      <div className="mb-5 p-4 border border-black rounded-lg bg-slate-50/50" style={{ fontSize: '12pt' }}>
        <h5 className="font-bold mb-2 border-b border-black/30 pb-1" style={{ fontSize: '12pt' }}>সারসংক্ষেপ তথ্য (Overview):</h5>
        <div className="grid grid-cols-2 gap-4" style={{ fontSize: '12pt' }}>
          <div className="space-y-1">
            <p><strong>মোট প্রস্তুতকৃত বিল:</strong> {toBanglaDigits(totalBillsCount)} টি</p>
            <p><strong>মোট কার্যকর দিন:</strong> {toBanglaDigits(totalDays)} দিন</p>
            <p><strong>মোট যাতায়াত ভাতা:</strong> {toBanglaDigits(totalTransport)}/- টাকা</p>
            <p><strong>মোট আপ্যায়ন ভাতা:</strong> {toBanglaDigits(totalApyaon)}/- টাকা</p>
          </div>
          <div className="space-y-1">
            <p><strong>লেট-সিটিং ভাতা:</strong> {toBanglaDigits(lateSittingAmount)}/- টাকা</p>
            <p><strong>ছুটির দিন ভাতা:</strong> {toBanglaDigits(holidayAmount)}/- টাকা</p>
            <p><strong>নাইট শিফট ভাতা:</strong> {toBanglaDigits(nightShiftAmount)}/- টাকা</p>
            <p className="font-extrabold text-black mt-1">
              <strong>সর্বমোট দাবীকৃত অর্থ:</strong> {toBanglaDigits(grandTotal)}/- টাকা
            </p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-black/30 font-bold" style={{ fontSize: '12pt' }}>
          কথায়: {getBanglaNumberWords(grandTotal)} মাত্র।
        </div>
      </div>

      {/* Table 1: Payee Wise Summary for Accounts */}
      <div className="mb-5">
        <h3 className="font-bold mb-2" style={{ fontSize: '13pt' }}>১. প্রাপক অনুযায়ী বিল বিবরণী (Payee-wise Summary for Accounts):</h3>
        <table className="w-full border-collapse" style={{ border: '1px solid #000', fontSize: '12pt' }}>
          <thead>
            <tr className="bg-slate-50 text-center font-bold" style={{ borderBottom: '1px solid #000' }}>
              <th className="p-2 border-r border-black w-12 text-center" style={{ border: '1px solid #000' }}>ক্রমিক</th>
              <th className="p-2 border-r border-black text-left pl-3" style={{ border: '1px solid #000' }}>কর্মকর্তার নাম ও পদবী (Payee Name & Designation)</th>
              <th className="p-2 border-r border-black w-28 text-center" style={{ border: '1px solid #000' }}>বিলের সংখ্যা</th>
              <th className="p-2 border-r border-black w-32 text-right pr-3" style={{ border: '1px solid #000' }}>যাতায়াত ভাতা</th>
              <th className="p-2 border-r border-black w-32 text-right pr-3" style={{ border: '1px solid #000' }}>আপ্যায়ন ভাতা</th>
              <th className="p-2 text-right pr-3 w-40" style={{ border: '1px solid #000' }}>মোট বিলের পরিমাণ (টাকা)</th>
            </tr>
          </thead>
          <tbody>
            {payeesSummary.map((payee: PayeeSummaryItem, idx: number) => {
              return (
                <tr key={idx} style={{ borderTop: '1px solid #000' }}>
                  <td className="p-2 border-r border-black text-center" style={{ border: '1px solid #000' }}>{toBanglaDigits(idx + 1)}</td>
                  <td className="p-2 border-r border-black text-left pl-3 font-bold" style={{ border: '1px solid #000' }}>
                    {payee.payeeName} {payee.designation ? `(${payee.designation})` : ''}
                  </td>
                  <td className="p-2 border-r border-black text-center" style={{ border: '1px solid #000' }}>{toBanglaDigits(payee.billCount)} টি</td>
                  <td className="p-2 border-r border-black text-right pr-3 font-bold" style={{ border: '1px solid #000' }}>{toBanglaDigits(payee.transportAllowance || 0)}/-</td>
                  <td className="p-2 border-r border-black text-right pr-3 font-bold" style={{ border: '1px solid #000' }}>{toBanglaDigits(payee.apyaonAllowance || 0)}/-</td>
                  <td className="p-2 text-right pr-3 font-bold" style={{ border: '1px solid #000' }}>{toBanglaDigits(payee.grandTotal)}/-</td>
                </tr>
              );
            })}
            <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <td className="p-2 border-r border-black text-center" style={{ border: '1px solid #000' }}></td>
              <td className="p-2 border-r border-black text-left pl-3 font-bold" style={{ border: '1px solid #000' }}>সর্বমোট</td>
              <td className="p-2 border-r border-black text-center font-bold" style={{ border: '1px solid #000' }}>
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: PayeeSummaryItem) => sum + p.billCount, 0))} টি
              </td>
              <td className="p-2 border-r border-black text-right pr-3 font-bold" style={{ border: '1px solid #000' }}>
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: PayeeSummaryItem) => sum + (p.transportAllowance || 0), 0))}/-
              </td>
              <td className="p-2 border-r border-black text-right pr-3 font-bold" style={{ border: '1px solid #000' }}>
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: PayeeSummaryItem) => sum + (p.apyaonAllowance || 0), 0))}/-
              </td>
              <td className="p-2 text-right pr-3 font-bold" style={{ border: '1px solid #000' }}>
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: PayeeSummaryItem) => sum + p.grandTotal, 0))}/-
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2: Employee Breakdown for Print */}
      <div className="mb-6">
        <h3 className="font-bold mb-2" style={{ fontSize: '13pt' }}>২. কর্মকর্তা ভিত্তিক সমন্বিত প্রাপ্তির বিবরণী (Payee Detailed Statement):</h3>
        <table className="w-full border-collapse" style={{ border: '1px solid #000', fontSize: '12pt' }}>
          <thead>
            <tr className="bg-slate-50 text-center font-bold" style={{ borderBottom: '1px solid #000' }}>
              <th className="p-2 border-r border-black w-8 text-center" style={{ border: '1px solid #000' }}>#</th>
              <th className="p-2 border-r border-black text-left pl-2" style={{ border: '1px solid #000' }}>কর্মকর্তার নাম</th>
              <th className="p-2 border-r border-black text-left pl-2" style={{ border: '1px solid #000' }}>পদবী</th>
              <th className="p-2 border-r border-black text-center" style={{ border: '1px solid #000' }}>লেট-সিটিং (দিন/টাকা)</th>
              <th className="p-2 border-r border-black text-center" style={{ border: '1px solid #000' }}>ছুটির দিন (দিন/টাকা)</th>
              <th className="p-2 border-r border-black text-center" style={{ border: '1px solid #000' }}>নাইট শিফট (দিন/টাকা)</th>
              <th className="p-2 border-r border-black w-16 text-center" style={{ border: '1px solid #000' }}>মোট দিন</th>
              <th className="p-2 border-r border-black text-right pr-2 w-28" style={{ border: '1px solid #000' }}>সর্বমোট (টাকা)</th>
              <th className="p-2 text-center w-16" style={{ border: '1px solid #000' }}>কর্তন</th>
            </tr>
          </thead>
          <tbody>
            {employeesBreakdown.map((record: EmployeeBreakdownItem, idx: number) => (
              <tr key={idx} style={{ borderTop: '1px solid #000' }}>
                <td className="p-2 border-r border-black text-center" style={{ border: '1px solid #000' }}>{toBanglaDigits(idx + 1)}</td>
                <td className="p-2 border-r border-black font-bold text-left pl-2" style={{ border: '1px solid #000' }}>{record.employeeName}</td>
                <td className="p-2 border-r border-black text-left pl-2" style={{ border: '1px solid #000' }}>{record.designation}</td>
                <td className="p-2 border-r border-black text-center" style={{ border: '1px solid #000' }}>
                  {record.lateSittingDays > 0 ? `${toBanglaDigits(record.lateSittingDays)} (${toBanglaDigits(record.lateSittingAmount)}/-)` : '-'}
                </td>
                <td className="p-2 border-r border-black text-center" style={{ border: '1px solid #000' }}>
                  {record.holidayDays > 0 ? `${toBanglaDigits(record.holidayDays)} (${toBanglaDigits(record.holidayAmount)}/-)` : '-'}
                </td>
                <td className="p-2 border-r border-black text-center" style={{ border: '1px solid #000' }}>
                  {record.nightShiftDays > 0 ? `${toBanglaDigits(record.nightShiftDays)} (${toBanglaDigits(record.nightShiftAmount)}/-)` : '-'}
                </td>
                <td className="p-2 border-r border-black text-center font-bold" style={{ border: '1px solid #000' }}>
                  {toBanglaDigits(record.totalDays)}
                </td>
                <td className="p-2 border-r border-black text-right pr-2 font-bold" style={{ border: '1px solid #000' }}>
                  {toBanglaDigits(record.grandTotal)}/-
                </td>
                <td className="p-2 text-center font-medium" style={{ border: '1px solid #000' }}>
                  {record.deduction || record.deductions ? `${toBanglaDigits(record.deduction || record.deductions || 0)}/-` : ''}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <td colSpan={3} className="p-2 border-r border-black text-right pr-2" style={{ border: '1px solid #000' }}>মোট যোগফল:</td>
              <td className="p-2 border-r border-black text-center" style={{ border: '1px solid #000' }}>
                {toBanglaDigits(totalLateDays)} ({toBanglaDigits(totalLateAmount)}/-)
              </td>
              <td className="p-2 border-r border-black text-center" style={{ border: '1px solid #000' }}>
                {toBanglaDigits(totalHolidayDays)} ({toBanglaDigits(totalHolidayAmount)}/-)
              </td>
              <td className="p-2 border-r border-black text-center" style={{ border: '1px solid #000' }}>
                {toBanglaDigits(totalNightDays)} ({toBanglaDigits(totalNightAmount)}/-)
              </td>
              <td className="p-2 border-r border-black text-center font-bold" style={{ border: '1px solid #000' }}>
                {toBanglaDigits(totalDaysSum)} দিন
              </td>
              <td className="p-2 border-r border-black text-right pr-2 font-bold" style={{ border: '1px solid #000' }}>
                {toBanglaDigits(grandTotalSum)}/-
              </td>
              <td className="p-2 text-center" style={{ border: '1px solid #000' }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
