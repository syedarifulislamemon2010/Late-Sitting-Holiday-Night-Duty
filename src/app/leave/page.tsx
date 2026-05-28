'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { 
  CalendarCheck, 
  Printer, 
  ArrowLeft, 
  User, 
  Settings,
  CalendarRange,
  Info
} from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  cellId: number;
  cell?: {
    id: number;
    name: string;
  };
}

interface Holiday {
  date: string;
  name: string;
  isWorkingDay: boolean;
}

const DEFAULT_2026_HOLIDAYS = [
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
  { date: '2026-09-04', name: 'শুভ জন্মাষ্টমী' },
  { date: '2026-10-20', name: 'দূর্গাপূজা (মহা নবমী)' },
  { date: '2026-10-21', name: 'দূর্গাপূজা (বিজয়া দশমী)' },
  { date: '2026-12-16', name: 'বিজয় দিবস' },
  { date: '2026-12-25', name: 'যীশু খ্রীষ্টের জন্মদিন (বড় দিন)' },
  { date: '2026-12-31', name: 'ব্যাংক ছুটির দিন (বার্ষিকী)' },
];

// Bangladesh cascading location database
const BANGLADESH_AREAS = {
  'ঢাকা': {
    districts: {
      'ঢাকা': {
        hasCityCorp: true,
        thanas: [],
        postOffices: []
      },
      'গাজীপুর': {
        thanas: ['গাজীপুর সদর', 'কালিয়াকৈর', 'শ্রীপুর', 'কালীগঞ্জ', 'কাপাসিয়া'],
        postOffices: ['গাজীপুর সদর', 'কালিয়াকৈর', 'শ্রীপুর', 'কালীগঞ্জ', 'কাপাসিয়া']
      },
      'নারায়ণগঞ্জ': {
        thanas: ['নারায়ণগঞ্জ সদর', 'বন্দর', 'আড়াইহাজার', 'রূপগঞ্জ', 'সোনারগাঁও'],
        postOffices: ['নারায়ণগঞ্জ সদর', 'বন্দর', 'আড়াইহাজার', 'রূপগঞ্জ', 'সোনারগাঁও']
      },
      'টাঙ্গাইল': {
        thanas: ['টাঙ্গাইল সদর', 'মির্জাপুর', 'কালিহাতী', 'ঘাটাইল', 'মধুপুর'],
        postOffices: ['টাঙ্গাইল সদর', 'মির্জাপুর', 'কালিহাতী', 'ঘাটাইল', 'মধুপুর']
      }
    }
  },
  'চট্টগ্রাম': {
    districts: {
      'চট্টগ্রাম': {
        thanas: ['কোতোয়ালী', 'ডবলমুরিং', 'পাঁচলাইশ', 'হালিশহর', 'পতেঙ্গা', 'হাটহাজারী'],
        postOffices: ['চট্টগ্রাম জিপিও', 'বন্দর', 'পতেঙ্গা', 'হাটহাজারী']
      },
      'কুমিল্লা': {
        thanas: ['কুমিল্লা সদর', 'চৌদ্দগ্রাম', 'লাকসাম', 'দাউদকান্দি', 'বরুড়া'],
        postOffices: ['কুমিল্লা সদর', 'চৌদ্দগ্রাম', 'লাকসাম', 'দাউদকান্দি']
      },
      'কক্সবাজার': {
        thanas: ['কক্সবাজার সদর', 'উখিয়া', 'টেকনাফ', 'রামু', 'চকরিয়া'],
        postOffices: ['কক্সবাজার সদর', 'উখিয়া', 'টেকনাফ', 'রামু']
      }
    }
  },
  'রাজশাহী': {
    districts: {
      'রাজশাহী': {
        thanas: ['বোয়الية', 'রাজপাড়া', 'মতিহার', 'শাহ মখদুম', 'পবা'],
        postOffices: ['রাজশাহী জিপিও', 'পবা']
      },
      'বগুড়া': {
        thanas: ['বগুড়া সদর', 'শাজাহানপুর', 'শেরপুর', 'গাবতলী', 'শিবগঞ্জ'],
        postOffices: ['বগুড়া সদর', 'শেরপুর', 'শিবগঞ্জ']
      }
    }
  },
  'খুলনা': {
    districts: {
      'খুলনা': {
        thanas: ['খুলনা সদর', 'দৌলতপুর', 'খালিশপুর', 'রূপসা', 'ডুমুরিয়া'],
        postOffices: ['খুলনা জিপিও', 'রূপসা']
      },
      'যশোর': {
        thanas: ['যশোর সদর', 'ঝিকরগাছা', 'শার্শা', 'চৌগাছা', 'কেশবপুর'],
        postOffices: ['যশোর সদর', 'শার্শা']
      }
    }
  },
  'বরিশাল': {
    districts: {
      'বরিশাল': {
        thanas: ['বরিশাল সদর', 'বাকেরগঞ্জ', 'বাবুগঞ্জ', 'উজিরপুর', 'গৌরনদী'],
        postOffices: ['বরিশাল জিপিও', 'গৌরনদী']
      }
    }
  },
  'সিলেট': {
    districts: {
      'সিলেট': {
        thanas: ['সিলেট সদর', 'বিয়ানীবাজার', 'গোলাপগঞ্জ', 'কানাইঘাট', 'জৈন্তাপুর'],
        postOffices: ['সিলেট জিপিও', 'বিয়ানীবাজার']
      },
      'মৌলভীবাজার': {
        thanas: ['মৌলভীবাজার সদর', 'শ্রীমঙ্গল', 'কুলাউড়া', 'কমলগঞ্জ'],
        postOffices: ['মৌলভীবাজার সদর', 'শ্রীমঙ্গল']
      }
    }
  },
  'রংপুর': {
    districts: {
      'রংপুর': {
        thanas: ['রংপুর সদর', 'মিঠাপুকুর', 'পীরগঞ্জ', 'বদরগঞ্জ', 'কাউনিয়া'],
        postOffices: ['রংপুর জিপিও', 'পীরগঞ্জ']
      }
    }
  },
  'ময়মনসিংহ': {
    districts: {
      'ময়মনসিংহ': {
        thanas: ['ময়মনসিংহ সদর', 'মুক্তাগাছা', 'ত্রিশাল', 'ভালুকা', 'গফরগাঁও'],
        postOffices: ['ময়মনসিংহ সদর', 'ত্রিশাল', 'ভালুকা']
      }
    }
  }
};

export default function LeaveGeneratorPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [matchedEmp, setMatchedEmp] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dbHolidays, setDbHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  // Leave Form States
  const [leaveType, setLeaveType] = useState<'CASUAL' | 'POST_FACTO' | 'STATION_LEAVE'>('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applicationDate, setApplicationDate] = useState('');
  
  // Custom applicant details
  const [applicantName, setApplicantName] = useState('');
  const [designation, setDesignation] = useState('');
  const [bankId, setBankId] = useState('');
  const [fileNo, setFileNo] = useState('');
  const [cellName, setCellName] = useState('অনলাইন ব্যাংকিং ডিপার্টমেন্ট');
  const [leaveLocation, setLeaveLocation] = useState('ঢাকা');
  const [mobileNo, setMobileNo] = useState('০১৬৭৪০৫৭৫২৯');

  // Cascading Location States
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCityCorp, setSelectedCityCorp] = useState('');
  const [selectedThana, setSelectedThana] = useState('');
  const [selectedPostOffice, setSelectedPostOffice] = useState('');

  // Duty delegate officer
  const [delegateId, setDelegateId] = useState<string>('');
  
  // Leaves Table Balance Sheet States (Editable inputs)
  const [casualTotal, setCasualTotal] = useState(20);
  const [casualUsed, setCasualUsed] = useState(9);
  
  const [ordinaryTotal, setOrdinaryTotal] = useState(120);
  const [ordinaryUsed, setOrdinaryUsed] = useState(0);

  const [specialTotal, setSpecialTotal] = useState(47);
  const [specialUsed, setSpecialUsed] = useState(0);

  // Initialize application date to today
  useEffect(() => {
    const today = new Date();
    const formatted = today.toISOString().split('T')[0];
    setApplicationDate(formatted);
  }, []);

  // Fetch initial profile & data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [authRes, empsRes, holidaysRes] = await Promise.all([
          fetch('/api/auth'),
          fetch('/api/employees'),
          fetch('/api/holidays')
        ]);

        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.authenticated) {
            setCurrentUser(authData.user);
            setApplicantName(authData.user.name || '');
            setBankId(authData.user.username || '');
            
            if (empsRes.ok) {
              const empsData = await empsRes.json();
              setEmployees(Array.isArray(empsData) ? empsData : []);
              
              // Find matching employee to load designation, file number, and cell id
              const matched = empsData.find((e: Employee) => 
                e.bankId && e.bankId.trim().toLowerCase() === authData.user.username.trim().toLowerCase()
              );
              if (matched) {
                setMatchedEmp(matched);
                setDesignation(matched.designation);
                if (matched.fileNo) {
                  setFileNo(matched.fileNo);
                }
              }
            }
          }
        }

        if (holidaysRes.ok) {
          const holData = await holidaysRes.json();
          setDbHolidays(Array.isArray(holData) ? holData : []);
        }
      } catch (err) {
        console.error('Error fetching initial leave data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Format YYYY-MM-DD date to DD/MM/YYYY
  const toDisplayDateStr = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${toBanglaDigits(parts[2])}/${toBanglaDigits(parts[1])}/${toBanglaDigits(parts[0])}`;
  };

  // Convert numbers to Bengali digits
  const toBanglaDigits = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  // Map digits to Bengali written words
  const getBanglaDayWord = (num: number): string => {
    const wordsLookup: Record<number, string> = {
      1: '০১ (এক)', 2: 'দুই (০২)', 3: 'তিন (০৩)', 4: 'চার (০৪)', 5: 'পাঁচ (০৫)',
      6: 'ছয় (০৬)', 7: 'সাত (০৭)', 8: 'আট (০৮)', 9: 'নয় (০৯)', 10: 'দশ (১০)',
      11: 'এগারো (১১)', 12: 'বারো (১২)', 13: 'তেরো (১৩)', 14: 'চৌদ্দ (১৪)', 15: 'পনেরো (১৫)',
      16: 'ষোল (১৬)', 17: 'সতেরো (১৭)', 18: 'আঠারো (১৮)', 19: 'উনিশ (১৯)', 20: 'বিশ (২০)',
      21: 'একুশ (২১)', 22: 'বাইশ (২২)', 23: 'তেইশ (২৩)', 24: 'চব্বিশ (২৪)', 25: 'পঁচিশ (২৫)',
      26: 'ছাব্বিশ (২৬)', 27: 'সাতাশ (২৭)', 28: 'আটাশ (২৮)', 29: 'ঊনত্রিশ (২৯)', 30: 'ত্রিশ (৩০)'
    };
    return wordsLookup[num] || `${toBanglaDigits(num)} (${num})`;
  };

  // Date Check logic: public holiday or weekend
  const isNonWorkingDay = (dateStr: string): boolean => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return false;

    const dayOfWeek = dateObj.getDay();
    let isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    if (dateStr === '2026-05-23') {
      isWeekend = false;
    }

    const dbHol = dbHolidays.find(h => h.date === dateStr);
    if (dbHol && dbHol.isWorkingDay) {
      return false;
    }

    const isPublicHoliday = DEFAULT_2026_HOLIDAYS.some(h => h.date === dateStr) || 
      dbHolidays.some(h => h.date === dateStr && !h.isWorkingDay);

    return isWeekend || isPublicHoliday;
  };

  // Get contiguous holiday days starting from a specific date forward
  const getSucceedingContiguousHolidaysCount = (startDateStr: string): number => {
    let count = 0;
    let current = new Date(startDateStr);
    
    while (true) {
      current.setDate(current.getDate() + 1);
      const nextDateStr = current.toISOString().split('T')[0];
      if (isNonWorkingDay(nextDateStr)) {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  // Leave calculation based on working days and Sandwich Leave rules
  const getCalculatedLeaveDetails = () => {
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

    // Preceding Day check
    const precedingDate = new Date(start);
    precedingDate.setDate(precedingDate.getDate() - 1);
    const precedingStr = precedingDate.toISOString().split('T')[0];
    const isPrecedingHoliday = isNonWorkingDay(precedingStr);

    // Succeeding Day check
    const succeedingDate = new Date(end);
    succeedingDate.setDate(succeedingDate.getDate() + 1);
    const succeedingStr = succeedingDate.toISOString().split('T')[0];
    const isSucceedingHoliday = isNonWorkingDay(succeedingStr);

    const isSandwiched = isPrecedingHoliday && isSucceedingHoliday;
    const succeedingHolidaysCount = isSandwiched ? getSucceedingContiguousHolidaysCount(endDate) : 0;

    let calendarDaysCount = allDates.length;
    let workingDaysSelected = allDates.filter(d => !isNonWorkingDay(d)).length;

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

  const leaveDetails = getCalculatedLeaveDetails();

  // Handle Dynamic changes on leave type (adjust date picker limits)
  const todayStr = new Date().toISOString().split('T')[0];
  const dateLimits = {
    min: (leaveType === 'CASUAL' || leaveType === 'STATION_LEAVE') ? todayStr : undefined,
    max: leaveType === 'POST_FACTO' ? todayStr : undefined
  };

  // Automatically reset invalid dates when type changes
  useEffect(() => {
    if (startDate) {
      if (leaveType === 'POST_FACTO' && startDate > todayStr) {
        setStartDate('');
        setEndDate('');
      } else if ((leaveType === 'CASUAL' || leaveType === 'STATION_LEAVE') && startDate < todayStr) {
        setStartDate('');
        setEndDate('');
      }
    }
  }, [leaveType]);

  // Dynamically calculate remaining leaves
  const isCasualLeaveSelected = ['CASUAL', 'POST_FACTO', 'STATION_LEAVE'].includes(leaveType);
  const currentCasualUsed = casualUsed + (isCasualLeaveSelected ? leaveDetails.actualDeducted : 0);
  const currentCasualRemaining = Math.max(0, casualTotal - currentCasualUsed);

  const currentOrdinaryRemaining = Math.max(0, ordinaryTotal - ordinaryUsed);
  const currentSpecialRemaining = Math.max(0, specialTotal - specialUsed);

  // Filter Covering Officers: Restricted strictly to the same cell, excluding the applicant themselves
  const eligibleCoveringOfficers = employees.filter((emp: Employee) => {
    if (!matchedEmp) return true; // Show all as fallback if current user not resolved
    return emp.cellId === matchedEmp.cellId && emp.bankId?.trim().toLowerCase() !== matchedEmp.bankId?.trim().toLowerCase();
  });

  const matchedDelegate = eligibleCoveringOfficers.find(e => String(e.id) === delegateId);
  const delegateName = matchedDelegate ? matchedDelegate.name : 'আব্দুল্লাহ আল জোবায়ের';
  const delegateDesignation = matchedDelegate ? matchedDelegate.designation : 'এসও-আইটি';

  // Format stay location dynamic text
  const formatStayLocationText = () => {
    const parts: string[] = [];
    if (selectedDivision) parts.push(selectedDivision);
    if (selectedDistrict && selectedDistrict !== selectedDivision) parts.push(selectedDistrict);
    if (selectedCityCorp) parts.push(selectedCityCorp);
    if (selectedThana) parts.push(selectedThana);
    if (selectedPostOffice) parts.push(selectedPostOffice);
    return parts.length > 0 ? parts.join(', ') : leaveLocation;
  };

  // Cascading helpers for thanas and post offices
  const getThanasForSelect = (): string[] => {
    if (!selectedDivision || !selectedDistrict) return [];
    
    if (selectedDistrict === 'ঢাকা') {
      if (selectedCityCorp === 'ঢাকা উত্তর') {
        return ['উত্তরা', 'গুলশান', 'মিরপুর', 'বাড্ডা', 'মোহাম্মদপুর', 'খিলক্ষেত'];
      }
      if (selectedCityCorp === 'ঢাকা দক্ষিণ') {
        return ['মতিঝিল', 'ধানমণ্ডি', 'রমনা', 'চকবাজার', 'লালবাগ', 'পল্টন', 'কামরাঙ্গীরচর'];
      }
      return [];
    }

    const distInfo = (BANGLADESH_AREAS[selectedDivision as keyof typeof BANGLADESH_AREAS]?.districts as any)?.[selectedDistrict];
    return distInfo ? distInfo.thanas : [];
  };

  const getPostOfficesForSelect = (): string[] => {
    if (!selectedDivision || !selectedDistrict) return [];
    
    if (selectedDistrict === 'ঢাকা') {
      if (selectedCityCorp === 'ঢাকা উত্তর') {
        return ['উত্তরা মডেল টাউন', 'গুলশান মডেল টাউন', 'মিরপুর সেকশন ১২', 'বাড্ডা পোস্ট অফিস', 'মোহাম্মদপুর পোস্ট অফিস'];
      }
      if (selectedCityCorp === 'ঢাকা দক্ষিণ') {
        return ['জিপিও ঢাকা', 'মতিঝিল কমার্শিয়াল এরিয়া', 'লালবাগ পোস্ট অফিস', 'ধানমণ্ডি পোস্ট অফিস', 'রমনা পোস্ট অফিস'];
      }
      return [];
    }

    const distInfo = (BANGLADESH_AREAS[selectedDivision as keyof typeof BANGLADESH_AREAS]?.districts as any)?.[selectedDistrict];
    return distInfo ? distInfo.postOffices : [];
  };

  // Format Subject
  const formatSubject = () => {
    const daysWord = getBanglaDayWord(leaveDetails.actualDeducted);
    switch (leaveType) {
      case 'CASUAL':
        return `বিষয়ঃ ${daysWord} দিনের নৈমিত্তিক ছুটি মঞ্জুরির আবেদন।`;
      case 'POST_FACTO':
        return `বিষয়ঃ ${daysWord} দিনের ঘটনাত্তোর নৈমিত্তিক ছুটির জন্য আবেদন।`;
      case 'STATION_LEAVE':
        return `বিষয়ঃ ${daysWord} দিনের কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটির জন্য আবেদন।`;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AuthGuard>
      <div className="space-y-6 pb-12 font-sans">
        {/* Header section */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-wide flex items-center gap-3">
              <CalendarCheck className="text-indigo-650" size={28} />
              ছুটি আবেদন (Leave Application)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
              নৈমিত্তিক ছুটি, ঘটনাত্তোর ছুটি ও কর্মস্থল ত্যাগের অনুমতিসহ ছুটির দরখাস্ত তৈরি ও প্রিন্ট করার আধুনিক প্যানেল।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-55 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm">
              <ArrowLeft size={14} />
              ড্যাশবোর্ড
            </Link>

            <button
              onClick={handlePrint}
              disabled={leaveDetails.actualDeducted === 0}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <Printer size={14} />
              প্রিন্ট করুন
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="no-print flex flex-col items-center justify-center py-24 space-y-3 glass-card rounded-2xl">
            <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">প্রয়োজনীয় তথ্যসমূহ লোড হচ্ছে...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: Leaf Generator Settings Form */}
            <div className="no-print xl:col-span-4 space-y-6">
              
              {/* Box 1: applicant information */}
              <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                  <User size={16} className="text-indigo-650" />
                  আবেদনকারীর তথ্য
                </h3>

                <div className="space-y-3.5 text-xs font-sans">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">নাম:</label>
                    <input 
                      type="text" 
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-550 font-bold"
                    />
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">পদবী:</label>
                    <input 
                      type="text" 
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-550 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Bank ID */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">ব্যাংক আইডি:</label>
                      <input 
                        type="text" 
                        value={bankId}
                        onChange={(e) => setBankId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-550 font-mono font-semibold"
                      />
                    </div>

                    {/* File No */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">নথি নম্বর:</label>
                      <input 
                        type="text" 
                        value={fileNo}
                        onChange={(e) => setFileNo(e.target.value)}
                        placeholder="যেমন: এসও (কম)-১৪৫১৯"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-550 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Mobile No */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">মোবাইল নম্বর:</label>
                    <input 
                      type="text" 
                      value={mobileNo}
                      onChange={(e) => setMobileNo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-550 font-mono font-semibold"
                    />
                  </div>

                  {/* Cascading Location Section */}
                  <div className="space-y-2.5 border-t border-slate-100 pt-3">
                    <label className="font-bold text-slate-500 text-xs block">ছুটিতে থাকাকালীন অবস্থান:</label>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* Division select */}
                      <div className="space-y-0.5">
                        <label className="text-[10px] text-slate-400 font-bold">বিভাগ:</label>
                        <select
                          value={selectedDivision}
                          onChange={(e) => {
                            const div = e.target.value;
                            setSelectedDivision(div);
                            setSelectedDistrict('');
                            setSelectedCityCorp('');
                            setSelectedThana('');
                            setSelectedPostOffice('');
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                        >
                          <option value="">বিভাগ সিলেক্ট করুন...</option>
                          {Object.keys(BANGLADESH_AREAS).map(div => (
                            <option key={div} value={div}>{div}</option>
                          ))}
                        </select>
                      </div>

                      {/* District select */}
                      <div className="space-y-0.5">
                        <label className="text-[10px] text-slate-400 font-bold">জেলা:</label>
                        <select
                          value={selectedDistrict}
                          disabled={!selectedDivision}
                          onChange={(e) => {
                            const dist = e.target.value;
                            setSelectedDistrict(dist);
                            setSelectedCityCorp('');
                            setSelectedThana('');
                            setSelectedPostOffice('');
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none disabled:opacity-50"
                        >
                          <option value="">জেলা সিলেক্ট করুন...</option>
                          {selectedDivision && Object.keys(BANGLADESH_AREAS[selectedDivision as keyof typeof BANGLADESH_AREAS].districts).map(dist => (
                            <option key={dist} value={dist}>{dist}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* City Corporation select (Only for Dhaka District) */}
                    {selectedDistrict === 'ঢাকা' && (
                      <div className="space-y-0.5 animate-fade-in">
                        <label className="text-[10px] text-slate-400 font-bold">সিটি কর্পোরেশন:</label>
                        <select
                          value={selectedCityCorp}
                          onChange={(e) => {
                            const cc = e.target.value;
                            setSelectedCityCorp(cc);
                            setSelectedThana('');
                            setSelectedPostOffice('');
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                        >
                          <option value="">সিটি কর্পোরেশন সিলেক্ট করুন...</option>
                          <option value="ঢাকা উত্তর">ঢাকা উত্তর</option>
                          <option value="ঢাকা দক্ষিণ">ঢাকা দক্ষিণ</option>
                        </select>
                      </div>
                    )}

                    {/* Thana and Post Office select */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Thana select */}
                      <div className="space-y-0.5">
                        <label className="text-[10px] text-slate-400 font-bold">থানা / উপজেলা:</label>
                        <select
                          value={selectedThana}
                          disabled={!selectedDistrict || (selectedDistrict === 'ঢাকা' && !selectedCityCorp)}
                          onChange={(e) => {
                            setSelectedThana(e.target.value);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none disabled:opacity-50"
                        >
                          <option value="">থানা সিলেক্ট করুন...</option>
                          {getThanasForSelect().map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Post Office select */}
                      <div className="space-y-0.5">
                        <label className="text-[10px] text-slate-400 font-bold">ডাকঘর (পোস্ট অফিস):</label>
                        <select
                          value={selectedPostOffice}
                          disabled={!selectedDistrict || (selectedDistrict === 'ঢাকা' && !selectedCityCorp)}
                          onChange={(e) => {
                            setSelectedPostOffice(e.target.value);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none disabled:opacity-50"
                        >
                          <option value="">ডাকঘর সিলেক্ট করুন...</option>
                          {getPostOfficesForSelect().map(po => (
                            <option key={po} value={po}>{po}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Box 2: leave settings */}
              <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                  <CalendarRange size={16} className="text-indigo-650" />
                  ছুটির তথ্য ও সময়কাল
                </h3>

                <div className="space-y-3.5 text-xs font-sans">
                  {/* Leave Type */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">আবেদনের ধরণ:</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-550 font-bold"
                    >
                      <option value="CASUAL">ক) নৈমিত্তিক ছুটি</option>
                      <option value="POST_FACTO">খ) ঘটনাত্তোর নৈমিত্তিক ছুটি</option>
                      <option value="STATION_LEAVE">গ) কর্মস্থল ত্যাগের অনুমতি সহ নৈমিত্তিক ছুটি</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Start Date */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">শুরুর তারিখ:</label>
                      <input 
                        type="date" 
                        value={startDate}
                        min={dateLimits.min}
                        max={dateLimits.max}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-550 font-semibold"
                        required
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">শেষের তারিখ:</label>
                      <input 
                        type="date" 
                        value={endDate}
                        min={startDate || dateLimits.min}
                        max={dateLimits.max}
                        disabled={!startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-550 font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Application Date Picker */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">আবেদনের তারিখ (চিঠির উপরে প্রদর্শিত হবে):</label>
                    <input 
                      type="date" 
                      value={applicationDate}
                      onChange={(e) => setApplicationDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-550 font-semibold"
                    />
                  </div>

                  {/* Delegate Officer dropdown */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">ছুটিতে দায়িত্ব পালনকারী কর্মকর্তা:</label>
                    <select
                      value={delegateId}
                      onChange={(e) => setDelegateId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-550 font-bold"
                    >
                      <option value="">দায়িত্বপ্রাপ্ত কর্মকর্তা নির্বাচন করুন...</option>
                      {eligibleCoveringOfficers.map((emp: Employee) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.designation})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Box 3: editable balance grid */}
              <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Settings size={16} className="text-indigo-650" />
                  ছুটির ব্যালেন্স শিট এডিটর
                </h3>

                <div className="space-y-3.5 text-xs font-sans">
                  {/* Row 1 Casual leaves config */}
                  <div className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl space-y-2">
                    <p className="font-extrabold text-indigo-900">নৈমিত্তিক ছুটি ব্যালেন্স:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold">প্রাপ্তব্য:</label>
                        <input 
                          type="number" 
                          value={casualTotal}
                          onChange={(e) => setCasualTotal(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-2 py-1 border border-slate-200 rounded outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold">ভোগকৃত (আগের):</label>
                        <input 
                          type="number" 
                          value={casualUsed}
                          onChange={(e) => setCasualUsed(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-2 py-1 border border-slate-200 rounded outline-none font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2 Earned leaves config */}
                  <div className="p-3 bg-teal-50/20 border border-teal-100 rounded-xl space-y-2">
                    <p className="font-extrabold text-teal-900">সাধারণ ছুটি ব্যালেন্স:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold">প্রাপ্তব্য:</label>
                        <input 
                          type="number" 
                          value={ordinaryTotal}
                          onChange={(e) => setOrdinaryTotal(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-2 py-1 border border-slate-200 rounded outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold">ভোগকৃত:</label>
                        <input 
                          type="number" 
                          value={ordinaryUsed}
                          onChange={(e) => setOrdinaryUsed(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-2 py-1 border border-slate-200 rounded outline-none font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3 Special leaves config */}
                  <div className="p-3 bg-purple-50/20 border border-purple-100 rounded-xl space-y-2">
                    <p className="font-extrabold text-purple-900">বিশেষ ছুটি ব্যালেন্স:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold">প্রাপ্তব্য:</label>
                        <input 
                          type="number" 
                          value={specialTotal}
                          onChange={(e) => setSpecialTotal(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-2 py-1 border border-slate-200 rounded outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold">ভোগকৃত:</label>
                        <input 
                          type="number" 
                          value={specialUsed}
                          onChange={(e) => setSpecialUsed(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-2 py-1 border border-slate-200 rounded outline-none font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 4: sandwich leave details display */}
              {leaveDetails.actualDeducted > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-amber-900 text-xs flex items-center gap-1">
                    <Info size={14} />
                    ছুটি হিসাব বিবরণী (Sandwich Rule 적용):
                  </h4>
                  <div className="text-[11px] text-amber-800 font-medium space-y-1">
                    <p>• মোট ক্যালেন্ডার দিন: <span className="font-bold">{toBanglaDigits(leaveDetails.totalDays)} দিন</span></p>
                    <p>• অডিট টাইপ: <span className="font-bold">{leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : 'আগাম নৈমিত্তিক'}</span></p>
                    <p>• স্যান্ডউইচ পরিস্থিতি: <span className="font-bold">{leaveDetails.isSandwiched ? 'হ্যাঁ (ছুটির মাঝখানে Sandwich হয়েছে)' : 'না'}</span></p>
                    {leaveDetails.isSandwiched && (
                      <p className="text-rose-600 font-bold">• ছুটি পরবর্তী বন্ধের দিন (+{toBanglaDigits(leaveDetails.sandwichedCount)} দিন) মূল ছুটির সাথে যুক্ত করা হয়েছে।</p>
                    )}
                    <div className="h-px bg-amber-250 my-1.5" />
                    <p className="text-xs font-bold text-slate-800">কাটা যাওয়ার জন্য মোট হিসাবকৃত দিন: <span className="text-indigo-700 text-sm font-extrabold">{toBanglaDigits(leaveDetails.actualDeducted)} দিন</span></p>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT: Pixel-Perfect Legal Document Sheet Preview */}
            <div className="xl:col-span-8 flex justify-center pb-8">
              
              {/* Container of simulated sheet */}
              <div 
                id="printable-leave-sheet" 
                className="w-[216mm] min-h-[356mm] bg-white text-black p-[20mm] border border-slate-200 dark:border-slate-800 rounded-3xl print:border-none print:rounded-none print:shadow-none shadow-[0_15px_50px_rgba(0,0,0,0.08)] relative flex flex-col justify-between"
                style={{ contentVisibility: 'auto' }}
              >
                
                {/* 1. Header (Date + Leaves Table) */}
                <div className="flex justify-between items-start leading-tight">
                  {/* Left block (Date and To address) */}
                  <div className="space-y-4 pt-1 text-xs">
                    <p className="text-black">
                      তারিখ: {toDisplayDateStr(applicationDate)} ইং
                    </p>
                    <div className="space-y-0.5 text-black text-xs">
                      <p>উপ-মহাব্যবস্থাপক</p>
                      <p>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
                      <p>জনতা ব্যাংক পিএলসি,</p>
                      <p>প্রধান কার্যালয়, ঢাকা।</p>
                    </div>
                  </div>

                  {/* Right block: Leaves Balance Table */}
                  <div className="w-[85mm] border border-black p-1 text-[10px] bg-white text-black">
                    <div className="text-center pb-1 text-[10px]">
                      ২০২৬ সালের ছুটির বিবরণ
                    </div>
                    <table className="w-full text-center border-collapse border border-black">
                      <thead>
                        <tr className="bg-slate-50 border-b border-black">
                          <th className="border border-black px-1.5 py-0.5 w-[12mm]">ক্র.নং</th>
                          <th className="border border-black px-1.5 py-0.5">ছুটির ধরণ</th>
                          <th className="border border-black px-1 py-0.5 w-[14mm]">প্রাপ্তব্য</th>
                          <th className="border border-black px-1 py-0.5 w-[14mm]">ভোগকৃত</th>
                          <th className="border border-black px-1 py-0.5 w-[14mm]">অবশিষ্ট</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="border border-black px-1 py-0.5">০১.</td>
                          <td className="border border-black px-1.5 py-0.5 text-left">নৈমিত্তিক ছুটি</td>
                          <td className="border border-black px-1 py-0.5">{toBanglaDigits(casualTotal)}</td>
                          <td className="border border-black px-1 py-0.5">{toBanglaDigits(currentCasualUsed)}</td>
                          <td className="border border-black px-1 py-0.5">{toBanglaDigits(currentCasualRemaining)}</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="border border-black px-1 py-0.5">০২.</td>
                          <td className="border border-black px-1.5 py-0.5 text-left">সাধারণ ছুটি</td>
                          <td className="border border-black px-1 py-0.5">{toBanglaDigits(ordinaryTotal)}</td>
                          <td className="border border-black px-1 py-0.5">{toBanglaDigits(ordinaryUsed)}</td>
                          <td className="border border-black px-1 py-0.5">{toDisplayOrDash(currentOrdinaryRemaining)}</td>
                        </tr>
                        <tr>
                          <td className="border border-black px-1 py-0.5">০৩.</td>
                          <td className="border border-black px-1.5 py-0.5 text-left">বিশেষ ছুটি</td>
                          <td className="border border-black px-1 py-0.5">
                            <input 
                              type="number" 
                              value={specialTotal}
                              onChange={(e) => setSpecialTotal(parseInt(e.target.value, 10) || 0)}
                              className="w-full text-center outline-none"
                            />
                          </td>
                          <td className="border border-black px-1 py-0.5">{toDisplayOrDash(specialUsed)}</td>
                          <td className="border border-black px-1 py-0.5">{toDisplayOrDash(currentSpecialRemaining)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. SUBJECT */}
                <div className="mt-2">
                  <p className="text-black text-xs font-normal pb-0.5 w-fit">
                    {leaveDetails.actualDeducted > 0 ? formatSubject() : 'বিষয়ঃ নৈমিত্তিক ছুটি মঞ্জুরির আবেদন।'}
                  </p>
                </div>

                {/* 3. LETTER BODY */}
                <div className="mt-1.5 text-xs text-black leading-relaxed font-normal text-justify space-y-2">
                  <p className="font-normal text-xs">প্রিয় মহোদয়,</p>
                  
                  <p className="text-black indent-12 text-xs font-normal">
                    যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, ব্যক্তিগত ও পারিবারিক জরুরি প্রয়োজনে আমার আগামী <span className="border-b border-black px-1 font-normal">{startDate ? toDisplayDateStr(startDate) : '______'}</span> ইং তারিখ হতে <span className="border-b border-black px-1 font-normal">{endDate ? toDisplayDateStr(endDate) : '______'}</span> ইং তারিখ পর্যন্ত মোট <span className="border-b border-black px-1 font-normal">{leaveDetails.actualDeducted > 0 ? getBanglaDayWord(leaveDetails.actualDeducted) : '_______'}</span> দিনের নৈমিত্তিক ছুটির প্রয়োজন।
                  </p>

                  <p className="text-black text-xs leading-relaxed font-normal">
                    উল্লেখ্য যে, আমি ছুটিতে থাকাকালীন, অত্র ডিপার্টমেন্টের জনাব <span className="border-b border-black px-1 font-normal">{delegateName}</span>, <span className="border-b border-black px-1 font-normal">{delegateDesignation}</span> তার নিজ দায়িত্বের অতিরিক্ত হিসেবে আমার দায়িত্ব পালন করবেন।
                  </p>

                  <p className="text-black text-xs leading-relaxed font-normal">
                    অতএব মহোদয় সমীপে আবেদন যে, আমার অনুকূলে উক্ত <span className="border-b border-black px-1 font-normal">{leaveDetails.actualDeducted > 0 ? getBanglaDayWord(leaveDetails.actualDeducted) : '_______'}</span> দিনের নৈমিত্তিক ছুটি মঞ্জুরীর অনুমতি দান করে বাধিত করবেন।
                  </p>
                </div>

                {/* 4. SIGNATURE CARD SUMMARY */}
                <div className="mt-2.5 flex justify-between items-start text-xs font-normal leading-tight">
                  {/* Left Block (Applicant Info Signature block) */}
                  <div className="space-y-0.5 font-normal text-black">
                    <p className="font-normal">আপনার বিশ্বস্ত,</p>
                    <div className="h-8 w-32 border-b border-black/20 mt-1" />
                    <p className="pt-1">নামঃ {applicantName || 'সৈয়দ আরিফুল ইসলাম ইমন'}</p>
                    <p className="">পদবীঃ {designation || 'সিনিয়র অফিসার-আইটি'}</p>
                    <p className="font-mono">ব্যাংক আইডিঃ {toBanglaDigits(bankId || '০২৬৭৯৫')}</p>
                    {fileNo && <p className="">ব্যক্তিগত নথি নংঃ {fileNo}</p>}
                    <p className="">{cellName}</p>
                    <p className="">জনতা ব্যাংক পিএলসি,</p>
                    <p className="">প্রধান কার্যালয়, ঢাকা।</p>
                  </div>

                  {/* Right Block (Stay & Mobile during leave) */}
                  <div className="space-y-2 text-black font-normal text-xs text-right pr-2">
                    <p>ছুটিতে থাকাকালীন অবস্থানঃ <span className="border-b border-black px-1.5 font-normal">{formatStayLocationText()}</span></p>
                    <p>মোবাইল নংঃ <span className="font-mono border-b border-black px-1.5 font-normal">{toBanglaDigits(mobileNo)}</span></p>
                  </div>
                </div>

                {/* 5. RECOMMENDATION & HIERARCHY APPROVAL BOXES */}
                <div className="mt-3.5 space-y-2 font-normal text-xs">
                  {/* Recommendation notice line */}
                  <div className="text-center font-normal text-black pb-0.5">
                    আবেদনকারীর অনুকূলে উক্ত <span className="border-b border-black px-1 font-normal">{leaveDetails.actualDeducted > 0 ? getBanglaDayWord(leaveDetails.actualDeducted) : '_______'}</span> দিনের নৈমিত্তিক ছুটি মঞ্জুরীর সুপারিশ করা হলো।
                  </div>

                  {/* Recommendation signatures */}
                  <div className="flex justify-between items-center text-xs font-normal text-black pt-1 px-2">
                    <div className="text-center leading-normal">
                      <div className="h-12 w-28 border-b border-black/30 mx-auto" />
                      <p className="pt-2 font-normal">সেল ইনচার্জ</p>
                    </div>

                    <div className="text-center leading-normal">
                      <div className="h-12 w-28 border-b border-black/30 mx-auto" />
                      <p className="pt-2 font-normal">সহকারী মহাব্যবস্থাপক</p>
                    </div>
                  </div>

                  {/* AGM/DGM/SPO routing lines */}
                  <div className="pt-1.5 space-y-2 text-[10px] font-normal text-black tracking-wide">
                    <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
                      <span className="font-normal">এজিএম (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</span>
                      <span className="w-16 border-b border-black/20 h-1" />
                    </div>
                    <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
                      <span className="font-normal">ডিজিএম (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</span>
                      <span className="w-16 border-b border-black/20 h-1" />
                    </div>
                    <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
                      <span className="font-normal">এজিএম (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</span>
                      <span className="w-16 border-b border-black/20 h-1" />
                    </div>
                    <div className="flex items-center justify-between pb-1.5">
                      <span className="font-normal">এসপিও (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</span>
                      <span className="w-16 border-b border-black/20 h-1" />
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
      
      {/* Dynamic Printing CSS styles */}
      <style>{`
        @media print {
          /* Full Screen and layout resets */
          body, html, main, .flex-1, .p-4, .lg\\:p-8, .p-6, .py-6 {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          /* Hide non-printable panels */
          .no-print, header, nav, aside, .sidebar-wrapper, .mobile-nav-top, .sidebar-footer {
            display: none !important;
          }

          /* Printable layout adjustments */
          #printable-leave-sheet {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            width: 216mm !important;
            height: 356mm !important;
            min-height: 356mm !important;
            padding: 20mm !important;
            margin: 0 auto !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            page-break-before: avoid !important;
          }
          
          @page {
            size: legal portrait;
            margin: 0 !important;
          }
        }

        /* Strict CSS rule to enforce standard size 10 Kalpurush text in document */
        #printable-leave-sheet, #printable-leave-sheet * {
          font-family: 'Kalpurush', 'SolaimanLipi', 'Noto Sans Bengali', sans-serif !important;
          font-size: 13px !important; /* Size 10 is 13px */
          font-weight: normal !important;
          font-style: normal !important;
          line-height: 1.45 !important;
          color: #000000 !important;
          text-decoration: none !important;
        }
      `}</style>
    </AuthGuard>
  );
}

// Utility to display a value or a dash if empty
function toDisplayOrDash(val: number): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  if (val === 0) return '--';
  return val.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
}

// Helper to set original total value state (workaround for state setup check)
let originalSpecialTotal = 47;
function setOriginalSpecialTotal(val: number) {
  originalSpecialTotal = val;
}
