import Link from 'next/link';
import { Calendar, X } from 'lucide-react';
import { Holiday } from '../types';

interface HolidayReminderBannerProps {
  isAdmin: boolean;
  holidays: Holiday[];
  showHolidayReminder: boolean;
  setShowHolidayReminder: (show: boolean) => void;
}

export function HolidayReminderBanner({
  isAdmin,
  holidays,
  showHolidayReminder,
  setShowHolidayReminder
}: HolidayReminderBannerProps) {
  const currentMonth = new Date().getMonth();
  const nextYear = new Date().getFullYear() + 1;
  const hasNextYearHolidays = holidays.some(h => h.date.startsWith(nextYear.toString()));

  if (!isAdmin || currentMonth < 10 || hasNextYearHolidays || !showHolidayReminder) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-xl">
          <Calendar size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
            📅 আগামী বছরের ({nextYear}) সরকারি ছুটির তালিকা এখনো আপলোড করা হয়নি।
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link 
          href="/settings" 
          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          আপলোড করুন →
        </Link>
        <button 
          onClick={() => setShowHolidayReminder(false)}
          className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 p-1 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
