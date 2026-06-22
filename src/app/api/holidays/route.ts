import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { holidays as holidaysTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const holidayList = await db.select().from(holidaysTable).orderBy(holidaysTable.date);
    return NextResponse.json(holidayList);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json({ error: 'failed_to_fetch_holidays' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    interface HolidayInput {
      date: string;
      name: string;
      isWorkingDay?: boolean;
    }
    const body = await request.json();
    const { holidays } = body as { holidays: HolidayInput[] };

    if (!holidays || !Array.isArray(holidays)) {
      return NextResponse.json({ error: 'holidays_array_required' }, { status: 400 });
    }

    const savedHolidays: (typeof holidaysTable.$inferSelect)[] = [];

    for (const h of holidays) {
      if (!h.date || !h.name) continue;
      
      // Upsert by date
      const existingList = await db.select().from(holidaysTable).where(eq(holidaysTable.date, h.date));
      const existing = existingList[0];

      if (existing) {
        const updatedList = await db.update(holidaysTable)
          .set({
            name: h.name,
            isWorkingDay: h.isWorkingDay ?? false
          })
          .where(eq(holidaysTable.id, existing.id))
          .returning();
        savedHolidays.push(updatedList[0]);
      } else {
        const createdList = await db.insert(holidaysTable)
          .values({
            date: h.date,
            name: h.name,
            isWorkingDay: h.isWorkingDay ?? false
          })
          .returning();
        savedHolidays.push(createdList[0]);
      }
    }

    return NextResponse.json({ success: true, count: savedHolidays.length, data: savedHolidays });
  } catch (error) {
    console.error('Error saving holidays:', error);
    return NextResponse.json({ error: 'failed_to_save_holidays' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'date_required' }, { status: 400 });
    }

    await db.delete(holidaysTable).where(eq(holidaysTable.date, date));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json({ error: 'failed_to_delete_holiday' }, { status: 500 });
  }
}
