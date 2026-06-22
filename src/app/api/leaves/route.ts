import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { LeaveService } from '@/services/leave.service';
import { handleApiError, ConflictError } from '@/lib/errors';
import { explainConflictInBengali } from '@/lib/ai-explainer';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const latest = searchParams.get('latest') === 'true';
    const filterBankId = searchParams.get('bankId');

    const result = await LeaveService.listLeaves(user, { latest, bankId: filterBankId });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await LeaveService.createLeave(user, body, { ipAddress, userAgent });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ConflictError) {
      const conflictType = error.details?.conflictType || 'LEAVE_OVERLAP';
      const formattedDates = error.details?.dates?.map((d: string) => d.split('-').reverse().join('-'));

      const bengaliExplanation = await explainConflictInBengali({
        type: conflictType,
        employeeName: error.details?.employeeName,
        dates: formattedDates,
        existingLeaveStart: error.details?.existingLeaveStart ? new Date(error.details.existingLeaveStart).toLocaleDateString("bn-BD") : undefined,
        existingLeaveEnd: error.details?.existingLeaveEnd ? new Date(error.details.existingLeaveEnd).toLocaleDateString("bn-BD") : undefined,
        cellName: error.details?.cellName
      });

      return NextResponse.json(
        {
          error: "leave_collision",
          message: bengaliExplanation,
          conflictType
        },
        { status: 409 }
      );
    }
    return handleApiError(error);
  }
}
