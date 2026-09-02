import { OfficeOrderRepository } from '@/repositories/officeOrder.repository';
import { db } from '@/lib/db';
import { trash, officeOrders, duties, employees, cells } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { AppError, AuthError } from '@/lib/errors';
import { officeOrderCreateSchema, officeOrderUpdateSchema } from '@/validations/officeOrder.schema';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { sortDatesDescending, sortDatesStringDescending } from '@/lib/print-helpers';

interface UserSession {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER' | 'EMPLOYEE';
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
  originalOrderRef?: string | null;
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
      if (currentUser.role !== 'ADMIN') {
        isUserRestricted = true;
        userCellNames = currentUser.cells ? currentUser.cells.map((c) => c.name) : [];
      }
    }

    // Always load all orders first to filter them in memory using their linked duties' cells
    const ordersList = await OfficeOrderRepository.listAll() as unknown as OfficeOrderDBRecord[];

    const orderRefs = ordersList.map((o) => o.orderRef);
    let linkedDuties: { id: number; date: string; orderRef: string | null; employee: { id: number; name: string; bankId: string | null; designation: string; cellName: string } }[] = [];
    if (orderRefs.length > 0) {
      linkedDuties = await db.select({
        id: dutiesIdHelper(),
        date: dutiesDateHelper(),
        orderRef: dutiesOrderRefHelper(),
        employee: {
          id: employeesIdHelper(),
          name: employeesNameHelper(),
          bankId: employeesBankIdHelper(),
          designation: employeesDesignationHelper(),
          cellName: cells.name
        }
      })
      .from(dutiesTableHelper())
      .innerJoin(employeesTableHelper(), eq(dutiesEmployeeIdHelper(), employeesIdHelper()))
      .innerJoin(cells, eq(employees.cellId, cells.id))
      .where(inArray(dutiesOrderRefHelper(), orderRefs)) as unknown as { id: number; date: string; orderRef: string | null; employee: { id: number; name: string; bankId: string | null; designation: string; cellName: string } }[];
    }

    // Fetch all employees and their cellNames to use as a fallback when database duties are missing
    const allEmps = await db.select({
      id: employeesIdHelper(),
      bankId: employeesBankIdHelper(),
      name: employeesNameHelper(),
      cellName: cells.name
    })
    .from(employeesTableHelper())
    .innerJoin(cells, eq(employees.cellId, cells.id));

    const findCellNameForEmp = (s: { employeeId?: string | number, employeeName?: string }): string | null => {
      const match = allEmps.find((e) => {
        if (s.employeeId) {
          const sEmpIdStr = s.employeeId.toString().trim();
          if (e.bankId && e.bankId.trim() === sEmpIdStr) return true;
          if (e.id.toString() === sEmpIdStr) return true;
        }
        if (s.employeeName && e.name) {
          if (e.name.trim() === s.employeeName.trim()) return true;
          if (e.name.replace(/^জনাব\s+/, '').trim() === s.employeeName.replace(/^জনাব\s+/, '').trim()) return true;
        }
        return false;
      });
      return match ? match.cellName : null;
    };

    const res = ordersList.map((order) => {
      let parsedDuties: import('@/types/app').DutyRecord[] = order.dutiesJson ? JSON.parse(order.dutiesJson) : [];
      
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
              cellName: string;
              dates: string[];
            }>();

            for (const d of matches) {
              const key = d.employee.bankId || d.employee.name;
              if (!groups.has(key)) {
                groups.set(key, {
                  employeeId: d.employee.bankId || String(d.employee.id),
                  employeeName: d.employee.name,
                  designation: d.employee.designation,
                  cellName: d.employee.cellName,
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

              const sortedDates = [...g.dates].sort((a, b) => b.localeCompare(a));
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
                datesFormatted: formatted,
                cellName: g.cellName
              };
            });
          }
        } else {
          parsedDuties = parsedDuties.map((s) => {
            const matches = linkedDuties.filter((d) => {
              if (!d.orderRef) return false;
              return d.orderRef.replace(/\/বিল$/, '') === order.orderRef.replace(/\/বিল$/, '') && 
              (d.employee.bankId === s.employeeId || d.employee.id.toString() === s.employeeId || d.employee.name === s.employeeName);
            });
            const cellName = (matches.length > 0 ? matches[0].employee.cellName : null) || findCellNameForEmp(s);

            if (!s.datesFormatted && matches.length > 0) {
              const uniqueDates = Array.from(new Set(matches.map((m) => m.date))).sort((a, b) => b.localeCompare(a));
              const formatted = uniqueDates.map((dStr) => {
                const [year, month, day] = dStr.split('-');
                return toBanglaDigits(`${day}-${month}-${year}`);
              }).join(', ');
              return { ...s, datesFormatted: formatted, cellName };
            }
            if (typeof s.datesFormatted === 'string') {
              return { ...s, datesFormatted: sortDatesStringDescending(s.datesFormatted), cellName };
            }
            return { ...s, cellName };
          });
        }
      } else {
        // For standard office orders, also map cellName to each duty and ensure descending dates
        parsedDuties = parsedDuties.map((s) => {
          const matches = linkedDuties.filter((d) => {
            if (!d.orderRef) return false;
            return d.orderRef.replace(/\/বিল$/, '') === order.orderRef.replace(/\/বিল$/, '') && 
            (d.employee.bankId === s.employeeId || d.employee.id.toString() === s.employeeId || d.employee.name === s.employeeName);
          });
          const cellName = (matches.length > 0 ? matches[0].employee.cellName : null) || findCellNameForEmp(s);
          const updatedDuty: Record<string, unknown> = { ...s, cellName };
          if (typeof s.datesFormatted === 'string') {
            updatedDuty.datesFormatted = sortDatesStringDescending(s.datesFormatted);
          }
          if (Array.isArray(s.dates)) {
            updatedDuty.dates = sortDatesDescending(s.dates as string[]);
          }
          return updatedDuty;
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

    if (isUserRestricted) {
      return res.filter(order => {
        // 1. Direct cell name match on the office order record itself
        if (order.cellName && userCellNames.includes(order.cellName)) {
          return true;
        }

        // 2. Overlap check: Check if any duty linked to this order belongs to an employee in one of the user's cells
        const hasOverlap = order.duties && Array.isArray(order.duties) && order.duties.some((d: import('@/types/app').DutyRecord) => d.cellName && userCellNames.includes(d.cellName));

        return hasOverlap;
      });
    }

    return res;
  }

  static async createOfficeOrder(currentUser: UserSession | null, body: OfficeOrderInput, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('ব্যবহারকারী পাওয়া যায়নি।', 403, 'unauthorized');
    }

    const validated = officeOrderCreateSchema.parse(body);

    if (currentUser.role !== 'ADMIN') {
      let allowedCellNames = currentUser.cells.map((c) => c.name);
      if (allowedCellNames.includes('CBS Integrated Development Cell')) {
        allowedCellNames = [];
      } else {
        allowedCellNames = Array.from(new Set([...allowedCellNames, 'CBS Integrated Development Cell']));
      }
      if (allowedCellNames.length > 0 && validated.cellName !== 'All Cells' && validated.cellName !== 'all' && (!validated.cellName || !allowedCellNames.includes(validated.cellName))) {
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
      const isBill = validated.category?.startsWith('BILL_');
      const client = tx || db;

      if (validated.originalOrderRef && validated.originalOrderRef !== validated.orderRef) {
        await OfficeOrderRepository.clearDutiesOrderRef(validated.originalOrderRef, client);
        await OfficeOrderRepository.deleteByOrderRef(validated.originalOrderRef, client);

        // Propagate orderRef rename to the matching paired record (OfficeOrder <-> Bill)
        if (!isBill) {
          const oldBillRef = validated.originalOrderRef + '/বিল';
          const newBillRef = validated.orderRef + '/বিল';
          const associatedBill = await client.select().from(officeOrders).where(eq(officeOrders.orderRef, oldBillRef));
          if (associatedBill.length > 0) {
            await client.update(officeOrders)
              .set({ 
                orderRef: newBillRef,
                employeeName: validated.employeeName,
                orderDate: validated.orderDate
              })
              .where(eq(officeOrders.id, associatedBill[0].id));
            await client.update(dutiesTableHelper())
              .set({ orderRef: newBillRef })
              .where(eq(dutiesOrderRefHelper(), oldBillRef));
          }
        } else {
          const oldOrderRef = validated.originalOrderRef.replace(/\/বিল$/, '');
          const newOrderRef = validated.orderRef.replace(/\/বিল$/, '');
          const associatedOrder = await client.select().from(officeOrders).where(eq(officeOrders.orderRef, oldOrderRef));
          if (associatedOrder.length > 0) {
            await client.update(officeOrders)
              .set({ 
                orderRef: newOrderRef,
                employeeName: validated.employeeName,
                orderDate: validated.orderDate
              })
              .where(eq(officeOrders.id, associatedOrder[0].id));
            await client.update(dutiesTableHelper())
              .set({ orderRef: newOrderRef })
              .where(eq(dutiesOrderRefHelper(), oldOrderRef));
          }
        }
      } else {
        // If not renamed but payee (employeeName) or date is updated, sync it to the paired record
        if (!isBill) {
          const billRef = validated.orderRef + '/বিল';
          const associatedBill = await client.select().from(officeOrders).where(eq(officeOrders.orderRef, billRef));
          if (associatedBill.length > 0) {
            await client.update(officeOrders)
              .set({ 
                employeeName: validated.employeeName,
                orderDate: validated.orderDate
              })
              .where(eq(officeOrders.id, associatedBill[0].id));
          }
        } else {
          const orderRef = validated.orderRef.replace(/\/বিল$/, '');
          const associatedOrder = await client.select().from(officeOrders).where(eq(officeOrders.orderRef, orderRef));
          if (associatedOrder.length > 0) {
            await client.update(officeOrders)
              .set({ 
                employeeName: validated.employeeName,
                orderDate: validated.orderDate
              })
              .where(eq(officeOrders.id, associatedOrder[0].id));
          }
        }
      }

      await OfficeOrderRepository.clearDutiesOrderRef(validated.orderRef, client);

      const existingOrder = await OfficeOrderRepository.findByOrderRef(validated.orderRef, client);
      let orderRecord = existingOrder;
      const existed = !!existingOrder || !!validated.originalOrderRef;

      const statusToSave = validated.status || (existed ? 'Modified' : 'Generated');

      const normalizedDuties = validated.duties ? validated.duties.map((d: Record<string, unknown>) => {
        const item = { ...d };
        if (typeof item.datesFormatted === 'string') {
          item.datesFormatted = sortDatesStringDescending(item.datesFormatted);
        }
        if (Array.isArray(item.dates)) {
          item.dates = sortDatesDescending(item.dates as string[]);
        }
        return item;
      }) : [];

      const dutiesJsonString = JSON.stringify(normalizedDuties);

      const dataToSave = {
        orderRef: validated.orderRef,
        orderDate: validated.orderDate,
        category: validated.category,
        employeeName: validated.employeeName,
        cellName: validated.cellName || null,
        dutiesJson: dutiesJsonString,
        contentJson: validated.content ? JSON.stringify(validated.content) : null,
        status: statusToSave
      };

      if (!orderRecord) {
        orderRecord = await OfficeOrderRepository.create(dataToSave, client);
      } else {
        orderRecord = await OfficeOrderRepository.updateByOrderRef(validated.orderRef, {
          orderDate: validated.orderDate,
          employeeName: validated.employeeName,
          cellName: validated.cellName || null,
          dutiesJson: dutiesJsonString,
          contentJson: validated.content ? JSON.stringify(validated.content) : null,
          status: statusToSave
        }, client);
      }

      if (validated.dutyIds && validated.dutyIds.length > 0) {
        await OfficeOrderRepository.linkDutiesToOrderRef(
          validated.dutyIds.map(id => Number(id)),
          validated.orderRef,
          client
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
      let hasAccess = false;
      if (existingOrder.cellName && userCellNames.includes(existingOrder.cellName)) {
        hasAccess = true;
      } else {
        const cleanRef = existingOrder.orderRef.replace(/\/বিল$/, '');
        const dutiesForOrder = await db.select({
          cellName: cells.name
        })
        .from(duties)
        .innerJoin(employees, eq(duties.employeeId, employees.id))
        .innerJoin(cells, eq(employees.cellId, cells.id))
        .where(inArray(duties.orderRef, [existingOrder.orderRef, cleanRef]));
        
        hasAccess = dutiesForOrder.some(d => userCellNames.includes(d.cellName));

        if (!hasAccess) {
          const backingOrder = await db.select().from(officeOrders).where(eq(officeOrders.orderRef, cleanRef)).limit(1);
          if (backingOrder[0]?.cellName && userCellNames.includes(backingOrder[0].cellName)) {
            hasAccess = true;
          }
        }
      }

      if (!hasAccess) {
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
      const isBill = existingOrder.category?.startsWith('BILL_');
      const client = tx || db;

      if (validated.orderRef !== existingOrder.orderRef) {
        // Renaming orderRef, sync both orderRef and other details
        if (!isBill) {
          const oldBillRef = existingOrder.orderRef + '/বিল';
          const newBillRef = validated.orderRef + '/বিল';
          const associatedBill = await client.select().from(officeOrders).where(eq(officeOrders.orderRef, oldBillRef));
          if (associatedBill.length > 0) {
            await client.update(officeOrders)
              .set({
                orderRef: newBillRef,
                employeeName: validated.employeeName,
                orderDate: validated.orderDate
              })
              .where(eq(officeOrders.id, associatedBill[0].id));
          }
          await client.update(dutiesTableHelper())
            .set({ orderRef: newBillRef })
            .where(eq(dutiesOrderRefHelper(), oldBillRef));
          await client.update(dutiesTableHelper())
            .set({ orderRef: validated.orderRef })
            .where(eq(dutiesOrderRefHelper(), existingOrder.orderRef));
        } else {
          const oldOrderRef = existingOrder.orderRef.replace(/\/বিল$/, '');
          const newOrderRef = validated.orderRef.replace(/\/বিল$/, '');
          const associatedOrder = await client.select().from(officeOrders).where(eq(officeOrders.orderRef, oldOrderRef));
          if (associatedOrder.length > 0) {
            await client.update(officeOrders)
              .set({
                orderRef: newOrderRef,
                employeeName: validated.employeeName,
                orderDate: validated.orderDate
              })
              .where(eq(officeOrders.id, associatedOrder[0].id));
          }
          await client.update(dutiesTableHelper())
            .set({ orderRef: newOrderRef })
            .where(eq(dutiesOrderRefHelper(), oldOrderRef));
          await client.update(dutiesTableHelper())
            .set({ orderRef: validated.orderRef })
            .where(eq(dutiesOrderRefHelper(), existingOrder.orderRef));
        }
      } else {
        // Not renaming, but payee (employeeName) or date is updated, sync to paired record
        if (!isBill) {
          const billRef = validated.orderRef + '/বিল';
          const associatedBill = await client.select().from(officeOrders).where(eq(officeOrders.orderRef, billRef));
          if (associatedBill.length > 0) {
            await client.update(officeOrders)
              .set({
                employeeName: validated.employeeName,
                orderDate: validated.orderDate
              })
              .where(eq(officeOrders.id, associatedBill[0].id));
          }
        } else {
          const orderRef = validated.orderRef.replace(/\/বিল$/, '');
          const associatedOrder = await client.select().from(officeOrders).where(eq(officeOrders.orderRef, orderRef));
          if (associatedOrder.length > 0) {
            await client.update(officeOrders)
              .set({
                employeeName: validated.employeeName,
                orderDate: validated.orderDate
              })
              .where(eq(officeOrders.id, associatedOrder[0].id));
          }
        }
      }

      const updated = await OfficeOrderRepository.update(id, {
        orderRef: validated.orderRef,
        orderDate: validated.orderDate,
        employeeName: validated.employeeName,
        cellName: validated.cellName || null,
        status: validated.status || 'Modified'
      }, client);

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
      let hasAccess = false;
      if (order.cellName && userCellNames.includes(order.cellName)) {
        hasAccess = true;
      } else {
        const dutiesForOrder = await db.select({
          cellName: cells.name
        })
        .from(duties)
        .innerJoin(employees, eq(duties.employeeId, employees.id))
        .innerJoin(cells, eq(employees.cellId, cells.id))
        .where(eq(duties.orderRef, order.orderRef));
        
        hasAccess = dutiesForOrder.some(d => userCellNames.includes(d.cellName));
      }

      if (!hasAccess) {
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
