'use client';

import React from 'react';
import { useProfile } from '@/context/ProfileContext';
import { useDocumentsData } from './hooks/useDocumentsData';
import DocumentsHeader from './components/DocumentsHeader';
import FilesTab from './components/FilesTab';
import ManualDocsTab from './components/ManualDocsTab';
import OrdersTab from './components/OrdersTab';
import BillsTab from './components/BillsTab';
import OfficeOrderPrintModal from './components/OfficeOrderPrintModal';
import RenameDocumentModal from './components/RenameDocumentModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ManualDoc } from './types';

export default function DocumentsPage() {
  const { currentUser } = useProfile();
  
  const {
    activeTab,
    setActiveTab,
    documents,
    officeOrders,
    loading,
    loadingOrders,
    error,
    setError,
    uploading,
    dragActive,
    setDragActive,
    selectedFile,
    setSelectedFile,
    customName,
    setCustomName,
    successMsg,
    setSuccessMsg,
    fileInputRef,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    showFilesFilters,
    setShowFilesFilters,
    filesFilterOrigin,
    setFilesFilterOrigin,
    filesFilterSize,
    setFilesFilterSize,
    manualDocs,
    loadingManualDocs,
    manualDocsSearchQuery,
    setManualDocsSearchQuery,
    showManualFilters,
    setShowManualFilters,
    filterFileType,
    setFilterFileType,
    filterDateRange,
    setFilterDateRange,
    filterSize,
    setFilterSize,
    sortByManual,
    setSortByManual,
    manualSelectedFile,
    setManualSelectedFile,
    manualCustomName,
    setManualCustomName,
    manualUploading,
    manualDragActive,
    setManualDragActive,
    manualIsVisibleToUsers,
    setManualIsVisibleToUsers,
    manualFileInputRef,
    editingManualDoc,
    setEditingManualDoc,
    editDocName,
    setEditDocName,
    orderSearchQuery,
    setOrderSearchQuery,
    showOrdersFilters,
    setShowOrdersFilters,
    ordersFilterCategory,
    setOrdersFilterCategory,
    ordersFilterStatus,
    setOrdersFilterStatus,
    ordersFilterCell,
    setOrdersFilterCell,
    showBillsFilters,
    setShowBillsFilters,
    billsFilterCategory,
    setBillsFilterCategory,
    billsFilterCell,
    setBillsFilterCell,
    viewingOrder,
    setViewingOrder,
    msgBanner,
    setMsgBanner,
    hasDeletePermission,
    hasEditPermission,
    handleManualUploadSubmit,
    handleDeleteManualDoc,
    handleRenameManualDoc,
    handleToggleVisibility,
    handleDeleteDoc,
    handleUploadSubmit,
    handleDeleteOrder,
    deleteConfirm,
    setDeleteConfirm
  } = useDocumentsData(currentUser);

  const filesCount = documents.length;
  const manualDocsCount = manualDocs.length;
  const officeOrdersCount = officeOrders.filter(
    (o) => !o.category?.startsWith('BILL_') && o.status !== 'Deleted'
  ).length;
  const billsCount = officeOrders.filter(
    (o) => o.category?.startsWith('BILL_') && o.status !== 'Deleted'
  ).length;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & Tab Navigation */}
      <DocumentsHeader
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filesCount={filesCount}
        manualDocsCount={manualDocsCount}
        officeOrdersCount={officeOrdersCount}
        billsCount={billsCount}
        msgBanner={msgBanner}
        setMsgBanner={setMsgBanner}
        successMsg={successMsg}
        setSuccessMsg={setSuccessMsg}
        error={error}
        setError={setError}
      />

      {/* Tab 1: Generated PDF Drive */}
      {activeTab === 'files' && (
        <FilesTab
          currentUser={currentUser}
          documents={documents}
          loading={loading}
          error={error}
          successMsg={successMsg}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          customName={customName}
          setCustomName={setCustomName}
          uploading={uploading}
          dragActive={dragActive}
          setDragActive={setDragActive}
          fileInputRef={fileInputRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          showFilesFilters={showFilesFilters}
          setShowFilesFilters={setShowFilesFilters}
          filesFilterOrigin={filesFilterOrigin}
          setFilesFilterOrigin={setFilesFilterOrigin}
          filesFilterSize={filesFilterSize}
          setFilesFilterSize={setFilesFilterSize}
          onUploadSubmit={handleUploadSubmit}
          onDeleteDoc={handleDeleteDoc}
        />
      )}

      {/* Tab 2: Manual Documents Drive */}
      {activeTab === 'manual-docs' && (
        <ManualDocsTab
          currentUser={currentUser}
          manualDocs={manualDocs}
          loadingManualDocs={loadingManualDocs}
          error={error}
          successMsg={successMsg}
          manualSelectedFile={manualSelectedFile}
          setManualSelectedFile={setManualSelectedFile}
          manualCustomName={manualCustomName}
          setManualCustomName={setManualCustomName}
          manualUploading={manualUploading}
          manualDragActive={manualDragActive}
          setManualDragActive={setManualDragActive}
          manualIsVisibleToUsers={manualIsVisibleToUsers}
          setManualIsVisibleToUsers={setManualIsVisibleToUsers}
          manualFileInputRef={manualFileInputRef}
          manualDocsSearchQuery={manualDocsSearchQuery}
          setManualDocsSearchQuery={setManualDocsSearchQuery}
          showManualFilters={showManualFilters}
          setShowManualFilters={setShowManualFilters}
          filterFileType={filterFileType}
          setFilterFileType={setFilterFileType}
          filterDateRange={filterDateRange}
          setFilterDateRange={setFilterDateRange}
          filterSize={filterSize}
          setFilterSize={setFilterSize}
          sortByManual={sortByManual}
          setSortByManual={setSortByManual}
          onManualUploadSubmit={handleManualUploadSubmit}
          onDeleteManualDoc={handleDeleteManualDoc}
          onOpenRenameModal={(doc: ManualDoc) => {
            setEditingManualDoc(doc);
            setEditDocName(doc.name);
          }}
          onToggleVisibility={handleToggleVisibility}
        />
      )}

      {/* Tab 3: Office Orders Archive */}
      {activeTab === 'orders' && (
        <OrdersTab
          currentUser={currentUser}
          officeOrders={officeOrders}
          loadingOrders={loadingOrders}
          orderSearchQuery={orderSearchQuery}
          setOrderSearchQuery={setOrderSearchQuery}
          showOrdersFilters={showOrdersFilters}
          setShowOrdersFilters={setShowOrdersFilters}
          ordersFilterCategory={ordersFilterCategory}
          setOrdersFilterCategory={setOrdersFilterCategory}
          ordersFilterStatus={ordersFilterStatus}
          setOrdersFilterStatus={setOrdersFilterStatus}
          ordersFilterCell={ordersFilterCell}
          setOrdersFilterCell={setOrdersFilterCell}
          onViewOrder={(order) => setViewingOrder(order)}
          onDeleteOrder={handleDeleteOrder}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
        />
      )}

      {/* Tab 4: Bill Memos Archive */}
      {activeTab === 'bills' && (
        <BillsTab
          currentUser={currentUser}
          officeOrders={officeOrders}
          loadingOrders={loadingOrders}
          orderSearchQuery={orderSearchQuery}
          setOrderSearchQuery={setOrderSearchQuery}
          showBillsFilters={showBillsFilters}
          setShowBillsFilters={setShowBillsFilters}
          billsFilterCategory={billsFilterCategory}
          setBillsFilterCategory={setBillsFilterCategory}
          billsFilterCell={billsFilterCell}
          setBillsFilterCell={setBillsFilterCell}
          onViewOrder={(order) => setViewingOrder(order)}
          onDeleteOrder={handleDeleteOrder}
          hasEditPermission={hasEditPermission}
          hasDeletePermission={hasDeletePermission}
        />
      )}

      {/* Printable Preview Modal for Office Order or Bill Memo */}
      <OfficeOrderPrintModal
        viewingOrder={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />

      {/* Rename Manual Document Dialog */}
      <RenameDocumentModal
        editingManualDoc={editingManualDoc}
        editDocName={editDocName}
        setEditDocName={setEditDocName}
        onClose={() => {
          setEditingManualDoc(null);
          setEditDocName('');
        }}
        onSubmit={handleRenameManualDoc}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm?.isOpen}
        title={deleteConfirm?.title || 'মুছে ফেলার নিশ্চিতকরণ'}
        description={deleteConfirm?.description || ''}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        variant="danger"
        onConfirm={async () => {
          if (deleteConfirm?.onConfirm) {
            await deleteConfirm.onConfirm();
          }
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
