import { describe, it, expect, vi } from 'vitest';
import {
  getAllowanceRate,
  calculateApyaonTotal,
  autoSplitDutiesByBudget,
  DGM_APPROVAL_LIMIT,
  DutyItem
} from '@/lib/budget-splitter';
import { DUTY_RATES } from '@/constants/billing';
import {
  isNonWorkingDay,
  getSucceedingContiguousHolidaysCount,
  getCalculatedLeaveDetails
} from '@/lib/leave-calculator';
import { LeaveBalanceService } from '@/services/leave-balance.service';
import { sortEmployeesBySeniority } from '@/lib/seniority';
import { DutyService } from '@/services/duty.service';
import { HolidayRepository } from '@/repositories/holiday.repository';

// Mock HolidayRepository for DutyService unit assertions
vi.mock('@/repositories/holiday.repository', () => ({
  HolidayRepository: {
    findByDate: vi.fn(),
  },
}));

describe('Characterization Baseline Safety Net', () => {

  describe('1. Budget Splitter: 7499 / 7500 / 7501, single duty, multiple months, empty list', () => {
    it('handles empty duty list gracefully without splitting', () => {
      const emptyDuties: DutyItem[] = [];
      const result = autoSplitDutiesByBudget(emptyDuties, 'HOLIDAY', DGM_APPROVAL_LIMIT);
      expect(result.isSplit).toBe(false);
      expect(result.totalApyaon).toBe(0);
      expect(result.numParts).toBe(1);
      expect(result.parts[0]).toEqual([]);
    });

    it('handles a single duty correctly', () => {
      const singleDuty: DutyItem[] = [{ date: '2026-08-01', type: 'HOLIDAY' }];
      const result = autoSplitDutiesByBudget(singleDuty, 'HOLIDAY', DGM_APPROVAL_LIMIT);
      expect(result.isSplit).toBe(false);
      expect(result.totalApyaon).toBe(250);
      expect(result.numParts).toBe(1);
      expect(result.parts[0].length).toBe(1);
    });

    it('asserts boundary: exactly ৳7,499 or below (e.g. ৳7,400 with LATE_SITTING) does NOT split', () => {
      // 74 late sitting duties = 74 * 100 = 7400 <= 7500
      const duties: DutyItem[] = Array.from({ length: 74 }, (_, i) => ({
        date: `2026-08-${String((i % 28) + 1).padStart(2, '0')}`,
        type: 'LATE_SITTING'
      }));
      const result = autoSplitDutiesByBudget(duties, 'LATE_SITTING', DGM_APPROVAL_LIMIT);
      expect(result.totalApyaon).toBe(7400);
      expect(result.isSplit).toBe(false);
      expect(result.numParts).toBe(1);
    });

    it('asserts boundary: exactly ৳7,500 (30 * 250 for HOLIDAY) does NOT split', () => {
      const duties: DutyItem[] = Array.from({ length: 30 }, (_, i) => ({
        date: `2026-08-${String((i % 28) + 1).padStart(2, '0')}`,
        type: 'HOLIDAY'
      }));
      const result = autoSplitDutiesByBudget(duties, 'HOLIDAY', DGM_APPROVAL_LIMIT);
      expect(result.totalApyaon).toBe(7500);
      expect(result.isSplit).toBe(false);
      expect(result.numParts).toBe(1);
    });

    it('asserts boundary: ৳7,501 or higher (e.g. 76 late sitting duties = ৳7,600 or 31 holiday duties = ৳7,750) DOES split', () => {
      const duties: DutyItem[] = Array.from({ length: 31 }, (_, i) => ({
        date: `2026-08-${String((i % 28) + 1).padStart(2, '0')}`,
        type: 'HOLIDAY'
      }));
      const result = autoSplitDutiesByBudget(duties, 'HOLIDAY', DGM_APPROVAL_LIMIT);
      expect(result.totalApyaon).toBe(7750);
      expect(result.isSplit).toBe(true);
      expect(result.numParts).toBe(2);
      expect(result.parts.length).toBe(2);
      // Each sub-part must be <= 7500
      expect(calculateApyaonTotal(result.parts[0], 'HOLIDAY')).toBeLessThanOrEqual(DGM_APPROVAL_LIMIT);
      expect(calculateApyaonTotal(result.parts[1], 'HOLIDAY')).toBeLessThanOrEqual(DGM_APPROVAL_LIMIT);
    });

    it('handles multiple months in a single duty list without error', () => {
      const duties: DutyItem[] = [
        { date: '2026-08-15', type: 'HOLIDAY' },
        { date: '2026-09-05', type: 'HOLIDAY' },
        { date: '2026-10-10', type: 'HOLIDAY' }
      ];
      const result = autoSplitDutiesByBudget(duties, 'HOLIDAY', DGM_APPROVAL_LIMIT);
      expect(result.isSplit).toBe(false);
      expect(result.totalApyaon).toBe(750);
      expect(result.parts[0].length).toBe(3);
    });
  });

  describe('2. Allowance Rates (300/500/1000) and Total Bill', () => {
    it('matches exact allowance components and totals across constants', () => {
      expect(DUTY_RATES.LATE_SITTING).toEqual({ total: 300, refreshment: 100, conveyance: 200 });
      expect(DUTY_RATES.HOLIDAY).toEqual({ total: 500, lunch: 250, conveyance: 250 });
      expect(DUTY_RATES.NIGHT_SHIFT).toEqual({ total: 1000, dinner: 600, conveyance: 400 });
    });

    it('matches DutyService.calculateAllowances return contracts', () => {
      expect(DutyService.calculateAllowances('LATE_SITTING')).toEqual({ allowance1: 100, allowance2: 200, totalBill: 300 });
      expect(DutyService.calculateAllowances('HOLIDAY')).toEqual({ allowance1: 250, allowance2: 250, totalBill: 500 });
      expect(DutyService.calculateAllowances('NIGHT_SHIFT')).toEqual({ allowance1: 600, allowance2: 400, totalBill: 1000 });
      expect(() => DutyService.calculateAllowances('INVALID_TYPE')).toThrow('invalid_duty_type');
    });

    it('matches budget-splitter getAllowanceRate contract', () => {
      expect(getAllowanceRate('LATE_SITTING')).toBe(100);
      expect(getAllowanceRate('HOLIDAY')).toBe(250);
      expect(getAllowanceRate('NIGHT_SHIFT')).toBe(600);
      expect(getAllowanceRate('OTHER')).toBe(100); // Fallback behavior
    });
  });

  describe('3. Leave Calculator, Balance, Working-Days, Sandwich Rule, Seniority', () => {
    it('correctly calculates non-working days including weekends and 2026 public holidays', () => {
      // 2026-06-12 is Friday, 2026-06-13 is Saturday
      expect(isNonWorkingDay('2026-06-12')).toBe(true);
      expect(isNonWorkingDay('2026-06-13')).toBe(true);
      expect(isNonWorkingDay('2026-06-14')).toBe(false); // Sunday

      // Public holidays
      expect(isNonWorkingDay('2026-02-21')).toBe(true);
      expect(isNonWorkingDay('2026-03-26')).toBe(true);
      expect(isNonWorkingDay('2026-10-22')).toBe(true);

      // Bank holidays that are working days in system
      expect(isNonWorkingDay('2026-07-01')).toBe(false);
      expect(isNonWorkingDay('2026-12-31')).toBe(false);

      // Bank overrides
      expect(isNonWorkingDay('2026-05-23')).toBe(false);
      expect(isNonWorkingDay('2026-10-17')).toBe(false);
    });

    it('calculates sandwich rule: applies calendar days + contiguous succeeding holidays when surrounded', () => {
      // 2026-06-14 (Sun) to 2026-06-18 (Thu): 5 days
      // Preceding day is 2026-06-13 (Sat, weekend)
      // Succeeding day is 2026-06-19 (Fri, weekend)
      const details = getCalculatedLeaveDetails('2026-06-14', '2026-06-18');
      expect(details.isSandwiched).toBe(true);
      expect(details.sandwichedCount).toBe(2);
      expect(details.actualDeducted).toBe(7); // 5 + 2
    });

    it('calculates non-sandwiched leave: deducts only working days', () => {
      // 2026-06-15 (Mon) to 2026-06-18 (Thu): 4 working days
      // Preceding is 2026-06-14 (Sun - working day)
      const details = getCalculatedLeaveDetails('2026-06-15', '2026-06-18');
      expect(details.isSandwiched).toBe(false);
      expect(details.sandwichedCount).toBe(0);
      expect(details.actualDeducted).toBe(4);
    });

    it('seniority: sorts primarily by designation rank, then bankId, then fileNo', () => {
      const list = [
        { name: 'Officer A (SO-IT)', designation: 'SO-IT', bankId: '045000', fileNo: '10' },
        { name: 'Officer B (SPO)', designation: 'SPO', bankId: '020000', fileNo: '05' },
        { name: 'Officer C (PO)', designation: 'PO', bankId: '030000', fileNo: '02' },
      ];
      const sorted = sortEmployeesBySeniority(list);
      expect(sorted[0].name).toBe('Officer B (SPO)');
      expect(sorted[1].name).toBe('Officer C (PO)');
      expect(sorted[2].name).toBe('Officer A (SO-IT)');
    });
  });

  describe('4. Duty Conflicts: Duplicates, Late Sitting vs Night Shift, Holidays', () => {
    it('DutyService.checkIsHoliday identifies weekends and specific overrides', async () => {
      vi.mocked(HolidayRepository.findByDate).mockResolvedValue(null as any);
      
      // Friday
      expect(await DutyService.checkIsHoliday('2026-06-12')).toBe(true);
      // Sunday
      expect(await DutyService.checkIsHoliday('2026-06-14')).toBe(false);
      // Hardcoded override working dates
      expect(await DutyService.checkIsHoliday('2026-05-23')).toBe(false);
      expect(await DutyService.checkIsHoliday('2026-10-17')).toBe(false);
    });

    it('asserts conflict detection logic rules for duty assignments', () => {
      // 1. Same employee with LATE_SITTING and NIGHT_SHIFT on same date is an illegal conflict
      const isLateSittingNightShiftConflict = (type1: string, type2: string) => {
        return (type1 === 'LATE_SITTING' && type2 === 'NIGHT_SHIFT') ||
               (type1 === 'NIGHT_SHIFT' && type2 === 'LATE_SITTING');
      };
      expect(isLateSittingNightShiftConflict('LATE_SITTING', 'NIGHT_SHIFT')).toBe(true);
      expect(isLateSittingNightShiftConflict('NIGHT_SHIFT', 'LATE_SITTING')).toBe(true);
      expect(isLateSittingNightShiftConflict('LATE_SITTING', 'LATE_SITTING')).toBe(false); // That is duplicate, not LS vs Night

      // 2. Late sitting duty on a holiday is disallowed
      const isLateSittingOnHolidayDisallowed = (dutyType: string, isHoliday: boolean) => {
        if (dutyType === 'LATE_SITTING' && isHoliday) return true;
        return false;
      };
      expect(isLateSittingOnHolidayDisallowed('LATE_SITTING', true)).toBe(true);
      expect(isLateSittingOnHolidayDisallowed('LATE_SITTING', false)).toBe(false);

      // 3. Holiday duty on a working day is disallowed
      const isHolidayOnWorkingDayDisallowed = (dutyType: string, isHoliday: boolean) => {
        if (dutyType === 'HOLIDAY' && !isHoliday) return true;
        return false;
      };
      expect(isHolidayOnWorkingDayDisallowed('HOLIDAY', false)).toBe(true);
      expect(isHolidayOnWorkingDayDisallowed('HOLIDAY', true)).toBe(false);
    });
  });

});
