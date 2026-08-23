'use client';

import React, { useState } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import AuthGuard from '@/components/AuthGuard';
import { Button } from '@/components/ui/Button';
import { Printer, ArrowLeft } from 'lucide-react';

import { useTazFormData } from './hooks/useTazFormData';
import TazFormFields from './components/TazFormFields';
import TazFormsList from './components/TazFormsList';
import TazPrintPreviewSheet from './components/TazPrintPreviewSheet';

export default function TazCommitteeFormPage() {
  const { currentUser } = useProfile();
  const data = useTazFormData();

  const [isPrintMode, setIsPrintMode] = useState(false);

  const formatDateToDMY = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d}-${m}-${y}`;
    }
    return dateStr;
  };

  const formatDateTimeForPrint = (dtStr: string) => {
    if (!dtStr) return '';
    return dtStr;
  };

  if (data.loading) {
    return (
      <div className="p-6">
        <TableSkeleton rows={8} columns={5} />
      </div>
    );
  }

  // Print Preview View
  if (isPrintMode && data.previewForm) {
    let parsedImplementers = [];
    try {
      if (data.previewForm.implementersJson) {
        parsedImplementers = JSON.parse(data.previewForm.implementersJson);
      }
    } catch (e) {}

    return (
      <div className="space-y-4 p-4 lg:p-8 bg-white dark:bg-slate-950 min-h-screen">
        <div className="flex items-center justify-between no-print border-b border-slate-200 dark:border-slate-800 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsPrintMode(false);
              data.setPreviewForm(null);
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

        <TazPrintPreviewSheet
          formDate={data.previewForm.formDate}
          refCode={data.previewForm.ref}
          title={data.previewForm.title}
          purpose={data.previewForm.purpose}
          applicationName={data.previewForm.applicationName}
          routineDetails={data.previewForm.routineDetails}
          subroutineDetails={data.previewForm.subroutineDetails}
          versionInfo={data.previewForm.versionInfo}
          needBackendAccess={data.previewForm.needBackendAccess}
          needCoreFtpAccess={data.previewForm.needCoreFtpAccess}
          needBrowserAccess={data.previewForm.needBrowserAccess}
          browserPortChange={data.previewForm.browserPortChange}
          duringTxHour={data.previewForm.duringTxHour}
          numTeamMembers={data.previewForm.numTeamMembers}
          approxScheduleStart={data.previewForm.approxScheduleStart}
          approxScheduleEnd={data.previewForm.approxScheduleEnd}
          execScheduleStart={data.previewForm.execScheduleStart}
          execScheduleEnd={data.previewForm.execScheduleEnd}
          impact={data.previewForm.impact}
          requesterName={data.previewForm.requesterName}
          requesterDesignation={data.previewForm.requesterDesignation}
          requesterOrganization={data.previewForm.requesterOrganization}
          implementers={parsedImplementers}
          formatDateToDMY={formatDateToDMY}
          formatDateTimeForPrint={formatDateTimeForPrint}
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
              <span>তায কমিটি ফরম ও অনুমোদন (TAZ Committee Form)</span>
            </h1>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
              সফটওয়্যার কাস্টমাইজেশন ও ডেভেলপমেন্টের তায কমিটি অনুমোদনের ফরম প্রস্তুত ও প্রিন্ট করুন।
            </p>
          </div>
        </div>

        {/* 1. Form Creation & Edit Section */}
        <TazFormFields
          formData={data.formData}
          implementers={data.implementers}
          editingId={data.editingId}
          isSubmitting={data.isSubmitting}
          employees={data.employees}
          cells={data.cells}
          onInputChange={data.handleInputChange}
          onAddImplementer={data.handleAddImplementer}
          onRemoveImplementer={data.handleRemoveImplementer}
          onUpdateImplementer={data.handleUpdateImplementer}
          onSubmit={data.handleSubmit}
          onReset={data.handleReset}
        />

        {/* 2. Archived / Saved Forms Table */}
        <TazFormsList
          forms={data.forms}
          searchQuery={data.searchQuery}
          setSearchQuery={data.setSearchQuery}
          onPreview={form => {
            data.setPreviewForm(form);
            setIsPrintMode(true);
          }}
          onEdit={data.handleEdit}
          onDelete={data.handleDelete}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={!!data.formToDelete}
          title="তায কমিটি ফরম মুছে ফেলার নিশ্চিতকরণ"
          description="আপনি কি নিশ্চিত যে এই ফরম রেকর্ডটি মুছে ফেলতে চান? এটি মুছে ফেললে তা স্থায়ীভাবে ডিলিট হয়ে যাবে।"
          confirmText="হ্যাঁ, মুছে ফেলুন"
          cancelText="বাতিল"
          variant="danger"
          onConfirm={data.confirmDeleteForm}
          onCancel={() => data.setFormToDelete(null)}
        />
      </div>
    </AuthGuard>
  );
}
