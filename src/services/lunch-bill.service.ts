import { db } from '@/lib/db';
import { leaveApplications, holidays, employees, executives } from '@/db/schema';
import { isNonWorkingDay } from '@/lib/leave-calculator';
import { and, gte, lte } from 'drizzle-orm';

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
