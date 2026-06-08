import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { DutyService } from '@/services/duty.service';
import { handleApiError } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cellId = searchParams.get('cellId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const orderRef = searchParams.get('orderRef');
    const employeeId = searchParams.get('employeeId');
    const type = searchParams.get('type');

    const user = await getCurrentUser();

    const result = await DutyService.listDuties(user, {
      cellId,
      startDate,
      endDate,
      orderRef,
      employeeId,
      type
    });
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

    const result = await DutyService.createDuties(user, body, { ipAddress, userAgent });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
