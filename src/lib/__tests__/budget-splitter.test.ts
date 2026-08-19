import { describe, it, expect } from 'vitest';
import {
  getAllowanceRate,
  calculateApyaonTotal,
  splitDutiesIntoParts,
  autoSplitDutiesByBudget,
  DGM_APPROVAL_LIMIT,
  DutyItem
} from '../budget-splitter';

describe('Budget Splitter Engine (৳7,500 DGM Limit)', () => {
  it('returns correct allowance rates for each duty type', () => {
    expect(getAllowanceRate('LATE_SITTING')).toBe(100);
    expect(getAllowanceRate('HOLIDAY')).toBe(250);
    expect(getAllowanceRate('NIGHT_SHIFT')).toBe(600);
    expect(getAllowanceRate('UNKNOWN')).toBe(100);
  });

  it('calculates total apyaon correctly', () => {
    const duties: DutyItem[] = [
      { date: '2026-08-01', type: 'LATE_SITTING' },
      { date: '2026-08-02', type: 'LATE_SITTING' },
      { date: '2026-08-03', type: 'LATE_SITTING' },
    ];
    expect(calculateApyaonTotal(duties)).toBe(300);
  });

  it('splits duties into roughly equal parts', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const parts = splitDutiesIntoParts(items, 3);
    expect(parts.length).toBe(3);
    expect(parts[0].length).toBe(4);
    expect(parts[1].length).toBe(3);
    expect(parts[2].length).toBe(3);
    expect(parts.flat()).toEqual(items);
  });

  it('does not split if total bill is within ৳7,500 limit', () => {
    const duties: DutyItem[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-08-${String(i + 1).padStart(2, '0')}`,
      type: 'HOLIDAY' // 30 * 250 = 7,500 (exactly at limit)
    }));

    const result = autoSplitDutiesByBudget(duties, 'HOLIDAY', DGM_APPROVAL_LIMIT);
    expect(result.isSplit).toBe(false);
    expect(result.totalApyaon).toBe(7500);
    expect(result.numParts).toBe(1);
    expect(result.parts[0].length).toBe(30);
  });

  it('splits automatically into compliant sub-orders when total exceeds ৳7,500', () => {
    const duties: DutyItem[] = Array.from({ length: 32 }, (_, i) => ({
      date: `2026-08-${String(i + 1).padStart(2, '0')}`,
      type: 'HOLIDAY' // 32 * 250 = 8,000 > 7,500
    }));

    const result = autoSplitDutiesByBudget(duties, 'HOLIDAY', DGM_APPROVAL_LIMIT);
    expect(result.isSplit).toBe(true);
    expect(result.totalApyaon).toBe(8000);
    expect(result.numParts).toBe(2);
    expect(result.parts.length).toBe(2);
    expect(result.parts[0].length).toBe(16);
    expect(result.parts[1].length).toBe(16);

    // Verify sub-order parts are each under limit
    const part1Total = calculateApyaonTotal(result.parts[0], 'HOLIDAY');
    const part2Total = calculateApyaonTotal(result.parts[1], 'HOLIDAY');
    expect(part1Total).toBe(4000);
    expect(part2Total).toBe(4000);
    expect(part1Total).toBeLessThanOrEqual(DGM_APPROVAL_LIMIT);
    expect(part2Total).toBeLessThanOrEqual(DGM_APPROVAL_LIMIT);
  });

  it('handles night shift large rosters requiring 3+ splits', () => {
    const duties: DutyItem[] = Array.from({ length: 40 }, (_, i) => ({
      date: `2026-08-${String(i + 1).padStart(2, '0')}`,
      type: 'NIGHT_SHIFT' // 40 * 600 = 24,000 (requires ceil(24000/7500) = 4 parts)
    }));

    const result = autoSplitDutiesByBudget(duties, 'NIGHT_SHIFT', DGM_APPROVAL_LIMIT);
    expect(result.isSplit).toBe(true);
    expect(result.totalApyaon).toBe(24000);
    expect(result.numParts).toBe(4);
    expect(result.parts.length).toBe(4);

    result.parts.forEach(part => {
      const partTotal = calculateApyaonTotal(part, 'NIGHT_SHIFT');
      expect(partTotal).toBeLessThanOrEqual(DGM_APPROVAL_LIMIT);
    });
  });
});
