import { toBanglaDigits } from "./bengali-converter";

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

export const renderDatesInPairs = (datesStrOrArr: string | string[]): string[] => {
  let datesArray: string[] = [];
  if (Array.isArray(datesStrOrArr)) {
    datesArray = datesStrOrArr.map(d => {
      if (d.includes('-') && !d.match(/^[০-৯]/)) {
        const [year, month, day] = d.split('-');
        return toBanglaDigits(`${day}-${month}-${year}`);
      }
      return d;
    });
  } else {
    datesArray = (datesStrOrArr || '').split(/,\s*/).map(item => item.trim()).filter(Boolean);
  }
  const pairedDates: string[] = [];
  for (let i = 0; i < datesArray.length; i += 2) {
    if (i + 1 < datesArray.length) {
      pairedDates.push(`${datesArray[i]}, ${datesArray[i + 1]}`);
    } else {
      pairedDates.push(datesArray[i]);
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
