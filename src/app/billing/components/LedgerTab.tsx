import logger from '@/lib/logger';
import React, { useState } from 'react';
import { 
  Clock, 
  Award, 
  ShieldCheck, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Receipt,
  FileSpreadsheet,
  Printer,
  Eye,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { toBanglaDigits, getBanglaDate } from '@/lib/bengali-converter';
import { renderDatesInPairs } from '@/lib/print-helpers';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserProfile, UserCell } from '@/context/ProfileContext';
import { Employee, OrderDuty } from '../types';

interface MetricState {
  totalLateSittingBill: number;
  totalLateAllowance1: number;
  totalLateAllowance2: number;
  totalHolidayBill: number;
  totalHolidayAllowance1: number;
  totalHolidayAllowance2: number;
  totalNightBill: number;
  totalNightAllowance1: number;
  totalNightAllowance2: number;
  grandTotal: number;
}

interface Cell {
  id: number;
  name: string;
  description: string | null;
}

interface OfficeOrder {
  id: number;
  orderRef: string;
  orderDate: string;
  category: string;
  employeeName: string;
  cellName: string | null;
  status: string;
  dutiesJson?: string | null;
  duties?: OrderDuty[];
}

interface LedgerTabProps {
  loading: boolean;
  showOrderWarning: boolean;
  metrics: MetricState;
  allActiveOfficeOrders: OfficeOrder[];
  findAssociatedBill: (order: OfficeOrder) => OfficeOrder | null | undefined;
  handleLoadBillForEditing: (ref: string) => void;
  handleGenerateBillFromOrder: (order: OfficeOrder) => void;
  ledgerGrandTotal: number;
  selectedMonth: string;
  setIsLedgerPrintMode: (val: boolean) => void;
  setViewingOrder: (order: OfficeOrder) => void;
  handleDeleteOrder: (id: number) => Promise<void> | void;
  hasDeletePermission: (order: OfficeOrder) => boolean;
  employees: Employee[];
  currentUser: UserProfile | null | undefined;
  selectedCell: string;
}

export default function LedgerTab({
  loading,
  showOrderWarning,
  metrics,
  allActiveOfficeOrders,
  findAssociatedBill,
  handleLoadBillForEditing,
  handleGenerateBillFromOrder,
  ledgerGrandTotal,
  selectedMonth,
  setIsLedgerPrintMode,
  setViewingOrder,
  handleDeleteOrder,
  hasDeletePermission,
  employees,
  currentUser,
  selectedCell
}: LedgerTabProps) {

  const [selectedDetailCategory, setSelectedDetailCategory] = useState<null | 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' | 'GRAND_TOTAL'>(null);

  const getCategoryDetails = () => {
    if (!selectedDetailCategory) return [];

    const detailMap = new Map<string, {
      employeeName: string;
      designation: string;
      cellName: string;
      category: string;
      orderRef: string;
      orderDate: string;
      days: number;
      apyaon: number;
      transport: number;
      total: number;
    }>();

    allActiveOfficeOrders.forEach(order => {
      if (selectedDetailCategory !== 'GRAND_TOTAL' && order.category !== selectedDetailCategory) {
        return;
      }

      let dutiesList = order.duties || [];
      if (dutiesList.length === 0 && order.dutiesJson) {
        try {
          dutiesList = JSON.parse(order.dutiesJson);
        } catch (e) {
          logger.error(e);
        }
      }

      const totalDays = dutiesList.reduce((sum: number, d: OrderDuty) => sum + (Array.isArray(d.dates) ? d.dates.length : (d.days || 0)), 0);
      if (totalDays === 0) return;

      let transportRate = 200;
      let apyaonRate = 100;
      if (order.category === 'HOLIDAY') {
        transportRate = 250;
        apyaonRate = 250;
      } else if (order.category === 'NIGHT_SHIFT') {
        transportRate = 400;
        apyaonRate = 600;
      }

      const totalApyaon = totalDays * apyaonRate;
      const totalTransport = totalDays * transportRate;
      const totalBill = totalApyaon + totalTransport;

      const key = `${order.employeeName}_${order.category}_${order.orderRef}`;
      detailMap.set(key, {
        employeeName: order.employeeName,
        designation: dutiesList[0]?.designation || 'কর্মকর্তা',
        cellName: order.cellName || 'অন্যান্য',
        category: order.category,
        orderRef: order.orderRef,
        orderDate: order.orderDate,
        days: totalDays,
        apyaon: totalApyaon,
        transport: totalTransport,
        total: totalBill
      });
    });

    return Array.from(detailMap.values());
  };

  const getEmployeeMetrics = (emp: Employee) => {
    let lateSitting = 0;
    let holiday = 0;
    let nightShift = 0;

    allActiveOfficeOrders.forEach(order => {
      let dutiesList = order.duties || [];
      if (dutiesList.length === 0 && order.dutiesJson) {
        try {
          dutiesList = JSON.parse(order.dutiesJson);
        } catch (e) {
          logger.error(e);
        }
      }

      dutiesList.forEach((d: OrderDuty) => {
        const empIdStr = d.employeeId ? d.employeeId.toString() : '';
        const empName = d.employeeName || '';

        const isMatch = 
          (emp.id && emp.id.toString() === empIdStr) || 
          (emp.bankId && emp.bankId.toString() === empIdStr) || 
          (emp.name && emp.name === empName);

        if (isMatch) {
          const days = Array.isArray(d.dates) ? d.dates.length : (d.days || 0);
          let transportRate = 200;
          let apyaonRate = 100;
          if (order.category === 'HOLIDAY' || order.category === 'BILL_HOLIDAY') {
            transportRate = 250;
            apyaonRate = 250;
          } else if (order.category === 'NIGHT_SHIFT' || order.category === 'BILL_NIGHT_SHIFT') {
            transportRate = 400;
            apyaonRate = 600;
          }

          const totalApyaon = d.totalApyaon !== undefined && d.totalApyaon > 0 ? d.totalApyaon : (days * apyaonRate);
          const totalTransport = d.totalTransport !== undefined && d.totalTransport > 0 ? d.totalTransport : (days * transportRate);
          const itemGrandTotal = d.grandTotal !== undefined && d.grandTotal > 0 ? d.grandTotal : (totalApyaon + totalTransport);

          const orderCategory = order.category.startsWith('BILL_') ? order.category.replace('BILL_', '') : order.category;

          if (orderCategory === 'LATE_SITTING') {
            lateSitting += itemGrandTotal;
          } else if (orderCategory === 'HOLIDAY') {
            holiday += itemGrandTotal;
          } else if (orderCategory === 'NIGHT_SHIFT') {
            nightShift += itemGrandTotal;
          }
        }
      });
    });

    return {
      lateSitting,
      holiday,
      nightShift,
      grand: lateSitting + holiday + nightShift
    };
  };

  const getEmployeeDuties = (emp: Employee) => {
    const duties: {
      category: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
      orderRef: string;
      dates: string[];
      days: number;
      amount: number;
    }[] = [];

    allActiveOfficeOrders.forEach(order => {
      let dutiesList = order.duties || [];
      if (dutiesList.length === 0 && order.dutiesJson) {
        try {
          dutiesList = JSON.parse(order.dutiesJson);
        } catch (e) {
          logger.error(e);
        }
      }

      dutiesList.forEach((d: OrderDuty) => {
        const empIdStr = d.employeeId ? d.employeeId.toString() : '';
        const empName = d.employeeName || '';

        const isMatch = 
          (emp.id && emp.id.toString() === empIdStr) || 
          (emp.bankId && emp.bankId.toString() === empIdStr) || 
          (emp.name && emp.name === empName);

        if (isMatch) {
          const dates = Array.isArray(d.dates) 
            ? d.dates 
            : (typeof d.dates === 'string' ? d.dates.split(/,\s*/) : (d.datesFormatted ? d.datesFormatted.split(/,\s*/) : []));
          const days = Array.isArray(d.dates) ? d.dates.length : (d.days || 0);
          
          let transportRate = 200;
          let apyaonRate = 100;
          if (order.category === 'HOLIDAY' || order.category === 'BILL_HOLIDAY') {
            transportRate = 250;
            apyaonRate = 250;
          } else if (order.category === 'NIGHT_SHIFT' || order.category === 'BILL_NIGHT_SHIFT') {
            transportRate = 400;
            apyaonRate = 600;
          }

          const totalApyaon = d.totalApyaon !== undefined && d.totalApyaon > 0 ? d.totalApyaon : (days * apyaonRate);
          const totalTransport = d.totalTransport !== undefined && d.totalTransport > 0 ? d.totalTransport : (days * transportRate);
          const itemGrandTotal = d.grandTotal !== undefined && d.grandTotal > 0 ? d.grandTotal : (totalApyaon + totalTransport);

          const orderCategory = order.category.startsWith('BILL_') ? order.category.replace('BILL_', '') : order.category;

          duties.push({
            category: orderCategory as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT',
            orderRef: order.orderRef,
            dates: dates,
            days: days,
            amount: itemGrandTotal
          });
        }
      });
    });

    return duties;
  };

  const visibleEmployees = React.useMemo(() => {
    let list = employees;
    
    if (selectedCell !== 'all') {
      list = list.filter(emp => emp.cellId?.toString() === selectedCell);
    } else if (currentUser && currentUser.role !== 'ADMIN') {
      const userCellNames = currentUser.cells?.map((c: UserCell) => c.name) || [];
      list = list.filter(emp => emp.cell?.name && userCellNames.includes(emp.cell.name));
    }
    
    return [...list].sort((a, b) => {
      const metricsA = getEmployeeMetrics(a);
      const metricsB = getEmployeeMetrics(b);
      if (metricsA.grand !== metricsB.grand) {
        return metricsB.grand - metricsA.grand;
      }
      return a.name.localeCompare(b.name);
    });
  }, [employees, selectedCell, currentUser, allActiveOfficeOrders]);

  const handleExportToCSV = () => {
    const exportData = allActiveOfficeOrders.map((order, idx) => {
      let dutiesList = order.duties || [];
      if (dutiesList.length === 0 && order.dutiesJson) {
        try {
          dutiesList = JSON.parse(order.dutiesJson);
        } catch (e) {
          logger.error(e);
        }
      }
      const totalDays = dutiesList.reduce((sum: number, d: OrderDuty) => sum + (Array.isArray(d.dates) ? d.dates.length : (d.days || 0)), 0);
      
      let transportRate = 200;
      let apyaonRate = 100;
      if (order.category === 'HOLIDAY') {
        transportRate = 250;
        apyaonRate = 250;
      } else if (order.category === 'NIGHT_SHIFT') {
        transportRate = 400;
        apyaonRate = 600;
      }
      const billTotal = totalDays * (apyaonRate + transportRate);
      const categoryLabel = order.category === 'LATE_SITTING' ? 'লেট সিটিং' : order.category === 'HOLIDAY' ? 'ছুটির দিন' : 'নাইট শিফট';

      return {
        sl: idx + 1,
        ref: order.orderRef,
        date: order.orderDate,
        category: categoryLabel,
        payee: order.employeeName,
        days: totalDays,
        total: billTotal
      };
    });

    const headers = ['ক্রমিক নং', 'স্মারক নম্বর', 'আদেশের তারিখ', 'ক্যাটাগরি', 'কর্মকর্তা (Payee)', 'ডিউটি দিন', 'সর্বমোট বিল'];
    const rows = exportData.map(item => [
      item.sl,
      item.ref,
      item.date,
      item.category,
      item.payee,
      item.days,
      item.total
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Billing_Ledger_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {showOrderWarning && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 font-sans font-medium text-sm animate-fade-in mb-6 animate-fade-in">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <p>নির্বাচিত মাস ও সেলের জন্য কোনো &quot;জেনারেটেড এন্ড প্রিন্টেড&quot; অফিস আদেশ পাওয়া যায়নি। আগে অফিস আদেশ জেনারেট করুন, তারপর বিল প্রস্তুত করতে পারবেন।</p>
        </div>
      )}

      {loading ? (
        /* KPI Loading state */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
        </div>
      ) : (
        /* Detailed Allowance Cost KPI Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Metric 1: Late Sitting Allowance splits */}
          <div 
            onClick={() => setSelectedDetailCategory('LATE_SITTING')}
            className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-md cursor-pointer transition-all active:scale-[0.98]"
            title="লেট সিটিং বিলের বিস্তারিত দেখতে ক্লিক করুন"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="app-metadata-text font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">লেট সিটিং বিল (Snacks + Travel)</p>
                <h3 className="app-kpi-value text-slate-900 dark:text-slate-100 font-sans text-2xl font-black tabular-nums">৳{toBanglaDigits(metrics.totalLateSittingBill.toLocaleString('en-US'))}</h3>
              </div>
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-100 dark:border-purple-900/30 shadow-xs">
                <Clock size={16} />
              </div>
            </div>
            <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-3 space-y-0.5 text-[11px]">
              <p>• নাস্তা বরাদ্দ (৳১০০): <span className="font-bold text-slate-700 dark:text-slate-200 font-sans tabular-nums">৳{toBanglaDigits(metrics.totalLateAllowance1.toLocaleString('en-US'))}</span></p>
              <p>• যাতায়াত বরাদ্দ (৳২০০): <span className="font-bold text-slate-700 dark:text-slate-200 font-sans tabular-nums">৳{toBanglaDigits(metrics.totalLateAllowance2.toLocaleString('en-US'))}</span></p>
            </div>
          </div>

          {/* Metric 2: Holiday Duty Allowance splits */}
          <div 
            onClick={() => setSelectedDetailCategory('HOLIDAY')}
            className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-md cursor-pointer transition-all active:scale-[0.98]"
            title="হলিডে ডিউটি বিলের বিস্তারিত দেখতে ক্লিক করুন"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="app-metadata-text font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">হলিডে ডিউটি বিল (Lunch + Travel)</p>
                <h3 className="app-kpi-value text-slate-900 dark:text-slate-100 font-sans text-2xl font-black tabular-nums">৳{toBanglaDigits(metrics.totalHolidayBill.toLocaleString('en-US'))}</h3>
              </div>
              <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-100 dark:border-sky-900/30 shadow-xs">
                <Award size={16} />
              </div>
            </div>
            <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-3 space-y-0.5 text-[11px]">
              <p>• দুপুরের খাবার (৳২৫০): <span className="font-bold text-slate-700 dark:text-slate-200 font-sans tabular-nums">৳{toBanglaDigits(metrics.totalHolidayAllowance1.toLocaleString('en-US'))}</span></p>
              <p>• যাতায়াত বরাদ্দ (৳২৫০): <span className="font-bold text-slate-700 dark:text-slate-200 font-sans tabular-nums">৳{toBanglaDigits(metrics.totalHolidayAllowance2.toLocaleString('en-US'))}</span></p>
            </div>
          </div>

          {/* Metric 3: Night Shift Allowance splits */}
          <div 
            onClick={() => setSelectedDetailCategory('NIGHT_SHIFT')}
            className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-md cursor-pointer transition-all active:scale-[0.98]"
            title="নাইট শিফট বিলের বিস্তারিত দেখতে ক্লিক করুন"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <p className="app-metadata-text font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">নাইট শিফট বিল (Dinner + Travel)</p>
                <h3 className="app-kpi-value text-slate-900 dark:text-slate-100 font-sans text-2xl font-black tabular-nums">৳{toBanglaDigits(metrics.totalNightBill.toLocaleString('en-US'))}</h3>
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-xs">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-3 space-y-0.5 text-[11px]">
              <p>• রাতের খাবার (৳৬০০): <span className="font-bold text-slate-700 dark:text-slate-200 font-sans tabular-nums">৳{toBanglaDigits(metrics.totalNightAllowance1.toLocaleString('en-US'))}</span></p>
              <p>• যাতায়াত বরাদ্দ (৳৪০০): <span className="font-bold text-slate-700 dark:text-slate-200 font-sans tabular-nums">৳{toBanglaDigits(metrics.totalNightAllowance2.toLocaleString('en-US'))}</span></p>
            </div>
          </div>

          {/* Metric 4: Grand Total */}
          <div 
            onClick={() => setSelectedDetailCategory('GRAND_TOTAL')}
            className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-emerald-500/30 dark:border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-md cursor-pointer transition-all active:scale-[0.98]"
            title="সর্বমোট প্রদেয় বিলের বিস্তারিত দেখতে ক্লিক করুন"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="app-metadata-text font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px]">সর্বমোট প্রদেয় বিল (Grand Total)</p>
                <h3 className="app-kpi-value text-emerald-700 dark:text-emerald-300 font-sans text-2xl font-black tabular-nums">৳{toBanglaDigits(metrics.grandTotal.toLocaleString('en-US'))}</h3>
              </div>
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="app-metadata-text text-slate-400 border-t border-emerald-500/20 dark:border-emerald-500/20 pt-2.5 mt-3 space-y-0.5 text-[11px]">
              <p>• সর্বমোট আপ্যায়ন: <span className="font-bold text-emerald-700 dark:text-emerald-300 font-sans tabular-nums">৳{toBanglaDigits((metrics.totalLateAllowance1 + metrics.totalHolidayAllowance1 + metrics.totalNightAllowance1).toLocaleString('en-US'))}</span></p>
              <p>• সর্বমোট যাতায়াত: <span className="font-bold text-emerald-700 dark:text-emerald-300 font-sans tabular-nums">৳{toBanglaDigits((metrics.totalLateAllowance2 + metrics.totalHolidayAllowance2 + metrics.totalNightAllowance2).toLocaleString('en-US'))}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Employee-wise Summary Cards */}
      <div className="mt-8 space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base font-sans">কর্মকর্তা ভিত্তিক বিলের সারসংক্ষেপ</h3>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">সেলের অন্তর্ভুক্ত প্রত্যেক কর্মকর্তার ক্যাটাগরি ভিত্তিক অর্জিত ভাতার বিবরণী।</p>
        </div>

        {visibleEmployees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="কোনো কর্মকর্তা পাওয়া যায়নি"
            description="নির্বাচিত সেলে কোনো কর্মকর্তা তালিকাভুক্ত নেই অথবা এই ক্যাটাগরিতে কোনো তথ্য পাওয়া যায়নি।"
            className="py-10"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
            {visibleEmployees.map(emp => {
            const empMetrics = getEmployeeMetrics(emp);
            const empDuties = getEmployeeDuties(emp);
            const isZeroData = empMetrics.grand === 0 && empDuties.length === 0;
            const isEmon = emp.bankId === '026795';

            // ----------------------------------------------------
            // 1. COMPACT ZERO-DATA CARD (Auto-shrink height, clean layout)
            // ----------------------------------------------------
            if (isZeroData) {
              return (
                <div 
                  key={emp.id} 
                  className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                        {emp.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {emp.designation}
                      </p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-900 text-slate-400">
                      ID: {emp.bankId || emp.id}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-850 text-[11px] font-sans">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <AlertCircle size={12} className="shrink-0 text-slate-350" />
                      <span className="text-[10px] font-medium">এই মাসে কোনো বিল নেই</span>
                    </div>
                    <span className="font-bold font-sans text-[11px] text-slate-400 tabular-nums">৳০/-</span>
                  </div>
                </div>
              );
            }
            
            // ----------------------------------------------------
            // 2. ACTIVE DATA-RICH OFFICER CARD
            // ----------------------------------------------------
            return (
              <div 
                key={emp.id} 
                className={`glass-card p-5 rounded-2xl border transition-all flex flex-col justify-between hover:shadow-md ${
                  isEmon 
                    ? 'border-primary/40 bg-blue-50/20 dark:bg-blue-950/10 ring-1 ring-primary/20' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Officer Info */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">
                        {emp.name}
                      </h4>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold mt-0.5 truncate">
                        {emp.designation}
                      </p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                      ID: {emp.bankId || emp.id}
                    </span>
                  </div>

                  {/* Metrics Grid (4 mini boxes with Grand Total distinct accent) */}
                  <div className="grid grid-cols-2 gap-2.5 pt-3 text-[10px] font-sans">
                    <div className="bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/80 space-y-0.5">
                      <p className="text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider text-[8.5px]">লেট সিটিং</p>
                      <p className="font-extrabold text-slate-850 dark:text-slate-200 text-xs tabular-nums">
                        ৳{toBanglaDigits(empMetrics.lateSitting.toLocaleString('en-US'))}
                      </p>
                    </div>
                    <div className="bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/80 space-y-0.5">
                      <p className="text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider text-[8.5px]">হলিডে ডিউটি</p>
                      <p className="font-extrabold text-slate-850 dark:text-slate-200 text-xs tabular-nums">
                        ৳{toBanglaDigits(empMetrics.holiday.toLocaleString('en-US'))}
                      </p>
                    </div>
                    <div className="bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/80 space-y-0.5">
                      <p className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider text-[8.5px]">নাইট শিফট</p>
                      <p className="font-extrabold text-slate-850 dark:text-slate-200 text-xs tabular-nums">
                        ৳{toBanglaDigits(empMetrics.nightShift.toLocaleString('en-US'))}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 p-2.5 rounded-xl border border-blue-200/90 dark:border-blue-800/60 shadow-xs space-y-0.5 ring-1 ring-blue-400/20">
                      <p className="text-primary dark:text-blue-300 font-extrabold uppercase tracking-wider text-[8.5px]">সর্বমোট বিল</p>
                      <p className="font-black text-primary dark:text-blue-300 text-sm tabular-nums">
                        ৳{toBanglaDigits(empMetrics.grand.toLocaleString('en-US'))}
                      </p>
                    </div>
                  </div>

                  {/* Duties Detail List with Consistent Scroll Area & Fade Cue */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider font-sans">ডিউটিসমূহের বিবরণী:</p>
                    {empDuties.length > 0 ? (
                      <div className="relative">
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 slim-scrollbar">
                          {empDuties.map((duty, idx) => {
                            const categoryLabel = duty.category === 'LATE_SITTING' ? 'লেট সিটিং' : duty.category === 'HOLIDAY' ? 'সরকারি ছুটি' : 'রাত্রীকালীন';
                            const categoryColor = duty.category === 'LATE_SITTING' 
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/50'
                              : duty.category === 'HOLIDAY'
                              ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900/50'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50';
                            
                            const formattedDates = renderDatesInPairs(duty.dates).join(', ');

                            return (
                              <div key={idx} className="p-2.5 bg-slate-50/60 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1.5">
                                <div className="flex justify-between items-center text-[9px] font-sans gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${categoryColor}`}>
                                    {categoryLabel}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 break-all text-right truncate">
                                    Ref: {duty.orderRef}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-700 dark:text-slate-300 font-sans flex justify-between font-bold">
                                  <span>মোট দিন: <span className="font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">{toBanglaDigits(duty.days)}</span> দিন</span>
                                  <span className="text-primary dark:text-blue-400 font-extrabold tabular-nums">৳{toBanglaDigits(duty.amount.toLocaleString('en-US'))}</span>
                                </div>
                                {duty.dates.length > 0 && (
                                  <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-sans break-words bg-white dark:bg-slate-950 p-1.5 rounded-lg border border-slate-150 dark:border-slate-850 mt-1 leading-snug">
                                    <span className="font-bold text-slate-600 dark:text-slate-300">তারিখ: </span>
                                    <span className="tabular-nums">{toBanglaDigits(formattedDates)}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {empDuties.length > 1 && (
                          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white/80 dark:from-slate-900/80 to-transparent rounded-b-xl" />
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic font-sans py-1">এই মাসে কোনো ডিউটি করেননি।</p>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

      {/* Aggregated Officers Ledger Table Grouped By Cell */}
      <div className="glass-card p-6 rounded-2xl space-y-4 border border-slate-200 dark:border-slate-800 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base font-sans">আপ্যায়ন বিলিং খতিয়ান (Monthly Billing Ledger)</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">জেনারেটেড ও প্রিন্টকৃত অফিস আদেশ এবং তাদের বিল প্রস্তুতকরণ খতিয়ান।</p>
          </div>
          {allActiveOfficeOrders.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsLedgerPrintMode(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all border border-indigo-100 dark:border-indigo-950/30 cursor-pointer font-sans"
              >
                <Printer size={14} />
                <span>প্রিন্ট প্রিভিউ</span>
              </button>
              <button
                onClick={handleExportToCSV}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer font-sans"
              >
                <FileSpreadsheet size={14} className="text-emerald-500" />
                <span>Excel/CSV এক্সপোর্ট</span>
              </button>
            </div>
          )}
        </div>

        {/* Category Color Legend */}
        <div className="flex flex-wrap items-center gap-2.5 py-2 px-3.5 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-150 dark:border-slate-800/80 text-[11px] font-sans">
          <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">ক্যাটাগরি নির্দেশিকা (Legend):</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            রাত্রীকালীন ভাতা (Night Duty)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400" />
            সরকারি ছুটির দিন (Holiday Duty)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
            লেট সিটিং (Late Sitting)
          </span>
        </div>

        {loading ? (
          <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
        ) : allActiveOfficeOrders.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800/80">
            <table className="w-full text-left text-xs leading-normal">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider font-sans">
                  <th className="px-3.5 py-3.5 text-center w-12">#</th>
                  <th className="px-4 py-3.5 min-w-[200px] max-w-[240px]">স্মারক নম্বর (Order Reference)</th>
                  <th className="px-4 py-3.5 text-center w-28">আদেশের তারিখ</th>
                  <th className="px-4 py-3.5 text-center w-32">ক্যাটাগরি</th>
                  <th className="px-4 py-3.5 min-w-[150px]">কর্মকর্তা (Payee)</th>
                  <th className="px-4 py-3.5 text-center min-w-[190px]">ডিউটি তথ্য</th>
                  <th className="px-4 py-3.5 text-right min-w-[170px]">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {allActiveOfficeOrders.map((order, idx) => {
                  const bill = findAssociatedBill(order);
                  const isBilled = !!bill;

                  let dutiesList = order.duties || [];
                  if (dutiesList.length === 0 && order.dutiesJson) {
                    try {
                      dutiesList = JSON.parse(order.dutiesJson);
                    } catch (e) {
                      logger.error(e);
                    }
                  }
                  const totalDays = dutiesList.reduce((sum: number, d: OrderDuty) => sum + (Array.isArray(d.dates) ? d.dates.length : (d.days || 0)), 0);
                  
                  let transportRate = 200;
                  let apyaonRate = 100;
                  let apyaonName = 'নাস্তা';
                  let transportName = 'যাতায়াত';
                  if (order.category === 'HOLIDAY') {
                    transportRate = 250;
                    apyaonRate = 250;
                    apyaonName = 'দুপুরের খাবার';
                  } else if (order.category === 'NIGHT_SHIFT') {
                    transportRate = 400;
                    apyaonRate = 600;
                    apyaonName = 'রাতের খাবার';
                  }
                  const billTotal = totalDays * (apyaonRate + transportRate);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                      <td className="px-3.5 py-4 text-center font-mono font-bold text-slate-400">
                        {toBanglaDigits(idx + 1)}
                      </td>
                      <td className="px-4 py-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 break-all leading-relaxed min-w-[200px] max-w-[240px]">
                        {order.orderRef}
                      </td>
                      <td className="px-4 py-4 text-center font-sans text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {order.orderDate}
                      </td>
                      <td className="px-4 py-4 text-center font-sans">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          order.category === 'LATE_SITTING'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/50'
                            : order.category === 'HOLIDAY'
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900/50'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50'
                        }`}>
                          {order.category === 'LATE_SITTING' ? 'লেট সিটিং' : order.category === 'HOLIDAY' ? 'সরকারি ছুটি' : 'রাত্রীকালীন'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-100 text-xs">
                        {order.employeeName}
                      </td>
                      <td className="px-4 py-4 font-sans text-center">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tabular-nums">
                          {toBanglaDigits(totalDays)} দিন (<span className="text-primary dark:text-blue-400 font-black">৳{toBanglaDigits(billTotal)}/-</span>)
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400 font-sans flex items-center justify-center gap-1.5">
                          <span>{apyaonName}: ৳{toBanglaDigits(totalDays * apyaonRate)}</span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span>{transportName}: ৳{toBanglaDigits(totalDays * transportRate)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isBilled ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleLoadBillForEditing(bill.orderRef)}
                                className="h-8 px-3 inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all cursor-pointer font-sans"
                                title="বিল সম্পাদন করুন"
                              >
                                <CheckCircle size={12} />
                                <span>বিল সম্পাদনা</span>
                              </button>
                              <button 
                                onClick={() => setViewingOrder(bill)}
                                className="h-8 px-2.5 inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer font-sans"
                                title="বিল বিবরণী দেখুন ও প্রিন্ট করুন"
                              >
                                <Eye size={12} />
                                <span>দেখুন</span>
                              </button>
                              {hasDeletePermission(bill) && (
                                <button 
                                  onClick={() => handleDeleteOrder(bill.id)}
                                  className="h-8 px-2.5 inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950/40 rounded-lg text-[11px] font-semibold transition-all cursor-pointer font-sans"
                                  title="বিল বিবরণী মুছে ফেলুন"
                                >
                                  <Trash2 size={12} />
                                  <span>মুছুন</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleGenerateBillFromOrder(order)}
                              className="h-8 px-3.5 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all cursor-pointer font-sans"
                              title="বিল জেনারেট করুন"
                            >
                              <Receipt size={13} />
                              <span>বিল জেনারেট করুন</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold font-sans">
                <tr>
                  <td colSpan={5} className="px-5 py-4 text-right font-extrabold text-sm text-slate-700 dark:text-slate-350">
                    সর্বমোট:
                  </td>
                  <td className="px-5 py-4 text-center font-black text-sm text-primary dark:text-blue-400 tabular-nums">
                    ৳{toBanglaDigits(ledgerGrandTotal.toLocaleString('en-US'))}/- টাকা
                  </td>
                  <td className="px-5 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Receipt}
            title="কোনো বিলিং খতিয়ান নেই"
            description="নির্বাচিত ফিল্টারের জন্য কোনো সক্রিয় অফিস আদেশ বা বিল রেকর্ড পাওয়া যায়নি।"
            className="py-12"
          />
        )}
      </div>

      {/* Interactive Detail Modal Popup */}
      {selectedDetailCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 max-w-5xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                  {selectedDetailCategory === 'LATE_SITTING' && 'লেট সিটিং বিল - বিস্তারিত বিবরণী'}
                  {selectedDetailCategory === 'HOLIDAY' && 'হলিডে ডিউটি বিল - বিস্তারিত বিবরণী'}
                  {selectedDetailCategory === 'NIGHT_SHIFT' && 'নাইট শিফট বিল - বিস্তারিত বিবরণী'}
                  {selectedDetailCategory === 'GRAND_TOTAL' && 'সর্বমোট প্রদেয় বিল - বিস্তারিত বিবরণী'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ফিল্টারকৃত মাস: {selectedMonth === 'all' ? 'সকল মাস' : toBanglaDigits(selectedMonth)}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetailCategory(null)}
                className="p-1.5 hover:bg-slate-105 hover:text-slate-600 text-slate-400 rounded-lg transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Table */}
            <div className="flex-1 overflow-y-auto my-4 pr-1">
              <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800/80">
                <table className="w-full text-left text-xs leading-normal">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3 text-center w-12">#</th>
                      <th className="px-4 py-3">কর্মকর্তার নাম ও পদবী</th>
                      <th className="px-4 py-3">সেল (Cell)</th>
                      {selectedDetailCategory === 'GRAND_TOTAL' && <th className="px-4 py-3 text-center">ক্যাটাগরি</th>}
                      <th className="px-4 py-3">স্মারক নম্বর</th>
                      <th className="px-4 py-3 text-center">ডিউটি দিন</th>
                      <th className="px-4 py-3 text-right">আপ্যায়ন ভাতা</th>
                      <th className="px-4 py-3 text-right">যাতায়াত ভাতা</th>
                      <th className="px-4 py-3 text-right">সর্বমোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-650 dark:text-slate-300">
                    {getCategoryDetails().map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                        <td className="px-4 py-3 text-center font-sans font-bold text-slate-400">
                          {toBanglaDigits(idx + 1)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{item.employeeName}</div>
                          <div className="text-[10px] text-slate-400">{item.designation}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-650 dark:text-slate-400">
                          {item.cellName}
                        </td>
                        {selectedDetailCategory === 'GRAND_TOTAL' && (
                          <td className="px-4 py-3 text-center font-sans">
                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.category === 'LATE_SITTING'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/50'
                                : item.category === 'HOLIDAY'
                                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900/50'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50'
                            }`}>
                              {item.category === 'LATE_SITTING' ? 'লেট সিটিং' : item.category === 'HOLIDAY' ? 'সরকারি ছুটি' : 'রাত্রীকালীন'}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all max-w-[200px]">
                          {item.orderRef}
                        </td>
                        <td className="px-4 py-3 text-center font-sans font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                          {toBanglaDigits(item.days)}
                        </td>
                        <td className="px-4 py-3 text-right font-sans tabular-nums text-slate-700 dark:text-slate-300">
                          ৳{toBanglaDigits(item.apyaon.toLocaleString('en-US'))}
                        </td>
                        <td className="px-4 py-3 text-right font-sans tabular-nums text-slate-700 dark:text-slate-300">
                          ৳{toBanglaDigits(item.transport.toLocaleString('en-US'))}
                        </td>
                        <td className="px-4 py-3 text-right font-sans font-bold text-primary dark:text-blue-400 tabular-nums">
                          ৳{toBanglaDigits(item.total.toLocaleString('en-US'))}
                        </td>
                      </tr>
                    ))}
                    {getCategoryDetails().length === 0 && (
                      <tr>
                        <td colSpan={selectedDetailCategory === 'GRAND_TOTAL' ? 9 : 8} className="px-4 py-4">
                          <EmptyState
                            icon={Receipt}
                            title="কোনো বিস্তারিত রেকর্ড নেই"
                            description="নির্বাচিত ক্যাটাগরির জন্য কোনো ডিউটি বা বিল রেকর্ড পাওয়া যায়নি।"
                            className="py-6"
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {getCategoryDetails().length > 0 && (
                    <tfoot className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold font-sans">
                      <tr>
                        <td colSpan={selectedDetailCategory === 'GRAND_TOTAL' ? 5 : 4} className="px-4 py-3.5 text-right font-extrabold text-xs">
                          সর্বমোট:
                        </td>
                        <td className="px-4 py-3.5 text-center font-sans font-extrabold text-xs text-slate-800 dark:text-slate-200 tabular-nums">
                          {toBanglaDigits(getCategoryDetails().reduce((sum, item) => sum + item.days, 0))} দিন
                        </td>
                        <td className="px-4 py-3.5 text-right font-sans text-xs tabular-nums">
                          ৳{toBanglaDigits(getCategoryDetails().reduce((sum, item) => sum + item.apyaon, 0).toLocaleString('en-US'))}
                        </td>
                        <td className="px-4 py-3.5 text-right font-sans text-xs tabular-nums">
                          ৳{toBanglaDigits(getCategoryDetails().reduce((sum, item) => sum + item.transport, 0).toLocaleString('en-US'))}
                        </td>
                        <td className="px-4 py-3.5 text-right font-sans font-black text-primary dark:text-blue-400 text-xs tabular-nums">
                          ৳{toBanglaDigits(getCategoryDetails().reduce((sum, item) => sum + item.total, 0).toLocaleString('en-US'))}/- টাকা
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedDetailCategory(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
