import { Briefcase, Edit2, Trash2, UserCheck } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Executive, User } from '../types';

interface ExecutiveCardGridProps {
  filteredExecutives: Executive[];
  currentUser: User | null;
  setProfileExec: (exec: Executive) => void;
  startEditExec: (exec: Executive) => void;
  deleteExec: (exec: Executive) => void;
}

export function ExecutiveCardGrid({
  filteredExecutives,
  currentUser,
  setProfileExec,
  startEditExec,
  deleteExec
}: ExecutiveCardGridProps) {
  if (filteredExecutives.length === 0) {
    return (
      <EmptyState
        icon={UserCheck}
        title="কোনো নির্বাহী কর্মকর্তা পাওয়া যায়নি"
        description="খুঁজে পাওয়া ডাটা খালি। অনুগ্রহ করে অন্য নাম লিখুন বা নতুন নির্বাহী যোগ করুন।"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredExecutives.map((exec) => {
        const dgmIndices = filteredExecutives
          .filter(e => e.designation.includes('উপ-মহাব্যবস্থাপক') || e.designation.includes('ডিজিএম') || e.designation.toLowerCase().includes('dgm'))
          .map(e => e.id);
        const dgmRank = dgmIndices.indexOf(exec.id) + 1;
        const isDGM = dgmRank > 0;
        
        let accentColor = '#0ea5e9'; // default sky-blue for AGMs
        let borderClass = 'border-sky-200 dark:border-sky-900/50';
        let bgClass = 'bg-sky-50/10 dark:bg-sky-950/5 text-sky-800 dark:text-sky-300';
        let textClass = 'text-sky-800 dark:text-sky-200 group-hover:text-sky-950';
        let badgeClass = 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30';
        
        if (isDGM) {
          if (dgmRank === 1) {
            // Royal Blue
            accentColor = '#2563eb';
            borderClass = 'border-blue-200 dark:border-blue-900/50';
            bgClass = 'bg-blue-50/10 dark:bg-blue-950/5 text-blue-800 dark:text-blue-300';
            textClass = 'text-blue-800 dark:text-blue-200 group-hover:text-blue-950';
            badgeClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
          } else if (dgmRank === 2) {
            // Amber/Orange
            accentColor = '#d97706';
            borderClass = 'border-amber-200 dark:border-amber-900/50';
            bgClass = 'bg-amber-50/10 dark:bg-amber-950/5 text-amber-800 dark:text-amber-300';
            textClass = 'text-amber-800 dark:text-amber-250 group-hover:text-amber-950';
            badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
          } else {
            // Teal
            accentColor = '#0d9488';
            borderClass = 'border-teal-200 dark:border-teal-900/50';
            bgClass = 'bg-teal-50/10 dark:bg-teal-950/5 text-teal-800 dark:text-teal-300';
            textClass = 'text-teal-800 dark:text-teal-250 group-hover:text-teal-950';
            badgeClass = 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30';
          }
        }
        
        return (
          <div key={exec.id} className={`p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all duration-300 group border-l-3 ${borderClass} ${bgClass}`} style={{ borderLeft: `3px solid ${accentColor}` }}>
            <div className="space-y-4 cursor-pointer" onClick={() => setProfileExec(exec)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className={`font-extrabold text-base leading-tight transition-colors ${textClass}`}>{exec.name}</h3>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1.5">
                    <Briefcase size={12} className="text-slate-450" />
                    {exec.designation}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans ${badgeClass} shrink-0`}>
                  Executive
                </span>
              </div>

              {(exec.bankId || exec.fileNo) && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  {exec.bankId && (
                    <div className="flex items-center gap-1">
                      <span className="font-bold">আইডি: {exec.bankId}</span>
                    </div>
                  )}
                  {exec.fileNo && (
                    <div className="flex items-center gap-1">
                      <span className="font-bold">নথি নং: {exec.fileNo}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {currentUser?.role === 'ADMIN' && (
              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-200/50 dark:border-slate-800/80 font-sans">
                <button
                  onClick={() => startEditExec(exec)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                  title="সম্পাদনা"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => deleteExec(exec)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
