import { Info } from 'lucide-react';

interface RatesGuidelineCardProps {
  activeChart: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' | null;
  setActiveChart: (chart: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' | null) => void;
}

export function RatesGuidelineCard({ activeChart, setActiveChart }: RatesGuidelineCardProps) {
  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-5">
      <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3 flex justify-between items-center">
        <div>
          <h3 className="app-section-title text-slate-850 dark:text-slate-100 flex items-center gap-2">
            <Info className="text-amber-500" size={20} />
            আপ্যায়ন বিল ও যাতায়াত ভাতা রেট
          </h3>
          <p className="app-body-subtext mt-0.5 font-medium font-sans">
            জনতা ব্যাংক পিএলসি. এর অনুমোদিত নির্দেশিকা। কার্ডে ক্লিক করে অ্যানালিটিক্স দেখুন।
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 font-sans">
        {/* Late Sitting (৳300) */}
        <div 
          onClick={() => setActiveChart(activeChart === 'LATE_SITTING' ? null : 'LATE_SITTING')}
          className={`p-4 sm:p-4.5 bg-gradient-to-br from-indigo-50/35 to-white/60 dark:from-indigo-950/20 dark:to-slate-900/40 border-y border-r border-indigo-100/70 dark:border-indigo-900/40 border-l-4 border-l-indigo-500 rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-normal ease-premium select-none ${
            activeChart === 'LATE_SITTING' ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-sm' : ''
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex justify-between items-center border-b border-indigo-100/40 dark:border-indigo-900/30 pb-2">
              <h4 className="app-card-heading text-indigo-700 dark:text-indigo-400 text-sm sm:text-[15px]">Late Sitting (লেট সিটিং)</h4>
              <span className="app-amount-text text-xs sm:text-sm font-extrabold text-indigo-650 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-100/60 dark:border-indigo-900/40 shadow-xs">৳৩০০</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
              <p className="flex justify-between items-center"><span>• নাস্তা ভাতা:</span> <span className="app-amount-text text-slate-800 dark:text-slate-200">৳১০০</span></p>
              <p className="flex justify-between items-center"><span>• যাতায়াত ভাতা:</span> <span className="app-amount-text text-slate-800 dark:text-slate-200">৳২০০</span></p>
            </div>
          </div>
          <p className="text-[11px] text-rose-500 dark:text-rose-400/90 leading-normal font-semibold pt-2 border-t border-dashed border-indigo-100/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>কর্মদিবসে অফিস ছুটির পর দায়িত্ব পালনের ক্ষেত্রে প্রযোজ্য।</span>
          </p>
        </div>

        {/* Holiday Duty (৳500) */}
        <div 
          onClick={() => setActiveChart(activeChart === 'HOLIDAY' ? null : 'HOLIDAY')}
          className={`p-4 sm:p-4.5 bg-gradient-to-br from-emerald-50/35 to-white/60 dark:from-emerald-955/20 dark:to-slate-900/40 border-y border-r border-emerald-100/70 dark:border-emerald-900/40 border-l-4 border-l-emerald-500 rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-normal ease-premium select-none ${
            activeChart === 'HOLIDAY' ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-sm' : ''
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex justify-between items-center border-b border-emerald-100/40 dark:border-emerald-900/30 pb-2">
              <h4 className="app-card-heading text-emerald-700 dark:text-emerald-400 text-sm sm:text-[15px]">Holiday Duty (সরকারি ছুটি)</h4>
              <span className="app-amount-text text-xs sm:text-sm font-extrabold text-emerald-650 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-100/60 dark:border-emerald-900/40 shadow-xs">৳৫০০</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
              <p className="flex justify-between items-center"><span>• দুপুরের খাবার:</span> <span className="app-amount-text text-slate-800 dark:text-slate-200">৳২৫০</span></p>
              <p className="flex justify-between items-center"><span>• যাতায়াত ভাতা:</span> <span className="app-amount-text text-slate-800 dark:text-slate-200">৳২৫০</span></p>
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400/90 leading-normal font-semibold pt-2 border-t border-dashed border-emerald-100/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>শুক্রবার, শনিবার ও সরকারি ছুটির দিনগুলোতে ডিউটি।</span>
          </p>
        </div>

        {/* Night Shift (৳1000) */}
        <div 
          onClick={() => setActiveChart(activeChart === 'NIGHT_SHIFT' ? null : 'NIGHT_SHIFT')}
          className={`p-4 sm:p-4.5 bg-gradient-to-br from-rose-50/35 to-white/60 dark:from-rose-955/20 dark:to-slate-900/40 border-y border-r border-rose-100/70 dark:border-rose-900/40 border-l-4 border-l-rose-500 rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-normal ease-premium select-none ${
            activeChart === 'NIGHT_SHIFT' ? 'ring-2 ring-rose-500 border-rose-500 shadow-sm' : ''
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex justify-between items-center border-b border-rose-100/40 dark:border-rose-900/30 pb-2">
              <h4 className="app-card-heading text-rose-700 dark:text-rose-400 text-sm sm:text-[15px]">Night Shift (রাত্রীকালীন ডিউটি)</h4>
              <span className="app-amount-text text-xs sm:text-sm font-extrabold text-rose-650 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-100/60 dark:border-rose-900/40 shadow-xs">৳১,০০০</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
              <p className="flex justify-between items-center"><span>• রাতের খাবার (ডিনার):</span> <span className="app-amount-text text-slate-800 dark:text-slate-200">৳৬০০</span></p>
              <p className="flex justify-between items-center"><span>• যাতায়াত ভাতা:</span> <span className="app-amount-text text-slate-800 dark:text-slate-200">৳৪০০</span></p>
            </div>
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400/90 leading-normal font-semibold pt-2 border-t border-dashed border-rose-100/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>রিপোর্ট এর ডাটা এক্সট্রাকশন, ডাটা আপ্লোড এবং ডাউনলোড ডিউটি।</span>
          </p>
        </div>
      </div>
    </div>
  );
}
