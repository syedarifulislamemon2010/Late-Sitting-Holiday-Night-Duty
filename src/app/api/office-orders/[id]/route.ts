import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { OfficeOrderService } from '@/services/officeOrder.service';
import { handleApiError, AppError } from '@/lib/errors';
import { officeOrderUpdateSchema } from '@/validations/officeOrder.schema';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    
    if (isNaN(orderId)) {
      throw new AppError('invalid_id', 400, 'invalid_id');
    }

    const user = await getCurrentUser();
    const body = await request.json();

    const validation = officeOrderUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'validation_error',
        message: validation.error.issues[0]?.message || 'অবৈধ অফিস আদেশ ডাটা',
        details: validation.error.format()
      }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await OfficeOrderService.updateOfficeOrder(user, orderId, validation.data, { ipAddress, userAgent });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    
    if (isNaN(orderId)) {
      throw new AppError('invalid_id', 400, 'invalid_id');
    }

    const user = await getCurrentUser();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await OfficeOrderService.deleteOfficeOrder(user, orderId, { ipAddress, userAgent });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
