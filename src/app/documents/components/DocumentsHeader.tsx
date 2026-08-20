'use client';

import React from 'react';
import { Archive, UploadCloud, FileText, CheckCircle, AlertCircle, X, Receipt } from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { UserSession } from '../types';

interface DocumentsHeaderProps {
  currentUser: UserSession | null;
  activeTab: 'files' | 'manual-docs' | 'orders' | 'bills';
  setActiveTab: (tab: 'files' | 'manual-docs' | 'orders' | 'bills') => void;
  filesCount: number;
  manualDocsCount: number;
  officeOrdersCount: number;
  billsCount: number;
  msgBanner: { type: 'success' | 'cancel'; text: string } | null;
  setMsgBanner: (val: { type: 'success' | 'cancel'; text: string } | null) => void;
  successMsg: string;
  setSuccessMsg: (msg: string) => void;
  error: string;
  setError: (msg: string) => void;
}

export default function DocumentsHeader({
  currentUser,
  activeTab,
  setActiveTab,
  filesCount,
  manualDocsCount,
  officeOrdersCount,
  billsCount,
  msgBanner,
  setMsgBanner,
  successMsg,
  setSuccessMsg,
  error,
  setError,
}: DocumentsHeaderProps) {
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      {msgBanner && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm animate-in fade-in duration-300 ${
          msgBanner.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-2.5">
            {msgBanner.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{msgBanner.text}</span>
          </div>
          <button onClick={() => setMsgBanner(null)} className="p-1 hover:bg-black/5 rounded-lg">
            <X size={15} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:bg-emerald-100 rounded-lg">
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide flex items-center gap-3">
            <Archive className="text-indigo-600 dark:text-indigo-400" size={28} />
            নথিপত্র ও অফিস আদেশ সংরক্ষণাগার
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            সিস্টেমে প্রস্তুতকৃত অফিস আদেশ, বিল মেমো এবং অন্যান্য প্রয়োজনীয় ডকুমেন্টেশনের কেন্দ্রীয় সংরক্ষণাগার।
          </p>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shrink-0 font-sans">
          {isAdmin && (
            <button
              onClick={() => setActiveTab('files')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'files'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UploadCloud size={14} />
              <span>পিডিএফ ড্রাইভ</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {toBanglaDigits(filesCount)}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('manual-docs')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'manual-docs'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText size={14} />
            <span>অন্যান্য নথিপত্র</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {toBanglaDigits(manualDocsCount)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText size={14} />
            <span>অফিস আদেশ খতিয়ান</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {toBanglaDigits(officeOrdersCount)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bills')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'bills'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Receipt size={14} />
            <span>বিল মেমো খতিয়ান</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {toBanglaDigits(billsCount)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
