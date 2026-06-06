import { EmployeeRepository } from '@/repositories/employee.repository';
import { UserRepository } from '@/repositories/user.repository';
import { db } from '@/lib/db';
import { trash, cells } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { sortEmployeesBySeniority } from '@/lib/seniority';
import { AppError, AuthError, ValidationError } from '@/lib/errors';
import { employeeCreateSchema, employeeUpdateSchema } from '@/validations/employee.schema';
import { duties } from '@/db/schema';

export class EmployeeService {
  static async listEmployees(currentUser: any, isDirectory: boolean, cellId: string | null) {
    let cellIds: number[] = [];
    let isUserRestricted = false;

    if (currentUser && currentUser.role === 'USER') {
      isUserRestricted = true;
      const emp = await EmployeeRepository.findByBankId(currentUser.username);
      if (emp) {
        cellIds = [emp.cellId];
      } else if (currentUser.cells && currentUser.cells.length > 0) {
        cellIds = [currentUser.cells[0].id];
      } else {
        cellIds = [];
      }
    }

    const conditions: any[] = [];
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

    let finalEmployees = empList;
    if (isDirectory) {
      const allUsers = await UserRepository.listAll();
      const allUserCells = await db
        .select({
          userId: userCellsBHelper(),
          cellId: cells.id,
          cellName: cells.name,
          cellDescription: cells.description,
          cellCreatedAt: cells.createdAt
        })
        .from(userCellsHelper())
        .innerJoin(cells, eq(userCellsAHelper(), cells.id));

      const userCellsMap = new Map<string, any[]>();
      allUsers.forEach(u => {
        if (u.username) {
          const uCells = allUserCells
            .filter((uc: any) => uc.userId === u.id)
            .map((uc: any) => ({
              id: uc.cellId,
              name: uc.cellName,
              description: uc.cellDescription,
              createdAt: uc.cellCreatedAt
            }));
          userCellsMap.set(u.username.trim().toLowerCase(), uCells);
        }
      });

      const expandedEmployees: any[] = [];
      for (const emp of empList) {
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

  static async createEmployee(currentUser: any, body: any, headersInfo: { ipAddress: string, userAgent: string }) {
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

  static async updateEmployee(currentUser: any, id: number, body: any, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('অনুমতি নেই।', 403, 'unauthorized');
    }

    const validated = employeeUpdateSchema.parse(body);

    const existingEmployee = await EmployeeRepository.findById(id);
    if (!existingEmployee) {
      throw new AppError('কর্মকর্তা পাওয়া যায়নি।', 404, 'employee_not_found');
    }

    let updatedData: any = {
      name: validated.name ? validated.name.trim() : existingEmployee.name,
      mobile: validated.mobile !== undefined ? (validated.mobile?.trim() || null) : existingEmployee.mobile
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

  static async deleteEmployee(currentUser: any, id: number, headersInfo: { ipAddress: string, userAgent: string }) {
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
  const { employees } = require('@/db/schema');
  return employees.cellId;
}
function userCellsHelper() {
  const { userCells } = require('@/db/schema');
  return userCells;
}
function userCellsAHelper() {
  const { userCells } = require('@/db/schema');
  return userCells.A;
}
function userCellsBHelper() {
  const { userCells } = require('@/db/schema');
  return userCells.B;
}
