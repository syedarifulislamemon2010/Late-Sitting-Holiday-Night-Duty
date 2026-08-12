import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { leaveApplications } from '@/db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';

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
    
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    const applications = await db.select().from(leaveApplications).where(
      and(
        eq(leaveApplications.bankId, bankId),
        gte(leaveApplications.startDate, startOfYear),
        lte(leaveApplications.startDate, endOfYear)
      )
    );

    let casualUsed = 0;
    let ordinaryUsed = 0;
    let specialUsed = 0;

    for (const app of applications) {
      const start = new Date(app.startDate);
      const end = new Date(app.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (app.leaveType === 'CASUAL' || app.leaveType === 'POST_FACTO') {
        casualUsed += diffDays;
      } else if (app.leaveType === 'STATION_LEAVE') {
        ordinaryUsed += diffDays;
      } else {
        specialUsed += diffDays;
      }
    }

    return NextResponse.json({
      casual: { total: 20, used: casualUsed, remaining: 20 - casualUsed },
      ordinary: { total: 15, used: ordinaryUsed, remaining: 15 - ordinaryUsed },
      special: { total: 5, used: specialUsed, remaining: 5 - specialUsed },
      year
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
