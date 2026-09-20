import { db } from '@/lib/db';
import { leaveApplications, holidays } from '@/db/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { getCalculatedLeaveDetails, DEFAULT_CASUAL_LEAVE_ENTITLEMENT } from '@/lib/leave-calculator';

export interface LeaveBalanceResult {
  casualTotal: number;
  casualUsed: number;
  casualRemaining: number;
  ordinaryTotal: number;
  ordinaryUsed: number;
  ordinaryRemaining: number;
  specialTotal: number;
  specialUsed: number;
  specialRemaining: number;
  casual: { total: number; used: number; remaining: number };
  ordinary: { total: number; used: number; remaining: number };
  special: { total: number; used: number; remaining: number };
  year: number;
}

export class LeaveBalanceService {
  /**
   * Centralized, single source of truth for leave balance calculation.
   * Ensures consistent figures across Leave Application, My Portal, and Dashboard.
   */
  static async calculateLeaveBalance(bankId: string, targetYear?: number): Promise<LeaveBalanceResult> {
    const year = targetYear || new Date().getFullYear();
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    if (!bankId || !bankId.trim()) {
      return {
        casualTotal: DEFAULT_CASUAL_LEAVE_ENTITLEMENT,
        casualUsed: 0,
        casualRemaining: DEFAULT_CASUAL_LEAVE_ENTITLEMENT,
        ordinaryTotal: 0,
        ordinaryUsed: 0,
        ordinaryRemaining: 0,
        specialTotal: 0,
        specialUsed: 0,
        specialRemaining: 0,
        casual: { total: DEFAULT_CASUAL_LEAVE_ENTITLEMENT, used: 0, remaining: DEFAULT_CASUAL_LEAVE_ENTITLEMENT },
        ordinary: { total: 0, used: 0, remaining: 0 },
        special: { total: 0, used: 0, remaining: 0 },
        year
      };
    }

    const trimmedBankId = bankId.trim();

    // 1. Fetch current year applications for Casual Leave calculations
    const yearApplications = await db.select().from(leaveApplications).where(
      and(
        eq(leaveApplications.bankId, trimmedBankId),
        gte(leaveApplications.startDate, startOfYear),
        lte(leaveApplications.startDate, endOfYear)
      )
    ).orderBy(desc(leaveApplications.id));

    // 2. Fetch latest application record for Service Book balances
    const latestApplications = await db.select().from(leaveApplications).where(
      eq(leaveApplications.bankId, trimmedBankId)
    ).orderBy(desc(leaveApplications.id)).limit(1);

    const latestApp = latestApplications[0] ?? null;

    // 3. Fetch holidays for sandwich leave & working days calculation
    const dbHolidays = await db.select().from(holidays);
    const mappedHolidays = dbHolidays.map(h => ({
      id: h.id,
      date: h.date,
      name: h.name,
      isWorkingDay: h.isWorkingDay
    }));

    // 4. Calculate Casual Leave entitlement
    let casualTotal = DEFAULT_CASUAL_LEAVE_ENTITLEMENT;
    if (latestApp && latestApp.casualTotal) {
      casualTotal = Number(latestApp.casualTotal);
    }

    let appliedCasualDaysSum = 0;
    let maxRecordedCasualUsed = 0;

    for (const app of yearApplications) {
      if (app.casualUsed !== null && app.casualUsed !== undefined) {
        const recordedVal = Number(app.casualUsed);
        if (recordedVal > maxRecordedCasualUsed) {
          maxRecordedCasualUsed = recordedVal;
        }
      }

      const details = getCalculatedLeaveDetails(app.startDate, app.endDate, mappedHolidays);
      const leaveDays = details.actualDeducted > 0 ? details.actualDeducted : Math.max(1, details.totalDays);

      if (app.leaveType === 'CASUAL' || app.leaveType === 'POST_FACTO' || app.leaveType === 'STATION_LEAVE') {
        appliedCasualDaysSum += leaveDays;
      }
    }

    const casualUsed = Math.max(maxRecordedCasualUsed, appliedCasualDaysSum);
    const casualRemaining = Math.max(0, casualTotal - casualUsed);

    // 5. Calculate Ordinary & Special leave balances from latest service book record
    const ordinaryTotal = latestApp ? Number(latestApp.ordinaryTotal ?? 0) : 0;
    const ordinaryUsed = latestApp ? Number(latestApp.ordinaryUsed ?? 0) : 0;
    const ordinaryRemaining = Math.max(0, ordinaryTotal - ordinaryUsed);

    const specialTotal = latestApp ? Number(latestApp.specialTotal ?? 0) : 0;
    const specialUsed = latestApp ? Number(latestApp.specialUsed ?? 0) : 0;
    const specialRemaining = Math.max(0, specialTotal - specialUsed);

    return {
      casualTotal,
      casualUsed,
      casualRemaining,
      ordinaryTotal,
      ordinaryUsed,
      ordinaryRemaining,
      specialTotal,
      specialUsed,
      specialRemaining,
      casual: { total: casualTotal, used: casualUsed, remaining: casualRemaining },
      ordinary: { total: ordinaryTotal, used: ordinaryUsed, remaining: ordinaryRemaining },
      special: { total: specialTotal, used: specialUsed, remaining: specialRemaining },
      year
    };
  }
}
