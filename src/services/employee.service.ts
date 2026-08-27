import logger from '@/lib/logger';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { UserRepository } from '@/repositories/user.repository';
import { db } from '@/lib/db';
import { trash, cells, users, employees, userCells, duties } from '@/db/schema';
import { eq, inArray, and, sql, SQL } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { sortEmployeesBySeniority } from '@/lib/seniority';
import { AppError, AuthError } from '@/lib/errors';
import { employeeCreateSchema, employeeUpdateSchema } from '@/validations/employee.schema';

interface UserSession {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER' | 'EMPLOYEE';
  cells?: { id: number; name: string; description?: string | null; createdAt?: Date | null }[];
}

interface EmployeeWithCell {
  id: number;
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  cellId: number;
  mobile: string;
  cell: {
    id: number;
    name: string;
    description?: string | null;
    createdAt?: Date | null;
  };
  dutyType?: string;
}

interface EmployeeInput {
  name: string;
  nameEn?: string | null;
  designation: string;
  designationEn?: string | null;
  bankId?: string | null;
  fileNo?: string | null;
  mobile: string;
  cellId: number;
}

interface EmployeeUpdateInput {
  name?: string;
  nameEn?: string | null;
  designation?: string;
  designationEn?: string | null;
  bankId?: string | null;
  fileNo?: string | null;
  mobile?: string;
  cellId?: number;
}

async function getAllowedCellIds(currentUser: UserSession): Promise<number[]> {
  if (currentUser.role === 'ADMIN') {
    const cellList = await db.select().from(cells);
    return cellList.map(c => c.id);
  }
  const cellIds = new Set<number>();
  if (currentUser.cells) {
    currentUser.cells.forEach(c => cellIds.add(c.id));
  }
  const emp = await db.select().from(employees).where(eq(employees.bankId, currentUser.username));
  if (emp[0]) {
    cellIds.add(emp[0].cellId);
  }
  if (cellIds.has(7)) cellIds.add(9);
  if (cellIds.has(9)) cellIds.add(7);
  return Array.from(cellIds);
}

export class EmployeeService {
  static async listEmployees(currentUser: UserSession | null, isDirectory: boolean, cellId: string | null) {
    let cellIds: number[] = [];
    let isUserRestricted = false;

    if (currentUser && currentUser.role === 'USER') {
      isUserRestricted = true;
      if (currentUser.cells && currentUser.cells.length > 0) {
        cellIds = currentUser.cells.map((c) => c.id);
      } else {
        const emp = await EmployeeRepository.findByBankId(currentUser.username);
        if (emp) {
          cellIds = [emp.cellId];
        } else {
          cellIds = [];
        }
      }
    }

    const conditions: SQL[] = [];
    if (isUserRestricted && !isDirectory) {
      if (cellIds.length > 0) {
        conditions.push(inArray(employeesCellIdHelper(), cellIds));
      } else {
        return [];
      }
    }

    if (!isUserRestricted && cellId && cellId !== 'all') {
      conditions.push(eq(employeesCellIdHelper(), parseInt(cellId, 10)));
    } else if (isUserRestricted && cellId && cellId !== 'all') {
      const targetId = parseInt(cellId, 10);
      if (cellIds.includes(targetId)) {
        conditions.push(eq(employeesCellIdHelper(), targetId));
      } else {
        conditions.push(eq(employeesCellIdHelper(), -1)); // block
      }
    }

    const empList = await EmployeeRepository.listAllWithCell(
      conditions.length > 0 ? and(...conditions) : undefined
    );

    let finalEmployees = empList as unknown as EmployeeWithCell[];
    if (isDirectory) {
      const allUsers = await UserRepository.listAll();
      const allUserCells = await db
        .select({
          userId: userCells.B,
          cellId: cells.id,
          cellName: cells.name,
          cellDescription: cells.description,
          cellCreatedAt: cells.createdAt
        })
        .from(userCells)
        .innerJoin(cells, eq(userCells.A, cells.id));

      const userCellsMap = new Map<string, { id: number; name: string; description: string | null; createdAt: Date | null }[]>();
      const userCellDutiesMap = new Map<string, Record<string, string>>();

      allUsers.forEach(u => {
        if (u.username) {
          const uCells = allUserCells
            .filter((uc) => uc.userId === u.id)
            .map((uc) => ({
              id: uc.cellId,
              name: uc.cellName,
              description: uc.cellDescription,
              createdAt: uc.cellCreatedAt
            }));
          userCellsMap.set(u.username.trim().toLowerCase(), uCells);

          let parsedDuties: Record<string, string> = {};
          if (u.cellDuties) {
            try {
              parsedDuties = JSON.parse(u.cellDuties);
            } catch (e) {
              logger.warn('Failed to parse cellDuties for user', u.username, e);
            }
          }
          userCellDutiesMap.set(u.username.trim().toLowerCase(), parsedDuties);
        }
      });

      const expandedEmployees: EmployeeWithCell[] = [];
      for (const emp of empList as unknown as EmployeeWithCell[]) {
        let primaryDutyType = 'PRIMARY';
        if (emp.bankId) {
          const duties = userCellDutiesMap.get(emp.bankId.trim().toLowerCase());
          if (duties && duties[String(emp.cellId)]) {
            primaryDutyType = duties[String(emp.cellId)];
          } else if (emp.designation.includes('ইনচার্জ') || emp.designation.includes('Incharge')) {
            primaryDutyType = 'INCHARGE';
          }
        } else if (emp.designation.includes('ইনচার্জ') || emp.designation.includes('Incharge')) {
          primaryDutyType = 'INCHARGE';
        }

        expandedEmployees.push({
          ...emp,
          dutyType: primaryDutyType
        });
        
        if (emp.bankId) {
          const assignedCells = userCellsMap.get(emp.bankId.trim().toLowerCase());
          const duties = userCellDutiesMap.get(emp.bankId.trim().toLowerCase());
          if (assignedCells) {
            for (const cell of assignedCells) {
              if (cell.id !== emp.cellId) {
                let addDutyType = 'ADDITIONAL';
                if (duties && duties[String(cell.id)]) {
                  addDutyType = duties[String(cell.id)];
                } else if (emp.designation.includes('ইনচার্জ') || emp.designation.includes('Incharge')) {
                  addDutyType = 'INCHARGE';
                }
                
                expandedEmployees.push({
                  ...emp,
                  cellId: cell.id,
                  cell: cell,
                  dutyType: addDutyType
                });
              }
            }
          }
        }
      }
      finalEmployees = expandedEmployees;

      if (isUserRestricted) {
        finalEmployees = finalEmployees.filter(emp => cellIds.includes(emp.cellId));
      }
    } else {
      finalEmployees = finalEmployees.map(emp => {
        let primaryDutyType = 'PRIMARY';
        if (emp.designation.includes('ইনচার্জ') || emp.designation.includes('Incharge')) {
          primaryDutyType = 'INCHARGE';
        }
        return {
          ...emp,
          dutyType: primaryDutyType
        };
      });
    }

    return sortEmployeesBySeniority(finalEmployees);
  }

  static async createEmployee(currentUser: UserSession | null, body: EmployeeInput, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('অনুমতি নেই।', 403, 'unauthorized');
    }

    const allowedCellIds = await getAllowedCellIds(currentUser);
    if (!allowedCellIds.includes(body.cellId)) {
      throw new AuthError('অনুমতি নেই। আপনি শুধুমাত্র আপনার নিজের সেলে কর্মকর্তা যোগ করতে পারবেন।', 403, 'forbidden');
    }

    const validated = employeeCreateSchema.parse(body);

    const newEmp = await EmployeeRepository.create({
      name: validated.name,
      designation: validated.designation,
      bankId: validated.bankId,
      fileNo: validated.fileNo,
      mobile: validated.mobile,
      cellId: validated.cellId
    });

    if (newEmp.bankId) {
      const userSyncData: { mobile?: string | null; name?: string } = {};
      if (newEmp.mobile !== undefined) userSyncData.mobile = newEmp.mobile;
      if (newEmp.name !== undefined && newEmp.name.trim()) userSyncData.name = newEmp.name.trim();

      const matchingUsers = await db.select().from(users).where(eq(sql`LOWER(TRIM(${users.username}))`, newEmp.bankId.trim().toLowerCase()));
      const matchingUser = matchingUsers[0];

      if (matchingUser) {
        if (Object.keys(userSyncData).length > 0) {
          await db.update(users)
            .set(userSyncData)
            .where(eq(users.id, matchingUser.id));
        }

        const currentAssigned = await db.select().from(userCells).where(eq(userCells.B, matchingUser.id));
        if (currentAssigned.length === 0) {
          await db.insert(userCells).values({ A: validated.cellId, B: matchingUser.id });
        }
      }
    }

    const cellList = await db.select().from(cells).where(eq(cells.id, validated.cellId));
    const cell = cellList[0];

    const employee = {
      ...newEmp,
      cell
    };

    await logActivity({
      username: currentUser.username,
      action: 'CREATE',
      entityType: 'EMPLOYEE',
      entityId: String(employee.id),
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) নতুন কর্মকর্তা "${employee.name}" (${employee.designation}) কে ${cell.name} সেলে যোগ করেছেন।`
    });

    return employee;
  }

  static async updateEmployee(currentUser: UserSession | null, id: number, body: EmployeeUpdateInput, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('অনুমতি নেই।', 403, 'unauthorized');
    }

    const validated = employeeUpdateSchema.parse(body);

    const existingEmployee = await EmployeeRepository.findById(id);
    if (!existingEmployee) {
      throw new AppError('কর্মকর্তা পাওয়া যায়নি।', 404, 'employee_not_found');
    }

    const allowedCellIds = await getAllowedCellIds(currentUser);
    const isOwnCell = allowedCellIds.includes(existingEmployee.cellId);
    const isSelf = !!(existingEmployee.bankId && currentUser.username && existingEmployee.bankId.trim().toLowerCase() === currentUser.username.trim().toLowerCase());
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isAdmin && !isOwnCell && !isSelf) {
      throw new AuthError('অনুমতি নেই। আপনি শুধুমাত্র আপনার নিজের অথবা আপনার সেলের কর্মকর্তা সংশোধন করতে পারবেন।', 403, 'forbidden');
    }

    if (validated.cellId !== undefined && validated.cellId !== existingEmployee.cellId && !isAdmin && !allowedCellIds.includes(validated.cellId)) {
      throw new AuthError('অনুমতি নেই। আপনি কর্মকর্তাকে আপনার সেলের বাইরের কোনো সেলে স্থানান্তর করতে পারবেন না।', 403, 'forbidden');
    }

    const updatedData: {
      name?: string;
      designation?: string;
      bankId?: string | null;
      fileNo?: string | null;
      mobile?: string | null;
      cellId?: number;
    } = {
      name: validated.name !== undefined ? validated.name.trim() : existingEmployee.name,
      mobile: validated.mobile !== undefined ? (validated.mobile?.trim() || '') : existingEmployee.mobile
    };

    if (validated.designation !== undefined) updatedData.designation = validated.designation.trim();
    if (validated.bankId !== undefined) updatedData.bankId = validated.bankId?.trim() || null;
    if (validated.fileNo !== undefined) updatedData.fileNo = validated.fileNo?.trim() || null;
    if (validated.cellId !== undefined) updatedData.cellId = validated.cellId;

    const updatedEmp = await EmployeeRepository.update(id, updatedData);

    // Synchronize name, mobile, and userCells if employee bankId corresponds to a user's username
    if (updatedEmp.bankId) {
      const userSyncData: { mobile?: string | null; name?: string } = {};
      if (updatedEmp.mobile !== undefined) userSyncData.mobile = updatedEmp.mobile;
      if (updatedEmp.name !== undefined && updatedEmp.name.trim()) userSyncData.name = updatedEmp.name.trim();

      const matchingUsers = await db.select().from(users).where(eq(sql`LOWER(TRIM(${users.username}))`, updatedEmp.bankId.trim().toLowerCase()));
      const matchingUser = matchingUsers[0];

      if (matchingUser) {
        if (Object.keys(userSyncData).length > 0) {
          await db.update(users)
            .set(userSyncData)
            .where(eq(users.id, matchingUser.id));
        }

        // Synchronize userCells table so the officer does not duplicate across old and new cells
        if (validated.cellId !== undefined) {
          const currentAssigned = await db.select().from(userCells).where(eq(userCells.B, matchingUser.id));
          const otherCellIds = currentAssigned
            .map(uc => uc.A)
            .filter(cid => cid !== existingEmployee.cellId && cid !== validated.cellId);
          const newCellIds = [validated.cellId, ...otherCellIds];

          await db.delete(userCells).where(eq(userCells.B, matchingUser.id));
          await db.insert(userCells).values(newCellIds.map(cid => ({ A: cid, B: matchingUser.id })));
        }
      }
    }

    const cellList = await db.select().from(cells).where(eq(cells.id, updatedEmp.cellId));
    const cell = cellList[0];

    const employee = {
      ...updatedEmp,
      cell
    };

    await logActivity({
      username: currentUser.username,
      action: 'UPDATE',
      entityType: 'EMPLOYEE',
      entityId: String(employee.id),
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) কর্মকর্তা "${employee.name}" এর তথ্য সংশোধন করেছেন (সেল: ${cell.name})।`
    });

    return employee;
  }

  static async deleteEmployee(currentUser: UserSession | null, id: number, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('অনুমতি নেই।', 403, 'unauthorized');
    }

    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      throw new AppError('employee_not_found', 404, 'employee_not_found');
    }

    const allowedCellIds = await getAllowedCellIds(currentUser);
    if (!allowedCellIds.includes(employee.cellId)) {
      throw new AuthError('অনুমতি নেই। আপনি শুধুমাত্র আপনার নিজের সেলের কর্মকর্তা মুছে ফেলতে পারবেন।', 403, 'forbidden');
    }

    const employeeDuties = await db.select().from(duties).where(eq(duties.employeeId, id));
    const employeeWithDuties = {
      ...employee,
      duties: employeeDuties
    };

    await logActivity({
      username: currentUser.username,
      action: 'DELETE',
      entityType: 'EMPLOYEE',
      entityId: String(id),
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) কর্মকর্তা "${employee.name}" (${employee.designation}) কে সিস্টেম থেকে সরিয়ে দিয়েছেন।`
    });

    await db.insert(trash).values({
      entityType: 'EMPLOYEE',
      entityId: id,
      name: `${employee.name} (${employee.designation})`,
      data: JSON.stringify(employeeWithDuties),
      deletedBy: currentUser.username
    });

    await EmployeeRepository.delete(id);

    return { success: true };
  }
}

function employeesCellIdHelper() {
  return employees.cellId;
}
