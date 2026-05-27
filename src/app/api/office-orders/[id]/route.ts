import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const payload = await request.json();
    const { orderRef, orderDate, employeeName, cellName, status } = payload;

    const existingOrder = await prisma.officeOrder.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (orderRef !== existingOrder.orderRef) {
      const duplicateRef = await prisma.officeOrder.findUnique({
        where: { orderRef }
      });
      if (duplicateRef) {
        return NextResponse.json({ error: 'duplicate_ref', message: 'এই সূত্র নম্বরযুক্ত একটি অফিস আদেশ ইতোমধ্যে আর্কাইভে সংরক্ষিত আছে।' }, { status: 400 });
      }
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Update linked duties references too if the সূত্র changes in PostgreSQL
      if (orderRef !== existingOrder.orderRef) {
        await tx.duty.updateMany({
          where: { orderRef: existingOrder.orderRef },
          data: { orderRef: orderRef }
        });
      }

      const updated = await tx.officeOrder.update({
        where: { id },
        data: {
          orderRef,
          orderDate,
          employeeName,
          cellName: cellName || null,
          status: status || existingOrder.status
        }
      });
      return updated;
    });

    return NextResponse.json({ success: true, order: result });
  } catch (error: any) {
    console.error('Error updating office order:', error);
    return NextResponse.json({ error: 'internal_error', message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const order = await prisma.officeOrder.findUnique({
      where: { id }
    });

    if (!order) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    let baseRef = order.orderRef;
    if (baseRef.endsWith('/বিল')) {
      baseRef = baseRef.slice(0, -5);
    }

    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    let deletedBy: string | null = null;
    if (sessionVal) {
      const userId = parseInt(sessionVal, 10);
      if (!isNaN(userId)) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          deletedBy = user.username;
        }
      }
    }

    await prisma.$transaction(async (tx: any) => {
      // 1. Permanently delete associated duties completely from the database
      await tx.duty.deleteMany({
        where: {
          OR: [
            { orderRef: baseRef },
            { orderRef: order.orderRef }
          ]
        }
      });

      // 2. Save to Trash
      await tx.trash.create({
        data: {
          entityType: 'DOCUMENT',
          entityId: order.id,
          name: `অফিস আদেশ সূত্র: ${order.orderRef}`,
          data: JSON.stringify({
            id: order.id,
            orderRef: order.orderRef,
            orderDate: order.orderDate,
            category: order.category,
            employeeName: order.employeeName,
            cellName: order.cellName,
            dutiesJson: order.dutiesJson,
            contentJson: order.contentJson,
            status: order.status
          }),
          deletedBy
        }
      });

      // 3. Delete office order record
      await tx.officeOrder.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: 'Office order deleted and sent to trash' });
  } catch (error: any) {
    console.error('Error deleting office order:', error);
    return NextResponse.json({ error: 'internal_error', message: error.message }, { status: 500 });
  }
}
