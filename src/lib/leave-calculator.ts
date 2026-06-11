export interface Holiday {
  id?: number;
  date: string;
  name: string;
  isWorkingDay: boolean;
}

export const DEFAULT_2026_HOLIDAYS = [
  { date: '2026-02-04', name: 'পবিত্র শবে বরাত' },
  { date: '2026-02-21', name: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস' },
  { date: '2026-03-17', name: 'পবিত্র শবে কদর' },
  { date: '2026-03-19', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-20', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-21', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-22', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-23', name: 'পবিত্র ঈদ-উল-ফিতর' },
  { date: '2026-03-26', name: 'স্বাধীনতা ও জাতীয় দিবস' },
  { date: '2026-04-14', name: 'বাংলা নববর্ষ (পহেলা বৈশাখ)' },
  { date: '2026-05-01', name: 'মে দিবস ও বুদ্ধ পূর্ণিমা' },
  { date: '2026-05-25', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-26', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-27', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-28', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-29', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-30', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-05-31', name: 'পবিত্র ঈদ-উল-আযহা' },
  { date: '2026-06-26', name: 'পবিত্র আশুরা' },
  { date: '2026-07-01', name: 'ব্যাংক ছুটির দিন (অর্ধ-বার্ষিকী)' },
  { date: '2026-08-05', name: 'জুলাই গণঅভ্যুত্থান দিবস' },
  { date: '2026-08-26', name: 'পবিত্র ঈদে মিলাদুন্নবী (সা.)' },
  { date: '2026-09-04', name: 'शुभ जन्माष्टमी' },
  { date: '2026-10-20', name: 'দূর্গাপূজা (মহা নবমী)' },
  { date: '2026-10-21', name: 'দূর্গাপূজা (বিজয়া দশমী)' },
  { date: '2026-12-16', name: 'বিজয় দিবস' },
  { date: '2026-12-25', name: 'যীশু খ্রীষ্টের জন্মদিন (বড় দিন)' },
  { date: '2026-12-31', name: 'ব্যাংক ছুটির দিন (বার্ষিকী)' },
];

export const isNonWorkingDay = (dateStr: string, dbHolidays: Holiday[] = []): boolean => {
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return false;

  // Friday (5) & Saturday (6) in Bangladesh
  const dayOfWeek = dateObj.getDay();
  let isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

  // Override specific default weekends
  if (dateStr === '2026-05-23') {
    isWeekend = false;
  }

  // Override from database holidays working override
  const dbHol = dbHolidays.find(h => h.date === dateStr);
  if (dbHol && dbHol.isWorkingDay) {
    return false;
  }

  // Check if in default holiday list or db holidays list with isWorkingDay === false
  const isPublicHoliday = DEFAULT_2026_HOLIDAYS.some(h => h.date === dateStr) || 
    dbHolidays.some(h => h.date === dateStr && !h.isWorkingDay);

  return isWeekend || isPublicHoliday;
};

export const getSucceedingContiguousHolidaysCount = (startDateStr: string, dbHolidays: Holiday[] = []): number => {
  let count = 0;
  const current = new Date(startDateStr);
  
  while (true) {
    current.setDate(current.getDate() + 1);
    const nextDateStr = current.toISOString().split('T')[0];
    if (isNonWorkingDay(nextDateStr, dbHolidays)) {
      count++;
    } else {
      break;
    }
  }
  return count;
};

export interface LeaveDetails {
  totalDays: number;
  isSandwiched: boolean;
  sandwichedCount: number;
  actualDeducted: number;
  details: string[];
}

export const getCalculatedLeaveDetails = (
  startDate: string,
  endDate: string,
  dbHolidays: Holiday[] = []
): LeaveDetails => {
  if (!startDate || !endDate) {
    return { totalDays: 0, isSandwiched: false, sandwichedCount: 0, actualDeducted: 0, details: [] };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    return { totalDays: 0, isSandwiched: false, sandwichedCount: 0, actualDeducted: 0, details: [] };
  }

  const allDates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    allDates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  // 1. Preceding Day check
  const precedingDate = new Date(start);
  precedingDate.setDate(precedingDate.getDate() - 1);
  const precedingStr = precedingDate.toISOString().split('T')[0];
  const isPrecedingHoliday = isNonWorkingDay(precedingStr, dbHolidays);

  // 2. Succeeding Day check
  const succeedingDate = new Date(end);
  succeedingDate.setDate(succeedingDate.getDate() + 1);
  const succeedingStr = succeedingDate.toISOString().split('T')[0];
  const isSucceedingHoliday = isNonWorkingDay(succeedingStr, dbHolidays);

  // 3. Sandwiched check: block is sandwiched between preceding & succeeding holiday
  const isSandwiched = isPrecedingHoliday && isSucceedingHoliday;
  const succeedingHolidaysCount = isSandwiched ? getSucceedingContiguousHolidaysCount(endDate, dbHolidays) : 0;

  const calendarDaysCount = allDates.length;
  const workingDaysSelected = allDates.filter(d => !isNonWorkingDay(d, dbHolidays)).length;

  // Apply rule:
  // If sandwiched, count = total calendar days in block + succeeding holidays count.
  // If not sandwiched, count = number of working days selected.
  let actualDeducted = 0;
  if (isSandwiched) {
    actualDeducted = calendarDaysCount + succeedingHolidaysCount;
  } else {
    actualDeducted = workingDaysSelected;
  }

  return {
    totalDays: calendarDaysCount,
    isSandwiched,
    sandwichedCount: succeedingHolidaysCount,
    actualDeducted,
    details: allDates
  };
};
