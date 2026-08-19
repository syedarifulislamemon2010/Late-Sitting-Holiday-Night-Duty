/**
 * Janata Bank LHN Portal — Budget Splitter Engine
 * Automatically calculates duty allowances and splits large duty orders exceeding ৳7,500
 * into contiguous, audit-compliant sub-orders with non-colliding reference numbers
 * for Deputy General Manager (DGM) administrative approval compliance.
 */

export const DGM_APPROVAL_LIMIT = 7500;

export interface DutyItem {
  id?: number | string;
  employeeId?: number | string | null;
  employeeName?: string;
  designation?: string;
  date: string;
  type?: string;
  [key: string]: unknown;
}

export function getAllowanceRate(type?: string): number {
  switch (type) {
    case 'HOLIDAY':
      return 250;
    case 'NIGHT_SHIFT':
      return 600;
    case 'LATE_SITTING':
    default:
      return 100;
  }
}

export function calculateApyaonTotal(duties: DutyItem[], defaultType: string = 'LATE_SITTING'): number {
  return duties.reduce((acc, duty) => {
    const rate = getAllowanceRate(duty.type || defaultType);
    return acc + rate;
  }, 0);
}

/**
 * Splits an array of duties into `numParts` roughly equal contiguous chunks
 */
export function splitDutiesIntoParts<T>(items: T[], numParts: number): T[][] {
  if (numParts <= 1 || items.length <= 1) {
    return [items];
  }
  const result: T[][] = [];
  const total = items.length;
  const baseSize = Math.floor(total / numParts);
  const remainder = total % numParts;

  let startIndex = 0;
  for (let i = 0; i < numParts; i++) {
    const size = baseSize + (i < remainder ? 1 : 0);
    result.push(items.slice(startIndex, startIndex + size));
    startIndex += size;
  }
  return result;
}

/**
 * Automatically splits duties into audit-compliant sub-orders if total exceeds maxBudget (default ৳7,500)
 */
export function autoSplitDutiesByBudget(
  duties: DutyItem[],
  dutyType: string = 'LATE_SITTING',
  maxBudget: number = DGM_APPROVAL_LIMIT
): {
  isSplit: boolean;
  totalApyaon: number;
  maxBudget: number;
  parts: DutyItem[][];
  numParts: number;
} {
  const totalApyaon = calculateApyaonTotal(duties, dutyType);
  if (totalApyaon <= maxBudget || duties.length === 0) {
    return {
      isSplit: false,
      totalApyaon,
      maxBudget,
      parts: [duties],
      numParts: 1
    };
  }

  const numParts = Math.ceil(totalApyaon / maxBudget);
  const parts = splitDutiesIntoParts(duties, numParts);

  return {
    isSplit: true,
    totalApyaon,
    maxBudget,
    parts,
    numParts
  };
}
