import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { holidays as holidaysTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { holidayBulkCreateSchema } from '@/validations/holiday.schema';
import { DEFAULT_2026_HOLIDAYS } from '@/constants/holidays';
import { getCurrentUser } from '@/lib/auth-wrapper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত এক্সেস।' }, { status: 401 });
    }

    const holidayList = await db.select().from(holidaysTable).orderBy(holidaysTable.date);
    const dbHolidayMap = new Map(holidayList.map(h => [h.date, h]));
    const result: (typeof holidaysTable.$inferSelect)[] = [...holidayList];

    DEFAULT_2026_HOLIDAYS.forEach((dh, idx) => {
      const existing = dbHolidayMap.get(dh.date);
      if (!existing) {
        result.push({
          id: -(idx + 1),
          date: dh.date,
          name: dh.name,
          isWorkingDay: false,
          createdAt: new Date()
        });
      } else if (dh.name && existing.name && /^[A-Za-z\s()]+$/.test(existing.name)) {
        existing.name = dh.name;
      }
    });

    result.sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error fetching holidays:', error);
    return NextResponse.json({ error: 'failed_to_fetch_holidays' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'forbidden', message: 'ছুটির তালিকা পরিবর্তন করার ক্ষমতা শুধুমাত্র অ্যাডমিনের রয়েছে।' }, { status: 403 });
    }

    const body = await request.json();
    const validation = holidayBulkCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'validation_error',
        message: validation.error.issues[0]?.message || 'অবৈধ হলিডে ডাটা ফরম্যাট',
        details: validation.error.format()
      }, { status: 400 });
    }

    const { holidays } = validation.data;
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
    logger.error('Error saving holidays:', error);
    return NextResponse.json({ error: 'failed_to_save_holidays' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'forbidden', message: 'ছুটি মুছে ফেলার ক্ষমতা শুধুমাত্র অ্যাডমিনের রয়েছে।' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'date_required' }, { status: 400 });
    }

    await db.delete(holidaysTable).where(eq(holidaysTable.date, date));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting holiday:', error);
    return NextResponse.json({ error: 'failed_to_delete_holiday' }, { status: 500 });
  }
}
