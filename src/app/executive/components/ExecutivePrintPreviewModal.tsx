import { Printer, X } from 'lucide-react';

interface ExecutivePrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  iframeUrl: string;
}

export function ExecutivePrintPreviewModal({
  isOpen,
  onClose,
  iframeUrl
}: ExecutivePrintPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-scale-up h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">নির্বাহী ডিরেক্টরি প্রিন্ট প্রিভিউ</h4>
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer size={13} />
              প্রিন্ট করুন
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/10 p-4 relative">
          <iframe 
            id="preview-print-iframe"
            src={iframeUrl}
            className="w-full h-full border border-slate-100 dark:border-slate-800 rounded-2xl shadow-inner bg-white"
          />
        </div>
      </div>
    </div>
  );
}
