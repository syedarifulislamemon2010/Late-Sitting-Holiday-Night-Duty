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

export const isSPO = (desig: string | null | undefined): boolean => {
  const d = (desig || '').toUpperCase();
  return d.includes('এসপিও') || d.includes('SPO') || d.includes('SENIOR PRINCIPAL') || d.includes('সিনিয়র প্রিন্সিপাল');
};

/**
 * Custom seniority sorting logic for employees:
 * 1. Default sort is by minimum of Bank ID and File No ("ব্যাংক আইডি ও ফাইল নং এর মধ্যে যে আগে থাকবে সে প্রথমে থাকবে").
 * 2. If sorting by Bank ID & File No places any SPO after a non-SPO ("পদবী এসপিও পরে আছে"), we sort by File No primarily.
 */
export function sortEmployeesBySeniority<T extends EmployeeSortable>(list: T[]): T[] {
  if (!Array.isArray(list) || list.length <= 1) return list;

  // Sorting helper: Primarily Bank ID, Secondarily File No
  const sortByBankIdAndFileNo = (arr: T[]) => {
    return [...arr].sort((a, b) => {
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
  };

  // Sorting helper: Primarily File No, Secondarily Bank ID
  const sortByFileNoAndBankId = (arr: T[]) => {
    return [...arr].sort((a, b) => {
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

      return (a.name || '').localeCompare(b.name || '');
    });
  };

  // Sorting helper: Primarily effective minimum score of Bank ID & File No
  const sortByMinScore = (arr: T[]) => {
    return [...arr].sort((a, b) => {
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
  };

  // Step 1: Check if Bank ID & File No sorting places SPO after any non-SPO
  const sortedByBank = sortByBankIdAndFileNo(list);
  let spoAfterNonSpo = false;
  let seenNonSpo = false;

  for (const emp of sortedByBank) {
    if (isSPO(emp.designation)) {
      if (seenNonSpo) {
        spoAfterNonSpo = true;
        break;
      }
    } else {
      seenNonSpo = true;
    }
  }

  // Step 2: Decide sorting strategy
  if (spoAfterNonSpo) {
    // If an SPO is placed after a junior designation, fallback to File No primarily
    return sortByFileNoAndBankId(list);
  }

  // Otherwise, sort by the minimum value between Bank ID and File No
  return sortByMinScore(list);
}
