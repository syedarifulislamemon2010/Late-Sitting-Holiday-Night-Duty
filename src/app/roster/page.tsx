'use client';

import React, { useState } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { useLayout, LayoutPriority } from '@/context/LayoutContext';
import { TableSkeleton } from "@/components/SkeletonLoader";
import { toBanglaDigits } from '@/lib/bengali-converter';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AlertCircle, X, CheckCircle, ChevronRight } from 'lucide-react';

import { useRosterData } from './hooks/useRosterData';
import { useRosterFilters } from './hooks/useRosterFilters';
import { useDutyAssignment } from './hooks/useDutyAssignment';
import { useOfficeOrderGeneration } from './hooks/useOfficeOrderGeneration';

import RosterHeaderBanner from './components/RosterHeaderBanner';
import DutyAssignmentPanel from './components/DutyAssignmentPanel';
import RosterListPanel from './components/RosterListPanel';
import OfficeOrderPrintPreview from './components/OfficeOrderPrintPreview';
import RosterConflictModal from './components/RosterConflictModal';

export default function RosterPage() {
  const { currentUser } = useProfile();
  const { activeLayout, setLayoutPriority } = useLayout();
  const isAssignmentPrimary = activeLayout === LayoutPriority.ASSIGNMENT;

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };
  const [msgBanner, setMsgBanner] = useState<{ type: 'success' | 'cancel'; text: string } | null>(null);
  const [billSuggestion, setBillSuggestion] = useState<{ ref: string; category: string } | null>(null);

  // 1. Filters Layer Hook
  const filters = useRosterFilters({
    currentUser,
    cells: []
  });

  // 2. Data Layer Hook
  const rosterData = useRosterData({
    currentUser,
    selectedMonths: filters.selectedMonths,
    selectedCell: filters.selectedCell,
    selectedCategory: filters.selectedCategory,
    selectedEmployee: filters.selectedEmployee,
    isEditingArchive: false
  });

  // 3. Office Order Generation Hook
  const orderGen = useOfficeOrderGeneration({
    duties: rosterData.duties,
    setDuties: rosterData.setDuties,
    employees: rosterData.employees,
    setEmployees: () => {},
    cells: rosterData.cells,
    setCells: () => {},
    executives: rosterData.executives,
    holidays: rosterData.holidays,
    officeOrders: rosterData.officeOrders,
    loadDuties: rosterData.loadDuties,
    loadOfficeOrders: async () => {
      const res = await fetch('/api/office-orders');
      if (res.ok) {
        const data = await res.json();
        rosterData.setOfficeOrders(Array.isArray(data) ? data : []);
      }
    },
    selectedCell: filters.selectedCell,
    setSelectedCell: filters.setSelectedCell,
    selectedMonths: filters.selectedMonths,
    setSelectedMonths: filters.setSelectedMonths,
    setOpt1CellId: filters.setOpt1CellId,
    opt1Assignments: {},
    setOpt1Assignments: () => {},
    assignmentForm: {},
    entryMode: 'EMPLOYEE_WISE',
    editingDuty: null,
    setBillSuggestion,
    setMsgBanner
  });

  // 4. Duty Assignment & Conflict Resolution Hook
  const dutyAssignment = useDutyAssignment({
    employees: rosterData.employees,
    cells: rosterData.cells,
    holidays: rosterData.holidays,
    leaves: rosterData.leaves,
    duties: rosterData.duties,
    loadDuties: rosterData.loadDuties,
    showToast,
    isEditingArchive: orderGen.isEditingArchive,
    setIsEditingArchive: orderGen.setIsEditingArchive,
    orderRef: orderGen.orderRef,
    originalOrderRef: orderGen.originalOrderRef,
    printCategory: orderGen.printCategory,
    setSelectedMonths: filters.setSelectedMonths,
    setOpt1CellId: filters.setOpt1CellId,
    setFormCellFilter: filters.setFormCellFilter,
    setFormSearchQuery: filters.setFormSearchQuery,
    setUserCustomOrderRef: orderGen.setUserCustomOrderRef,
    getGroupedDuties: orderGen.getGroupedDuties,
    updateAssociatedBill: orderGen.updateAssociatedBill,
    copies: orderGen.copies,
    signingOfficer: orderGen.signingOfficer,
    signingDesignation: orderGen.signingDesignation,
    headerMode: orderGen.headerMode,
    orderDate: orderGen.orderDate,
    orderText: orderGen.orderText,
    payeeEmployeeId: orderGen.payeeEmployeeId,
    selectedCell: filters.selectedCell
  });

  const pendingDutiesCount = rosterData.duties.filter(d => !d.orderRef).length;

  if (rosterData.isLoading) return (
    <div className="p-6">
      <TableSkeleton rows={8} columns={5} />
    </div>
  );

  return (
    <div className="space-y-6 min-h-screen bg-slate-50/50 dark:bg-transparent -m-4 lg:-m-8 p-4 lg:p-8">
      {/* Normal View Mode */}
      {!orderGen.isPrintMode ? (
        <>
          <RosterHeaderBanner
            msgBanner={msgBanner}
            setMsgBanner={setMsgBanner}
            pendingDutiesCount={pendingDutiesCount}
            onOpenPrintMode={() => orderGen.setIsPrintMode(true)}
            isEditingArchive={orderGen.isEditingArchive}
            orderRef={orderGen.orderRef}
            onExitEditMode={() => {
              orderGen.setIsEditingArchive(false);
              orderGen.setUserCustomOrderRef(null);
              window.history.pushState({}, '', '/roster');
              rosterData.loadDuties();
            }}
          />

          <div className="flex flex-col xl:flex-row gap-6 items-start no-print">
            {/* Left Column: Duty Assignment Panel */}
            <DutyAssignmentPanel
              currentUser={currentUser}
              cells={rosterData.cells}
              employees={rosterData.employees}
              holidays={rosterData.holidays}
              leaves={rosterData.leaves}
              entryMode={dutyAssignment.entryMode}
              setEntryMode={dutyAssignment.setEntryMode}
              assignmentForm={dutyAssignment.assignmentForm}
              setAssignmentForm={dutyAssignment.setAssignmentForm}
              opt1CellId={filters.opt1CellId}
              setOpt1CellId={filters.setOpt1CellId}
              opt1SearchQuery={filters.opt1SearchQuery}
              setOpt1SearchQuery={filters.setOpt1SearchQuery}
              opt1Assignments={dutyAssignment.opt1Assignments}
              setOpt1Assignments={dutyAssignment.setOpt1Assignments}
              opt1ViewedMonths={dutyAssignment.opt1ViewedMonths}
              setOpt1ViewedMonths={dutyAssignment.setOpt1ViewedMonths}
              formSearchQuery={filters.formSearchQuery}
              setFormSearchQuery={filters.setFormSearchQuery}
              formCellFilter={filters.formCellFilter}
              setFormCellFilter={filters.setFormCellFilter}
              submitting={dutyAssignment.submitting}
              errorMessage={dutyAssignment.errorMessage}
              preConflicts={dutyAssignment.preConflicts}
              editingDuty={dutyAssignment.editingDuty}
              editingDuties={dutyAssignment.editingDuties}
              isEditingArchive={orderGen.isEditingArchive}
              isRosterDirty={orderGen.isRosterDirty}
              isAssignmentPrimary={isAssignmentPrimary}
              onFocusPanel={() => setLayoutPriority(LayoutPriority.ASSIGNMENT)}
              handleSubmit={dutyAssignment.handleAssignmentSubmit}
              handleCancelEdit={dutyAssignment.handleCancelEdit}
              handleCancelRosterEdit={dutyAssignment.handleCancelRosterEdit}
              handleBulkDutyImport={dutyAssignment.handleBulkDutyImport}
              isSubmitDisabled={dutyAssignment.isSubmitDisabled}
            />

            {/* Right Column: Roster Monthly List Panel */}
            <RosterListPanel
              currentUser={currentUser}
              cells={rosterData.cells}
              employees={rosterData.employees}
              duties={rosterData.duties}
              officeOrders={rosterData.officeOrders}
              selectedCell={filters.selectedCell}
              changeSelectedCell={filters.changeSelectedCell}
              selectedCategory={filters.selectedCategory}
              setSelectedCategory={filters.setSelectedCategory}
              selectedEmployee={filters.selectedEmployee}
              setSelectedEmployee={filters.setSelectedEmployee}
              selectedMonths={filters.selectedMonths}
              changeSelectedMonths={filters.changeSelectedMonths}
              isAssignmentPrimary={isAssignmentPrimary}
              onFocusPanel={() => setLayoutPriority(LayoutPriority.ROSTER)}
              selectedDutyIds={dutyAssignment.selectedDutyIds}
              setSelectedDutyIds={dutyAssignment.setSelectedDutyIds}
              handleBulkDeleteDuties={dutyAssignment.handleBulkDeleteDuties}
              handleStartEdit={dutyAssignment.handleStartEdit}
              deleteGroupedDuties={dutyAssignment.deleteGroupedDuties}
              handlePreviewOfficeOrder={orderGen.handlePreviewOfficeOrder}
              handleDeleteOfficeOrder={orderGen.handleDeleteOfficeOrder}
            />
          </div>
        </>
      ) : (
        /* Government Print Mode (অফিস আদেশ / জিও) */
        <OfficeOrderPrintPreview
          orderGenerated={orderGen.orderGenerated}
          isEditingArchive={orderGen.isEditingArchive}
          isArchived={orderGen.isArchived}
          submitting={dutyAssignment.submitting}
          isRosterDirty={orderGen.isRosterDirty}
          orderRef={orderGen.orderRef}
          originalOrderRef={orderGen.originalOrderRef}
          orderDate={orderGen.orderDate}
          orderText={orderGen.orderText}
          printCategory={orderGen.printCategory}
          payeeEmployeeId={orderGen.payeeEmployeeId}
          selectedExecutiveId={orderGen.selectedExecutiveId}
          executives={rosterData.executives}
          signingOfficer={orderGen.signingOfficer}
          signingDesignation={orderGen.signingDesignation}
          headerMode={orderGen.headerMode}
          suggestedRef={orderGen.suggestedRef}
          refDuplicate={orderGen.refDuplicate}
          holidays={rosterData.holidays}
          duties={rosterData.duties}
          selectedCell={filters.selectedCell}
          activePartIdx={orderGen.activePartIdx}
          stableNumber={orderGen.stableNumber}
          setUserCustomOrderRef={orderGen.setUserCustomOrderRef}
          setUserCustomOrderDate={orderGen.setUserCustomOrderDate}
          setUserCustomOrderText={orderGen.setUserCustomOrderText}
          setUserSelectedPayeeId={orderGen.setUserSelectedPayeeId}
          setSelectedExecutiveId={orderGen.setSelectedExecutiveId}
          setSigningOfficer={orderGen.setSigningOfficer}
          setSigningDesignation={orderGen.setSigningDesignation}
          setHeaderMode={orderGen.setHeaderMode}
          changePrintCategory={orderGen.changePrintCategory}
          setActivePartIdx={orderGen.setActivePartIdx}
          handleBackToRoster={orderGen.handleBackToRoster}
          archiveOrder={orderGen.archiveOrder}
          saveOrderToArchive={orderGen.saveOrderToArchive}
          handleCancelRosterEdit={dutyAssignment.handleCancelRosterEdit}
          getGroupedDuties={orderGen.getGroupedDuties}
          getSplitParts={orderGen.getSplitParts}
          getShortDesignation={orderGen.getShortDesignation}
        />
      )}

      {/* Conflict Resolution & Auto-Redirect Modal */}
      <RosterConflictModal
        conflictModalData={dutyAssignment.conflictModalData}
        onClose={() => dutyAssignment.setConflictModalData(null)}
        onRedirectToConflictingDuties={dutyAssignment.handleRedirectToConflictingDuties}
        onOverwriteAndSave={dutyAssignment.handleOverwriteAndSave}
      />

      {/* Bill Suggestion Toast */}
      {billSuggestion && (
        <div className="fixed bottom-5 right-5 z-50 max-w-[420px] p-4 bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/40 border-emerald-200 dark:border-emerald-800 border rounded-2xl shadow-xl flex flex-col gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300"
             style={{
               fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif",
             }}>
          <div className="flex items-start gap-3">
            <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
            <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 leading-relaxed">
              ✅ অফিস আদেশ সফলভাবে তৈরি হয়েছে। 💰 এখন বিল মেমো তৈরি করতে চান?
            </div>
            <button onClick={() => setBillSuggestion(null)} className="text-slate-400 hover:text-slate-600 ml-auto p-1 rounded-lg shrink-0 cursor-pointer -mt-1 -mr-1">
              <X size={16} />
            </button>
          </div>
          <div className="flex justify-end mt-1">
            <a 
              href={`/billing?orderRef=${encodeURIComponent(billSuggestion.ref)}&category=${encodeURIComponent(billSuggestion.category)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              বিলিং পেজে যান <ChevronRight size={14} />
            </a>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-[400px] p-4 bg-red-50 text-red-900 border border-red-200 rounded-2xl shadow-xl flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-300"
             style={{
               fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif",
               fontSize: "14px",
               lineHeight: "1.7",
             }}>
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div>
            <div className="font-bold text-red-800">ডিউটি সংঘর্ষ বা ছুটির ওভারল্যাপ</div>
            <div className="mt-1 text-xs text-red-700">{toast.message}</div>
          </div>
          <button onClick={() => setToast(null)} className="text-red-400 hover:text-red-650 ml-auto p-0.5 rounded-lg shrink-0 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={dutyAssignment.isBulkDeleteConfirmOpen}
        title="ডিউটি রোস্টার মুছে ফেলা"
        description={`আপনি কি নিশ্চিত যে নির্বাচিত ${toBanglaDigits(dutyAssignment.selectedDutyIds.length)} টি ডিউটি মুছে ফেলতে চান?`}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        variant="danger"
        isLoading={dutyAssignment.submitting}
        onConfirm={dutyAssignment.executeBulkDeleteDuties}
        onCancel={() => dutyAssignment.setIsBulkDeleteConfirmOpen(false)}
      />
    </div>
  );
}
