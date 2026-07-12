import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { tazCommitteeForms, holidays as holidaysTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { handleApiError, AppError } from '@/lib/errors';
import { isNonWorkingDay } from '@/lib/leave-calculator';
import { logActivity } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formId = parseInt(id, 10);
    if (isNaN(formId)) {
      throw new AppError('invalid_id', 400, 'আইডি নম্বরটি সঠিক নয়।');
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const form = await db.query.tazCommitteeForms.findFirst({
      where: eq(tazCommitteeForms.id, formId),
      with: {
        requester: {
          columns: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    });

    if (!form) {
      throw new AppError('not_found', 404, 'TAZ কমিটি ফরম রেকর্ডটি খুঁজে পাওয়া যায়নি।');
    }

    // Auth check: Admin or Requester
    if (user.role !== 'ADMIN' && form.requesterUserId !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    return NextResponse.json(form);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formId = parseInt(id, 10);
    if (isNaN(formId)) {
      throw new AppError('invalid_id', 400, 'আইডি নম্বরটি সঠিক নয়।');
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const existingForm = await db.query.tazCommitteeForms.findFirst({
      where: eq(tazCommitteeForms.id, formId),
    });

    if (!existingForm) {
      throw new AppError('not_found', 404, 'TAZ কমিটি ফরম রেকর্ডটি খুঁজে পাওয়া যায়নি।');
    }

    // Auth check: Admin or Requester
    if (user.role !== 'ADMIN' && existingForm.requesterUserId !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
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

    // 3. Update in database
    const [updatedForm] = await db.update(tazCommitteeForms).set({
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
      updatedAt: new Date(),
    }).where(eq(tazCommitteeForms.id, formId)).returning();

    // 4. Log activity
    await logActivity({
      username: user.username,
      action: 'UPDATE_TAZ_COMMITTEE_FORM',
      entityType: 'TAZ_COMMITTEE_FORM',
      entityId: String(formId),
      details: `Updated TAZ Committee Form (ID: ${formId}) for date ${formDate}. Ref: ${ref || 'N/A'}`
    });

    return NextResponse.json(updatedForm);
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
    const formId = parseInt(id, 10);
    if (isNaN(formId)) {
      throw new AppError('invalid_id', 400, 'আইডি নম্বরটি সঠিক নয়।');
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const form = await db.query.tazCommitteeForms.findFirst({
      where: eq(tazCommitteeForms.id, formId),
    });

    if (!form) {
      throw new AppError('not_found', 404, 'TAZ কমিটি ফরম রেকর্ডটি খুঁজে পাওয়া যায়নি।');
    }

    // Auth check: Admin or Requester
    if (user.role !== 'ADMIN' && form.requesterUserId !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Delete form
    await db.delete(tazCommitteeForms).where(eq(tazCommitteeForms.id, formId));

    // Log activity
    await logActivity({
      username: user.username,
      action: 'DELETE_TAZ_COMMITTEE_FORM',
      entityType: 'TAZ_COMMITTEE_FORM',
      entityId: String(formId),
      details: `Deleted TAZ Committee Form (ID: ${formId}). Ref: ${form.ref || 'N/A'}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
