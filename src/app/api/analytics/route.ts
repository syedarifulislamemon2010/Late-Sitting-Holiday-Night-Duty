import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { duties, employees, cells, leaveApplications } from '@/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Verify session & role
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized', message: 'ইউজার সেশন পাওয়া যায়নি।' }, { status: 401 });
    }

    if (user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'forbidden', message: 'আপনার এই রিপোর্টটি দেখার অনুমতি নেই।' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filterMonth = searchParams.get('month'); // YYYY-MM
    const filterYear = searchParams.get('year');   // YYYY

    // 1. Month-wise Allowance Trend (Line Chart)
    const allowanceTrendRaw = await db.select({
      month: sql<string>`substring(${duties.date}, 1, 7)`,
      totalAllowance: sql<number>`COALESCE(sum(${duties.totalBill}), 0)`
    })
    .from(duties)
    .groupBy(sql`substring(${duties.date}, 1, 7)`)
    .orderBy(asc(sql`substring(${duties.date}, 1, 7)`));

    const allowanceTrend = allowanceTrendRaw.map(row => ({
      month: row.month,
      totalAllowance: Number(row.totalAllowance)
    }));

    // 2. Top Night Duty Performers (Bar Chart)
    const nightConditions = [eq(duties.type, 'NIGHT_SHIFT')];
    if (filterMonth) {
      nightConditions.push(sql`substring(${duties.date}, 1, 7) = ${filterMonth}`);
    } else if (filterYear) {
      nightConditions.push(sql`substring(${duties.date}, 1, 4) = ${filterYear}`);
    }

    const topNightPerformersRaw = await db.select({
      employeeId: duties.employeeId,
      employeeName: employees.name,
      designation: employees.designation,
      count: sql<number>`count(${duties.id})`
    })
    .from(duties)
    .innerJoin(employees, eq(duties.employeeId, employees.id))
    .where(and(...nightConditions))
    .groupBy(duties.employeeId, employees.name, employees.designation)
    .orderBy(desc(sql`count(${duties.id})`))
    .limit(10);

    const topNightPerformers = topNightPerformersRaw.map(row => ({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      designation: row.designation,
      count: Number(row.count)
    }));

    // 3. Cell-wise Budget Consumption (Pie/Bar Chart)
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

    const cellBudget = cellBudgetRaw.map(row => ({
      cellId: row.cellId,
      cellName: row.cellName,
      totalAllowance: Number(row.totalAllowance)
    }));

    // 4. Year-over-Year Leave Pattern (Line Chart)
    const leavePatternsRaw = await db.select({
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

    const leavePatterns = leavePatternsRaw.map(row => ({
      year: row.year,
      month: row.month,
      count: Number(row.count)
    }));

    return NextResponse.json({
      allowanceTrend,
      topNightPerformers,
      cellBudget,
      leavePatterns
    });
  } catch (error) {
    console.error('Analytics GET Error:', error);
    return NextResponse.json({ error: 'database_error', message: 'ডাটাবেজ সার্ভার ত্রুটি!' }, { status: 500 });
  }
}
