'use client';

import React from 'react';
import logger from '@/lib/logger';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { getShortDesignation, renderDatesInPairs, cleanBracketName } from '@/lib/print-helpers';
import { Printer, X, FileText, Receipt } from 'lucide-react';
import { OfficeOrder, OrderDuty } from '../types';

interface OfficeOrderPrintModalProps {
  viewingOrder: OfficeOrder | null;
  onClose: () => void;
}

export default function OfficeOrderPrintModal({
  viewingOrder,
  onClose,
}: OfficeOrderPrintModalProps) {
  if (!viewingOrder) return null;

  const isBill = viewingOrder.category?.startsWith('BILL_');

  const getFormattedNumberWords = (num: number) => {
    if (!num) return '';
    const singleWords = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
    const teenWords = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
    const doubleWords = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

    const convertTens = (n: number): string => {
      if (n < 10) return singleWords[n];
      if (n >= 10 && n < 20) return teenWords[n - 10];
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      return doubleWords[ten] + (unit > 0 ? ' ' + singleWords[unit] : '');
    };

    let temp = num;
    let wordStr = '';
    
    if (temp >= 100000) {
      const lac = Math.floor(temp / 100000);
      wordStr += convertTens(lac) + ' লক্ষ ';
      temp %= 100000;
    }

    if (temp >= 1000) {
      const thousand = Math.floor(temp / 1000);
      wordStr += convertTens(thousand) + ' হাজার ';
      temp %= 1000;
    }
    
    if (temp >= 100) {
      const hundred = Math.floor(temp / 100);
      wordStr += singleWords[hundred] + ' শত ';
      temp %= 100;
    }
    
    if (temp > 0) {
      wordStr += convertTens(temp);
    }
    
    return wordStr.trim() + ' টাকা';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-6 animate-fadeIn font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            {isBill ? (
              <Receipt className="text-emerald-600 dark:text-emerald-400" size={22} />
            ) : (
              <FileText className="text-indigo-600 dark:text-indigo-400" size={22} />
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{isBill ? 'বিল মেমো প্রিভিউ' : 'অফিস আদেশ প্রিভিউ'}</span>
                <span className="text-xs font-mono font-normal text-slate-400">({viewingOrder.orderRef})</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">
                প্রিন্ট করার জন্য নিচের প্রিভিউটি যাচাই করুন। প্রয়োজনে সরাসরি এডিট করা যাবে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={15} />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Wrapper */}
        <div className="flex-1 overflow-auto p-8 bg-slate-100/50 dark:bg-slate-950/20 flex justify-center">
          
          {isBill ? (
            /* Simulated Legal-sized Bill Memo sheet */
            <div 
              id="printable-order-sheet"
              className="w-[215.9mm] min-h-[355.6mm] bg-white border border-slate-200 text-black shadow-lg flex flex-col justify-between relative text-left font-sans leading-none text-[11px] shrink-0"
              style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', boxSizing: 'border-box', paddingTop: '0.35in', paddingBottom: '0.35in', paddingLeft: '1.4in', paddingRight: '0.5in' }}
            >
              <div className="flex flex-col h-full justify-between" contentEditable={true} suppressContentEditableWarning={true}>
                <div>
                  {/* Official Header */}
                  <div className="w-full flex justify-end text-right mb-4">
                    <div className="text-right leading-none" style={{ lineHeight: '0.85' }}>
                      <h2 className="text-[20px] font-bold text-black uppercase" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '20px', lineHeight: '1.0', letterSpacing: 'normal', margin: 0, padding: 0 }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h2>
                      <p className="text-[11px] font-bold text-black" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0', letterSpacing: 'normal', margin: 0, padding: 0, marginTop: '4px' }}>তারিখ: {toBanglaDigits(new Date(viewingOrder.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং</p>
                    </div>
                  </div>

                  {/* Title and Main Body */}
                  <div className="flex-1 flex flex-col justify-between mt-2">
                    <div>
                      <h2 className="text-left text-[10px] font-bold underline decoration-black underline-offset-2 leading-none" style={{ fontFamily: 'SolaimanLipi', fontSize: '10px', lineHeight: '1.0' }}>
                        বিষয়: {viewingOrder.content?.subjectText || 'যাতায়াত ও আপ্যায়ন ভাতা প্রদান প্রসঙ্গে।'}
                      </h2>
                      
                      <div className="mt-2.5">
                        <p className="text-justify leading-normal text-black text-[10px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '10px', lineHeight: '1.0', textIndent: '0.5in', textAlign: 'justify' }}>
                          {viewingOrder.content?.openingParagraph}
                        </p>
                      </div>

                      {/* Table */}
                      {(() => {
                        let dutiesList: OrderDuty[] = [];
                        try {
                          dutiesList = viewingOrder.duties || JSON.parse(viewingOrder.dutiesJson || '[]');
                        } catch (e) {
                          logger.error(e);
                        }
                        if (!dutiesList || dutiesList.length === 0) return null;

                        const cat = viewingOrder.category || '';
                        const isHoliday = cat.includes('HOLIDAY');
                        const isNight = cat.includes('NIGHT_SHIFT');
                        const isLate = cat.includes('LATE_SITTING');
                        const apyaonRate = isHoliday ? 250 : isNight ? 600 : 100;
                        const transportRate = isHoliday ? 250 : isNight ? 400 : isLate ? 200 : 0;
                        return (
                          <table className="w-full border-collapse border border-black text-center mt-3 text-[10px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '10px', lineHeight: '1.0', borderCollapse: 'collapse', border: '1px solid #000', width: '100%' }}>
                            <thead>
                              <tr className="bg-slate-50 font-bold border-b border-black text-[10px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '10px', lineHeight: '1.0' }}>
                                <th className="border border-black p-1.5 w-[6%] text-center" style={{ border: '1px solid #000', padding: '3px', width: '6%' }}>ক্রমিক</th>
                                <th className="border border-black p-1.5 text-left pl-3 w-[32%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '12px', width: '32%' }}>নাম ও পদবী</th>
                                <th className="border border-black p-1.5 text-center w-[26%]" style={{ border: '1px solid #000', padding: '3px', width: '26%' }}>তারিখ</th>
                                <th className="border border-black p-1.5 text-center w-[13%]" style={{ border: '1px solid #000', padding: '3px', width: '13%' }}>যাতায়াত</th>
                                <th className="border border-black p-1.5 text-center w-[13%]" style={{ border: '1px solid #000', padding: '3px', width: '13%' }}>আপ্যায়ন</th>
                                <th className="border border-black p-1.5 text-center w-[10%]" style={{ border: '1px solid #000', padding: '3px', width: '10%' }}>মোট</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dutiesList.map((s: OrderDuty, index: number) => (
                                <tr key={index} className="text-black text-[10px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '10px', lineHeight: '1.0' }}>
                                  <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '3.5px' }}>{toBanglaDigits(index + 1)}</td>
                                  <td className="border border-black p-1.5 text-left pl-3 font-normal whitespace-nowrap" style={{ border: '1px solid #000', padding: '3.5px', textAlign: 'left', paddingLeft: '12px', lineHeight: '1.05', whiteSpace: 'nowrap' }}>
                                    {(() => {
                                      const displayName = s.employeeName.replace(/\s*\([^)]*\)\s*$/, '').trim();
                                      return (
                                        <>
                                          <p className="font-normal whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>{displayName.startsWith('জনাব') ? displayName : `জনাব ${displayName}`}</p>
                                          <p className="text-[9px] text-slate-800 font-normal mt-0.5">({getShortDesignation(s.designation)})</p>
                                        </>
                                      );
                                    })()}
                                  </td>
                                  <td className="border border-black p-1.5 text-center leading-snug font-normal" style={{ border: '1px solid #000', padding: '3.5px', fontSize: '9px', lineHeight: '1.0' }}>
                                    {renderDatesInPairs(s.datesFormatted || s.dates || '').map((pair, pIdx) => (
                                      <span key={pIdx} className="block leading-snug" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                                        {pair}
                                      </span>
                                    ))}
                                    <p className="text-[9px] text-slate-700 mt-0.5 font-semibold">মোট: {toBanglaDigits(s.days)} দিন</p>
                                  </td>
                                  <td className="border border-black p-1.5 text-center font-normal" style={{ border: '1px solid #000', padding: '3.5px', verticalAlign: 'middle' }}>
                                    <span style={{ display: 'block', whiteSpace: 'nowrap' }}>({toBanglaDigits(transportRate)}x{toBanglaDigits(s.days)}) =</span>
                                    <span style={{ display: 'block', whiteSpace: 'nowrap', marginTop: '2px' }}>{toBanglaDigits(s.totalTransport)}/-</span>
                                  </td>
                                  <td className="border border-black p-1.5 text-center font-normal" style={{ border: '1px solid #000', padding: '3.5px', verticalAlign: 'middle' }}>
                                    <span style={{ display: 'block', whiteSpace: 'nowrap' }}>({toBanglaDigits(apyaonRate)}x{toBanglaDigits(s.days)}) =</span>
                                    <span style={{ display: 'block', whiteSpace: 'nowrap', marginTop: '2px' }}>{toBanglaDigits(s.totalApyaon)}/-</span>
                                  </td>
                                  <td className="border border-black p-1.5 font-extrabold text-center" style={{ border: '1px solid #000', padding: '3.5px', fontWeight: 'bold' }}>
                                    {toBanglaDigits(s.grandTotal)}/-
                                  </td>
                                </tr>
                              ))}
                              <tr className="font-bold bg-slate-50/50" style={{ border: '1px solid #000', fontWeight: 'bold' }}>
                                <td colSpan={2} className="border border-black p-1.5 text-right pr-3" style={{ border: '1px solid #000', padding: '3.5px', textAlign: 'right', paddingRight: '12px' }}>সর্বমোট:</td>
                                <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '3.5px' }}>{toBanglaDigits(viewingOrder.content?.totalDays ?? 0)} দিন</td>
                                <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '3.5px' }}>{toBanglaDigits(viewingOrder.content?.totalTransport ?? 0)}/-</td>
                                <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '3.5px' }}>{toBanglaDigits(viewingOrder.content?.totalApyaon ?? 0)}/-</td>
                                <td className="border border-black p-1.5 text-center font-extrabold" style={{ border: '1px solid #000', padding: '3.5px', fontWeight: 'bold' }}>{toBanglaDigits(viewingOrder.content?.grandTotal ?? 0)}/-</td>
                              </tr>
                            </tbody>
                          </table>
                        );
                      })()}

                      {/* Words and paragraphs */}
                      <div className="text-left pt-3 mt-3 space-y-1.5" style={{ fontFamily: 'SolaimanLipi', fontSize: '10px', lineHeight: '1.15' }}>
                        <p className="font-bold text-black">কথায়: {(viewingOrder.content?.grandTotalInWords || '').replace(/\s*মাত্র\s*$/, '')} মাত্র।</p>
                        <p className="text-justify leading-normal text-black" style={{ fontFamily: 'SolaimanLipi', fontSize: '10px', lineHeight: '1.15', textAlign: 'justify' }}>
                          ০১। যাতায়াত বিলটি সঠিক এবং পূর্বে পরিশোধ করা হয়নি।
                        </p>
                        <p className="text-justify leading-normal text-black" style={{ fontFamily: 'SolaimanLipi', fontSize: '10px', lineHeight: '1.15', textAlign: 'justify' }}>
                          ০২। ২০১৭ সালের আর্থিক ক্ষমতা অর্পন এর পৃষ্ঠা ১৫ এর অনুচ্ছেদ-২৬.০২ মোতাবেক যাতায়াত খাত (কোড-১৩৫৫১২০৫০০০০০০৩) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(viewingOrder.content?.totalTransport ?? 0)}/- ({viewingOrder.content && viewingOrder.content.totalTransport ? getFormattedNumberWords(viewingOrder.content.totalTransport) : ''})</strong> এবং পৃষ্ঠা ১৪ এর অনুচ্ছেদ-২২.০২ মোতাবেক আপ্যায়ন খাত (কোড-১৩৫৫১২০১০০০০০০২) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(viewingOrder.content?.totalApyaon ?? 0)}/- ({viewingOrder.content && viewingOrder.content.totalApyaon ? getFormattedNumberWords(viewingOrder.content.totalApyaon) : ''})</strong> অনুমোদন ক্ষমতা উপ-মহাব্যবস্থাপক মহোদয়ের এখতিয়ারাধীন।
                        </p>
                        <p className="text-justify leading-normal text-black" style={{ fontFamily: 'SolaimanLipi', fontSize: '10px', lineHeight: '1.15', textAlign: 'justify' }}>
                          ০৩। এমতাবস্থায়, বর্ণিত খরচ অনুমোদনপূর্বক যাতায়াত ও আপ্যায়ন খাত (প্রযোজ্য ক্ষেত্রে) বিকলন করতঃ মোট = <strong>{toBanglaDigits(viewingOrder.content?.grandTotal ?? 0)}/- ({viewingOrder.content && viewingOrder.content.grandTotal ? getFormattedNumberWords(viewingOrder.content.grandTotal) : ''})</strong> <strong>{viewingOrder.employeeName.replace(/\s*\([^)]*\)\s*$/, '')}</strong> এর নামে প্রদানের নিমিত্ত নিরীক্ষার অনুরোধ জানিয়ে বাজেট এন্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট বরাবর এবং নিরীক্ষান্তে নথি একাউন্টস ডিপার্টমেন্ট বরাবর প্রেরণ করা যেতে পারে।
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right-aligned payee signature block */}
                  <div className="w-full flex justify-end text-right" style={{ marginTop: '0.25in', marginBottom: '0.1in' }}>
                    <div className="text-right leading-none" style={{ fontFamily: 'SolaimanLipi', fontSize: '10px', paddingRight: '0.1in', lineHeight: '1.15' }}>
                      <p className="font-extrabold text-[10px]" style={{ margin: 0, padding: 0, lineHeight: '1.15' }}>({cleanBracketName(viewingOrder.employeeName.replace(/\s*\([^)]*\)\s*$/, ''))})</p>
                      <p className="text-[10px] font-bold text-slate-800" style={{ margin: 0, padding: 0, marginTop: '3px', lineHeight: '1.15' }}>
                        {viewingOrder.content?.representativeDesignation || viewingOrder.duties?.find((d: OrderDuty) => d.employeeName === viewingOrder.employeeName)?.designation || 'প্রিন্সিপাল অফিসার (পিও)'}
                      </p>
                    </div>
                  </div>

                  {/* Left-aligned Routing List */}
                  <div className="w-full text-left mt-4 pl-1" style={{ fontFamily: 'SolaimanLipi', fontSize: '10.5px', lineHeight: '1.4' }}>
                    <div style={{ marginBottom: '0.5in' }}>
                      <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: 'SolaimanLipi', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                        এসপিও, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ
                      </p>
                    </div>
                    <div style={{ marginBottom: '0.5in' }}>
                      <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: 'SolaimanLipi', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                        এজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ
                      </p>
                    </div>
                    <div style={{ marginBottom: '0.5in' }}>
                      <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: 'SolaimanLipi', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                        ডিজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ
                      </p>
                    </div>
                    <div style={{ marginBottom: '0.5in' }}>
                      <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: 'SolaimanLipi', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                        ডিজিএম, (বাজেট অ্যান্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট) সমীপেঃ
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            /* Simulated A4 Office Order sheet */
            <div 
              id="printable-order-sheet"
              className="w-[210mm] min-h-[297mm] bg-white border border-slate-200 text-black shadow-lg p-[0.8in] flex flex-col justify-between relative text-left font-sans leading-relaxed text-[11px] shrink-0"
              style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', boxSizing: 'border-box' }}
            >
              <div>
                {/* Janata Bank PLC Header */}
                <div className="w-full flex justify-between items-start border-b-2 border-[#0b5e9e] pb-1.5">
                  <div className="flex items-start gap-2 text-left">
                    <svg viewBox="0 0 512 512" style={{ width: '44px', height: '44px' }} className="text-[#0b5e9e] shrink-0" fill="none">
                      <g>
                        <path fill="currentColor" d="M175.7,351.4c-53.1,0-96.4-43.3-96.4-96.4c0-24.9,9.5-48.6,26.6-66.5l8.2,7.9c-15.1,15.8-23.5,36.7-23.5,58.7c0,46.9,38.1,85.1,85,85.1c46.9,0,85.1-38.2,85.1-85.1v-97.7h11.4v97.7C272.1,308.1,228.9,351.4,175.7,351.4z"/>
                        <path fill="currentColor" d="M175.7,329.1c-41.3,0-74.9-33.6-74.9-74.9c0-19.4,7.3-37.7,20.7-51.7l8.2,7.9c-11.3,11.8-17.5,27.4-17.5,43.9c0,35.1,28.5,63.6,63.5,63.6c35.1,0,63.6-28.5,63.6-63.6v-96.9h11.4v96.9C250.7,295.4,217,329.1,175.7,329.1z"/>
                        <path fill="currentColor" d="M175.7,306.8c-29.5,0-53.4-24-53.4-53.5c0-13.8,5.2-26.9,14.8-36.9l8.2,7.9c-7.5,7.8-11.6,18.2-11.6,29c0,23.2,18.9,42.1,42.1,42.1c23.2,0,42.1-18.9,42.1-42.1v-96.1h11.4v96.1C229.2,282.8,205.2,306.8,175.7,306.8z"/>
                        <path fill="currentColor" d="M175.7,284.4c-17.6,0-32-14.3-32-32c0-8.3,3.1-16.1,8.8-22.1l8.2,7.9c-3.7,3.8-5.7,8.9-5.7,14.2c0,11.4,9.2,20.6,20.6,20.6c11.4,0,20.6-9.2,20.6-20.6v-95.2h11.4v95.2C207.7,270.1,193.3,284.4,175.7,284.4z"/>
                        <path fill="currentColor" d="M400.1,255.1c9.9-7.8,15.9-19.8,15.9-32.7c0-23-18.7-41.6-41.6-41.6h-85.1v11.7h85.1c16.5,0,29.9,13.4,29.9,29.9c0,11.8-7,22.5-17.8,27.3l-12.1,5.4l12.1,5.4c10.8,4.8,17.8,15.5,17.8,27.3c0,16.5-13.4,30-29.9,30H270.2c-2.7,4.1-5.8,8-9,11.7h113.1c23,0,41.6-18.7,41.6-41.7C416,274.8,410,262.8,400.1,255.1z"/>
                        <path fill="currentColor" d="M442.1,218.5c0-33.9-27.6-61.5-61.5-61.5h-91.4v11.4h91.4c27.7,0,50.2,22.5,50.2,50.2c0,12.1-4.4,23.8-12.3,32.8l-3.3,3.7l3.3,3.7c7.9,9.1,12.3,20.8,12.3,32.9c0,27.7-22.5,50.2-50.2,50.2h-132c-5,4.2-10.5,8-16.2,11.4h148.2c33.9,0,61.5-27.6,61.5-61.5c0-13.2-4.3-26-12.1-36.6C437.9,244.6,442.1,231.8,442.1,218.5z"/>
                        <path fill="currentColor" d="M362.7,204.7h-73.5v11.4h73.5c5.4,0,9.7,4.3,9.7,9.7c0,2.6-1,5-2.9,6.9c-1.8,1.8-4.2,2.8-6.8,2.8h-73.5v11.4h73.5c5.7,0,11-2.2,14.9-6.2c4-4,6.2-9.3,6.2-14.9C383.8,214.2,374.3,204.7,362.7,204.7z"/>
                        <path fill="currentColor" d="M362.7,263.3h-73.8c-0.3,3.8-0.8,7.6-1.4,11.4h75.2c5.4,0,9.7,4.4,9.7,9.7c0,2.6-1,5.1-2.9,6.9c-1.8,1.8-4.3,2.8-6.8,2.8h-80.4c-1.4,3.9-3.1,7.7-4.9,11.4h85.4c5.6,0,10.9-2.2,14.8-6.1c4-3.9,6.3-9.3,6.3-15C383.8,272.7,374.3,263.3,362.7,263.3z"/>
                        <path fill="currentColor" d="M255.8,420.3c-64.5,0-129-12.9-192.9-38.6l-2.7-1.1l-0.7-2.8c-24.7-97.3-24.7-177.2,0.2-244.3l0.9-2.4l2.3-0.9c128.4-51.4,258.3-51.4,386.2,0l2.7,1.1l0.7,2.8c24.7,97.3,24.7,177.2-0.2,244.3l-0.9,2.4-2.3,0.9C384.9,407.4,320.3,420.3,255.8,420.3z M69.8,372.2c123.4,48.9,248.8,48.9,372.7-0.1c22.9-63.7,22.8-139.8-0.3-232.3c-123.4-48.9-248.8-48.9-372.7,0.1C46.6,203.6,46.7,279.7,69.8,372.2z"/>
                      </g>
                    </svg>
                    <div className="font-serif leading-none mt-0.5">
                      <h2 className="bank-title" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '20px', fontWeight: 'bold', color: '#0b5e9e', lineHeight: '1.15', margin: 0 }}>জনতা ব্যাংক পিএলসি.</h2>
                      <p style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', fontWeight: 'bold', color: '#555555', marginTop: '2px', lineHeight: '1.0', margin: 0 }}>উন্নয়নে আপনার বিশ্বস্ত অংশীদার</p>
                    </div>
                  </div>

                  <div className="text-right mt-1">
                    <h3 className="dept-title" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '20px', fontWeight: 'bold', color: '#000000', lineHeight: '1.0', marginTop: '5px', letterSpacing: 'normal' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h3>
                  </div>
                </div>

                {/* Reference and Date */}
                <div className="w-full flex justify-between items-center text-[11px] pt-1 pb-1 border-b border-black/10 mt-1 memo-line" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0', marginBottom: '0.25in' }}>
                  <span className="font-bold">সূত্রঃ {viewingOrder.orderRef}</span>
                  <span className="font-bold">
                    তারিখঃ {toBanglaDigits(new Date(viewingOrder.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং
                  </span>
                </div>

                {/* Title and Main Body */}
                <div className="flex-1 flex flex-col justify-start pt-1 text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                  <div className="space-y-2">
                    <h2 className="text-center text-[14px] font-extrabold underline decoration-black underline-offset-4 mt-4 leading-none office-order-title" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '14px', lineHeight: '1.0' }}>
                      অফিস নির্দেশ
                    </h2>
                    
                    <p 
                      className="text-justify leading-normal mt-2 text-[11px] text-slate-950 text-indent-8 body-paragraph"
                      style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.5', textIndent: '0.5in', textAlign: 'justify' }}
                      dangerouslySetInnerHTML={{ __html: viewingOrder.content?.orderText || '' }}
                    />

                    {/* Table Grouped by Employee */}
                    {(() => {
                      let dutiesList: OrderDuty[] = [];
                      try {
                        dutiesList = viewingOrder.duties || JSON.parse(viewingOrder.dutiesJson || '[]');
                      } catch (e) {
                        logger.error(e);
                      }
                      if (!dutiesList || dutiesList.length === 0) return null;
                      return (
                        <table className="w-full border-collapse border border-black text-center mt-2.5 text-[9pt]" style={{ fontFamily: 'SolaimanLipi', fontSize: '9pt', lineHeight: '1.0', borderCollapse: 'collapse', border: '1px solid #000' }}>
                          <thead>
                            <tr className="bg-slate-50 font-bold border-b border-black text-[9.5pt]" style={{ fontFamily: 'SolaimanLipi', fontSize: '9.5pt', lineHeight: '1.0' }}>
                              <th className="border border-black p-1 w-[8%] text-center" style={{ border: '1px solid #000', padding: '3px', verticalAlign: 'middle' }}>ক্রমিক নং</th>
                              <th className="border border-black p-1 text-left pl-2 w-[25%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px', verticalAlign: 'middle' }}>নির্বাহী/ কর্মকর্তার নাম</th>
                              <th className="border border-black p-1 text-center w-[10%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px' }}>পদবী</th>
                              <th className="border border-black p-1 text-left pl-2 w-[35%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px', verticalAlign: 'middle' }}>কাজের বিবরণ</th>
                              <th className="border border-black p-1 text-center w-[22%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px' }}>তারিখ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dutiesList.map((group: OrderDuty, index: number) => (
                              <tr key={index} className="text-black text-[9pt]" style={{ fontFamily: 'SolaimanLipi', fontSize: '9pt', lineHeight: '1.0' }}>
                                <td className="border border-black p-1 text-center font-normal" style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px' }}>
                                  {toBanglaDigits(index + 1)}
                                </td>
                                <td className="border border-black p-1 text-left pl-2 leading-tight font-normal text-[11px] whitespace-nowrap" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: '11px' }}>
                                  {group.employeeName.startsWith(' জনাব') || group.employeeName.startsWith('জনাব') ? group.employeeName : `জনাব ${group.employeeName}`}
                                </td>
                                <td className="border border-black p-1 text-center font-normal" style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px' }}>
                                  {group.designation.match(/\(([^)]+)\)/)?.[1] ?? group.designation}
                                </td>
                                <td className="border border-black p-1 text-left pl-2 leading-normal font-normal text-black" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px', verticalAlign: 'middle', lineHeight: '1.25', fontSize: '11px' }}>
                                  {group.description || 'Customization এবং Development সংক্রান্ত'}
                                </td>
                                <td className="border border-black p-1 text-center font-normal font-serif leading-snug tracking-tight" style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', verticalAlign: 'middle', lineHeight: '1.25' }}>
                                  {renderDatesInPairs(group.dates).map((pair, pIdx) => (
                                    <span key={pIdx} className="block" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                                      {pair}
                                    </span>
                                  ))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}

                    {/* Sign-off Officer block */}
                    <div className="w-full flex justify-start text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.6', marginTop: '0.6in' }}>
                      <div className="text-left pl-2">
                        <p className="font-bold text-black signature-name" style={{ margin: 0, fontWeight: 'bold' }}>({cleanBracketName(viewingOrder.content?.signingOfficer || 'স্বাক্ষরিত')})</p>
                        <p className="text-[11px] text-slate-800 signature-designation" style={{ margin: 0, marginTop: '2px', fontWeight: 'bold', fontSize: '11px' }}>{viewingOrder.content?.signingDesignation || 'উপ-মহাব্যবস্থাপক'}</p>
                      </div>
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
