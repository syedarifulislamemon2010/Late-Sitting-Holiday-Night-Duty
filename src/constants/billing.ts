export const DUTY_RATES = {
  LATE_SITTING: { total: 300, refreshment: 100, conveyance: 200 },
  HOLIDAY: { total: 500, lunch: 250, conveyance: 250 },
  NIGHT_SHIFT: { total: 1000, dinner: 600, conveyance: 400 },
} as const;

export const LUNCH_BILL_RATE = 400;
export const CLOSING_BILL_RATE = 2000;
export const REVENUE_STAMP = 15;
