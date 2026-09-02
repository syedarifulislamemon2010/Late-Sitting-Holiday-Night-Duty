import { toBanglaDigits, toEnglishDigits } from "./bengali-converter";

export const getShortDesignation = (designation: string): string => {
  if (!designation) return '';
  const match = designation.match(/\(([^)]+)\)/);
  if (match) return match[1];
  const d = designation.toUpperCase();
  if (d.includes('SENIOR PRINCIPAL') || d.includes('SPO') || d.includes('এসপিও')) return 'এসপিও';
  if (d.includes('PRINCIPAL') || d.includes('PO') || d.includes('পিও')) return 'পিও';
  if (d.includes('SENIOR OFFICER') || d.includes('SO') || d.includes('এসো')) {
    return d.includes('IT') || d.includes('আইটি') ? 'এসো-আইটি' : 'এসো';
  }
  return designation;
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

export const sortDatesDescending = (dates: string[]): string[] => {
  return [...dates].sort((a, b) => {
    const keyA = parseDateToIsoKey(a);
    const keyB = parseDateToIsoKey(b);
    return keyB.localeCompare(keyA);
  });
};

export const sortDatesStringDescending = (datesStr: string): string => {
  if (!datesStr) return '';
  const dates = datesStr.split(/,\s*/).map(d => d.trim()).filter(Boolean);
  const sorted = sortDatesDescending(dates);
  return sorted.map(d => formatToBanglaDate(d)).join(', ');
};

export const renderDatesInPairs = (datesStrOrArr: string | string[]): string[] => {
  let rawDates: string[] = [];
  if (Array.isArray(datesStrOrArr)) {
    rawDates = datesStrOrArr.map(d => String(d || '').trim()).filter(Boolean);
  } else {
    rawDates = (datesStrOrArr || '').split(/,\s*/).map(item => item.trim()).filter(Boolean);
  }

  // Sort descending (latest date first: e.g. 01-06-2026, 23-05-2026, ...)
  const sortedDates = sortDatesDescending(rawDates);

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
