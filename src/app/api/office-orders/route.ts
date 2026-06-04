import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { officeOrders, duties as dutiesTable, users, employees, userCells, cells } from '@/db/schema';
import { eq, and, inArray, desc, like, not } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { logActivity } from '@/lib/audit';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
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
        ordersList = await db.select().from(officeOrders)
          .where(inArray(officeOrders.cellName, userCellNames))
          .orderBy(desc(officeOrders.createdAt));
      } else {
        ordersList = [];
      }
    } else {
      ordersList = await db.select().from(officeOrders)
        .orderBy(desc(officeOrders.createdAt));
    }

    const orderRefs = ordersList.map((o: any) => o.orderRef);
    let linkedDuties: any[] = [];
    if (orderRefs.length > 0) {
      linkedDuties = await db.select({
        id: dutiesTable.id,
        date: dutiesTable.date,
        orderRef: dutiesTable.orderRef,
        employee: {
          id: employees.id,
          name: employees.name,
          bankId: employees.bankId
        }
      })
      .from(dutiesTable)
      .innerJoin(employees, eq(dutiesTable.employeeId, employees.id))
      .where(inArray(dutiesTable.orderRef, orderRefs));
    }

    const toBanglaDigits = (num: string | number): string => {
      const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit)]);
    };

    const res = ordersList.map((order: any) => {
      let parsedDuties = order.dutiesJson ? JSON.parse(order.dutiesJson) : [];
      
      // Reconstruct datesFormatted retroactively for existing bill memos if missing
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
    return NextResponse.json(res);
  } catch (error: any) {
    console.error('Error fetching office orders:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'ব্যবহারকারী পাওয়া যায়নি।' }, { status: 403 });
    }

    const payload = await request.json();
    const { orderRef, originalOrderRef, orderDate, category, employeeName, cellName, duties, dutyIds, content } = payload;
    
    if (!orderRef || !orderDate || !category || !employeeName) {
      return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 });
    }

    // 0. If we are editing and the reference has changed, delete the old order and unlink its duties first!
    if (originalOrderRef && originalOrderRef !== orderRef) {
      await db.update(dutiesTable)
        .set({ orderRef: null })
        .where(eq(dutiesTable.orderRef, originalOrderRef));
      await db.delete(officeOrders)
        .where(eq(officeOrders.orderRef, originalOrderRef));
    }

    // 1. Reset any existing duties linked to this reference in PostgreSQL
    await db.update(dutiesTable)
        .set({ orderRef: null })
        .where(eq(dutiesTable.orderRef, orderRef));

    // 2. Find or create/update the OfficeOrder in PostgreSQL
    const existing = await db.select().from(officeOrders)
      .where(eq(officeOrders.orderRef, orderRef))
      .limit(1);
    
    let orderRecord = existing[0] || null;
    const existed = !!orderRecord;

    if (!orderRecord) {
      const [inserted] = await db.insert(officeOrders).values({
        orderRef,
        orderDate,
        category,
        employeeName,
        cellName: cellName || null,
        dutiesJson: JSON.stringify(duties),
        contentJson: content ? JSON.stringify(content) : null,
        status: 'Printed'
      }).returning();
      orderRecord = inserted;
    } else {
      const [updated] = await db.update(officeOrders)
        .set({
          orderDate,
          employeeName,
          cellName: cellName || null,
          dutiesJson: JSON.stringify(duties),
          contentJson: content ? JSON.stringify(content) : null,
          status: 'Printed'
        })
        .where(eq(officeOrders.orderRef, orderRef))
        .returning();
      orderRecord = updated;
    }

    // 3. Link newly submitted duties in PostgreSQL
    if (dutyIds && Array.isArray(dutyIds) && dutyIds.length > 0) {
      await db.update(dutiesTable)
        .set({ orderRef: orderRef })
        .where(inArray(dutiesTable.id, dutyIds.map((id: any) => Number(id))));
    }

    const result = { order: orderRecord, existed };

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const isEdit = result.existed || !!originalOrderRef;

    await logActivity({
      username: currentUser.username,
      action: isEdit ? 'UPDATE' : 'CREATE',
      entityType: 'OFFICE_ORDER',
      entityId: String(result.order.id),
      ipAddress,
      userAgent,
      details: `${currentUser.name} (@${currentUser.username}) ${isEdit ? 'অফিস আদেশ বা বিল মেমো সংশোধন' : 'নতুন অফিস আদেশ বা বিল মেমো তৈরি'} করেছেন (সূত্র: ${orderRef})।`
    });

    

    return NextResponse.json({ success: true, id: result.order.id, order: result.order });
  } catch (error: any) {
    console.error('Error creating office order:', error);
    return NextResponse.json({ error: 'internal_error', message: error.message }, { status: 500 });
  }
}
