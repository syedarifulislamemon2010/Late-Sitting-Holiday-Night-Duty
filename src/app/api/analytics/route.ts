import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { duties, employees, cells, leaveApplications, officeOrders } from '@/db/schema';
import { eq, and, or, sql, like, inArray, asc } from 'drizzle-orm';

// In-memory cache for ultra-fast analytics queries (TTL: 30 seconds)
const analyticsCache = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL_MS = 30 * 1000;

export async function GET(request: Request) {
  try {
    // Verify session
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized', message: 'ইউজার সেশন পাওয়া যায়নি।' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterMonthParam = searchParams.get('month'); // Comma-separated YYYY-MM
    const filterYear = searchParams.get('year') || '2026';   // YYYY
    const dutyTypeParam = searchParams.get('dutyType'); // Comma-separated duty types
    const dutyTypes = dutyTypeParam ? dutyTypeParam.split(',').filter(Boolean) : [];
    const cellIdParam = searchParams.get('cellId');
    const filterReleaseDate = searchParams.get('releaseDate'); // YYYY-MM-DD or empty or 'all'

    // Fast memory cache check
    const cacheKey = `${user.role}_${user.id}_${filterMonthParam || ''}_${filterYear}_${dutyTypeParam || ''}_${cellIdParam || ''}_${filterReleaseDate || ''}`;
    const cached = analyticsCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const allowedCellNames = user.cells?.map((c: { name: string }) => c.name) || [];

    // Parallel fetch base tables in 1 concurrent round-trip
    const [
      employeeList,
      allActiveOfficeOrdersRaw,
      allCellsRaw,
      leavePatternsRaw,
      rawDutiesCount
    ] = await Promise.all([
      db.select({
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
      .where(eq(employees.userId, user.id)),

      db.select().from(officeOrders).where(
        and(
          sql`${officeOrders.status} != 'Deleted'`,
          or(
            inArray(officeOrders.category, ['LATE_SITTING', 'HOLIDAY', 'NIGHT_SHIFT']),
            like(officeOrders.category, 'BILL_%')
          )
        )
      ),

      db.select().from(cells),

      db.select({
        year: sql<string>`substring(${leaveApplications.startDate}, 1, 4)`,
        month: sql<string>`substring(${leaveApplications.startDate}, 6, 2)`,
        count: sql<number>`count(${leaveApplications.id})`
      })
      .from(leaveApplications)
      .where(sql`${leaveApplications.startDate} IS NOT NULL`)
      .groupBy(
        sql`substring(${leaveApplications.startDate}, 1, 4)`,
        sql`substring(${leaveApplications.startDate}, 6, 2)`
      )
      .orderBy(
        asc(sql`substring(${leaveApplications.startDate}, 1, 4)`),
        asc(sql`substring(${leaveApplications.startDate}, 6, 2)`)
      ),

      db.select({ count: sql<number>`count(${duties.id})` }).from(duties)
    ]);

    const employee = employeeList[0] || null;
    // Available bill release dates
    const billCopies = allActiveOfficeOrdersRaw.filter(o => 
      o.category.startsWith('BILL_') && o.status !== 'Deleted'
    );
    const availableReleaseDates = Array.from(new Set(
      billCopies.map(o => o.orderDate).filter(Boolean)
    )).sort().reverse();

    const nonBillOrders = allActiveOfficeOrdersRaw.filter(o => 
      !o.category.startsWith('BILL_') && o.status !== 'Deleted'
    );

    // Filter orders by selected criteria
    let filteredOrders = nonBillOrders;
    if (cellIdParam && cellIdParam !== 'all') {
      const targetCell = allCellsRaw.find(c => String(c.id) === cellIdParam);
      if (targetCell) {
        filteredOrders = filteredOrders.filter(o => o.cellName === targetCell.name || o.cellName === 'All Cells');
      }
    } else if (user.role === 'USER' && allowedCellNames.length > 0) {
      filteredOrders = filteredOrders.filter(o => allowedCellNames.includes(o.cellName || '') || o.cellName === 'All Cells');
    }

    if (dutyTypes.length > 0) {
      filteredOrders = filteredOrders.filter(o => dutyTypes.includes(o.category));
    }

    // Exact calculations matching the Monthly Billing Ledger
    let totalDutyDaysCount = 0;
    let totalGrandBillAmount = 0;
    const cellBudgetMap = new Map<string, number>();
    const employeeDutyMap = new Map<string, { name: string; designation: string; count: number }>();
    const monthlyAllowanceMap = new Map<string, number>();
    const dateReleaseCountMap = new Map<string, number>();
    const employeeBillCountMap = new Map<string, number>();

    filteredOrders.forEach(order => {
      interface OrderDutyRecord {
        employeeName?: string;
        name?: string;
        designation?: string;
        dates?: string[];
        date?: string;
        days?: number;
      }
      let dutiesList: OrderDutyRecord[] = [];
      if (order.dutiesJson) {
        try {
          dutiesList = JSON.parse(order.dutiesJson);
        } catch {}
      }

      let orderDays = 0;
      dutiesList.forEach((d: OrderDutyRecord) => {
        const empName = (d.employeeName || d.name || order.employeeName || '').trim();
        const desig = d.designation || 'কর্মকর্তা';
        const dates: string[] = Array.isArray(d.dates) ? d.dates : (d.date ? [d.date] : []);
        const days = dates.length > 0 ? dates.length : (d.days || 1);

        orderDays += days;

        if (empName) {
          const existingEmp = employeeDutyMap.get(empName) || { name: empName, designation: desig, count: 0 };
          existingEmp.count += days;
          employeeDutyMap.set(empName, existingEmp);
        }
      });

      if (orderDays === 0) {
        orderDays = 1;
      }
      totalDutyDaysCount += orderDays;

      let rate = 300;
      if (order.category === 'HOLIDAY') rate = 500;
      else if (order.category === 'NIGHT_SHIFT') rate = 1000;

      const orderTotal = orderDays * rate;
      totalGrandBillAmount += orderTotal;

      const cName = order.cellName && order.cellName !== 'All Cells' ? order.cellName : 'মূল ও সংযুক্ত সেলসমূহ';
      cellBudgetMap.set(cName, (cellBudgetMap.get(cName) || 0) + orderTotal);

      const monthStr = order.orderDate ? order.orderDate.substring(0, 7) : `${filterYear}-01`;
      monthlyAllowanceMap.set(monthStr, (monthlyAllowanceMap.get(monthStr) || 0) + orderTotal);
    });

    billCopies.forEach(bill => {
      const d = bill.orderDate || `${filterYear}-06-10`;
      dateReleaseCountMap.set(d, (dateReleaseCountMap.get(d) || 0) + 1);

      const emp = (bill.employeeName || '').replace(/^\s*জনাব\s+/, '').trim();
      if (emp) {
        employeeBillCountMap.set(emp, (employeeBillCountMap.get(emp) || 0) + 1);
      }
    });

    const totalReleasedBills = billCopies.length > 0 ? billCopies.length : filteredOrders.length;
    const totalDutiesCompleted = Math.max(totalDutyDaysCount, Number(rawDutiesCount[0]?.count || 0));

    const topPerformers = Array.from(employeeDutyMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(emp => ({
        employeeName: emp.name,
        designation: emp.designation,
        count: emp.count
      }));

    let cellBudget = Array.from(cellBudgetMap.entries())
      .map(([cellName, totalAllowance], idx) => ({
        cellId: idx + 1,
        cellName,
        totalAllowance
      }))
      .sort((a, b) => b.totalAllowance - a.totalAllowance);

    if (cellBudget.length === 0) {
      cellBudget = allCellsRaw.map(c => ({
        cellId: c.id,
        cellName: c.name,
        totalAllowance: 0
      }));
    }

    const allowanceTrend = Array.from(monthlyAllowanceMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, totalAllowance]) => ({
        month,
        totalAllowance
      }));

    const leavePatterns = leavePatternsRaw.map(row => ({
      year: row.year,
      month: row.month,
      count: Number(row.count)
    }));

    const billReleases = Array.from(dateReleaseCountMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([orderDate, count]) => ({
        orderDate,
        count
      }));

    const employeeBillCounts = Array.from(employeeBillCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([employeeName, count]) => ({
        employeeName,
        count
      }));

    const resultData = {
      role: user.role,
      hasEmployeeProfile: !!employee,
      summary: {
        totalReleasedBills,
        totalDutiesCompleted,
        totalApprovedBillAmount: totalGrandBillAmount,
        myBillCount: 0,
        myTotalEarnings: 0
      },
      availableReleaseDates,
      selectedReleaseDate: filterReleaseDate || 'all',
      allowanceTrend,
      personalAllowanceTrend: [],
      topPerformers,
      cellBudget,
      leavePatterns,
      billReleases,
      employeeBillCounts
    };

    analyticsCache.set(cacheKey, { timestamp: now, data: resultData });

    return NextResponse.json(resultData);

  } catch (error) {
    logger.error('Analytics GET Error:', error);
    return NextResponse.json({ error: 'database_error', message: 'ডাটাবেজ সার্ভার ত্রুটি!' }, { status: 500 });
  }
}
