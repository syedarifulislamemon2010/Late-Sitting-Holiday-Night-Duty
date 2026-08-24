import { db } from '@/lib/db';
import { employees, cells } from '@/db/schema';
import { eq, sql, SQL } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

const getCachedEmployeesWithCells = unstable_cache(
  async () => {
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
      .innerJoin(cells, eq(employees.cellId, cells.id));
  },
  ['all-employees-with-cells'],
  { revalidate: 300, tags: ['employees'] }
);

export class EmployeeRepository {
  static async findById(id: number) {
    const list = await db.select().from(employees).where(eq(employees.id, id));
    return list[0] || null;
  }

  static async findByBankId(bankId: string) {
    const list = await db.select().from(employees).where(eq(sql`LOWER(${employees.bankId})`, bankId.toLowerCase()));
    return list[0] || null;
  }

  static async listAll(conditions?: SQL | undefined) {
    return db.select().from(employees).where(conditions);
  }

  static async listAllWithCell(conditions?: SQL | undefined) {
    if (!conditions) {
      return getCachedEmployeesWithCells();
    }
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
