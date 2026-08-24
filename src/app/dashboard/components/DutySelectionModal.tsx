import { useState } from 'react';
import { Check, X } from 'lucide-react';

interface DutySelectionModalProps {
  dateStr: string;
  formattedDate: string;
  isHoliday: boolean;
  existing: Array<{ id?: number; type?: string; [key: string]: unknown }>;
  initialOption: string;
  onClose: () => void;
  onSave: (option: string) => void;
  saving: boolean;
  error: string | null;
}

export function DutySelectionModal({
  dateStr,
  formattedDate,
  isHoliday,
  existing,
  initialOption,
  onClose,
  onSave,
  saving,
  error
}: DutySelectionModalProps) {
  const [selectedOption, setSelectedOption] = useState(initialOption);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-805 rounded-[28px] shadow-2xl overflow-hidden flex flex-col p-6 space-y-5 animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              📅
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-850 dark:text-slate-100">ডিউটি অ্যাসাইনমেন্ট</h3>
              <p className="text-[11px] font-bold text-indigo-605 dark:text-indigo-400">{formattedDate}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-105 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Existing Duty Status */}
        {existing.length > 0 && (
          <div className="p-3.5 bg-blue-50/50 dark:bg-slate-800/40 border border-blue-100/50 dark:border-slate-850 rounded-2xl">
            <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">বিদ্যমান এন্ট্রি:</span>
            <div className="flex flex-wrap gap-1.5">
              {existing.map(d => {
                const label = d.type === 'LATE_SITTING' ? 'লেট সিটিং' : d.type === 'HOLIDAY' ? 'হলিডে' : 'নাইট ডিউটি';
                const color = d.type === 'LATE_SITTING' ? 'bg-amber-50 text-amber-700 border-amber-100' : d.type === 'HOLIDAY' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-purple-50 text-purple-700 border-purple-100';
                return (
                  <span key={d.id} className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${color}`}>
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Options Selection */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">ডিউটির ধরণ নির্বাচন করুন:</span>
          
          <div className="flex flex-col gap-2.5">
            {!isHoliday ? (
              // Working Day Options (Late Sitting, Night Shift)
              <>
                <button
                  type="button"
                  onClick={() => setSelectedOption('LATE_SITTING')}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedOption === 'LATE_SITTING'
                      ? 'bg-amber-50/75 dark:bg-amber-955/20 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-slate-50/50 dark:bg-slate-905/40 border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-805/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shrink-0">
                    ⏰
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-slate-805 dark:text-slate-250">লেট সিটিং (Late Sitting)</div>
                    <div className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Snacks + Travel allowance (BDT 300)</div>
                  </div>
                  {selectedOption === 'LATE_SITTING' && <Check size={16} className="text-amber-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOption('NIGHT_SHIFT')}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedOption === 'NIGHT_SHIFT'
                      ? 'bg-purple-50/75 dark:bg-purple-955/20 border-purple-500 ring-2 ring-purple-500/20'
                      : 'bg-slate-50/50 dark:bg-slate-905/40 border-slate-205 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-805/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-955/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shrink-0">
                    🌙
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-slate-805 dark:text-slate-250">রাত্রিকালীন ডিউটি (Night Duty)</div>
                    <div className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Dinner + Travel allowance (BDT 1,000)</div>
                  </div>
                  {selectedOption === 'NIGHT_SHIFT' && <Check size={16} className="text-purple-600 shrink-0" />}
                </button>
              </>
            ) : (
              // Holiday/Weekend Options (Holiday, Night Shift, Both)
              <>
                <button
                  type="button"
                  onClick={() => setSelectedOption('HOLIDAY')}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedOption === 'HOLIDAY'
                      ? 'bg-rose-50/75 dark:bg-rose-955/20 border-rose-500 ring-2 ring-rose-500/20'
                      : 'bg-slate-50/50 dark:bg-slate-905/40 border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-805/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-955/30 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg shrink-0">
                    📅
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-slate-805 dark:text-slate-250">ছুটির দিনের ডিউটি (Holiday Duty)</div>
                    <div className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Lunch + Travel allowance (BDT 500)</div>
                  </div>
                  {selectedOption === 'HOLIDAY' && <Check size={16} className="text-rose-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOption('NIGHT_SHIFT')}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedOption === 'NIGHT_SHIFT'
                      ? 'bg-purple-50/75 dark:bg-purple-955/20 border-purple-500 ring-2 ring-purple-500/20'
                      : 'bg-slate-50/50 dark:bg-slate-905/40 border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-850/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shrink-0">
                    🌙
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-slate-805 dark:text-slate-250">রাত্রিকালীন ডিউটি (Night Duty)</div>
                    <div className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Dinner + Travel allowance (BDT 1,000)</div>
                  </div>
                  {selectedOption === 'NIGHT_SHIFT' && <Check size={16} className="text-purple-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOption('BOTH')}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedOption === 'BOTH'
                      ? 'bg-emerald-50/75 dark:bg-emerald-955/20 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/50 dark:bg-slate-905/40 border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-805/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-955/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0">
                    🌟
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-slate-855 dark:text-slate-250">উভয় ডিউটি (Both - Holiday + Night)</div>
                    <div className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Lunch + Dinner + Travel allowance (BDT 1,500)</div>
                  </div>
                  {selectedOption === 'BOTH' && <Check size={16} className="text-emerald-650 shrink-0" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-xs font-bold text-red-550 p-3 bg-red-50 dark:bg-red-955/10 border border-red-150 dark:border-red-900/30 rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {existing.length > 0 && (
            <button
              type="button"
              disabled={saving}
              onClick={() => onSave('DELETE')}
              className="px-4 h-10 border border-red-200 hover:bg-red-50 dark:hover:bg-red-955/10 text-red-650 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              মুছে ফেলুন
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-4.5 h-10 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={saving || !selectedOption}
            onClick={() => onSave(selectedOption)}
            className="px-5 h-10 bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
        </div>

      </div>
    </div>
  );
}
