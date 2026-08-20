'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Printer, X } from 'lucide-react';

interface RosterHeaderBannerProps {
  msgBanner: { type: 'success' | 'cancel'; text: string } | null;
  setMsgBanner: (val: { type: 'success' | 'cancel'; text: string } | null) => void;
  pendingDutiesCount: number;
  onOpenPrintMode: () => void;
  isEditingArchive: boolean;
  orderRef: string;
  onExitEditMode: () => void;
}

export default function RosterHeaderBanner({
  msgBanner,
  setMsgBanner,
  pendingDutiesCount,
  onOpenPrintMode,
  isEditingArchive,
  orderRef,
  onExitEditMode
}: RosterHeaderBannerProps) {
  return (
    <>
      {msgBanner && (
        <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 ${
          msgBanner.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${
              msgBanner.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
            }`}>
              {msgBanner.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            </div>
            <span className="text-sm font-semibold">{msgBanner.text}</span>
          </div>
          <button 
            onClick={() => setMsgBanner(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Dashboard Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">ডিউটি রোস্টার ও অফিস আদেশ</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">কর্মকর্তাদের রোস্টার তৈরি করুন এবং সরকারি প্রটোকলে অফিস আদেশ (জিও) জেনারেট করুন।</p>
        </div>
        
        <button
          onClick={onOpenPrintMode}
          disabled={pendingDutiesCount === 0}
          className={`flex items-center justify-center gap-2 text-sm transition-all cursor-pointer ${
            pendingDutiesCount > 0 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold px-4 py-2 rounded-xl' 
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed px-4 py-2 rounded-xl'
          }`}
        >
          <Printer size={16} />
          অফিস আদেশ (A4 সাইজ) দেখুন ও প্রিন্ট করুন
        </button>
      </div>

      {/* Archive Editing Mode Alert Banner */}
      {isEditingArchive && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertCircle size={18} className="animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider">আর্কাইভ সম্পাদন মোড সক্রিয়</h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                আপনি স্মারক সূত্র নম্বর <span className="font-mono font-bold text-amber-900 dark:text-amber-300 break-all">{orderRef}</span> এর অন্তর্গত অর্ডারটি এডিট করছেন।
              </p>
            </div>
          </div>
          <button
            onClick={onExitEditMode}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
          >
            সম্পাদন মোড থেকে বের হন (নতুন অর্ডার শুরু করুন)
          </button>
        </div>
      )}
    </>
  );
}
