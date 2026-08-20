'use client';

import React from 'react';
import logger from '@/lib/logger';
import { useProfile } from '@/context/ProfileContext';
import AuthGuard from '@/components/AuthGuard';
import { FormSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toBanglaDigits } from '@/lib/bengali-converter';

import LeaveFormHeader from './components/LeaveFormHeader';
import LeaveForm from './components/LeaveForm';
import LeavePrintView from './components/LeavePrintView';
import { useLeaveData, cleanDesignationForLeave } from './hooks/useLeaveData';
import { Employee, Leave } from './types';

export default function LeaveGeneratorPage() {
  const { currentUser } = useProfile();
  
  const {
    matchedEmp,
    selectedApplicantEmp,
    setSelectedApplicantEmp,
    isProfileUnresolved,
    employees,
    cells,
    selectedCellId,
    setSelectedCellId,
    loading,
    showValidationErrors,
    setShowValidationErrors,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    durationMode,
    setDurationMode,
    applicationDate,
    setApplicationDate,
    applicantName,
    setApplicantName,
    designation,
    setDesignation,
    bankId,
    setBankId,
    fileNo,
    setFileNo,
    cellName,
    setCellName,
    leaveLocation,
    setLeaveLocation,
    mobileNo,
    setMobileNo,
    leaveType,
    setLeaveType,
    activeTab,
    setActiveTab,
    archivedLeaves,
    latestLeave,
    editingLeaveId,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    deleteConfirmModal,
    setDeleteConfirmModal,
    selectedDistrict,
    setSelectedDistrict,
    delegateId,
    setDelegateId,
    isAutoBalance,
    setIsAutoBalance,
    balanceLoading,
    casualTotal,
    setCasualTotal,
    casualUsed,
    setCasualUsed,
    ordinaryTotal,
    setOrdinaryTotal,
    ordinaryUsed,
    setOrdinaryUsed,
    specialTotal,
    setSpecialTotal,
    specialUsed,
    setSpecialUsed,
    eligibleCoveringOfficers,
    leaveDetails,
    isSingleDay,
    dateLimits,
    isNonWorkingDay,
    handleSaveToArchive,
    handleEditLeave,
    handleLoadLeavePreview,
    handleDeleteLeave,
    executeDeleteLeave,
    handleCancelEdit,
    getDropdownValidation,
  } = useLeaveData(currentUser);

  const validation = getDropdownValidation();

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

  const handlePrint = async () => {
    handleSaveToArchive().catch(console.error);
    window.print();
  };

  const handleDownloadDocx = async () => {
    try {
      handleSaveToArchive().catch(console.error);

      const { generateLeaveDocx } = await import('@/lib/docx-generator');
      const delegateEmp = employees.find(e => String(e.id) === delegateId);
      const displayDaysWord = isSingleDay ? getBanglaDayWord(1) : (leaveDetails.actualDeducted > 0 ? getBanglaDayWord(leaveDetails.actualDeducted) : '');

      let bodyText = '';
      if (leaveType === 'POST_FACTO') {
        bodyText = isSingleDay
          ? `যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত ও পারিবারিক জরুরি প্রয়োজনে আমি গত ${startDate ? toDisplayDateStr(startDate) : ''} ইং তারিখে ০১ (এক) দিন অফিসে উপস্থিত হতে পারিনি বিধায় উক্ত ০১ (এক) দিনের ঘটনাত্তোর নৈমিত্তিক ছুটি মঞ্জুরের জন্য বিনীত আবেদন জানাচ্ছি।`
          : `যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত ও পারিবারিক জরুরি প্রয়োজনে আমি গত ${startDate ? toDisplayDateStr(startDate) : ''} হতে ${endDate ? toDisplayDateStr(endDate) : ''} ইং তারিখ পর্যন্ত মোট ${displayDaysWord} দিনের ঘটনাত্তোর নৈমিত্তিক ছুটি মঞ্জুরের জন্য বিনীত আবেদন জানাচ্ছি।`;
      } else if (leaveType === 'STATION_LEAVE') {
        bodyText = isSingleDay
          ? `যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত প্রয়োজনে আগামী ${startDate ? toDisplayDateStr(startDate) : ''} ইং তারিখে আমার ${selectedDistrict || 'ঢাকার বাইরে'} অবস্থান করা প্রয়োজন। উক্ত ০১ (এক) দিন কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটি মঞ্জুরের জন্য বিনীত আবেদন জানাচ্ছি।`
          : `যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত প্রয়োজনে আগামী ${startDate ? toDisplayDateStr(startDate) : ''} হতে ${endDate ? toDisplayDateStr(endDate) : ''} ইং তারিখ পর্যন্ত আমার ${selectedDistrict || 'ঢাকার বাইরে'} অবস্থান করা প্রয়োজন। উক্ত ${displayDaysWord} দিন কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটি মঞ্জুরের জন্য বিনীত আবেদন জানাচ্ছি।`;
      } else {
        bodyText = isSingleDay
          ? `যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত প্রয়োজনে আগামী ${startDate ? toDisplayDateStr(startDate) : ''} ইং তারিখে আমার ছুটি প্রয়োজন। উক্ত ০১ (এক) দিনের নৈমিত্তিক ছুটি মঞ্জুরের জন্য বিনীত আবেদন জানাচ্ছি।`
          : `যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত প্রয়োজনে আগামী ${startDate ? toDisplayDateStr(startDate) : ''} হতে ${endDate ? toDisplayDateStr(endDate) : ''} ইং তারিখ পর্যন্ত মোট ${displayDaysWord} দিনের নৈমিত্তিক ছুটি মঞ্জুরের জন্য বিনীত আবেদন জানাচ্ছি।`;
      }

      const appliedDays = (startDate || endDate) 
        ? (isSingleDay ? 1 : (leaveDetails.actualDeducted > 0 ? leaveDetails.actualDeducted : 1)) 
        : 0;
      const previousUsedNum = parseInt(String(casualUsed || 0), 10) || 0;
      const totalEntitledNum = parseInt(String(casualTotal || 20), 10) || 20;
      const currentCasualUsed = (leaveType === 'CASUAL' || leaveType === 'POST_FACTO' || leaveType === 'STATION_LEAVE')
        ? (previousUsedNum + appliedDays)
        : previousUsedNum;
      const currentCasualRemaining = Math.max(0, totalEntitledNum - currentCasualUsed);

      const getRemainingVal = (t: number | string, u: number | string) => {
        const tN = parseInt(String(t), 10);
        const uN = parseInt(String(u), 10);
        if (isNaN(tN) || isNaN(uN)) return '-';
        return Math.max(0, tN - uN);
      };

      const appYear = applicationDate ? applicationDate.split('-')[0] : new Date().getFullYear().toString();

      const blob = await generateLeaveDocx({
        applicationDateStr: toBanglaFullDateStr(applicationDate),
        applicantName,
        designation,
        bankId,
        fileNo,
        cellName,
        leaveType,
        subjectText: leaveDetails.actualDeducted > 0 || isSingleDay ? formatSubject() : 'বিষয়ঃ নৈমিত্তিক ছুটি মঞ্জুরির আবেদন।',
        bodyParagraphs: [
          leaveType === 'STATION_LEAVE' ? 'মহোদয়,' : 'প্রিয় মহোদয়,',
          bodyText,
          'অতএব, মহোদয়ের নিকট বিনীত প্রার্থনা এই যে, আমাকে উক্ত ছুটি মঞ্জুর করে বাধিত করবেন।'
        ],
        leaveLocation: selectedDistrict || 'ঢাকা',
        mobileNo,
        delegateOfficerName: delegateEmp?.name,
        delegateOfficerDesig: cleanDesignationForLeave(delegateEmp?.designation || ''),
        appYear: toBanglaDigits(appYear),
        casualTotal: toBanglaDigits(casualTotal),
        casualUsed: toBanglaDigits(currentCasualUsed),
        casualRemaining: toBanglaDigits(currentCasualRemaining),
        ordinaryTotal: toBanglaDigits(ordinaryTotal),
        ordinaryUsed: toBanglaDigits(ordinaryUsed),
        ordinaryRemaining: toBanglaDigits(getRemainingVal(ordinaryTotal, ordinaryUsed)),
        specialTotal: toBanglaDigits(specialTotal),
        specialUsed: toBanglaDigits(specialUsed),
        specialRemaining: toBanglaDigits(getRemainingVal(specialTotal, specialUsed)),
        daysCount: isSingleDay ? 1 : leaveDetails.actualDeducted,
        daysInBanglaWords: displayDaysWord,
        leaveTypeBangla: leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : leaveType === 'STATION_LEAVE' ? 'কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক' : 'নৈমিত্তিক'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Leave_Application_${bankId || 'Officer'}_${applicationDate}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Error generating DOCX document:', err);
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-6 pb-12 font-sans">
        
        {/* TOP BAR / NAVIGATION */}
        <LeaveFormHeader handlePrint={handlePrint} handleDownloadDocx={handleDownloadDocx} />

        {/* Loading State */}
        {loading ? (
          <div className="no-print space-y-6">
            <FormSkeleton fields={6} />
            <TableSkeleton rows={4} columns={5} />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Banner Messages */}
            <div className="no-print space-y-3">
              {successMsg && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm">
                  <span>{errorMsg}</span>
                </div>
              )}
              {editingLeaveId && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-xl flex justify-between items-center shadow-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                    আপনি বর্তমানে একটি সংরক্ষিত আবেদন (আইডি #{toBanglaDigits(editingLeaveId)}) এডিট করছেন।
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer text-[10px] font-extrabold"
                  >
                    বাতিল করুন
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* LEFT: Leaf Generator Settings Form */}
              <LeaveForm
                currentUser={currentUser}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isProfileUnresolved={isProfileUnresolved}
                cells={cells}
                employees={employees}
                selectedCellId={selectedCellId}
                setSelectedCellId={setSelectedCellId}
                selectedApplicantEmp={selectedApplicantEmp}
                setSelectedApplicantEmp={setSelectedApplicantEmp}
                applicantName={applicantName}
                setApplicantName={setApplicantName}
                designation={designation}
                setDesignation={setDesignation}
                bankId={bankId}
                setBankId={setBankId}
                fileNo={fileNo}
                setFileNo={setFileNo}
                mobileNo={mobileNo}
                setMobileNo={setMobileNo}
                cellName={cellName}
                setCellName={setCellName}
                leaveLocation={leaveLocation}
                setLeaveLocation={setLeaveLocation}
                selectedDistrict={selectedDistrict}
                setSelectedDistrict={setSelectedDistrict}
                showValidationErrors={showValidationErrors}
                setShowValidationErrors={setShowValidationErrors}
                leaveType={leaveType}
                setLeaveType={setLeaveType}
                durationMode={durationMode}
                setDurationMode={setDurationMode}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                dateLimits={dateLimits}
                isNonWorkingDay={isNonWorkingDay}
                delegateId={delegateId}
                setDelegateId={setDelegateId}
                eligibleCoveringOfficers={eligibleCoveringOfficers}
                isAutoBalance={isAutoBalance}
                setIsAutoBalance={setIsAutoBalance}
                balanceLoading={balanceLoading}
                casualTotal={casualTotal}
                setCasualTotal={setCasualTotal}
                casualUsed={casualUsed}
                setCasualUsed={setCasualUsed}
                ordinaryTotal={ordinaryTotal}
                setOrdinaryTotal={setOrdinaryTotal}
                ordinaryUsed={ordinaryUsed}
                setOrdinaryUsed={setOrdinaryUsed}
                specialTotal={specialTotal}
                setSpecialTotal={setSpecialTotal}
                specialUsed={specialUsed}
                setSpecialUsed={setSpecialUsed}
                leaveDetails={leaveDetails}
                editingLeaveId={editingLeaveId}
                latestLeave={latestLeave}
                archivedLeaves={archivedLeaves}
                onSaveToArchive={handleSaveToArchive}
                onLoadLeavePreview={handleLoadLeavePreview}
                onEditLeave={handleEditLeave}
                onDeleteLeave={handleDeleteLeave}
              />

              {/* RIGHT: Document Sheet Preview */}
              <LeavePrintView
                applicationDate={applicationDate}
                applicantName={applicantName}
                designation={designation}
                bankId={bankId}
                fileNo={fileNo}
                cellName={cellName}
                mobileNo={mobileNo}
                selectedDistrict={selectedDistrict}
                leaveType={leaveType}
                startDate={startDate}
                endDate={endDate}
                isSingleDay={isSingleDay}
                leaveDetails={leaveDetails}
                delegateId={delegateId}
                eligibleCoveringOfficers={eligibleCoveringOfficers}
                casualTotal={casualTotal}
                casualUsed={casualUsed}
                ordinaryTotal={ordinaryTotal}
                ordinaryUsed={ordinaryUsed}
                specialTotal={specialTotal}
                specialUsed={specialUsed}
                validation={validation}
              />

            </div>

          </div>
        )}

      </div>
      
      {/* Dynamic Printing CSS styles */}
      <style>{`
        #printable-leave-sheet, #printable-leave-sheet * {
          font-family: 'SolaimanLipi', 'Nikosh', 'Noto Sans Bengali', sans-serif !important;
          font-size: 15px !important;
          font-style: normal;
          line-height: 1.45 !important;
          color: #000000;
          text-decoration: none;
          letter-spacing: normal !important;
          word-spacing: normal !important;
        }
        .dark #printable-leave-sheet {
          background-color: #090d16 !important;
          border-color: #1e293b !important;
        }
        .dark #printable-leave-sheet .bg-white {
          background-color: transparent !important;
        }
        .dark #printable-leave-sheet * {
          color: #f8fafc !important;
          border-color: #334155 !important;
        }
        .dark #printable-leave-sheet .bg-slate-50,
        .dark #printable-leave-sheet th {
          background-color: #1e293b !important;
        }
        .dark #printable-leave-sheet table,
        .dark #printable-leave-sheet tr,
        .dark #printable-leave-sheet th,
        .dark #printable-leave-sheet td {
          border-color: #334155 !important;
        }
        #printable-leave-sheet, #printable-leave-sheet *:not(.bold-text):not(strong):not(b) {
          font-weight: normal !important;
        }
        #printable-leave-sheet .bold-text, #printable-leave-sheet .bold-text * {
          font-weight: bold !important;
        }

        @media print {
          @page {
            size: legal portrait;
            margin: 0 !important;
          }
          
          html, body {
            width: 216mm !important;
            height: 355mm !important;
            max-height: 355mm !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .no-print, footer, header, nav, aside, [role="navigation"], .sidebar-wrapper, .mobile-nav-top, .sidebar-footer {
            display: none !important;
          }

          main, .flex-1, .p-4, .lg\\:p-8, .p-6, .py-6, .xl\\:col-span-8, .pb-8 {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            width: auto !important;
            height: auto !important;
            max-height: none !important;
            min-height: auto !important;
            overflow: visible !important;
          }

          #printable-leave-sheet {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 216mm !important;
            height: 355mm !important;
            min-height: 355mm !important;
            max-height: 355mm !important;
            padding: 15mm 20mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }

          #printable-leave-sheet,
          #printable-leave-sheet * {
            background-color: transparent !important;
            color: #000000 !important;
            border-color: #000000 !important;
          }
          #printable-leave-sheet {
            background-color: #ffffff !important;
          }
        }
      `}</style>
      <ConfirmDialog
        isOpen={deleteConfirmModal.isOpen}
        title="ছুটির আবেদন মুছে ফেলা"
        description="প্রিন্টেড বা প্রিভিউড এপ্লিকেশন ডিলেট না করাই বেটার। আপনি কি সত্যিই এটা ডিলেট করতে চান?"
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        variant="danger"
        isLoading={deleteConfirmModal.isLoading}
        onConfirm={executeDeleteLeave}
        onCancel={() => setDeleteConfirmModal({ isOpen: false, leaveId: null, isLoading: false })}
      />
    </AuthGuard>
  );
}
