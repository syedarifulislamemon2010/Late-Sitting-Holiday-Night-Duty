'use client';

import React from 'react';
import { FileEdit, AlertCircle } from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { cleanDesignationForLeave } from '../hooks/useLeaveData';
import { Employee } from '../types';

interface LeavePrintViewProps {
  applicationDate: string;
  applicantName: string;
  designation: string;
  bankId: string;
  fileNo?: string;
  cellName: string;
  mobileNo: string;
  selectedDistrict: string;
  leaveType: 'CASUAL' | 'POST_FACTO' | 'STATION_LEAVE' | '';
  startDate: string;
  endDate: string;
  isSingleDay: boolean;
  leaveDetails: any;
  delegateId: string;
  eligibleCoveringOfficers: Employee[];
  casualTotal: number | string;
  casualUsed: number | string;
  ordinaryTotal: number | string;
  ordinaryUsed: number | string;
  specialTotal: number | string;
  specialUsed: number | string;
  validation: { isValid: boolean; message: string };
}

export default function LeavePrintView({
  applicationDate,
  applicantName,
  designation,
  bankId,
  fileNo,
  cellName,
  mobileNo,
  selectedDistrict,
  leaveType,
  startDate,
  endDate,
  isSingleDay,
  leaveDetails,
  delegateId,
  eligibleCoveringOfficers,
  casualTotal,
  casualUsed,
  ordinaryTotal,
  ordinaryUsed,
  specialTotal,
  specialUsed,
  validation,
}: LeavePrintViewProps) {
  const toDisplayDateStr = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${toBanglaDigits(parts[2])}/${toBanglaDigits(parts[1])}/${toBanglaDigits(parts[0])}`;
  };

  const toBanglaFullDateStr = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const monthNamesBN = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const dayVal = parseInt(d, 10);
    const bnDay = toBanglaDigits(dayVal.toString());
    const bnYear = toBanglaDigits(y);
    const bnMonth = monthNamesBN[parseInt(m, 10) - 1] || m;
    
    let suffix = 'ই';
    if (dayVal === 1) suffix = 'লা';
    else if (dayVal === 2) suffix = 'রা';
    else if (dayVal === 3) suffix = 'রা';
    else if (dayVal === 4) suffix = 'ঠা';
    else if (dayVal === 18 || dayVal === 28 || dayVal === 29 || dayVal === 31) suffix = 'শে';
    
    return `${bnDay}${suffix} ${bnMonth}, ${bnYear}`;
  };

  const getBanglaDayWord = (num: number): string => {
    const wordsLookup: Record<number, string> = {
      1: '০১ (এক)', 2: 'দুই (০২)', 3: 'তিন (০৩)', 4: 'চার (০৪)', 5: 'পাঁচ (০৫)',
      6: 'ছয় (০৬)', 7: 'সাত (০৭)', 8: 'আট (০৮)', 9: 'নয় (০৯)', 10: 'দশ (১০)',
      11: 'এগারো (১১)', 12: 'বারো (১২)', 13: 'তেরো (১৩)', 14: 'চৌদ্দ (১৪)', 15: 'পনেরো (১৫)',
      16: 'ষোল (১৬)', 17: 'সতেরো (১৭)', 18: 'আঠারো (১৮)', 19: 'উনিশ (১৯)', 20: 'বিশ (২০)',
      21: 'একুশ (২১)', 22: 'বাইশ (২২)', 23: 'তেইশ (২৩)', 24: 'চব্বিশ (২৪)', 25: 'পঁচিশ (২৫)',
      26: 'ছাব্বিশ (২৬)', 27: 'সাতাশ (২৭)', 28: 'আটাশ (২৮)', 29: 'ঊনত্রিশ (২৯)', 30: 'ত্রিশ (৩০)'
    };
    return wordsLookup[num] || `${toBanglaDigits(num)} (${num})`;
  };

  const getRemaining = (total: number | string, used: number | string) => {
    const tStr = String(total).trim();
    const uStr = String(used).trim();
    if (tStr === '-' || uStr === '-' || tStr === '' || uStr === '') {
      return '-';
    }
    const totalNum = parseInt(tStr, 10);
    const usedNum = parseInt(uStr, 10);
    if (isNaN(totalNum) || isNaN(usedNum)) {
      return '-';
    }
    return Math.max(0, totalNum - usedNum);
  };

  const appYear = applicationDate ? applicationDate.split('-')[0] : new Date().getFullYear().toString();
  const displayDaysWord = isSingleDay ? getBanglaDayWord(1) : (leaveDetails.actualDeducted > 0 ? getBanglaDayWord(leaveDetails.actualDeducted) : '');

  const appliedDays = (startDate || endDate) 
    ? (isSingleDay ? 1 : (leaveDetails.actualDeducted > 0 ? leaveDetails.actualDeducted : 1)) 
    : 0;

  const previousUsedNum = parseInt(String(casualUsed || 0), 10) || 0;
  const totalEntitledNum = parseInt(String(casualTotal || 20), 10) || 20;

  const currentCasualUsed = (leaveType === 'CASUAL' || leaveType === 'POST_FACTO' || leaveType === 'STATION_LEAVE')
    ? (previousUsedNum + appliedDays)
    : previousUsedNum;

  const currentCasualRemaining = Math.max(0, totalEntitledNum - currentCasualUsed);
  const currentOrdinaryRemaining = getRemaining(ordinaryTotal, ordinaryUsed);
  const currentSpecialRemaining = getRemaining(specialTotal, specialUsed);

  const matchedDelegate = eligibleCoveringOfficers.find(e => String(e.id) === delegateId);
  const delegateName = matchedDelegate ? matchedDelegate.name : '';
  const delegateDesignation = matchedDelegate ? cleanDesignationForLeave(matchedDelegate.designation) : '';

  const renderDelegateInfo = () => {
    if (!delegateId || !matchedDelegate) {
      return (
        <strong className="text-red-600 dark:text-red-400 font-bold" style={{ color: 'red', fontWeight: 'bold' }}>
          [দায়িত্ব পালনকারী কর্মকর্তা নির্বাচন করুন]
        </strong>
      );
    }
    const cleanName = delegateName.replace(/^জনাব\s+/, '').trim();
    if (cleanName.includes('কিবরিয়া') || cleanName.includes('কিবর')) {
      return <span className="italic" style={{ fontStyle: 'italic' }}>জনাব জি.এস.কিবরিয়া, সিনিয়র অফিসার-আইটি</span>;
    }
    return <span className="italic" style={{ fontStyle: 'italic' }}>জনাব {cleanName}, {delegateDesignation}</span>;
  };

  const formatStayLocationText = () => {
    if (!selectedDistrict) {
      return (
        <strong className="text-red-600 dark:text-red-400 font-bold" style={{ color: 'red', fontWeight: 'bold' }}>
          [জেলা নির্বাচন করুন]
        </strong>
      );
    }
    return selectedDistrict;
  };

  const formatSubject = () => {
    const daysWord = isSingleDay ? getBanglaDayWord(1) : getBanglaDayWord(leaveDetails.actualDeducted);
    switch (leaveType) {
      case 'CASUAL':
        return `বিষয়ঃ ${daysWord} দিনের নৈমিত্তিক ছুটি মঞ্জুরির আবেদন।`;
      case 'POST_FACTO':
        return `বিষয়ঃ ${daysWord} দিনের ঘটনাত্তোর নৈমিত্তিক ছুটির জন্য আবেদন।`;
      case 'STATION_LEAVE':
        return `বিষয়ঃ ${daysWord} দিনের কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটির জন্য আবেদন।`;
      default:
        return `বিষয়ঃ ${daysWord} দিনের নৈমিত্তিক ছুটি মঞ্জুরির আবেদন।`;
    }
  };

  return (
    <div className="xl:col-span-8 flex flex-col items-center pb-8">
      {/* Live Editor Notification Banner */}
      <div className="no-print w-full max-w-[216mm] mb-3">
        <div className="p-3 bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs font-bold rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <FileEdit size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span><strong>লাইভ অন-স্ক্রিন এডিটর সক্রিয়:</strong> দরখাস্তের যেকোনো লেখায় সরাসরি মাউস দিয়ে ক্লিক করে টাইপ করে এডিট করতে পারবেন। প্রিন্ট বা PDF ফাইলে সংশোধিত ফাইলটিই সেভ হবে।</span>
          </div>
        </div>
      </div>

      {/* Dropdown Validation Message Banner */}
      <div className="no-print w-full max-w-[216mm] mb-4">
        {validation.isValid ? (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2.5 shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shrink-0" />
            <span>{validation.message || 'সকল প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করা হয়েছে।'}</span>
          </div>
        ) : (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-2xl flex items-center gap-2.5 shadow-sm">
            <AlertCircle size={15} className="text-amber-500 shrink-0" />
            <span>{validation.message}</span>
          </div>
        )}
      </div>

      {/* Scrollable Container for Preview Sheet */}
      <div className="w-full max-w-full overflow-x-auto flex justify-center pb-4 no-print-scrollbar">
        <div 
          id="printable-leave-sheet" 
          className="print-legal-layout w-[216mm] min-h-[356mm] bg-white text-black p-[20mm] border-2 border-slate-300 dark:border-slate-800 rounded-3xl print:border-none print:rounded-none print:shadow-none shadow-[0_15px_50px_rgba(0,0,0,0.08)] relative flex flex-col justify-start shrink-0 font-sans"
          style={{ contentVisibility: 'auto' }}
        >
          {/* 1. Header (Date + Leaves Table) */}
          <div className="flex justify-between items-start font-sans leading-tight">
            {/* Left block */}
            <div className="space-y-4 pt-1 text-xs" contentEditable suppressContentEditableWarning title="ক্লিক করে ঠিকানা এডিট করুন">
              <p className="font-semibold text-black">
                তারিখ: {toBanglaFullDateStr(applicationDate)} ইং
              </p>
              <div className="space-y-0.5 font-bold text-black text-xs font-sans">
                <p>উপ-মহাব্যবস্থাপক</p>
                <p>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
                <p>জনতা ব্যাংক পিএলসি,</p>
                <p>প্রধান কার্যালয়, ঢাকা।</p>
              </div>
            </div>

            {/* Right block: Leaves Balance Table */}
            <div className="w-[85mm] text-[10px] bg-white font-sans text-black">
              <table className="w-full text-center border-collapse border border-black">
                <thead>
                  <tr className="border border-black font-bold text-center">
                    <th colSpan={5} className="border border-black px-1.5 py-1 text-center bg-slate-50 text-xs">
                      {toBanglaDigits(appYear)} সালের ছুটির বিবরণ
                    </th>
                  </tr>
                  <tr className="bg-slate-50 font-bold border-b border-black">
                    <th className="border border-black px-1.5 py-0.5 w-[12mm]">ক্র.নং</th>
                    <th className="border border-black px-1.5 py-0.5">ছুটির ধরণ</th>
                    <th className="border border-black px-1 py-0.5 w-[14mm]">প্রাপ্তব্য</th>
                    <th className="border border-black px-1 py-0.5 w-[14mm]">ভোগকৃত</th>
                    <th className="border border-black px-1 py-0.5 w-[14mm]">অবশিষ্ট</th>
                  </tr>
                </thead>
                <tbody className="font-semibold" contentEditable suppressContentEditableWarning title="ক্লিক করে ঘরের মান পরিবর্তন করুন">
                  <tr className="border-b border-black">
                    <td className="border border-black px-1 py-0.5">০১.</td>
                    <td className="border border-black px-1.5 py-0.5 text-left">নৈমিত্তিক ছুটি</td>
                    <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(casualTotal)}</td>
                    <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(currentCasualUsed)}</td>
                    <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(currentCasualRemaining)}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border border-black px-1 py-0.5">০২.</td>
                    <td className="border border-black px-1.5 py-0.5 text-left">সাধারণ ছুটি</td>
                    <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(ordinaryTotal)}</td>
                    <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(ordinaryUsed)}</td>
                    <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(currentOrdinaryRemaining)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-1 py-0.5">০৩.</td>
                    <td className="border border-black px-1.5 py-0.5 text-left">বিশেষ ছুটি</td>
                    <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(specialTotal)}</td>
                    <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(specialUsed)}</td>
                    <td className="border border-black px-1 py-0.5 font-sans font-bold">{toBanglaDigits(currentSpecialRemaining)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. SUBJECT */}
          <div style={{ marginTop: '0.55in', marginBottom: '0.25in' }} contentEditable suppressContentEditableWarning title="ক্লিক করে বিষয় এডিট করুন">
            <p className="text-black text-xs pb-0.5 w-fit font-bold">
              {leaveDetails.actualDeducted > 0 || isSingleDay ? formatSubject() : 'বিষয়ঃ নৈমিত্তিক ছুটি মঞ্জুরির আবেদন।'}
            </p>
          </div>

          {/* 3. LETTER BODY */}
          <div className="mt-1.5 text-xs text-black leading-relaxed text-justify space-y-1.5" contentEditable suppressContentEditableWarning title="ক্লিক করে দরখাস্তের মূল বক্তব্য এডিট করুন">
            <p className="text-xs">{leaveType === 'STATION_LEAVE' ? 'মহোদয়,' : 'প্রিয় মহোদয়,'}</p>
            
            {leaveType === 'POST_FACTO' ? (
              <>
                <p className="text-black text-xs text-justify">
                  {isSingleDay ? (
                    <>
                      যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত ও পারিবারিক জরুরি প্রয়োজনে আমি গত{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>{startDate ? toDisplayDateStr(startDate) : ''}</strong>{startDate ? ' ইং' : ''} তারিখে{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>০১ (এক)</strong> দিন অফিসে উপস্থিত হতে পারিনি বিধায় উক্ত{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>০১ (এক)</strong> দিনের ঘটনাত্তোর নৈমিত্তিক ছুটির জন্য আবেদন করছি।
                    </>
                  ) : (
                    <>
                      যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত ও পারিবারিক জরুরি প্রয়োজনে আমি গত{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>{startDate ? toDisplayDateStr(startDate) : ''}</strong>{startDate ? ' ইং' : ''} তারিখ হতে{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>{endDate ? toDisplayDateStr(endDate) : ''}</strong>{endDate ? ' ইং' : ''} তারিখ পর্যন্ত মোট{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>{displayDaysWord}</strong> দিন অফিসে উপস্থিত হতে পারিনি বিধায় উক্ত{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>{displayDaysWord}</strong> দিনের ঘটনাত্তোর নৈমিত্তিক ছুটির জন্য আবেদন করছি।
                    </>
                  )}
                  {' '}উল্লেখ্য যে, আমি ছুটিতে থাকাকালীন, অত্র ডিপার্টমেন্টের{' '}
                  {renderDelegateInfo()} তার নিজ দায়িত্বের অতিরিক্ত হিসেবে আমার দায়িত্ব পালন করছেন।
                </p>

                <p className="text-black text-xs leading-relaxed text-justify">
                  অতএব মহোদয় সমীপে আবেদন যে, আমার অনুকূলে উক্ত{' '}
                  <strong className="italic" style={{ fontStyle: 'italic' }}>{isSingleDay ? '০১ (এক)' : displayDaysWord}</strong> দিনের ঘটনাত্তোর নৈমিত্তিক ছুটি মঞ্জুরীর অনুমতি দান করে বাধিত করবেন।
                </p>
              </>
            ) : leaveType === 'STATION_LEAVE' ? (
              <>
                <p className="text-black text-xs text-justify">
                  {isSingleDay ? (
                    <>
                      যথাবিহিত সম্মানপূর্বক বিনীত নিবেদন এই যে, পারিবারিক ও ব্যক্তিগত জরুরি প্রয়োজনে আমি আগামী{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>{startDate ? toDisplayDateStr(startDate) : ''}</strong>{startDate ? ' ইং' : ''} তারিখে{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>০১ (এক)</strong> দিনের কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটির জন্য আবেদন করছি।
                    </>
                  ) : (
                    <>
                      যথাবিহিত সম্মানপূর্বক বিনীত নিবেদন এই যে, পারিবারিক ও ব্যক্তিগত জরুরি প্রয়োজনে আমি আগামী{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>{startDate ? toDisplayDateStr(startDate) : ''}</strong>{startDate ? ' ইং' : ''} তারিখ হতে{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>{endDate ? toDisplayDateStr(endDate) : ''}</strong>{endDate ? ' ইং' : ''} তারিখ পর্যন্ত{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>{displayDaysWord}</strong> দিনের কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটির জন্য আবেদন করছি।
                    </>
                  )}
                </p>

                <p className="text-black text-xs leading-relaxed text-justify">
                  উল্লেখ্য যে, আমি ছুটিতে থাকাকালীন অত্র ডিপার্টমেন্টের{' '}
                  {renderDelegateInfo()} তার নিজ দায়িত্বের অতিরিক্ত হিসেবে আমার দায়িত্ব পালন করবেন।
                </p>

                <p className="text-black text-xs leading-relaxed text-justify">
                  অতএব, মহোদয় সমীপে আবেদন এই যে, আমার অনুকূলে উক্ত{' '}
                  <strong className="italic" style={{ fontStyle: 'italic' }}>{isSingleDay ? '০১ (এক)' : displayDaysWord}</strong> দিনের কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটি মঞ্জুরপূর্বক বাধিত করবেন।
                </p>
              </>
            ) : (
              <>
                <p className="text-black text-xs text-justify">
                  {isSingleDay ? (
                    <>
                      যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত ও পারিবারিক জরুরি প্রয়োজনে আমার আগামী{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>{startDate ? toDisplayDateStr(startDate) : ''}</strong>{startDate ? ' ইং' : ''} তারিখে{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>০১ (এক)</strong> দিনের নৈমিত্তিক ছুটির প্রয়োজন।
                    </>
                  ) : (
                    <>
                      যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত ও পারিবারিক জরুরি প্রয়োজনে আমার আগামী{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>{startDate ? toDisplayDateStr(startDate) : ''}</strong>{startDate ? ' ইং' : ''} তারিখ হতে{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>{endDate ? toDisplayDateStr(endDate) : ''}</strong>{endDate ? ' ইং' : ''} তারিখ পর্যন্ত মোট{' '}
                      <strong className="italic" style={{ fontStyle: 'italic' }}>{displayDaysWord}</strong> দিনের নৈমিত্তিক ছুটির প্রয়োজন।
                    </>
                  )}
                </p>

                <p className="text-black text-xs leading-relaxed text-justify">
                  উল্লেখ্য যে, আমি ছুটিতে থাকাকালীন, অত্র ডিপার্টমেন্টের{' '}
                  {renderDelegateInfo()} তার নিজ দায়িত্বের অতিরিক্ত হিসেবে আমার দায়িত্ব পালন করবেন।
                </p>

                <p className="text-black text-xs leading-relaxed text-justify">
                  অতএব মহোদয় সমীপে আবেদন যে, আমার অনুকূলে উক্ত{' '}
                  <strong className="italic" style={{ fontStyle: 'italic' }}>{isSingleDay ? '০১ (এক)' : displayDaysWord}</strong> দিনের নৈমিত্তিক ছুটি মঞ্জুরীর অনুমতি দান করে বাধিত করবেন।
                </p>
              </>
            )}
          </div>

          {/* 4. SIGNATURE CARD SUMMARY */}
          <div 
            className="flex justify-between items-start text-xs font-sans leading-tight text-black"
            style={{ marginTop: '0.55in' }}
            contentEditable
            suppressContentEditableWarning
            title="ক্লিক করে আবেদনকারীর তথ্য ও অবস্থান এডিট করুন"
          >
            {/* Left Block */}
            <div className="space-y-1 text-black">
              <p>আপনার বিশ্বস্ত,</p>
              <div className="h-12 w-32 mt-1" />
              <p className="pt-1">নামঃ <strong className="italic" style={{ fontStyle: 'italic' }}>{applicantName || 'সৈয়দ আরিফুল ইসলাম ইমন'}</strong></p>
              <p>পদবীঃ {cleanDesignationForLeave(designation) || 'সিনিয়র অফিসার-আইটি'}</p>
              <p className="font-mono">ব্যাংক আইডিঃ {toBanglaDigits(bankId || '০২৬৭৯৫')}</p>
              {fileNo && <p>ব্যক্তিগত নথি নংঃ {fileNo}</p>}
              <p>{cellName}</p>
              <p>জনতা ব্যাংক পিএলসি,</p>
              <p>প্রধান কার্যালয়, ঢাকা।</p>
            </div>

            {/* Right Block */}
            <div className="space-y-2 text-black text-xs text-right pr-2">
              <p>ছুটিতে থাকাকালীন অবস্থানঃ <strong className="italic" style={{ fontStyle: 'italic' }}>{formatStayLocationText()}</strong></p>
              <p>মোবাইল নংঃ <span className="font-mono">{toBanglaDigits(mobileNo)}</span></p>
            </div>
          </div>

          {/* 5. RECOMMENDATION & HIERARCHY APPROVAL BOXES */}
          <div 
            className="pt-0.5 text-xs text-black font-sans space-y-0"
            style={{ marginTop: '0.55in' }}
          >
            <div className="text-left text-black mb-6">
              আবেদনকারীর অনুকূলে উক্ত <strong className="italic" style={{ fontStyle: 'italic' }}>{displayDaysWord}</strong> দিনের {leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : leaveType === 'STATION_LEAVE' ? 'কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক' : 'নৈমিত্তিক'} ছুটি মঞ্জুরীর সুপারিশ করা হলো।
            </div>

            <div 
              className="flex justify-between items-center text-xs text-black"
              style={{ paddingTop: '0.5in', paddingBottom: '0.75in' }}
            >
              <div className="text-left leading-normal">
                <span>সেল ইনচার্জ</span>
              </div>

              <div className="text-right leading-normal">
                <span>সহকারী মহাব্যবস্থাপক</span>
              </div>
            </div>

            <div className="text-left" style={{ paddingBottom: '0.75in' }}>
              <span>এজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</span>
            </div>
            <div className="text-left" style={{ paddingBottom: '0.75in' }}>
              <span>ডিজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</span>
            </div>
            <div className="text-left" style={{ paddingBottom: '0.75in' }}>
              <span>এজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</span>
            </div>
            <div className="text-left" style={{ paddingBottom: '0.75in' }}>
              <span>এসপিও, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
