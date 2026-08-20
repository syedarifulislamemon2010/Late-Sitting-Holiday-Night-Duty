import { db, DbExecutor } from '@/lib/db';
import { officeOrders, duties as dutiesTable } from '@/db/schema';
import { eq, inArray, desc, SQL } from 'drizzle-orm';

export class OfficeOrderRepository {
  static async findById(id: number, tx?: DbExecutor) {
    const client = tx || db;
    const list = await client.select().from(officeOrders).where(eq(officeOrders.id, id));
    return list[0] || null;
  }

  static async findByOrderRef(orderRef: string, tx?: DbExecutor) {
    const client = tx || db;
    const list = await client.select().from(officeOrders).where(eq(officeOrders.orderRef, orderRef));
    return list[0] || null;
  }

  static async listAll(conditions?: SQL | undefined, tx?: DbExecutor) {
    const client = tx || db;
    return client.select().from(officeOrders).where(conditions).orderBy(desc(officeOrders.createdAt));
  }

  static async deleteByOrderRef(orderRef: string, tx?: DbExecutor) {
    const client = tx || db;
    return client.delete(officeOrders).where(eq(officeOrders.orderRef, orderRef)).returning();
  }

  static async create(data: typeof officeOrders.$inferInsert, tx?: DbExecutor) {
    const client = tx || db;
    const list = await client.insert(officeOrders).values(data).returning();
    return list[0];
  }

  static async update(id: number, data: Partial<typeof officeOrders.$inferInsert>, tx?: DbExecutor) {
    const client = tx || db;
    const list = await client.update(officeOrders).set(data).where(eq(officeOrders.id, id)).returning();
    return list[0];
  }

  static async updateByOrderRef(orderRef: string, data: Partial<typeof officeOrders.$inferInsert>, tx?: DbExecutor) {
    const client = tx || db;
    const list = await client.update(officeOrders).set(data).where(eq(officeOrders.orderRef, orderRef)).returning();
    return list[0];
  }

  static async delete(id: number, tx?: DbExecutor) {
    const client = tx || db;
    const list = await client.delete(officeOrders).where(eq(officeOrders.id, id)).returning();
    return list[0];
  }

  static async linkDutiesToOrderRef(dutyIds: number[], orderRef: string | null, tx?: DbExecutor) {
    const client = tx || db;
    return client.update(dutiesTable)
      .set({ orderRef })
      .where(inArray(dutiesTable.id, dutyIds));
  }

  static async clearDutiesOrderRef(orderRef: string, tx?: DbExecutor) {
    const client = tx || db;
    return client.update(dutiesTable)
      .set({ orderRef: null })
      .where(eq(dutiesTable.orderRef, orderRef));
  }
}
