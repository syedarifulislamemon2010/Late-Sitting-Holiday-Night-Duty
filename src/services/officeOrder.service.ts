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

    if (currentUser.role !== 'ADMIN') {
      const userCellNames = currentUser.cells.map((c: any) => c.name);
      if (!validated.cellName || !userCellNames.includes(validated.cellName)) {
        throw new AuthError('অন্য সেলের জন্য অফিস আদেশ তৈরি করার অনুমতি নেই।', 403, 'forbidden');
      }
    }

    if (validated.category?.startsWith('BILL_')) {
      const backingOrderRef = validated.content?.backingOrderRef;
      if (!backingOrderRef) {
        throw new AppError('বিল সংরক্ষণের জন্য ব্যাকলগ অফিস আদেশ রেফারেন্স প্রয়োজন।', 400, 'backing_order_required');
      }
      const backingOrder = await OfficeOrderRepository.findByOrderRef(backingOrderRef);
      if (!backingOrder || (backingOrder.status !== 'Generated & Printed' && backingOrder.status !== 'Printed')) {
        throw new AppError(`বিল তৈরির পূর্বে রেফারেন্সকৃত অফিস আদেশ (${backingOrderRef}) 'Generated & Printed' স্ট্যাটাসে থাকতে হবে।`, 400, 'backing_order_invalid');
      }
    }

    if (validated.originalOrderRef && validated.originalOrderRef !== validated.orderRef) {
      await OfficeOrderRepository.clearDutiesOrderRef(validated.originalOrderRef);
      await OfficeOrderRepository.deleteByOrderRef(validated.originalOrderRef);
    }

    await OfficeOrderRepository.clearDutiesOrderRef(validated.orderRef);

    const existingOrder = await OfficeOrderRepository.findByOrderRef(validated.orderRef);
    let orderRecord = existingOrder;
    const existed = !!existingOrder || !!validated.originalOrderRef;
    const isBill = validated.category?.startsWith('BILL_');

    const statusToSave = validated.status || (existed ? 'Modified' : 'Generated');

    const dataToSave = {
      orderRef: validated.orderRef,
      orderDate: validated.orderDate,
      category: validated.category,
      employeeName: validated.employeeName,
      cellName: validated.cellName || null,
      dutiesJson: validated.duties ? JSON.stringify(validated.duties) : '[]',
      contentJson: validated.content ? JSON.stringify(validated.content) : null,
      status: statusToSave
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
        status: statusToSave
      });
    }

    if (validated.dutyIds && validated.dutyIds.length > 0) {
      await OfficeOrderRepository.linkDutiesToOrderRef(
        validated.dutyIds.map(id => Number(id)),
        validated.orderRef
      );
    }

    const logAction = isBill 
      ? (existed ? 'EDIT_BILL' : 'GENERATE_BILL') 
      : (existed ? 'EDIT_OFFICE_ORDER' : 'GENERATE_OFFICE_ORDER');

    await logActivity({
      username: currentUser.username,
      action: logAction,
      entityType: 'OFFICE_ORDER',
      entityId: String(orderRecord.id),
      userId: currentUser.id,
      bankId: currentUser.username,
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) ${isBill ? (existed ? 'বিল মেমো সংশোধন' : 'নতুন বিল মেমো তৈরি') : (existed ? 'অফিস আদেশ সংশোধন' : 'নতুন অফিস আদেশ তৈরি')} করেছেন (সূত্র: ${validated.orderRef})।`
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

    if (currentUser.role !== 'ADMIN') {
      const userCellNames = currentUser.cells?.map((c: any) => c.name) || [];
      if (!existingOrder.cellName || !userCellNames.includes(existingOrder.cellName)) {
        throw new AuthError('অন্য সেলের জন্য অফিস আদেশ আপডেট করার অনুমতি নেই।', 403, 'forbidden');
      }
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

    const isBill = existingOrder.category?.startsWith('BILL_');
    const updated = await OfficeOrderRepository.update(id, {
      orderRef: validated.orderRef,
      orderDate: validated.orderDate,
      employeeName: validated.employeeName,
      cellName: validated.cellName || null,
      status: 'Modified'
    });

    await logActivity({
      username: currentUser.username,
      action: isBill ? 'EDIT_BILL' : 'EDIT_OFFICE_ORDER',
      entityType: 'OFFICE_ORDER',
      entityId: String(updated.id),
      userId: currentUser.id,
      bankId: currentUser.username,
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) ${isBill ? 'বিল মেমো' : 'অফিস আদেশ'} সংশোধন করেছেন (সূত্র: ${validated.orderRef})।`
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

    if (currentUser.role !== 'ADMIN') {
      const userCellNames = currentUser.cells?.map((c: any) => c.name) || [];
      if (!order.cellName || !userCellNames.includes(order.cellName)) {
        throw new AuthError('অন্য সেলের জন্য রেকর্ড মুছে ফেলার অনুমতি নেই।', 403, 'forbidden');
      }
    }

    const isBill = order.category?.startsWith('BILL_');

    await logActivity({
      username: currentUser.username,
      action: isBill ? 'DELETE_BILL' : 'DELETE_OFFICE_ORDER',
      entityType: 'OFFICE_ORDER',
      entityId: String(id),
      userId: currentUser.id,
      bankId: currentUser.username,
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) ${isBill ? 'বিল মেমো' : 'অফিস আদেশ'} মুছে ফেলেছেন (সূত্র: ${order.orderRef})।`
    });

    // Soft delete in database: update status to 'Deleted'
    await OfficeOrderRepository.update(id, {
      status: 'Deleted'
    });

    // Insert into trash table for restore support
    await db.insert(trash).values({
      entityType: 'OFFICE_ORDER',
      entityId: id,
      name: `${isBill ? 'বিল মেমো' : 'অফিস আদেশ'} সূত্র: ${order.orderRef}`,
      data: JSON.stringify(order),
      deletedBy: currentUser.username
    });

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
