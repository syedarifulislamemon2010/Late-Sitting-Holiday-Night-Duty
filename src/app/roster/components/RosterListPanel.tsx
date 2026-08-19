'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  Eye, 
  FileSignature, 
  MoreVertical, 
  Receipt, 
  Trash2 
} from 'lucide-react';
import { 
  Cell, 
  Employee, 
  Duty, 
  OfficeOrder, 
  OrderDuty, 
  User, 
  getBanglaMonthYearLabel 
} from '../types';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface RosterListPanelProps {
  currentUser: User | null;
  cells: Cell[];
  employees: Employee[];
  duties: Duty[];
  officeOrders: OfficeOrder[];
  selectedCell: string;
  changeSelectedCell: (cell: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedEmployee: string;
  setSelectedEmployee: (emp: string) => void;
  selectedMonths: string[];
  changeSelectedMonths: (months: string[] | ((prev: string[]) => string[])) => void;
  isAssignmentPrimary: boolean;
  onFocusPanel: () => void;
  selectedDutyIds: number[];
  setSelectedDutyIds: React.Dispatch<React.SetStateAction<number[]>>;
  handleBulkDeleteDuties: () => void;
  handleStartEdit: (duties: Duty[]) => void;
  deleteGroupedDuties: (duties: Duty[]) => void;
  handlePreviewOfficeOrder: (order: OfficeOrder) => void;
  handleDeleteOfficeOrder: (id: number, ref: string) => void;
}

export default function RosterListPanel({
  currentUser,
  cells,
  employees,
  duties,
  officeOrders,
  selectedCell,
  changeSelectedCell,
  selectedCategory,
  setSelectedCategory,
  selectedEmployee,
  setSelectedEmployee,
  selectedMonths,
  changeSelectedMonths,
  isAssignmentPrimary,
  onFocusPanel,
  selectedDutyIds,
  setSelectedDutyIds,
  handleBulkDeleteDuties,
  handleStartEdit,
  deleteGroupedDuties,
  handlePreviewOfficeOrder,
  handleDeleteOfficeOrder
}: RosterListPanelProps) {
  const [activeRosterTab, setActiveRosterTab] = useState<'pending' | 'archived'>('pending');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [currentPickerYear, setCurrentPickerYear] = useState(() => new Date().getFullYear());
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const [openActionOrderId, setOpenActionOrderId] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setOpenActionOrderId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const getDutyBadgeStyles = (type: string) => {
    switch (type) {
      case 'HOLIDAY':
        return 'bg-red-50 text-red-655 border-red-100 dark:bg-red-955/20 dark:text-red-400 dark:border-red-900/30';
      case 'NIGHT_SHIFT':
        return 'bg-slate-900 text-white border-slate-950 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 font-extrabold';
      case 'LATE_SITTING':
      default:
        return 'bg-blue-50 text-blue-655 border-blue-100 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30';
    }
  };

  const getBanglaDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const monthNamesBN = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    return `${toBanglaDigits(parseInt(d, 10).toString())}ই ${monthNamesBN[parseInt(m, 10) - 1]} ${toBanglaDigits(y)}`;
  };

  const pendingDuties = useMemo(() => {
    return duties
      .filter(d => !d.orderRef)
      .filter(d => selectedCategory === 'all' || d.type === selectedCategory)
      .filter(d => selectedCell === 'all' || d.employee.cellId.toString() === selectedCell)
      .filter(d => selectedEmployee === 'all' || d.employee.id.toString() === selectedEmployee);
  }, [duties, selectedCategory, selectedCell, selectedEmployee]);

  const activeCellObj = useMemo(() => {
    return cells.find(c => c.id.toString() === selectedCell);
  }, [cells, selectedCell]);
  
  const activeCellName = activeCellObj ? activeCellObj.name : null;

  const filteredOfficeOrders = useMemo(() => {
    return officeOrders
      .filter(o => o.status !== 'Deleted' && !o.category?.startsWith('BILL_'))
      .filter(o => {
        const cellMatches = selectedCell === 'all' || o.cellName === activeCellName || o.cellName === 'All Cells' || o.cellName === 'সকল সেল';
        const categoryMatches = selectedCategory === 'all' || o.category === selectedCategory;
        return cellMatches && categoryMatches;
      })
      .sort((a, b) => b.id - a.id);
  }, [officeOrders, selectedCell, activeCellName, selectedCategory]);

  const renderOfficeOrdersList = (ordersList: OfficeOrder[]) => {
    return (
      <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
              <th className="p-2.5 text-[10px] uppercase font-bold tracking-wider text-center w-10">ক্রমিক</th>
              <th className="p-2.5 text-[10px] uppercase font-bold tracking-wider max-w-[160px]">স্মারক সূত্র নং</th>
              <th className="p-2.5 text-[10px] uppercase font-bold tracking-wider">তারিখ</th>
              <th className={`p-2.5 text-[10px] uppercase font-bold tracking-wider ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>ক্যাটাগরি</th>
              <th className={`p-2.5 text-[10px] uppercase font-bold tracking-wider text-center font-bold ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>মোট ডিউটি</th>
              <th className={`p-2.5 text-[10px] uppercase font-bold tracking-wider text-right font-bold ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>মোট বিল</th>
              <th className={`p-2.5 text-[10px] uppercase font-bold tracking-wider text-right ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950/20 font-medium">
            {ordersList.map((order, index) => {
              let catName = 'লেট সিটিং';
              if (order.category === 'HOLIDAY') catName = 'ছুটির দিনে';
              if (order.category === 'NIGHT_SHIFT') catName = 'রাত্রিকালীন';
              
              const bnDate = order.orderDate ? toBanglaDigits(order.orderDate.split('-').reverse().join('-')) : '';
              const recordCount = (order.duties || []).reduce((sum: number, g: OrderDuty) => sum + (g.dates ? g.dates.length : 0), 0);
              const ratePerDay = order.category === 'HOLIDAY' ? 500 : order.category === 'NIGHT_SHIFT' ? 1000 : 300;
              const totalAmount = recordCount * ratePerDay;

              const getNorm = (ref: string | null | undefined) => {
                if (!ref) return '';
                return ref.replace(/\/বিল$/, '').trim().toLowerCase();
              };
              const norm = getNorm(order.orderRef);
              const existingBill = officeOrders.find(o => o.category?.startsWith('BILL_') && getNorm(o.orderRef) === norm);

              return (
                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors font-medium">
                  <td className="p-2.5 text-center text-slate-500 font-sans font-semibold text-xs w-10">
                    {toBanglaDigits(index + 1)}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-slate-700 dark:text-slate-300 text-xs max-w-[150px] sm:max-w-[180px] truncate select-all" title={order.orderRef}>
                    {order.orderRef}
                  </td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400 font-sans text-xs whitespace-nowrap">
                    {bnDate}
                  </td>
                  <td className={`p-2.5 ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${
                      order.category === 'HOLIDAY' 
                        ? 'bg-red-50 text-red-655 border border-red-100 dark:bg-red-955/20 dark:text-red-400 dark:border-red-900/30' 
                        : order.category === 'NIGHT_SHIFT'
                          ? 'bg-slate-900 text-white border border-slate-950 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 font-extrabold'
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-955/20 dark:text-indigo-400 dark:border-indigo-900/30'
                    }`}>
                      {catName}
                    </span>
                  </td>
                  <td className={`p-2.5 text-center text-slate-600 dark:text-slate-400 font-sans font-bold text-xs whitespace-nowrap ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>
                    {toBanglaDigits(recordCount)} টি
                  </td>
                  <td className={`p-2.5 text-right text-indigo-600 dark:text-indigo-400 font-sans font-bold text-xs whitespace-nowrap ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>
                    ৳{toBanglaDigits(totalAmount.toLocaleString('en-US'))}
                  </td>
                  <td className={`p-2.5 text-right whitespace-nowrap ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      {/* Primary View Button */}
                      <button
                        onClick={() => handlePreviewOfficeOrder(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-650 dark:text-indigo-300 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans"
                        title="অফিস আদেশ দেখুন ও প্রিন্ট করুন"
                      >
                        <Eye size={12} />
                        <span>ভিউ</span>
                      </button>

                      {/* Dropdown Action Menu (⋮) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionOrderId(openActionOrderId === order.id ? null : order.id);
                          }}
                          className={`p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                            openActionOrderId === order.id ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100' : ''
                          }`}
                          title="অতিরিক্ত অ্যাকশন মেনু"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {openActionOrderId === order.id && (
                          <div 
                            ref={actionMenuRef}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50 animate-in fade-in slide-in-from-top-1 text-left font-sans"
                          >
                            {/* Bill Generate / Edit Option */}
                            {existingBill ? (
                              <button
                                onClick={() => {
                                  setOpenActionOrderId(null);
                                  window.location.href = `/billing?edit_ref=${encodeURIComponent(existingBill.orderRef)}`;
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-955/30 rounded-lg transition-colors cursor-pointer"
                              >
                                <Receipt size={13} />
                                <span>বিল সম্পাদন</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setOpenActionOrderId(null);
                                  window.location.href = `/billing?orderRef=${encodeURIComponent(order.orderRef)}`;
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors cursor-pointer"
                              >
                                <Receipt size={13} />
                                <span>বিল প্রস্তুত করুন</span>
                              </button>
                            )}

                            {/* Edit Roster */}
                            <button
                              onClick={() => {
                                setOpenActionOrderId(null);
                                window.location.href = `/roster?edit_ref=${encodeURIComponent(order.orderRef)}`;
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <FileSignature size={13} />
                              <span>রোস্টার সম্পাদন</span>
                            </button>

                            {/* Delete Order */}
                            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                            <button
                              onClick={() => {
                                setOpenActionOrderId(null);
                                handleDeleteOfficeOrder(order.id, order.orderRef);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>মুছে ফেলুন</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDutiesTable = (dutiesList: Duty[]) => {
    const groupedDuties = Object.entries(
      dutiesList.reduce((acc, duty) => {
        const key = `${duty.employeeId}-${duty.type}`;
        if (!acc[key]) {
          acc[key] = {
            employee: duty.employee,
            type: duty.type,
            duties: [],
            totalBill: 0
          };
        }
        acc[key].duties.push(duty);
        acc[key].totalBill += duty.totalBill;
        return acc;
      }, {} as Record<string, { employee: Employee; type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT'; duties: Duty[]; totalBill: number }>)
    ).map(([, val]) => val);

    const allGroupDutyIds = groupedDuties.flatMap(g => g.duties.map(d => d.id));
    const isAllSelected = allGroupDutyIds.length > 0 && allGroupDutyIds.every(id => selectedDutyIds.includes(id));

    const toggleSelectAll = () => {
      if (isAllSelected) {
        setSelectedDutyIds(prev => prev.filter(id => !allGroupDutyIds.includes(id)));
      } else {
        setSelectedDutyIds(prev => Array.from(new Set([...prev, ...allGroupDutyIds])));
      }
    };

    return (
      <div id="duties-table-container" className="space-y-2">
        {selectedDutyIds.length > 0 && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between no-print animate-in fade-in duration-200">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <Trash2 size={15} />
              {toBanglaDigits(selectedDutyIds.length)} টি ডিউটি রেকর্ড নির্বাচিত করা হয়েছে
            </span>
            <button
              type="button"
              onClick={handleBulkDeleteDuties}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={13} />
              নির্বাচিত টেস্ট ডাটা মুছে ফেলুন (Bulk Delete)
            </button>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/30">
          <table className="w-full text-left text-xs leading-normal">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-3 py-3 w-8 text-center no-print">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="সব সিলেক্ট করুন"
                  />
                </th>
                <th className="px-5 py-3">তারিখ</th>
                <th className={`px-5 py-3 ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>সেল</th>
                <th className="px-5 py-3">কর্মকর্তা</th>
                <th className={`px-5 py-3 ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>পদবী</th>
                <th className={`px-5 py-3 ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>ডিউটির ক্যাটাগরি</th>
                <th className="px-5 py-3">মোট বিল</th>
                <th className={`px-5 py-3 no-print ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {groupedDuties.map((group) => {
                const datesSorted = group.duties.sort((a, b) => a.date.localeCompare(b.date));
                const datesJoined = datesSorted.map(d => d.date).join(', ');
                const bnDatesJoined = datesSorted.map(d => getBanglaDate(d.date)).join(', ');
                const groupDutyIds = group.duties.map(d => d.id);
                const isGroupSelected = groupDutyIds.every(id => selectedDutyIds.includes(id));

                const toggleGroupSelect = () => {
                  if (isGroupSelected) {
                    setSelectedDutyIds(prev => prev.filter(id => !groupDutyIds.includes(id)));
                  } else {
                    setSelectedDutyIds(prev => Array.from(new Set([...prev, ...groupDutyIds])));
                  }
                };

                return (
                  <tr key={`${group.employee.id}-${group.type}`} className={`hover:bg-slate-50/40 dark:hover:bg-slate-955/20 text-slate-600 dark:text-slate-300 ${isGroupSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''}`}>
                    <td className="px-3 py-3.5 text-center no-print">
                      <input
                        type="checkbox"
                        checked={isGroupSelected}
                        onChange={toggleGroupSelect}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3.5 font-sans font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      {datesJoined}
                      <p className="text-[10px] text-slate-400 mt-0.5 font-normal leading-normal">{bnDatesJoined}</p>
                    </td>
                    <td className={`px-5 py-3.5 text-slate-500 dark:text-slate-400 ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>
                      {group.employee.cell?.name || 'N/A'}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{group.employee.name}</p>
                      {group.duties[0]?.description && <p className="text-[10px] text-slate-400 font-normal italic mt-0.5">মন্তব্য: {group.duties[0].description}</p>}
                    </td>
                    <td className={`px-5 py-3.5 font-sans text-[11px] ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>
                      {group.employee.designation}
                    </td>
                    <td className={`px-5 py-3.5 ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>
                      <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${getDutyBadgeStyles(group.type)}`}>
                        {group.type === 'LATE_SITTING' ? 'Late Sitting (লেট সিটিং)' : group.type === 'HOLIDAY' ? 'Holiday Duty (ছুটির দিনে)' : 'Night Shift (রাত্রিকালীন ডিউটি)'}
                      </span>
                      {group.duties.some(d => d.orderRef) && (
                        <div className="mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono flex items-center gap-1">
                          <span>স্মারকঃ {group.duties.find(d => d.orderRef)?.orderRef}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-indigo-600 dark:text-indigo-400 font-sans">
                      ৳{group.totalBill.toLocaleString('bn-BD')}
                    </td>
                    <td className={`px-5 py-3.5 no-print flex items-center gap-1.5 ${isAssignmentPrimary ? 'hidden xl:hidden' : ''}`}>
                      <button
                        onClick={() => handleStartEdit(group.duties)}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-955/20 text-slate-400 hover:text-indigo-500 transition-colors"
                        title="সম্পাদনা (Edit)"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deleteGroupedDuties(group.duties)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/20 text-slate-400 hover:text-red-500 transition-colors"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div 
      tabIndex={0}
      onClick={() => {
        if (isAssignmentPrimary) {
          onFocusPanel();
        }
      }}
      onFocusCapture={() => {
        if (isAssignmentPrimary) {
          onFocusPanel();
        }
      }}
      className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 transition-all duration-500 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 select-none ${
        !isAssignmentPrimary 
          ? 'w-full xl:w-[70%] space-y-6 opacity-100' 
          : 'w-full xl:w-[30%] space-y-3 xl:hover:border-blue-300 opacity-50 blur-[0.5px] scale-[0.99]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">ডিউটি রোস্টার তালিকা</h3>
          <p className="text-xs text-slate-400 mt-0.5">মাসিক ভিউ ফিল্টার এবং বরাদ্দ তালিকা।</p>
        </div>
        {isAssignmentPrimary && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFocusPanel();
            }}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <ChevronRight size={14} className="animate-pulse" />
            প্যানেল বড় করুন
          </button>
        )}
      </div>

      {/* Roster List Body Wrapper */}
      <div className={`space-y-6 transition-all duration-500 ${isAssignmentPrimary ? 'pointer-events-none select-none' : ''}`}>
        {/* Controls Menu */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-400 mt-0.5">মাসিক ভিউ ফিল্টার এবং বরাদ্দ তালিকা।</p>
          </div>
        
          <div className="flex flex-wrap gap-2">
            {/* Select Cell Filter */}
            <select
              value={selectedCell}
              onChange={(e) => changeSelectedCell(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none"
            >
              {(currentUser?.role === 'ADMIN' || (currentUser?.cells && currentUser.cells.length > 1)) && (
                <option value="all">সকল সেল (All Cells)</option>
              )}
              {cells
                .filter(c => currentUser?.role === 'ADMIN' || currentUser?.cells?.some(uc => uc.id === c.id))
                .map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)
              }
            </select>

            {/* Select Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none"
            >
              <option value="all">সকল ক্যাটাগরি (All Categories)</option>
              <option value="LATE_SITTING">Late Sitting (লেট সিটিং)</option>
              <option value="HOLIDAY">Holiday Duty (ছুটির দিনে)</option>
              <option value="NIGHT_SHIFT">Night Shift (রাত্রিকালীন)</option>
            </select>

            {/* Select Employee Filter */}
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none"
            >
              <option value="all">সকল কর্মকর্তা (All Staff)</option>
              {employees
                .filter(emp => selectedCell === 'all' || emp.cellId.toString() === selectedCell)
                .map(emp => <option key={emp.id} value={emp.id.toString()}>{emp.name}</option>)
              }
            </select>

            {/* Custom Modern Multi-Month Picker */}
            <div className="relative" ref={monthPickerRef}>
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none transition-all shadow-sm cursor-pointer"
              >
                <Calendar size={13} className="text-indigo-500 shrink-0" />
                <span>{(() => {
                  if (selectedMonths.length === 0) return 'মাস নির্বাচন করুন';
                  if (selectedMonths.length === 1) return getBanglaMonthYearLabel(selectedMonths[0]);
                  const sorted = [...selectedMonths].sort();
                  return `${getBanglaMonthYearLabel(sorted[0])} (+${toBanglaDigits(selectedMonths.length - 1)}টি)`;
                })()}</span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isMonthPickerOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isMonthPickerOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Popover Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCurrentPickerYear(prev => prev - 1)}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-sans">
                      {toBanglaDigits(currentPickerYear)} সাল
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => setCurrentPickerYear(prev => prev + 1)}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Month Selection Grid */}
                  <div className="grid grid-cols-3 gap-2 py-4">
                    {['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'].map((mName, idx) => {
                      const ymStr = `${currentPickerYear}-${String(idx + 1).padStart(2, '0')}`;
                      const isSelected = selectedMonths.includes(ymStr);
                      
                      return (
                        <button
                          type="button"
                          key={ymStr}
                          onClick={() => {
                            changeSelectedMonths(prev => {
                              if (prev.includes(ymStr)) {
                                if (prev.length === 1) return prev;
                                return prev.filter(m => m !== ymStr);
                              } else {
                                return [...prev, ymStr].sort();
                              }
                            });
                          }}
                          className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-md scale-102 hover:bg-indigo-700'
                              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          {mName}
                        </button>
                      );
                    })}
                  </div>

                  {/* Popover Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const mm = String(today.getMonth() + 1).padStart(2, '0');
                        changeSelectedMonths([`${today.getFullYear()}-${mm}`]);
                      }}
                      className="text-[9px] font-bold text-indigo-500 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors"
                    >
                      চলতি মাস রিসেট
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setIsMonthPickerOpen(false)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                    >
                      ঠিক আছে
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Roster Table Grid */}
        {(() => {
          if (pendingDuties.length === 0 && filteredOfficeOrders.length === 0) {
            return (
              <div className="py-16 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4 border border-slate-100">
                  <Calendar size={32} />
                </div>
                <h4 className="text-base font-semibold text-slate-800 mb-1">কোনো রেকর্ড পাওয়া যায়নি</h4>
                <p className="text-sm text-slate-400">এই সেল, মাস বা ক্যাটাগরির অধীনে কোনো অপেক্ষমাণ ডিউটি বা জেনারেটেড অফিস আদেশ নেই।</p>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveRosterTab('pending')}
                  className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeRosterTab === 'pending'
                      ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400 font-extrabold border-indigo-650'
                      : 'border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-350'
                  }`}
                >
                  অপেক্ষমান অর্ডার জেনারেট করুন
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    activeRosterTab === 'pending'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
                  }`}>
                    {toBanglaDigits(pendingDuties.length)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRosterTab('archived')}
                  className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeRosterTab === 'archived'
                      ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400 font-extrabold border-indigo-650'
                      : 'border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-350'
                  }`}
                >
                  জেনারেটেড এবং প্রিন্টেড সেকশন
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    activeRosterTab === 'archived'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
                  }`}>
                    {toBanglaDigits(filteredOfficeOrders.length)}
                  </span>
                </button>
              </div>

              {/* Tab Contents */}
              {activeRosterTab === 'pending' ? (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    অপেক্ষমান অর্ডার জেনারেট করুন - {toBanglaDigits(pendingDuties.length)} টি
                  </h4>
                  {pendingDuties.length > 0 ? (
                    renderDutiesTable(pendingDuties)
                  ) : (
                    <div className="p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 dark:text-slate-500 italic text-xs bg-slate-50/30 dark:bg-slate-900/10">
                      কোনো অপেক্ষমাণ ডিউটি পাওয়া যায়নি।
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    জেনারেটেড এবং প্রিন্টেড সেকশন - {toBanglaDigits(filteredOfficeOrders.length)} টি
                  </h4>
                  {filteredOfficeOrders.length > 0 ? (
                    renderOfficeOrdersList(filteredOfficeOrders)
                  ) : (
                    <div className="p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 dark:text-slate-500 italic text-xs bg-slate-50/30 dark:bg-slate-900/10">
                      কোনো জেনারেটেড অফিস আদেশ পাওয়া যায়নি।
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
