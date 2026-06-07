import { db } from '@/lib/db';
import { officeOrders, duties as dutiesTable } from '@/db/schema';
import { eq, inArray, desc, SQL } from 'drizzle-orm';

export class OfficeOrderRepository {
  static async findById(id: number) {
    const list = await db.select().from(officeOrders).where(eq(officeOrders.id, id));
    return list[0] || null;
  }

  static async findByOrderRef(orderRef: string) {
    const list = await db.select().from(officeOrders).where(eq(officeOrders.orderRef, orderRef));
    return list[0] || null;
  }

  static async listAll(conditions?: SQL | undefined) {
    return db.select().from(officeOrders).where(conditions).orderBy(desc(officeOrders.createdAt));
  }

  static async deleteByOrderRef(orderRef: string) {
    return db.delete(officeOrders).where(eq(officeOrders.orderRef, orderRef)).returning();
  }

  static async create(data: typeof officeOrders.$inferInsert) {
    const list = await db.insert(officeOrders).values(data).returning();
    return list[0];
  }

  static async update(id: number, data: Partial<typeof officeOrders.$inferInsert>) {
    const list = await db.update(officeOrders).set(data).where(eq(officeOrders.id, id)).returning();
    return list[0];
  }

  static async updateByOrderRef(orderRef: string, data: Partial<typeof officeOrders.$inferInsert>) {
    const list = await db.update(officeOrders).set(data).where(eq(officeOrders.orderRef, orderRef)).returning();
    return list[0];
  }

  static async delete(id: number) {
    const list = await db.delete(officeOrders).where(eq(officeOrders.id, id)).returning();
    return list[0];
  }

  static async linkDutiesToOrderRef(dutyIds: number[], orderRef: string | null) {
    return db.update(dutiesTable)
      .set({ orderRef })
      .where(inArray(dutiesTable.id, dutyIds));
  }

  static async clearDutiesOrderRef(orderRef: string) {
    return db.update(dutiesTable)
      .set({ orderRef: null })
      .where(eq(dutiesTable.orderRef, orderRef));
  }
}
