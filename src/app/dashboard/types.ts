export interface Holiday {
  date: string;
  name: string;
  isWorkingDay?: boolean;
}

export const MONTH_NAMES = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const WEEKDAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

// Days in each month of 2026
export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Start day of week (0 = Sunday, 1 = Monday, etc.) for each month in 2026:
// 2026-01-01 is a Thursday (4)
export const MONTH_START_DAYS = [4, 0, 0, 3, 5, 1, 3, 6, 2, 4, 0, 2];

export interface CalendarSlot {
  day: number | null;
  dateStr: string | null;
  isHoliday: boolean;
  holidayName: string | null;
  isWeekend: boolean;
}
