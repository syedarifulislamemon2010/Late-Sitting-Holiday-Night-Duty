'use client';

import React from 'react';
import { X, Printer } from 'lucide-react';

interface EmployeeDirectoryPreviewModalProps {
  isOpen: boolean;
  iframeUrl: string;
  onClose: () => void;
}

export default function EmployeeDirectoryPreviewModal({
  isOpen,
  iframeUrl,
  onClose
}: EmployeeDirectoryPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in zoom-in-95 h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 id="preview-modal-title" className="font-extrabold text-slate-850 dark:text-slate-50 text-sm">
              কর্মকর্তা ডিরেক্টরি প্রিন্ট প্রিভিউ
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">নতুন ট্যাবে ওপেন না করে সরাসরি ড্যাশবোর্ড থেকে প্রিভিউ করুন।</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const iframe = document.getElementById('preview-print-iframe') as HTMLIFrameElement;
                if (iframe) {
                  iframe.contentWindow?.focus();
                  iframe.contentWindow?.print();
                }
              }}
              aria-label="ডিরেক্টরি প্রিন্ট করুন"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-indigo-500/20 cursor-pointer transition-all"
            >
              <Printer size={13} />
              প্রিন্ট করুন
            </button>
            <button 
              onClick={onClose} 
              aria-label="প্রিভিউ বন্ধ করুন"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/10 p-4 relative">
          <iframe 
            id="preview-print-iframe" 
            src={iframeUrl}
            title="Employee Directory Print Preview"
            className="w-full h-full border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner bg-white"
          />
        </div>
      </div>
    </div>
  );
}
