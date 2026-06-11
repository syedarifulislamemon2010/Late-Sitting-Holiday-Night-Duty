import { describe, it, expect, vi } from 'vitest';
import { DutyService } from '../duty.service';
import { HolidayRepository } from '@/repositories/holiday.repository';

// Mock the HolidayRepository to avoid DB calls in unit test
vi.mock('@/repositories/holiday.repository', () => {
  return {
    HolidayRepository: {
      findByDate: vi.fn(),
    },
  };
});

describe('DutyService - Allowance & Holiday Calculations', () => {
  describe('calculateAllowances', () => {
    it('should correctly calculate allowances for LATE_SITTING', () => {
      const result = DutyService.calculateAllowances('LATE_SITTING');
      expect(result).toEqual({ allowance1: 100, allowance2: 200, totalBill: 300 });
    });

    it('should correctly calculate allowances for HOLIDAY', () => {
      const result = DutyService.calculateAllowances('HOLIDAY');
      expect(result).toEqual({ allowance1: 250, allowance2: 250, totalBill: 500 });
    });

    it('should correctly calculate allowances for NIGHT_SHIFT', () => {
      const result = DutyService.calculateAllowances('NIGHT_SHIFT');
      expect(result).toEqual({ allowance1: 600, allowance2: 400, totalBill: 1000 });
    });

    it('should throw an error for an invalid duty type', () => {
      expect(() => DutyService.calculateAllowances('INVALID_TYPE')).toThrow('invalid_duty_type');
    });
  });

  describe('checkIsHoliday', () => {
    it('should return true for weekends (Friday & Saturday) by default', async () => {
      vi.mocked(HolidayRepository.findByDate).mockResolvedValue(null);

      // Friday: 2026-06-12
      const isFridayHoliday = await DutyService.checkIsHoliday('2026-06-12');
      expect(isFridayHoliday).toBe(true);

      // Saturday: 2026-06-13
      const isSaturdayHoliday = await DutyService.checkIsHoliday('2026-06-13');
      expect(isSaturdayHoliday).toBe(true);

      // Sunday (Working day): 2026-06-14
      const isSundayHoliday = await DutyService.checkIsHoliday('2026-06-14');
      expect(isSundayHoliday).toBe(false);
    });

    it('should respect holiday repository working overrides', async () => {
      // Mock repository override indicating a weekend is a working day
      vi.mocked(HolidayRepository.findByDate).mockResolvedValue({
        id: 1,
        date: '2026-06-12', // Friday
        name: 'Office Working Day',
        isWorkingDay: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const isHoliday = await DutyService.checkIsHoliday('2026-06-12');
      expect(isHoliday).toBe(false); // Overridden to working day, so not holiday
    });

    it('should respect holiday repository non-working overrides', async () => {
      // Mock repository override indicating a weekday is a holiday (non-working day)
      vi.mocked(HolidayRepository.findByDate).mockResolvedValue({
        id: 2,
        date: '2026-06-15', // Monday
        name: 'Public Holiday',
        isWorkingDay: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const isHoliday = await DutyService.checkIsHoliday('2026-06-15');
      expect(isHoliday).toBe(true); // Overridden to non-working day, so holiday
    });
  });
});
