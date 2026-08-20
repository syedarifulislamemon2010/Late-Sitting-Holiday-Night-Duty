'use client';
import React, { useState, useEffect } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { TableSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import { toBanglaDigits, getBanglaNumberWords } from '@/lib/bengali-converter';

import { useBillingData } from './hooks/useBillingData';
import { useBillGeneration } from './hooks/useBillGeneration';
import { OfficeOrder, getPrintCategoryRates, getNormalizedRef } from './types';

import BillingHeader from './components/BillingHeader';
import BillingFilters from './components/BillingFilters';
import LedgerTab from './components/LedgerTab';
import OrdersTab from './components/OrdersTab';
import ReportsTab from './components/ReportsTab';
import BillMemoEditorPrintView from './components/BillMemoEditorPrintView';
import BillPrintLayout from './components/BillPrintLayout';
import BulkBillPrintLayout from './components/BulkBillPrintLayout';
import PrintableReportLayout from './components/PrintableReportLayout';
import PrintableLedgerLayout from './components/PrintableLedgerLayout';

export default function BillingPage() {
  const { currentUser } = useProfile();
  const [activeTab, setActiveTab] = useState<'ledger' | 'orders' | 'reports'>('ledger');
  const [viewingOrder, setViewingOrder] = useState<OfficeOrder | null>(null);
  const [viewingOrders, setViewingOrders] = useState<OfficeOrder[] | null>(null);
  const [isReportPrintMode, setIsReportPrintMode] = useState(false);
  const [isLedgerPrintMode, setIsLedgerPrintMode] = useState(false);

  const billing = useBillingData(currentUser);
  const billGen = useBillGeneration({ billing });

  useEffect(() => {
    if (isReportPrintMode) {
      const timer = setTimeout(() => {
        window.print();
        setIsReportPrintMode(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isReportPrintMode]);

  const { transportRate, apyaonRate } = getPrintCategoryRates(billing.printCategory);

  if (isReportPrintMode) {
    return <PrintableReportLayout 
      reportData={billing.reportData} 
      reportDate={billing.reportDate} 
      setIsReportPrintMode={setIsReportPrintMode} 
    />;
  }

  if (isLedgerPrintMode) {
    return <PrintableLedgerLayout 
      selectedMonth={billing.selectedMonth} 
      ledgerActiveOfficeOrders={billing.ledgerActiveOfficeOrders} 
      ledgerGrandTotal={billing.ledgerGrandTotal} 
      setIsLedgerPrintMode={setIsLedgerPrintMode} 
    />;
  }

  if (billing.loading) return (
    <div className="p-6 space-y-6">
      <CardSkeleton count={4} />
      <TableSkeleton rows={5} columns={6} />
    </div>
  );

  return (
    <div className="space-y-6">
      <BillingHeader
        showUrlBanner={billGen.showUrlBanner}
        setShowUrlBanner={billGen.setShowUrlBanner}
        msgBanner={billGen.msgBanner}
        setMsgBanner={billGen.setMsgBanner}
        pendingBillingCount={billing.pendingBillingOfficeOrders.length}
        onPrintButtonClick={billGen.handlePrintButtonClick}
      />

      {!billGen.isPrintMode ? (
        <>
          <BillingFilters
            currentUser={currentUser}
            cells={billing.cells}
            selectedCell={billing.selectedCell}
            setSelectedCell={billing.setSelectedCell}
            selectedCategory={billing.selectedCategory}
            handleCategoryChange={billing.handleCategoryChange}
            selectedMonth={billing.selectedMonth}
            setSelectedMonth={billing.setSelectedMonth}
          />

          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 mt-4">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 relative cursor-pointer ${
                activeTab === 'ledger'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              বিলিং খতিয়ান (Billing Ledger)
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 relative cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              অপেক্ষমান বিল জেনারেট করুন
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'orders'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
              }`}>
                {toBanglaDigits(billing.pendingBillingOfficeOrders.length)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 relative cursor-pointer ${
                activeTab === 'reports'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              রিপোর্ট ও বিশ্লেষণ (Reports)
            </button>
          </div>

          {activeTab === 'ledger' && (
            <LedgerTab
              loading={billing.loading}
              showOrderWarning={billing.showOrderWarning}
              metrics={billing.metrics}
              allActiveOfficeOrders={billing.ledgerActiveOfficeOrders}
              findAssociatedBill={billing.findAssociatedBill}
              handleLoadBillForEditing={billGen.handleLoadBillForEditing}
              handleGenerateBillFromOrder={billGen.handleGenerateBillFromOrder}
              ledgerGrandTotal={billing.ledgerGrandTotal}
              selectedMonth={billing.selectedMonth}
              setIsLedgerPrintMode={setIsLedgerPrintMode}
              setViewingOrder={setViewingOrder}
              handleDeleteOrder={billing.handleDeleteOrder}
              hasDeletePermission={billing.hasDeletePermission}
              employees={billing.employees}
              currentUser={currentUser}
              selectedCell={billing.selectedCell}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersTab
              loading={billing.loading}
              pendingBillingOfficeOrders={billing.pendingBillingOfficeOrders}
              archivedBillNormalizedRefs={billing.archivedBillNormalizedRefs}
              getNormalizedRef={getNormalizedRef}
              archivedOrders={billing.archivedOrders}
              handleLoadBillForEditing={billGen.handleLoadBillForEditing}
              handleGenerateBillFromOrder={billGen.handleGenerateBillFromOrder}
              hasEditPermission={billing.hasEditPermission}
              hasDeletePermission={billing.hasDeletePermission}
              handleDeleteOrder={billing.handleDeleteOrder}
              setViewingOrder={setViewingOrder}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              billGroups={billing.billGroups}
              expandedSlots={billing.expandedSlots}
              toggleSlot={billing.toggleSlot}
              findMatchingOfficeOrder={billing.findMatchingOfficeOrder}
              hasDeletePermission={billing.hasDeletePermission}
              handleDeleteOrder={billing.handleDeleteOrder}
              handleLoadBillForEditing={billGen.handleLoadBillForEditing}
              handleChangeBillGroup={billing.handleChangeBillGroup}
              reportDate={billing.reportDate}
              setReportDate={billing.setReportDate}
              reportData={billing.reportData}
              setIsReportPrintMode={setIsReportPrintMode}
              getBanglaNumberWords={getBanglaNumberWords}
            />
          )}
        </>
      ) : (
        <BillMemoEditorPrintView
          isEditingArchive={billGen.isEditingArchive}
          isBillDirty={billGen.isBillDirty}
          archiving={billGen.archiving}
          billGenerated={billGen.billGenerated}
          handleCancelEditBill={billGen.handleCancelEditBill}
          handleBackToLedger={billGen.handleBackToLedger}
          handleGenerateAndPrint={billGen.handleGenerateAndPrint}
          archiveSuccess={billing.archiveSuccess}
          archiveError={billing.archiveError}
          printCategory={billing.printCategory}
          setPrintCategory={billing.setPrintCategory}
          billDate={billGen.billDate}
          setBillDate={billGen.setBillDate}
          subjectText={billGen.subjectText}
          setSubjectText={billGen.setSubjectText}
          billRef={billGen.billRef}
          setBillRef={billGen.setBillRef}
          pendingOrderRefs={billing.pendingOrderRefs}
          billedOrderRefs={billing.billedOrderRefs}
          selectedOrderRef={billing.selectedOrderRef}
          setSelectedOrderRef={billing.setSelectedOrderRef}
          archivedOrders={billing.archivedOrders}
          representativeName={billGen.representativeName}
          setRepresentativeName={billGen.setRepresentativeName}
          representativeDesignation={billGen.representativeDesignation}
          setRepresentativeDesignation={billGen.setRepresentativeDesignation}
          employees={billing.employees}
          selectedExecutiveId={billGen.selectedExecutiveId}
          setSelectedExecutiveId={billGen.setSelectedExecutiveId}
          executives={billing.executives}
          setSigningOfficer={billGen.setSigningOfficer}
          setSigningDesignation={billGen.setSigningDesignation}
          openingParagraph={billGen.openingParagraph}
          printFilteredSummaries={billing.printFilteredSummaries}
          transportRate={transportRate}
          apyaonRate={apyaonRate}
          formatWorkedDatesForCategory={billing.formatWorkedDatesForCategory}
          totalDaysAll={billing.totalDaysAll}
          totalTransportAll={billing.totalTransportAll}
          totalApyaonAll={billing.totalApyaonAll}
          grandTotalPrintAll={billing.grandTotalPrintAll}
          getBanglaNumberWords={getBanglaNumberWords}
        />
      )}

      {/* View Office Order or Bill Modal */}
      {viewingOrder && (
        <BillPrintLayout
          viewingOrder={viewingOrder}
          onClose={() => setViewingOrder(null)}
          fetchDutiesForBilling={billing.fetchDutiesForBilling}
        />
      )}

      {viewingOrders && (
        <BulkBillPrintLayout
          viewingOrders={viewingOrders}
          onClose={() => setViewingOrders(null)}
          fetchDutiesForBilling={billing.fetchDutiesForBilling}
        />
      )}
    </div>
  );
}
