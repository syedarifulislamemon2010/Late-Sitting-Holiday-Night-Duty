import { CalendarCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { Holiday, MONTH_NAMES } from '../types';

interface UpcomingHolidaysCardProps {
  finalUpcomingHolidays: Holiday[];
}

export function UpcomingHolidaysCard({ finalUpcomingHolidays }: UpcomingHolidaysCardProps) {
  return (
    <Card
      title="আসন্ন সরকারি ছুটি"
      subtitle="পরবর্তী ক্যালেন্ডার ছুটির দিনসমূহ।"
      actions={
        <span className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-rose-500 animate-pulse">
          <CalendarCheck size={14} />
        </span>
      }
      className="flex-1"
    >
      {finalUpcomingHolidays.length > 0 ? (
        <div className="space-y-3 font-sans">
          {finalUpcomingHolidays.map((holiday: Holiday) => {
            const dateObj = new Date(holiday.date);
            return (
              <div key={holiday.date} className="flex items-center gap-4 hover:bg-slate-50/55 dark:hover:bg-slate-800/30 p-3 rounded-2xl transition-colors border border-slate-100/40 dark:border-slate-800/20 bg-white/40 dark:bg-slate-900/10 shadow-xs">
                <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold text-center shrink-0 border border-rose-100 dark:border-rose-900/30 w-14 shadow-sm">
                  <p className="text-base sm:text-lg font-black leading-none tracking-tight tabular-nums">
                    {toBanglaDigits(dateObj.getDate())}
                  </p>
                  <p className="text-[10px] sm:text-[11px] leading-none mt-1.5 font-bold">
                    {MONTH_NAMES[dateObj.getMonth()]}
                  </p>
                </div>
                <div className="leading-normal space-y-1">
                  <p className="app-card-heading text-slate-850 dark:text-slate-100">{holiday.name}</p>
                  <p className="app-body-subtext text-[11px] sm:text-xs">
                    {toBanglaDigits(dateObj.toLocaleDateString('bn-BD', { weekday: 'long' }))} ({toBanglaDigits(holiday.date)})
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-xs text-slate-400">আসন্ন ছুটির কোনো দিন পাওয়া যায়নি।</p>
        </div>
      )}
    </Card>
  );
}
