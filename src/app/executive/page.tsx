'use client';

import { useEffect } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Loader2 } from 'lucide-react';

import { useExecutivesData } from './hooks/useExecutivesData';
import { ExecutiveControls } from './components/ExecutiveControls';
import { ExecutiveAdvancedFilters } from './components/ExecutiveAdvancedFilters';
import { ExecutiveCardGrid } from './components/ExecutiveCardGrid';
import { ExecutiveFormModal } from './components/ExecutiveFormModal';
import { ExecutiveBulkModal } from './components/ExecutiveBulkModal';
import { ExecutiveProfileModal } from './components/ExecutiveProfileModal';
import { ExecutivePrintPreviewModal } from './components/ExecutivePrintPreviewModal';

export default function ExecutivesPage() {
  const { currentUser } = useProfile();
  const {
    loading,
    searchQuery,
    setSearchQuery,
    showAdvancedFilters,
    setShowAdvancedFilters,
    filterDesignation,
    setFilterDesignation,
    filterPhoneStatus,
    setFilterPhoneStatus,
    filterBankIdStatus,
    setFilterBankIdStatus,
    filterFileNoStatus,
    setFilterFileNoStatus,
    generating,
    isPreviewOpen,
    setIsPreviewOpen,
    iframeUrl,
    setIframeUrl,
    isModalOpen,
    setIsModalOpen,
    editingExec,
    profileExec,
    setProfileExec,
    execToDelete,
    setExecToDelete,
    form,
    setForm,
    errorMessage,
    isBulkModalOpen,
    setIsBulkModalOpen,
    bulkText,
    setBulkText,
    bulkImporting,
    bulkError,
    isImageImportLoading,
    handleSubmit,
    deleteExec,
    confirmDeleteExec,
    generateEmployeeList,
    handleBulkSubmit,
    handleTextareaPaste,
    exportExecutivesToCSV,
    startEditExec,
    openNewExecModal,
    openBulkModal,
    filteredExecutives
  } = useExecutivesData();

  // Redirect if not admin
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role !== 'ADMIN') {
        window.location.href = '/';
      }
    }
  }, [currentUser]);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0b5e9e]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">
            নির্বাহী প্যানেল (Executives)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            জনতা ব্যাংক পিএলসি. এর মহাব্যবস্থাপক, উপ-মহাব্যবস্থাপক এবং সহকারী মহাব্যবস্থাপক বৃন্দের তালিকা।
          </p>
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={6} />
      ) : (
        <div className="space-y-6">
          {/* Controls Menu */}
          <ExecutiveControls
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showAdvancedFilters={showAdvancedFilters}
            setShowAdvancedFilters={setShowAdvancedFilters}
            filterDesignation={filterDesignation}
            filterPhoneStatus={filterPhoneStatus}
            filterBankIdStatus={filterBankIdStatus}
            filterFileNoStatus={filterFileNoStatus}
            exportExecutivesToCSV={exportExecutivesToCSV}
            generateEmployeeList={generateEmployeeList}
            generating={generating}
            setIframeUrl={setIframeUrl}
            setIsPreviewOpen={setIsPreviewOpen}
            openBulkModal={openBulkModal}
            openNewExecModal={openNewExecModal}
            currentUser={currentUser}
          />

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <ExecutiveAdvancedFilters
              filterDesignation={filterDesignation}
              setFilterDesignation={setFilterDesignation}
              filterPhoneStatus={filterPhoneStatus}
              setFilterPhoneStatus={setFilterPhoneStatus}
              filterBankIdStatus={filterBankIdStatus}
              setFilterBankIdStatus={setFilterBankIdStatus}
              filterFileNoStatus={filterFileNoStatus}
              setFilterFileNoStatus={setFilterFileNoStatus}
            />
          )}

          {/* Executives Grid */}
          <ExecutiveCardGrid
            filteredExecutives={filteredExecutives}
            currentUser={currentUser}
            setProfileExec={setProfileExec}
            startEditExec={startEditExec}
            deleteExec={deleteExec}
          />
        </div>
      )}

      {/* EXECUTIVE MODAL */}
      <ExecutiveFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingExec={editingExec}
        form={form}
        setForm={setForm}
        errorMessage={errorMessage}
        handleSubmit={handleSubmit}
      />

      {/* BULK EXECUTIVE IMPORT MODAL */}
      <ExecutiveBulkModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        bulkText={bulkText}
        setBulkText={setBulkText}
        bulkError={bulkError}
        bulkImporting={bulkImporting}
        isImageImportLoading={isImageImportLoading}
        handleBulkSubmit={handleBulkSubmit}
        handleTextareaPaste={handleTextareaPaste}
      />

      {/* EXECUTIVE DETAILS PROFILE MODAL */}
      <ExecutiveProfileModal
        profileExec={profileExec}
        onClose={() => setProfileExec(null)}
        currentUser={currentUser}
        startEditExec={startEditExec}
      />

      {/* Premium In-Page Print Preview Modal */}
      <ExecutivePrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        iframeUrl={iframeUrl}
      />

      {/* Hidden Iframe for silent printing */}
      <iframe 
        id="silent-print-iframe" 
        className="hidden" 
        style={{ width: '0px', height: '0px', border: '0px' }}
      />

      {/* Confirm Delete Executive Dialog */}
      <ConfirmDialog
        isOpen={!!execToDelete}
        title="নির্বাহী কর্মকর্তা মুছে ফেলার নিশ্চিতকরণ"
        description={`আপনি কি নিশ্চিতভাবে "${execToDelete?.name}" (${execToDelete?.designation})-কে মুছে ফেলতে চান?`}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        variant="danger"
        onConfirm={confirmDeleteExec}
        onCancel={() => setExecToDelete(null)}
      />
    </div>
  );
}
