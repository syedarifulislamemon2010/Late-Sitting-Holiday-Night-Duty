import { describe, it, expect } from 'vitest';
import { 
  isNonWorkingDay, 
  getSucceedingContiguousHolidaysCount, 
  getCalculatedLeaveDetails 
} from '../leave-calculator';

describe('LeaveCalculator - Sandwich Rule Calculations', () => {
  describe('isNonWorkingDay', () => {
    it('should identify weekends (Friday and Saturday) as non-working days', () => {
      expect(isNonWorkingDay('2026-06-12')).toBe(true); // Friday
      expect(isNonWorkingDay('2026-06-13')).toBe(true); // Saturday
      expect(isNonWorkingDay('2026-06-14')).toBe(false); // Sunday
    });

    it('should respect default 2026 public holidays', () => {
      expect(isNonWorkingDay('2026-02-21')).toBe(true); // International Mother Language Day
      expect(isNonWorkingDay('2026-03-26')).toBe(true); // Independence Day
    });

    it('should override weekend to working day for specific bank overrides (e.g., 2026-05-23)', () => {
      expect(isNonWorkingDay('2026-05-23')).toBe(false); // Saturday, but overridden to working
    });
  });

  describe('getSucceedingContiguousHolidaysCount', () => {
    it('should count consecutive weekend days starting after a given date', () => {
      // Thursday: 2026-06-11. Succeeding days are Fri (12th), Sat (13th), then Sun (14th - working).
      const count = getSucceedingContiguousHolidaysCount('2026-06-11');
      expect(count).toBe(2);
    });

    it('should count 0 if the succeeding day is a working day', () => {
      // Thursday: 2026-06-18. Succeeding day is Fri 19th (holiday), Sat 20th (holiday), Sun 21st (working).
      // Wait, succeeding day of Wednesday 2026-06-17 is Thursday (working).
      const count = getSucceedingContiguousHolidaysCount('2026-06-17');
      expect(count).toBe(0);
    });
  });

  describe('getCalculatedLeaveDetails (Sandwich Rule)', () => {
    it('should calculate non-sandwiched leave correctly (deducting only working days)', () => {
      // Monday 2026-06-15 to Thursday 2026-06-18 (4 days)
      // Preceding day is Sunday (working), succeeding day is Friday (holiday). Not sandwiched!
      const details = getCalculatedLeaveDetails('2026-06-15', '2026-06-18');
      expect(details.totalDays).toBe(4);
      expect(details.isSandwiched).toBe(false);
      expect(details.sandwichedCount).toBe(0);
      expect(details.actualDeducted).toBe(4); // Only the 4 working days
    });

    it('should apply sandwich rule if leave is sandwiched between holidays/weekends', () => {
      // Sunday 2026-06-14 to Thursday 2026-06-18 (5 calendar days)
      // Preceding: Saturday 2026-06-13 (weekend/holiday)
      // Succeeding: Friday 2026-06-19 (weekend/holiday)
      // Since preceding and succeeding are holidays, it IS sandwiched!
      // Contiguous holidays after Thursday 2026-06-18: Friday 19th, Saturday 20th (2 days)
      // Total deducted should be calendar days (5) + succeeding holidays (2) = 7 days!
      const details = getCalculatedLeaveDetails('2026-06-14', '2026-06-18');
      expect(details.totalDays).toBe(5);
      expect(details.isSandwiched).toBe(true);
      expect(details.sandwichedCount).toBe(2); // Fri & Sat contiguous holidays
      expect(details.actualDeducted).toBe(7); // 5 calendar days + 2 succeeding holidays
    });
  });
});
