import { LeaveRepository } from '@/repositories/leave.repository';
import { logActivity } from '@/lib/audit';
import { AppError, AuthError } from '@/lib/errors';
import { leaveCreateSchema } from '@/validations/leave.schema';
import { eq, and } from 'drizzle-orm';
import { leaveApplications } from '@/db/schema';
import { db } from '@/lib/db';

interface UserSession {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
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
  delegateId?: number | null;
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

    const validated = leaveCreateSchema.parse(body);

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
    });

    await logActivity({
      username: currentUser.username,
      action: 'CREATE',
      entityType: 'USER',
      entityId: String(newLeave.id),
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) নতুন ছুটির আবেদন (${validated.leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : validated.leaveType === 'STATION_LEAVE' ? 'कर्मस्थल ত্যাগের অনুমতিসহ নৈমিত্তিক' : 'নৈমিত্তিক'}) তৈরি ও সংরক্ষণ করেছেন।`
    });

    return newLeave;
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

    const updatedLeaveList = await db.update(leaveApplications)
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

    await LeaveRepository.delete(id);

    await logActivity({
      username: currentUser.username,
      action: 'DELETE',
      entityType: 'USER',
      entityId: String(id),
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) আইডি ${id} এর ছুটির আবেদন ডিলিট করেছেন।`
    });

    return { success: true };
  }
}
