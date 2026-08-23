import React from 'react';
import { 
  ChevronLeft, 
  Loader2, 
  FileSignature, 
  Printer, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { toBanglaDigits, getBanglaDate } from '@/lib/bengali-converter';
import { getShortDesignation, renderDatesInPairs, cleanBracketName } from '@/lib/print-helpers';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  Employee, 
  Executive, 
  OfficeOrder, 
  EmployeeBillingSummary, 
  getNormalizedRef 
} from '../types';

interface BillMemoEditorPrintViewProps {
  isEditingArchive: boolean;
  isBillDirty: boolean;
  archiving: boolean;
  billGenerated: boolean;
  handleCancelEditBill: () => void;
  handleBackToLedger: () => void;
  handleGenerateAndPrint: (action: 'generate' | 'print' | 'download') => Promise<void> | void;
  archiveSuccess: string | null;
  archiveError: string | null;
  printCategory: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
  setPrintCategory: (cat: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT') => void;
  billDate: string;
  setBillDate: (d: string) => void;
  subjectText: string;
  setSubjectText: (s: string) => void;
  billRef: string;
  setBillRef: (r: string) => void;
  pendingOrderRefs: string[];
  billedOrderRefs: string[];
  selectedOrderRef: string;
  setSelectedOrderRef: (r: string) => void;
  archivedOrders: OfficeOrder[];
  representativeName: string;
  setRepresentativeName: (n: string) => void;
  representativeDesignation: string;
  setRepresentativeDesignation: (d: string) => void;
  employees: Employee[];
  selectedExecutiveId: string;
  setSelectedExecutiveId: (id: string) => void;
  executives: Executive[];
  setSigningOfficer: (o: string) => void;
  setSigningDesignation: (d: string) => void;
  openingParagraph: string;
  printFilteredSummaries: EmployeeBillingSummary[];
  transportRate: number;
  apyaonRate: number;
  formatWorkedDatesForCategory: (empId: number) => string;
  totalDaysAll: number;
  totalTransportAll: number;
  totalApyaonAll: number;
  grandTotalPrintAll: number;
  getBanglaNumberWords: (num: number) => string;
}

export default function BillMemoEditorPrintView({
  isEditingArchive,
  isBillDirty,
  archiving,
  billGenerated,
  handleCancelEditBill,
  handleBackToLedger,
  handleGenerateAndPrint,
  archiveSuccess,
  archiveError,
  printCategory,
  setPrintCategory,
  billDate,
  setBillDate,
  subjectText,
  setSubjectText,
  billRef,
  setBillRef,
  pendingOrderRefs,
  billedOrderRefs,
  selectedOrderRef,
  setSelectedOrderRef,
  archivedOrders,
  representativeName,
  setRepresentativeName,
  representativeDesignation,
  setRepresentativeDesignation,
  employees,
  selectedExecutiveId,
  setSelectedExecutiveId,
  executives,
  setSigningOfficer,
  setSigningDesignation,
  openingParagraph,
  printFilteredSummaries,
  transportRate,
  apyaonRate,
  formatWorkedDatesForCategory,
  totalDaysAll,
  totalTransportAll,
  totalApyaonAll,
  grandTotalPrintAll,
  getBanglaNumberWords
}: BillMemoEditorPrintViewProps) {
  const [existingBillToEdit, setExistingBillToEdit] = React.useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Dynamic Media Print Style Overrides to ensure precise Legal spacing with Kalpurush font family */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: legal portrait;
            margin: 0;
          }
          .no-print { display: none !important; }
          body { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: #fff !important; 
            font-family: "SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif !important; 
            font-size: 12px !important;
            line-height: 1.6 !important;
            letter-spacing: normal !important;
            word-spacing: normal !important;
          }
          .whitespace-nowrap {
            white-space: nowrap !important;
          }
          .print-legal-layout {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            padding-top: 0.5in !important;
            padding-bottom: 0.5in !important;
            padding-left: 1.4in !important;
            padding-right: 0.5in !important;
            border: none !important;
            box-shadow: none !important;
            display: block !important;
            overflow: visible !important;
            letter-spacing: normal !important;
            word-spacing: normal !important;
          }
          .print-block {
            display: block !important;
            height: auto !important;
          }
        }
      `}} />

      {/* Back Controls (No-print) */}
      <div className="no-print flex flex-col gap-4 glass-card p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <button
            onClick={isEditingArchive ? handleCancelEditBill : handleBackToLedger}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-sans cursor-pointer"
          >
            <ChevronLeft size={16} />
            ফিরে যান (লেজার ভিউ)
          </button>

          <div className="flex gap-3">
            {isEditingArchive ? (
              <>
                <button
                  onClick={() => handleGenerateAndPrint('generate')}
                  disabled={archiving || !isBillDirty}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:cursor-not-allowed font-sans whitespace-nowrap"
                >
                  {archiving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <FileSignature size={14} />
                      সেভ করুন
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelEditBill}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-250 dark:border-slate-700 cursor-pointer font-sans whitespace-nowrap"
                >
                  বাতিল করুন
                </button>
              </>
            ) : !billGenerated ? (
              <button
                onClick={() => handleGenerateAndPrint('generate')}
                disabled={archiving}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {archiving ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    প্রসেস হচ্ছে...
                  </>
                ) : (
                  <>
                    <FileSignature size={14} />
                    বিল জেনারেট করুন (Generate Bill)
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleGenerateAndPrint('print')}
                  disabled={archiving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {archiving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      প্রসেস হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Printer size={14} />
                      প্রিন্ট প্রিভিউ
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleGenerateAndPrint('download')}
                  disabled={archiving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {archiving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      প্রসেস হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Printer size={14} />
                      ডাউনলোড
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {archiveSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle size={16} className="text-emerald-500" />
            <span>{archiveSuccess}</span>
          </div>
        )}

        {archiveError && (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-3 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400">
            <AlertCircle size={16} className="text-rose-505" />
            <span>{archiveError}</span>
          </div>
        )}
      </div>

      {/* Interactive Print Options Configurator (No-print) */}
      <div className="no-print glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        <h3 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-50 to-indigo-500 text-base">বিল মেমো কাস্টমাইজেশন ও প্রফেশনাল কন্ট্রোল প্যানেল</h3>
        
        <div className="space-y-4">
          {/* Row 1: Document Metadata & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="printCategory" className="text-xs font-bold text-slate-500">ডিউটির ক্যাটাগরি (Duty Category)</label>
              <select
                id="printCategory"
                value={printCategory}
                onChange={(e) => setPrintCategory(e.target.value as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="LATE_SITTING">Late Sitting (লেট সিটিং)</option>
                <option value="NIGHT_SHIFT">Night Shift (রাত্রের ডিউটি)</option>
                <option value="HOLIDAY">Holiday Duty (ছুটির দিন)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="billDate" className="text-xs font-bold text-slate-500">মেমো তারিখ (Memo Date)</label>
              <input
                id="billDate"
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="subjectText" className="text-xs font-bold text-slate-500">বিষয় (Memo Subject)</label>
              <input
                id="subjectText"
                type="text"
                value={subjectText}
                onChange={(e) => setSubjectText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="billRef" className="text-xs font-bold text-slate-500">স্মারক/সূত্র নম্বর (Bill Ref)</label>
              <input
                id="billRef"
                type="text"
                value={billRef}
                onChange={(e) => setBillRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* office order selection dropdown (Pending vs Billed) */}
          {(pendingOrderRefs.length > 0 || billedOrderRefs.length > 0) && (
            <div className="p-4 rounded-xl bg-indigo-500/5 dark:bg-indigo-950/10 border border-indigo-150/40 dark:border-indigo-900/20 space-y-1.5">
              <label className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                কোন অফিস আদেশের বিল প্রস্তুত/সম্পাদনা করতে চান? (Select Office Order)
              </label>
              <select
                value={selectedOrderRef}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedOrderRef(val);
                  
                  // Check if already billed
                  if (billedOrderRefs.includes(val)) {
                    const norm = getNormalizedRef(val);
                    const existingBill = archivedOrders.find(o => o.category?.startsWith('BILL_') && getNormalizedRef(o.orderRef) === norm);
                    if (existingBill) {
                      setExistingBillToEdit(existingBill.orderRef);
                    }
                  }
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200/60 dark:border-indigo-900/40 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
              >
                <option value="">-- অফিস আদেশ নির্বাচন করুন --</option>
                {pendingOrderRefs.length > 0 && (
                  <optgroup label="বিল প্রস্তুত করা হয়নি (Pending Billing)">
                    {pendingOrderRefs.map(ref => (
                      <option key={ref} value={ref}>{ref}</option>
                    ))}
                  </optgroup>
                )}
                {billedOrderRefs.length > 0 && (
                  <optgroup label="ইতিমধ্যেই বিল প্রস্তুত করা হয়েছে (Already Billed)">
                    {billedOrderRefs.map(ref => (
                      <option key={ref} value={ref}>{ref} (বিল সম্পাদিত)</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          {/* Row 2: Payees & Representatives & DGM */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="representativeName" className="text-xs font-bold text-slate-500">তহবিল সংগ্রহকারী কর্মকর্তা (Bill Favoring To)</label>
              <select
                id="representativeName"
                value={representativeName}
                onChange={(e) => {
                  const selectedVal = e.target.value;
                  setRepresentativeName(selectedVal);
                  const found = employees.find(emp => emp.name === selectedVal);
                  if (found) {
                    setRepresentativeDesignation(getShortDesignation(found.designation));
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="">Select Payee (সিলেক্ট করুন)</option>
                {printFilteredSummaries.map(summary => (
                  <option key={summary.employeeId} value={summary.name}>
                    {summary.name} ({getShortDesignation(summary.designation)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="representativeDesignation" className="text-xs font-bold text-slate-500">প্রতিনিধির পদবী (Representative Designation)</label>
              <input
                id="representativeDesignation"
                type="text"
                disabled
                value={representativeDesignation}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-xs cursor-not-allowed text-slate-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="selectedExecutiveId" className="text-xs font-bold text-slate-500">অনুমোদনকারী কর্মকর্তা (DGM)</label>
              <select
                id="selectedExecutiveId"
                value={selectedExecutiveId}
                onChange={(e) => {
                  const execId = e.target.value;
                  setSelectedExecutiveId(execId);
                  const exec = executives.find(ex => ex.id.toString() === execId);
                  if (exec) {
                    setSigningOfficer(exec.name);
                    setSigningDesignation(exec.designation);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="">DGM নির্বাচন করুন</option>
                {executives.map(ex => (
                  <option key={ex.id} value={ex.id.toString()}>
                    {ex.name} ({ex.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center p-2 bg-slate-100/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-x-auto shadow-inner">
        <div className="print-legal-layout w-[8.5in] h-[14.0in] bg-white border border-slate-200 text-black shadow-xl flex flex-col justify-between overflow-hidden relative" style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', paddingTop: '0.5in', paddingBottom: '0.5in', paddingLeft: '1.4in', paddingRight: '0.5in', boxSizing: 'border-box', fontSize: '12px', lineHeight: '1.0' }}>
          
          <div className="print-block flex flex-col h-full justify-between">
            <div>
              {/* Official Header */}
              <div className="w-full flex justify-end text-right mb-4">
                <div className="text-right leading-none" style={{ lineHeight: '0.85' }}>
                  <h2 className="text-[18px] font-bold text-black uppercase" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '18px', lineHeight: '0.85', margin: 0, padding: 0 }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h2>
                  <p className="text-[12px] font-bold text-black" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '0.85', margin: 0, padding: 0, marginTop: '2px' }}>তারিখ: {getBanglaDate(billDate)} ইং</p>
                </div>
              </div>

              {/* Title and Main Body */}
              <div className="flex-1 flex flex-col justify-between mt-2">
                <div>
                  <h2 className="text-left text-[12px] font-bold underline decoration-black underline-offset-2 leading-none" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.0' }}>
                    বিষয়: {subjectText}
                  </h2>
                  
                  <div className="mt-2.5">
                    <p className="text-justify leading-normal text-black text-[12px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.1' }}>
                      {openingParagraph}
                    </p>
                  </div>

                  {/* Redesigned Printed Legal Billing Table */}
                  {printFilteredSummaries.length > 0 ? (
                    <table className="w-full border-collapse border border-black text-center mt-3 text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                      <thead>
                        <tr className="bg-slate-50 font-bold border-b border-black text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                          <th className="border border-black p-1.5 w-[6%] text-center">ক্রমিক</th>
                          <th className="border border-black p-1.5 text-left pl-3 w-[32%]">নাম ও পদবী</th>
                          <th className="border border-black p-1.5 text-center w-[26%]">তারিখ</th>
                          <th className="border border-black p-1.5 text-center w-[13%]">যাতায়াত</th>
                          <th className="border border-black p-1.5 text-center w-[13%]">আপ্যায়ন</th>
                          <th className="border border-black p-1.5 text-center w-[10%]">মোট</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printFilteredSummaries.map((summary, index) => {
                          const days = printCategory === 'LATE_SITTING' ? summary.lateDays : printCategory === 'HOLIDAY' ? summary.holidayDays : summary.nightDays;
                          const empTransport = days * transportRate;
                          const empApyaon = days * apyaonRate;
                          const empTotal = empTransport + empApyaon;
                          
                          return (
                            <tr key={summary.employeeId} className="text-black text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                              <td className="border border-black p-1.5 text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>{toBanglaDigits(index + 1)}</td>
                              <td className="border border-black p-1.5 text-left pl-3 font-normal whitespace-nowrap" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.1', whiteSpace: 'nowrap' }}>
                                {(() => {
                                  const displayName = summary.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
                                  return (
                                    <>
                                      <p className="font-normal whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>{displayName.startsWith('জনাব') ? displayName : `জনাব ${displayName}`}</p>
                                      <p className="text-[10px] text-slate-800 font-normal mt-0.5" style={{ fontSize: '11px', marginTop: '2px' }}>({getShortDesignation(summary.designation)})</p>
                                    </>
                                  );
                                })()}
                              </td>
                              <td className="border border-black p-1.5 text-center leading-snug" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.15' }}>
                                {renderDatesInPairs(formatWorkedDatesForCategory(summary.employeeId)).map((pair, pIdx) => (
                                  <span key={pIdx} className="block leading-snug" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                                    {pair}
                                  </span>
                                ))}
                                <p className="text-[11px] text-slate-700 mt-0.5 font-semibold">মোট: {toBanglaDigits(days)} দিন</p>
                              </td>
                              <td className="border border-black p-1.5 text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0', verticalAlign: 'middle' }}>
                                <span style={{ display: 'block', whiteSpace: 'nowrap' }}>({toBanglaDigits(transportRate)}x{toBanglaDigits(days)}) =</span>
                                <span style={{ display: 'block', whiteSpace: 'nowrap', marginTop: '2px' }}>{toBanglaDigits(empTransport)}/-</span>
                              </td>
                              <td className="border border-black p-1.5 text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0', verticalAlign: 'middle' }}>
                                <span style={{ display: 'block', whiteSpace: 'nowrap' }}>({toBanglaDigits(apyaonRate)}x{toBanglaDigits(days)}) =</span>
                                <span style={{ display: 'block', whiteSpace: 'nowrap', marginTop: '2px' }}>{toBanglaDigits(empApyaon)}/-</span>
                              </td>
                              <td className="border border-black p-1.5 font-extrabold text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                                {toBanglaDigits(empTotal)}/-
                              </td>
                            </tr>
                          );
                        })}
                        
                        <tr className="font-bold bg-slate-50/50 text-[11px] border-t-2 border-black" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                          <td className="border border-black p-1.5 text-right pr-3" colSpan={3} style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                            <p>মোট দিন = {toBanglaDigits(totalDaysAll)} দিন</p>
                            <p className="mt-1">মোট টাকা = ({getBanglaNumberWords(grandTotalPrintAll).replace(' টাকা মাত্র', ' টাকা')})</p>
                          </td>
                          <td className="border border-black p-1.5 text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                            ({toBanglaDigits(transportRate)}x{toBanglaDigits(totalDaysAll)}) = {toBanglaDigits(totalTransportAll)}/-
                          </td>
                          <td className="border border-black p-1.5 text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                            ({toBanglaDigits(apyaonRate)}x{toBanglaDigits(totalDaysAll)}) = {toBanglaDigits(totalApyaonAll)}/-
                          </td>
                          <td className="border border-black p-1.5 font-extrabold text-center" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                            {toBanglaDigits(grandTotalPrintAll)}/-
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : null}

                  {/* Paragraphs */}
                  <div className="text-left pt-3 mt-3 space-y-1.5" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.1' }}>
                    <p className="text-justify leading-normal text-black" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.1' }}>
                      ০১। যাতায়াত বিলটি সঠিক এবং পূর্বে পরিশোধ করা হয়নি।
                    </p>
                    <p className="text-justify leading-normal text-black" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.1' }}>
                      ০২। ২০১৭ সালের আর্থিক ক্ষমতা অর্পন এর পৃষ্ঠা ১৫ এর অনুচ্ছেদ-২৬.০২ মোতাবেক যাতায়াত খাত (কোড-১৩৫৫১২০৫০০০০০০৩) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(totalTransportAll)}/- ({getBanglaNumberWords(totalTransportAll).replace(' টাকা মাত্র', ' টাকা')})</strong> এবং পৃষ্ঠা ১৪ এর অনুচ্ছেদ-২২.০২ মোতাবেক আপ্যায়ন খাত (কোড-১৩৫৫১২০১০০০০০০২) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(totalApyaonAll)}/- ({getBanglaNumberWords(totalApyaonAll).replace(' টাকা মাত্র', ' টাকা')})</strong> অনুমোদন ক্ষমতা উপ-মহাব্যবস্থাপক মহোদয়ের এখতিয়ারাধীন।
                    </p>
                    <p className="text-justify leading-normal text-black" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', lineHeight: '1.1' }}>
                      ০৩। এমতাবস্থায়, বর্ণিত খরচ অনুমোদনপূর্বক যাতায়াত ও আপ্যায়ন খাত (প্রযোজ্য ক্ষেত্রে) বিকলন করতঃ মোট = <strong>{toBanglaDigits(grandTotalPrintAll)}/- ({getBanglaNumberWords(grandTotalPrintAll).replace(' টাকা মাত্র', ' টাকা')})</strong> <strong>{(representativeName || 'জনাব আব্দুল্লাহ আল জোবায়ের').replace(/\s*\([^)]*\)\s*$/, '')}, {representativeDesignation || 'এসও-আইটি'}</strong> এর নামে প্রদানের নিমিত্ত নিরীক্ষার অনুরোধ জানিয়ে বাজেট এন্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট বরাবর এবং নিরীক্ষান্তে নথি একাউন্টস ডিপার্টমেন্ট বরাবর প্রেরণ করা যেতে পারে।
                    </p>
                  </div>
                </div>
              </div>

              {/* Right-aligned payee signature block */}
              <div className="w-full flex justify-end text-right" style={{ marginTop: '0.25in', marginBottom: '0.1in' }}>
                <div className="text-right leading-none" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', paddingRight: '0.1in', lineHeight: '1.15' }}>
                  <p className="font-extrabold text-[12px]" style={{ margin: 0, padding: 0, lineHeight: '1.15' }}>({cleanBracketName((representativeName || 'জনাব আব্দুল্লাহ আল জোবায়ের').replace(/\s*\([^)]*\)\s*$/, ''))})</p>
                  <p className="text-[12px] font-bold text-slate-800" style={{ margin: 0, padding: 0, marginTop: '3px', lineHeight: '1.15' }}>{representativeDesignation || 'এসও-আইটি'}</p>
                </div>
              </div>

              {/* Left-aligned Routing List with nice gaps, underlines and font size 12, NOT bold */}
              <div className="w-full text-left mt-4 pl-1" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '10.5px', lineHeight: '1.4' }}>
                <div style={{ marginBottom: '0.7in' }}>
                  <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                    এসপিও, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ
                  </p>
                </div>
                <div style={{ marginBottom: '0.7in' }}>
                  <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                    এজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ
                  </p>
                </div>
                <div style={{ marginBottom: '0.7in' }}>
                  <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                    ডিজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ
                  </p>
                </div>
                <div style={{ marginBottom: '0.7in' }}>
                  <p style={{ display: 'inline-block', borderBottom: '1px solid #000', paddingBottom: '5px', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '10.5px', lineHeight: '1.4', margin: 0 }}>
                    ডিজিএম, (বাজেট অ্যান্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট) সমীপেঃ
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Confirm Edit Existing Bill Dialog */}
      <ConfirmDialog
        isOpen={!!existingBillToEdit}
        title="পূর্ববর্তী বিল সম্পাদনা"
        description="এই অফিস আদেশের অধীনে ইতিমধ্যেই বিল তৈরি করা হয়েছে। আপনি কি পূর্ববর্তী বিলটি সম্পাদনা (Edit) করতে চান?"
        confirmText="হ্যাঁ, সম্পাদনা করুন"
        cancelText="বাতিল"
        variant="primary"
        onConfirm={() => {
          if (existingBillToEdit) {
            window.location.href = `/billing?edit_ref=${encodeURIComponent(existingBillToEdit)}`;
          }
        }}
        onCancel={() => setExistingBillToEdit(null)}
      />
    </div>
  );
}
