import { OfficeOrderRepository } from '@/repositories/officeOrder.repository';
import { db } from '@/lib/db';
import { trash, officeOrders } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { AppError, AuthError, ValidationError } from '@/lib/errors';
import { officeOrderCreateSchema, officeOrderUpdateSchema } from '@/validations/officeOrder.schema';

export class OfficeOrderService {
  static async listOfficeOrders(currentUser: any) {
    let userCellNames: string[] = [];
    let isUserRestricted = false;

    if (currentUser) {
      if (currentUser.role === 'USER') {
        isUserRestricted = true;
        userCellNames = currentUser.cells.map((c: any) => c.name);
      }
    }

    let ordersList: any[] = [];
    if (isUserRestricted) {
      if (userCellNames.length > 0) {
        ordersList = await OfficeOrderRepository.listAll(inArray(officeOrdersCellNameHelper(), userCellNames));
      } else {
        ordersList = [];
      }
    } else {
      ordersList = await OfficeOrderRepository.listAll();
    }

    const orderRefs = ordersList.map((o: any) => o.orderRef);
    let linkedDuties: any[] = [];
    if (orderRefs.length > 0) {
      linkedDuties = await db.select({
        id: dutiesIdHelper(),
        date: dutiesDateHelper(),
        orderRef: dutiesOrderRefHelper(),
        employee: {
          id: employeesIdHelper(),
          name: employeesNameHelper(),
          bankId: employeesBankIdHelper()
        }
      })
      .from(dutiesTableHelper())
      .innerJoin(employeesTableHelper(), eq(dutiesEmployeeIdHelper(), employeesIdHelper()))
      .where(inArray(dutiesOrderRefHelper(), orderRefs));
    }

    const toBanglaDigits = (num: string | number): string => {
      const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit)]);
    };

    const res = ordersList.map((order: any) => {
      let parsedDuties = order.dutiesJson ? JSON.parse(order.dutiesJson) : [];
      
      if (order.category.startsWith('BILL_')) {
        parsedDuties = parsedDuties.map((s: any) => {
          if (!s.datesFormatted) {
            const matches = linkedDuties.filter((d: any) => 
              d.orderRef === order.orderRef && 
              (d.employee.bankId === s.employeeId || d.employee.id.toString() === s.employeeId || d.employee.name === s.employeeName)
            );
            if (matches.length > 0) {
              const uniqueDates = Array.from(new Set(matches.map((m: any) => m.date as string))).sort();
              const formatted = uniqueDates.map((dStr: any) => {
                const [year, month, day] = (dStr as string).split('-');
                return toBanglaDigits(`${day}-${month}-${year}`);
              }).join(', ');
              return { ...s, datesFormatted: formatted };
            }
          }
          return s;
        });
      }

      return {
        id: order.id,
        orderRef: order.orderRef,
        orderDate: order.orderDate,
        category: order.category,
        employeeName: order.employeeName,
        cellName: order.cellName,
        duties: parsedDuties,
        content: order.contentJson ? JSON.parse(order.contentJson) : null,
        status: order.status,
        createdAt: order.createdAt.toISOString()
      };
    });

    return res;
  }

  static async createOfficeOrder(currentUser: any, body: any, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('ব্যবহারকারী পাওয়া যায়নি।', 403, 'unauthorized');
    }

    const validated = officeOrderCreateSchema.parse(body);

    if (validated.originalOrderRef && validated.originalOrderRef !== validated.orderRef) {
      await OfficeOrderRepository.clearDutiesOrderRef(validated.originalOrderRef);
      await OfficeOrderRepository.deleteByOrderRef(validated.originalOrderRef);
    }

    await OfficeOrderRepository.clearDutiesOrderRef(validated.orderRef);

    const existingOrder = await OfficeOrderRepository.findByOrderRef(validated.orderRef);
    let orderRecord = existingOrder;
    const existed = !!existingOrder;

    const dataToSave = {
      orderRef: validated.orderRef,
      orderDate: validated.orderDate,
      category: validated.category,
      employeeName: validated.employeeName,
      cellName: validated.cellName || null,
      dutiesJson: validated.duties ? JSON.stringify(validated.duties) : '[]',
      contentJson: validated.content ? JSON.stringify(validated.content) : null,
      status: 'Printed'
    };

    if (!orderRecord) {
      orderRecord = await OfficeOrderRepository.create(dataToSave);
    } else {
      orderRecord = await OfficeOrderRepository.updateByOrderRef(validated.orderRef, {
        orderDate: validated.orderDate,
        employeeName: validated.employeeName,
        cellName: validated.cellName || null,
        dutiesJson: validated.duties ? JSON.stringify(validated.duties) : '[]',
        contentJson: validated.content ? JSON.stringify(validated.content) : null,
        status: 'Printed'
      });
    }

    if (validated.dutyIds && validated.dutyIds.length > 0) {
      await OfficeOrderRepository.linkDutiesToOrderRef(
        validated.dutyIds.map(id => Number(id)),
        validated.orderRef
      );
    }

    const isEdit = existed || !!validated.originalOrderRef;

    await logActivity({
      username: currentUser.username,
      action: isEdit ? 'UPDATE' : 'CREATE',
      entityType: 'OFFICE_ORDER',
      entityId: String(orderRecord.id),
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) ${isEdit ? 'অফিস আদেশ বা বিল মেমো সংশোধন' : 'নতুন অফিস আদেশ বা বিল মেমো তৈরি'} করেছেন (সূত্র: ${validated.orderRef})।`
    });

    return { success: true, id: orderRecord.id, order: orderRecord };
  }

  static async updateOfficeOrder(currentUser: any, id: number, body: any, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('ব্যবহারকারী পাওয়া যায়নি।', 403, 'unauthorized');
    }

    const validated = officeOrderUpdateSchema.parse(body);

    const existingOrder = await OfficeOrderRepository.findById(id);
    if (!existingOrder) {
      throw new AppError('অফিস আদেশ পাওয়া যায়নি।', 404, 'not_found');
    }

    if (validated.orderRef !== existingOrder.orderRef) {
      const duplicateRef = await OfficeOrderRepository.findByOrderRef(validated.orderRef);
      if (duplicateRef) {
        throw new AppError('এই সূত্র নম্বরযুক্ত একটি অফিস আদেশ ইতোমধ্যে আর্কাইভে সংরক্ষিত আছে।', 400, 'duplicate_ref');
      }
    }

    if (validated.orderRef !== existingOrder.orderRef) {
      await db.update(dutiesTableHelper())
        .set({ orderRef: validated.orderRef })
        .where(eq(dutiesOrderRefHelper(), existingOrder.orderRef));
    }

    const updated = await OfficeOrderRepository.update(id, {
      orderRef: validated.orderRef,
      orderDate: validated.orderDate,
      employeeName: validated.employeeName,
      cellName: validated.cellName || null,
      status: validated.status || existingOrder.status
    });

    await logActivity({
      username: currentUser.username,
      action: 'UPDATE',
      entityType: 'OFFICE_ORDER',
      entityId: String(updated.id),
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) অফিস আদেশ বা বিল মেমো সংশোধন করেছেন (সূত্র: ${validated.orderRef})।`
    });

    return { success: true, order: updated };
  }

  static async deleteOfficeOrder(currentUser: any, id: number, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('ব্যবহারকারী পাওয়া যায়নি।', 403, 'unauthorized');
    }

    const order = await OfficeOrderRepository.findById(id);
    if (!order) {
      throw new AppError('অফিস আদেশ পাওয়া যায়নি।', 404, 'not_found');
    }

    await logActivity({
      username: currentUser.username,
      action: 'DELETE',
      entityType: 'OFFICE_ORDER',
      entityId: String(id),
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) অফিস আদেশ বা বিল মেমো মুছে ফেলেছেন (সূত্র: ${order.orderRef})।`
    });

    await db.insert(trash).values({
      entityType: 'DOCUMENT',
      entityId: id,
      name: `অফিস আদেশ সূত্র: ${order.orderRef}`,
      data: JSON.stringify(order),
      deletedBy: currentUser.username
    });

    await OfficeOrderRepository.clearDutiesOrderRef(order.orderRef);
    await OfficeOrderRepository.delete(id);

    return { success: true };
  }
}

// Dynamic import resolution helper functions for tables
function officeOrdersCellNameHelper() {
  const { officeOrders } = require('@/db/schema');
  return officeOrders.cellName;
}
function dutiesTableHelper() {
  const { duties } = require('@/db/schema');
  return duties;
}
function dutiesIdHelper() {
  const { duties } = require('@/db/schema');
  return duties.id;
}
function dutiesDateHelper() {
  const { duties } = require('@/db/schema');
  return duties.date;
}
function dutiesOrderRefHelper() {
  const { duties } = require('@/db/schema');
  return duties.orderRef;
}
function dutiesEmployeeIdHelper() {
  const { duties } = require('@/db/schema');
  return duties.employeeId;
}
function employeesTableHelper() {
  const { employees } = require('@/db/schema');
  return employees;
}
function employeesIdHelper() {
  const { employees } = require('@/db/schema');
  return employees.id;
}
function employeesNameHelper() {
  const { employees } = require('@/db/schema');
  return employees.name;
}
function employeesBankIdHelper() {
  const { employees } = require('@/db/schema');
  return employees.bankId;
}
