import { toBanglaDigits } from '@/lib/bengali-converter';
import type { UserProfile } from '@/context/ProfileContext';

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
  mobile: string | null;
  cellId: number;
  cell: Cell;
}

export interface Executive {
  id: number;
  name: string;
  designation: string;
  fileNo?: string | null;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  isWorkingDay: boolean;
}

export type User = UserProfile;

export interface OrderDuty {
  employeeId?: string | number | null;
  employeeName: string;
  designation: string;
  name?: string;
  cellName?: string;
  bankId?: string | null;
  fileNo?: string | null;
  days?: number;
  apyaonRate?: number;
  totalApyaon?: number;
  totalTransport?: number;
  grandTotal?: number;
  datesFormatted?: string;
  dates?: string[];
  date?: string;
  description?: string | null;
  employee?: {
    id?: number;
    name?: string;
    designation?: string;
    bankId?: string | null;
    cellName?: string;
  };
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

export interface LeaveRecord {
  id?: number;
  bankId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason?: string;
  status?: string;
}

export interface GroupedDuty {
  employee: Employee;
  dates: string[];
  description: string;
}

export interface DutyAssignment {
  employeeId: number;
  type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
  date: string;
  description?: string | null;
}

export const getNormalizedRef = (ref: string | null | undefined): string => {
  if (!ref) return '';
  let clean = ref.replace(/\/বিল$/, '').trim();
  const parts = clean.split('/');
  if (parts.length >= 3) {
    parts.splice(2, 1); // remove payee name component
  }
  return parts.join('/').toLowerCase();
};

export const isNameMatchingRef = (empName: string, ref: string): boolean => {
  if (!empName || !ref) return false;
  let cleanEmp = empName
    .replace(/জনাব/g, '')
    .replace(/জনাবা/g, '')
    .replace(/মোঃ/g, '')
    .replace(/মো:/g, '')
    .replace(/মো‌ঃ/g, '')
    .replace(/মোহাম্মদ/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  
  const cleanRef = ref.replace(/\s+/g, ' ').toLowerCase();
  const firstWord = cleanEmp.split(' ')[0];
  return firstWord ? cleanRef.includes(firstWord) : false;
};

export const getBanglaMonthYearLabel = (ym: string) => {
  if (!ym || !ym.includes('-')) return '';
  const [yearStr, monthStr] = ym.split('-');
  const month = parseInt(monthStr, 10);
  const banglaMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  return `${banglaMonths[month - 1]} ${toBanglaDigits(yearStr)}`;
};

export const getDefaultDescription = (empName: string | null | undefined, category: string, cellName?: string | null) => {
  const name = empName || '';
  const cleanName = name.replace(/^(জনাব|জনাবা|ডাঃ|ড\.)\s*/, '').replace(/\s+/g, ' ').trim();
  const matchesName = cleanName.includes('মোঃ বাহার উদ্দিন') || cleanName.includes('দেবাশীষ কুমার দে');
  const matchesCategory = category === 'HOLIDAY' || category === 'NIGHT_SHIFT';
  
  if (matchesName && matchesCategory) {
    return 'Customization এবং Development (রিপোর্ট পোর্টালের জন্য ডাটা এক্সট্রাকশন) সংক্রান্ত কাজ (R09 Development & Customization Cell)';
  }
  return cellName 
    ? `Customization এবং Development সংক্রান্ত কাজ (${cellName})` 
    : 'Customization এবং Development সংক্রান্ত কাজ';
};

export const LATE_SITTING_TEMPLATE = `T24 Online Banking Software Customization এবং Development সংক্রান্ত কার্যাদি সুচারুরূপে সম্পাদনের নিমিত্তে  অত্র ডিপার্টমেন্টের নিম্ন বর্ণিত কর্মকর্তাগণকে তাদের নামের পাশে বর্ণিত তারিখে অফিস <strong>ছুটির পর (Late Sitting)</strong> কর্মস্থলে উপস্থিত থেকে কর্ম সম্পাদনের নির্দেশ প্রদান করা হলঃ`;
export const NIGHT_SHIFT_TEMPLATE = `T24 Online Banking Software Customization এবং Development সংক্রান্ত কার্যাদি সুচারুরূপে সম্পাদনের নিমিত্তে  অত্র ডিপার্টমেন্টের নিম্ন বর্ণিত কর্মকর্তাগণকে তাদের নামের পাশে বর্ণিত তারিখে অফিস <strong>রাত্রিকালীন (Night Shift)</strong> কর্মস্থলে উপস্থিত থেকে কর্ম সম্পাদনের নির্দেশ প্রদান করা হলঃ`;
export const HOLIDAY_TEMPLATE = `T24 Online Banking Software Customization এবং Development সংক্রান্ত কার্যাদি সুচারুরূপে সম্পাদনের নিমিত্তে  অত্র ডিপার্টমেন্টের নিম্ন বর্ণিত কর্মকর্তাগণকে তাদের নামের পাশে বর্ণিত তারিখে অফিস <strong>ছুটির দিনে (Holiday)</strong> কর্মস্থলে উপস্থিত থেকে কর্ম সম্পাদনের নির্দেশ প্রদান করা হলঃ`;

/**
 * Detailed holiday and weekend classification:
 * - isGovtHoliday: Official government holiday declared in DB
 * - isWeekend: Friday or Saturday
 * - isWorkingDay: True if normal working day or special open working day
 * - label: "সরকারি ছুটি: [name]", "সাপ্তাহিক ছুটি", or "কর্মদিবস"
 */
export const getHolidayStatus = (dateStr: string, holidaysList: Holiday[]) => {
  if (!dateStr) {
    return {
      isGovtHoliday: false,
      isWeekend: false,
      isWorkingDay: true,
      holidayName: '',
      label: 'কর্মদিবস'
    };
  }

  // Hardcoded special working day check
  if (dateStr === '2026-05-23') {
    return {
      isGovtHoliday: false,
      isWeekend: false,
      isWorkingDay: true,
      holidayName: '',
      label: 'কর্মদিবস (বিশেষ কার্যদিবস)'
    };
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = dateObj.getDay(); // 0: Sun, 5: Fri, 6: Sat
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

  const dbHoliday = holidaysList.find(h => h.date === dateStr);

  if (dbHoliday) {
    if (dbHoliday.isWorkingDay) {
      return {
        isGovtHoliday: false,
        isWeekend: false,
        isWorkingDay: true,
        holidayName: dbHoliday.name,
        label: 'কর্মদিবস'
      };
    }

    // Official DB Government Holiday
    return {
      isGovtHoliday: true,
      isWeekend: isWeekend,
      isWorkingDay: false,
      holidayName: dbHoliday.name,
      label: `সরকারি ছুটি: ${dbHoliday.name}`
    };
  }

  if (isWeekend) {
    return {
      isGovtHoliday: false,
      isWeekend: true,
      isWorkingDay: false,
      holidayName: 'সাপ্তাহিক ছুটি',
      label: 'সাপ্তাহিক ছুটি'
    };
  }

  return {
    isGovtHoliday: false,
    isWeekend: false,
    isWorkingDay: true,
    holidayName: '',
    label: 'কর্মদিবস'
  };
};

export const checkIsWorkingDay = (dateStr: string, holidaysList: Holiday[]) => {
  const status = getHolidayStatus(dateStr, holidaysList);
  return status.isWorkingDay;
};

export const isDateDisabledForType = (isWorking: boolean, type: string) => {
  if (!type) return false;
  if (type === 'LATE_SITTING') {
    return !isWorking; // Disabled on holidays and weekends
  }
  if (type === 'HOLIDAY') {
    return isWorking; // Disabled on normal working days
  }
  return false; // Night shift allows any date
};

export const calculateOrderDate = (earliestDateStr: string, holidaysList: Holiday[], steps: number = 1) => {
  if (!earliestDateStr) return new Date().toISOString().split('T')[0];
  
  const [y, m, d] = earliestDateStr.split('-').map(Number);
  const currentDate = new Date(y, m - 1, d);
  
  let workingDaysFound = 0;
  while (true) {
    currentDate.setDate(currentDate.getDate() - 1);
    const yr = currentDate.getFullYear();
    const mo = String(currentDate.getMonth() + 1).padStart(2, '0');
    const da = String(currentDate.getDate()).padStart(2, '0');
    const candidateDateStr = `${yr}-${mo}-${da}`;
    
    if (checkIsWorkingDay(candidateDateStr, holidaysList)) {
      workingDaysFound++;
      if (workingDaysFound >= steps) {
        return candidateDateStr;
      }
    }
  }
};

export const getShortDesignation = (desig: string | undefined | null): string => {
  if (!desig) return '';
  const match = desig.match(/\(([^)]+)\)/);
  return match ? match[1] : desig;
};

export const getFormattedDateList = (dates: string[]): string => {
  return [...dates]
    .sort()
    .map(d => {
      const [year, month, day] = d.split('-');
      return toBanglaDigits(`${day}-${month}-${year}`);
    })
    .join(', ');
};
