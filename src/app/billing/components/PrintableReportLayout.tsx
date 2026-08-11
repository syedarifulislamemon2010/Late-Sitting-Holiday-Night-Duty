import React from 'react';
import { Printer, ChevronLeft } from 'lucide-react';
import { getBanglaDate, getBanglaNumberWords, toBanglaDigits } from '@/lib/bengali-converter';

interface PrintableReportLayoutProps {
  reportData: any;
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
    employeesBreakdown,
    payeesSummary,
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
      <div className="no-print flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <button
          onClick={() => setIsReportPrintMode(false)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft size={16} />
          প্রতিবেদন ভিউতে ফিরে যান
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          <Printer size={14} />
          প্রিন্ট করুন (Print)
        </button>
      </div>

      {/* Report Header */}
      <div className="text-center space-y-1 mb-6">
        <h1 className="text-2xl font-bold tracking-wide">জনতা ব্যাংক পিএলসি.</h1>
        <p className="text-base font-semibold">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
        <p className="text-sm text-slate-500 font-bold uppercase mt-1">লেট সিটিং হলিডে নাইট বিল স্টেটমেন্ট</p>
        <div className="w-full border-t border-double border-black my-2"></div>
        <div className="flex justify-between items-center text-sm font-bold px-2 pt-1">
          <span>প্রতিবেদনের তারিখ: {getBanglaDate(reportDate)}</span>
          <span>প্রস্তুতকাল: {new Date().toLocaleDateString('bn-BD')}</span>
        </div>
      </div>

      {/* KPI Summary Block for Print */}
      <div className="mb-6 p-4 border border-black rounded-lg">
        <h3 className="text-sm font-bold border-b border-black pb-1 mb-2">সংক্ষিপ্ত সারসংক্ষেপ (KPI Summary):</h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div><strong>মোট জেনারেটকৃত বিলের সংখ্যা:</strong> {toBanglaDigits(totalBillsCount)} টি</div>
          <div><strong>সর্বমোট প্রদেয় বিলের পরিমাণ:</strong> {toBanglaDigits(grandTotal)}/- টাকা</div>
          <div><strong>মোট ডিউটি কার্যদিবস:</strong> {toBanglaDigits(totalDays)} দিন</div>
          <div><strong>সর্বমোট প্রদেয় (কথায়):</strong> {getBanglaNumberWords(grandTotal)}</div>
          <div><strong>মোট যাতায়াত ভাতা:</strong> {toBanglaDigits(totalTransport)}/- টাকা</div>
          <div><strong>লেট-সিটিং বিল বাবদ:</strong> {toBanglaDigits(lateSittingAmount)}/- টাকা</div>
          <div><strong>মোট আপ্যায়ন ভাতা:</strong> {toBanglaDigits(totalApyaon)}/- টাকা</div>
          <div><strong>ছুটির দিনের বিল বাবদ:</strong> {toBanglaDigits(holidayAmount)}/- টাকা</div>
          <div><strong>রাত্রিকালীন শিফট বিল বাবদ:</strong> {toBanglaDigits(nightShiftAmount)}/- টাকা</div>
        </div>
      </div>

      {/* Table: Payee Bill Summary for Print */}
      <div className="mb-6">
        <h3 className="text-sm font-bold mb-2">১. কর্মকর্তা ভিত্তিক বিলের সারসংক্ষেপ (Payee Bill Summary):</h3>
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
            {payeesSummary.map((payee: any, idx: number) => {
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
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: any) => sum + p.billCount, 0))} টি
              </td>
              <td className="p-1.5 border-r border-black text-right pr-2 font-bold" style={{ borderRight: '1px solid #000' }}>
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: any) => sum + (p.transportAllowance || 0), 0))}/-
              </td>
              <td className="p-1.5 border-r border-black text-right pr-2 font-bold" style={{ borderRight: '1px solid #000' }}>
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: any) => sum + (p.apyaonAllowance || 0), 0))}/-
              </td>
              <td className="p-1.5 text-right pr-4 font-bold">
                {toBanglaDigits(payeesSummary.reduce((sum: number, p: any) => sum + p.grandTotal, 0))}/-
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
            {employeesBreakdown.map((record: any, idx: number) => (
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
                <td className="p-1 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(record.totalDays)}</td>
                <td className="p-1 border-r border-black text-right pr-2 font-bold" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(record.grandTotal)}/-</td>
                <td className="p-1 text-center font-bold"></td>
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <td className="p-1 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}></td>
              <td className="p-1 border-r border-black text-left font-bold" style={{ borderRight: '1px solid #000', paddingLeft: '4px' }} colSpan={2}>সর্বমোট</td>
              <td className="p-1 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>
                {totalLateDays > 0 ? `${toBanglaDigits(totalLateDays)} (${toBanglaDigits(totalLateAmount)}/-)` : '-'}
              </td>
              <td className="p-1 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>
                {totalHolidayDays > 0 ? `${toBanglaDigits(totalHolidayDays)} (${toBanglaDigits(totalHolidayAmount)}/-)` : '-'}
              </td>
              <td className="p-1 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>
                {totalNightDays > 0 ? `${toBanglaDigits(totalNightDays)} (${toBanglaDigits(totalNightAmount)}/-)` : '-'}
              </td>
              <td className="p-1 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(totalDaysSum)}</td>
              <td className="p-1 border-r border-black text-right pr-2 font-bold" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(grandTotalSum)}/-</td>
              <td className="p-1 text-center font-bold"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
