import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { employees, duties, leaveApplications, holidays, cells } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getCalculatedLeaveDetails, DEFAULT_CASUAL_LEAVE_ENTITLEMENT } from '@/lib/leave-calculator';
import { logActivity } from '@/lib/audit';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized', message: 'ইউজার সেশন পাওয়া যায়নি।' }, { status: 401 });
    }

    // 1. Resolve linked employee record
    let employeeList = await db.select({
      id: employees.id,
      name: employees.name,
      designation: employees.designation,
      bankId: employees.bankId,
      fileNo: employees.fileNo,
      mobile: employees.mobile,
      cellId: employees.cellId,
      cellName: cells.name,
      userId: employees.userId
    })
    .from(employees)
    .innerJoin(cells, eq(employees.cellId, cells.id))
    .where(eq(employees.userId, user.id));

    let employee = employeeList[0];

    if (!employee) {
      // Attempt case-sensitive exact match lookup of bankId === user.username
      const exactMatchList = await db.select({
        id: employees.id,
        name: employees.name,
        designation: employees.designation,
        bankId: employees.bankId,
        fileNo: employees.fileNo,
        mobile: employees.mobile,
        cellId: employees.cellId,
        cellName: cells.name,
        userId: employees.userId
      })
      .from(employees)
      .innerJoin(cells, eq(employees.cellId, cells.id))
      .where(eq(employees.bankId, user.username)); // Drizzle exact case-sensitive match

      const matchedEmp = exactMatchList[0];
      if (matchedEmp) {
        // Auto-link user to employee record
        await db.update(employees).set({ userId: user.id }).where(eq(employees.id, matchedEmp.id));
        employee = { ...matchedEmp, userId: user.id };

        // Log this auto-linking event in audit logs
        const reqHeaders = await headers();
        const ipAddress = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || '127.0.0.1';
        const userAgent = reqHeaders.get('user-agent') || 'Unknown';

        await logActivity({
          username: user.username,
          action: 'UPDATE',
          entityType: 'EMPLOYEE',
          entityId: String(employee.id),
          ipAddress,
          userAgent,
          details: `System auto-linked User account @${user.username} to Employee record: ${employee.name} (${employee.bankId}) (Exact case-sensitive match bankId).`
        });
      }
    }

    if (!employee) {
      return NextResponse.json({ 
        error: 'employee_not_found', 
        message: 'আপনার ব্যাংক আইডির সাথে সংশ্লিষ্ট কোনো কর্মকর্তা রেকর্ড খুঁজে পাওয়া যায়নি।' 
      }, { status: 404 });
    }

    // 2. Fetch personal duties
    const employeeDuties = await db.select()
      .from(duties)
      .where(eq(duties.employeeId, employee.id))
      .orderBy(desc(duties.date));

    // 3. Fetch leave applications
    const employeeLeaves = await db.select()
      .from(leaveApplications)
      .where(eq(leaveApplications.userId, user.id))
      .orderBy(desc(leaveApplications.startDate));

    // 4. Calculate casual leave balance
    const dbHolidays = await db.select().from(holidays);
    const mappedHolidays = dbHolidays.map(h => ({
      id: h.id,
      date: h.date,
      name: h.name,
      isWorkingDay: h.isWorkingDay
    }));

    let casualUsed = 0;
    employeeLeaves.forEach(leave => {
      const type = leave.leaveType;
      if (type === 'CASUAL' || type === 'STATION_LEAVE' || type === 'POST_FACTO') {
        const details = getCalculatedLeaveDetails(leave.startDate, leave.endDate, mappedHolidays);
        casualUsed += details.actualDeducted;
      }
    });

    const casualTotal = DEFAULT_CASUAL_LEAVE_ENTITLEMENT;
    const casualRemaining = Math.max(0, casualTotal - casualUsed);

    // 5. Aggregate monthly ledger
    // We group employee's duties by month (YYYY-MM) and sum allowances
    const monthlyLedgerRaw = await db.select({
      month: sql<string>`substring(${duties.date}, 1, 7)`,
      allowance1Sum: sql<number>`COALESCE(sum(${duties.allowance1}), 0)`,
      allowance2Sum: sql<number>`COALESCE(sum(${duties.allowance2}), 0)`,
      totalBillSum: sql<number>`COALESCE(sum(${duties.totalBill}), 0)`
    })
    .from(duties)
    .where(eq(duties.employeeId, employee.id))
    .groupBy(sql`substring(${duties.date}, 1, 7)`)
    .orderBy(desc(sql`substring(${duties.date}, 1, 7)`));

    const monthlyLedger = monthlyLedgerRaw.map(row => ({
      month: row.month,
      allowance1: Number(row.allowance1Sum),
      allowance2: Number(row.allowance2Sum),
      totalBill: Number(row.totalBillSum)
    }));

    // 6. Fetch eligible covering officers from same cell
    const coveringOfficers = await db.select({
      id: employees.id,
      name: employees.name,
      designation: employees.designation,
      bankId: employees.bankId
    })
    .from(employees)
    .where(and(
      eq(employees.cellId, employee.cellId),
      sql`${employees.id} != ${employee.id}`
    ));

    return NextResponse.json({
      employee,
      duties: employeeDuties,
      leaves: employeeLeaves,
      leaveBalance: {
        total: casualTotal,
        used: casualUsed,
        remaining: casualRemaining
      },
      monthlyLedger,
      coveringOfficers
    });
  } catch (error) {
    console.error('My Portal GET Error:', error);
    return NextResponse.json({ error: 'database_error', message: 'ডাটাবেজ সার্ভার ত্রুটি!' }, { status: 500 });
  }
}
