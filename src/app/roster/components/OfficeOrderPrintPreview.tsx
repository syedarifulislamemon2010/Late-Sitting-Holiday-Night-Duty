'use client';

import React from 'react';
import { 
  AlertCircle, 
  Check, 
  ChevronLeft, 
  FileText, 
  Printer 
} from 'lucide-react';
import { 
  Duty, 
  Employee, 
  Executive, 
  Holiday, 
  checkIsWorkingDay, 
  getNormalizedRef 
} from '../types';
import CalendarDatePicker from './CalendarDatePicker';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { cleanBracketName, renderDatesInPairs } from '@/lib/print-helpers';

interface OfficeOrderPrintPreviewProps {
  orderGenerated: boolean;
  isEditingArchive: boolean;
  isArchived: boolean;
  submitting: boolean;
  isRosterDirty: boolean;
  orderRef: string;
  originalOrderRef: string;
  orderDate: string;
  orderText: string;
  printCategory: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
  payeeEmployeeId: string;
  selectedExecutiveId: string;
  executives: Executive[];
  signingOfficer: string;
  signingDesignation: string;
  headerMode: 'with_header' | 'without_header';
  suggestedRef: string;
  refDuplicate: boolean;
  holidays: Holiday[];
  duties: Duty[];
  selectedCell: string;
  activePartIdx: number;
  stableNumber: number;
  setUserCustomOrderRef: (ref: string) => void;
  setUserCustomOrderDate: (date: string) => void;
  setUserCustomOrderText: (text: string) => void;
  setUserSelectedPayeeId: (id: string) => void;
  setSelectedExecutiveId: (id: string) => void;
  setSigningOfficer: (name: string) => void;
  setSigningDesignation: (desig: string) => void;
  setHeaderMode: (mode: 'with_header' | 'without_header') => void;
  changePrintCategory: (cat: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT') => void;
  setActivePartIdx: (idx: number) => void;
  handleBackToRoster: () => void;
  archiveOrder: (actionType: 'generate' | 'print' | 'download') => void;
  saveOrderToArchive: () => void;
  handleCancelRosterEdit: () => void;
  getGroupedDuties: () => Array<{ employee: Employee; dates: string[]; description: string }>;
  getSplitParts: (list: Duty[], numParts: number) => Duty[][];
  getShortDesignation: (desig: string | undefined | null) => string;
}

export default function OfficeOrderPrintPreview({
  orderGenerated,
  isEditingArchive,
  isArchived,
  submitting,
  isRosterDirty,
  orderRef,
  originalOrderRef,
  orderDate,
  orderText,
  printCategory,
  payeeEmployeeId,
  selectedExecutiveId,
  executives,
  signingOfficer,
  signingDesignation,
  headerMode,
  suggestedRef,
  refDuplicate,
  holidays,
  duties,
  selectedCell,
  activePartIdx,
  stableNumber,
  setUserCustomOrderRef,
  setUserCustomOrderDate,
  setUserCustomOrderText,
  setUserSelectedPayeeId,
  setSelectedExecutiveId,
  setSigningOfficer,
  setSigningDesignation,
  setHeaderMode,
  changePrintCategory,
  setActivePartIdx,
  handleBackToRoster,
  archiveOrder,
  saveOrderToArchive,
  handleCancelRosterEdit,
  getGroupedDuties,
  getSplitParts,
  getShortDesignation
}: OfficeOrderPrintPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Dynamic Media Print Style Overrides to ensure A4 fits on exactly 1 single page with zero double margins */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
          body { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: #fff !important; 
            font-family: "SolaimanLipi", "Noto Sans Bengali", sans-serif !important; 
            font-size: 14px !important;
            line-height: 1.6 !important;
            letter-spacing: normal !important;
            word-spacing: normal !important;
          }
          main, .flex-1, .p-4, .lg\\:p-8, .p-6, .space-y-6, .py-6, .my-6 {
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-a4-layout {
            width: 210mm !important;
            height: 297mm !important;
            padding: 1.0in !important;
            border: none !important;
            box-shadow: none !important;
            font-family: "SolaimanLipi", "Noto Sans Bengali", sans-serif !important;
            font-size: 14px !important;
            line-height: 1.6 !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            page-break-before: avoid !important;
            overflow: hidden !important;
            letter-spacing: normal !important;
            word-spacing: normal !important;
          }
        }
      `}} />

      {/* Back Controls (No-print) */}
      <div className="no-print flex items-center justify-between glass-card p-4 rounded-2xl">
        <button
          onClick={handleBackToRoster}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          ফিরে যান (রোস্টার ভিউ)
        </button>

        <div className="flex items-center gap-3">
          {!orderGenerated ? (
            <button
              onClick={() => archiveOrder('generate')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
            >
              <FileText size={14} />
              অফিস আদেশ তৈরি করুন (Generate Order)
            </button>
          ) : (
            <>
              <button
                onClick={() => archiveOrder('print')}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                <Printer size={14} />
                প্রিন্ট প্রিভিউ (Print)
              </button>
              <button
                onClick={() => archiveOrder('download')}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                <Printer size={14} />
                ডাউনলোড পিডিএফ (Download)
              </button>
              {isEditingArchive ? (
                <div className="flex gap-3 font-sans">
                  <button
                    onClick={saveOrderToArchive}
                    disabled={submitting || !isRosterDirty}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <FileText size={14} />
                    {submitting ? 'সংরক্ষণ হচ্ছে...' : 'সেভ করুন'}
                  </button>
                  <button
                    onClick={handleCancelRosterEdit}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-250 dark:border-slate-700 cursor-pointer whitespace-nowrap"
                  >
                    বাতিল করুন
                  </button>
                </div>
              ) : !isArchived ? (
                <button
                  onClick={saveOrderToArchive}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer disabled:opacity-50"
                >
                  <FileText size={14} />
                  {submitting ? 'আর্কাইভ হচ্ছে...' : 'আর্কাইভ করুন (Archive)'}
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-900/30 whitespace-nowrap">
                  <Check size={14} />
                  আর্কাইভ সম্পন্ন
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Configurator Panel (No-print) */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-4 lg:col-span-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">অফিস আদেশ কাস্টমাইজেশন ও প্রফেশনাল কন্ট্রোল প্যানেল</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">১. ডিউটির ক্যাটাগরি (Category)</label>
              <select
                value={printCategory}
                onChange={(e) => changePrintCategory(e.target.value as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="LATE_SITTING">Late Sitting (লেট সিটিং)</option>
                <option value="HOLIDAY">Holiday Duty (ছুটির দিনে)</option>
                <option value="NIGHT_SHIFT">Night Shift (রাত্রীকালীন ডিউটি)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">২. বিল যার অনুকূলে হবে (Bill Favoring To)</label>
              <select
                value={payeeEmployeeId}
                onChange={(e) => {
                  setUserSelectedPayeeId(e.target.value);
                  setUserCustomOrderRef('');
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Employee (কর্মকর্তা নির্বাচন)</option>
                {getGroupedDuties().map(group => (
                  <option key={group.employee.id} value={group.employee.id.toString()}>
                    {group.employee.name} ({getShortDesignation(group.employee.designation)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">৩. আদেশ অনুমোদনকারী জিএম/ডিজিএম</label>
              <select
                value={selectedExecutiveId}
                onChange={(e) => {
                  const execId = e.target.value;
                  setSelectedExecutiveId(execId);
                  const exec = executives.find(ex => ex.id.toString() === execId);
                  if (exec) {
                    setSigningOfficer(exec.name);
                    setSigningDesignation(exec.designation);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select GM/DGM (জিএম/ডিজিএম নির্বাচন)</option>
                {executives.map(ex => (
                  <option key={ex.id} value={ex.id.toString()}>
                    {ex.name} ({ex.designation})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">৪. স্মারক/সূত্র নম্বর (Order Ref)</label>
              <input
                type="text"
                value={orderRef}
                onChange={(e) => setUserCustomOrderRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500"
              />
              {suggestedRef && (
                <div 
                  onClick={() => setUserCustomOrderRef(suggestedRef)}
                  className="inline-block mt-1.5 bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 border rounded-lg px-2.5 py-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all"
                >
                  💡 সাজেস্টেড: {suggestedRef}
                </div>
              )}
              {refDuplicate && (
                <div className="inline-block mt-1.5 ml-2 bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 border rounded-lg px-2.5 py-1 text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                  ⚠️ এই সূত্র নং ইতোমধ্যে ব্যবহৃত
                </div>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">৫. আদেশের তারিখ (Order Date)</label>
              <CalendarDatePicker 
                value={orderDate}
                onChange={(d) => setUserCustomOrderDate(d)}
                isNonWorkingDay={(d) => !checkIsWorkingDay(d, holidays)}
                toBanglaDigits={toBanglaDigits}
                placeholder="আদেশের তারিখ নির্বাচন..."
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">৬. আদেশের মূল বক্তব্য (Order Text)</label>
              <textarea
                rows={4}
                value={orderText}
                onChange={(e) => setUserCustomOrderText(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-semibold leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">৭. হেডার প্রিন্ট অপশন (Header Option)</label>
              <select
                value={headerMode}
                onChange={(e) => setHeaderMode(e.target.value as 'with_header' | 'without_header')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="with_header">হেডার সহ (With Header - সাধারণ প্রিন্ট)</option>
                <option value="without_header">হেডার ছাড়া (Without Header - প্যাড পেপার প্রিন্ট)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scale reference instructions */}
        <div className="space-y-3 lg:col-span-1">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">প্রিন্ট প্রাক-প্রস্তুতি নির্দেশাবলী</h3>
          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/30 text-xs text-indigo-700 dark:text-indigo-400 space-y-2.5">
            <p className="font-bold">💡 অফিস আদেশ তৈরিতে লক্ষণীয়:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>পেজে একই কর্মকর্তার একাধিক তারিখের ডিউটি থাকলে তা কমা দিয়ে একই রোতে বসানো হবে।</li>
              <li>ডিজিএম এবং বিল প্রাপক (Bill Favoring To) ড্রপডাউন থেকে সিলেক্ট করলে সূত্র ও বিল স্বয়ংক্রিয় রি-রুট হবে।</li>
              <li>প্রিন্ট করার সময় ব্রাউজার সেটিংস থেকে <strong>Headers and Footers</strong> টিকমার্ক উঠিয়ে দিন এবং মার্জিন <strong>None/Default</strong> রাখুন।</li>
              <li>আদেশপত্রটি ছবির মত নিখুঁতভাবে **A4 Size** কাগজে প্রিন্টযোগ্য।</li>
            </ul>
          </div>
        </div>
      </div>

      {/* DGM 7500 Tk Apyaon split alert and tabs switchers */}
      {(() => {
        const filtered = duties.filter(d => {
          const matchesCategory = d.type === printCategory;
          if (isArchived && !isEditingArchive) {
            return matchesCategory && getNormalizedRef(d.orderRef) === getNormalizedRef(originalOrderRef);
          }
          const matchesCell = selectedCell === 'all' || d.employee.cellId.toString() === selectedCell;
          return matchesCell && matchesCategory && !d.orderRef;
        });
        const apyaonRate = printCategory === 'HOLIDAY' ? 250 : printCategory === 'NIGHT_SHIFT' ? 600 : 100;
        const totalApyaon = filtered.length * apyaonRate;
        
        if (totalApyaon <= 7500) return null;
        
        const numParts = Math.ceil(totalApyaon / 7500);
        const parts = getSplitParts(filtered, numParts);
        
        return (
          <div className="no-print w-full max-w-[210mm] mx-auto space-y-4 mb-4 mt-6">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300">
              <h4 className="font-extrabold text-sm flex items-center gap-2 mb-1">
                <AlertCircle size={16} />
                উপ-মহাব্যবস্থাপক (ডিজিএম) এর আপ্যায়ন বিলের সীমা ৭৫০০/- টাকা অতিক্রম করেছে!
              </h4>
              <p className="text-xs leading-relaxed">
                মোট আপ্যায়ন খরচ <strong>{toBanglaDigits(totalApyaon)}/- টাকা</strong> (মোট {toBanglaDigits(filtered.length)}টি ডিউটি)। 
                তাই নীতিগত সিদ্ধান্ত অনুযায়ী আদেশটি সমান <strong>{toBanglaDigits(numParts)}টি আলাদা অফিস আদেশে</strong> বিভক্ত করা হয়েছে। 
                অনুগ্রহ করে প্রতিটি অংশ আলাদাভাবে প্রিভিউ করে প্রিন্ট/ডাউনলোড করুন (প্রতিটি অংশের জন্য আলাদা ধারাবাহিক স্মারক সূত্র তৈরি হবে):
              </p>
              <div className="mt-3.5 space-y-2 text-xs font-bold font-sans">
                {parts.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-amber-900 dark:text-amber-250">
                    <span>অংশ {toBanglaDigits(idx + 1)}:</span>
                    <span className="font-normal">{toBanglaDigits(p.length * apyaonRate)}/- টাকা ({toBanglaDigits(p.length)}টি ডিউটি)</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Part Switcher Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2">
              {Array.from({ length: numParts }).map((_, idx) => {
                const isActive = activePartIdx === idx;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setActivePartIdx(idx)}
                    className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-850'
                    }`}
                  >
                    অংশ {toBanglaDigits(idx + 1)} (স্মারক সূত্র: {toBanglaDigits(stableNumber + idx)})
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Interactive Print Mock Sheet */}
      <div className="flex justify-center p-4 bg-slate-100/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-x-auto shadow-inner font-serif">
        <div className="print-a4-layout w-[210mm] h-[297mm] bg-white border border-slate-200 text-black shadow-xl flex flex-col justify-between overflow-hidden relative" style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', padding: '1.0in', boxSizing: 'border-box' }}>
          
          {/* Header */}
          {headerMode === 'with_header' ? (
            <div className="w-full flex justify-between items-start border-b-2 border-[#0b5e9e] pb-2">
              {/* Left side: Logo & Tagline */}
              <div className="flex items-start gap-2 text-left">
                <svg viewBox="0 0 512 512" style={{ width: '64px', height: '64px' }} className="text-[#0b5e9e] shrink-0" fill="none">
                  <g>
                    <path fill="currentColor" d="M175.7,351.4c-53.1,0-96.4-43.3-96.4-96.4c0-24.9,9.5-48.6,26.6-66.5l8.2,7.9c-15.1,15.8-23.5,36.7-23.5,58.7c0,46.9,38.1,85.1,85,85.1c46.9,0,85.1-38.2,85.1-85.1v-97.7h11.4v97.7C272.1,308.1,228.9,351.4,175.7,351.4z"/>
                    <path fill="currentColor" d="M175.7,329.1c-41.3,0-74.9-33.6-74.9-74.9c0-19.4,7.3-37.7,20.7-51.7l8.2,7.9c-11.3,11.8-17.5,27.4-17.5,43.9c0,35.1,28.5,63.6,63.5,63.6c35.1,0,63.6-28.5,63.6-63.6v-96.9h11.4v96.9C250.7,295.4,217,329.1,175.7,329.1z"/>
                    <path fill="currentColor" d="M175.7,306.8c-29.5,0-53.4-24-53.4-53.5c0-13.8,5.2-26.9,14.8-36.9l8.2,7.9c-7.5,7.8-11.6,18.2-11.6,29c0,23.2,18.9,42.1,42.1,42.1c23.2,0,42.1-18.9,42.1-42.1v-96.1h11.4v96.1C229.2,282.8,205.2,306.8,175.7,306.8z"/>
                    <path fill="currentColor" d="M175.7,284.4c-17.6,0-32-14.3-32-32c0-8.3,3.1-16.1,8.8-22.1l8.2,7.9c-3.7,3.8-5.7,8.9-5.7,14.2c0,11.4,9.2,20.6,20.6,20.6c11.4,0,20.6-9.2,20.6-20.6v-95.2h11.4v95.2C207.7,270.1,193.3,284.4,175.7,284.4z"/>
                    <path fill="currentColor" d="M400.1,255.1c9.9-7.8,15.9-19.8,15.9-32.7c0-23-18.7-41.6-41.6-41.6h-85.1v11.7h85.1c16.5,0,29.9,13.4,29.9,29.9c0,11.8-7,22.5-17.8,27.3l-12.1,5.4l12.1,5.4c10.8,4.8,17.8,15.5,17.8,27.3c0,16.5-13.4,30-29.9,30H270.2c-2.7,4.1-5.8,8-9,11.7h113.1c23,0,41.6-18.7,41.6-41.7C416,274.8,410,262.8,400.1,255.1z"/>
                    <path fill="currentColor" d="M442.1,218.5c0-33.9-27.6-61.5-61.5-61.5h-91.4v11.4h91.4c27.7,0,50.2,22.5,50.2,50.2c0,12.1-4.4,23.8-12.3,32.8l-3.3,3.7l3.3,3.7c7.9,9.1,12.3,20.8,12.3,32.9c0,27.7-22.5,50.2-50.2,50.2h-132c-5,4.2-10.5,8-16.2,11.4h148.2c33.9,0,61.5-27.6,61.5-61.5c0-13.2-4.3-26-12.1-36.6C437.9,244.6,442.1,231.8,442.1,218.5z"/>
                    <path fill="currentColor" d="M362.7,204.7h-73.5v11.4h73.5c5.4,0,9.7,4.3,9.7,9.7c0,2.6-1,5-2.9,6.9c-1.8,1.8-4.2,2.8-6.8,2.8h-73.5v11.4h73.5c5.7,0,11-2.2,14.9-6.2c4-4,6.2-9.3,6.2-14.9C383.8,214.2,374.3,204.7,362.7,204.7z"/>
                    <path fill="currentColor" d="M362.7,263.3h-73.8c-0.3,3.8-0.8,7.6-1.4,11.4h75.2c5.4,0,9.7,4.4,9.7,9.7c0,2.6-1,5.1-2.9,6.9c-1.8,1.8-4.3,2.8-6.8,2.8h-80.4c-1.4,3.9-3.1,7.7-4.9,11.4h85.4c5.6,0,10.9-2.2,14.8-6.1c4-3.9,6.3-9.3,6.3-15C383.8,272.7,374.3,263.3,362.7,263.3z"/>
                    <path fill="currentColor" d="M255.8,420.3c-64.5,0-129-12.9-192.9-38.6l-2.7-1.1l-0.7-2.8c-24.7-97.3-24.7-177.2,0.2-244.3l0.9-2.4l2.3-0.9c128.4-51.4,258.3-51.4,386.2,0l2.7,1.1l0.7,2.8c24.7,97.3,24.7,177.2-0.2,244.3l-0.9,2.4l-2.3,0.9C384.9,407.4,320.3,420.3,255.8,420.3z M69.8,372.2c123.4,48.9,248.8,48.9,372.7-0.1c22.9-63.7,22.8-139.8-0.3-232.3c-123.4-48.9-248.8-48.9-372.7,0.1C46.6,203.6,46.7,279.7,69.8,372.2z"/>
                  </g>
                </svg>
                <div className="font-serif leading-none mt-0.5">
                  <h2 style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '24px', fontWeight: 'bold', color: '#0b5e9e', lineHeight: '1.0' }}>জনতা ব্যাংক পিএলসি.</h2>
                  <p style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '10px', fontWeight: 'bold', color: '#555555', marginTop: '4px', lineHeight: '1.0' }}>উন্নয়নে আপনার বিশ্বস্ত অংশীদার</p>
                </div>
              </div>

              {/* Right side: Department */}
              <div className="text-right mt-1">
                <h3 style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '18px', fontWeight: 'bold', color: '#000000', lineHeight: '1.0', marginTop: '8px' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h3>
              </div>
            </div>
          ) : (
            <div className="w-full h-[85px] border-b-2 border-transparent pb-2" />
          )}

          {/* Sub-header line: Reference and Date */}
          <div className="w-full flex justify-between items-center text-[12px] pt-1 pb-1 border-b border-black/10 mt-1" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.0', marginBottom: '0.4in' }}>
            <span className="font-bold">সূত্রঃ {orderRef}</span>
            <span className="font-bold">
              তারিখঃ {toBanglaDigits(new Date(orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং
            </span>
          </div>

          {/* Title and Main Body */}
          <div className="flex-1 flex flex-col justify-start pt-2 text-[12px]" contentEditable={true} suppressContentEditableWarning={true} style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.6' }}>
            <div className="space-y-2.5">
              <h2 className="text-center text-[14.5px] font-extrabold underline decoration-black underline-offset-2" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '14.5px', lineHeight: '1.4' }}>
                অফিস নির্দেশ
              </h2>
              
              <p 
                className="text-justify leading-normal mt-2 text-[12px] text-slate-950 text-indent-8"
                style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{ __html: orderText }}
              />

              {/* Redesigned Printed Duty Table */}
              {getGroupedDuties().length > 0 ? (
                <table className="w-full border-collapse border border-black text-center mt-2.5 text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0', borderCollapse: 'collapse', border: '1px solid #000' }}>
                  <thead>
                    <tr className="bg-slate-50 font-bold border-b border-black text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                      <th className="border border-black p-1 w-[8%] text-center" style={{ border: '1px solid #000', padding: '3px', verticalAlign: 'middle', fontSize: '11px' }}>ক্রমিক নং</th>
                      <th className="border border-black p-1 text-left pl-2 w-[25%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px', verticalAlign: 'middle' }}>নির্বাহী/ কর্মকর্তার নাম</th>
                      <th className="border border-black p-1 text-center w-[10%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', verticalAlign: 'middle' }}>পদবী</th>
                      <th className="border border-black p-1 text-left pl-2 w-[35%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px', verticalAlign: 'middle' }}>কাজের বিবরণ</th>
                      <th className="border border-black p-1 text-center w-[22%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', verticalAlign: 'middle' }}>তারিখ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getGroupedDuties().map((group, index) => (
                      <tr key={group.employee.id} className="text-black text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                        <td className="border border-black p-1 text-center font-normal" style={{ border: '1px solid #000', padding: '3px', verticalAlign: 'middle', fontSize: '11px' }}>
                          {toBanglaDigits(index + 1)}
                        </td>
                        <td className="border border-black p-1 text-left pl-2 leading-tight font-normal text-[11px] whitespace-nowrap" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: '11px' }}>
                          {group.employee.name.startsWith(' জনাব') || group.employee.name.startsWith('জনাব') ? group.employee.name : `জনাব ${group.employee.name}`}
                        </td>
                        <td className="border border-black p-1 text-center font-normal" style={{ border: '1px solid #000', padding: '3px', verticalAlign: 'middle', fontSize: '11px' }}>
                          {getShortDesignation(group.employee.designation)}
                        </td>
                        <td className="border border-black p-1 text-left pl-2 leading-normal font-normal text-black" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px', verticalAlign: 'middle', lineHeight: '1.25', fontSize: '11px' }}>
                          {group.description}
                        </td>
                        <td className="border border-black p-1 text-center font-normal font-serif leading-snug tracking-tight" style={{ border: '1px solid #000', padding: '3px', verticalAlign: 'middle', lineHeight: '1.25' }}>
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
              ) : (
                <div className="p-8 border border-dashed border-slate-300 text-center text-slate-400 italic">
                  নির্বাচিত ক্যাটাগরি ও সেলের আন্ডারে কোনো ডিউটি রেকর্ড খুঁজে পাওয়া যায়নি।
                </div>
              )}
            </div>

            {/* Bottom Signature */}
            <div className="flex justify-between items-start text-[12px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.0', marginTop: '1.0in' }}>
              <div className="w-[50%] text-left space-y-0.5 pl-2 leading-none">
                <p className="font-extrabold text-[12px] text-black">({cleanBracketName(signingOfficer) || 'ডিজিএম নাম সিলেক্ট করুন'})</p>
                <p className="font-semibold text-slate-800 text-[12px]">{signingDesignation}</p>
              </div>
              <div className="w-[50%]" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
