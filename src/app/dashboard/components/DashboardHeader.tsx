import Link from 'next/link';
import { Compass, Sparkles } from 'lucide-react';

interface DashboardHeaderProps {
  recentModules: { title: string; url: string }[];
}

export function DashboardHeader({ recentModules }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-6">
      <div>
        <h1 className="app-page-title text-slate-800 dark:text-slate-100 tracking-wide font-sans flex items-center gap-3">
          <Compass className="text-indigo-600 animate-spin-slow" size={28} />
          লেট সিটিং, ছুটির দিনে ও রাত্রীকালীন ডিউটি পোর্টাল
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
          জনতা ব্যাংক পিএলসি. এর অনলাইন ব্যাংকিং ডিপার্টমেন্টের ডিউটি ও আপ্যায়ন ব্যয়ের রিয়েল-টাইম সারসংক্ষেপ।
        </p>

        {/* Navigation Intelligence Layer (Recently Visited) */}
        {recentModules.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] font-bold text-slate-400 font-sans">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-indigo-500 shrink-0" />
              <span>সাম্প্রতিক কার্যক্রম:</span>
            </span>
            {recentModules.map((mod, idx) => (
              <Link 
                key={idx} 
                href={mod.url}
                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-850/60 hover:bg-indigo-55/60 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 border border-slate-200/50 dark:border-slate-800/70 rounded-xl transition-all font-semibold"
              >
                {mod.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
