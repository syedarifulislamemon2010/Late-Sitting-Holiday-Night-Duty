import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { ExecutiveService } from '@/services/executive.service';
import { handleApiError, AppError } from '@/lib/errors';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;
    const execId = parseInt(id, 10);
    
    if (isNaN(execId)) {
      throw new AppError('invalid_id', 400, 'invalid_id');
    }

    const body = await request.json();

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const updated = await ExecutiveService.updateExecutive(currentUser, execId, body, { ipAddress, userAgent });
    return NextResponse.json(updated);
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;
    const execId = parseInt(id, 10);
    
    if (isNaN(execId)) {
      throw new AppError('invalid_id', 400, 'invalid_id');
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await ExecutiveService.deleteExecutive(currentUser, execId, { ipAddress, userAgent });
    return NextResponse.json(result);
  } catch (error: any) {
    return handleApiError(error);
  }
}
