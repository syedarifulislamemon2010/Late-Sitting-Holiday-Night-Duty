import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { LeaveService } from '@/services/leave.service';
import { handleApiError, AppError } from '@/lib/errors';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaveId = parseInt(id, 10);
    
    if (isNaN(leaveId)) {
      throw new AppError('invalid_id', 400, 'invalid_id');
    }

    const user = await getCurrentUser();
    const body = await request.json();

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await LeaveService.updateLeave(user, leaveId, body, { ipAddress, userAgent });
    return NextResponse.json(result);
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
    const leaveId = parseInt(id, 10);
    
    if (isNaN(leaveId)) {
      throw new AppError('invalid_id', 400, 'invalid_id');
    }

    const user = await getCurrentUser();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await LeaveService.deleteLeave(user, leaveId, { ipAddress, userAgent });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
