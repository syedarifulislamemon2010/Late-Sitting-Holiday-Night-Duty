'use client';

import React from 'react';
import { 
  Users, 
  Building2, 
  Briefcase, 
  Hash, 
  CreditCard, 
  Phone, 
  Edit2, 
  Trash2 
} from 'lucide-react';
import InlineEdit from '@/components/InlineEdit';
import logger from '@/lib/logger';
import { EmptyState } from '@/components/ui/EmptyState';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { sortEmployeesBySeniority } from '@/lib/seniority';
import { Cell, Employee, Executive } from '../types';
import { UserProfile } from '@/context/ProfileContext';

interface EmployeeCardsGridProps {
  currentUser: UserProfile | null | undefined;
  isAdminOrAdminCell: boolean;
  cellFilter: string;
  cells: Cell[];
  filteredEmployees: Employee[];
  sortedFilteredExecutives: Executive[];
  allowedCellIds: number[];
  selectedEmps: number[];
  setSelectedEmps: React.Dispatch<React.SetStateAction<number[]>>;
  onProfileClick: (emp: Employee) => void;
  onEditEmp: (emp: Employee) => void;
  onDeleteEmp: (id: number) => void;
  onReload: () => void;
  isEn?: boolean;
}

export default function EmployeeCardsGrid({
  currentUser,
  isAdminOrAdminCell,
  cellFilter,
  cells,
  filteredEmployees,
  sortedFilteredExecutives,
  allowedCellIds,
  selectedEmps,
  setSelectedEmps,
  onProfileClick,
  onEditEmp,
  onDeleteEmp,
  onReload,
  isEn = false
}: EmployeeCardsGridProps) {
  const handleInlineSave = async (id: number, field: string, value: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      if (res.ok) {
        onReload();
      }
    } catch (err) {
      logger.error('Failed to inline update employee field:', err);
    }
  };

  const hasData = filteredEmployees.length > 0 || (isAdminOrAdminCell && cellFilter === 'executives' && sortedFilteredExecutives.length > 0);

  if (!hasData) {
    return (
      <EmptyState
        icon={Users}
        title={cellFilter === 'select' ? 'সেল নির্বাচন করুন' : 'কোনো কর্মকর্তা পাওয়া যায়নি'}
        description={
          cellFilter === 'select' 
            ? 'অনুগ্রহ করে ড্রপডাউন মেনু থেকে কোনো সেল বা অপশন নির্বাচন করুন।' 
            : 'খুঁজে পাওয়া ডাটা খালি। অনুগ্রহ করে অন্য ফিল্টার বা নাম ব্যবহার করুন।'
        }
      />
    );
  }

  return (
    <div className="space-y-10">
      {/* 1. Executive Panel (DGM & AGM) */}
      {isAdminOrAdminCell && cellFilter === 'executives' && sortedFilteredExecutives.length > 0 && (
        <div className="space-y-4 animate-in fade-in">
          {/* Executive Header Badge */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/5 shadow-xs border-l-4 border-l-rose-500">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-center text-rose-600 animate-pulse">
                <Users size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-rose-800 dark:text-rose-300 text-sm tracking-wide">নির্বাহী প্যানেল (ডিজিএম ও এজিএম)</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">অনলাইন ব্যাংকিং ডিপার্টমেন্টের উপ-মহাব্যবস্থাপক ও সহকারী মহাব্যবস্থাপকগণ।</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
              {toBanglaDigits(sortedFilteredExecutives.length)} জন নির্বাহী কর্মকর্তা
            </span>
          </div>

          {/* Executives Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedFilteredExecutives.map((exec) => {
              const dgmIndices = sortedFilteredExecutives
                .filter(e => e.designation.includes('উপ-মহাব্যবস্থাপক') || e.designation.includes('ডিজিএম') || e.designation.toLowerCase().includes('dgm'))
                .map(e => e.id);
              const dgmRank = dgmIndices.indexOf(exec.id) + 1;
              const isDGM = dgmRank > 0;
              
              let accentColor = '#db2777';
              let borderClass = 'border-rose-200/80 dark:border-rose-900/50';
              let bgClass = 'bg-rose-50/10 dark:bg-rose-950/5';
              let textClass = 'text-rose-800 dark:text-rose-200 group-hover:text-rose-900';
              
              if (isDGM) {
                if (dgmRank === 1) {
                  accentColor = '#2563eb';
                  borderClass = 'border-blue-200/80 dark:border-blue-900/50';
                  bgClass = 'bg-blue-50/10 dark:bg-blue-950/5';
                  textClass = 'text-blue-800 dark:text-blue-200 group-hover:text-blue-950';
                } else if (dgmRank === 2) {
                  accentColor = '#d97706';
                  borderClass = 'border-amber-200/80 dark:border-amber-900/50';
                  bgClass = 'bg-amber-50/10 dark:bg-amber-950/5';
                  textClass = 'text-amber-800 dark:text-amber-200 group-hover:text-amber-950';
                } else {
                  accentColor = '#0d9488';
                  borderClass = 'border-teal-200/80 dark:border-teal-900/50';
                  bgClass = 'bg-teal-50/10 dark:bg-teal-950/5';
                  textClass = 'text-teal-800 dark:text-teal-200 group-hover:text-teal-950';
                }
              }
              
              return (
                <div 
                  key={exec.id} 
                  className={`p-5 rounded-2xl h-full flex flex-col justify-between hover:shadow-md transition-all duration-200 group border border-l-[3.5px] ${borderClass} ${bgClass} overflow-hidden`} 
                  style={{ borderLeftColor: accentColor }}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className={`app-card-title truncate ${textClass}`}>{exec.name}</h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                          <Briefcase size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{exec.designation}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-1 min-w-0" title="ব্যাংক আইডি">
                        <Hash size={12} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-400 shrink-0">ব্যাংক আইডি:</span>
                        <strong className="tabular-nums truncate min-w-0">{exec.bankId || '-'}</strong>
                      </div>
                      <div className="flex items-center gap-1 min-w-0" title="ব্যক্তিগত নথি নং">
                        <CreditCard size={12} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-400 shrink-0">ব্যক্তিগত নথি:</span>
                        <strong className="font-mono truncate min-w-0">{exec.fileNo || '-'}</strong>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800/80 flex items-center gap-1 min-w-0">
                      <Phone size={12} className="text-slate-400 shrink-0" />
                      <span className="text-[11px] font-bold text-slate-400 shrink-0">মোবাইল নম্বর:</span>
                      <strong className="font-sans tabular-nums truncate min-w-0">{exec.phone ? toBanglaDigits(exec.phone) : 'প্রদান করা হয়নি'}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Cell Groups */}
      {cells
        .filter(cell => {
          const cellEmps = filteredEmployees.filter(emp => emp.cellId === cell.id);
          return cellEmps.length > 0;
        })
        .map((cell) => {
          const cellEmps = sortEmployeesBySeniority(
            filteredEmployees.filter(emp => emp.cellId === cell.id)
          );
          
          return (
            <div key={cell.id} className="space-y-4">
              {/* Cell Group Header Badge */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs border-l-4 border-l-indigo-600/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h3 className="app-card-title text-slate-800 dark:text-slate-100 tracking-wide">{cell.name}</h3>
                    {cell.description && (
                      <p className="app-metadata-text text-slate-400 dark:text-slate-500 font-bold mt-0.5">{cell.description}</p>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold font-sans bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 shadow-xs">
                  {toBanglaDigits(cellEmps.length)} জন কর্মকর্তা
                </span>
              </div>

              {/* Employees Grid in this Cell */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cellEmps.map((emp) => {
                  const firstSpoId = cellEmps.find(e => e.designation === 'সিনিয়র প্রিন্সিপাল অফিসার (এসপিও)')?.id || null;
                  const isCellIncharge = emp.dutyType === 'INCHARGE' || emp.id === firstSpoId;
                  const canUserEdit = currentUser?.role === 'ADMIN' || allowedCellIds.includes(emp.cellId);
                  const isSelf = !!(emp.bankId && currentUser?.username && emp.bankId.trim() === currentUser.username.trim());
                  const canInlineEdit = currentUser?.role === 'ADMIN' || isSelf;
                  const isSelected = selectedEmps.includes(emp.id);
                  
                  return (
                    <div 
                      key={emp.id} 
                      className={`p-5 rounded-2xl h-full flex flex-col justify-between hover:shadow-md transition-all duration-200 group border overflow-hidden ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/40 bg-indigo-50/25 dark:bg-indigo-950/20'
                          : isCellIncharge
                            ? 'border-teal-200 dark:border-teal-900/60 bg-teal-50/15 dark:bg-teal-950/10'
                            : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
                      } border-l-[3.5px] ${isCellIncharge ? 'border-l-teal-600 dark:border-l-teal-400' : 'border-l-indigo-600/80'}`}
                    >
                      <div className="space-y-3.5 cursor-pointer min-w-0" onClick={() => onProfileClick(emp)}>
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {canUserEdit && (
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (e.target.checked) {
                                    setSelectedEmps(prev => [...prev, emp.id]);
                                  } else {
                                    setSelectedEmps(prev => prev.filter(id => id !== emp.id));
                                  }
                                }}
                                className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0 mt-1 select-none accent-indigo-600"
                              />
                            )}
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className={`app-card-title truncate ${isCellIncharge ? 'text-teal-800 dark:text-teal-300' : 'text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors'}`}>
                                  {isEn && emp.nameEn ? emp.nameEn : emp.name}
                                </h3>
                                {emp.dutyType === 'INCHARGE' ? (
                                  <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800 text-[9px] font-extrabold rounded-md shrink-0">
                                    {isEn ? 'Cell Incharge' : 'সেল ইনচার্জ'}
                                  </span>
                                ) : emp.dutyType === 'ADDITIONAL' ? (
                                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[9px] font-extrabold rounded-md shrink-0">
                                    {isEn ? 'Additional Duty' : 'অতিরিক্ত দায়িত্ব'}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[9px] font-extrabold rounded-md shrink-0">
                                    {isEn ? 'Primary Duty' : 'মূল দায়িত্ব'}
                                  </span>
                                )}
                              </div>

                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 min-h-[26px] min-w-0 overflow-hidden">
                                <Briefcase size={12} className="text-slate-400 shrink-0" />
                                <div className="min-w-0 flex-1 truncate">
                                  <InlineEdit
                                    value={isEn && emp.designationEn ? emp.designationEn : emp.designation}
                                    placeholder={isEn ? "Enter designation" : "পদবী লিখুন"}
                                    onSave={(val) => handleInlineSave(emp.id, isEn ? 'designationEn' : 'designation', val)}
                                    canEdit={canInlineEdit}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1 min-w-0" title="ব্যাংক আইডি">
                              <Hash size={12} className="text-slate-400 shrink-0" />
                              <span className="text-[11px] font-bold text-slate-400 shrink-0">ব্যাংক আইডি:</span>
                              <div className="min-w-0 flex-1 truncate">
                                <InlineEdit
                                  value={emp.bankId || ''}
                                  placeholder="আইডি দিন"
                                  onSave={(val) => handleInlineSave(emp.id, 'bankId', val)}
                                  canEdit={canInlineEdit}
                                  className="font-bold tabular-nums"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-1 min-w-0" title="ব্যক্তিগত নথি নং">
                              <CreditCard size={12} className="text-slate-400 shrink-0" />
                              <span className="text-[11px] font-bold text-slate-400 shrink-0">নথি নং:</span>
                              <div className="min-w-0 flex-1 truncate">
                                <InlineEdit
                                  value={emp.fileNo || ''}
                                  placeholder="নথি দিন"
                                  onSave={(val) => handleInlineSave(emp.id, 'fileNo', val)}
                                  canEdit={canInlineEdit}
                                  className="font-mono font-bold"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 min-w-0 pt-1 border-t border-dashed border-slate-100 dark:border-slate-800/60 overflow-hidden" title="মোবাইল নম্বর">
                            <Phone size={12} className="text-slate-400 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-400 shrink-0">মোবাইল নম্বর:</span>
                            <div className="min-w-0 flex-1 truncate">
                              <InlineEdit
                                value={emp.mobile || ''}
                                placeholder="মোবাইল নম্বর যোগ করুন"
                                onSave={(val) => handleInlineSave(emp.id, 'mobile', val)}
                                canEdit={canInlineEdit}
                                className="font-sans font-bold tabular-nums truncate"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {(currentUser?.role === 'ADMIN' || allowedCellIds.includes(emp.cellId) || (emp.bankId && currentUser?.username && emp.bankId.trim() === currentUser.username.trim())) && (
                        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 font-sans">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditEmp(emp);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                            title="সম্পাদনা"
                          >
                            <Edit2 size={13} />
                          </button>
                          {(currentUser?.role === 'ADMIN' || allowedCellIds.includes(emp.cellId)) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEmp(emp.id);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}
