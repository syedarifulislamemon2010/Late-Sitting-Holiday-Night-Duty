import { toBanglaDigits } from '@/lib/bengali-converter';

export interface Cell {
  id: number;
  name: string;
  description: string | null;
}

export interface Employee {
  id: number;
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  cellId: number;
  cell: Cell;
}

export interface User {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
  cells?: Cell[];
}

export interface Executive {
  id: number;
  name: string;
  designation: string;
}

export interface OrderDuty {
  employeeId?: string | null;
  employeeName: string;
  designation: string;
  days: number;
  apyaonRate: number;
  totalApyaon: number;
  totalTransport: number;
  grandTotal: number;
  datesFormatted: string;
  dates?: string;
}

export interface DutyListEntry {
  employeeName?: string;
  name?: string;
  designation?: string;
  bankId?: string;
  datesFormatted?: string;
  date?: string;
  description?: string;
}

export interface OfficeOrder {
  id: number;
  orderRef: string;
  originalOrderRef?: string;
  orderDate: string;
  category: string;
  employeeName: string;
  cellName: string | null;
  status: string;
  dutiesJson?: string | null;
  duties?: OrderDuty[];
  content?: {
    subjectText?: string;
    openingParagraph?: string;
    signingOfficer?: string;
    signingDesignation?: string;
    representativeDesignation?: string;
    totalDays?: number;
    totalApyaon?: number;
    totalTransport?: number;
    grandTotal?: number;
    grandTotalInWords?: string;
    backingOrderId?: number | null;
    backingOrderRef?: string | null;
    backingOrderDate?: string | null;
    orderText?: string;
    copies?: string[];
  } | null;
}

export interface Duty {
  id: number;
  employeeId: number;
  employee: Employee;
  type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
  date: string;
  description: string | null;
  allowance1: number;
  allowance2: number;
  totalBill: number;
  orderRef?: string | null;
}

export interface EmployeeBillingSummary {
  employeeId: number;
  name: string;
  designation: string;
  cellName: string;
  bankId: string | null;
  fileNo: string | null;
  lateDays: number;
  lateAllowance1: number;
  lateAllowance2: number;
  holidayDays: number;
  holidayAllowance1: number;
  holidayAllowance2: number;
  nightDays: number;
  nightAllowance1: number;
  nightAllowance2: number;
  grandTotal: number;
  datesFormatted?: string;
}

export interface BillGroup {
  date: string;
  name: string;
  bills: OfficeOrder[];
}

export interface EmployeeBreakdown {
  employeeName: string;
  designation: string;
  lateSittingDays: number;
  lateSittingAmount: number;
  holidayDays: number;
  holidayAmount: number;
  nightShiftDays: number;
  nightShiftAmount: number;
  totalDays: number;
  grandTotal: number;
}

export interface PayeeSummary {
  payeeName: string;
  designation: string;
  billCount: number;
  transportAllowance: number;
  apyaonAllowance: number;
  grandTotal: number;
}

export interface ReportData {
  totalBillsCount: number;
  totalDays: number;
  grandTotal: number;
  grandTotalSum: number;
  totalDaysSum: number;
  totalTransport: number;
  totalApyaon: number;
  lateSittingAmount: number;
  holidayAmount: number;
  nightShiftAmount: number;
  totalLateDays: number;
  totalLateAmount: number;
  totalHolidayDays: number;
  totalHolidayAmount: number;
  totalNightDays: number;
  totalNightAmount: number;
  employeesBreakdown: EmployeeBreakdown[];
  payeesSummary: PayeeSummary[];
}

export const getSlotName = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  const banglaMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const monthName = banglaMonths[monthNum - 1] || '';
  
  let dayStr = '';
  if (day === 1) dayStr = '১লা';
  else if (day === 2) dayStr = '২রা';
  else if (day === 3) dayStr = '৩রা';
  else if (day === 4) dayStr = '৪ঠা';
  else if (day >= 5 && day <= 18) dayStr = `${toBanglaDigits(day)}ই`;
  else dayStr = `${toBanglaDigits(day)}শে`;
  
  return `${dayStr} ${monthName}, ${toBanglaDigits(year)}`;
};

export const getNormalizedRef = (ref: string): string => {
  if (!ref) return '';
  let clean = ref;
  if (clean.endsWith('/বিল')) {
    clean = clean.replace(/\/বিল$/, '');
  }
  const parts = clean.split('/');
  if (parts.length >= 3) {
    parts.splice(2, 1); // remove name component
  }
  return parts.join('/');
};

export const getSeniorityRank = (designation: string): number => {
  if (!designation) return 99;
  const d = designation.toUpperCase();
  if (d.includes('এসপিও') || d.includes('SPO') || d.includes('সিনিয়র প্রিন্সিপাল') || d.includes('SENIOR PRINCIPAL')) {
    return 1;
  }
  if (d.includes('পিও') || d.includes('PO') || d.includes('প্রিন্সিপাল') || d.includes('PRINCIPAL')) {
    return 2;
  }
  if (d.includes('এসও-আইটি') || d.includes('SO-IT') || d.includes('সিনিয়র অফিসার') || d.includes('SENIOR OFFICER')) {
    return 3;
  }
  return 4;
};

export const getPrintCategoryRates = (printCategory: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT') => {
  let transportRate = 200;
  let apyaonRate = 100;
  if (printCategory === 'HOLIDAY') {
    transportRate = 250;
    apyaonRate = 250;
  } else if (printCategory === 'NIGHT_SHIFT') {
    transportRate = 400;
    apyaonRate = 600;
  }
  return { transportRate, apyaonRate };
};

export const userHasAccessToOrder = (o: OfficeOrder, currentUser: any, employees: Employee[]): boolean => {
  if (!currentUser) return false;
  if (currentUser.role === 'ADMIN') return true;

  let userCellNames = currentUser.cells?.map((c: any) => c.name) || [];
  if (userCellNames.includes('CBS Integrated Development Cell')) {
    return true;
  } else {
    userCellNames = Array.from(new Set([...userCellNames, 'CBS Integrated Development Cell']));
  }

  // 1. Direct cell name match
  if (o.cellName && userCellNames.includes(o.cellName)) {
    return true;
  }

  // 2. Fallback: Check involved employees
  let dutiesList: any[] = o.duties || [];
  if (dutiesList.length === 0 && o.dutiesJson) {
    try {
      dutiesList = JSON.parse(o.dutiesJson);
    } catch (e) {
      console.error(e);
    }
  }

  if (dutiesList.length === 0) {
    if (o.employeeName) {
      const matched = employees.find(e => e.name === o.employeeName);
      if (matched && matched.cell?.name && userCellNames.includes(matched.cell.name)) {
        return true;
      }
    }
    return false;
  }

  return dutiesList.some((d: any) => {
    const empIdStr = d.employeeId ? d.employeeId.toString() : '';
    const empName = d.employeeName || '';
    
    const matched = employees.find(e => 
      (e.id && e.id.toString() === empIdStr) || 
      (e.bankId && e.bankId.toString() === empIdStr) || 
      (e.name && e.name === empName)
    );

    return matched && matched.cell?.name && userCellNames.includes(matched.cell.name);
  });
};
