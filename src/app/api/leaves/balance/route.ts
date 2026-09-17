import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { leaveApplications, holidays } from '@/db/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { getCalculatedLeaveDetails } from '@/lib/leave-calculator';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get('bankId');
    const yearParam = searchParams.get('year');
    
    if (!bankId) {
      return NextResponse.json({ error: 'bankId is required' }, { status: 400 });
    }
    
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    // 1. Applications in the current year for Casual Leave calculations
    const yearApplications = await db.select().from(leaveApplications).where(
      and(
        eq(leaveApplications.bankId, bankId),
        gte(leaveApplications.startDate, startOfYear),
        lte(leaveApplications.startDate, endOfYear)
      )
    ).orderBy(desc(leaveApplications.id));

    // 2. Latest recorded application for Service Book balances (Ordinary & Special)
    const latestApplications = await db.select().from(leaveApplications).where(
      eq(leaveApplications.bankId, bankId)
    ).orderBy(desc(leaveApplications.id)).limit(1);

    const latestApp = latestApplications[0] ?? null;

    const dbHolidays = await db.select().from(holidays);
    const mappedHolidays = dbHolidays.map(h => ({
      id: h.id,
      date: h.date,
      name: h.name,
      isWorkingDay: h.isWorkingDay
    }));

    // Casual leave: 20 days per calendar year
    let casualTotal = 20;
    if (latestApp && latestApp.casualTotal) {
      casualTotal = Number(latestApp.casualTotal);
    }

    let appliedCasualDaysSum = 0;
    let maxRecordedCasualUsed = 0;

    for (const app of yearApplications) {
      if (app.casualUsed) {
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

    // Ordinary & Special leave: service book balances from latest record, default to 0 (never hardcoded 15 or 5)
    const ordinaryTotal = latestApp ? Number(latestApp.ordinaryTotal ?? 0) : 0;
    const ordinaryUsed = latestApp ? Number(latestApp.ordinaryUsed ?? 0) : 0;
    const ordinaryRemaining = Math.max(0, ordinaryTotal - ordinaryUsed);

    const specialTotal = latestApp ? Number(latestApp.specialTotal ?? 0) : 0;
    const specialUsed = latestApp ? Number(latestApp.specialUsed ?? 0) : 0;
    const specialRemaining = Math.max(0, specialTotal - specialUsed);

    return NextResponse.json({
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
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
