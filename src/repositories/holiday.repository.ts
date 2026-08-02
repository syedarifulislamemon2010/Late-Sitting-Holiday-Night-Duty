import { db } from '@/lib/db';
import { holidays as holidaysTable } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

const getCachedHolidays = unstable_cache(
  async () => {
    return db.select().from(holidaysTable);
  },
  ['all-holidays-cache'],
  { revalidate: 3600, tags: ['holidays'] }
);

export class HolidayRepository {
  static async findByDate(date: string) {
    const list = await db.select().from(holidaysTable).where(eq(holidaysTable.date, date));
    return list[0] || null;
  }

  static async findHolidaysByDates(dates: string[]) {
    return db.select().from(holidaysTable).where(inArray(holidaysTable.date, dates));
  }

  static async listAll() {
    return getCachedHolidays();
  }
}
