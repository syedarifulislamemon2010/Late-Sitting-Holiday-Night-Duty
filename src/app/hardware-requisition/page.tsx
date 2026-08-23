'use client';

import React, { useState } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import AuthGuard from '@/components/AuthGuard';
import { Button } from '@/components/ui/Button';
import { Printer, ArrowLeft, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';

import { useHardwareRequisitionData } from './hooks/useHardwareRequisitionData';
import HardwareRequisitionForm from './components/HardwareRequisitionForm';
import HardwareRequisitionList from './components/HardwareRequisitionList';
import HardwarePrintSheet from './components/HardwarePrintSheet';
import { HardwareItem } from './types';

export default function HardwareRequisitionPage() {
  const { currentUser } = useProfile();
  const data = useHardwareRequisitionData(currentUser);

  const [isPrintMode, setIsPrintMode] = useState(false);

  const monthNamesBN = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const getBnDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${toBanglaDigits(parseInt(d, 10).toString())}ই ${monthNamesBN[parseInt(m, 10) - 1]}, ${toBanglaDigits(y)}`;
  };

  const cleanDesignation = (desig: string) => {
    if (!desig) return '';
    return desig.replace(/\(([^)]+)\)/, '$1').trim();
  };

  if (data.loading) {
    return (
      <div className="p-6">
        <TableSkeleton rows={8} columns={5} />
      </div>
    );
  }

  // Print Mode Preview
  if (isPrintMode && data.previewReq) {
    let itemsList: HardwareItem[] = [];
    try {
      if (data.previewReq.itemsJson) {
        itemsList = JSON.parse(data.previewReq.itemsJson);
      }
    } catch (e) {}

    const printItems = itemsList.map((item, idx) => ({
      serialNo: toBanglaDigits(idx + 1),
      officerNameSnapshot: data.previewReq?.applicantName || '',
      officerDesignationSnapshot: data.previewReq?.applicantDesignation || '',
      hardwareLabel: `${item.itemType} (${item.itemDescription || 'Standard'}) - ${toBanglaDigits(item.quantity)} ${item.unit}`
    }));

    return (
      <div className="space-y-4 p-4 lg:p-8 bg-white dark:bg-slate-950 min-h-screen">
        <div className="flex items-center justify-between no-print border-b border-slate-200 dark:border-slate-800 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsPrintMode(false);
              data.setPreviewReq(null);
            }}
            className="text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} /> ফর্মে ফিরে যান
          </Button>

          <Button
            size="sm"
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} /> প্রিন্ট করুন
          </Button>
        </div>

        <HardwarePrintSheet
          requisitionDate={data.previewReq.requisitionDate}
          subjectLine="হার্ডওয়্যার ও আনুষঙ্গিক যন্ত্রাংশ বরাদ্দের আবেদন প্রসঙ্গে।"
          bodyParagraph={`অনলাইন ব্যাংকিং ডিপার্টমেন্টের দাপ্তরিক কার্যাদি ও ডেভেলপমেন্ট কার্যক্রম সুষ্ঠুভাবে পরিচালনার নিমিত্তে নিম্নে বর্ণিত কর্মকর্তার জন্য প্রয়োজনীয় হার্ডওয়্যার সরঞ্জাম বরাদ্দের জন্য অনুরোধ করা হলো।`}
          items={printItems}
          requesterName={data.previewReq.applicantName}
          requesterDesignation={data.previewReq.applicantDesignation}
          getBnDateString={getBnDateString}
          cleanDesignation={cleanDesignation}
        />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-6 min-h-screen bg-slate-50/50 dark:bg-transparent -m-4 lg:-m-8 p-4 lg:p-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 lg:p-6 rounded-2xl shadow-sm">
          <div className="space-y-1">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>হার্ডওয়্যার রিকুইজিশন ফরম (Hardware Requisition)</span>
            </h1>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
              দাপ্তরিক কাজের জন্য প্রয়োজনীয় কম্পিউটার ও আইটি হার্ডওয়্যার রিকুইজিশন তৈরি ও প্রিন্ট করুন।
            </p>
          </div>
        </div>

        {/* Global Success / Error Banners */}
        {data.successMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center justify-between shadow-sm text-xs font-semibold animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle size={16} className="text-emerald-600 shrink-0" />
              <span>{data.successMessage}</span>
            </div>
            <button onClick={() => data.setSuccessMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        )}

        {data.errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center justify-between shadow-sm text-xs font-semibold animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{data.errorMessage}</span>
            </div>
            <button onClick={() => data.setErrorMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        )}

        {/* 1. Requisition Creation & Edit Form */}
        <HardwareRequisitionForm
          editingId={data.editingId}
          requisitionDate={data.requisitionDate}
          setRequisitionDate={data.setRequisitionDate}
          applicantName={data.applicantName}
          setApplicantName={data.setApplicantName}
          applicantDesignation={data.applicantDesignation}
          setApplicantDesignation={data.setApplicantDesignation}
          applicantCell={data.applicantCell}
          setApplicantCell={data.setApplicantCell}
          applicantId={data.applicantId}
          setApplicantId={data.setApplicantId}
          requisitionType={data.requisitionType}
          setRequisitionType={data.setRequisitionType}
          reason={data.reason}
          setReason={data.setReason}
          items={data.items}
          employees={data.employees}
          cells={data.cells}
          isSubmitting={data.isSubmitting}
          onAddItem={data.handleAddItem}
          onRemoveItem={data.handleRemoveItem}
          onUpdateItem={data.handleUpdateItem}
          onSubmit={data.handleSubmit}
          onReset={data.handleReset}
        />

        {/* 2. Archived Requisitions List */}
        <HardwareRequisitionList
          requisitions={data.requisitions}
          searchQuery={data.searchQuery}
          setSearchQuery={data.setSearchQuery}
          onPreview={req => {
            data.setPreviewReq(req);
            setIsPrintMode(true);
          }}
          onEdit={data.handleEdit}
          onDelete={data.handleDelete}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={!!data.reqToDelete}
          title="হার্ডওয়্যার রিকুইজিশন মুছে ফেলার নিশ্চিতকরণ"
          description="আপনি কি নিশ্চিত যে এই রিকুইজিশন রেকর্ডটি মুছে ফেলতে চান? এটি মুছে ফেললে তা রিসাইকেল বিনে স্থানান্তরিত বা ডিলিট হবে।"
          confirmText="হ্যাঁ, মুছে ফেলুন"
          cancelText="বাতিল"
          variant="danger"
          onConfirm={data.confirmDeleteReq}
          onCancel={() => data.setReqToDelete(null)}
        />
      </div>
    </AuthGuard>
  );
}
