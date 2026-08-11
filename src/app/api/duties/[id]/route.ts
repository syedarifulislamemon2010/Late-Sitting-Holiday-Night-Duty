import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { DutyService } from '@/services/duty.service';
import { handleApiError, AppError, ConflictError } from '@/lib/errors';
import { explainConflictInBengali } from '@/lib/ai-explainer';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dutyId = parseInt(id, 10);
    
    if (isNaN(dutyId)) {
      throw new AppError('invalid_id', 400, 'invalid_id');
    }

    const user = await getCurrentUser();
    const body = await request.json();

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await DutyService.updateDuty(user, dutyId, body, { ipAddress, userAgent });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ConflictError) {
      const conflictType = error.details?.conflictType || 'DUTY_DUPLICATE';
      const formattedDates = error.details?.dates?.map((d: string) => d.split('-').reverse().join('-'));

      let message = error.message;
      if (!message || message === 'late_sitting_night_shift_conflict' || message === 'leave_conflict' || message === 'duty_conflict' || message === 'conflict') {
        message = await explainConflictInBengali({
          type: conflictType as import('@/lib/ai-explainer').ConflictType,
          employeeName: error.details?.employeeName,
          dates: formattedDates,
          existingLeaveStart: error.details?.existingLeaveStart ? new Date(error.details.existingLeaveStart).toLocaleDateString("bn-BD") : undefined,
          existingLeaveEnd: error.details?.existingLeaveEnd ? new Date(error.details.existingLeaveEnd).toLocaleDateString("bn-BD") : undefined,
          cellName: error.details?.cellName
        });
      }

      return NextResponse.json(
        {
          error: "duty_collision",
          message,
          conflictType,
          conflictingDates: error.details?.dates
        },
        { status: 409 }
      );
    }
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dutyId = parseInt(id, 10);
    
    if (isNaN(dutyId)) {
      throw new AppError('invalid_id', 400, 'invalid_id');
    }

    const user = await getCurrentUser();

    const result = await DutyService.deleteDuty(user, dutyId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
