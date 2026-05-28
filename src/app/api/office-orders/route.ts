import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/audit';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    
    let userCellNames: string[] = [];
    let isUserRestricted = false;

    if (sessionVal) {
      const userId = parseInt(sessionVal, 10);
      if (!isNaN(userId)) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { cells: true }
        });
        if (user && user.role === 'USER') {
          isUserRestricted = true;
          userCellNames = user.cells.map((c: any) => c.name);
        }
      }
    }

    const whereClause = isUserRestricted ? { cellName: { in: userCellNames } } : {};

    const orders = await prisma.officeOrder.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    const orderRefs = orders.map((o: any) => o.orderRef);
    const linkedDuties = await prisma.duty.findMany({
      where: { orderRef: { in: orderRefs } },
      include: { employee: true }
    });

    const toBanglaDigits = (num: string | number): string => {
      const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit)]);
    };

    const res = orders.map((order: any) => {
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
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }
    const currentUserId = parseInt(sessionVal, 10);
    const currentUser = !isNaN(currentUserId)
      ? await prisma.user.findUnique({ where: { id: currentUserId } })
      : null;

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র এডমিন অফিস আদেশ বা বিল মেমো তৈরি ও সংশোধন করতে পারবেন।' }, { status: 403 });
    }

    const payload = await request.json();
    const { orderRef, originalOrderRef, orderDate, category, employeeName, cellName, duties, dutyIds, content } = payload;
    
    if (!orderRef || !orderDate || !category || !employeeName) {
      return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 0. If we are editing and the reference has changed, delete the old order and unlink its duties first!
      if (originalOrderRef && originalOrderRef !== orderRef) {
        await tx.duty.updateMany({
          where: { orderRef: originalOrderRef },
          data: { orderRef: null }
        });
        await tx.officeOrder.deleteMany({
          where: { orderRef: originalOrderRef }
        });
      }

      // 1. Reset any existing duties linked to this reference in PostgreSQL
      await tx.duty.updateMany({
        where: { orderRef: orderRef },
        data: { orderRef: null }
      });

      // 2. Find or create/update the OfficeOrder in PostgreSQL
      let order = await tx.officeOrder.findUnique({
        where: { orderRef: orderRef }
      });
      const existed = !!order;

      if (!order) {
        order = await tx.officeOrder.create({
          data: {
            orderRef,
            orderDate,
            category,
            employeeName,
            cellName: cellName || null,
            dutiesJson: JSON.stringify(duties),
            contentJson: content ? JSON.stringify(content) : null,
            status: 'Printed'
          }
        });
      } else {
        order = await tx.officeOrder.update({
          where: { orderRef: orderRef },
          data: {
            orderDate,
            employeeName,
            cellName: cellName || null,
            dutiesJson: JSON.stringify(duties),
            contentJson: content ? JSON.stringify(content) : null,
            status: 'Printed'
          }
        });
      }

      // 3. Link newly submitted duties in PostgreSQL
      if (dutyIds && Array.isArray(dutyIds) && dutyIds.length > 0) {
        await tx.duty.updateMany({
          where: { id: { in: dutyIds.map((id: any) => Number(id)) } },
          data: { orderRef: orderRef }
        });
      }

      return { order, existed };
    });

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
