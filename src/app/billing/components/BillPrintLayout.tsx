import React from 'react';
import Image from 'next/image';
import { FileText, Printer, X } from 'lucide-react';
import { toBanglaDigits, getBanglaNumberWords } from '@/lib/bengali-converter';
import { getShortDesignation, renderDatesInPairs, cleanBracketName } from '@/lib/print-helpers';


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
  content?: {
    subjectText?: string;
    openingParagraph?: string;
    totalDays?: number;
    totalTransport?: number;
    totalApyaon?: number;
    grandTotal?: number;
    grandTotalInWords?: string;
    representativeDesignation?: string;
    signingOfficer?: string;
    signingDesignation?: string;
  } | null;
}

interface OrderDuty {
  employeeName: string;
  designation: string;
  datesFormatted?: string;
  dates?: string;
  days: number;
  totalTransport: number;
  totalApyaon: number;
  grandTotal: number;
}

interface DutyListEntry {
  employeeName?: string;
  name?: string;
  designation: string;
  bankId: string;
  datesFormatted?: string;
  date?: string;
  description?: string;
}

interface BillPrintLayoutProps {
  viewingOrder: OfficeOrder;
  onClose: () => void;
  fetchDutiesForBilling: () => void;
}

const getSeniorityRank = (designation: string): number => {
  if (!designation) return 99;
  const d = designation.toUpperCase();
  if (d.includes('এসপিও') || d.includes('SPO') || d.includes('সিনিয়র প্রিন্সিপাল') || d.includes('SENIOR PRINCIPAL')) {
    return 1;
  }
  if (d.includes('পিও') || d.includes('PO') || d.includes('প্রিন্সিপাল') || d.includes('PRINCIPAL')) {
    return 2;
  }
  if (d.includes('এসো-আইটি') || d.includes('SO-IT') || d.includes('সিনিয়র অফিসার') || d.includes('SENIOR OFFICER')) {
    return 3;
  }
  return 4; // default fallback
};

export default function BillPrintLayout({
  viewingOrder,
  onClose,
  fetchDutiesForBilling
}: BillPrintLayoutProps) {
  const isBill = viewingOrder.category?.startsWith('BILL_');

  const handlePrint = async () => {
    const printContent = document.getElementById('printable-order-sheet');
    if (!printContent) return;

    if (isBill && viewingOrder.status === 'Generated') {
      try {
        await fetch(`/api/office-orders/${viewingOrder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderRef: viewingOrder.orderRef,
            orderDate: viewingOrder.orderDate,
            employeeName: viewingOrder.employeeName,
            cellName: viewingOrder.cellName,
            status: 'Printed'
          })
        });
        fetchDutiesForBilling();
      } catch (e) {
        console.error('Failed to update printed status:', e);
      }
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${isBill ? 'আপ্যায়ন বিল বিবরণী' : 'অফিস নির্দেশ'} - প্রিন্ট</title>
            <link rel="stylesheet" href="https://fonts.maateen.me/solaiman-lipi/font.css" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&display=swap" />
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: 'SolaimanLipi', 'Noto Sans Bengali', sans-serif !important;
                font-size: 12px;
                color: #000;
                background-color: #fff;
                line-height: 1.05;
                letter-spacing: normal !important;
                word-spacing: normal !important;
                -webkit-font-smoothing: antialiased;
              }
              .whitespace-nowrap {
                white-space: nowrap !important;
              }
              @page {
                size: ${isBill ? 'legal portrait' : 'A4'};
                margin-top: ${isBill ? '0.5in' : '0.6in'};
                margin-bottom: ${isBill ? '0.5in' : '0.6in'};
                margin-left: ${isBill ? '1.4in' : '0.8in'};
                margin-right: ${isBill ? '0.5in' : '0.8in'};
              }
              #printable-order-sheet {
                width: ${isBill ? '8.5in' : '210mm'} !important;
                height: auto !important;
                min-height: ${isBill ? '14.0in' : '297mm'} !important;
                padding-top: ${isBill ? '0.5in' : '0.6in'} !important;
                padding-bottom: ${isBill ? '0.5in' : '0.6in'} !important;
                padding-left: ${isBill ? '1.4in' : '0.8in'} !important;
                padding-right: ${isBill ? '0.5in' : '0.8in'} !important;
                box-sizing: border-box !important;
                display: block !important;
                font-family: 'SolaimanLipi', 'Noto Sans Bengali', sans-serif !important;
                font-size: 12px !important;
                color: #000 !important;
                background-color: #fff !important;
                line-height: 1.05 !important;
                letter-spacing: normal !important;
                word-spacing: normal !important;
              }
              @media print {
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                }
                #printable-order-sheet {
                  width: 100% !important;
                  max-width: 100% !important;
                  min-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-sizing: border-box !important;
                }
              }
              .print-block {
                display: block !important;
                height: auto !important;
              }
              #printable-order-sheet * {
                font-family: 'SolaimanLipi', 'Noto Sans Bengali', sans-serif !important;
                letter-spacing: normal !important;
                word-spacing: normal !important;
              }
              .w-full { width: 100%; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .justify-end { justify-content: flex-end; }
              .items-start { align-items: flex-start; }
              .border-b-2 { border-bottom: 2px solid #0b5e9e; }
              .border-b { border-bottom: 1px solid #e2e8f0; }
              .border-t { border-top: 1px solid #e2e8f0; }
              .pb-2 { padding-bottom: 8px; }
              .pt-1 { padding-top: 4px; }
              .pb-1 { padding-bottom: 4px; }
              .pt-2 { padding-top: 8px; }
              .pt-4 { padding-top: 16px; }
              .text-left { text-align: left; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .font-extrabold { font-weight: 800; }
              .text-center { text-align: center; }
              .text-xs { font-size: 14px; }
              .text-sm { font-size: 16px; }
              .text-base { font-size: 18px; }
              .leading-tight { line-height: 1.05; }
              .leading-relaxed { line-height: 1.1; }
              .leading-normal { line-height: 1.1; }
              .leading-none { line-height: 1.0; }
              .leading-snug { line-height: 1.375; }
              .uppercase { text-transform: uppercase; }
              .tracking-wider { letter-spacing: normal !important; }
              .mt-0.5 { margin-top: 2px; }
              .mt-1 { margin-top: 4px; }
              .mt-2 { margin-top: 8px; }
              .mt-2.5 { margin-top: 10px; }
              .mt-4 { margin-top: 16px; }
              .mt-6 { margin-top: 24px; }
              .mt-8 { margin-top: 32px; }
              .mt-12 { margin-top: 48px; }
              .mb-1.5 { margin-bottom: 6px; }
              .mb-4 { margin-bottom: 16px; }
              .pl-2 { padding-left: 8px; }
              .pl-5 { padding-left: 20px; }
              .shrink-0 { flex-shrink: 0; }
              .gap-2 { gap: 8px; }
              .gap-3 { gap: 12px; }
              .gap-4 { gap: 16px; }
              .font-serif { font-family: Georgia, Cambria, "Times New Roman", Times, serif; }
              .underline { text-decoration: underline; }
              .decoration-black { text-decoration-color: #000000; }
              .underline-offset-2 { text-underline-offset: 2px; }
              .text-justify { text-align: justify; }
              .text-indent-8 { text-indent: 0.5in; }
              .text-slate-950 { color: #000000; }
              .font-normal { font-weight: 400; }
              .w-\\[6\\%\\] { width: 6%; }
              .w-\\[32\\%\\] { width: 32%; }
              .w-\\[12\\%\\] { width: 12%; }
              .w-\\[27\\%\\] { width: 27%; }
              .w-\\[26\\%\\] { width: 26%; }
              .w-\\[13\\%\\] { width: 13%; }
              .w-\\[10\\%\\] { width: 10%; }
              .w-\\[50\\%\\] { width: 50%; }
              .list-decimal { list-style-type: decimal; }
              .space-y-4 > * + * { margin-top: 16px; }
              .space-y-2.5 > * + * { margin-top: 10px; }
              .space-y-1 > * + * { margin-top: 4px; }
              .space-y-0.5 > * + * { margin-top: 2px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #000; padding: 3px !important; font-size: 14px; line-height: 1.05; }
              th { font-weight: bold; background-color: #f8fafc; }
              ${!isBill ? `
                #printable-order-sheet .bank-title { font-size: 18pt !important; font-weight: bold !important; color: #0b5e9e !important; }
                #printable-order-sheet .dept-title { font-size: 12pt !important; font-weight: bold !important; color: #000000 !important; }
                #printable-order-sheet .memo-line, #printable-order-sheet .memo-line * { font-size: 12pt !important; font-weight: bold !important; }
                #printable-order-sheet .office-order-title { font-size: 18pt !important; font-weight: bold !important; text-decoration: underline !important; }
                #printable-order-sheet .body-paragraph, #printable-order-sheet .body-paragraph * { font-size: 12pt !important; line-height: 1.15 !important; }
                #printable-order-sheet table th { font-size: 14px !important; font-weight: bold !important; }
                #printable-order-sheet table td, #printable-order-sheet table td p, #printable-order-sheet table td span { font-size: 14px !important; }
                #printable-order-sheet .signature-name { font-size: 12pt !important; font-weight: bold !important; }
                #printable-order-sheet .signature-designation { font-size: 12pt !important; }
                #printable-order-sheet .footer-copy, #printable-order-sheet .footer-copy * { font-size: 12pt !important; }
              ` : ''}
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Modal Header Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <FileText className="text-indigo-500" size={20} />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm font-sans">
              {isBill ? 'আপ্যায়ন বিল বিবরণী প্রাক-প্রদর্শন (Legal Size)' : 'অফিস নির্দেশ প্রাক-প্রদর্শন (A4 Size)'}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer font-sans"
            >
              <Printer size={13} />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Wrapper */}
        <div className="flex-1 overflow-auto p-8 bg-slate-100/50 dark:bg-slate-950/20 flex justify-center">
          {isBill ? (
            /* simulated Legal-sized Bill Memo sheet */
            <div 
              id="printable-order-sheet"
              className="w-[215.9mm] min-h-[355.6mm] bg-white border border-slate-200 text-black shadow-lg flex flex-col justify-between relative text-left font-serif leading-none text-[12px] shrink-0"
              style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', boxSizing: 'border-box', paddingTop: '0.35in', paddingBottom: '0.35in', paddingLeft: '1.4in', paddingRight: '0.5in' }}
            >
              <div className="print-block flex flex-col h-full justify-between">
                <div>
                  {/* Official Header */}
                  <div className="w-full flex justify-end text-right mb-4">
                    <div className="text-right leading-none">
                      <h2 className="text-[20px] font-bold text-black uppercase" style={{ fontFamily: 'SolaimanLipi', fontSize: '20px', lineHeight: '1.1', letterSpacing: 'normal' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h2>
                      <p className="text-[12px] font-bold text-black mt-0.5" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.1', letterSpacing: 'normal' }}>তারিখ: {toBanglaDigits(new Date(viewingOrder.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং</p>
                    </div>
                  </div>

                  {/* Title and Main Body */}
                  <div className="flex-1 flex flex-col justify-between mt-2">
                    <div>
                      <h2 className="text-left text-[12px] font-bold underline decoration-black underline-offset-2 leading-none" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.0' }}>
                        বিষয়: {viewingOrder.content?.subjectText || 'যাতায়াত ও আপ্যায়ন ভাতা প্রদান প্রসঙ্গে।'}
                      </h2>
                      
                      <div className="mt-2.5">
                        <p className="text-justify leading-normal text-black text-[12px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.15', textIndent: '0.5in', textAlign: 'justify' }}>
                          {viewingOrder.content?.openingParagraph}
                        </p>
                      </div>

                      {/* Table */}
                      {(() => {
                        let dutiesList: OrderDuty[] = [];
                        try {
                          dutiesList = viewingOrder.duties || JSON.parse(viewingOrder.dutiesJson || '[]');
                        } catch (e) {
                          console.error(e);
                        }
                        if (!dutiesList || dutiesList.length === 0) return null;

                        const sortedDutiesList = [...dutiesList].sort((a, b) => {
                          const rankA = getSeniorityRank(a.designation);
                          const rankB = getSeniorityRank(b.designation);
                          if (rankA !== rankB) return rankA - rankB;
                          return (b.grandTotal || 0) - (a.grandTotal || 0);
                        });

                        const cat = viewingOrder.category || '';
                        const isHoliday = cat.includes('HOLIDAY');
                        const isNight = cat.includes('NIGHT_SHIFT');
                        const isLate = cat.includes('LATE_SITTING');
                        const apyaonRate = isHoliday ? 250 : isNight ? 600 : 100;
                        const transportRate = isHoliday ? 250 : isNight ? 400 : isLate ? 200 : 0;
                        return (
                          <table className="w-full border-collapse border border-black text-center mt-3 text-[12px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.0', borderCollapse: 'collapse', border: '1px solid #000', width: '100%' }}>
                            <thead>
                              <tr className="bg-slate-50 font-bold border-b border-black text-[12px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.0' }}>
                                <th className="border border-black p-1.5 w-[6%] text-center" style={{ border: '1px solid #000', padding: '3px', width: '6%' }}>ক্রমিক</th>
                                <th className="border border-black p-1.5 text-left pl-3 w-[32%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '12px', width: '32%' }}>নাম ও পদবী</th>
                                <th className="border border-black p-1.5 text-center w-[26%]" style={{ border: '1px solid #000', padding: '3px', width: '26%' }}>তারিখ</th>
                                <th className="border border-black p-1.5 text-center w-[13%]" style={{ border: '1px solid #000', padding: '3px', width: '13%' }}>যাতায়াত</th>
                                <th className="border border-black p-1.5 text-center w-[13%]" style={{ border: '1px solid #000', padding: '3px', width: '13%' }}>আপ্যায়ন</th>
                                <th className="border border-black p-1.5 text-center w-[10%]" style={{ border: '1px solid #000', padding: '3px', width: '10%' }}>মোট</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedDutiesList.map((s: OrderDuty, idx: number) => (
                                <tr key={idx} className="text-black text-[12px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.0' }}>
                                  <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '3px' }}>{toBanglaDigits(idx + 1)}</td>
                                  <td className="border border-black p-1.5 text-left pl-3 font-normal" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '12px', lineHeight: '1.1', whiteSpace: 'nowrap' }}>
                                    {(() => {
                                      const displayName = s.employeeName.replace(/\s*\([^)]*\)\s*$/, '').trim();
                                      const nameWithPrefix = displayName.startsWith('জনাব') ? displayName : `জনাব ${displayName}`;
                                      return (
                                        <>
                                          <span className="font-normal block whitespace-nowrap" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                                            {nameWithPrefix}
                                          </span>
                                          <span className="font-normal block text-slate-800 text-[12px] mt-0.5" style={{ display: 'block', fontSize: '12px', marginTop: '2px' }}>
                                            ({getShortDesignation(s.designation)})
                                          </span>
                                        </>
                                      );
                                    })()}
                                  </td>
                                  <td className="border border-black p-1.5 text-center font-normal" style={{ border: '1px solid #000', padding: '3px', fontSize: '10px', lineHeight: '1.0' }}>
                                    {renderDatesInPairs(s.datesFormatted || s.dates || '').map((pair, pIdx, arr) => (
                                      <span key={pIdx} className="block" style={{ whiteSpace: 'nowrap' }}>
                                        {pair}
                                      </span>
                                    ))}
                                    <p className="text-[10px] text-slate-700 mt-0.5 font-semibold">মোট: {toBanglaDigits(s.days)} দিন</p>
                                  </td>
                                  <td className="border border-black p-1.5 text-center font-normal" style={{ border: '1px solid #000', padding: '3px', verticalAlign: 'middle' }}>
                                    <span style={{ display: 'block', whiteSpace: 'nowrap' }}>({toBanglaDigits(transportRate)}x{toBanglaDigits(s.days)}) =</span>
                                    <span style={{ display: 'block', whiteSpace: 'nowrap', marginTop: '2px' }}>{toBanglaDigits(s.totalTransport)}/-</span>
                                  </td>
                                  <td className="border border-black p-1.5 text-center font-normal" style={{ border: '1px solid #000', padding: '3px', verticalAlign: 'middle' }}>
                                    <span style={{ display: 'block', whiteSpace: 'nowrap' }}>({toBanglaDigits(apyaonRate)}x{toBanglaDigits(s.days)}) =</span>
                                    <span style={{ display: 'block', whiteSpace: 'nowrap', marginTop: '2px' }}>{toBanglaDigits(s.totalApyaon)}/-</span>
                                  </td>
                                  <td className="border border-black p-1.5 font-extrabold text-center" style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold' }}>
                                    {toBanglaDigits(s.grandTotal)}/-
                                  </td>
                                </tr>
                              ))}
                              <tr className="font-bold bg-slate-50/50 text-[12px]" style={{ border: '1px solid #000', fontWeight: 'bold' }}>
                                <td colSpan={2} className="border border-black p-1.5 text-right pr-3" style={{ border: '1px solid #000', padding: '3px', textAlign: 'right', paddingRight: '12px' }}>সর্বমোট:</td>
                                <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '3px' }}>{toBanglaDigits(viewingOrder.content?.totalDays)} দিন</td>
                                <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '3px' }}>৳{toBanglaDigits(viewingOrder.content?.totalTransport)}/-</td>
                                <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '3px' }}>৳{toBanglaDigits(viewingOrder.content?.totalApyaon)}/-</td>
                                <td className="border border-black p-1.5 text-center font-extrabold" style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold' }}>৳{toBanglaDigits(viewingOrder.content?.grandTotal)}/-</td>
                              </tr>
                            </tbody>
                          </table>
                        );
                      })()}

                      {/* Words and paragraphs */}
                      <div className="text-left pt-3 mt-3 space-y-1.5" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.15' }}>
                        <p className="font-bold text-black">কথায়: {(viewingOrder.content?.grandTotalInWords || '').replace(/\s*মাত্র\s*$/, '')} মাত্র।</p>
                        <p className="text-justify leading-normal text-black" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.15', textAlign: 'justify' }}>
                          ০১। যাতায়াত বিলটি সঠিক এবং পূর্বে পরিশোধ করা হয়নি।
                        </p>
                        <p className="text-justify leading-normal text-black" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.15', textAlign: 'justify' }}>
                          ০২। ২০১৭ সালের আর্থিক ক্ষমতা অর্পন এর পৃষ্ঠা ১৫ এর অনুচ্ছেদ-২৬.০২ মোতাবেক যাতায়াত খাত (কোড-১৩৫৫১২০৫০০০০০০৩) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(viewingOrder.content?.totalTransport)}/- ({getBanglaNumberWords(viewingOrder.content?.totalTransport || 0).replace(' টাকা মাত্র', ' টাকা')})</strong> এবং পৃষ্ঠা ১৪ এর অনুচ্ছেদ-২২.০২ মোতাবেক আপ্যায়ন খাত (কোড-১৩৫৫১২০১০০০০০০২) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(viewingOrder.content?.totalApyaon)}/- ({getBanglaNumberWords(viewingOrder.content?.totalApyaon || 0).replace(' টাকা মাত্র', ' টাকা')})</strong> অনুমোদন ক্ষমতা উপ-মহাব্যবস্থাপক মহোদয়ের এখতিয়ারাধীন।
                        </p>
                        <p className="text-justify leading-normal text-black" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.15', textAlign: 'justify' }}>
                          ০৩। এমতাবস্থায়, বর্ণিত খরচ অনুমোদনপূর্বক যাতায়াত ও আপ্যায়ন খাত (প্রযোজ্য ক্ষেত্রে) বিকলন করতঃ মোট = <strong>{toBanglaDigits(viewingOrder.content?.grandTotal)}/- ({getBanglaNumberWords(viewingOrder.content?.grandTotal || 0).replace(' টাকা মাত্র', ' টাকা')})</strong> <strong>{viewingOrder.employeeName.replace(/\s*\([^)]*\)\s*$/, '')}, {viewingOrder.content?.representativeDesignation || 'এসও-আইটি'}</strong> এর নামে প্রদানের নিমিত্ত নিরীক্ষার অনুরোধ জানিয়ে বাজেট এন্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট বরাবর এবং নিরীক্ষান্তে নথি একাউন্টস ডিপার্টমেন্ট বরাবর প্রেরণ করা যেতে পারে।
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right-aligned payee signature block */}
                  <div className="w-full flex justify-end text-right" style={{ marginTop: '0.25in', marginBottom: '0.1in' }}>
                    <div className="text-right leading-none" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', paddingRight: '0.1in' }}>
                      <p className="font-extrabold text-[12px]">({cleanBracketName(viewingOrder.employeeName.replace(/\s*\([^)]*\)\s*$/, ''))})</p>
                      <p className="text-[12px] font-bold text-slate-800 mt-1">{viewingOrder.content?.representativeDesignation || 'এসও-আইটি'}</p>
                    </div>
                  </div>

                  {/* Left-aligned Routing List */}
                  <div className="w-full text-left mt-4 pl-1" style={{ fontFamily: 'SolaimanLipi', fontSize: '10.5px', lineHeight: '1.4' }}>
                    <div style={{ marginBottom: '0.7in' }}>
                      <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: 'SolaimanLipi', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                        এসপিও, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ
                      </p>
                    </div>
                    <div style={{ marginBottom: '0.7in' }}>
                      <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: 'SolaimanLipi', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                        এজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ
                      </p>
                    </div>
                    <div style={{ marginBottom: '0.7in' }}>
                      <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: 'SolaimanLipi', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                        ডিজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ
                      </p>
                    </div>
                    <div style={{ marginBottom: '0.7in' }}>
                      <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: 'SolaimanLipi', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                        ডিজিএম, (বাজেট অ্যান্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট) সমীপেঃ
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            /* simulated A4 office order sheet */
            <div 
              id="printable-order-sheet"
              className="w-[210mm] min-h-[297mm] bg-white border border-slate-200 text-black shadow-lg flex flex-col justify-between relative text-left font-serif leading-relaxed text-[12px] shrink-0"
              style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', boxSizing: 'border-box', paddingTop: '0.8in', paddingBottom: '0.8in', paddingLeft: '0.8in', paddingRight: '0.8in' }}
            >
              <div className="print-block flex flex-col h-full justify-between">
                <div>
                  {/* Header */}
                  <div className="w-full flex justify-between items-start border-b-2 border-[#0b5e9e] pb-1.5">
                    <Image 
                      src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Janata_Bank_PLC_Logo.svg"
                      alt="Janata Bank Logo" 
                      width={120}
                      height={32}
                      className="h-8 shrink-0" 
                      unoptimized
                    />
                    <div className="text-right leading-tight">
                      <h2 className="text-[18pt] font-extrabold text-[#0b5e9e] bank-title" style={{ fontFamily: 'SolaimanLipi', fontSize: '15pt', lineHeight: '1.15' }}>জনতা ব্যাংক পিএলসি.</h2>
                      <p className="text-[14pt] font-bold text-slate-500 uppercase mt-0.5 dept-title" style={{ fontFamily: 'SolaimanLipi', fontSize: '12pt', lineHeight: '1.0', letterSpacing: 'normal' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
                      <p className="text-[12px] font-medium text-slate-400 leading-none mt-1" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.0' }}>প্রধান কার্যালয়, ঢাকা</p>
                    </div>
                  </div>

                  {/* Title and Memo details */}
                  <div className="w-full flex justify-between items-start mt-4 text-[14pt] memo-line" style={{ fontFamily: 'SolaimanLipi', fontSize: '12pt', lineHeight: '1.0' }}>
                    <p className="font-bold">স্মারক নং: {viewingOrder.orderRef}</p>
                    <p className="font-bold">তারিখ: {toBanglaDigits(new Date(viewingOrder.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং</p>
                  </div>

                  <div className="text-center font-bold text-sm underline decoration-black underline-offset-4 mt-6 leading-none office-order-title" style={{ fontFamily: 'SolaimanLipi', fontSize: '14.5pt', lineHeight: '1.0' }}>
                    অফিস নির্দেশ
                  </div>

                  <div className="mt-6">
                    <p className="text-justify leading-relaxed text-black text-[11.5pt] text-indent-8 body-paragraph" style={{ fontFamily: 'SolaimanLipi', fontSize: '12pt', lineHeight: '1.5', textIndent: '0.5in', textAlign: 'justify' }}>
                      {viewingOrder.content?.openingParagraph || 'অনলাইন ব্যাংকিং ডিপার্টমেন্টের স্বাভাবিক কার্যক্রম পরিচালনার জন্য নিম্নলিখিত কর্মকর্তাদের দায়িত্ব অর্পণ করা হইলঃ'}
                    </p>
                  </div>

                  {/* Table */}
                  {(() => {
                    let dutiesList: DutyListEntry[] = (viewingOrder.duties as any) || [];
                    if (dutiesList.length === 0 && viewingOrder.dutiesJson) {
                      try {
                        dutiesList = JSON.parse(viewingOrder.dutiesJson);
                      } catch (e) {
                        console.error(e);
                      }
                    }
                    return dutiesList.length > 0 ? (
                      <table className="w-full border-collapse border border-black text-center mt-4 text-[12px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.0', borderCollapse: 'collapse', border: '1px solid #000', width: '100%' }}>
                        <thead>
                          <tr className="bg-slate-50 font-bold border-b border-black text-[12px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.0' }}>
                            <th className="border border-black p-1 w-[8%] text-center" style={{ border: '1px solid #000', padding: '3px' }}>ক্রমিক</th>
                            <th className="border border-black p-1 text-left pl-2 w-[28%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px' }}>নাম ও পদবী</th>
                            <th className="border border-black p-1 text-left pl-2 w-[12%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px' }}>কার্ড নং</th>
                            <th className="border border-black p-1 text-center w-[27%]" style={{ border: '1px solid #000', padding: '3px' }}>তারিখ</th>
                            <th className="border border-black p-1 text-left pl-2 w-[25%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px' }}>মন্তব্য</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dutiesList.map((d: DutyListEntry, idx: number) => (
                            <tr key={idx} className="text-black text-[12px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '12px', lineHeight: '1.0' }}>
                              <td className="border border-black p-1 text-center" style={{ border: '1px solid #000', padding: '3px' }}>{toBanglaDigits(idx + 1)}</td>
                              <td className="border border-black p-1 text-left pl-2 font-normal" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px', lineHeight: '1.1' }}>
                                {(() => {
                                  const fullNm = d.employeeName || d.name || '';
                                  const displayName = fullNm.replace(/\s*\([^)]*\)\s*$/, '').trim();
                                  const nameWithPrefix = displayName.startsWith('জনাব') ? displayName : `জনাব ${displayName}`;
                                  return (
                                    <>
                                      <span className="font-normal block whitespace-nowrap" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                                        {nameWithPrefix}
                                      </span>
                                      <span className="font-normal block text-slate-800 text-[12px] mt-0.5" style={{ display: 'block', fontSize: '12px', marginTop: '2px' }}>
                                        ({getShortDesignation(d.designation)})
                                      </span>
                                    </>
                                  );
                                })()}
                              </td>
                              <td className="border border-black p-1 text-left pl-2 font-normal" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px' }}>
                                <p className="font-sans font-normal">{d.bankId}</p>
                              </td>
                              <td className="border border-black p-1 text-center leading-snug font-normal" style={{ border: '1px solid #000', padding: '3px', fontSize: '10px' }}>
                                {renderDatesInPairs(d.datesFormatted || d.date || '').map((pair, pIdx, arr) => (
                                  <span key={pIdx} className="block leading-snug" style={{ whiteSpace: 'nowrap' }}>
                                    {pair}
                                  </span>
                                ))}
                              </td>
                              <td className="border border-black p-1 text-left pl-2 font-normal" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px' }}>
                                {d.description || ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : null;
                  })()}

                  {/* Signatures block */}
                  <div className="w-full flex justify-between items-start mt-8 pt-4 leading-normal text-[11.5pt]" style={{ fontFamily: 'SolaimanLipi', fontSize: '12pt', lineHeight: '1.6' }}>
                    <div className="w-[50%] footer-copy">
                      <p className="underline underline-offset-2">অনুলিপি জ্ঞাতার্থে ও কার্যার্থে প্রেরিত হইলোঃ</p>
                      <ol className="list-decimal pl-5 mt-2 space-y-1">
                        <li>উপ-মহাব্যবস্থাপক মহোদয়ের ব্যক্তিগত নথি, অনলাইন ব্যাংকিং ডিপার্টমেন্ট;</li>
                        <li>সংশ্লিষ্ট কর্মকর্তা; এবং</li>
                        <li>নথি/অফিস কপি।</li>
                      </ol>
                    </div>
                    <div className="w-[50%] text-right pr-2">
                      <p className="font-extrabold signature-name">({cleanBracketName(viewingOrder.content?.signingOfficer || 'স্বাক্ষরিত')})</p>
                      <p className="text-slate-800 mt-1 signature-designation">{viewingOrder.content?.signingDesignation || 'উপ-মহাব্যবস্থাপক'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
