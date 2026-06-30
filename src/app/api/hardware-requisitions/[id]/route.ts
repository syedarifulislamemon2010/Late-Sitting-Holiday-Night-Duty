import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { hardwareRequisitions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { handleApiError, AppError } from '@/lib/errors';
import { logActivity } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reqId = parseInt(id, 10);
    if (isNaN(reqId)) {
      throw new AppError('invalid_id', 400, 'আইডি নম্বরটি সঠিক নয়।');
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const requisition = await db.query.hardwareRequisitions.findFirst({
      where: eq(hardwareRequisitions.id, reqId),
      with: {
        items: true,
        requester: {
          columns: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    });

    if (!requisition) {
      throw new AppError('not_found', 404, 'রিকুইজিশন রেকর্ডটি খুঁজে পাওয়া যায়নি।');
    }

    // Auth check: Admin or Requester
    if (user.role !== 'ADMIN' && requisition.requesterUserId !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    return NextResponse.json(requisition);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reqId = parseInt(id, 10);
    if (isNaN(reqId)) {
      throw new AppError('invalid_id', 400, 'আইডি নম্বরটি সঠিক নয়।');
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const requisition = await db.query.hardwareRequisitions.findFirst({
      where: eq(hardwareRequisitions.id, reqId),
    });

    if (!requisition) {
      throw new AppError('not_found', 404, 'রিকুইজিশন রেকর্ডটি খুঁজে পাওয়া যায়নি।');
    }

    // Auth check: Admin or Requester
    if (user.role !== 'ADMIN' && requisition.requesterUserId !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Delete requisition (items will cascade delete due to schema fk)
    await db.delete(hardwareRequisitions).where(eq(hardwareRequisitions.id, reqId));

    // Log audit trail
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: user.username,
      action: 'DELETE_HARDWARE_REQUISITION',
      entityType: 'HARDWARE_REQUISITION',
      entityId: String(reqId),
      userId: user.id,
      bankId: user.username,
      ipAddress,
      userAgent,
      details: `${user.name} (@${user.username}) হার্ডওয়্যার রিকুইজিশন ডিলিট করেছেন (আইডি: ${reqId})।`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
