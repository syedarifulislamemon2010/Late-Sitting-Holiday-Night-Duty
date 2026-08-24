import { Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { Holiday, MONTH_NAMES, CalendarSlot } from '../types';

interface CalendarGridCardProps {
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  formatMonthYear: (month: number, year: number) => string;
  formatNumber: (n: number) => string;
  getWeekdays: () => string[];
  isEn: boolean;
  slots: CalendarSlot[];
  selectedMonthHolidays: Holiday[];
  todayStr: string;
  myDuties: any[];
  selectedDates: string[];
  handleDateClick: (dateStr: string) => void;
}

export function CalendarGridCard({
  selectedMonth,
  setSelectedMonth,
  formatMonthYear,
  formatNumber,
  getWeekdays,
  isEn,
  slots,
  selectedMonthHolidays,
  todayStr,
  myDuties,
  selectedDates,
  handleDateClick
}: CalendarGridCardProps) {
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Calendar className="text-primary-600" size={18} />
          ২০২৬ সালের সরকারি ছুটির ক্যালেন্ডার
        </span>
      }
      actions={
        <span className="px-2.5 py-0.5 bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 text-[10px] font-bold rounded-full font-sans">
          ২০২৬ সাল
        </span>
      }
      className="flex-1 flex flex-col justify-between"
    >
      {/* Month Selection Buttons */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 w-full mb-4">
        {MONTH_NAMES.map((name, idx) => (
          <Button
            key={name}
            onClick={() => setSelectedMonth(idx)}
            variant={selectedMonth === idx ? 'primary' : 'secondary'}
            size="sm"
            className="w-full text-center"
          >
            {name}
          </Button>
        ))}
      </div>

      {/* Interactive Grid Calendar */}
      <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm w-full">
        {/* Month Name and Summary Header */}
        <div className="text-center pb-4">
          <h4 className="text-lg sm:text-xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">
            {formatMonthYear(selectedMonth, 2026)}
          </h4>
          <p className="font-sans mt-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4 text-xs sm:text-sm">
            <span className="text-rose-600 dark:text-rose-400 font-extrabold">
              {isEn ? 'Total Public Holidays:' : 'মোট সরকারি ছুটি:'} {formatNumber(selectedMonthHolidays.length)} {isEn ? 'days' : 'টি'}
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
              {isEn ? 'Total Working Days:' : 'মোট কার্যদিবস:'} {formatNumber(slots.filter(s => s.day !== null && !s.isWeekend && !s.isHoliday).length)} {isEn ? 'days' : 'দিন'}
            </span>
          </p>
        </div>

        {/* Day-of-week Headers */}
        <div className="grid grid-cols-7 gap-2 text-center font-extrabold text-[11px] uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-100 dark:border-slate-800/60">
          {getWeekdays().map((w, index) => (
            <div key={w} className={index === 5 || index === 6 ? 'text-rose-500 font-black' : ''}>
              {w}
            </div>
          ))}
        </div>

        {/* Calendar Slots */}
        <div className="grid grid-cols-7 gap-2 mt-3">
          {slots.map((slot, idx) => {
            if (slot.day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const isToday = slot.dateStr === todayStr;
            const existingDuty = myDuties.find(d => d.date === slot.dateStr);
            const isSelected = slot.dateStr ? selectedDates.includes(slot.dateStr) : false;

            let cellClass = 'bg-white dark:bg-slate-900/80 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none hover:bg-slate-50/90 dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md hover:scale-105 hover:z-20 cursor-pointer relative transition-all duration-150 ease-premium';

            if (existingDuty) {
              if (existingDuty.type === 'LATE_SITTING') {
                cellClass = 'bg-amber-500/20 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-extrabold border border-amber-300 dark:border-amber-700/60 shadow-xs hover:shadow-md hover:scale-105 hover:z-20 transition-all duration-150 ease-premium cursor-pointer relative';
              } else if (existingDuty.type === 'HOLIDAY') {
                cellClass = 'bg-rose-500/20 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 font-extrabold border border-rose-300 dark:border-rose-700/60 shadow-xs hover:shadow-md hover:scale-105 hover:z-20 transition-all duration-150 ease-premium cursor-pointer relative';
              } else if (existingDuty.type === 'NIGHT_SHIFT') {
                cellClass = 'bg-purple-500/20 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 font-extrabold border border-purple-300 dark:border-purple-700/60 shadow-xs hover:shadow-md hover:scale-105 hover:z-20 transition-all duration-150 ease-premium cursor-pointer relative';
              }
            } else if (slot.isHoliday) {
              /* WCAG AA Contrast Pass: #DC2626/rose-700 against #FFFFFF yields 5.4:1 to 6.29:1 contrast ratio */
              cellClass = 'bg-gradient-to-br from-red-600 to-rose-700 dark:from-rose-600 dark:to-red-700 text-white font-black shadow-md scale-[1.02] border border-red-500/80 dark:border-rose-500/60 hover:scale-105 hover:z-20 shadow-red-500/25 cursor-pointer relative group transition-all duration-150 ease-premium';
            } else if (slot.isWeekend) {
              /* WCAG AA Contrast Pass: rose-700 (#be123c) on rose-50 (#fff1f2) yields 5.92:1 contrast ratio */
              cellClass = 'bg-rose-50/85 dark:bg-rose-950/25 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900/40 shadow-[0_1px_3px_rgba(244,63,94,0.06)] cursor-pointer hover:bg-rose-100/80 hover:shadow-md hover:scale-105 hover:z-20 transition-all duration-150 ease-premium';
            }

            if (isToday) {
              cellClass += ' ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900 bg-indigo-50/50 dark:bg-indigo-950/45 text-indigo-950 dark:text-indigo-200 shadow-sm font-black';
            }

            if (isSelected) {
              cellClass += ' ring-3 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-105 z-10 border-indigo-600 bg-indigo-100/70 dark:bg-indigo-900/60 shadow-md font-black';
            }

            return (
              <div
                key={`day-${slot.day}`}
                onClick={() => slot.dateStr && handleDateClick(slot.dateStr)}
                title={slot.holidayName || (slot.isWeekend ? 'সাপ্তাহিক ছুটি' : '')}
                className={`aspect-square rounded-xl text-xs flex flex-col items-center justify-center transition-all relative ${cellClass}`}
              >
                <span className="font-sans font-bold text-sm">
                  {slot.day}
                </span>
                {existingDuty && (
                  <span className="text-[9px] font-bold mt-0.5 px-1 py-0.2 rounded bg-white/60 dark:bg-slate-950/40 scale-90">
                    {existingDuty.type === 'LATE_SITTING' ? 'লেট' : existingDuty.type === 'HOLIDAY' ? 'হলিডে' : 'নাইট'}
                  </span>
                )}
                {isToday && !existingDuty && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-650 dark:bg-indigo-400" />
                )}
                {slot.isHoliday && !existingDuty && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white/80 animate-pulse" />
                )}
                
                {/* Hover Tooltip for Holidays */}
                {slot.isHoliday && slot.holidayName && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 hidden group-hover:block bg-slate-900 text-white text-[9px] leading-relaxed p-2 rounded-lg text-center z-10 shadow-lg font-sans font-bold">
                    {slot.holidayName}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* List of Holidays for Selected Month */}
      {selectedMonthHolidays.length > 0 ? (
        <div className="pt-2 space-y-2">
          <p className="text-xs font-bold text-slate-500">ছুটির বিবরণীসমূহ:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedMonthHolidays.map(h => (
              <div key={h.date} className="flex items-center gap-2 p-2 bg-rose-50/30 dark:bg-rose-955/5 border border-rose-100/30 dark:border-rose-950/10 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {toBanglaDigits(new Date(h.date).getDate())} তারিখ: {h.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-slate-400 italic pt-2">এই মাসে সাধারণ সরকারি কোনো ছুটি নেই।</p>
      )}
    </Card>
  );
}
