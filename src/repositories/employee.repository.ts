import { db } from '@/lib/db';
import { employees, cells } from '@/db/schema';
import { eq, sql, SQL } from 'drizzle-orm';

export class EmployeeRepository {
  static async findById(id: number) {
    const list = await db.select().from(employees).where(eq(employees.id, id));
    return list[0] || null;
  }

  static async findByBankId(bankId: string) {
    const list = await db.select().from(employees).where(eq(sql`LOWER(${employees.bankId})`, bankId.toLowerCase()));
    return list[0] || null;
  }

  static async findDuplicate(name: string, bankId?: string | null, excludeId?: number) {
    const trimmedName = name.trim();
    const cleanName = trimmedName.replace(/^(জনাব|জনাবা)\s+/, '').trim().toLowerCase();
    const trimmedBankId = bankId ? bankId.trim().toLowerCase() : null;

    const allEmps = await db.select().from(employees);
    return allEmps.find((emp) => {
      if (excludeId && emp.id === excludeId) return false;

      // Match 1: Bank ID duplicate (if bankId provided)
      if (trimmedBankId && emp.bankId && emp.bankId.trim().toLowerCase() === trimmedBankId) {
        return true;
      }

      // Match 2: Same Name duplicate
      const empCleanName = emp.name.trim().replace(/^(জনাব|জনাবা)\s+/, '').trim().toLowerCase();
      if (empCleanName === cleanName || emp.name.trim().toLowerCase() === trimmedName.toLowerCase()) {
        return true;
      }

      return false;
    }) || null;
  }

  static async listAll(conditions?: SQL | undefined) {
    return db.select().from(employees).where(conditions);
  }

  static async listAllWithCell(conditions?: SQL | undefined) {
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
