/**
 * Seniority Helper Utility for Sorting Employees (SPO > PO > SO-IT > O-IT)
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
  if (d.includes('এসও') || d.includes('SO') || d.includes('SENIOR OFFICER') || d.includes('সিনিয়র অফিসার')) return 3;
  if (d.includes('ও') || d.includes('অফিসার') || d.includes('OFFICER') || d.includes('O-IT')) return 4;
  return 99; // Fallback
};

/**
 * Custom seniority sorting logic for employees:
 * 1. Sort by Designation Rank (SPO > PO > SO-IT > O-IT).
 * 2. Sort by Bank ID (ascending).
 * 3. Sort by File No (ascending).
 */
export function sortEmployeesBySeniority<T extends EmployeeSortable>(list: T[]): T[] {
  if (!Array.isArray(list) || list.length <= 1) return list;

  return [...list].sort((a, b) => {
    const rankA = getDesignationRank(a.designation);
    const rankB = getDesignationRank(b.designation);
    if (rankA !== rankB) return rankA - rankB;

    const bankA = parseNumberStr(a.bankId);
    const bankB = parseNumberStr(b.bankId);
    const hasBankA = !isNaN(bankA);
    const hasBankB = !isNaN(bankB);

    if (hasBankA && hasBankB) {
      if (bankA !== bankB) return bankA - bankB;
    } else if (hasBankA) {
      return -1;
    } else if (hasBankB) {
      return 1;
    }

    const fileA = parseNumberStr(a.fileNo);
    const fileB = parseNumberStr(b.fileNo);
    const hasFileA = !isNaN(fileA);
    const hasFileB = !isNaN(fileB);

    if (hasFileA && hasFileB) {
      if (fileA !== fileB) return fileA - fileB;
    } else if (hasFileA) {
      return -1;
    } else if (hasFileB) {
      return 1;
    }

    return (a.name || '').localeCompare(b.name || '');
  });
}
