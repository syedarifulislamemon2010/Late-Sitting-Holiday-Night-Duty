import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaveBalanceService } from '../leave-balance.service';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => {
  return {
    db: {
      select: vi.fn(),
    },
  };
});

describe('LeaveBalanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default balance when bankId is empty', async () => {
    const result = await LeaveBalanceService.calculateLeaveBalance('');
    expect(result.casualTotal).toBe(20);
    expect(result.casualUsed).toBe(0);
    expect(result.casualRemaining).toBe(20);
    expect(result.ordinaryTotal).toBe(0);
    expect(result.specialTotal).toBe(0);
  });

  it('should calculate accurate leave balance when service book recorded casualUsed is 7', async () => {
    const mockYearApps = [
      {
        id: 10,
        bankId: '026795',
        startDate: '2026-09-09',
        endDate: '2026-09-09',
        leaveType: 'CASUAL',
        casualTotal: 20,
        casualUsed: 7,
      }
    ];

    const mockLatestApps = [
      {
        id: 10,
        bankId: '026795',
        casualTotal: 20,
        casualUsed: 7,
        ordinaryTotal: 120,
        ordinaryUsed: 0,
        specialTotal: 0,
        specialUsed: 0,
      }
    ];

    const mockHolidays = [
      { id: 1, date: '2026-02-21', name: 'Shaheed Day', isWorkingDay: false }
    ];

    let selectCallCount = 0;
    (db.select as any).mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // yearApplications query
          return {
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockYearApps),
            }),
          };
        } else if (selectCallCount === 2) {
          // latestApplications query
          return {
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockLatestApps),
              }),
            }),
          };
        } else {
          // holidays query
          return Promise.resolve(mockHolidays);
        }
      }),
    }));

    const result = await LeaveBalanceService.calculateLeaveBalance('026795', 2026);
    expect(result.casualTotal).toBe(20);
    expect(result.casualUsed).toBe(7);
    expect(result.casualRemaining).toBe(13); // 20 - 7 = 13
    expect(result.ordinaryTotal).toBe(120);
    expect(result.ordinaryRemaining).toBe(120);
    expect(result.specialTotal).toBe(0);
  });

  it('should prioritize the highest recorded casualUsed or calculated leave days', async () => {
    const mockYearApps = [
      {
        id: 2,
        bankId: '028166',
        startDate: '2026-09-01',
        endDate: '2026-09-01',
        leaveType: 'CASUAL',
        casualTotal: 20,
        casualUsed: 7,
      },
      {
        id: 1,
        bankId: '028166',
        startDate: '2026-07-16',
        endDate: '2026-07-16',
        leaveType: 'CASUAL',
        casualTotal: 20,
        casualUsed: 6,
      }
    ];

    const mockLatestApps = [mockYearApps[0]];
    const mockHolidays: any[] = [];

    let selectCallCount = 0;
    (db.select as any).mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockYearApps),
            }),
          };
        } else if (selectCallCount === 2) {
          return {
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockLatestApps),
              }),
            }),
          };
        } else {
          return Promise.resolve(mockHolidays);
        }
      }),
    }));

    const result = await LeaveBalanceService.calculateLeaveBalance('028166', 2026);
    expect(result.casualTotal).toBe(20);
    expect(result.casualUsed).toBe(7);
    expect(result.casualRemaining).toBe(13);
  });
});
