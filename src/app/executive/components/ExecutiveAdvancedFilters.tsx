import { STRICT_DESIGNATIONS } from '../types';

interface ExecutiveAdvancedFiltersProps {
  filterDesignation: string;
  setFilterDesignation: (value: string) => void;
  filterPhoneStatus: string;
  setFilterPhoneStatus: (value: string) => void;
  filterBankIdStatus: string;
  setFilterBankIdStatus: (value: string) => void;
  filterFileNoStatus: string;
  setFilterFileNoStatus: (value: string) => void;
}

export function ExecutiveAdvancedFilters({
  filterDesignation,
  setFilterDesignation,
  filterPhoneStatus,
  setFilterPhoneStatus,
  filterBankIdStatus,
  setFilterBankIdStatus,
  filterFileNoStatus,
  setFilterFileNoStatus
}: ExecutiveAdvancedFiltersProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 animate-fadeIn">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">পদবী (Designation)</label>
        <select
          value={filterDesignation}
          onChange={(e) => setFilterDesignation(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-755 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="ALL">সকল পদবী (All)</option>
          {STRICT_DESIGNATIONS.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">মোবাইল নম্বর</label>
        <select
          value={filterPhoneStatus}
          onChange={(e) => setFilterPhoneStatus(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-755 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="ALL">সবাই (All)</option>
          <option value="has_phone">মোবাইল নম্বর আছে</option>
          <option value="no_phone">মোবাইল নম্বর নেই</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ব্যাংক আইডি</label>
        <select
          value={filterBankIdStatus}
          onChange={(e) => setFilterBankIdStatus(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-855 bg-white dark:bg-slate-955 text-xs font-semibold text-slate-755 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="ALL">সবাই (All)</option>
          <option value="has_bank_id">ব্যাংক আইডি আছে</option>
          <option value="no_bank_id">ব্যাংক আইডি নেই</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">নথি নম্বর</label>
        <select
          value={filterFileNoStatus}
          onChange={(e) => setFilterFileNoStatus(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-755 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="ALL">সবাই (All)</option>
          <option value="has_file_no">নথি নম্বর আছে</option>
          <option value="no_file_no">নথি নম্বর নেই</option>
        </select>
      </div>
    </div>
  );
}
