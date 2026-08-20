'use client';

import React from 'react';
import { useProfile } from '@/context/ProfileContext';
import { useLanguage } from '@/context/LanguageContext';
import { TableSkeleton, CardSkeleton } from '@/components/ui/Skeleton';

import EmployeeControls from './components/EmployeeControls';
import EmployeeAdvancedFilters from './components/EmployeeAdvancedFilters';
import EmployeeCardsGrid from './components/EmployeeCardsGrid';
import CellsTab from './components/CellsTab';
import EmployeeFormModal from './components/EmployeeFormModal';
import EmployeeProfileModal from './components/EmployeeProfileModal';
import CellFormModal from './components/CellFormModal';
import BulkEmployeeImportModal from './components/BulkEmployeeImportModal';
import BulkCellImportModal from './components/BulkCellImportModal';
import EmployeeDirectoryPreviewModal from './components/EmployeeDirectoryPreviewModal';
import BulkActionToolbar from './components/BulkActionToolbar';

import { useEmployeePageData, STRICT_DESIGNATIONS } from './hooks/useEmployeePageData';

export default function EmployeesPage() {
  const { currentUser } = useProfile();
  const { lang } = useLanguage();
  const isEn = lang === 'en';

  const {
    activeTab,
    setActiveTab,
    cells,
    loading,
    searchQuery,
    setSearchQuery,
    cellFilter,
    setCellFilter,
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
    isBulkCellModalOpen,
    setIsBulkCellModalOpen,
    bulkCellText,
    setBulkCellText,
    bulkCellError,
    bulkCellImporting,
    generating,
    isPreviewOpen,
    setIsPreviewOpen,
    iframeUrl,
    isEmpModalOpen,
    setIsEmpModalOpen,
    isCellModalOpen,
    setIsCellModalOpen,
    editingEmp,
    setEditingEmp,
    editingCell,
    setEditingCell,
    profileEmp,
    setProfileEmp,
    selectedEmps,
    setSelectedEmps,
    empForm,
    setEmpForm,
    cellForm,
    setCellForm,
    errorMessage,
    setErrorMessage,
    isBulkEmpModalOpen,
    setIsBulkEmpModalOpen,
    bulkEmpText,
    setBulkEmpText,
    bulkEmpCellId,
    setBulkEmpCellId,
    bulkImporting,
    bulkError,
    isImageImportLoading,
    isAdminOrAdminCell,
    allowedCellIds,
    selectableCells,
    formSelectableCells,
    filteredEmployees,
    sortedFilteredExecutives,
    loadData,
    handleDirectPrint,
    handlePrintPreview,
    handleEmpSubmit,
    handleCellSubmit,
    deleteEmployee,
    deleteCell,
    handleBulkEmpSubmit,
    handleBulkCellSubmit,
    handleTextareaPaste,
    startEditEmp,
    startEditCell,
    exportEmployeesToCSV,
    exportCellsToCSV,
    handleBulkDelete
  } = useEmployeePageData(currentUser);

  const isSelfEditingOnly = !!(
    currentUser?.role !== 'ADMIN' &&
    editingEmp?.bankId &&
    currentUser?.username &&
    editingEmp.bankId.trim() === currentUser.username.trim() &&
    !allowedCellIds.includes(editingEmp.cellId)
  );

  const canCreateEmployee = (currentUser?.role === 'ADMIN' || allowedCellIds.length > 0) && selectableCells.length > 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <CardSkeleton count={3} />
        <TableSkeleton rows={6} columns={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header & Controls */}
      <EmployeeControls
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminOrAdminCell={isAdminOrAdminCell}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cellFilter={cellFilter}
        setCellFilter={setCellFilter}
        cells={cells}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        filterDesignation={filterDesignation}
        filterPhoneStatus={filterPhoneStatus}
        filterBankIdStatus={filterBankIdStatus}
        filterFileNoStatus={filterFileNoStatus}
        generating={generating}
        exportEmployeesToCSV={exportEmployeesToCSV}
        handlePrintPreview={handlePrintPreview}
        handleDirectPrint={handleDirectPrint}
        onOpenBulkEmpModal={() => {
          setBulkEmpText('');
          setIsBulkEmpModalOpen(true);
        }}
        onOpenNewEmpModal={() => {
          setEditingEmp(null);
          setEmpForm({
            name: '',
            nameEn: '',
            designation: STRICT_DESIGNATIONS[0],
            designationEn: '',
            bankId: '',
            fileNo: '',
            mobile: '',
            cellId: formSelectableCells[0]?.id.toString() || ''
          });
          setErrorMessage('');
          setIsEmpModalOpen(true);
        }}
        canCreateEmployee={canCreateEmployee}
      />

      {/* 2. Advanced Filters */}
      {activeTab === 'employees' && (
        <EmployeeAdvancedFilters
          show={showAdvancedFilters}
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

      {/* 3. Tab Contents */}
      {activeTab === 'employees' ? (
        <EmployeeCardsGrid
          currentUser={currentUser}
          isAdminOrAdminCell={isAdminOrAdminCell}
          cellFilter={cellFilter}
          cells={cells}
          filteredEmployees={filteredEmployees}
          sortedFilteredExecutives={sortedFilteredExecutives}
          allowedCellIds={allowedCellIds}
          selectedEmps={selectedEmps}
          setSelectedEmps={setSelectedEmps}
          onProfileClick={(emp) => setProfileEmp(emp)}
          onEditEmp={startEditEmp}
          onDeleteEmp={deleteEmployee}
          onReload={loadData}
          isEn={isEn}
        />
      ) : (
        <CellsTab
          cells={cells}
          currentUser={currentUser}
          exportCellsToCSV={exportCellsToCSV}
          onOpenBulkCellModal={() => {
            setBulkCellText('');
            setIsBulkCellModalOpen(true);
          }}
          onOpenNewCellModal={() => {
            setEditingCell(null);
            setCellForm({ name: '', description: '' });
            setErrorMessage('');
            setIsCellModalOpen(true);
          }}
          onStartEditCell={startEditCell}
          onDeleteCell={deleteCell}
        />
      )}

      {/* 4. Modals */}
      <EmployeeFormModal
        isOpen={isEmpModalOpen}
        editingEmp={editingEmp}
        empForm={empForm}
        setEmpForm={setEmpForm}
        formSelectableCells={formSelectableCells}
        isSelfEditingOnly={isSelfEditingOnly}
        errorMessage={errorMessage}
        onClose={() => setIsEmpModalOpen(false)}
        onSubmit={handleEmpSubmit}
      />

      <EmployeeProfileModal
        employee={profileEmp}
        onClose={() => setProfileEmp(null)}
        onEdit={(emp) => {
          setProfileEmp(null);
          startEditEmp(emp);
        }}
        canEdit={!!(
          currentUser?.role === 'ADMIN' ||
          (profileEmp && allowedCellIds.includes(profileEmp.cellId)) ||
          (profileEmp?.bankId && currentUser?.username && profileEmp.bankId.trim() === currentUser.username.trim())
        )}
      />

      <CellFormModal
        isOpen={isCellModalOpen}
        editingCell={editingCell}
        cellForm={cellForm}
        setCellForm={setCellForm}
        errorMessage={errorMessage}
        onClose={() => setIsCellModalOpen(false)}
        onSubmit={handleCellSubmit}
      />

      <BulkEmployeeImportModal
        isOpen={isBulkEmpModalOpen}
        bulkError={bulkError}
        bulkEmpCellId={bulkEmpCellId}
        setBulkEmpCellId={setBulkEmpCellId}
        bulkEmpText={bulkEmpText}
        setBulkEmpText={setBulkEmpText}
        bulkImporting={bulkImporting}
        isImageImportLoading={isImageImportLoading}
        cells={cells}
        onClose={() => setIsBulkEmpModalOpen(false)}
        onSubmit={handleBulkEmpSubmit}
        onPaste={handleTextareaPaste}
      />

      <BulkCellImportModal
        isOpen={isBulkCellModalOpen}
        bulkCellError={bulkCellError}
        bulkCellText={bulkCellText}
        setBulkCellText={setBulkCellText}
        bulkCellImporting={bulkCellImporting}
        onClose={() => setIsBulkCellModalOpen(false)}
        onSubmit={handleBulkCellSubmit}
      />

      <EmployeeDirectoryPreviewModal
        isOpen={isPreviewOpen}
        iframeUrl={iframeUrl}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* 5. Bulk Action Floating Bar */}
      <BulkActionToolbar
        selectedCount={selectedEmps.length}
        onClearSelection={() => setSelectedEmps([])}
        onBulkDelete={handleBulkDelete}
      />

      {/* Hidden print iframe */}
      <iframe id="silent-print-iframe" className="hidden" title="silent-print" />
    </div>
  );
}
