import { Info } from 'lucide-react';

interface LeaveSummaryCardProps {
  leaveDetails: {
    totalDays: number;
    isSandwiched: boolean;
    sandwichedCount: number;
    actualDeducted: number;
  };
  leaveType: string;
  toBanglaDigits: (num: number | string) => string;
}

export default function LeaveSummaryCard({ leaveDetails, leaveType, toBanglaDigits }: LeaveSummaryCardProps) {
  if (leaveDetails.actualDeducted <= 0) return null;

  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900 rounded-2xl space-y-2 mt-4">
      <h4 className="font-extrabold text-amber-900 dark:text-amber-400 text-xs flex items-center gap-1">
        <Info size={14} />
        ছুটি হিসাব বিবরণী (স্যান্ডউইচ নিয়ম অনুসারে):
      </h4>
      <div className="text-[11px] text-amber-805 dark:text-amber-305 font-medium space-y-1">
        <p>• মোট ক্যালেন্ডার দিন: <span className="font-bold">{toBanglaDigits(leaveDetails.totalDays)} দিন</span></p>
        <p>• অডিট টাইপ: <span className="font-bold">{leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : 'আগাম নৈমিত্তিক'}</span></p>
        <p>• স্যান্ডউইচ পরিস্থিতি: <span className="font-bold">{leaveDetails.isSandwiched ? 'হ্যাঁ (ছুটির মাঝখানে Sandwich হয়েছে)' : 'না'}</span></p>
        {leaveDetails.isSandwiched && (
          <p className="text-rose-650 dark:text-rose-400 font-bold">• ছুটি পরবর্তী বন্ধের দিন (+{toBanglaDigits(leaveDetails.sandwichedCount)} দিন) মূল ছুটির সাথে যুক্ত করা হয়েছে.</p>
        )}
        <div className="h-px bg-amber-200 dark:bg-amber-900 my-1.5" />
        <p className="text-xs font-bold text-slate-800 dark:text-slate-205">কাটা যাওয়ার জন্য মোট হিসাবকৃত দিন: <span className="text-indigo-600 dark:text-indigo-400 text-sm font-extrabold">{toBanglaDigits(leaveDetails.actualDeducted)} দিন</span></p>
      </div>
    </div>
  );
}
