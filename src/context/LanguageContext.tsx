'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'bn' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, fallbackBn?: string, fallbackEn?: string) => string;
  formatNumber: (num: number | string) => string;
  formatMonthYear: (monthIndex: number, year?: number) => string;
  getWeekdays: (short?: boolean) => string[];
  matchesSearch: (query: string, targetBn?: string | null, targetEn?: string | null, extra?: string | null) => boolean;
}

const BANG_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WEEKDAYS_SHORT_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const WEEKDAYS_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const translations: Record<string, { bn: string; en: string }> = {
  // Navigation & Branding
  'app_title': { bn: 'লেট সিটিং, ছুটির দিনে ও রাত্রীকালীন ডিউটি পোর্টাল', en: 'Late Sitting, Holiday & Night Duty Portal' },
  'app_dept': { bn: 'অনলাইন ব্যাংকিং ডিপার্টমেন্ট', en: 'Online Banking Department' },
  'bank_name': { bn: 'জনতা ব্যাংক পিএলসি.', en: 'Janata Bank PLC' },
  'nav_dashboard': { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  'nav_analytics': { bn: 'অ্যানালিটিক্স', en: 'Analytics' },
  'nav_employees': { bn: 'কর্মকর্তাবৃন্দ', en: 'Employees' },
  'nav_roster': { bn: 'লেট হলি নাইট অর্ডার', en: 'Duty Orders & Roster' },
  'nav_billing': { bn: 'বিল প্রস্তুতকরণ', en: 'Bill Preparation' },
  'nav_lunch_bill': { bn: 'লাঞ্চ বিল শিট', en: 'Lunch Allowance Bills' },
  'nav_closing_bill': { bn: 'ক্লোজিং বিল শিট', en: 'Closing Bill Statements' },
  'nav_leave': { bn: 'ছুটির আবেদন', en: 'Leave Applications' },
  'nav_hardware': { bn: 'হার্ডওয়্যার রিকুইজিশন', en: 'Hardware Requisitions' },
  'nav_documents': { bn: 'আর্কাইভ ও বিল বিবরণী', en: 'Documents & Archive' },
  'nav_users': { bn: 'ব্যবহারকারী ও সেল সেটিংস', en: 'Users & Cell Settings' },
  'nav_cells': { bn: 'সেল উইনিটসমূহ', en: 'Cell Units' },
  'nav_trash': { bn: 'রিসাইকেল বিন', en: 'Recycle Bin' },
  'nav_executive': { bn: 'নির্বাহী প্যানেল', en: 'Executive Panel' },
  
  // Dashboard & Calendar Labels
  'dash_total_holidays': { bn: 'মোট সরকারি ছুটি', en: 'Total Public Holidays' },
  'dash_total_working_days': { bn: 'মোট কার্যদিবস', en: 'Total Working Days' },
  'dash_days_unit': { bn: 'টি', en: 'days' },
  'dash_workdays_unit': { bn: 'দিন', en: 'days' },
  'dash_select_duty_type': { bn: 'ডিউটির ধরণ সিলেক্ট করুন', en: 'Select Duty Type' },
  'dash_my_portal': { bn: 'আমার ব্যক্তিগত পোর্টাল', en: 'My Personal Portal' },
  'dash_quick_stats': { bn: 'ডিপার্টমেন্ট ওভারভিউ ও সামারি', en: 'Department Overview & Summary' },
  'dash_calendar_title': { bn: 'ডিউটি ক্যালেন্ডার ও ছুটির তালিকা', en: 'Duty Calendar & Holiday Schedule' },

  // Duty Types
  'duty_late_sitting': { bn: 'লেট সিটিং', en: 'Late Sitting' },
  'duty_holiday': { bn: 'হলিডে ডিউটি', en: 'Holiday Duty' },
  'duty_night_shift': { bn: 'নাইট শিফট', en: 'Night Shift' },

  // Action Buttons
  'btn_save': { bn: 'সংরক্ষণ করুন', en: 'Save Record' },
  'btn_cancel': { bn: 'বাতিল', en: 'Cancel' },
  'btn_delete': { bn: 'মুছে ফেলুন', en: 'Delete' },
  'btn_edit': { bn: 'সম্পাদনা করুন', en: 'Edit' },
  'btn_add_new': { bn: 'নতুন যোগ করুন', en: 'Add New' },
  'btn_print': { bn: 'প্রিন্ট করুন', en: 'Print Document' },
  'btn_download_pdf': { bn: 'ডাউনলোড পিডিএফ', en: 'Download PDF' },
  'btn_download_docx': { bn: 'ডাউনলোড ওয়ার্ড (.docx)', en: 'Download Word (.docx)' },
  'btn_search': { bn: 'সার্চ করুন...', en: 'Search...' },
  'btn_bulk_delete': { bn: 'নির্বাচিত গুলো মুছুন', en: 'Delete Selected' },
  'btn_archive': { bn: 'আর্কাইভ করুন', en: 'Archive' },

  // Table Headers
  'th_sl': { bn: 'ক্রমিক নং', en: 'SL No.' },
  'th_name': { bn: 'কর্মকর্তার নাম', en: 'Officer Name' },
  'th_designation': { bn: 'পদবী', en: 'Designation' },
  'th_bank_id': { bn: 'ব্যাংক আইডি', en: 'Bank ID' },
  'th_cell': { bn: 'সেল', en: 'Cell' },
  'th_mobile': { bn: 'মোবাইল নম্বর', en: 'Mobile No.' },
  'th_date': { bn: 'তারিখ', en: 'Date' },
  'th_total': { bn: 'মোট টাকা', en: 'Total Amount' },
  'th_status': { bn: 'স্ট্যাটাস', en: 'Status' },
  'th_action': { bn: 'অ্যাকশন', en: 'Action' },

  // Strict Designations
  'desig_spo': { bn: 'সিনিয়র প্রিন্সিপাল অফিসার', en: 'Senior Principal Officer' },
  'desig_po': { bn: 'প্রিন্সিপাল অফিসার', en: 'Principal Officer' },
  'desig_so': { bn: 'সিনিয়র অফিসার', en: 'Senior Officer' },
  'desig_off': { bn: 'অফিসার-আইটি', en: 'Officer (IT)' }
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'bn',
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string, fallbackBn?: string, fallbackEn?: string) => fallbackBn || key,
  formatNumber: (num: number | string) => num.toString(),
  formatMonthYear: (m: number, y?: number) => `${MONTH_NAMES_BN[m]} ${y || 2026}`,
  getWeekdays: () => WEEKDAYS_BN,
  matchesSearch: () => true
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('bn');

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Language;
    if (stored === 'bn' || stored === 'en') {
      setLangState(stored);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
    window.dispatchEvent(new Event('languageChange'));
  };

  const toggleLang = () => {
    const nextLang = lang === 'bn' ? 'en' : 'bn';
    setLang(nextLang);
  };

  const t = (key: string, fallbackBn?: string, fallbackEn?: string): string => {
    if (translations[key]) {
      return translations[key][lang];
    }
    if (lang === 'en' && fallbackEn) return fallbackEn;
    if (fallbackBn) return fallbackBn;
    return key;
  };

  const formatNumber = (num: number | string): string => {
    if (num === null || num === undefined) return '';
    const str = num.toString();
    if (lang === 'en') return str;
    return str.replace(/\d/g, (digit) => BANG_DIGITS[parseInt(digit, 10)]);
  };

  const formatMonthYear = (monthIndex: number, year: number = 2026): string => {
    const monthName = lang === 'en' ? MONTH_NAMES_EN[monthIndex] : MONTH_NAMES_BN[monthIndex];
    const yearStr = formatNumber(year);
    return `${monthName} ${yearStr}`;
  };

  const getWeekdays = (short: boolean = false): string[] => {
    if (lang === 'en') {
      return short ? WEEKDAYS_SHORT_EN : WEEKDAYS_EN;
    }
    return short ? WEEKDAYS_SHORT_BN : WEEKDAYS_BN;
  };

  const matchesSearch = (
    query: string, 
    targetBn?: string | null, 
    targetEn?: string | null, 
    extra?: string | null
  ): boolean => {
    if (!query || !query.trim()) return true;
    const q = query.trim().toLowerCase();
    const bn = (targetBn || '').toLowerCase();
    const en = (targetEn || '').toLowerCase();
    const ex = (extra || '').toLowerCase();
    return bn.includes(q) || en.includes(q) || ex.includes(q);
  };

  return (
    <LanguageContext.Provider value={{ 
      lang, 
      setLang, 
      toggleLang, 
      t, 
      formatNumber, 
      formatMonthYear, 
      getWeekdays,
      matchesSearch
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
