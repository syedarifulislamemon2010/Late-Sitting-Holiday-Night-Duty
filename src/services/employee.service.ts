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
  role: 'ADMIN' | 'USER';
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
}

interface EmployeeInput {
  name: string;
  designation: string;
  bankId?: string | null;
  fileNo?: string | null;
  mobile: string;
  cellId: number;
}

interface EmployeeUpdateInput {
  name?: string;
  designation?: string;
  bankId?: string | null;
  fileNo?: string | null;
  mobile?: string;
  cellId?: number;
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
        }
      });

      const expandedEmployees: EmployeeWithCell[] = [];
      for (const emp of empList as unknown as EmployeeWithCell[]) {
        expandedEmployees.push(emp);
        
        if (emp.bankId) {
          const assignedCells = userCellsMap.get(emp.bankId.trim().toLowerCase());
          if (assignedCells) {
            for (const cell of assignedCells) {
              if (cell.id !== emp.cellId) {
                expandedEmployees.push({
                  ...emp,
                  cellId: cell.id,
                  cell: cell
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
    }

    return sortEmployeesBySeniority(finalEmployees);
  }

  static async createEmployee(currentUser: UserSession | null, body: EmployeeInput, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('অনুমতি নেই।', 403, 'unauthorized');
    }

    if (currentUser.role !== 'ADMIN') {
      throw new AuthError('অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন কর্মকর্তা যোগ করতে পারবেন।', 403, 'forbidden');
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
      await db.update(users)
        .set({ mobile: newEmp.mobile })
        .where(eq(sql`LOWER(TRIM(${users.username}))`, newEmp.bankId.trim().toLowerCase()));
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

    const updatedData: Partial<EmployeeInput> = {
      name: validated.name ? validated.name.trim() : existingEmployee.name,
      mobile: validated.mobile !== undefined ? (validated.mobile?.trim() || '') : existingEmployee.mobile
    };

    if (currentUser.role !== 'ADMIN') {
      const isOwnRecord = existingEmployee.bankId && currentUser.username && existingEmployee.bankId.trim() === currentUser.username.trim();
      if (!isOwnRecord) {
        throw new AuthError('অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন কর্মকর্তা সংশোধন করতে পারবেন।', 403, 'forbidden');
      }
      updatedData.designation = existingEmployee.designation;
      updatedData.bankId = existingEmployee.bankId;
      updatedData.fileNo = existingEmployee.fileNo;
      updatedData.cellId = existingEmployee.cellId;
    } else {
      if (validated.designation) updatedData.designation = validated.designation.trim();
      if (validated.bankId !== undefined) updatedData.bankId = validated.bankId?.trim() || null;
      if (validated.fileNo !== undefined) updatedData.fileNo = validated.fileNo?.trim() || null;
      if (validated.cellId !== undefined) updatedData.cellId = validated.cellId;
    }

    const updatedEmp = await EmployeeRepository.update(id, updatedData);

    // Synchronize the mobile number to the User table if employee bankId corresponds to a user's username
    if (updatedEmp.bankId) {
      await db.update(users)
        .set({ mobile: updatedEmp.mobile })
        .where(eq(sql`LOWER(TRIM(${users.username}))`, updatedEmp.bankId.trim().toLowerCase()));
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

    if (currentUser.role !== 'ADMIN') {
      throw new AuthError('অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন কর্মকর্তা মুছে ফেলতে পারবেন।', 403, 'forbidden');
    }

    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      throw new AppError('employee_not_found', 404, 'employee_not_found');
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

// Helpers for schema referencing (to handle compilation types dynamically if required)
function employeesCellIdHelper() {
  return employees.cellId;
}
