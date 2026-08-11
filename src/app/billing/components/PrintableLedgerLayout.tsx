import React from 'react';
import { Printer, ChevronLeft } from 'lucide-react';
import { toBanglaDigits, getBanglaMonthYearLabel } from '@/lib/bengali-converter';

interface OfficeOrder {
  id: number;
  orderRef: string;
  originalOrderRef?: string;
  orderDate: string;
  category: string;
  employeeName: string;
  cellName: string | null;
  status: string;
  dutiesJson?: string | null;
  duties?: any[];
  content?: any;
}

interface PrintableLedgerLayoutProps {
  selectedMonth: string;
  ledgerActiveOfficeOrders: OfficeOrder[];
  ledgerGrandTotal: number;
  setIsLedgerPrintMode: (val: boolean) => void;
}

export default function PrintableLedgerLayout({
  selectedMonth,
  ledgerActiveOfficeOrders,
  ledgerGrandTotal,
  setIsLedgerPrintMode,
}: PrintableLedgerLayoutProps) {
  return (
    <div className="print-report-layout max-w-4xl mx-auto bg-white p-8 border border-slate-200 shadow-md font-sans text-black" style={{ fontFamily: "'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', sans-serif", color: '#000', lineHeight: '1.4' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 1.5cm !important;
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
          onClick={() => setIsLedgerPrintMode(false)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft size={16} />
          খতিয়ান ভিউতে ফিরে যান
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
        <p className="text-sm text-slate-500 font-bold uppercase mt-1">আপ্যায়ন বিলিং খতিয়ান ({selectedMonth === 'all' ? 'সকল মাস' : getBanglaMonthYearLabel(selectedMonth)})</p>
        <div className="w-full border-t border-double border-black my-2"></div>
      </div>

      {/* Table: Ledger List */}
      <div className="mb-8">
        <table className="w-full text-xs border-collapse" style={{ border: '1px solid #000' }}>
          <thead>
            <tr className="bg-slate-50 text-center font-bold" style={{ borderBottom: '1px solid #000' }}>
              <th className="p-2 border-r border-black w-12" style={{ borderRight: '1px solid #000' }}>ক্রমিক</th>
              <th className="p-2 border-r border-black text-left" style={{ borderRight: '1px solid #000', paddingLeft: '6px' }}>স্মারক নম্বর (Order Reference)</th>
              <th className="p-2 border-r border-black w-24" style={{ borderRight: '1px solid #000' }}>আদেশের তারিখ</th>
              <th className="p-2 border-r border-black w-24" style={{ borderRight: '1px solid #000' }}>ক্যাটাগরি</th>
              <th className="p-2 border-r border-black text-left" style={{ borderRight: '1px solid #000', paddingLeft: '6px' }}>কর্মকর্তা (Payee)</th>
              <th className="p-2 border-r border-black w-24" style={{ borderRight: '1px solid #000' }}>ডিউটি দিন</th>
              <th className="p-2 text-right pr-2 w-28">সর্বমোট বিল (টাকা)</th>
            </tr>
          </thead>
          <tbody>
            {ledgerActiveOfficeOrders.map((order: OfficeOrder, idx: number) => {
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
              const categoryLabel = order.category === 'LATE_SITTING' ? 'লেট সিটিং' : order.category === 'HOLIDAY' ? 'সরকারি ছুটি' : 'রাত্রীকালীন';

              return (
                <tr key={order.id} style={{ borderTop: '1px solid #000' }}>
                  <td className="p-2 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(idx + 1)}</td>
                  <td className="p-2 border-r border-black font-mono font-bold" style={{ borderRight: '1px solid #000', textAlign: 'left', paddingLeft: '6px' }}>{order.orderRef}</td>
                  <td className="p-2 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(order.orderDate.split('-').reverse().join('-'))}</td>
                  <td className="p-2 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{categoryLabel}</td>
                  <td className="p-2 border-r border-black font-bold" style={{ borderRight: '1px solid #000', textAlign: 'left', paddingLeft: '6px' }}>{order.employeeName}</td>
                  <td className="p-2 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}>{toBanglaDigits(totalDays)} দিন</td>
                  <td className="p-2 text-right pr-2 font-bold">{toBanglaDigits(billTotal)}/-</td>
                </tr>
              );
            })}
            <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <td className="p-2 border-r border-black text-center" style={{ borderRight: '1px solid #000' }}></td>
              <td className="p-2 border-r border-black text-left font-bold" style={{ borderRight: '1px solid #000', paddingLeft: '6px' }} colSpan={4}>সর্বমোট</td>
              <td className="p-2 border-r border-black text-center font-bold" style={{ borderRight: '1px solid #000' }}>
                {toBanglaDigits(ledgerActiveOfficeOrders.reduce((sum: number, order: OfficeOrder) => {
                  let dutiesList = order.duties || [];
                  if (dutiesList.length === 0 && order.dutiesJson) {
                    try { dutiesList = JSON.parse(order.dutiesJson); } catch {}
                  }
                  return sum + dutiesList.reduce((s: number, d: any) => s + (Array.isArray(d.dates) ? d.dates.length : (d.days || 0)), 0);
                }, 0))} দিন
              </td>
              <td className="p-2 text-right pr-2 font-bold text-indigo-600">৳{toBanglaDigits(ledgerGrandTotal.toLocaleString('en-US'))}/-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
