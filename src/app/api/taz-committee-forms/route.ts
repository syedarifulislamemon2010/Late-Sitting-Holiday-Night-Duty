import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { tazCommitteeForms, holidays as holidaysTable } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { handleApiError, AppError } from '@/lib/errors';
import { isNonWorkingDay } from '@/lib/leave-calculator';
import { logActivity } from '@/lib/audit';

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
        conditions.push(eq(tazCommitteeForms.requesterUserId, parseInt(filterUserId, 10)));
      }
    } else {
      conditions.push(eq(tazCommitteeForms.requesterUserId, user.id));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db.query.tazCommitteeForms.findMany({
      where: whereClause,
      with: {
        requester: {
          columns: {
            id: true,
            name: true,
            username: true,
          }
        }
      },
      orderBy: [desc(tazCommitteeForms.createdAt)],
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
    const {
      formDate,
      ref,
      pacsId,
      title,
      purpose,
      applicationName,
      routineDetails,
      subroutineDetails,
      versionInfo,
      needBackendAccess,
      needCoreFtpAccess,
      needBrowserAccess,
      browserPortChange,
      duringTxHour,
      numTeamMembers,
      approxScheduleStart,
      approxScheduleEnd,
      execScheduleStart,
      execScheduleEnd,
      impact,
      requesterName,
      requesterDesignation,
      requesterOrganization,
      implementersJson,
    } = body;

    // 1. Basic validation
    if (!formDate || !implementersJson) {
      throw new AppError('missing_required_fields', 400, 'প্রয়োজনীয় তথ্য প্রদান করা হয়নি।');
    }

    // 2. Validate form date is not a holiday/weekend
    const dbHolidays = await db.select().from(holidaysTable);
    if (isNonWorkingDay(formDate, dbHolidays)) {
      throw new AppError('holiday_form_blocked', 400, 'ছুটির দিনে তারিখ নির্বাচন করা যাবে না।');
    }

    // 3. Save TAZ committee form
    const [newForm] = await db.insert(tazCommitteeForms).values({
      requesterUserId: user.id,
      formDate,
      ref: ref || '',
      pacsId: pacsId || '',
      title: title || '',
      purpose: purpose || '',
      applicationName: applicationName || '',
      routineDetails: routineDetails || '',
      subroutineDetails: subroutineDetails || '',
      versionInfo: versionInfo || '',
      needBackendAccess: needBackendAccess || 'No',
      needCoreFtpAccess: needCoreFtpAccess || 'No',
      needBrowserAccess: needBrowserAccess || 'No',
      browserPortChange: browserPortChange || 'No',
      duringTxHour: duringTxHour || 'No',
      numTeamMembers: numTeamMembers || 1,
      approxScheduleStart: approxScheduleStart || '',
      approxScheduleEnd: approxScheduleEnd || '',
      execScheduleStart: execScheduleStart || '',
      execScheduleEnd: execScheduleEnd || '',
      impact: impact || '',
      requesterName: requesterName || '',
      requesterDesignation: requesterDesignation || '',
      requesterOrganization: requesterOrganization || '',
      implementersJson: implementersJson,
    }).returning();

    // 4. Log activity
    await logActivity({
      username: user.username,
      action: 'CREATE_TAZ_COMMITTEE_FORM',
      entityType: 'TAZ_COMMITTEE_FORM',
      entityId: String(newForm.id),
      details: `Created TAZ Committee Form for date ${formDate}. Ref: ${ref || 'N/A'}`
    });

    return NextResponse.json(newForm);
  } catch (error) {
    return handleApiError(error);
  }
}
