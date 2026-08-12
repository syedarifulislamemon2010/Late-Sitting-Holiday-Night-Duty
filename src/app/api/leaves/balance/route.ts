import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { leaveApplications, holidays } from '@/db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
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

    const applications = await db.select().from(leaveApplications).where(
      and(
        eq(leaveApplications.bankId, bankId),
        gte(leaveApplications.startDate, startOfYear),
        lte(leaveApplications.startDate, endOfYear)
      )
    );

    const dbHolidays = await db.select().from(holidays);
    const mappedHolidays = dbHolidays.map(h => ({
      id: h.id,
      date: h.date,
      name: h.name,
      isWorkingDay: h.isWorkingDay
    }));

    let appliedCasualDaysSum = 0;
    let ordinaryUsed = 0;
    let specialUsed = 0;
    let casualTotal = 20;
    let ordinaryTotal = 15;
    let specialTotal = 5;
    let maxRecordedCasualUsed = 0;

    for (const app of applications) {
      if (app.casualTotal) casualTotal = Math.max(casualTotal, Number(app.casualTotal));
      if (app.ordinaryTotal) ordinaryTotal = Math.max(ordinaryTotal, Number(app.ordinaryTotal));
      if (app.specialTotal) specialTotal = Math.max(specialTotal, Number(app.specialTotal));

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
      } else if (app.leaveType === 'ORDINARY') {
        ordinaryUsed += leaveDays;
      } else {
        specialUsed += leaveDays;
      }
    }

    // Effective casualUsed is baseline recorded prior used + total days from current year applications
    // Or at least maxRecordedCasualUsed if backlog recorded total used exceeds sum
    const casualUsed = Math.max(maxRecordedCasualUsed, appliedCasualDaysSum);

    const casualRemaining = Math.max(0, casualTotal - casualUsed);
    const ordinaryRemaining = Math.max(0, ordinaryTotal - ordinaryUsed);
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
