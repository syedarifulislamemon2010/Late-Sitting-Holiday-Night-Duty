import React from 'react';
import { AlertCircle, Eye, Trash2 } from 'lucide-react';
import { DutyAssignment } from '../types';

interface RosterConflictModalProps {
  conflictModalData: {
    message: string;
    details?: unknown;
    assignments: DutyAssignment[];
  } | null;
  onClose: () => void;
  onRedirectToConflictingDuties: () => void;
  onOverwriteAndSave: () => void;
}

export default function RosterConflictModal({
  conflictModalData,
  onClose,
  onRedirectToConflictingDuties,
  onOverwriteAndSave
}: RosterConflictModalProps) {
  if (!conflictModalData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-sans">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/50 rounded-2xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
              ⚠️ ডাটা আগে থেকেই সংরক্ষিত ছিল! (Conflict Detected)
            </h3>
            <p className="text-xs text-slate-500 font-medium">ইনপুট কৃত তারিখ ও কর্মকর্তার তথ্য সিস্টেমে আগেই সংরক্ষিত ছিল।</p>
          </div>
        </div>

        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-medium whitespace-pre-line leading-relaxed">
          {conflictModalData.message}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            বাতিল
          </button>
          
          <button
            type="button"
            onClick={onRedirectToConflictingDuties}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye size={14} />
            তালিকায় কনফ্লিক্টিং ডাটা দেখুন
          </button>

          <button
            type="button"
            onClick={onOverwriteAndSave}
            className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={14} />
            কনফ্লিক্টিং ডাটা মুছে সেভ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
