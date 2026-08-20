import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { ExecutiveService } from '@/services/executive.service';
import { handleApiError } from '@/lib/errors';
import { executiveCreateSchema } from '@/validations/executive.schema';

export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const execs = await ExecutiveService.listExecutives(currentUser);
    return NextResponse.json(execs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    const validation = executiveCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'validation_error',
        message: validation.error.issues[0]?.message || 'অবৈধ ইনপুট ডাটা',
        details: validation.error.format()
      }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const created = await ExecutiveService.createExecutive(currentUser, validation.data, { ipAddress, userAgent });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
