/**
 * Seniority Helper Utility for Janata Bank Employees
 */

export interface EmployeeSortable {
  bankId?: string | null;
  fileNo?: string | null;
  designation?: string | null;
  name?: string | null;
}

export const parseNumberStr = (str: string | null | undefined): number => {
  if (!str) return NaN;
  const banglaToEnglishMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  const engStr = String(str).replace(/[০-৯]/g, (d) => banglaToEnglishMap[d] || d);
  const cleanStr = engStr.replace(/[^0-9]/g, '');
  const num = parseInt(cleanStr, 10);
  return isNaN(num) ? NaN : num;
};

export const getDesignationRank = (designation: string | null | undefined): number => {
  const d = (designation || '').toUpperCase();
  if (d.includes('এসপিও') || d.includes('SPO') || d.includes('SENIOR PRINCIPAL') || d.includes('সিনিয়র প্রিন্সিপাল')) return 1;
  if (d.includes('পিও') || d.includes('PO') || d.includes('PRINCIPAL') || d.includes('প্রিন্সিপাল')) return 2;
  if (d.includes('এসো') || d.includes('এসো') || d.includes('এসও') || d.includes('SO') || d.includes('SENIOR OFFICER') || d.includes('সিনিয়র অফিসার')) return 3;
  if (d.includes('ও') || d.includes('অফিসার') || d.includes('OFFICER') || d.includes('O-IT')) return 4;
  return 99; // Fallback for other roles/designations
};

/**
 * Custom seniority sorting logic for employees:
 * 1. Primarily sort by Designation Rank (SPO > PO > SO-IT > O-IT).
 * 2. Within the same designation rank, sort by the minimum value between Bank ID and File No ("যারটা আগে সে আগে বসবে, ব্যাংক আইডি চেক করবে, সাথে ফাইল নং ও চেক করবে, যারটা আগে সে আগে বসবে").
 */
export function sortEmployeesBySeniority<T extends EmployeeSortable>(list: T[]): T[] {
  if (!Array.isArray(list) || list.length <= 1) return list;

  return [...list].sort((a, b) => {
    // 1. Compare Designation Rank primarily
    const rankA = getDesignationRank(a.designation);
    const rankB = getDesignationRank(b.designation);
    if (rankA !== rankB) return rankA - rankB;

    // 2. Compare effective minimum score between Bank ID and File No
    const bankA = parseNumberStr(a.bankId);
    const fileA = parseNumberStr(a.fileNo);
    const minA = Math.min(isNaN(bankA) ? Infinity : bankA, isNaN(fileA) ? Infinity : fileA);

    const bankB = parseNumberStr(b.bankId);
    const fileB = parseNumberStr(b.fileNo);
    const minB = Math.min(isNaN(bankB) ? Infinity : bankB, isNaN(fileB) ? Infinity : fileB);

    if (minA !== minB) return minA - minB;

    // Fallbacks
    const bankDiff = (isNaN(bankA) ? Infinity : bankA) - (isNaN(bankB) ? Infinity : bankB);
    if (bankDiff !== 0) return bankDiff;

    const fileDiff = (isNaN(fileA) ? Infinity : fileA) - (isNaN(fileB) ? Infinity : fileB);
    if (fileDiff !== 0) return fileDiff;

    return (a.name || '').localeCompare(b.name || '');
  });
}
