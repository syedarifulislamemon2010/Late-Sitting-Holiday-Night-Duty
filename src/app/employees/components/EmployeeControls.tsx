'use client';

import React from 'react';
import { 
  Users, 
  Building2, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Printer, 
  Plus, 
  Loader2 
} from 'lucide-react';
import { Cell } from '../types';

interface EmployeeControlsProps {
  activeTab: 'employees' | 'cells';
  setActiveTab: (tab: 'employees' | 'cells') => void;
  isAdminOrAdminCell: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cellFilter: string;
  setCellFilter: (filter: string) => void;
  cells: Cell[];
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  filterDesignation: string;
  filterPhoneStatus: string;
  filterBankIdStatus: string;
  filterFileNoStatus: string;
  generating: boolean;
  exportEmployeesToCSV: () => void;
  handlePrintPreview: () => void;
  handleDirectPrint: () => void;
  onOpenBulkEmpModal: () => void;
  onOpenNewEmpModal: () => void;
  canCreateEmployee: boolean;
}

export default function EmployeeControls({
  activeTab,
  setActiveTab,
  isAdminOrAdminCell,
  searchQuery,
  setSearchQuery,
  cellFilter,
  setCellFilter,
  cells,
  showAdvancedFilters,
  setShowAdvancedFilters,
  filterDesignation,
  filterPhoneStatus,
  filterBankIdStatus,
  filterFileNoStatus,
  generating,
  exportEmployeesToCSV,
  handlePrintPreview,
  handleDirectPrint,
  onOpenBulkEmpModal,
  onOpenNewEmpModal,
  canCreateEmployee
}: EmployeeControlsProps) {
  const hasActiveFilters = 
    filterDesignation !== 'ALL' || 
    filterPhoneStatus !== 'ALL' || 
    filterBankIdStatus !== 'ALL' || 
    filterFileNoStatus !== 'ALL';

  return (
    <div className="space-y-4">
      {/* Page Title & Tabs Toggler */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">কর্মকর্তা ও সেল ডিরেক্টরি</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">কর্মকর্তাবৃন্দ এবং সেল (Cell) ম্যানেজমেন্ট প্যানেল।</p>
        </div>
        
        {isAdminOrAdminCell && (
          <div className="flex bg-slate-200/60 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800/80 self-start md:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'employees' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users size={14} />
              কর্মকর্তাবৃন্দ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cells')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'cells' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Building2 size={14} />
              সেলসমূহ
            </button>
          </div>
        )}
      </div>

      {activeTab === 'employees' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="কর্মকর্তার নাম, পদবী, ব্যাংক আইডি বা নথি নং দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>
            
            {/* Cell Selector Filter */}
            {isAdminOrAdminCell && (
              <select
                value={cellFilter}
                onChange={(e) => setCellFilter(e.target.value)}
                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
              >
                <option value="select">সিলেক্ট করুন (Select Cell)</option>
                <option value="all">সকল সেলের কর্মকর্তা (All Cells)</option>
                <option value="executives">নির্বাহী কর্মকর্তা (Executives)</option>
                {cells.map(c => (
                  <option key={c.id} value={c.id.toString()}>{c.name}</option>
                ))}
              </select>
            )}

            {/* Advanced Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`h-10 flex items-center justify-center gap-1.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-900/40 dark:text-indigo-400 font-bold'
                  : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Filter size={14} />
              <span>ফিল্টারসমূহ</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto md:justify-end">
            {/* Export CSV */}
            <button
              type="button"
              onClick={exportEmployeesToCSV}
              disabled={cellFilter === 'select'}
              className="h-10 flex items-center justify-center gap-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Download size={15} />
              <span>এক্সপোর্ট করুন</span>
            </button>
            
            {/* Print Preview */}
            <button
              type="button"
              onClick={handlePrintPreview}
              disabled={generating || cellFilter === 'select'}
              className="h-10 flex items-center justify-center gap-2 px-4 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {generating ? <Loader2 className="animate-spin" size={15} /> : <Eye size={15} />}
              <span>প্রিন্ট প্রিভিউ</span>
            </button>
            
            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDirectPrint}
              disabled={generating || cellFilter === 'select'}
              className="h-10 flex items-center justify-center gap-2 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? <Loader2 className="animate-spin" size={15} /> : <Printer size={15} />}
              <span>ডাউনলোড পিডিএফ</span>
            </button>

            {canCreateEmployee && (
              <>
                {/* Bulk Text Upload */}
                <button
                  type="button"
                  onClick={onOpenBulkEmpModal}
                  className="h-10 flex items-center justify-center gap-2 px-4 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer"
                >
                  <Plus size={15} />
                  <span>বাল্ক টেক্সট আপলোড</span>
                </button>

                {/* Add New Officer */}
                <button
                  type="button"
                  onClick={onOpenNewEmpModal}
                  className="h-10 flex items-center justify-center gap-2 px-4.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>নতুন কর্মকর্তা যোগ করুন</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
