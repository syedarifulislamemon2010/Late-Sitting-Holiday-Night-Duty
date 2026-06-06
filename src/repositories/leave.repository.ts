import { db } from '@/lib/db';
import { leaveApplications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export class LeaveRepository {
  static async findById(id: number) {
    const list = await db.select().from(leaveApplications).where(eq(leaveApplications.id, id));
    return list[0] || null;
  }

  static async listAll(conditions?: any) {
    return db.select().from(leaveApplications).where(conditions).orderBy(desc(leaveApplications.createdAt));
  }

  static async findLatestLeave(conditions?: any) {
    const list = await db.select().from(leaveApplications)
      .where(conditions)
      .orderBy(desc(leaveApplications.createdAt))
      .limit(1);
    return list[0] || null;
  }

  static async create(data: typeof leaveApplications.$inferInsert) {
    const list = await db.insert(leaveApplications).values(data).returning();
    return list[0];
  }

  static async delete(id: number) {
    const list = await db.delete(leaveApplications).where(eq(leaveApplications.id, id)).returning();
    return list[0];
  }
}
