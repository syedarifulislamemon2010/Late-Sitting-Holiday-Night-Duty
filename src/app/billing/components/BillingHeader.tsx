import React from 'react';
import { Printer, X, CheckCircle, AlertCircle } from 'lucide-react';

interface BillingHeaderProps {
  showUrlBanner: boolean;
  setShowUrlBanner: (show: boolean) => void;
  msgBanner: { type: 'success' | 'error'; text: string } | null;
  setMsgBanner: (banner: { type: 'success' | 'error'; text: string } | null) => void;
  pendingBillingCount: number;
  onPrintButtonClick: () => void;
}

export default function BillingHeader({
  showUrlBanner,
  setShowUrlBanner,
  msgBanner,
  setMsgBanner,
  pendingBillingCount,
  onPrintButtonClick
}: BillingHeaderProps) {
  return (
    <div className="space-y-4">
      {showUrlBanner && (
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 p-3 rounded-xl flex items-center justify-between shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
            <span>🔗</span>
            <span className="text-sm font-bold tracking-wide">অফিস আদেশ থেকে প্রি-সিলেক্টেড</span>
          </div>
          <button 
            onClick={() => setShowUrlBanner(false)} 
            className="p-1 hover:bg-indigo-200/50 dark:hover:bg-indigo-800/50 rounded-lg text-indigo-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

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
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Action Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">বিল পিডিএফ জেনারেটর</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">কর্মকর্তাদের ক্যাটাগরি ভিত্তিক ভাতার নিখুঁত হিসাব ও জনতা ব্যাংক পিএলসি. এর লিগ্যাল সাইজ বিল মেমো প্রস্তুতকরণ প্যানেল।</p>
        </div>
        
        <button
          onClick={onPrintButtonClick}
          disabled={pendingBillingCount === 0}
          title={pendingBillingCount === 0 ? 'বিল প্রিন্ট করার জন্য কোনো অপেক্ষমান অফিস আদেশ পাওয়া যায়নি' : ''}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
            pendingBillingCount > 0 
              ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white hover:opacity-95 cursor-pointer' 
              : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
          }`}
        >
          <Printer size={16} />
          বিল মেমো (Legal Size) দেখুন ও প্রিন্ট করুন
        </button>
      </div>
    </div>
  );
}
