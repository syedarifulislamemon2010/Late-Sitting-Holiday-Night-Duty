import { AlertCircle } from 'lucide-react';

interface ExecutiveBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulkText: string;
  setBulkText: React.Dispatch<React.SetStateAction<string>>;
  bulkError: string;
  bulkImporting: boolean;
  isImageImportLoading: boolean;
  handleBulkSubmit: (e: React.FormEvent) => Promise<void>;
  handleTextareaPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => Promise<void>;
}

export function ExecutiveBulkModal({
  isOpen,
  onClose,
  bulkText,
  setBulkText,
  bulkError,
  bulkImporting,
  isImageImportLoading,
  handleBulkSubmit,
  handleTextareaPaste
}: ExecutiveBulkModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 font-sans">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
            নির্বাহী বাল্ক টেক্সট আপলোড (Bulk Import)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-sans text-xl cursor-pointer">×</button>
        </div>
        
        <form onSubmit={handleBulkSubmit} className="p-6 space-y-4 font-sans">
          {bulkError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              {bulkError}
            </div>
          )}

          {/* Informative Clipboard Paste Banner */}
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-xl text-xs space-y-1">
            <p className="font-bold text-indigo-700 dark:text-indigo-400">💡 ক্লিপবোর্ড ইমেজ ইম্পোর্ট (Clipboard Image Import):</p>
            <p className="text-slate-600 dark:text-slate-400 leading-normal">
              নির্বাহী কর্মকর্তাদের নামের তালিকা সম্বলিত কোনো ইমেজ বা স্ক্রিনশট কপি করা থাকলে সরাসরি এই টেক্সটবক্সে পেস্ট (<kbd className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded shadow-sm text-[10px] font-sans font-bold">Ctrl + V</kbd>) করুন! কৃত্রিম বুদ্ধিমত্তা ছবি থেকে সকল নাম ও পদবী স্বয়ংক্রিয়ভাবে টেক্সট হিসেবে রূপান্তর করে দেবে।
            </p>
          </div>

          <div className="space-y-1.5 font-sans">
            <label htmlFor="bulk_exec_file" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              অথবা CSV / Text ফাইল আপলোড করুন
            </label>
            <input
              id="bulk_exec_file"
              type="file"
              accept=".csv,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const text = event.target?.result as string;
                  setBulkText(text);
                };
                reader.readAsText(file);
              }}
              className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950/40 dark:file:text-indigo-400 hover:file:bg-indigo-100 transition-all cursor-pointer border border-dashed border-slate-300 dark:border-slate-800 p-2 rounded-xl bg-slate-50/20"
            />
          </div>

          <div className="space-y-1.5 font-sans">
            <div className="flex justify-between items-center font-sans">
              <label htmlFor="bulk_exec_text" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                নির্বাহী কর্মকর্তার নাম ও পদবী (প্রতি লাইনে একজন) *
              </label>
              {isImageImportLoading && (
                <span className="text-[10px] text-indigo-600 dark:text-indigo-450 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 border border-indigo-600 border-t-transparent rounded-full animate-spin inline-block" />
                  বিশ্লেষণ করা হচ্ছে...
                </span>
              )}
            </div>
            <textarea
              id="bulk_exec_text"
              required
              rows={8}
              placeholder={`যেমন:\nজনাব চৌধুরী আশিকুর রহমান - উপ-মহাব্যবস্থাপক\nজনাব মোহাম্মদ সোহরাব হোসেন - সহকারী মহাব্যবস্থাপক\n\n(অথবা নির্বাহী কর্মকর্তাদের তালিকার কোনো ছবি এখানে সরাসরি Ctrl+V দিয়ে পেস্ট করুন)`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              onPaste={handleTextareaPaste}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
              disabled={isImageImportLoading}
            />
            <p className="text-[10px] text-slate-400">
              প্যাটার্ন: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">নাম - পদবী</code> (যেমন: নাম ও পদবীর মাঝে হাইফেন <strong>-</strong> বা কমা <strong>,</strong> ব্যবহার করুন)। পদবী না দিলে স্বয়ংক্রিয়ভাবে &quot;উপ-মহাব্যবস্থাপক&quot; ধরা হবে।
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={bulkImporting || isImageImportLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 cursor-pointer"
            >
              {bulkImporting ? 'আমদানি হচ্ছে...' : 'ইম্পোর্ট করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
