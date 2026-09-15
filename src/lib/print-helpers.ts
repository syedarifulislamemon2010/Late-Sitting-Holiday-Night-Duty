import { toBanglaDigits, toEnglishDigits } from "./bengali-converter";

export const getShortDesignation = (designation: string | undefined | null): string => {
  if (!designation) return '';
  const trimmed = designation.trim();
  const d = trimmed.toUpperCase();

  const match = trimmed.match(/\(([^)]+)\)/);
  if (match) {
    const inside = match[1].trim();
    const insideUpper = inside.toUpperCase();
    if (insideUpper === 'IT' || insideUpper === 'আইটি') {
      const isSenior = d.includes('SENIOR') || d.includes('সিনিয়র') || d.includes('সিনিয়র') || d.includes('এসও') || d.includes('এসো') || d.includes('SO');
      return isSenior ? 'এসও-আইটি' : 'ও-আইটি';
    }
    if (insideUpper === 'O-IT' || insideUpper === 'ও-আইটি') return 'ও-আইটি';
    if (insideUpper === 'SO-IT' || insideUpper === 'এসও-আইটি') return 'এসও-আইটি';
    return inside;
  }

  if (d.includes('SENIOR PRINCIPAL') || d.includes('সিনিয়র প্রিন্সিপাল') || d.includes('সিনিয়র প্রিন্সিপাল') || d.includes('SPO') || d.includes('এসপিও')) {
    return 'এসপিও';
  }
  if (d.includes('PRINCIPAL') || d.includes('প্রিন্সিপাল') || d.includes('PO') || d.includes('পিও')) {
    return 'পিও';
  }
  const isSenior = d.includes('SENIOR') || d.includes('সিনিয়র') || d.includes('সিনিয়র') || d.includes('এসও') || d.includes('এসো') || d.includes('SO');
  const isOfficer = d.includes('OFFICER') || d.includes('অফিসার') || d.includes('ও-');
  const isIT = d.includes('IT') || d.includes('আইটি') || d.includes('ও-আইটি') || d.includes('O-IT');

  if (isSenior) {
    return isIT ? 'এসও-আইটি' : 'এসো';
  }
  if (isIT && (isOfficer || d.includes('ও-আইটি') || d.includes('O-IT'))) {
    return 'ও-আইটি';
  }
  if (isOfficer) {
    return 'অফিসার';
  }
  if (d.includes('PROGRAMMER') || d.includes('প্রোগ্রামার')) {
    if (isSenior) return 'এসপি';
    if (d.includes('ASSISTANT') || d.includes('সহকারী') || d.includes('অ্যাসিস্ট্যান্ট')) return 'সহকারী প্রোগ্রামার';
    return 'প্রোগ্রামার';
  }
  if (d.includes('GENERAL MANAGER') || d.includes('মহাব্যবস্থাপক') || d.includes('GM') || d.includes('জিএম')) {
    if (d.includes('DEPUTY') || d.includes('উপ-') || d.includes('DGM') || d.includes('ডিজিএম')) return 'ডিজিএম';
    if (d.includes('ASSISTANT') || d.includes('সহকারী') || d.includes('AGM') || d.includes('এজিএম')) return 'এজিএম';
    return 'জিএম';
  }

  return trimmed;
};

export const parseDateToIsoKey = (dateStr: string): string => {
  if (!dateStr) return '';
  const en = toEnglishDigits(dateStr).trim();
  if (!en.includes('-')) return en;
  const parts = en.split('-').map(p => p.trim());
  if (parts.length !== 3) return en;
  // If YYYY-MM-DD
  if (parts[0].length === 4) {
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  // If DD-MM-YYYY
  if (parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return en;
};

export const formatToBanglaDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const en = toEnglishDigits(dateStr).trim();
  if (!en.includes('-')) return dateStr;
  const parts = en.split('-').map(p => p.trim());
  if (parts.length !== 3) return dateStr;
  let day = '';
  let month = '';
  let year = '';
  if (parts[0].length === 4) {
    // YYYY-MM-DD
    year = parts[0];
    month = parts[1].padStart(2, '0');
    day = parts[2].padStart(2, '0');
  } else if (parts[2].length === 4) {
    // DD-MM-YYYY
    day = parts[0].padStart(2, '0');
    month = parts[1].padStart(2, '0');
    year = parts[2];
  } else {
    return dateStr;
  }
  return `${toBanglaDigits(day)}-${toBanglaDigits(month)}-${toBanglaDigits(year)}`;
};

export const sortDatesAscending = (dates: string[]): string[] => {
  return [...dates].sort((a, b) => {
    const keyA = parseDateToIsoKey(a);
    const keyB = parseDateToIsoKey(b);
    return keyA.localeCompare(keyB);
  });
};

export const sortDatesStringAscending = (datesStr: string): string => {
  if (!datesStr) return '';
  const dates = datesStr.split(/,\s*/).map(d => d.trim()).filter(Boolean);
  const sorted = sortDatesAscending(dates);
  return sorted.map(d => formatToBanglaDate(d)).join(', ');
};

// Also export sortDatesDescending and sortDatesStringDescending pointing to ascending for backward compatibility
export const sortDatesDescending = (dates: string[]): string[] => sortDatesAscending(dates);
export const sortDatesStringDescending = (datesStr: string): string => sortDatesStringAscending(datesStr);

export const renderDatesInPairs = (datesStrOrArr: string | string[]): string[] => {
  let rawDates: string[] = [];
  if (Array.isArray(datesStrOrArr)) {
    rawDates = datesStrOrArr.map(d => String(d || '').trim()).filter(Boolean);
  } else {
    rawDates = (datesStrOrArr || '').split(/,\s*/).map(item => item.trim()).filter(Boolean);
  }

  // Sort ascending (chronological: earliest date first: e.g. 09-05-2026, 16-05-2026 ... 01-06-2026)
  const sortedDates = sortDatesAscending(rawDates);

  // Format into standard Bangla DD-MM-YYYY
  const formattedDates = sortedDates.map(d => formatToBanglaDate(d));

  const pairedDates: string[] = [];
  for (let i = 0; i < formattedDates.length; i += 2) {
    if (i + 1 < formattedDates.length) {
      pairedDates.push(`${formattedDates[i]}, ${formattedDates[i + 1]}`);
    } else {
      pairedDates.push(formattedDates[i]);
    }
  }
  return pairedDates;
};

export const cleanBracketName = (name: string): string => {
  if (!name) return '';
  let clean = name.trim().replace(/^\((.*)\)$/, '$1').trim();
  clean = clean.replace(/^(জনাব|জনাবা)\s+/, '');
  return clean;
};
