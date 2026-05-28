import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/audit';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }
    const userId = parseInt(sessionVal, 10);
    const user = !isNaN(userId) ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র অ্যাডমিন পরিবর্তন করতে পারবেন।' }, { status: 403 });
    }

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

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: user.username,
      action: 'UPDATE',
      entityType: 'OFFICE_ORDER',
      entityId: String(result.id),
      ipAddress,
      userAgent,
      details: `${user.name} (@${user.username}) অফিস আদেশ বা বিল মেমো সংশোধন করেছেন (সূত্র: ${orderRef})।`
    });

    return NextResponse.json({ success: true, order: result });
  } catch (error: any) {
    console.error('Error updating office order:', error);
    return NextResponse.json({ error: 'internal_error', message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }
    const userId = parseInt(sessionVal, 10);
    const user = !isNaN(userId) ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র অ্যাডমিন মুছে ফেলতে পারবেন।' }, { status: 403 });
    }

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

    let deletedBy: string | null = user ? user.username : null;

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

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: user.username,
      action: 'DELETE',
      entityType: 'OFFICE_ORDER',
      entityId: String(id),
      ipAddress,
      userAgent,
      details: `${user.name} (@${user.username}) অফিস আদেশ বা বিল মেমো মুছে ফেলেছেন এবং ট্র্যাশে পাঠিয়েছেন (সূত্র: ${order.orderRef})।`
    });

    return NextResponse.json({ success: true, message: 'Office order deleted and sent to trash' });
  } catch (error: any) {
    console.error('Error deleting office order:', error);
    return NextResponse.json({ error: 'internal_error', message: error.message }, { status: 500 });
  }
}
