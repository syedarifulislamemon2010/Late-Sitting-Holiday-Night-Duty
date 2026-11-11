import { db } from '@/lib/db';
import { leaveApplications, holidays, employees, executives, users, userCells } from '@/db/schema';
import { isNonWorkingDay } from '@/lib/leave-calculator';
import { and, gte, lte, eq } from 'drizzle-orm';

export interface MonthlyLeaveSummary {
  month: string;
  leaveDaysByBankId: Record<string, number>;
  leaveDaysByEmployeeId: Record<number, number>;
  leaveDaysByExecutiveId: Record<number, number>;
  details: Record<string, {
    applicantName: string;
    workingLeaveDays: number;
    dates: string[];
    leaveTypes: string[];
  }>;
}

export class LunchBillService {
  /**
   * Resolves the strict single cell allowed for a non-admin user in Lunch Bill.
   * In Lunch Bill, non-admin officers of R09 and CBS cannot see each other.
   * Returns null for ADMIN (all cells allowed).
   */
  static async getUserLunchBillCellIds(user: { username: string; role: string; cells?: Array<{ id: number; name: string }>; primaryCellId?: number | null }): Promise<number[] | null> {
    if (user.role === 'ADMIN') {
      return null;
    }

    // 1. If primaryCellId is already available, respect it directly
    if (user.primaryCellId) {
      return [Number(user.primaryCellId)];
    }

    // 2. Query employee record by bankId
    const empList = await db
      .select({ cellId: employees.cellId })
      .from(employees)
      .where(eq(employees.bankId, user.username))
      .limit(1);
    
    if (empList[0]?.cellId) {
      return [Number(empList[0].cellId)];
    }

    // 3. Query direct user_cells in DB before synthetic expansion
    try {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.username, user.username)).limit(1);
      if (userRecord[0]) {
        const rawUserCells = await db.select({ cellId: userCells.A }).from(userCells).where(eq(userCells.B, userRecord[0].id));
        const rawIds = rawUserCells.map(uc => Number(uc.cellId));
        if (rawIds.length > 0) {
          // If user belongs strictly to CBS (9) or R09 (7), return only that
          if (rawIds.includes(9) && !rawIds.includes(7)) return [9];
          if (rawIds.includes(7) && !rawIds.includes(9)) return [7];
          return [rawIds[0]];
        }
      }
    } catch {
      // fail-soft
    }

    // 4. Fallback to direct assigned cells in session
    const cellIds = user.cells?.map(c => Number(c.id)) || [];
    return cellIds.length > 0 ? [cellIds[0]] : [];
  }

  /**
   * Calculates the working days an employee/executive was on leave during a given month (YYYY-MM).
   * Only official working days (non-weekends and non-holidays) are counted as absent days for lunch billing.
   */
  static async calculateMonthlyLeaveAbsences(month: string): Promise<MonthlyLeaveSummary> {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Invalid month format. Expected YYYY-MM');
    }

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const totalDaysInMonth = new Date(year, monthNum, 0).getDate();

    const monthStart = `${yearStr}-${monthStr.padStart(2, '0')}-01`;
    const monthEnd = `${yearStr}-${monthStr.padStart(2, '0')}-${String(totalDaysInMonth).padStart(2, '0')}`;

    // 1. Fetch holidays from database
    const dbHolidays = await db.select().from(holidays);
    const mappedHolidays = dbHolidays.map(h => ({
      id: h.id,
      date: h.date,
      name: h.name,
      isWorkingDay: h.isWorkingDay
    }));

    // 2. Fetch leaves overlapping with this month
    const overlappingLeaves = await db.select().from(leaveApplications).where(
      and(
        lte(leaveApplications.startDate, monthEnd),
        gte(leaveApplications.endDate, monthStart)
      )
    );

    // 3. Fetch employees and executives for ID mapping
    const [empList, execList] = await Promise.all([
      db.select({ id: employees.id, bankId: employees.bankId, name: employees.name }).from(employees),
      db.select({ id: executives.id, bankId: executives.bankId, name: executives.name }).from(executives)
    ]);

    const bankIdToEmpId: Record<string, number> = {};
    for (const emp of empList) {
      if (emp.bankId) {
        bankIdToEmpId[emp.bankId.trim().toLowerCase()] = emp.id;
      }
    }

    const bankIdToExecId: Record<string, number> = {};
    for (const ex of execList) {
      if (ex.bankId) {
        bankIdToExecId[ex.bankId.trim().toLowerCase()] = ex.id;
      }
    }

    // 4. Map working days on leave per bankId
    const leaveDatesByBankId: Record<string, Set<string>> = {};
    const details: MonthlyLeaveSummary['details'] = {};

    for (const app of overlappingLeaves) {
      const bankId = (app.bankId || '').trim().toLowerCase();
      if (!bankId) continue;

      if (!leaveDatesByBankId[bankId]) {
        leaveDatesByBankId[bankId] = new Set<string>();
        details[bankId] = {
          applicantName: app.applicantName,
          workingLeaveDays: 0,
          dates: [],
          leaveTypes: []
        };
      }

      if (!details[bankId].leaveTypes.includes(app.leaveType)) {
        details[bankId].leaveTypes.push(app.leaveType);
      }

      // Determine date boundary for this leave within this month
      const effectiveStart = app.startDate < monthStart ? monthStart : app.startDate;
      const effectiveEnd = app.endDate > monthEnd ? monthEnd : app.endDate;

      const curr = new Date(effectiveStart);
      const end = new Date(effectiveEnd);

      while (curr <= end) {
        const dStr = curr.toISOString().split('T')[0];
        // Only count if it's a working day (excluding weekends and public holidays)
        if (!isNonWorkingDay(dStr, mappedHolidays)) {
          leaveDatesByBankId[bankId].add(dStr);
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    const leaveDaysByBankId: Record<string, number> = {};
    const leaveDaysByEmployeeId: Record<number, number> = {};
    const leaveDaysByExecutiveId: Record<number, number> = {};

    for (const [bankId, datesSet] of Object.entries(leaveDatesByBankId)) {
      const count = datesSet.size;
      leaveDaysByBankId[bankId] = count;
      if (details[bankId]) {
        details[bankId].workingLeaveDays = count;
        details[bankId].dates = Array.from(datesSet).sort();
      }

      const empId = bankIdToEmpId[bankId];
      if (empId !== undefined) {
        leaveDaysByEmployeeId[empId] = count;
      }

      const execId = bankIdToExecId[bankId];
      if (execId !== undefined) {
        leaveDaysByExecutiveId[execId] = count;
      }
    }

    return {
      month,
      leaveDaysByBankId,
      leaveDaysByEmployeeId,
      leaveDaysByExecutiveId,
      details
    };
  }
}
