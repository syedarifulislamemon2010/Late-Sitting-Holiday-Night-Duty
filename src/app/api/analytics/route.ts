import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { duties, employees, cells, leaveApplications, officeOrders } from '@/db/schema';
import { eq, and, or, desc, asc, sql, like, inArray } from 'drizzle-orm';
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
    const filterMonthParam = searchParams.get('month'); // Comma-separated YYYY-MM
    const filterMonths = filterMonthParam ? filterMonthParam.split(',').filter(Boolean) : [];
    const filterYear = searchParams.get('year');   // YYYY
    const dutyTypeParam = searchParams.get('dutyType'); // Comma-separated duty types
    const dutyTypes = dutyTypeParam ? dutyTypeParam.split(',').filter(Boolean) : [];
    const cellIdParam = searchParams.get('cellId');

    const allowedCellIds = user.cells?.map((c: any) => c.id) || [];
    const allowedCellNames = user.cells?.map((c: any) => c.name) || [];

    let cellFilterId: number | null = null;
    let cellFilterName: string | null = null;

    if (user.role === 'ADMIN') {
      if (cellIdParam && cellIdParam !== 'all') {
        const cId = parseInt(cellIdParam, 10);
        if (!isNaN(cId)) {
          const cellRec = await db.select().from(cells).where(eq(cells.id, cId)).limit(1);
          if (cellRec[0]) {
            cellFilterId = cellRec[0].id;
            cellFilterName = cellRec[0].name;
          }
        }
      }
    } else if (user.role === 'USER') {
      if (cellIdParam && cellIdParam !== 'all') {
        const cId = parseInt(cellIdParam, 10);
        if (!isNaN(cId) && allowedCellIds.includes(cId)) {
          const cellRec = await db.select().from(cells).where(eq(cells.id, cId)).limit(1);
          if (cellRec[0]) {
            cellFilterId = cellRec[0].id;
            cellFilterName = cellRec[0].name;
          }
        }
      }
    }

    const getEmployeeCellCondition = () => {
      if (user.role === 'ADMIN') {
        return cellFilterId ? eq(employees.cellId, cellFilterId) : undefined;
      }
      if (user.role === 'USER') {
        if (cellFilterId) {
          return eq(employees.cellId, cellFilterId);
        }
        return allowedCellIds.length > 0 ? inArray(employees.cellId, allowedCellIds) : eq(employees.id, -1);
      }
      return undefined;
    };

    const getCellNameCondition = (field: any) => {
      if (user.role === 'ADMIN') {
        return cellFilterName 
          ? or(eq(field, cellFilterName), inArray(field, ['All Cells', 'all', 'All'])) 
          : undefined;
      }
      if (user.role === 'USER') {
        if (cellFilterName) {
          return or(eq(field, cellFilterName), inArray(field, ['All Cells', 'all', 'All']));
        }
        const cellList = [...allowedCellNames, 'All Cells', 'all', 'All'];
        return allowedCellNames.length > 0 ? inArray(field, cellList) : eq(field, 'NON_EXISTENT_CELL_NAME');
      }
      return undefined;
    };

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

    // Fetch unique bill release dates (overall or cell-scoped)
    const availableDatesConditions = [like(officeOrders.category, 'BILL_%')];
    const availableDatesCellCond = getCellNameCondition(officeOrders.cellName);
    if (availableDatesCellCond) {
      availableDatesConditions.push(availableDatesCellCond);
    }
    const availableDatesRaw = await db.select({
      orderDate: officeOrders.orderDate
    })
    .from(officeOrders)
    .where(and(...availableDatesConditions))
    .groupBy(officeOrders.orderDate)
    .orderBy(desc(officeOrders.orderDate));
    const availableReleaseDates = availableDatesRaw.map(d => d.orderDate);

    const filterReleaseDate = searchParams.get('releaseDate'); // YYYY-MM-DD or empty or 'all'
    let targetReleaseDate: string | null = null;
    if (filterReleaseDate && filterReleaseDate !== 'all') {
      targetReleaseDate = filterReleaseDate;
    } else if (filterReleaseDate === 'all') {
      targetReleaseDate = null;
    } else {
      // Default to latest date if available
      targetReleaseDate = availableReleaseDates[0] || null;
    }

    // ----------------------------------------------------
    // KPI Summary Metrics
    // ----------------------------------------------------
    // Total Released Bills (overall or cell-scoped, filtered by date)
    const totalReleasedBillsConditions = [like(officeOrders.category, 'BILL_%')];
    const releasedBillsCellCond = getCellNameCondition(officeOrders.cellName);
    if (releasedBillsCellCond) {
      totalReleasedBillsConditions.push(releasedBillsCellCond);
    }
    if (targetReleaseDate) {
      totalReleasedBillsConditions.push(eq(officeOrders.orderDate, targetReleaseDate));
    }
    const totalReleasedBillsRaw = await db.select({
      count: sql<number>`count(${officeOrders.id})`
    })
    .from(officeOrders)
    .where(and(...totalReleasedBillsConditions));
    const totalReleasedBills = Number(totalReleasedBillsRaw[0]?.count || 0);

    // Total Duties Completed (overall or cell-scoped)
    const totalDutiesConditions = [];
    const dutyCellCond = getEmployeeCellCondition();
    if (dutyCellCond) {
      totalDutiesConditions.push(dutyCellCond);
    }
    const totalDutiesRaw = await db.select({
      count: sql<number>`count(${duties.id})`
    })
    .from(duties)
    .innerJoin(employees, eq(duties.employeeId, employees.id))
    .where(totalDutiesConditions.length > 0 ? and(...totalDutiesConditions) : undefined);
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
        const trendConditions = [eq(duties.employeeId, employee.id)];
        if (dutyTypes.length > 0) {
          trendConditions.push(inArray(duties.type, dutyTypes));
        }
        allowanceTrendRaw = await db.select({
          month: sql<string>`substring(${duties.date}, 1, 7)`,
          totalAllowance: sql<number>`COALESCE(sum(${duties.totalBill}), 0)`
        })
        .from(duties)
        .where(and(...trendConditions))
        .groupBy(sql`substring(${duties.date}, 1, 7)`)
        .orderBy(asc(sql`substring(${duties.date}, 1, 7)`));
      }
    } else {
      const trendConditions = [];
      const trendCellCond = getEmployeeCellCondition();
      if (trendCellCond) {
        trendConditions.push(trendCellCond);
      }
      if (dutyTypes.length > 0) {
        trendConditions.push(inArray(duties.type, dutyTypes));
      }
      allowanceTrendRaw = await db.select({
        month: sql<string>`substring(${duties.date}, 1, 7)`,
        totalAllowance: sql<number>`COALESCE(sum(${duties.totalBill}), 0)`
      })
      .from(duties)
      .innerJoin(employees, eq(duties.employeeId, employees.id))
      .where(trendConditions.length > 0 ? and(...trendConditions) : undefined)
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
      const personalTrendConditions = [eq(duties.employeeId, employee.id)];
      if (dutyTypes.length > 0) {
        personalTrendConditions.push(inArray(duties.type, dutyTypes));
      }
      const personalTrendRaw = await db.select({
        month: sql<string>`substring(${duties.date}, 1, 7)`,
        totalAllowance: sql<number>`COALESCE(sum(${duties.totalBill}), 0)`
      })
      .from(duties)
      .where(and(...personalTrendConditions))
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
    if (dutyTypes.length > 0) {
      dutyConditions.push(inArray(duties.type, dutyTypes));
    }
    if (filterMonths.length > 0) {
      dutyConditions.push(inArray(sql`substring(${duties.date}, 1, 7)`, filterMonths));
    } else if (filterYear) {
      dutyConditions.push(sql`substring(${duties.date}, 1, 4) = ${filterYear}`);
    }
    const performersCellCond = getEmployeeCellCondition();
    if (performersCellCond) {
      dutyConditions.push(performersCellCond);
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
      const budgetConditions = [];
      const budgetCellCond = getEmployeeCellCondition();
      if (budgetCellCond) {
        budgetConditions.push(budgetCellCond);
      }
      if (dutyTypes.length > 0) {
        budgetConditions.push(inArray(duties.type, dutyTypes));
      }
      if (filterMonths.length > 0) {
        budgetConditions.push(inArray(sql`substring(${duties.date}, 1, 7)`, filterMonths));
      } else if (filterYear) {
        budgetConditions.push(sql`substring(${duties.date}, 1, 4) = ${filterYear}`);
      }
      const cellBudgetRaw = await db.select({
        cellId: employees.cellId,
        cellName: cells.name,
        totalAllowance: sql<number>`COALESCE(sum(${duties.totalBill}), 0)`
      })
      .from(duties)
      .innerJoin(employees, eq(duties.employeeId, employees.id))
      .innerJoin(cells, eq(employees.cellId, cells.id))
      .where(budgetConditions.length > 0 ? and(...budgetConditions) : undefined)
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
      const leaveConditions = [];
      const leaveCellCond = getCellNameCondition(leaveApplications.cellName);
      if (leaveCellCond) {
        leaveConditions.push(leaveCellCond);
      }
      leavePatternsRaw = await db.select({
        year: sql<string>`substring(${leaveApplications.startDate}, 1, 4)`,
        month: sql<string>`substring(${leaveApplications.startDate}, 6, 2)`,
        count: sql<number>`count(${leaveApplications.id})`
      })
      .from(leaveApplications)
      .where(leaveConditions.length > 0 ? and(...leaveConditions) : undefined)
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
    if (targetReleaseDate) {
      billConditions.push(eq(officeOrders.orderDate, targetReleaseDate));
    } else {
      if (filterMonths.length > 0) {
        billConditions.push(inArray(sql`substring(${officeOrders.orderDate}, 1, 7)`, filterMonths));
      } else if (filterYear) {
        billConditions.push(sql`substring(${officeOrders.orderDate}, 1, 4) = ${filterYear}`);
      }
    }
    const billReleasesCellCond = getCellNameCondition(officeOrders.cellName);
    if (billReleasesCellCond) {
      billConditions.push(billReleasesCellCond);
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
      hasEmployeeProfile: !!employee,
      summary: {
        totalReleasedBills,
        totalDutiesCompleted,
        myBillCount,
        myTotalEarnings
      },
      availableReleaseDates,
      selectedReleaseDate: targetReleaseDate || 'all',
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
