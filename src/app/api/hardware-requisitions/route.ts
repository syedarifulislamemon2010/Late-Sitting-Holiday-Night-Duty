import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { hardwareRequisitions, hardwareRequisitionItems, holidays as holidaysTable, users } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { handleApiError, AppError } from '@/lib/errors';
import { isNonWorkingDay } from '@/lib/leave-calculator';
import { logActivity } from '@/lib/audit';
import { hardwareRequisitionCreateSchema } from '@/validations/hardwareRequisition.schema';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterUserId = searchParams.get('userId');

    let conditions = [];

    if (user.role === 'ADMIN') {
      if (filterUserId) {
        conditions.push(eq(hardwareRequisitions.requesterUserId, parseInt(filterUserId, 10)));
      }
    } else {
      // Regular users can only see their own requests
      conditions.push(eq(hardwareRequisitions.requesterUserId, user.id));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db.query.hardwareRequisitions.findMany({
      where: whereClause,
      with: {
        items: true,
        requester: {
          columns: {
            id: true,
            name: true,
            username: true,
          }
        }
      },
      orderBy: [desc(hardwareRequisitions.createdAt)],
    });

    return NextResponse.json(list);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = hardwareRequisitionCreateSchema.parse(body);
    const {
      requisitionDate,
      hardwareType,
      upsAction,
      mode,
      cellName,
      subjectLine,
      items, // array of { officerUserId, officerNameSnapshot, officerDesignationSnapshot, hardwareLabel }
    } = validated;

    // 2. Validate requisition date is not a holiday
    const dbHolidays = await db.select().from(holidaysTable);
    if (isNonWorkingDay(requisitionDate, dbHolidays)) {
      throw new AppError('holiday_requisition_blocked', 400, 'ছুটির দিনে তারিখ নির্বাচন করা যাবে না।');
    }



    // 4. Save requisition in transaction
    const result = await db.transaction(async (tx) => {
      const [requisition] = await tx.insert(hardwareRequisitions).values({
        requesterUserId: user.id,
        cellName,
        hardwareType,
        upsAction,
        subjectLine,
        requisitionDate,
        mode,
        status: 'Submitted',
      }).returning();

      const itemsToInsert = items.map((item, index) => {
        // Serial number in Bengali digits (০১, ০২, ০৩...)
        const serialNo = String(index + 1).padStart(2, '0');
        const bnChars = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
        const bnSerial = serialNo.replace(/\d/g, (d) => bnChars[parseInt(d, 10)]);

        return {
          requisitionId: requisition.id,
          serialNo: bnSerial,
          officerUserId: item.officerUserId || null,
          officerNameSnapshot: item.officerNameSnapshot,
          officerDesignationSnapshot: item.officerDesignationSnapshot,
          hardwareLabel: item.hardwareLabel || (upsAction === 'REPAIR' ? 'ইউপিএস মেরামত' : 'নতুন ইউপিএস সরবরাহ'),
        };
      });

      await tx.insert(hardwareRequisitionItems).values(itemsToInsert);

      return requisition;
    });

    // 5. Log audit trail
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: user.username,
      action: 'CREATE_HARDWARE_REQUISITION',
      entityType: 'HARDWARE_REQUISITION',
      entityId: String(result.id),
      userId: user.id,
      bankId: user.username,
      ipAddress,
      userAgent,
      details: `${user.name} (@${user.username}) নতুন হার্ডওয়্যার রিকুইজিশন তৈরি করেছেন (আইডি: ${result.id}, টাইপ: ${hardwareType}, মোড: ${mode})।`
    });

    return NextResponse.json({ success: true, id: result.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
