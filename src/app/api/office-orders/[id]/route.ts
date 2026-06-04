import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { officeOrders, duties as dutiesTable, trash } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { logActivity } from '@/lib/audit';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized', message: 'ব্যবহারকারী পাওয়া যায়নি।' }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const payload = await request.json();
    const { orderRef, orderDate, employeeName, cellName, status } = payload;

    const existingOrderResult = await db.select().from(officeOrders)
      .where(eq(officeOrders.id, id))
      .limit(1);
    const existingOrder = existingOrderResult[0] || null;

    if (!existingOrder) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (orderRef !== existingOrder.orderRef) {
      const duplicateRefResult = await db.select().from(officeOrders)
        .where(eq(officeOrders.orderRef, orderRef))
        .limit(1);
      if (duplicateRefResult.length > 0) {
        return NextResponse.json({ error: 'duplicate_ref', message: 'এই সূত্র নম্বরযুক্ত একটি অফিস আদেশ ইতোমধ্যে আর্কাইভে সংরক্ষিত আছে।' }, { status: 400 });
      }
    }

    const result = await db.transaction(async (tx) => {
      // Update linked duties references too if the সূত্র changes in PostgreSQL
      if (orderRef !== existingOrder.orderRef) {
        await tx.update(dutiesTable)
          .set({ orderRef: orderRef })
          .where(eq(dutiesTable.orderRef, existingOrder.orderRef));
      }

      const [updated] = await tx.update(officeOrders)
        .set({
          orderRef,
          orderDate,
          employeeName,
          cellName: cellName || null,
          status: status || existingOrder.status
        })
        .where(eq(officeOrders.id, id))
        .returning();
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized', message: 'ব্যবহারকারী পাওয়া যায়নি।' }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const orderResult = await db.select().from(officeOrders)
      .where(eq(officeOrders.id, id))
      .limit(1);
    const order = orderResult[0] || null;

    if (!order) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    let baseRef = order.orderRef;
    if (baseRef.endsWith('/বিল')) {
      baseRef = baseRef.slice(0, -5);
    }

    let deletedBy: string | null = user ? user.username : null;

    await db.transaction(async (tx) => {
      // 1. Permanently delete associated duties completely from the database
      await tx.delete(dutiesTable)
        .where(
          or(
            eq(dutiesTable.orderRef, baseRef),
            eq(dutiesTable.orderRef, order.orderRef)
          )
        );

      // 2. Save to Trash
      await tx.insert(trash).values({
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
      });

      // 3. Delete office order record
      await tx.delete(officeOrders)
        .where(eq(officeOrders.id, id));
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
