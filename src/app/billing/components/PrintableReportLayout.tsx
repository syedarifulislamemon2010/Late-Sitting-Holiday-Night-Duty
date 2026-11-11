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
      className="print-report-layout max-w-4xl mx-auto bg-white p-6 border border-slate-200 shadow-md font-sans text-black"
      style={{
        fontFamily: "'Kalpurush', 'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
        color: '#000',
        fontSize: '11pt',
        lineHeight: '1.35',
        boxSizing: 'border-box',
        width: '100%'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: auto;
            margin: 6mm 8mm !important;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          .no-print { display: none !important; }
          html, body {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            font-family: 'Kalpurush', 'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-report-layout {
            border: none !important;
            box-shadow: none !important;
            padding: 4mm 6mm !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            box-sizing: border-box !important;
          }
          th, td {
            box-sizing: border-box !important;
            border: 1px solid #000 !important;
            padding: 3px 4px !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
        }
      `}} />

      {/* Back Controls (No-print) */}
      <div className="no-print flex items-center justify-between mb-5 pb-3 border-b border-slate-200">
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
      <div className="text-center space-y-0.5 mb-3.5">
        <h2 className="font-bold tracking-tight" style={{ fontSize: '15.5pt', lineHeight: '1.2' }}>জনতা ব্যাংক পিএলসি.</h2>
        <h3 className="font-bold" style={{ fontSize: '13pt', lineHeight: '1.2' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h3>
        <p className="text-slate-700" style={{ fontSize: '10.5pt', lineHeight: '1.2' }}>প্রধান কার্যালয়, ঢাকা</p>
        <div className="pt-1">
          <h4 className="font-bold underline inline-block" style={{ fontSize: '12.5pt' }}>
            ডিউটি বিল সারসংক্ষেপ ও প্রাপক বিবরণী
          </h4>
        </div>
        <p className="text-slate-700 mt-0.5 font-semibold" style={{ fontSize: '10.5pt' }}>
          তারিখ: {getBanglaDate(reportDate)}
        </p>
      </div>

      {/* Summary Box */}
      <div className="mb-3.5 p-3 border border-black rounded-lg bg-slate-50/50" style={{ fontSize: '10.5pt' }}>
        <h5 className="font-bold mb-1 border-b border-black/30 pb-0.5" style={{ fontSize: '11pt' }}>সারসংক্ষেপ তথ্য (Overview):</h5>
        <div className="grid grid-cols-2 gap-2" style={{ fontSize: '10.5pt' }}>
          <div className="space-y-0.5">
            <p><strong>মোট প্রস্তুতকৃত বিল:</strong> {toBanglaDigits(totalBillsCount)} টি</p>
            <p><strong>মোট কার্যকর দিন:</strong> {toBanglaDigits(totalDays)} দিন</p>
            <p><strong>মোট যাতায়াত ভাতা:</strong> {toBanglaDigits(totalTransport)}/- টাকা</p>
            <p><strong>মোট আপ্যায়ন ভাতা:</strong> {toBanglaDigits(totalApyaon)}/- টাকা</p>
          </div>
          <div className="space-y-0.5">
            <p><strong>লেট-সিটিং ভাতা:</strong> {toBanglaDigits(lateSittingAmount)}/- টাকা</p>
            <p><strong>ছুটির দিন ভাতা:</strong> {toBanglaDigits(holidayAmount)}/- টাকা</p>
            <p><strong>নাইট শিফট ভাতা:</strong> {toBanglaDigits(nightShiftAmount)}/- টাকা</p>
            <p className="font-extrabold text-black mt-0.5">
              <strong>সর্বমোট দাবীকৃত অর্থ:</strong> {toBanglaDigits(grandTotal)}/- টাকা
            </p>
          </div>
        </div>
        <div className="mt-1 pt-1 border-t border-black/30 font-bold" style={{ fontSize: '10.5pt' }}>
          কথায়: {getBanglaNumberWords(grandTotal)} মাত্র।
        </div>
      </div>

      {/* Table 1: Payee Wise Summary for Accounts */}
      <div className="mb-3.5">
        <h3 className="font-bold mb-1" style={{ fontSize: '11.5pt' }}>১. প্রাপক অনুযায়ী বিল বিবরণী (Payee-wise Summary for Accounts):</h3>
        <table className="w-full border-collapse" style={{ border: '1px solid #000', tableLayout: 'fixed', fontSize: '10.5pt', width: '100%' }}>
          <thead>
            <tr className="bg-slate-50 text-center font-bold" style={{ borderBottom: '1px solid #000' }}>
              <th className="text-center font-bold" style={{ border: '1px solid #000', width: '5%', padding: '4px 2px' }}>ক্রমিক</th>
              <th className="text-left font-bold" style={{ border: '1px solid #000', width: '39%', padding: '4px 6px' }}>কর্মকর্তার নাম ও পদবী (Payee Name & Designation)</th>
              <th className="text-center font-bold" style={{ border: '1px solid #000', width: '12%', padding: '4px 2px' }}>বিলের সংখ্যা</th>
              <th className="text-right font-bold" style={{ border: '1px solid #000', width: '14%', padding: '4px 6px' }}>যাতায়াত ভাতা</th>
              <th className="text-right font-bold" style={{ border: '1px solid #000', width: '14%', padding: '4px 6px' }}>আপ্যায়ন ভাতা</th>
              <th className="text-right font-bold" style={{ border: '1px solid #000', width: '16%', padding: '4px 6px' }}>মোট বিলের পরিমাণ (টাকা)</th>
            </tr>
          </thead>
          <tbody>
            {payeesSummary.map((payee: PayeeSummaryItem, idx: number) => {
              return (
                <tr key={idx} style={{ borderTop: '1px solid #000' }}>
                  <td className="text-center" style={{ border: '1px solid #000', padding: '3px 2px' }}>{toBanglaDigits(idx + 1)}</td>
                  <td className="text-left font-bold" style={{ border: '1px solid #000', padding: '3px 6px' }}>
                    {payee.payeeName} {payee.designation ? `(${payee.designation})` : ''}
                  </td>
                  <td className="text-center" style={{ border: '1px solid #000', padding: '3px 2px' }}>{toBanglaDigits(payee.billCount)} টি</td>
                  <td className="text-right font-bold" style={{ border: '1px solid #000', padding: '3px 6px' }}>{toBanglaDigits(payee.transportAllowance || 0)}/-</td>
                  <td className="text-right font-bold" style={{ border: '1px solid #000', padding: '3px 6px' }}>{toBanglaDigits(payee.apyaonAllowance || 0)}/-</td>
                  <td className="text-right font-bold" style={{ border: '1px solid #000', padding: '3px 6px' }}>{toBanglaDigits(payee.grandTotal)}/-</td>
                </tr>
              );
            })}
            <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <td className="text-center" style={{ border: '1px solid #000', padding: '3px 2px' }}></td>
              <td className="text-left font-bold" style={{ border: '1px solid #000', padding: '3px 6px' }}>সর্বমোট</td>
              <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '3px 2px' }}>
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: PayeeSummaryItem) => sum + p.billCount, 0))} টি
              </td>
              <td className="text-right font-bold" style={{ border: '1px solid #000', padding: '3px 6px' }}>
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: PayeeSummaryItem) => sum + (p.transportAllowance || 0), 0))}/-
              </td>
              <td className="text-right font-bold" style={{ border: '1px solid #000', padding: '3px 6px' }}>
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: PayeeSummaryItem) => sum + (p.apyaonAllowance || 0), 0))}/-
              </td>
              <td className="text-right font-bold" style={{ border: '1px solid #000', padding: '3px 6px' }}>
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: PayeeSummaryItem) => sum + p.grandTotal, 0))}/-
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2: Employee Breakdown for Print */}
      <div className="mb-3">
        <h3 className="font-bold mb-1" style={{ fontSize: '11.5pt' }}>২. কর্মকর্তা ভিত্তিক সমন্বিত প্রাপ্তির বিবরণী (Payee Detailed Statement):</h3>
        <table className="w-full border-collapse" style={{ border: '1px solid #000', tableLayout: 'fixed', fontSize: '10pt', width: '100%' }}>
          <thead>
            <tr className="bg-slate-50 text-center font-bold" style={{ borderBottom: '1px solid #000' }}>
              <th className="text-center font-bold" style={{ border: '1px solid #000', width: '4%', padding: '3px 2px' }}>#</th>
              <th className="text-left font-bold" style={{ border: '1px solid #000', width: '19%', padding: '3px 4px' }}>কর্মকর্তার নাম</th>
              <th className="text-left font-bold" style={{ border: '1px solid #000', width: '17%', padding: '3px 4px' }}>পদবী</th>
              <th className="text-center font-bold" style={{ border: '1px solid #000', width: '12%', padding: '3px 2px' }}>
                <div>লেট-সিটিং</div>
                <div style={{ fontSize: '8pt', fontWeight: 'normal' }}>(দিন/টাকা)</div>
              </th>
              <th className="text-center font-bold" style={{ border: '1px solid #000', width: '12%', padding: '3px 2px' }}>
                <div>ছুটির দিন</div>
                <div style={{ fontSize: '8pt', fontWeight: 'normal' }}>(দিন/টাকা)</div>
              </th>
              <th className="text-center font-bold" style={{ border: '1px solid #000', width: '12%', padding: '3px 2px' }}>
                <div>নাইট শিফট</div>
                <div style={{ fontSize: '8pt', fontWeight: 'normal' }}>(দিন/টাকা)</div>
              </th>
              <th className="text-center font-bold" style={{ border: '1px solid #000', width: '7%', padding: '3px 2px' }}>মোট দিন</th>
              <th className="text-right font-bold" style={{ border: '1px solid #000', width: '10.5%', padding: '3px 4px' }}>
                <div>সর্বমোট</div>
                <div style={{ fontSize: '8pt', fontWeight: 'normal' }}>(টাকা)</div>
              </th>
              <th className="text-center font-bold" style={{ border: '1px solid #000', width: '6.5%', padding: '3px 2px', whiteSpace: 'nowrap' }}>কর্তন</th>
            </tr>
          </thead>
          <tbody>
            {employeesBreakdown.map((record: EmployeeBreakdownItem, idx: number) => (
              <tr key={idx} style={{ borderTop: '1px solid #000' }}>
                <td className="text-center" style={{ border: '1px solid #000', padding: '3px 2px' }}>{toBanglaDigits(idx + 1)}</td>
                <td className="font-bold text-left" style={{ border: '1px solid #000', padding: '3px 4px' }}>{record.employeeName}</td>
                <td className="text-left" style={{ border: '1px solid #000', padding: '3px 4px' }}>{record.designation}</td>
                <td className="text-center" style={{ border: '1px solid #000', padding: '3px 2px' }}>
                  {record.lateSittingDays > 0 ? `${toBanglaDigits(record.lateSittingDays)} (${toBanglaDigits(record.lateSittingAmount)}/-)` : '-'}
                </td>
                <td className="text-center" style={{ border: '1px solid #000', padding: '3px 2px' }}>
                  {record.holidayDays > 0 ? `${toBanglaDigits(record.holidayDays)} (${toBanglaDigits(record.holidayAmount)}/-)` : '-'}
                </td>
                <td className="text-center" style={{ border: '1px solid #000', padding: '3px 2px' }}>
                  {record.nightShiftDays > 0 ? `${toBanglaDigits(record.nightShiftDays)} (${toBanglaDigits(record.nightShiftAmount)}/-)` : '-'}
                </td>
                <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '3px 2px' }}>
                  {toBanglaDigits(record.totalDays)}
                </td>
                <td className="text-right font-bold" style={{ border: '1px solid #000', padding: '3px 4px' }}>
                  {toBanglaDigits(record.grandTotal)}/-
                </td>
                <td className="text-center font-medium" style={{ border: '1px solid #000', padding: '3px 2px' }}>
                  {record.deduction || record.deductions ? `${toBanglaDigits(record.deduction || record.deductions || 0)}/-` : ''}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <td colSpan={3} className="text-right pr-2 font-bold" style={{ border: '1px solid #000', padding: '3px 6px' }}>মোট যোগফল:</td>
              <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '3px 2px' }}>
                {toBanglaDigits(totalLateDays)} ({toBanglaDigits(totalLateAmount)}/-)
              </td>
              <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '3px 2px' }}>
                {toBanglaDigits(totalHolidayDays)} ({toBanglaDigits(totalHolidayAmount)}/-)
              </td>
              <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '3px 2px' }}>
                {toBanglaDigits(totalNightDays)} ({toBanglaDigits(totalNightAmount)}/-)
              </td>
              <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '3px 2px' }}>
                {toBanglaDigits(totalDaysSum)} দিন
              </td>
              <td className="text-right font-bold" style={{ border: '1px solid #000', padding: '3px 4px' }}>
                {toBanglaDigits(grandTotalSum)}/-
              </td>
              <td className="text-center" style={{ border: '1px solid #000', padding: '3px 2px' }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
