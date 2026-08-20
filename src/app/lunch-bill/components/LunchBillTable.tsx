'use client';

import React from 'react';
import { Lock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { Cell, LunchRecord } from '../types';
import LunchBillExecutiveTable from './LunchBillExecutiveTable';

interface LunchBillTableProps {
  cells: Cell[];
  records: LunchRecord[];
  workingDays: number;
  handleAbsenceChange: (empId: number, isExec: boolean, valStr: string) => void;
  handleManualDeductionChange: (empId: number, isExec: boolean, valStr: string) => void;
  collapsedCells: Record<string, boolean>;
  setCollapsedCells: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  filterCell: string;
  filterType: string;
  isAdmin: boolean;
  executivesList: Array<{ id: number; phone?: string | null }>;
}

export default function LunchBillTable({
  cells,
  records,
  workingDays,
  handleAbsenceChange,
  handleManualDeductionChange,
  collapsedCells,
  setCollapsedCells,
  filterCell,
  filterType,
  isAdmin,
  executivesList
}: LunchBillTableProps) {
  const toggleCellCollapse = (cellKey: string) => {
    setCollapsedCells(prev => ({
      ...prev,
      [cellKey]: !prev[cellKey]
    }));
  };

  const execRecords = records.filter(r => r.isExecutive);
  const officerRecords = records.filter(r => !r.isExecutive);

  const totalBillAll = records.reduce((sum, r) => sum + r.totalBill, 0);
  const totalStampAll = records.reduce((sum, r) => sum + r.stampDeduction, 0);
  const totalAdditionalAll = records.reduce((sum, r) => sum + (r.additionalDeduction || 0), 0);
  const grandTotalNetAll = records.reduce((sum, r) => sum + r.netPayable, 0);

  return (
    <div className="space-y-6">
      {/* 1. Executives Table (if visible by filters) */}
      {(filterType === 'ALL' || filterType === 'executive') && (filterCell === 'ALL' || filterCell === '0') && (
        <LunchBillExecutiveTable
          records={records as any}
          executives={executivesList}
          workingDays={workingDays}
          onAbsenceChange={handleAbsenceChange}
          onManualDeductionChange={handleManualDeductionChange}
        />
      )}

      {/* 2. Cell-wise Officers Tables */}
      {(filterType === 'ALL' || filterType === 'officer') && cells.map(cell => {
        if (filterCell !== 'ALL' && filterCell !== cell.id.toString()) return null;
        
        const cellRecs = officerRecords.filter(r => r.cellId === cell.id);
        if (cellRecs.length === 0) return null;

        const isCollapsed = !!collapsedCells[cell.id.toString()];
        const cellClaim = cellRecs.reduce((sum, r) => sum + r.totalBill, 0);
        const cellStamp = cellRecs.reduce((sum, r) => sum + r.stampDeduction, 0);
        const cellExtra = cellRecs.reduce((sum, r) => sum + (r.additionalDeduction || 0), 0);
        const cellGrand = cellRecs.reduce((sum, r) => sum + r.netPayable, 0);

        return (
          <div key={cell.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div
              onClick={() => toggleCellCollapse(cell.id.toString())}
              className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{cell.name}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">মোট কর্মকর্তা: {toBanglaDigits(cellRecs.length)} জন</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    মোট প্রদেয়: ৳{toBanglaDigits(cellGrand.toLocaleString('en-US'))}
                  </span>
                </div>
                <button type="button" className="text-slate-400">
                  {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
              </div>
            </div>

            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 font-bold">
                      <th className="py-3 px-3 text-center w-12">ক্র/নং</th>
                      <th className="py-3 px-3 min-w-[160px]">কর্মকর্তার নাম ও পদবি</th>
                      <th className="py-3 px-3 text-center min-w-[100px]">ব্যাংক আইডি</th>
                      <th className="py-3 px-3 text-center w-24">অনুপস্থিতি (দিন)</th>
                      <th className="py-3 px-3 text-center w-20">উপস্থিতি</th>
                      <th className="py-3 px-3 text-right w-24">মোট বিল (৳)</th>
                      <th className="py-3 px-3 text-right w-20">স্ট্যাম্প (৳)</th>
                      <th className="py-3 px-3 text-right w-28">অন্যান্য কর্তন (৳)</th>
                      <th className="py-3 px-3 text-right w-28">প্রদেয় বিল (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cellRecs.map((rec, idx) => (
                      <tr key={rec.employeeId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                          {toBanglaDigits(idx + 1)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{rec.employeeName}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{rec.designation}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-600 dark:text-slate-400">
                          {rec.bankId ? toBanglaDigits(rec.bankId) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={workingDays}
                            value={rec.absenceDays}
                            onChange={e => handleAbsenceChange(rec.employeeId, false, e.target.value)}
                            className="w-14 text-center font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800 dark:text-slate-100"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {toBanglaDigits(rec.presentDays)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                          {toBanglaDigits(rec.totalBill.toLocaleString('en-US'))}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400 font-medium">
                          {toBanglaDigits(rec.stampDeduction)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={rec.additionalDeduction || 0}
                            onChange={e => handleManualDeductionChange(rec.employeeId, false, e.target.value)}
                            className="w-20 text-right font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white text-rose-600 dark:text-rose-400"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-indigo-600 dark:text-indigo-400">
                          ৳{toBanglaDigits(rec.netPayable.toLocaleString('en-US'))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700">
                      <td colSpan={5} className="py-2.5 px-3 text-right">
                        {cell.name} এর মোট:
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {toBanglaDigits(cellClaim.toLocaleString('en-US'))}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-600">
                        {toBanglaDigits(cellStamp)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-600">
                        {toBanglaDigits(cellExtra.toLocaleString('en-US'))}
                      </td>
                      <td className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400">
                        ৳{toBanglaDigits(cellGrand.toLocaleString('en-US'))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* 3. Grand Total Summary Card */}
      <div className="p-4 lg:p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            সর্বমোট প্রদেয় বিলের বিবরণী
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            মোট কর্মকর্তা: {toBanglaDigits(records.length)} জন | স্ট্যাম্প কর্তন: ৳{toBanglaDigits(totalStampAll)} | অন্যান্য কর্তন: ৳{toBanglaDigits(totalAdditionalAll)}
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">সর্বমোট নিট প্রদেয়</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            ৳{toBanglaDigits(grandTotalNetAll.toLocaleString('en-US'))}
          </div>
        </div>
      </div>
    </div>
  );
}
