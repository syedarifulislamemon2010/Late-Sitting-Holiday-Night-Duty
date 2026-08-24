import { Search, Filter, Download, Eye, Printer, Loader2, Plus } from 'lucide-react';
import { User } from '../types';

interface ExecutiveControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  filterDesignation: string;
  filterPhoneStatus: string;
  filterBankIdStatus: string;
  filterFileNoStatus: string;
  exportExecutivesToCSV: () => void;
  generateEmployeeList: () => Promise<string | null>;
  generating: boolean;
  setIframeUrl: (url: string) => void;
  setIsPreviewOpen: (open: boolean) => void;
  openBulkModal: () => void;
  openNewExecModal: () => void;
  currentUser: User | null;
}

export function ExecutiveControls({
  searchQuery,
  setSearchQuery,
  showAdvancedFilters,
  setShowAdvancedFilters,
  filterDesignation,
  filterPhoneStatus,
  filterBankIdStatus,
  filterFileNoStatus,
  exportExecutivesToCSV,
  generateEmployeeList,
  generating,
  setIframeUrl,
  setIsPreviewOpen,
  openBulkModal,
  openNewExecModal,
  currentUser
}: ExecutiveControlsProps) {
  const isFilterActive =
    showAdvancedFilters ||
    filterDesignation !== 'ALL' ||
    filterPhoneStatus !== 'ALL' ||
    filterBankIdStatus !== 'ALL' ||
    filterFileNoStatus !== 'ALL';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
      <div className="flex flex-1 gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="নির্বাহী কর্মকর্তার নাম বা পদবী দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/30 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        {/* Advanced Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            isFilterActive
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400 font-bold'
              : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350'
          }`}
        >
          <Filter size={14} />
          <span>ফিল্টারসমূহ</span>
          {(filterDesignation !== 'ALL' || filterPhoneStatus !== 'ALL' || filterBankIdStatus !== 'ALL' || filterFileNoStatus !== 'ALL') && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
          )}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        <button
          onClick={exportExecutivesToCSV}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-100/50 dark:shadow-none transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <Download size={16} />
          এক্সপোর্ট করুন
        </button>
        <button
          onClick={async () => {
            const path = await generateEmployeeList();
            if (path) {
              setIframeUrl(path);
              setIsPreviewOpen(true);
            }
          }}
          disabled={generating}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Eye size={16} />
          প্রিন্ট প্রিভিউ
        </button>
        <button
          onClick={async () => {
            const path = await generateEmployeeList();
            if (path) {
              const printIframe = document.getElementById('silent-print-iframe') as HTMLIFrameElement;
              if (printIframe) {
                printIframe.src = path;
                printIframe.onload = () => {
                  printIframe.contentWindow?.focus();
                  printIframe.contentWindow?.print();
                };
              }
            }
          }}
          disabled={generating}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors cursor-pointer disabled:opacity-50"
        >
          {generating ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
          ডাউনলোড পিডিএফ
        </button>
        {currentUser?.role === 'ADMIN' && (
          <>
            <button
              onClick={openBulkModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Plus size={16} />
              বাল্ক টেক্সট আপলোড
            </button>
            <button
              onClick={openNewExecModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors cursor-pointer"
            >
              <Plus size={16} />
              নতুন নির্বাহী যুক্ত করুন
            </button>
          </>
        )}
      </div>
    </div>
  );
}
