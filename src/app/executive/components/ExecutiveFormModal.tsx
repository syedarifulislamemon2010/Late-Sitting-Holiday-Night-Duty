import { AlertCircle } from 'lucide-react';
import { Executive, STRICT_DESIGNATIONS } from '../types';

interface ExecutiveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExec: Executive | null;
  form: {
    name: string;
    designation: string;
    bankId: string;
    fileNo: string;
  };
  setForm: (form: {
    name: string;
    designation: string;
    bankId: string;
    fileNo: string;
  }) => void;
  errorMessage: string;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function ExecutiveFormModal({
  isOpen,
  onClose,
  editingExec,
  form,
  setForm,
  errorMessage,
  handleSubmit
}: ExecutiveFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
            {editingExec ? 'নির্বাহী তথ্য সম্পাদনা' : 'নতুন নির্বাহী কর্মকর্তা যোগ করুন'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-sans text-xl cursor-pointer">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="exec_name" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">কর্মকর্তার নাম *</label>
            <input
              id="exec_name"
              type="text"
              required
              placeholder="যেমন: জনাব মোহাম্মদ সোহরাব হোসেন"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="exec_designation" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">পদবী *</label>
            <select
              id="exec_designation"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
            >
              {STRICT_DESIGNATIONS.map((desig) => (
                <option key={desig} value={desig}>{desig}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="exec_bankId" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ব্যাংক আইডি (ঐচ্ছিক)</label>
            <input
              id="exec_bankId"
              type="text"
              placeholder="যেমন: 026799"
              value={form.bankId}
              onChange={(e) => setForm({ ...form, bankId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="exec_fileNo" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ব্যক্তিগত নথি নম্বর (File No) (ঐচ্ছিক)</label>
            <input
              id="exec_fileNo"
              type="text"
              placeholder="যেমন: DGM(Com)-026799"
              value={form.fileNo}
              onChange={(e) => setForm({ ...form, fileNo: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
