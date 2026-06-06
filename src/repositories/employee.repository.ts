import { db } from '@/lib/db';
import { employees, cells } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

export class EmployeeRepository {
  static async findById(id: number) {
    const list = await db.select().from(employees).where(eq(employees.id, id));
    return list[0] || null;
  }

  static async findByBankId(bankId: string) {
    const list = await db.select().from(employees).where(eq(sql`LOWER(${employees.bankId})`, bankId.toLowerCase()));
    return list[0] || null;
  }

  static async listAll(conditions?: any) {
    return db.select().from(employees).where(conditions);
  }

  static async listAllWithCell(conditions?: any) {
    return db
      .select({
        id: employees.id,
        name: employees.name,
        designation: employees.designation,
        bankId: employees.bankId,
        fileNo: employees.fileNo,
        mobile: employees.mobile,
        cellId: employees.cellId,
        createdAt: employees.createdAt,
        cell: {
          id: cells.id,
          name: cells.name,
          description: cells.description,
          createdAt: cells.createdAt
        }
      })
      .from(employees)
      .innerJoin(cells, eq(employees.cellId, cells.id))
      .where(conditions);
  }

  static async create(data: {
    name: string;
    designation: string;
    bankId?: string | null;
    fileNo?: string | null;
    mobile?: string | null;
    cellId: number;
  }) {
    const list = await db.insert(employees).values(data).returning();
    return list[0];
  }

  static async update(id: number, data: {
    name?: string;
    designation?: string;
    bankId?: string | null;
    fileNo?: string | null;
    mobile?: string | null;
    cellId?: number;
  }) {
    const list = await db.update(employees).set(data).where(eq(employees.id, id)).returning();
    return list[0];
  }

  static async delete(id: number) {
    const list = await db.delete(employees).where(eq(employees.id, id)).returning();
    return list[0];
  }
}
