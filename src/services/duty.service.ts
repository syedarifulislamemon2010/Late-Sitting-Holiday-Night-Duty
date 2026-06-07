import { DutyRepository } from '@/repositories/duty.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { HolidayRepository } from '@/repositories/holiday.repository';
import { db } from '@/lib/db';
import { trash, cells, employees, holidays as holidaysTable } from '@/db/schema';
import { eq, ne, inArray, and } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { AppError, AuthError, ValidationError } from '@/lib/errors';
import { dutiesBulkCreateSchema, dutyUpdateSchema } from '@/validations/duty.schema';

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

  static async listDuties(currentUser: any, filters: { cellId: string | null, startDate: string | null, endDate: string | null, orderRef: string | null }) {
    let userCellIds: number[] = [];
    let isUserRestricted = false;

    if (currentUser && currentUser.role === 'USER') {
      isUserRestricted = true;
      userCellIds = currentUser.cells.map((c: any) => c.id);
    }

    const conditions: any[] = [];
    
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
    
    if (!filters.orderRef) {
      const dateConditions: any[] = [];
      if (filters.startDate) {
        dateConditions.push(gteDutiesDateHelper(filters.startDate));
      }
      if (filters.endDate) {
        dateConditions.push(lteDutiesDateHelper(filters.endDate));
      }

      if (dateConditions.length > 0) {
        const { or, isNull } = require('drizzle-orm');
        conditions.push(
          or(
            and(...dateConditions),
            isNull(dutiesOrderRefHelper())
          )
        );
      }
    } else {
      let refs = [filters.orderRef];
      if (filters.orderRef.endsWith('/বিল')) {
        refs.push(filters.orderRef.slice(0, -5));
      } else {
        refs.push(filters.orderRef + '/বিল');
      }
      conditions.push(inArray(dutiesOrderRefHelper(), refs));
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

  static async createDuties(currentUser: any, body: any, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('অনুমতি নেই।', 403, 'unauthorized');
    }

    const validated = dutiesBulkCreateSchema.parse(body);

    if (currentUser.role !== 'ADMIN') {
      const userCellIds = currentUser.cells.map((c: any) => c.id);
      const uniqueEmployeeIds = Array.from(new Set(validated.assignments.map((a: any) => a.employeeId)));
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

    const uniqueDates = Array.from(new Set(validated.assignments.map((a: any) => a.date)));
    const holidayOverrides = await HolidayRepository.findHolidaysByDates(uniqueDates);
    const holidayOverrideMap = new Map(holidayOverrides.map((h: any) => [h.date, h.isWorkingDay]));

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

    const uniqueEmployeeIds = Array.from(new Set(validated.assignments.map((a: any) => a.employeeId)));
    const allExistingDuties = await DutyRepository.findExistingDuties(uniqueEmployeeIds, uniqueDates);

    const dutiesToInsert = [];

    for (const assignment of validated.assignments) {
      const isHoliday = checkIsHolidayLocal(assignment.date);

      if (assignment.type === 'LATE_SITTING' && isHoliday) {
        throw new AppError('late_sitting_on_holiday', 400, 'late_sitting_on_holiday');
      }

      if (assignment.type === 'HOLIDAY' && !isHoliday) {
        throw new AppError('holiday_duty_on_working_day', 400, 'holiday_duty_on_working_day');
      }

      // Check for duplicate on this date (regardless of type)
      const duplicate = allExistingDuties.find(d => d.employeeId === assignment.employeeId && d.date === assignment.date);
      if (duplicate) {
        throw new AppError('duplicate_duty_on_date', 400, 'duplicate_duty_on_date');
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

  static async updateDuty(currentUser: any, id: number, body: any, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('অনুমতি নেই।', 403, 'unauthorized');
    }

    const validated = dutyUpdateSchema.parse(body);

    const currentDuty = await DutyRepository.findById(id);
    if (!currentDuty) {
      throw new AppError('duty_not_found', 444, 'duty_not_found');
    }

    if (currentUser.role !== 'ADMIN') {
      const userCellIds = currentUser.cells.map((c: any) => c.id);
      const emp = await EmployeeRepository.findById(currentDuty.employeeId);
      if (!emp || !userCellIds.includes(emp.cellId)) {
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

    const duplicateList = await DutyRepository.findDuplicateDutyForEmployee(currentDuty.employeeId, targetDate, id);
    if (duplicateList.length > 0) {
      throw new AppError('duplicate_duty_on_date', 400, 'duplicate_duty_on_date');
    }

    const { allowance1, allowance2, totalBill } = this.calculateAllowances(targetType);

    const updatedDuty = await DutyRepository.update(id, {
      type: targetType,
      date: targetDate,
      description: validated.description !== undefined ? (validated.description || null) : currentDuty.description,
      allowance1,
      allowance2,
      totalBill
    });

    const emp = await EmployeeRepository.findById(updatedDuty.employeeId);
    const cell = emp ? (await db.select().from(cells).where(eq(cells.id, emp.cellId)))[0] : null;

    const updated = {
      ...updatedDuty,
      employee: {
        ...emp,
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

  static async deleteDuty(currentUser: any, id: number) {
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
  const { employees } = require('@/db/schema');
  return employees.cellId;
}
function dutiesOrderRefHelper() {
  const { duties } = require('@/db/schema');
  return duties.orderRef;
}
function gteDutiesDateHelper(val: string) {
  const { duties } = require('@/db/schema');
  const { gte } = require('drizzle-orm');
  return gte(duties.date, val);
}
function lteDutiesDateHelper(val: string) {
  const { duties } = require('@/db/schema');
  const { lte } = require('drizzle-orm');
  return lte(duties.date, val);
}
