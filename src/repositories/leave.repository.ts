import { db, DbExecutor } from '@/lib/db';
import { leaveApplications } from '@/db/schema';
import { eq, desc, SQL } from 'drizzle-orm';

export class LeaveRepository {
  static async findById(id: number, tx?: DbExecutor) {
    const client = tx || db;
    const list = await client.select().from(leaveApplications).where(eq(leaveApplications.id, id));
    return list[0] || null;
  }

  static async listAll(conditions?: SQL | undefined, tx?: DbExecutor) {
    const client = tx || db;
    return client.select().from(leaveApplications).where(conditions).orderBy(desc(leaveApplications.createdAt));
  }

  static async findLatestLeave(conditions?: SQL | undefined, tx?: DbExecutor) {
    const client = tx || db;
    const list = await client.select().from(leaveApplications)
      .where(conditions)
      .orderBy(desc(leaveApplications.createdAt))
      .limit(1);
    return list[0] || null;
  }

  static async create(data: typeof leaveApplications.$inferInsert, tx?: DbExecutor) {
    const client = tx || db;
    const list = await client.insert(leaveApplications).values(data).returning();
    return list[0];
  }

  static async delete(id: number, tx?: DbExecutor) {
    const client = tx || db;
    const list = await client.delete(leaveApplications).where(eq(leaveApplications.id, id)).returning();
    return list[0];
  }
}
