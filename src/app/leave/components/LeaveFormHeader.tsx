import Link from 'next/link';
import { ArrowLeft, Printer, FileEdit, FileText, CalendarCheck } from 'lucide-react';

interface LeaveFormHeaderProps {
  handlePrint: () => void;
  handleDownloadDocx: () => void;
}

export default function LeaveFormHeader({ handlePrint, handleDownloadDocx }: LeaveFormHeaderProps) {
  return (
    <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
      <div>
        <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-wide">
          <CalendarCheck className="text-indigo-650 shrink-0" size={24} />
          ছুটির আবেদনপত্র প্রিপারেশন ও প্রিন্টিং পোর্টাল
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
          নৈমিত্তিক ছুটি, ঘটনাত্তোর ছুটি ও কর্মস্থল ত্যাগের অনুমতিসহ ছুটির দরখাস্ত তৈরি ও প্রিন্ট করার আধুনিক প্যানেল।
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
          <ArrowLeft size={14} />
          ড্যাশবোর্ড
        </Link>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Printer size={14} />
          প্রিন্ট প্রিভিউ
        </button>

        <button
          onClick={handleDownloadDocx}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          title="সম্পাদনা করার জন্য Word (.docx) ফাইল ডাউনলোড করুন"
        >
          <FileEdit size={14} />
          ডাউনলোড ওয়ার্ড (.docx)
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <FileText size={14} />
          ডাউনলোড পিডিএফ
        </button>
      </div>
    </div>
  );
}
