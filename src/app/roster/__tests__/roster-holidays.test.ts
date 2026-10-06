import { describe, it, expect } from 'vitest';
import { getHolidayStatus, checkIsWorkingDay, isDateDisabledForType, calculateOrderDate } from '../types';

describe('Roster & Office Order Holiday Synchronization', () => {
  it('correctly recognizes 2026-10-22 as executive order government holiday without requiring extra DB entry', () => {
    const status = getHolidayStatus('2026-10-22', []);
    expect(status.isGovtHoliday).toBe(true);
    expect(status.isWorkingDay).toBe(false);
    expect(status.holidayName).toBe('দূর্গাপূজা (নির্বাহী আদেশে সরকারি ছুটি)');
    expect(status.label).toContain('দূর্গাপূজা (নির্বাহী আদেশে সরকারি ছুটি)');
  });

  it('correctly calculates isWorkingDay as false for 2026-10-22', () => {
    const isWorking = checkIsWorkingDay('2026-10-22', []);
    expect(isWorking).toBe(false);
  });

  it('disables late sitting on 2026-10-22 and allows holiday duty', () => {
    const isWorking = checkIsWorkingDay('2026-10-22', []);
    expect(isDateDisabledForType(isWorking, 'LATE_SITTING')).toBe(true);
    expect(isDateDisabledForType(isWorking, 'HOLIDAY')).toBe(false);
  });

  it('skips 2026-10-22 when calculating previous working order date', () => {
    // 2026-10-23 is Friday (weekend), 2026-10-22 is Thursday (executive holiday), 2026-10-21 is Wed (Bijoya Dashami), 2026-10-20 is Tue (Maha Nabami), 2026-10-19 is Mon (working)
    const orderDate = calculateOrderDate('2026-10-23', [], 1);
    expect(orderDate).toBe('2026-10-19');
  });
});
