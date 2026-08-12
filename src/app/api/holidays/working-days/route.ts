import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { holidays } from '@/db/schema';
import { and, gte, lte } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // format: YYYY-MM
    
    const now = new Date();
    const year = monthParam ? parseInt(monthParam.split('-')[0]) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam.split('-')[1]) - 1 : now.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Count weekends (Friday=5, Saturday=6)
    let weekends = 0;
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 5 || dayOfWeek === 6) weekends++;
    }
    
    // Fetch custom holidays from DB for this month
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;
    
    const dbHolidays = await db.select().from(holidays)
      .where(and(gte(holidays.date, startStr), lte(holidays.date, endStr)));
    
    // Count additional non-weekend holidays
    let additionalHolidays = 0;
    let restoredWorkdays = 0;
    
    for (const h of dbHolidays) {
      const hDate = new Date(h.date);
      const dayOfWeek = hDate.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      
      if (h.isWorkingDay && isWeekend) {
        // Weekend overridden as working day
        restoredWorkdays++;
      } else if (!h.isWorkingDay && !isWeekend) {
        // Weekday marked as holiday
        additionalHolidays++;
      }
    }
    
    const workingDays = totalDays - weekends - additionalHolidays + restoredWorkdays;
    
    return NextResponse.json({
      workingDays,
      totalDays,
      weekends,
      additionalHolidays,
      restoredWorkdays,
      month: `${year}-${String(month + 1).padStart(2, '0')}`
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
