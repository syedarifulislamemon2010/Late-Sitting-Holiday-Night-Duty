import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { duties, employees, cells, leaveApplications, officeOrders } from '@/db/schema';
import { eq, and, desc, asc, sql, like } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Verify session
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized', message: 'ইউজার সেশন পাওয়া যায়নি।' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterMonth = searchParams.get('month'); // YYYY-MM
    const filterYear = searchParams.get('year');   // YYYY
    const dutyType = searchParams.get('dutyType') || ''; // LATE_SITTING, HOLIDAY, NIGHT_SHIFT or empty

    const isEmployee = user.role === 'EMPLOYEE';

    // 1. Resolve employee record for logged-in user (regardless of role, check by userId or bankId)
    let employee: any = null;
    const employeeList = await db.select({
      id: employees.id,
      name: employees.name,
      designation: employees.designation,
      bankId: employees.bankId,
      cellId: employees.cellId,
      cellName: cells.name,
      userId: employees.userId
    })
    .from(employees)
    .innerJoin(cells, eq(employees.cellId, cells.id))
    .where(eq(employees.userId, user.id));

    employee = employeeList[0];

    if (!employee) {
      // Fallback case-sensitive exact match lookup
      const exactMatchList = await db.select({
        id: employees.id,
        name: employees.name,
        designation: employees.designation,
        bankId: employees.bankId,
        cellId: employees.cellId,
        cellName: cells.name,
        userId: employees.userId
      })
      .from(employees)
      .innerJoin(cells, eq(employees.cellId, cells.id))
      .where(eq(employees.bankId, user.username));

      const matchedEmp = exactMatchList[0];
      if (matchedEmp) {
        await db.update(employees).set({ userId: user.id }).where(eq(employees.id, matchedEmp.id));
        employee = { ...matchedEmp, userId: user.id };

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
          details: `System auto-linked User account @${user.username} to Employee record: ${employee.name} (${employee.bankId}) (Exact match bankId).`
        });
      }
    }

    // ----------------------------------------------------
    // KPI Summary Metrics
    // ----------------------------------------------------
    // Total Released Bills (overall)
    const totalReleasedBillsRaw = await db.select({
      count: sql<number>`count(${officeOrders.id})`
    })
    .from(officeOrders)
    .where(like(officeOrders.category, 'BILL_%'));
    const totalReleasedBills = Number(totalReleasedBillsRaw[0]?.count || 0);

    // Total Duties Completed (overall)
    const totalDutiesRaw = await db.select({
      count: sql<number>`count(${duties.id})`
    })
    .from(duties);
    const totalDutiesCompleted = Number(totalDutiesRaw[0]?.count || 0);

    // Logged-in employee's personal released bills count
    let myBillCount = 0;
    if (employee) {
      const myCountRaw = await db.select({
        count: sql<number>`count(${officeOrders.id})`
      })
      .from(officeOrders)
      .where(and(
        like(officeOrders.category, 'BILL_%'),
        sql`position(${employee.name} in ${officeOrders.employeeName}) > 0`
      ));
      myBillCount = Number(myCountRaw[0]?.count || 0);
    }

    // Logged-in employee's personal total earnings
    let myTotalEarnings = 0;
    if (employee) {
      const myEarningsRaw = await db.select({
        sum: sql<number>`COALESCE(sum(${duties.totalBill}), 0)`
      })
      .from(duties)
      .where(eq(duties.employeeId, employee.id));
      myTotalEarnings = Number(myEarningsRaw[0]?.sum || 0);
    }

    // ----------------------------------------------------
    // QUERY A: Allowance Trend (Line Chart)
    // - Security: Employees only see their own money trend.
    // - Admins/Users see overall bank-wide trend.
    // ----------------------------------------------------
    let allowanceTrendRaw: { month: string; totalAllowance: number }[] = [];
    if (isEmployee) {
      if (!employee) {
        allowanceTrendRaw = [];
      } else {
        allowanceTrendRaw = await db.select({
          month: sql<string>`substring(${duties.date}, 1, 7)`,
          totalAllowance: sql<number>`COALESCE(sum(${duties.totalBill}), 0)`
        })
        .from(duties)
        .where(eq(duties.employeeId, employee.id))
        .groupBy(sql`substring(${duties.date}, 1, 7)`)
        .orderBy(asc(sql`substring(${duties.date}, 1, 7)`));
      }
    } else {
      allowanceTrendRaw = await db.select({
        month: sql<string>`substring(${duties.date}, 1, 7)`,
        totalAllowance: sql<number>`COALESCE(sum(${duties.totalBill}), 0)`
      })
      .from(duties)
      .groupBy(sql`substring(${duties.date}, 1, 7)`)
      .orderBy(asc(sql`substring(${duties.date}, 1, 7)`));
    }

    const allowanceTrend = allowanceTrendRaw.map(row => ({
      month: row.month,
      totalAllowance: Number(row.totalAllowance)
    }));

    // ----------------------------------------------------
    // QUERY A2: Personal Allowance Trend (Line Chart)
    // - For any logged-in user who has a linked Employee record, so they can see their own money
    // ----------------------------------------------------
    let personalAllowanceTrend: { month: string; totalAllowance: number }[] = [];
    if (employee) {
      const personalTrendRaw = await db.select({
        month: sql<string>`substring(${duties.date}, 1, 7)`,
        totalAllowance: sql<number>`COALESCE(sum(${duties.totalBill}), 0)`
      })
      .from(duties)
      .where(eq(duties.employeeId, employee.id))
      .groupBy(sql`substring(${duties.date}, 1, 7)`)
      .orderBy(asc(sql`substring(${duties.date}, 1, 7)`));

      personalAllowanceTrend = personalTrendRaw.map(row => ({
        month: row.month,
        totalAllowance: Number(row.totalAllowance)
      }));
    }

    // ----------------------------------------------------
    // QUERY B: Top Performers (Bar Chart)
    // - Security: Shows COUNT of duties only. NO monetary allowance columns.
    // - Filters: Type (LATE_SITTING, HOLIDAY, NIGHT_SHIFT, or empty for all)
    // - Accessible by everyone (including employees).
    // ----------------------------------------------------
    const dutyConditions = [];
    if (dutyType && dutyType !== 'SELECT') {
      dutyConditions.push(eq(duties.type, dutyType));
    }
    if (filterMonth) {
      dutyConditions.push(sql`substring(${duties.date}, 1, 7) = ${filterMonth}`);
    } else if (filterYear) {
      dutyConditions.push(sql`substring(${duties.date}, 1, 4) = ${filterYear}`);
    }

    const topPerformersRaw = await db.select({
      employeeId: duties.employeeId,
      employeeName: employees.name,
      designation: employees.designation,
      count: sql<number>`count(${duties.id})`
    })
    .from(duties)
    .innerJoin(employees, eq(duties.employeeId, employees.id))
    .where(dutyConditions.length > 0 ? and(...dutyConditions) : undefined)
    .groupBy(duties.employeeId, employees.name, employees.designation)
    .orderBy(desc(sql`count(${duties.id})`))
    .limit(10);

    const topPerformers = topPerformersRaw.map(row => ({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      designation: row.designation,
      count: Number(row.count)
    }));

    // ----------------------------------------------------
    // QUERY C: Cell-wise Budget Consumption (Pie Chart)
    // - Security: Only visible to ADMIN/USER.
    // ----------------------------------------------------
    let cellBudget: { cellId: number | null; cellName: string | null; totalAllowance: number }[] = [];
    if (!isEmployee) {
      const cellBudgetRaw = await db.select({
        cellId: employees.cellId,
        cellName: cells.name,
        totalAllowance: sql<number>`COALESCE(sum(${duties.totalBill}), 0)`
      })
      .from(duties)
      .innerJoin(employees, eq(duties.employeeId, employees.id))
      .innerJoin(cells, eq(employees.cellId, cells.id))
      .groupBy(employees.cellId, cells.name)
      .orderBy(desc(sql`COALESCE(sum(${duties.totalBill}), 0)`));

      cellBudget = cellBudgetRaw.map(row => ({
        cellId: row.cellId,
        cellName: row.cellName,
        totalAllowance: Number(row.totalAllowance)
      }));
    }

    // ----------------------------------------------------
    // QUERY D: YoY Leave Pattern (Line Chart)
    // - Security: Employees only see their own leave counts.
    // - Admins/Users see overall leave counts.
    // ----------------------------------------------------
    let leavePatternsRaw: { year: string; month: string; count: number }[] = [];
    if (isEmployee) {
      leavePatternsRaw = await db.select({
        year: sql<string>`substring(${leaveApplications.startDate}, 1, 4)`,
        month: sql<string>`substring(${leaveApplications.startDate}, 6, 2)`,
        count: sql<number>`count(${leaveApplications.id})`
      })
      .from(leaveApplications)
      .where(eq(leaveApplications.userId, user.id))
      .groupBy(
        sql`substring(${leaveApplications.startDate}, 1, 4)`,
        sql`substring(${leaveApplications.startDate}, 6, 2)`
      )
      .orderBy(
        asc(sql`substring(${leaveApplications.startDate}, 1, 4)`),
        asc(sql`substring(${leaveApplications.startDate}, 6, 2)`)
      );
    } else {
      leavePatternsRaw = await db.select({
        year: sql<string>`substring(${leaveApplications.startDate}, 1, 4)`,
        month: sql<string>`substring(${leaveApplications.startDate}, 6, 2)`,
        count: sql<number>`count(${leaveApplications.id})`
      })
      .from(leaveApplications)
      .groupBy(
        sql`substring(${leaveApplications.startDate}, 1, 4)`,
        sql`substring(${leaveApplications.startDate}, 6, 2)`
      )
      .orderBy(
        asc(sql`substring(${leaveApplications.startDate}, 1, 4)`),
        asc(sql`substring(${leaveApplications.startDate}, 6, 2)`)
      );
    }

    const leavePatterns = leavePatternsRaw.map(row => ({
      year: row.year,
      month: row.month,
      count: Number(row.count)
    }));

    // ----------------------------------------------------
    // QUERY E: Bill Releases by Release Date (Bar/Line Chart)
    // - Public metric showing released bills counts by date.
    // ----------------------------------------------------
    const billConditions = [like(officeOrders.category, 'BILL_%')];
    if (filterMonth) {
      billConditions.push(sql`substring(${officeOrders.orderDate}, 1, 7) = ${filterMonth}`);
    } else if (filterYear) {
      billConditions.push(sql`substring(${officeOrders.orderDate}, 1, 4) = ${filterYear}`);
    }

    const billReleasesRaw = await db.select({
      orderDate: officeOrders.orderDate,
      count: sql<number>`count(${officeOrders.id})`
    })
    .from(officeOrders)
    .where(and(...billConditions))
    .groupBy(officeOrders.orderDate)
    .orderBy(asc(officeOrders.orderDate));

    const billReleases = billReleasesRaw.map(row => ({
      orderDate: row.orderDate,
      count: Number(row.count)
    }));

    // ----------------------------------------------------
    // QUERY F: Bill Release Count per Employee (Bar/Table)
    // - Public count metric of bills released per employee.
    // ----------------------------------------------------
    const employeeBillCountsRaw = await db.select({
      employeeName: officeOrders.employeeName,
      count: sql<number>`count(${officeOrders.id})`
    })
    .from(officeOrders)
    .where(and(...billConditions))
    .groupBy(officeOrders.employeeName)
    .orderBy(desc(sql`count(${officeOrders.id})`));

    const employeeBillCounts = employeeBillCountsRaw.map(row => ({
      employeeName: row.employeeName.replace(/^\s*জনাব\s+/, ''), // Clean up honorifics
      count: Number(row.count)
    }));

    return NextResponse.json({
      role: user.role,
      summary: {
        totalReleasedBills,
        totalDutiesCompleted,
        myBillCount,
        myTotalEarnings
      },
      allowanceTrend,
      personalAllowanceTrend,
      topPerformers,
      cellBudget,
      leavePatterns,
      billReleases,
      employeeBillCounts
    });

  } catch (error) {
    console.error('Analytics GET Error:', error);
    return NextResponse.json({ error: 'database_error', message: 'ডাটাবেজ সার্ভার ত্রুটি!' }, { status: 500 });
  }
}
