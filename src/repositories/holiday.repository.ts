import { db } from '@/lib/db';
import { holidays as holidaysTable } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export class HolidayRepository {
  static async findByDate(date: string) {
    const list = await db.select().from(holidaysTable).where(eq(holidaysTable.date, date));
    return list[0] || null;
  }

  static async findHolidaysByDates(dates: string[]) {
    return db.select().from(holidaysTable).where(inArray(holidaysTable.date, dates));
  }

  static async listAll() {
    return db.select().from(holidaysTable);
  }
}
