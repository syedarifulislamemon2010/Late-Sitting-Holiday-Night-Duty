import { db } from '@/lib/db';
import { duties, employees, cells } from '@/db/schema';
import { eq, and, ne, inArray, desc, asc, SQL } from 'drizzle-orm';

export class DutyRepository {
  static async findById(id: number) {
    const list = await db.select().from(duties).where(eq(duties.id, id));
    return list[0] || null;
  }

  static async listAllWithDetails(conditions?: SQL | undefined) {
    return db
      .select({
        id: duties.id,
        employeeId: duties.employeeId,
        type: duties.type,
        date: duties.date,
        description: duties.description,
        allowance1: duties.allowance1,
        allowance2: duties.allowance2,
        totalBill: duties.totalBill,
        orderRef: duties.orderRef,
        createdAt: duties.createdAt,
        empId: employees.id,
        empName: employees.name,
        empDesignation: employees.designation,
        empBankId: employees.bankId,
        empFileNo: employees.fileNo,
        empMobile: employees.mobile,
        empCellId: employees.cellId,
        empCreatedAt: employees.createdAt,
        cellId: cells.id,
        cellName: cells.name,
        cellDescription: cells.description,
        cellCreatedAt: cells.createdAt
      })
      .from(duties)
      .innerJoin(employees, eq(duties.employeeId, employees.id))
      .innerJoin(cells, eq(employees.cellId, cells.id))
      .where(conditions)
      .orderBy(desc(duties.date), asc(employees.name));
  }

  static async findExistingDuties(employeeIds: number[], dates: string[]) {
    return db
      .select()
      .from(duties)
      .where(
        and(
          inArray(duties.employeeId, employeeIds),
          inArray(duties.date, dates)
        )
      );
  }

  static async findDuplicateDutyForEmployee(employeeId: number, date: string, excludeDutyId?: number) {
    const conditions = [
      eq(duties.employeeId, employeeId),
      eq(duties.date, date)
    ];
    if (excludeDutyId !== undefined) {
      conditions.push(ne(duties.id, excludeDutyId));
    }
    const list = await db.select().from(duties).where(and(...conditions));
    return list;
  }

  static async deleteDutiesByOrderRef(orderRef: string) {
    return db.delete(duties).where(eq(duties.orderRef, orderRef)).returning();
  }

  static async createBulk(dutiesData: {
    employeeId: number;
    type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
    date: string;
    description?: string | null;
    allowance1: number;
    allowance2: number;
    totalBill: number;
    orderRef?: string | null;
  }[]) {
    return db.insert(duties).values(dutiesData).returning();
  }

  static async update(id: number, data: {
    employeeId?: number;
    type?: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
    date?: string;
    description?: string | null;
    allowance1?: number;
    allowance2?: number;
    totalBill?: number;
    orderRef?: string | null;
  }) {
    const list = await db.update(duties).set(data).where(eq(duties.id, id)).returning();
    return list[0];
  }

  static async delete(id: number) {
    const list = await db.delete(duties).where(eq(duties.id, id)).returning();
    return list[0];
  }
}
