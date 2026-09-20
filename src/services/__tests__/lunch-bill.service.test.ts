import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LunchBillService } from '../lunch-bill.service';

const mockLeaves: any[] = [];
const mockHolidays: any[] = [];
const mockEmployees = [
  { id: 10, bankId: '026795', name: 'জনাব সৈয়দ আরিফুল ইসলাম ইমন' },
  { id: 8, bankId: '028166', name: 'আব্দুল্লাহ আল জোবায়ের' },
];
const mockExecutives = [
  { id: 1, bankId: '010001', name: 'মোছাঃ নাসরীন সুলতানা' }
];

vi.mock('@/lib/db', () => {
  return {
    db: {
      select: vi.fn((fields) => {
        return {
          from: vi.fn((table) => {
            return {
              where: vi.fn().mockImplementation(() => Promise.resolve(mockLeaves)),
              then: vi.fn().mockImplementation((cb) => Promise.resolve(cb ? cb(mockLeaves) : mockLeaves)),
            };
          }),
        };
      }),
    },
  };
});

describe('LunchBillService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeaves.length = 0;
    mockHolidays.length = 0;
  });

  it('correctly calculates 1 day working leave for September 9, 2026 (Wednesday)', async () => {
    const { db } = await import('@/lib/db');
    (db.select as any).mockImplementation(() => ({
      from: vi.fn().mockImplementation((table) => {
        // Checking table name or schema
        const isLeave = table?.leaveType !== undefined;
        const isHoliday = table?.isWorkingDay !== undefined;
        const isExec = table?.phone !== undefined;
        
        return {
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              applicantName: 'জনাব সৈয়দ আরিফুল ইসলাম ইমন',
              bankId: '026795',
              startDate: '2026-09-09',
              endDate: '2026-09-09',
              leaveType: 'CASUAL'
            }
          ]),
          then: vi.fn().mockImplementation((cb) => {
            if (isHoliday) return Promise.resolve(cb ? cb([]) : []);
            if (isExec) return Promise.resolve(cb ? cb(mockExecutives) : mockExecutives);
            return Promise.resolve(cb ? cb(mockEmployees) : mockEmployees);
          })
        };
      })
    }));

    const result = await LunchBillService.calculateMonthlyLeaveAbsences('2026-09');

    expect(result.month).toBe('2026-09');
    expect(result.leaveDaysByBankId['026795']).toBe(1);
    expect(result.leaveDaysByEmployeeId[10]).toBe(1);
    expect(result.details['026795'].dates).toEqual(['2026-09-09']);
  });

  it('excludes weekend days and public holidays from leave absence count', async () => {
    // 2026-09-03: Thursday (working day)
    // 2026-09-04: Friday (weekend + Janmashtami)
    // 2026-09-05: Saturday (weekend)
    // 2026-09-06: Sunday (working day)
    // Total working days should be 2 (Sept 3 and Sept 6)
    const { db } = await import('@/lib/db');
    (db.select as any).mockImplementation(() => ({
      from: vi.fn().mockImplementation((table) => {
        const isHoliday = table?.isWorkingDay !== undefined;
        const isExec = table?.phone !== undefined;
        
        return {
          where: vi.fn().mockResolvedValue([
            {
              id: 2,
              applicantName: 'আব্দুল্লাহ আল জোবায়ের',
              bankId: '028166',
              startDate: '2026-09-03',
              endDate: '2026-09-06',
              leaveType: 'CASUAL'
            }
          ]),
          then: vi.fn().mockImplementation((cb) => {
            if (isHoliday) return Promise.resolve(cb ? cb([]) : []);
            if (isExec) return Promise.resolve(cb ? cb(mockExecutives) : mockExecutives);
            return Promise.resolve(cb ? cb(mockEmployees) : mockEmployees);
          })
        };
      })
    }));

    const result = await LunchBillService.calculateMonthlyLeaveAbsences('2026-09');

    expect(result.leaveDaysByBankId['028166']).toBe(2);
    expect(result.details['028166'].dates).toEqual(['2026-09-03', '2026-09-06']);
  });

  it('only counts days within the requested month when leave spans across month boundaries', async () => {
    // Leave spans 2026-08-30 to 2026-09-02 (Aug 30, Aug 31, Sept 1, Sept 2)
    // For month 2026-09:
    // Sept 1 is Tuesday (working day)
    // Sept 2 is Wednesday (working day)
    // Should be exactly 2 days for September!
    const { db } = await import('@/lib/db');
    (db.select as any).mockImplementation(() => ({
      from: vi.fn().mockImplementation((table) => {
        const isHoliday = table?.isWorkingDay !== undefined;
        const isExec = table?.phone !== undefined;
        
        return {
          where: vi.fn().mockResolvedValue([
            {
              id: 3,
              applicantName: 'জনাব সৈয়দ আরিফুল ইসলাম ইমন',
              bankId: '026795',
              startDate: '2026-08-30',
              endDate: '2026-09-02',
              leaveType: 'CASUAL'
            }
          ]),
          then: vi.fn().mockImplementation((cb) => {
            if (isHoliday) return Promise.resolve(cb ? cb([]) : []);
            if (isExec) return Promise.resolve(cb ? cb(mockExecutives) : mockExecutives);
            return Promise.resolve(cb ? cb(mockEmployees) : mockEmployees);
          })
        };
      })
    }));

    const result = await LunchBillService.calculateMonthlyLeaveAbsences('2026-09');

    expect(result.leaveDaysByBankId['026795']).toBe(2);
    expect(result.details['026795'].dates).toEqual(['2026-09-01', '2026-09-02']);
  });
});
