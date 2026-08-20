import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { OfficeOrderService } from '@/services/officeOrder.service';
import { handleApiError } from '@/lib/errors';
import { officeOrderCreateSchema } from '@/validations/officeOrder.schema';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const result = await OfficeOrderService.listOfficeOrders(user);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const validation = officeOrderCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'validation_error',
        message: validation.error.issues[0]?.message || 'অবৈধ অফিস আদেশ ডাটা',
        details: validation.error.format()
      }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await OfficeOrderService.createOfficeOrder(user, validation.data, { ipAddress, userAgent });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
