import { describe, it, expect } from 'vitest';
import { DUTY_RATES, LUNCH_BILL_RATE, REVENUE_STAMP } from '../billing';

describe('Billing Constants', () => {
  it('DUTY_RATES values are correct', () => {
    expect(DUTY_RATES.LATE_SITTING.total).toBe(300);
    expect(DUTY_RATES.HOLIDAY.total).toBe(500);
    expect(DUTY_RATES.NIGHT_SHIFT.total).toBe(1000);
  });

  it('component rates sum to totals', () => {
    expect(DUTY_RATES.LATE_SITTING.refreshment + DUTY_RATES.LATE_SITTING.conveyance).toBe(300);
    expect(DUTY_RATES.HOLIDAY.lunch + DUTY_RATES.HOLIDAY.conveyance).toBe(500);
    expect(DUTY_RATES.NIGHT_SHIFT.dinner + DUTY_RATES.NIGHT_SHIFT.conveyance).toBe(1000);
  });

  it('LUNCH_BILL_RATE = 400', () => {
    expect(LUNCH_BILL_RATE).toBe(400);
  });

  it('REVENUE_STAMP = 15', () => {
    expect(REVENUE_STAMP).toBe(15);
  });
});
