import { LeaveRepository } from '@/repositories/leave.repository';
import { logActivity } from '@/lib/audit';
import { AppError, AuthError, ConflictError } from '@/lib/errors';
import { leaveCreateSchema } from '@/validations/leave.schema';
import { eq, and, ne, lte, gte } from 'drizzle-orm';
import { leaveApplications, employees, cells } from '@/db/schema';
import { db } from '@/lib/db';

interface UserSession {
  id: number;
  username: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'EMPLOYEE';
  cells?: { id: number; name: string }[];
}

interface LeaveInput {
  leaveType: 'POST_FACTO' | 'STATION_LEAVE' | 'CASUAL';
  startDate: string;
  endDate: string;
  applicationDate: string;
  applicantName: string;
  designation: string;
  bankId: string;
  fileNo?: string | null;
  cellName: string;
  leaveLocation: string;
  mobileNo: string;
  selectedDistrict?: string | null;
  delegateId?: string | number | null;
  casualTotal?: number | null;
  casualUsed?: number | null;
  ordinaryTotal?: number | null;
  ordinaryUsed?: number | null;
  specialTotal?: number | null;
  specialUsed?: number | null;
}

export class LeaveService {
  static async listLeaves(currentUser: UserSession | null, filters: { latest: boolean, bankId: string | null }) {
    if (!currentUser) {
      throw new AuthError('unauthorized', 401, 'unauthorized');
    }

    const conditions = [];
    if (currentUser.role === 'ADMIN') {
      if (filters.bankId) {
        conditions.push(eq(leaveApplications.bankId, filters.bankId));
      }
    } else {
      conditions.push(eq(leaveApplications.userId, currentUser.id));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    if (filters.latest) {
      const latestLeave = await LeaveRepository.findLatestLeave(whereCondition);
      return latestLeave;
    }

    return LeaveRepository.listAll(whereCondition);
  }

  static async createLeave(currentUser: UserSession | null, body: LeaveInput, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('unauthorized', 401, 'unauthorized');
    }

    if (currentUser.role === 'EMPLOYEE') {
      const emp = await db.select({
        id: employees.id,
        name: employees.name,
        designation: employees.designation,
        bankId: employees.bankId,
        cellName: cells.name
      })
      .from(employees)
      .innerJoin(cells, eq(employees.cellId, cells.id))
      .where(eq(employees.userId, currentUser.id))
      .then(r => r[0]);

      if (!emp) {
        throw new AppError('employee_not_linked', 400, 'প্রোফাইলের সাথে কোনো কর্মকর্তা রেকর্ড লিংক করা নেই।');
      }

      body.bankId = emp.bankId || currentUser.username;
      body.applicantName = emp.name;
      body.designation = emp.designation;
      body.cellName = emp.cellName;
    }

    const validated = leaveCreateSchema.parse(body);

    // 1. Check CELL_FORBIDDEN for USER role operators
    if (currentUser.role === 'USER') {
      const emp = await db.select({
        cellId: employees.cellId,
        cellName: cells.name
      })
      .from(employees)
      .leftJoin(cells, eq(employees.cellId, cells.id))
      .where(eq(employees.bankId, validated.bankId))
      .then(r => r[0]);

      const userCellIds = currentUser.cells?.map((c: { id: number }) => c.id) || [];
      if (emp && !userCellIds.includes(emp.cellId)) {
        throw new ConflictError('cell_forbidden', {
          conflictType: 'CELL_FORBIDDEN',
          cellName: emp.cellName || 'অনুমোদিত সেল'
        });
      }
    }

    // 2. Check LEAVE_OVERLAP conflict
    const existingOverlap = await db.select().from(leaveApplications).where(
      and(
        eq(leaveApplications.bankId, validated.bankId),
        lte(leaveApplications.startDate, validated.endDate),
        gte(leaveApplications.endDate, validated.startDate)
      )
    ).then(r => r[0]);

    if (existingOverlap) {
      throw new ConflictError('leave_conflict', {
        conflictType: 'LEAVE_OVERLAP',
        employeeName: validated.applicantName,
        dates: [validated.startDate, validated.endDate],
        existingLeaveStart: existingOverlap.startDate,
        existingLeaveEnd: existingOverlap.endDate
      });
    }

    return db.transaction(async (tx) => {
      const newLeave = await LeaveRepository.create({
        leaveType: validated.leaveType,
        startDate: validated.startDate,
        endDate: validated.endDate,
        applicationDate: validated.applicationDate,
        applicantName: validated.applicantName,
        designation: validated.designation,
        bankId: validated.bankId,
        fileNo: validated.fileNo || null,
        cellName: validated.cellName,
        leaveLocation: validated.leaveLocation,
        mobileNo: validated.mobileNo,
        selectedDistrict: validated.selectedDistrict || null,
        delegateId: validated.delegateId || null,
        casualTotal: validated.casualTotal,
        casualUsed: validated.casualUsed,
        ordinaryTotal: validated.ordinaryTotal,
        ordinaryUsed: validated.ordinaryUsed,
        specialTotal: validated.specialTotal,
        specialUsed: validated.specialUsed,
        userId: currentUser.id
      }, tx);

      if (validated.bankId && validated.mobileNo) {
        await tx.update(employees)
          .set({ mobile: validated.mobileNo })
          .where(eq(employees.bankId, validated.bankId));
      }

      await logActivity({
        username: currentUser.username,
        action: 'CREATE',
        entityType: 'USER',
        entityId: String(newLeave.id),
        ipAddress: headersInfo.ipAddress,
        userAgent: headersInfo.userAgent,
        details: `${currentUser.name} (@${currentUser.username}) নতুন ছুটির আবেদন (${validated.leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : validated.leaveType === 'STATION_LEAVE' ? 'কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক' : 'নৈমিত্তিক'}) তৈরি ও সংরক্ষণ করেছেন।`
      });

      return newLeave;
    });
  }

  static async updateLeave(currentUser: UserSession | null, id: number, body: LeaveInput, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('unauthorized', 401, 'unauthorized');
    }

    const existingLeave = await LeaveRepository.findById(id);
    if (!existingLeave) {
      throw new AppError('leave_not_found', 404, 'leave_not_found');
    }

    if (currentUser.role !== 'ADMIN' && existingLeave.userId !== currentUser.id) {
      throw new AuthError('forbidden', 403, 'forbidden');
    }

    const validated = leaveCreateSchema.parse(body);

    // 1. Check CELL_FORBIDDEN for USER role operators
    if (currentUser.role === 'USER') {
      const emp = await db.select({
        cellId: employees.cellId,
        cellName: cells.name
      })
      .from(employees)
      .leftJoin(cells, eq(employees.cellId, cells.id))
      .where(eq(employees.bankId, validated.bankId))
      .then(r => r[0]);

      const userCellIds = currentUser.cells?.map((c: { id: number }) => c.id) || [];
      if (emp && !userCellIds.includes(emp.cellId)) {
        throw new ConflictError('cell_forbidden', {
          conflictType: 'CELL_FORBIDDEN',
          cellName: emp.cellName || 'অনুমোদিত সেল'
        });
      }
    }

    // 2. Check LEAVE_OVERLAP conflict (excluding this leave application ID)
    const existingOverlap = await db.select().from(leaveApplications).where(
      and(
        eq(leaveApplications.bankId, validated.bankId),
        lte(leaveApplications.startDate, validated.endDate),
        gte(leaveApplications.endDate, validated.startDate),
        ne(leaveApplications.id, id)
      )
    ).then(r => r[0]);

    if (existingOverlap) {
      throw new ConflictError('leave_conflict', {
        conflictType: 'LEAVE_OVERLAP',
        employeeName: validated.applicantName,
        dates: [validated.startDate, validated.endDate],
        existingLeaveStart: existingOverlap.startDate,
        existingLeaveEnd: existingOverlap.endDate
      });
    }

    return db.transaction(async (tx) => {
      const updatedLeaveList = await tx.update(leaveApplications)
        .set({
          leaveType: validated.leaveType,
          startDate: validated.startDate,
          endDate: validated.endDate,
          applicationDate: validated.applicationDate,
          applicantName: validated.applicantName,
          designation: validated.designation,
          bankId: validated.bankId,
          fileNo: validated.fileNo || null,
          cellName: validated.cellName,
          leaveLocation: validated.leaveLocation,
          mobileNo: validated.mobileNo,
          selectedDistrict: validated.selectedDistrict || null,
          delegateId: validated.delegateId || null,
          casualTotal: validated.casualTotal,
          casualUsed: validated.casualUsed,
          ordinaryTotal: validated.ordinaryTotal,
          ordinaryUsed: validated.ordinaryUsed,
          specialTotal: validated.specialTotal,
          specialUsed: validated.specialUsed
        })
        .where(eq(leaveApplications.id, id))
        .returning();
      const updatedLeave = updatedLeaveList[0];

      if (validated.bankId && validated.mobileNo) {
        await tx.update(employees)
          .set({ mobile: validated.mobileNo })
          .where(eq(employees.bankId, validated.bankId));
      }

      await logActivity({
        username: currentUser.username,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: String(updatedLeave.id),
        ipAddress: headersInfo.ipAddress,
        userAgent: headersInfo.userAgent,
        details: `${currentUser.name} (@${currentUser.username}) আইডি ${updatedLeave.id} এর ছুটির আবেদন আপডেট করেছেন।`
      });

      return updatedLeave;
    });
  }

  static async deleteLeave(currentUser: UserSession | null, id: number, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('unauthorized', 401, 'unauthorized');
    }

    const existingLeave = await LeaveRepository.findById(id);
    if (!existingLeave) {
      throw new AppError('leave_not_found', 404, 'leave_not_found');
    }

    if (currentUser.role !== 'ADMIN' && existingLeave.userId !== currentUser.id) {
      throw new AuthError('forbidden', 403, 'forbidden');
    }

    await db.transaction(async (tx) => {
      await LeaveRepository.delete(id, tx);

      await logActivity({
        username: currentUser.username,
        action: 'DELETE',
        entityType: 'USER',
        entityId: String(id),
        ipAddress: headersInfo.ipAddress,
        userAgent: headersInfo.userAgent,
        details: `${currentUser.name} (@${currentUser.username}) আইডি ${id} এর ছুটির আবেদন ডিলিট করেছেন।`
      });
    });

    return { success: true };
  }
}
