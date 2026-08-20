import React from 'react';
import { Lock } from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { LunchRecord } from '../types';

interface LunchBillExecutiveTableProps {
  records: LunchRecord[];
  executives: Array<{ id: number; phone?: string | null }>;
  workingDays: number;
  onAbsenceChange: (employeeId: number, isExec: boolean, val: string) => void;
  onManualDeductionChange: (employeeId: number, isExec: boolean, val: string) => void;
}

export default function LunchBillExecutiveTable({
  records,
  executives,
  workingDays,
  onAbsenceChange,
  onManualDeductionChange
}: LunchBillExecutiveTableProps) {
  const execRecs = records.filter(r => r.isExecutive).sort((a, b) => {
    const priority = (desig: string | null | undefined) => {
      if (!desig) return 3;
      const d = desig.toLowerCase();
      if (d.includes('উপ-মহাব্যবস্থাপক') || d.includes('ডিজিএম') || d.includes('dgm')) return 1;
      if (d.includes('সহকারী মহাব্যবস্থাপক') || d.includes('এজিএম') || d.includes('agm')) return 2;
      return 3;
    };
    const pA = priority(a.designation);
    const pB = priority(b.designation);
    if (pA !== pB) return pA - pB;
    return (a.bankId || '').localeCompare(b.bankId || '', undefined, { numeric: true, sensitivity: 'base' });
  });

  if (execRecs.length === 0) return null;

  const execClaim = execRecs.reduce((sum, r) => sum + r.totalBill, 0);
  const execStamp = execRecs.length * 15;
  const execExtra = execRecs.reduce((sum, r) => sum + (r.additionalDeduction || 0), 0);
  const execGrand = execRecs.reduce((sum, r) => sum + r.netPayable, 0);

  const dgmCount = execRecs.filter(r => {
    const d = (r.designation || '').toLowerCase();
    return d.includes('ডিজিএম') || d.includes('dgm') || d.includes('উপ-মহাব্যবস্থাপক');
  }).length;
  const agmCount = execRecs.filter(r => {
    const d = (r.designation || '').toLowerCase();
    return d.includes('এজিএম') || d.includes('agm') || d.includes('সহকারী মহাব্যবস্থাপক');
  }).length;
  const totalExec = dgmCount + agmCount;

  return (
    <div className="border border-rose-150 dark:border-rose-900/40 rounded-xl overflow-hidden shadow-xs" style={{ borderLeft: '3px solid #db2777' }}>
      <div className="px-4 py-2.5 bg-rose-50/40 dark:bg-rose-950/10 border-b border-rose-150 dark:border-rose-900/40 flex items-center justify-between font-sans">
        <div className="flex items-center gap-2">
          <Lock size={15} className="text-rose-500" />
          <span className="font-extrabold text-xs text-rose-800 dark:text-rose-300 uppercase tracking-wide">
            নির্বাহী প্যানেল (ডিজিএম {toBanglaDigits(dgmCount)} জন + এজিএম {toBanglaDigits(agmCount)} জন = মোট {toBanglaDigits(totalExec)} জন নির্বাহী)
          </span>
        </div>
        <span className="text-xs font-bold text-rose-600 dark:text-rose-350">
          নির্বাহীদের বিল সমষ্টি: ৳{toBanglaDigits(execGrand)}
        </span>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr className="bg-rose-50/30 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300 font-bold text-[11px] border-b border-rose-150 dark:border-rose-900/40 uppercase tracking-wider">
              <th className="py-2.5 px-1 w-7 text-center">ক্রমিক</th>
              <th className="py-2.5 px-2 text-left min-w-[120px]">নির্বাহীর নাম</th>
              <th className="py-2.5 px-1 text-center">পদবী</th>
              <th className="py-2.5 px-1 text-center">ব্যাংক আইডি</th>
              <th className="py-2.5 px-1 text-center">মোবাইল</th>
              <th className="py-2.5 px-1 text-center">দৈনিক হার</th>
              <th className="py-2.5 px-1 text-center">উপস্থিত</th>
              <th className="py-2.5 px-1 text-center bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200">
                অনুপস্থিত (CL) ✍️
              </th>
              <th className="py-2.5 px-1 text-center">মোট দাবী</th>
              <th className="py-2.5 px-1 text-center">স্ট্যাম্প</th>
              <th className="py-2.5 px-1 text-center">অতিরিক্ত কর্তন</th>
              <th className="py-2.5 px-1 text-center">মোট কর্তন</th>
              <th className="py-2.5 px-1.5 text-center bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200">
                প্রাপ্তব্য
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-50 dark:divide-rose-950/20">
            {execRecs.map((r, index) => {
              const additional = r.additionalDeduction ?? 0;
              const totalDed = 15 + additional;
              return (
                <tr key={r.employeeId} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-colors">
                  <td className="py-2 px-1 font-bold text-rose-800 dark:text-rose-300 text-xs">{toBanglaDigits(index + 1)}</td>
                  <td className="py-2 px-2 text-left font-extrabold text-rose-900 dark:text-rose-100 text-xs">{r.employeeName}</td>
                  <td className="py-2 px-1 font-bold text-rose-700 dark:text-rose-300 text-[11px]">{r.designation}</td>
                  <td className="py-2 px-1 text-[11px] font-semibold font-sans">{r.bankId || '-'}</td>
                  <td className="py-2 px-1 font-semibold font-sans text-[10.5px] text-rose-800 dark:text-rose-300">
                    {(() => {
                      const exec = executives.find(e => e.id === r.employeeId);
                      return exec?.phone ? toBanglaDigits(exec.phone) : 'N/A';
                    })()}
                  </td>
                  <td className="py-2 px-1 font-bold font-sans text-slate-500 text-xs">৳{toBanglaDigits(400)}</td>
                  <td className="py-2 px-1 font-bold font-sans tabular-nums text-xs">{toBanglaDigits(r.presentDays)}</td>

                  <td className="py-1 px-1 bg-blue-50/30 dark:bg-blue-950/10">
                    <input
                      type="number"
                      min="0"
                      max={workingDays}
                      value={r.absenceDays === 0 ? '' : r.absenceDays}
                      placeholder="০"
                      onChange={(e) => onAbsenceChange(r.employeeId, true, e.target.value)}
                      aria-label={`${r.employeeName} এর অনুপস্থিত দিন`}
                      className="w-12 h-7 px-1 text-center bg-blue-50/90 hover:bg-blue-50 dark:bg-blue-950/50 dark:hover:bg-blue-950/70 border border-blue-200 dark:border-blue-800 hover:border-indigo-500 focus:border-indigo-500 rounded font-black font-sans text-xs text-blue-950 dark:text-blue-200 transition-all cursor-text"
                    />
                  </td>

                  <td className="py-2 px-1 font-semibold font-sans text-slate-700 dark:text-slate-300 tabular-nums text-xs">৳{toBanglaDigits(r.totalBill)}</td>
                  <td className="py-2 px-1 font-semibold font-sans text-slate-500 tabular-nums text-xs">৳{toBanglaDigits(15)}</td>

                  <td className="py-1 px-1">
                    <input
                      type="number"
                      min="0"
                      value={r.additionalDeduction}
                      onChange={(e) => onManualDeductionChange(r.employeeId, true, e.target.value)}
                      aria-label={`${r.employeeName} এর অতিরিক্ত কর্তন`}
                      className="w-14 h-7 px-1 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:border-indigo-500 font-bold font-sans text-xs"
                    />
                  </td>

                  <td className="py-2 px-1 font-bold font-sans text-rose-700 dark:text-rose-400 tabular-nums text-xs">৳{toBanglaDigits(totalDed)}</td>

                  <td className="py-2 px-1">
                    <span className="font-black text-xs text-emerald-700 dark:text-emerald-350 font-sans tabular-nums bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800/50 inline-block shadow-2xs">
                      ৳{toBanglaDigits(r.netPayable)}
                    </span>
                  </td>
                </tr>
              );
            })}

            <tr className="bg-rose-100/80 dark:bg-rose-900/60 font-bold border-t border-rose-200 dark:border-rose-800">
              <td colSpan={8} className="py-2.5 px-3 text-right pr-4 text-rose-900 dark:text-rose-200 text-xs">
                সর্বমোট (নির্বাহী প্যানেল) =
              </td>
              <td className="py-2.5 px-1 font-sans font-bold text-rose-900 dark:text-rose-200 tabular-nums text-xs">
                ৳{toBanglaDigits(execClaim)}/-
              </td>
              <td className="py-2.5 px-1 font-sans font-bold text-amber-600 dark:text-amber-500 tabular-nums text-xs">
                ৳{toBanglaDigits(execStamp)}/-
              </td>
              <td className="py-2.5 px-1 font-sans font-bold text-amber-600 dark:text-amber-500 tabular-nums text-xs">
                ৳{toBanglaDigits(execExtra)}/-
              </td>
              <td className="py-2.5 px-1 font-sans font-bold text-rose-600 dark:text-rose-400 tabular-nums text-xs">
                ৳{toBanglaDigits(execStamp + execExtra)}/-
              </td>
              <td className="py-2.5 px-1 font-sans">
                <span className="font-black text-xs text-emerald-700 dark:text-emerald-350 tabular-nums bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/80 inline-block shadow-2xs">
                  ৳{toBanglaDigits(execGrand)}/-
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
