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

      <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 shrink-0">
        <button
          onClick={exportExecutivesToCSV}
          className="whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <Download size={14} />
          <span>এক্সপোর্ট করুন</span>
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
          className="whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Eye size={14} />
          <span>প্রিন্ট প্রিভিউ</span>
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
          className="whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {generating ? <Loader2 className="animate-spin" size={14} /> : <Printer size={14} />}
          <span>ডাউনলোড পিডিএফ</span>
        </button>
        {currentUser?.role === 'ADMIN' && (
          <>
            <button
              onClick={openBulkModal}
              className="whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Plus size={14} />
              <span>বাল্ক টেক্সট আপলোড</span>
            </button>
            <button
              onClick={openNewExecModal}
              className="whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>নতুন নির্বাহী যুক্ত করুন</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
