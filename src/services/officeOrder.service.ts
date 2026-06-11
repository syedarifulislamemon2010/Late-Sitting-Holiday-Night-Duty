import { OfficeOrderRepository } from '@/repositories/officeOrder.repository';
import { db } from '@/lib/db';
import { trash, officeOrders, duties, employees } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { AppError, AuthError } from '@/lib/errors';
import { officeOrderCreateSchema, officeOrderUpdateSchema } from '@/validations/officeOrder.schema';

interface UserSession {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
  cells: { id: number; name: string }[];
}

interface OrderDutyInput {
  employeeId?: string | null;
  employeeName: string;
  designation: string;
  days: number;
  apyaonRate: number;
  totalApyaon: number;
  totalTransport: number;
  grandTotal: number;
  datesFormatted?: string;
}

interface OfficeOrderInput {
  orderRef: string;
  originalOrderRef?: string;
  orderDate: string;
  category: string;
  employeeName: string;
  cellName?: string | null;
  duties?: OrderDutyInput[];
  content?: {
    backingOrderRef?: string;
    [key: string]: unknown;
  } | null;
  status?: string;
  dutyIds?: number[];
}

interface OfficeOrderUpdateInput {
  orderRef: string;
  orderDate: string;
  employeeName: string;
  cellName?: string | null;
}

interface OfficeOrderDBRecord {
  id: number;
  orderRef: string;
  orderDate: string;
  category: string;
  employeeName: string;
  cellName: string | null;
  status: string;
  dutiesJson?: string | null;
  contentJson?: string | null;
  createdAt: Date;
}

export class OfficeOrderService {
  static async listOfficeOrders(currentUser: UserSession | null) {
    let userCellNames: string[] = [];
    let isUserRestricted = false;

    if (currentUser) {
      if (currentUser.role === 'USER') {
        isUserRestricted = true;
        userCellNames = currentUser.cells.map((c) => c.name);
      }
    }

    let ordersList: OfficeOrderDBRecord[] = [];
    if (isUserRestricted) {
      if (userCellNames.length > 0) {
        const allowedNames = [...userCellNames, 'All Cells', 'All My Cells', 'IT Department'];
        ordersList = await OfficeOrderRepository.listAll(inArray(officeOrdersCellNameHelper(), allowedNames)) as unknown as OfficeOrderDBRecord[];
      } else {
        ordersList = [];
      }
    } else {
      ordersList = await OfficeOrderRepository.listAll() as unknown as OfficeOrderDBRecord[];
    }

    const orderRefs = ordersList.map((o) => o.orderRef);
    let linkedDuties: { id: number; date: string; orderRef: string | null; employee: { id: number; name: string; bankId: string | null; designation: string } }[] = [];
    if (orderRefs.length > 0) {
      linkedDuties = await db.select({
        id: dutiesIdHelper(),
        date: dutiesDateHelper(),
        orderRef: dutiesOrderRefHelper(),
        employee: {
          id: employeesIdHelper(),
          name: employeesNameHelper(),
          bankId: employeesBankIdHelper(),
          designation: employeesDesignationHelper()
        }
      })
      .from(dutiesTableHelper())
      .innerJoin(employeesTableHelper(), eq(dutiesEmployeeIdHelper(), employeesIdHelper()))
      .where(inArray(dutiesOrderRefHelper(), orderRefs)) as unknown as { id: number; date: string; orderRef: string | null; employee: { id: number; name: string; bankId: string | null; designation: string } }[];
    }

    const toBanglaDigits = (num: string | number): string => {
      const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit)]);
    };

    const res = ordersList.map((order) => {
      let parsedDuties: OrderDutyInput[] = order.dutiesJson ? JSON.parse(order.dutiesJson) : [];
      
      if (order.category.startsWith('BILL_')) {
        if (parsedDuties.length === 0) {
          const matches = linkedDuties.filter((d) => {
            if (!d.orderRef) return false;
            return d.orderRef.replace(/\/বিল$/, '') === order.orderRef.replace(/\/বিল$/, '');
          });
          if (matches.length > 0) {
            const cat = order.category;
            const isHoliday = cat.includes('HOLIDAY');
            const isNight = cat.includes('NIGHT_SHIFT');
            const apyaonRate = isHoliday ? 250 : isNight ? 600 : 100;
            const transportRate = cat.includes('LATE_SITTING') ? 200 : isNight ? 400 : isHoliday ? 250 : 0;

            const groups = new Map<string, {
              employeeId: string;
              employeeName: string;
              designation: string;
              dates: string[];
            }>();

            for (const d of matches) {
              const key = d.employee.bankId || d.employee.name;
              if (!groups.has(key)) {
                groups.set(key, {
                  employeeId: d.employee.bankId || String(d.employee.id),
                  employeeName: d.employee.name,
                  designation: d.employee.designation,
                  dates: []
                });
              }
              groups.get(key)!.dates.push(d.date);
            }

            parsedDuties = Array.from(groups.values()).map(g => {
              const days = g.dates.length;
              const totalApyaon = days * apyaonRate;
              const totalTransport = days * transportRate;
              const grandTotal = totalApyaon + totalTransport;

              const sortedDates = g.dates.sort();
              const formatted = sortedDates.map((dStr) => {
                const [year, month, day] = dStr.split('-');
                return toBanglaDigits(`${day}-${month}-${year}`);
              }).join(', ');

              return {
                employeeId: g.employeeId,
                employeeName: g.employeeName,
                designation: g.designation,
                days,
                apyaonRate,
                totalApyaon,
                totalTransport,
                grandTotal,
                datesFormatted: formatted
              };
            });
          }
        } else {
          parsedDuties = parsedDuties.map((s) => {
            if (!s.datesFormatted) {
              const matches = linkedDuties.filter((d) => {
                if (!d.orderRef) return false;
                return d.orderRef.replace(/\/বিল$/, '') === order.orderRef.replace(/\/বিল$/, '') && 
                (d.employee.bankId === s.employeeId || d.employee.id.toString() === s.employeeId || d.employee.name === s.employeeName);
              });
              if (matches.length > 0) {
                const uniqueDates = Array.from(new Set(matches.map((m) => m.date))).sort();
                const formatted = uniqueDates.map((dStr) => {
                  const [year, month, day] = dStr.split('-');
                  return toBanglaDigits(`${day}-${month}-${year}`);
                }).join(', ');
                return { ...s, datesFormatted: formatted };
              }
            }
            return s;
          });
        }
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

  static async createOfficeOrder(currentUser: UserSession | null, body: OfficeOrderInput, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('ব্যবহারকারী পাওয়া যায়নি।', 403, 'unauthorized');
    }

    const validated = officeOrderCreateSchema.parse(body);

    if (currentUser.role !== 'ADMIN') {
      const userCellNames = currentUser.cells.map((c) => c.name);
      if (validated.cellName !== 'All Cells' && validated.cellName !== 'all' && (!validated.cellName || !userCellNames.includes(validated.cellName))) {
        throw new AuthError('অন্য সেলের জন্য অফিস আদেশ তৈরি করার অনুমতি নেই।', 403, 'forbidden');
      }
    }

    if (validated.category?.startsWith('BILL_')) {
      const backingOrderRef = validated.content?.backingOrderRef;
      if (!backingOrderRef) {
        throw new AppError('বিল সংরক্ষণের জন্য ব্যাকলগ অফিস আদেশ রেফারেন্স প্রয়োজন।', 400, 'backing_order_required');
      }
      const backingOrder = await OfficeOrderRepository.findByOrderRef(backingOrderRef);
      if (!backingOrder || (backingOrder.status !== 'Generated & Printed' && backingOrder.status !== 'Printed' && backingOrder.status !== 'Generated' && backingOrder.status !== 'Modified')) {
        throw new AppError(`বিল তৈরির পূর্বে রেফারেন্সকৃত অফিস আদেশ (${backingOrderRef}) প্রিন্ট অথবা জেনারেটেড অবস্থায় থাকতে হবে।`, 400, 'backing_order_invalid');
      }
    }

    return db.transaction(async (tx) => {
      if (validated.originalOrderRef && validated.originalOrderRef !== validated.orderRef) {
        await OfficeOrderRepository.clearDutiesOrderRef(validated.originalOrderRef, tx);
        await OfficeOrderRepository.deleteByOrderRef(validated.originalOrderRef, tx);
      }

      await OfficeOrderRepository.clearDutiesOrderRef(validated.orderRef, tx);

      const existingOrder = await OfficeOrderRepository.findByOrderRef(validated.orderRef, tx);
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
        orderRecord = await OfficeOrderRepository.create(dataToSave, tx);
      } else {
        orderRecord = await OfficeOrderRepository.updateByOrderRef(validated.orderRef, {
          orderDate: validated.orderDate,
          employeeName: validated.employeeName,
          cellName: validated.cellName || null,
          dutiesJson: validated.duties ? JSON.stringify(validated.duties) : '[]',
          contentJson: validated.content ? JSON.stringify(validated.content) : null,
          status: statusToSave
        }, tx);
      }

      if (validated.dutyIds && validated.dutyIds.length > 0) {
        await OfficeOrderRepository.linkDutiesToOrderRef(
          validated.dutyIds.map(id => Number(id)),
          validated.orderRef,
          tx
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
    });
  }

  static async updateOfficeOrder(currentUser: UserSession | null, id: number, body: OfficeOrderUpdateInput, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('ব্যবহারকারী পাওয়া যায়নি।', 403, 'unauthorized');
    }

    const validated = officeOrderUpdateSchema.parse(body);

    const existingOrder = await OfficeOrderRepository.findById(id);
    if (!existingOrder) {
      throw new AppError('অফিস আদেশ পাওয়া যায়নি।', 404, 'not_found');
    }

    if (currentUser.role !== 'ADMIN') {
      const userCellNames = currentUser.cells?.map((c) => c.name) || [];
      if (existingOrder.cellName !== 'All Cells' && existingOrder.cellName !== 'all' && (!existingOrder.cellName || !userCellNames.includes(existingOrder.cellName))) {
        throw new AuthError('অন্য সেলের জন্য অফিস আদেশ আপডেট করার অনুমতি নেই।', 403, 'forbidden');
      }
    }

    if (validated.orderRef !== existingOrder.orderRef) {
      const duplicateRef = await OfficeOrderRepository.findByOrderRef(validated.orderRef);
      if (duplicateRef) {
        throw new AppError('এই সূত্র নম্বরযুক্ত একটি অফিস আদেশ ইতোমধ্যে আর্কাইভে সংরক্ষিত আছে।', 400, 'duplicate_ref');
      }
    }

    return db.transaction(async (tx) => {
      if (validated.orderRef !== existingOrder.orderRef) {
        await tx.update(dutiesTableHelper())
          .set({ orderRef: validated.orderRef })
          .where(eq(dutiesOrderRefHelper(), existingOrder.orderRef));
      }

      const isBill = existingOrder.category?.startsWith('BILL_');
      const updated = await OfficeOrderRepository.update(id, {
        orderRef: validated.orderRef,
        orderDate: validated.orderDate,
        employeeName: validated.employeeName,
        cellName: validated.cellName || null,
        status: validated.status || 'Modified'
      }, tx);

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
    });
  }

  static async deleteOfficeOrder(currentUser: UserSession | null, id: number, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('ব্যবহারকারী পাওয়া যায়নি।', 403, 'unauthorized');
    }

    const order = await OfficeOrderRepository.findById(id);
    if (!order) {
      throw new AppError('অফিস আদেশ পাওয়া যায়নি।', 404, 'not_found');
    }

    if (currentUser.role !== 'ADMIN') {
      const userCellNames = currentUser.cells?.map((c) => c.name) || [];
      if (order.cellName !== 'All Cells' && order.cellName !== 'all' && (!order.cellName || !userCellNames.includes(order.cellName))) {
        throw new AuthError('অন্য সেলের জন্য রেকর্ড মুছে ফেলার অনুমতি নেই।', 403, 'forbidden');
      }
    }

    const isBill = order.category?.startsWith('BILL_');

    await db.transaction(async (tx) => {
      // Hard delete in database
      await OfficeOrderRepository.delete(id, tx);

      // Free the duties associated with this office order by setting orderRef to null, or restore to original order ref if deleting a bill
      if (order.orderRef) {
        if (order.orderRef.endsWith('/বিল')) {
          const originalOrderRef = order.orderRef.replace(/\/বিল$/, '');
          await tx.update(duties)
            .set({ orderRef: originalOrderRef })
            .where(eq(duties.orderRef, order.orderRef));
        } else {
          await tx.update(duties)
            .set({ orderRef: null })
            .where(eq(duties.orderRef, order.orderRef));
        }
      }

      // Insert into trash table for restore support
      await tx.insert(trash).values({
        entityType: 'OFFICE_ORDER',
        entityId: id,
        name: `${isBill ? 'বিল মেমো' : 'অফিস আদেশ'} সূত্র: ${order.orderRef}`,
        data: JSON.stringify(order),
        deletedBy: currentUser.username
      });

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
    });

    return { success: true };
  }
}

// Helpers for schema referencing
function officeOrdersCellNameHelper() {
  return officeOrders.cellName;
}
function dutiesTableHelper() {
  return duties;
}
function dutiesIdHelper() {
  return duties.id;
}
function dutiesDateHelper() {
  return duties.date;
}
function dutiesOrderRefHelper() {
  return duties.orderRef;
}
function dutiesEmployeeIdHelper() {
  return duties.employeeId;
}
function employeesTableHelper() {
  return employees;
}
function employeesIdHelper() {
  return employees.id;
}
function employeesNameHelper() {
  return employees.name;
}
function employeesBankIdHelper() {
  return employees.bankId;
}
function employeesDesignationHelper() {
  return employees.designation;
}
