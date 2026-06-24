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
  X
} from 'lucide-react';
import { toBanglaDigits, getBanglaDate } from '@/lib/bengali-converter';
import { renderDatesInPairs } from '@/lib/print-helpers';

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
  duties?: any[];
}

interface LedgerTabProps {
  loading: boolean;
  showOrderWarning: boolean;
  metrics: MetricState;
  allActiveOfficeOrders: OfficeOrder[];
  findAssociatedBill: (order: OfficeOrder) => any;
  handleLoadBillForEditing: (ref: string) => void;
  handleGenerateBillFromOrder: (order: OfficeOrder) => void;
  ledgerGrandTotal: number;
  selectedMonth: string;
  setIsLedgerPrintMode: (val: boolean) => void;
  setViewingOrder: (order: OfficeOrder) => void;
  handleDeleteOrder: (id: number) => Promise<void> | void;
  hasDeletePermission: (order: OfficeOrder) => boolean;
  employees: any[];
  currentUser: any;
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
          console.error(e);
        }
      }

      const totalDays = dutiesList.reduce((sum: number, d: any) => sum + (Array.isArray(d.dates) ? d.dates.length : (d.days || 0)), 0);
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

  const getEmployeeMetrics = (emp: any) => {
    let lateSitting = 0;
    let holiday = 0;
    let nightShift = 0;

    allActiveOfficeOrders.forEach(order => {
      let dutiesList = order.duties || [];
      if (dutiesList.length === 0 && order.dutiesJson) {
        try {
          dutiesList = JSON.parse(order.dutiesJson);
        } catch (e) {
          console.error(e);
        }
      }

      dutiesList.forEach((d: any) => {
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

  const getEmployeeDuties = (emp: any) => {
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
          console.error(e);
        }
      }

      dutiesList.forEach((d: any) => {
        const empIdStr = d.employeeId ? d.employeeId.toString() : '';
        const empName = d.employeeName || '';

        const isMatch = 
          (emp.id && emp.id.toString() === empIdStr) || 
          (emp.bankId && emp.bankId.toString() === empIdStr) || 
          (emp.name && emp.name === empName);

        if (isMatch) {
          const dates = Array.isArray(d.dates) 
            ? d.dates 
            : (d.date ? [d.date] : (d.datesFormatted ? d.datesFormatted.split(/,\s*/) : []));
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
            category: orderCategory as any,
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
      const userCellNames = currentUser.cells?.map((c: any) => c.name) || [];
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
          console.error(e);
        }
      }
      const totalDays = dutiesList.reduce((sum: number, d: any) => sum + (Array.isArray(d.dates) ? d.dates.length : (d.days || 0)), 0);
      
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Metric 1: Late Sitting Allowance splits */}
          <div 
            onClick={() => setSelectedDetailCategory('LATE_SITTING')}
            className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-md cursor-pointer transition-all active:scale-[0.98]"
            title="লেট সিটিং বিলের বিস্তারিত দেখতে ক্লিক করুন"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="app-metadata-text font-medium text-slate-500 uppercase tracking-wider text-[10px]">লেট সিটিং বিল (Snacks + Travel)</p>
                <h3 className="app-kpi-value text-slate-800 dark:text-slate-100 font-sans text-xl font-bold">৳{toBanglaDigits(metrics.totalLateSittingBill.toLocaleString('en-US'))}</h3>
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Clock size={16} />
              </div>
            </div>
            <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-4 space-y-0.5 text-[10px]">
              <p>• নাস্তা বরাদ্দ (৳১০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits(metrics.totalLateAllowance1.toLocaleString('en-US'))}</span></p>
              <p>• যাতায়াত বরাদ্দ (৳২০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits(metrics.totalLateAllowance2.toLocaleString('en-US'))}</span></p>
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
                <p className="app-metadata-text font-medium text-slate-500 uppercase tracking-wider text-[10px]">হলিডে ডিউটি বিল (Lunch + Travel)</p>
                <h3 className="app-kpi-value text-slate-800 dark:text-slate-100 font-sans text-xl font-bold">৳{toBanglaDigits(metrics.totalHolidayBill.toLocaleString('en-US'))}</h3>
              </div>
              <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg">
                <Award size={16} />
              </div>
            </div>
            <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-4 space-y-0.5 text-[10px]">
              <p>• দুপুরের খাবার (৳২৫০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits(metrics.totalHolidayAllowance1.toLocaleString('en-US'))}</span></p>
              <p>• যাতায়াত বরাদ্দ (৳২৫০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits(metrics.totalHolidayAllowance2.toLocaleString('en-US'))}</span></p>
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
                <p className="app-metadata-text font-medium text-slate-500 uppercase tracking-wider text-[10px]">নাইট শিফট বিল (Dinner + Travel)</p>
                <h3 className="app-kpi-value text-slate-800 dark:text-slate-100 font-sans text-xl font-bold">৳{toBanglaDigits(metrics.totalNightBill.toLocaleString('en-US'))}</h3>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-4 space-y-0.5 text-[10px]">
              <p>• রাতের খাবার (৳৬০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits(metrics.totalNightAllowance1.toLocaleString('en-US'))}</span></p>
              <p>• যাতায়াত বরাদ্দ (৳৪০০): <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits(metrics.totalNightAllowance2.toLocaleString('en-US'))}</span></p>
            </div>
          </div>

          {/* Metric 4: Grand Total */}
          <div 
            onClick={() => setSelectedDetailCategory('GRAND_TOTAL')}
            className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between bg-gradient-to-tr from-indigo-950/30 to-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-md cursor-pointer transition-all active:scale-[0.98]"
            title="সর্বমোট প্রদেয় বিলের বিস্তারিত দেখতে ক্লিক করুন"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="app-metadata-text font-medium text-emerald-500 dark:text-emerald-400 uppercase tracking-wider text-[10px]">সর্বমোট প্রদেয় বিল (Grand Total)</p>
                <h3 className="app-kpi-value text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400 font-sans text-xl font-bold">৳{toBanglaDigits(metrics.grandTotal.toLocaleString('en-US'))}</h3>
              </div>
              <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="app-metadata-text text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-4 space-y-0.5 text-[10px]">
              <p>• সর্বমোট আপ্যায়ন ব্যয়: <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits((metrics.totalLateAllowance1 + metrics.totalHolidayAllowance1 + metrics.totalNightAllowance1).toLocaleString('en-US'))}</span></p>
              <p>• সর্বমোট যাতায়াত ব্যয়: <span className="font-semibold text-slate-600 dark:text-slate-300 font-sans">৳{toBanglaDigits((metrics.totalLateAllowance2 + metrics.totalHolidayAllowance2 + metrics.totalNightAllowance2).toLocaleString('en-US'))}</span></p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleEmployees.map(emp => {
            const empMetrics = getEmployeeMetrics(emp);
            const empDuties = getEmployeeDuties(emp);
            const isEmon = emp.bankId === '026795';
            
            return (
              <div 
                key={emp.id} 
                className={`glass-card p-5 rounded-2xl border transition-all flex flex-col justify-between hover:shadow-md ${
                  isEmon 
                    ? 'border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/10' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Officer Info */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                        {emp.name}
                      </h4>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5">
                        {emp.designation}
                      </p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-500">
                      ID: {emp.bankId || emp.id}
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-3 text-[10px] font-sans">
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 space-y-0.5">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">লেট সিটিং</p>
                      <p className="font-extrabold text-slate-850 dark:text-slate-200 text-xs">
                        ৳{toBanglaDigits(empMetrics.lateSitting.toLocaleString('en-US'))}
                      </p>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 space-y-0.5">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">হলিডে ডিউটি</p>
                      <p className="font-extrabold text-slate-850 dark:text-slate-200 text-xs">
                        ৳{toBanglaDigits(empMetrics.holiday.toLocaleString('en-US'))}
                      </p>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 space-y-0.5">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">নাইট শিফট</p>
                      <p className="font-extrabold text-slate-850 dark:text-slate-200 text-xs">
                        ৳{toBanglaDigits(empMetrics.nightShift.toLocaleString('en-US'))}
                      </p>
                    </div>
                    <div className="bg-indigo-500/5 dark:bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/10 space-y-0.5">
                      <p className="text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider text-[8px]">সর্বমোট বিল</p>
                      <p className="font-extrabold text-indigo-600 dark:text-indigo-300 text-xs">
                        ৳{toBanglaDigits(empMetrics.grand.toLocaleString('en-US'))}
                      </p>
                    </div>
                  </div>

                  {/* Duties Detail List */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider font-sans">ডিউটিসমূহের বিবরণী:</p>
                    {empDuties.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {empDuties.map((duty, idx) => {
                          const categoryLabel = duty.category === 'LATE_SITTING' ? 'লেট সিটিং' : duty.category === 'HOLIDAY' ? 'সরকারি ছুটি' : 'নাইট শিফট';
                          const categoryColor = duty.category === 'LATE_SITTING' 
                            ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20'
                            : duty.category === 'HOLIDAY'
                            ? 'bg-sky-500/10 text-sky-650 dark:text-sky-400 border-sky-500/20'
                            : 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border-emerald-500/20';
                          
                          const formattedDates = renderDatesInPairs(duty.dates).join(', ');

                          return (
                            <div key={idx} className="p-2 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                              <div className="flex justify-between items-center text-[9px] font-sans">
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${categoryColor}`}>
                                  {categoryLabel}
                                </span>
                                <span className="font-semibold text-slate-400 font-mono break-all max-w-[140px] text-right">
                                  Ref: {duty.orderRef}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-650 dark:text-slate-350 font-sans flex justify-between font-bold">
                                <span>মোট দিন: <span className="font-extrabold text-slate-800 dark:text-slate-200">{toBanglaDigits(duty.days)}</span> দিন</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">৳{toBanglaDigits(duty.amount.toLocaleString('en-US'))}</span>
                              </div>
                              {duty.dates.length > 0 && (
                                <div className="text-[9px] text-slate-500 dark:text-slate-400 font-sans break-words bg-white dark:bg-slate-950 p-1.5 rounded border border-slate-100 dark:border-slate-900 mt-1 leading-snug">
                                  <span className="font-bold">তারিখ: </span>
                                  {toBanglaDigits(formattedDates)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-405 dark:text-slate-500 italic font-sans py-1">এই মাসে কোনো ডিউটি করেননি।</p>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer font-sans"
              >
                <FileSpreadsheet size={14} className="text-emerald-500" />
                <span>Excel/CSV এক্সপোর্ট</span>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
        ) : allActiveOfficeOrders.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
            <table className="w-full text-left text-xs leading-normal">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider font-sans">
                  <th className="px-4 py-3.5 text-center w-12">#</th>
                  <th className="px-5 py-3.5">স্মারক নম্বর (Order Reference)</th>
                  <th className="px-5 py-3.5 text-center">আদেশের তারিখ</th>
                  <th className="px-5 py-3.5 text-center">ক্যাটাগরি</th>
                  <th className="px-5 py-3.5">কর্মকর্তা (payee)</th>
                  <th className="px-5 py-3.5 text-center">ডিউটি তথ্য</th>
                  <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
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
                      console.error(e);
                    }
                  }
                  const totalDays = dutiesList.reduce((sum: number, d: any) => sum + (Array.isArray(d.dates) ? d.dates.length : (d.days || 0)), 0);
                  
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
                    <tr key={order.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                      <td className="px-4 py-4 text-center font-sans font-bold text-slate-400">
                        {toBanglaDigits(idx + 1)}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 break-all max-w-[220px]">
                        {order.orderRef}
                      </td>
                      <td className="px-5 py-4 text-center font-sans">
                        {order.orderDate}
                      </td>
                      <td className="px-5 py-4 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.category === 'LATE_SITTING'
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                            : order.category === 'HOLIDAY'
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {order.category === 'LATE_SITTING' ? 'লেট সিটিং' : order.category === 'HOLIDAY' ? 'সরকারি ছুটি' : 'রাত্রীকালীন'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {order.employeeName}
                      </td>
                      <td className="px-5 py-4 font-sans text-center">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {toBanglaDigits(totalDays)} দিন (৳{toBanglaDigits(billTotal)}/- টাকা)
                        </div>
                        <div className="mt-1 text-[10px] text-slate-450 dark:text-slate-500 font-sans space-y-0.5 text-center flex flex-col items-center">
                          <div>• {apyaonName} (৳{toBanglaDigits(apyaonRate)}): ৳{toBanglaDigits(totalDays * apyaonRate)}/-</div>
                          <div>• {transportName} (৳{toBanglaDigits(transportRate)}): ৳{toBanglaDigits(totalDays * transportRate)}/-</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isBilled ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleLoadBillForEditing(bill.orderRef)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-955/20 dark:hover:bg-teal-900/30 text-teal-650 dark:text-teal-400 rounded-lg text-[10px] font-extrabold transition-all border border-teal-100 dark:border-teal-950/30 cursor-pointer font-sans"
                                title="বিল সম্পাদন করুন"
                              >
                                <CheckCircle size={12} className="text-teal-500" />
                                <span>বিল সম্পাদন</span>
                              </button>
                              <button 
                                onClick={() => setViewingOrder(bill)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold transition-all border border-indigo-100 dark:border-indigo-950/30 cursor-pointer font-sans"
                                title="বিল বিবরণী দেখুন ও প্রিন্ট করুন"
                              >
                                <Eye size={12} />
                                <span>দেখুন</span>
                              </button>
                              {hasDeletePermission(bill) && (
                                <button 
                                  onClick={() => handleDeleteOrder(bill.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer font-sans"
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold transition-all border border-amber-100 dark:border-amber-950/30 cursor-pointer font-sans"
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
                  <td className="px-5 py-4 text-center font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                    ৳{toBanglaDigits(ledgerGrandTotal.toLocaleString('en-US'))}/- টাকা
                  </td>
                  <td className="px-5 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 dark:text-slate-500 italic">
            কোনো অপেক্ষমান বিল অফিস আদেশ পাওয়া যায়নি।
          </div>
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
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.category === 'LATE_SITTING'
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                : item.category === 'HOLIDAY'
                                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {item.category === 'LATE_SITTING' ? 'লেট সিটিং' : item.category === 'HOLIDAY' ? 'সরকারি ছুটি' : 'রাত্রীকালীন'}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-700 dark:text-slate-350 break-all max-w-[200px]">
                          {item.orderRef}
                        </td>
                        <td className="px-4 py-3 text-center font-sans font-bold text-slate-850 dark:text-slate-150">
                          {toBanglaDigits(item.days)}
                        </td>
                        <td className="px-4 py-3 text-right font-sans">
                          ৳{toBanglaDigits(item.apyaon.toLocaleString('en-US'))}
                        </td>
                        <td className="px-4 py-3 text-right font-sans">
                          ৳{toBanglaDigits(item.transport.toLocaleString('en-US'))}
                        </td>
                        <td className="px-4 py-3 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400 animate-fade-in">
                          ৳{toBanglaDigits(item.total.toLocaleString('en-US'))}
                        </td>
                      </tr>
                    ))}
                    {getCategoryDetails().length === 0 && (
                      <tr>
                        <td colSpan={selectedDetailCategory === 'GRAND_TOTAL' ? 9 : 8} className="px-4 py-8 text-center text-slate-400 italic">
                          কোনো রেকর্ড পাওয়া যায়নি।
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
                        <td className="px-4 py-3.5 text-center font-sans font-extrabold text-xs text-slate-850 dark:text-slate-150">
                          {toBanglaDigits(getCategoryDetails().reduce((sum, item) => sum + item.days, 0))} দিন
                        </td>
                        <td className="px-4 py-3.5 text-right font-sans text-xs">
                          ৳{toBanglaDigits(getCategoryDetails().reduce((sum, item) => sum + item.apyaon, 0).toLocaleString('en-US'))}
                        </td>
                        <td className="px-4 py-3.5 text-right font-sans text-xs">
                          ৳{toBanglaDigits(getCategoryDetails().reduce((sum, item) => sum + item.transport, 0).toLocaleString('en-US'))}
                        </td>
                        <td className="px-4 py-3.5 text-right font-sans font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">
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
