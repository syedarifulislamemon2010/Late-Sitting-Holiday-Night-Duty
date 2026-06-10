import { DutyRepository } from '@/repositories/duty.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { HolidayRepository } from '@/repositories/holiday.repository';
import { db } from '@/lib/db';
import { trash, cells, employees, duties, leaveApplications } from '@/db/schema';
import { eq, inArray, and, or, isNull, gte, lte, SQL, like } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { AppError, AuthError } from '@/lib/errors';
import { dutiesBulkCreateSchema, dutyUpdateSchema } from '@/validations/duty.schema';

export interface UserSession {
  id: number;
  username: string;
  name: string;
  role: 'ADMIN' | 'USER';
  mobile: string | null;
  cells: { id: number; name: string }[];
}

export class DutyService {
  static calculateAllowances(type: string) {
    switch (type) {
      case 'LATE_SITTING':
        return { allowance1: 100, allowance2: 200, totalBill: 300 };
      case 'HOLIDAY':
        return { allowance1: 250, allowance2: 250, totalBill: 500 };
      case 'NIGHT_SHIFT':
        return { allowance1: 600, allowance2: 400, totalBill: 1000 };
      default:
        throw new AppError('invalid_duty_type', 400, 'invalid_duty_type');
    }
  }

  static async checkIsHoliday(dateStr: string): Promise<boolean> {
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    const override = await HolidayRepository.findByDate(dateStr);
    if (override) {
      return !override.isWorkingDay;
    }

    return isWeekend;
  }

  static async listDuties(
    currentUser: UserSession | null | undefined,
    filters: {
      cellId: string | null;
      startDate: string | null;
      endDate: string | null;
      orderRef: string | null;
      employeeId?: string | null;
      type?: string | null;
    }
  ) {
    let userCellIds: number[] = [];
    let isUserRestricted = false;

    if (currentUser && currentUser.role === 'USER') {
      isUserRestricted = true;
      userCellIds = currentUser.cells.map((c: { id: number }) => c.id);
    }

    const conditions: SQL[] = [];
    
    if (isUserRestricted) {
      if (filters.cellId && filters.cellId !== 'all') {
        const targetId = parseInt(filters.cellId, 10);
        if (userCellIds.includes(targetId)) {
          conditions.push(eq(employeesCellIdHelper(), targetId));
        } else {
          conditions.push(eq(employeesCellIdHelper(), -1)); // block access
        }
      } else {
        if (userCellIds.length > 0) {
          conditions.push(inArray(employeesCellIdHelper(), userCellIds));
        } else {
          return []; // block access
        }
      }
    } else {
      if (filters.cellId && filters.cellId !== 'all') {
        conditions.push(eq(employeesCellIdHelper(), parseInt(filters.cellId, 10)));
      }
    }

    if (filters.employeeId) {
      conditions.push(eq(duties.employeeId, parseInt(filters.employeeId, 10)));
    }
    if (filters.type) {
      conditions.push(eq(duties.type, filters.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT'));
    }
    
    if (!filters.orderRef) {
      const dateConditions: SQL[] = [];
      if (filters.startDate) {
        dateConditions.push(gteDutiesDateHelper(filters.startDate));
      }
      if (filters.endDate) {
        dateConditions.push(lteDutiesDateHelper(filters.endDate));
      }

      if (dateConditions.length > 0) {
        const dateAnd = and(...dateConditions);
        if (dateAnd) {
          const dateOr = or(dateAnd, isNull(dutiesOrderRefHelper()));
          if (dateOr) {
            conditions.push(dateOr);
          }
        }
      }
    } else {
      const refs = [filters.orderRef];
      const isBill = filters.orderRef.endsWith('/বিল');
      let likePattern = '';

      const parts = filters.orderRef.split('/');
      if (parts.length >= 3) {
        if (isBill) {
          const cleanParts = parts.slice(0, -1);
          cleanParts[2] = '%';
          likePattern = cleanParts.join('/');
        } else {
          parts[2] = '%';
          likePattern = parts.join('/') + '/বিল';
        }
      }

      const orConditions = [eq(dutiesOrderRefHelper(), filters.orderRef)];
      if (isBill) {
        orConditions.push(eq(dutiesOrderRefHelper(), filters.orderRef.slice(0, -5)));
      } else {
        orConditions.push(eq(dutiesOrderRefHelper(), filters.orderRef + '/বিল'));
      }

      if (likePattern) {
        orConditions.push(like(dutiesOrderRefHelper(), likePattern));
      }

      const orCond = or(...orConditions);
      if (orCond) {
        conditions.push(orCond);
      }
    }

    const dutiesList = await DutyRepository.listAllWithDetails(
      conditions.length > 0 ? and(...conditions) : undefined
    );

    return dutiesList.map(d => ({
      id: d.id,
      employeeId: d.employeeId,
      type: d.type,
      date: d.date,
      description: d.description,
      allowance1: d.allowance1,
      allowance2: d.allowance2,
      totalBill: d.totalBill,
      orderRef: d.orderRef,
      createdAt: d.createdAt,
      employee: {
        id: d.empId,
        name: d.empName,
        designation: d.empDesignation,
        bankId: d.empBankId,
        fileNo: d.empFileNo,
        mobile: d.empMobile,
        cellId: d.empCellId,
        createdAt: d.empCreatedAt,
        cell: {
          id: d.cellId,
          name: d.cellName,
          description: d.cellDescription,
          createdAt: d.cellCreatedAt
        }
      }
    }));
  }

  static async createDuties(currentUser: UserSession | null | undefined, body: unknown, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('অনুমতি নেই।', 403, 'unauthorized');
    }

    const validated = dutiesBulkCreateSchema.parse(body);

    if (currentUser.role !== 'ADMIN') {
      const userCellIds = currentUser.cells.map((c: { id: number }) => c.id);
      const uniqueEmployeeIds = Array.from(new Set(validated.assignments.map((a: { employeeId: number }) => a.employeeId)));
      const employeesToCheck = await db.select().from(employees)
        .where(inArray(employees.id, uniqueEmployeeIds));
      for (const emp of employeesToCheck) {
        if (!userCellIds.includes(emp.cellId)) {
          throw new AuthError('অন্য সেলের কর্মকর্তাকে ডিউটি দেয়ার অনুমতি নেই।', 403, 'forbidden');
        }
      }
    }

    if (validated.originalOrderRef) {
      await DutyRepository.deleteDutiesByOrderRef(validated.originalOrderRef);
    }
    if (validated.orderRef && validated.orderRef !== validated.originalOrderRef) {
      await DutyRepository.deleteDutiesByOrderRef(validated.orderRef);
    }

    const uniqueDates = Array.from(new Set(validated.assignments.map((a: { date: string }) => a.date)));
    const holidayOverrides = await HolidayRepository.findHolidaysByDates(uniqueDates);
    const holidayOverrideMap = new Map(holidayOverrides.map((h) => [h.date, h.isWorkingDay]));

    const checkIsHolidayLocal = (dateStr: string): boolean => {
      const dateObj = new Date(dateStr);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const isWorkingDay = holidayOverrideMap.get(dateStr);
      if (isWorkingDay !== undefined) {
        return !isWorkingDay;
      }
      return isWeekend;
    };

    const uniqueEmployeeIds = Array.from(new Set(validated.assignments.map((a: { employeeId: number }) => a.employeeId)));
    const allExistingDutiesFromDb = await DutyRepository.findExistingDuties(uniqueEmployeeIds, uniqueDates);
    
    const dutiesToDeleteSet = new Set(validated.dutiesToDelete || []);
    const isUpdateMode = validated.dutiesToDelete !== undefined;
    
    if (isUpdateMode) {
      for (const assignment of validated.assignments) {
        const conflicts = allExistingDutiesFromDb.filter(d =>
          d.employeeId === assignment.employeeId &&
          d.date === assignment.date
        );
        conflicts.forEach(c => dutiesToDeleteSet.add(c.id));
      }
    }

    const allExistingDuties = allExistingDutiesFromDb.filter(d => !dutiesToDeleteSet.has(d.id));

    const employeesList = await db.select().from(employees).where(inArray(employees.id, uniqueEmployeeIds));
    const employeeMap = new Map(employeesList.map(e => [e.id, e]));

    const employeeBankIds = employeesList.map(e => e.bankId).filter((bid): bid is string => Boolean(bid));
    let leaves: (typeof leaveApplications.$inferSelect)[] = [];
    if (employeeBankIds.length > 0) {
      leaves = await db.select().from(leaveApplications).where(inArray(leaveApplications.bankId, employeeBankIds));
    }

    const duplicateConflicts: string[] = [];
    for (const assignment of validated.assignments) {
      const duplicate = allExistingDuties.find(d => 
        d.employeeId === assignment.employeeId && 
        d.date === assignment.date && 
        d.type === assignment.type
      );
      if (duplicate) {
        const emp = employeeMap.get(assignment.employeeId);
        const empName = emp ? emp.name : 'কর্মকর্তা';
        const dutyTypeBn = assignment.type === 'LATE_SITTING' ? 'লেট সিটিং' : assignment.type === 'HOLIDAY' ? 'হলিডে' : 'নাইট শিফট';
        const formattedDate = assignment.date.split('-').reverse().join('-');
        duplicateConflicts.push(`${empName} (${formattedDate} - ${dutyTypeBn})`);
      }
    }
    if (duplicateConflicts.length > 0) {
      const uniqueConflicts = Array.from(new Set(duplicateConflicts));
      throw new AppError(`এই তারিখের মধ্যে কোনো কোনো কর্মকর্তার জন্য ইতিমধ্যে অন্য ডিউটি বা লেট সিটিং বরাদ্দ আছে। ডুপ্লিকেট এন্ট্রি করা সম্ভব নয়।\n\nবিস্তারিত:\n` + uniqueConflicts.map(c => `- ${c}`).join('\n'), 400, 'duplicate_duty_on_date');
    }

    const dutiesToInsert: {
      employeeId: number;
      type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
      date: string;
      description: string | null;
      allowance1: number;
      allowance2: number;
      totalBill: number;
      orderRef: string | null;
    }[] = [];

    for (const assignment of validated.assignments) {
      const isHoliday = checkIsHolidayLocal(assignment.date);

      if (assignment.type === 'LATE_SITTING' && isHoliday) {
        throw new AppError('late_sitting_on_holiday', 400, 'late_sitting_on_holiday');
      }

      if (assignment.type === 'HOLIDAY' && !isHoliday) {
        throw new AppError('holiday_duty_on_working_day', 400, 'holiday_duty_on_working_day');
      }

      if (assignment.type === 'LATE_SITTING' || assignment.type === 'NIGHT_SHIFT') {
        const conflictingType = assignment.type === 'LATE_SITTING' ? 'NIGHT_SHIFT' : 'LATE_SITTING';
        const dbConflict = allExistingDuties.some(d =>
          d.employeeId === assignment.employeeId &&
          d.date === assignment.date &&
          d.type === conflictingType
        );
        const batchConflict = dutiesToInsert.some(d =>
          d.employeeId === assignment.employeeId &&
          d.date === assignment.date &&
          d.type === conflictingType
        );
        if (dbConflict || batchConflict) {
          throw new AppError('late_sitting_night_shift_conflict', 400, 'late_sitting_night_shift_conflict');
        }
      }

      const emp = employeeMap.get(assignment.employeeId);
      if (emp && emp.bankId) {
        const hasLeaveConflict = leaves.some(l => 
          l.bankId === emp.bankId && 
          l.startDate <= assignment.date && 
          l.endDate >= assignment.date
        );
        if (hasLeaveConflict) {
          throw new AppError('leave_conflict', 400, 'leave_conflict');
        }
      }

      const { allowance1, allowance2, totalBill } = this.calculateAllowances(assignment.type);

      dutiesToInsert.push({
        employeeId: assignment.employeeId,
        type: assignment.type,
        date: assignment.date,
        description: assignment.description || null,
        allowance1,
        allowance2,
        totalBill,
        orderRef: validated.orderRef || null
      });
    }

    if (dutiesToDeleteSet.size > 0) {
      for (const dutyId of dutiesToDeleteSet) {
        const dutyRecord = await DutyRepository.findById(dutyId);
        if (dutyRecord) {
          const emp = await EmployeeRepository.findById(dutyRecord.employeeId);
          const duty = { ...dutyRecord, employee: emp };
          const typeMapBangla: Record<string, string> = {
            'LATE_SITTING': 'লেট সিটিং',
            'HOLIDAY': 'ছুটির দিন',
            'NIGHT_SHIFT': 'নাইট শিফট'
          };
          const deletedBy = currentUser ? currentUser.username : null;
          await db.insert(trash).values({
            entityType: 'DUTY',
            entityId: dutyId,
            name: `${duty.employee?.name || 'Unknown'} - ${typeMapBangla[duty.type] || duty.type} (${duty.date})`,
            data: JSON.stringify(duty),
            deletedBy
          });
          await DutyRepository.delete(dutyId);
        }
      }
    }

    const inserted = await DutyRepository.createBulk(dutiesToInsert);

    const firstDuty = inserted[0];
    if (firstDuty) {
      const emp = await EmployeeRepository.findById(firstDuty.employeeId);
      const activityDetails = `${currentUser.name} (@${currentUser.username}) ${validated.orderRef ? `নতুন অফিস আদেশ/বিল মেমো সংরক্ষণ` : `নতুন ডিউটি অ্যাসাইনমেন্ট`} করেছেন (${firstDuty.date}, কর্মকর্তা: ${emp?.name || 'Unknown'})।`;
      await logActivity({
        username: currentUser.username,
        action: 'CREATE',
        entityType: 'DUTY',
        entityId: String(firstDuty.id),
        ipAddress: headersInfo.ipAddress,
        userAgent: headersInfo.userAgent,
        details: activityDetails
      });
    }

    return inserted;
  }

  static async updateDuty(currentUser: UserSession | null | undefined, id: number, body: unknown, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('অনুমতি নেই।', 403, 'unauthorized');
    }

    const validated = dutyUpdateSchema.parse(body);

    const currentDuty = await DutyRepository.findById(id);
    if (!currentDuty) {
      throw new AppError('duty_not_found', 444, 'duty_not_found');
    }

    const emp = await EmployeeRepository.findById(currentDuty.employeeId);
    const targetEmployeeId = validated.employeeId || currentDuty.employeeId;
    const targetEmp = await EmployeeRepository.findById(targetEmployeeId);
    if (!targetEmp) {
      throw new AppError('employee_not_found', 404, 'employee_not_found');
    }

    if (currentUser.role !== 'ADMIN') {
      const userCellIds = currentUser.cells.map((c: { id: number }) => c.id);
      if (!emp || !userCellIds.includes(emp.cellId)) {
        throw new AuthError('অন্য সেলের কর্মকর্তা আপডেট করার অনুমতি নেই।', 403, 'forbidden');
      }
      if (!userCellIds.includes(targetEmp.cellId)) {
        throw new AuthError('অন্য সেলের কর্মকর্তা আপডেট করার অনুমতি নেই।', 403, 'forbidden');
      }
    }

    const targetType = (validated.type || currentDuty.type) as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
    const targetDate = validated.date || currentDuty.date;

    const isHoliday = await this.checkIsHoliday(targetDate);
    if (targetType === 'LATE_SITTING' && isHoliday) {
      throw new AppError('late_sitting_on_holiday', 400, 'late_sitting_on_holiday');
    }
    if (targetType === 'HOLIDAY' && !isHoliday) {
      throw new AppError('holiday_duty_on_working_day', 400, 'holiday_duty_on_working_day');
    }

    if (targetEmp && targetEmp.bankId) {
      const leaves = await db.select().from(leaveApplications).where(eq(leaveApplications.bankId, targetEmp.bankId));
      const hasLeaveConflict = leaves.some(l => 
        l.startDate <= targetDate && 
        l.endDate >= targetDate
      );
      if (hasLeaveConflict) {
        throw new AppError('leave_conflict', 400, 'leave_conflict');
      }
    }

    if (targetType === 'LATE_SITTING' || targetType === 'NIGHT_SHIFT') {
      const conflictingType = targetType === 'LATE_SITTING' ? 'NIGHT_SHIFT' : 'LATE_SITTING';
      const conflictList = await DutyRepository.findDuplicateDutyForEmployee(targetEmployeeId, targetDate, id);
      const hasConflict = conflictList.some(d => d.type === conflictingType);
      if (hasConflict) {
        throw new AppError('late_sitting_night_shift_conflict', 400, 'late_sitting_night_shift_conflict');
      }
    }

    const duplicateList = await DutyRepository.findDuplicateDutyForEmployee(targetEmployeeId, targetDate, id);
    const duplicate = duplicateList.find(d => d.type === targetType);
    if (duplicate) {
      const empName = targetEmp ? targetEmp.name : 'কর্মকর্তা';
      const dutyTypeBn = targetType === 'LATE_SITTING' ? 'লেট সিটিং' : targetType === 'HOLIDAY' ? 'হলিডে' : 'নাইট শিফট';
      const formattedDate = targetDate.split('-').reverse().join('-');
      throw new AppError(`উক্ত কর্মকর্তার জন্য ইতিমধ্যে এই তারিখে ডিউটি বরাদ্দ রয়েছে। ডুপ্লিকেট এন্ট্রি করা সম্ভব নয়।\n\nবিস্তারিত:\n- ${empName} (${formattedDate} - ${dutyTypeBn})`, 400, 'duplicate_duty_on_date');
    }

    const { allowance1, allowance2, totalBill } = this.calculateAllowances(targetType);

    const updatedDuty = await DutyRepository.update(id, {
      employeeId: targetEmployeeId,
      type: targetType,
      date: targetDate,
      description: validated.description !== undefined ? (validated.description || null) : currentDuty.description,
      allowance1,
      allowance2,
      totalBill
    });

    const updatedEmp = await EmployeeRepository.findById(updatedDuty.employeeId);
    const cell = updatedEmp ? (await db.select().from(cells).where(eq(cells.id, updatedEmp.cellId)))[0] : null;

    const updated = {
      ...updatedDuty,
      employee: {
        ...updatedEmp,
        cell
      }
    };

    const typeMapBangla: Record<string, string> = {
      'LATE_SITTING': 'লেট সিটিং',
      'HOLIDAY': 'ছুটির দিন',
      'NIGHT_SHIFT': 'নাইট শিফট'
    };

    await logActivity({
      username: currentUser.username,
      action: 'UPDATE',
      entityType: 'DUTY',
      entityId: String(updated.id),
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) কর্মকর্তা "${updated.employee.name}" এর ডিউটি অ্যাসাইনমেন্ট সংশোধন করেছেন (${updated.date}, টাইপ: ${typeMapBangla[updated.type] || updated.type})।`
    });

    return updated;
  }




  static async deleteDuty(currentUser: UserSession | null | undefined, id: number) {
    const dutyRecord = await DutyRepository.findById(id);
    if (!dutyRecord) {
      throw new AppError('duty_not_found', 404, 'duty_not_found');
    }

    const emp = await EmployeeRepository.findById(dutyRecord.employeeId);
    const duty = {
      ...dutyRecord,
      employee: emp
    };

    const typeMapBangla: Record<string, string> = {
      'LATE_SITTING': 'লেট সিটিং',
      'HOLIDAY': 'ছুটির দিন',
      'NIGHT_SHIFT': 'নাইট শিফট'
    };

    const deletedBy = currentUser ? currentUser.username : null;

    await db.insert(trash).values({
      entityType: 'DUTY',
      entityId: id,
      name: `${duty.employee.name} - ${typeMapBangla[duty.type] || duty.type} (${duty.date})`,
      data: JSON.stringify(duty),
      deletedBy
    });

    await DutyRepository.delete(id);

    return { success: true };
  }
}

// Helper query function wrappers for dynamic import resolution
function employeesCellIdHelper() {
  return employees.cellId;
}
function dutiesOrderRefHelper() {
  return duties.orderRef;
}
function gteDutiesDateHelper(val: string) {
  return gte(duties.date, val);
}
function lteDutiesDateHelper(val: string) {
  return lte(duties.date, val);
}
