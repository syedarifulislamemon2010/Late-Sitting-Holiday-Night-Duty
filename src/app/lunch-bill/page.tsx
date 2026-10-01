'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import { Modal } from '@/components/ui/Modal';

import { useLunchBillData } from './hooks/useLunchBillData';
import LunchBillHeader from './components/LunchBillHeader';
import LunchBillFilters from './components/LunchBillFilters';
import LunchBillTable from './components/LunchBillTable';

export default function LunchBillPage() {
  const { currentUser } = useProfile();
  const isAdmin = currentUser?.role === 'ADMIN';

  const data = useLunchBillData(currentUser);

  // Month Picker dropdown state
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [currentPickerYear, setCurrentPickerYear] = useState<number>(() => {
    const today = new Date();
    return today.getFullYear();
  });
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    if (isMonthPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMonthPickerOpen]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterCell, setFilterCell] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [collapsedCells, setCollapsedCells] = useState<Record<string, boolean>>({});

  const handleWorkingDaysChange = (daysStr: string) => {
    const val = parseInt(daysStr, 10) || 0;
    data.handleWorkingDaysUpdate(val);
    data.setIsAutoWorkingDays(false);
  };

  const handleAbsenceChange = (empId: number, isExec: boolean, valStr: string) => {
    const idx = data.records.findIndex(r => r.employeeId === empId && r.isExecutive === isExec);
    if (idx !== -1) {
      const val = parseInt(valStr, 10) || 0;
      data.handleAbsenceDaysChange(idx, val);
    }
  };

  const handleManualDeductionChange = (empId: number, isExec: boolean, valStr: string) => {
    const idx = data.records.findIndex(r => r.employeeId === empId && r.isExecutive === isExec);
    if (idx !== -1) {
      const val = parseInt(valStr, 10) || 0;
      data.handleAdditionalDeductionChange(idx, val);
    }
  };

  const applyFlatRate = (rateVal: number) => {
    data.setFlatDeductionRate(rateVal);
    data.applyBulkDeduction();
  };

  const applyDesignationRates = (field: keyof typeof data.designationRates, val: number) => {
    data.setDesignationRates(prev => ({ ...prev, [field]: val }));
    data.applyBulkDeduction();
  };

  // Filter records: cell officers only, support all user's assigned cells
  const userBaseRecords = data.records.filter(r => {
    if (r.isExecutive) return false;
    if (isAdmin) return true;
    const userCellIds = currentUser?.cells?.map(c => c.id) || [];
    return userCellIds.length === 0 || userCellIds.includes(r.cellId);
  });

  const activeRecords = userBaseRecords.filter(r => {
    const matchesSearch = searchQuery === '' || 
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.bankId || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCell = filterCell === 'ALL' || r.cellId.toString() === filterCell;

    return matchesSearch && matchesCell;
  });

  if (data.loading) {
    return (
      <div className="p-6">
        <TableSkeleton rows={8} columns={6} />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-6 min-h-screen bg-slate-50/50 dark:bg-transparent -m-4 lg:-m-8 p-4 lg:p-8">
        {/* Success / Error Banners */}
        {data.successMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle size={18} className="text-emerald-600" />
              <span className="text-sm font-semibold">{data.successMessage}</span>
            </div>
            <button onClick={() => data.setSuccessMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        )}

        {data.errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-400 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className="text-rose-600" />
              <span className="text-sm font-semibold">{data.errorMessage}</span>
            </div>
            <button onClick={() => data.setErrorMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        )}

        {/* 1. Header & Actions */}
        <LunchBillHeader
          selectedMonth={data.selectedMonth}
          setSelectedMonth={data.setSelectedMonth}
          isMonthPickerOpen={isMonthPickerOpen}
          setIsMonthPickerOpen={setIsMonthPickerOpen}
          currentPickerYear={currentPickerYear}
          setCurrentPickerYear={setCurrentPickerYear}
          monthPickerRef={monthPickerRef}
          workingDays={data.workingDays}
          handleWorkingDaysChange={handleWorkingDaysChange}
          isAutoWorkingDays={data.isAutoWorkingDays}
          setIsAutoWorkingDays={data.setIsAutoWorkingDays}
          workingDaysLoading={data.workingDaysLoading}
          showAdvancedFilters={showAdvancedFilters}
          setShowAdvancedFilters={setShowAdvancedFilters}
          onOpenPreview={() => data.setIsPreviewOpen(true)}
          onSave={data.handleSaveDraft}
          onPrint={data.handlePrintCombinedBill}
          saving={data.saving}
          generating={data.generating}
          onSyncLeaves={data.handleSyncLeaves}
          syncingLeaves={data.syncingLeaves}
        />

        {/* 2. Filters & Deduction Settings */}
        <LunchBillFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterCell={filterCell}
          setFilterCell={setFilterCell}
          filterType={filterType}
          setFilterType={setFilterType}
          cells={data.cells}
          showAdvancedFilters={showAdvancedFilters}
          deductionMode={data.deductionMode}
          setDeductionMode={data.setDeductionMode}
          flatDeductionRate={data.flatDeductionRate}
          applyFlatRate={applyFlatRate}
          designationRates={data.designationRates}
          applyDesignationRates={applyDesignationRates}
          isAdmin={isAdmin}
        />

        {/* 3. Table of Officers & Executives */}
        <LunchBillTable
          cells={data.cells}
          records={activeRecords}
          workingDays={data.workingDays}
          handleAbsenceChange={handleAbsenceChange}
          handleManualDeductionChange={handleManualDeductionChange}
          collapsedCells={collapsedCells}
          setCollapsedCells={setCollapsedCells}
          filterCell={filterCell}
          filterType={filterType}
          isAdmin={isAdmin}
          executivesList={data.executives}
        />

        {/* Error / Warning Alert Modal */}
        <Modal
          isOpen={data.alertModal.isOpen}
          onClose={data.closeAlertModal}
          title={
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
              <AlertTriangle size={20} />
              <span>{data.alertModal.title}</span>
            </div>
          }
          footer={
            <button
              type="button"
              onClick={data.closeAlertModal}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              ঠিক আছে
            </button>
          }
        >
          <div className="py-2 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
            {data.alertModal.message}
          </div>
        </Modal>
      </div>
    </AuthGuard>
  );
}
