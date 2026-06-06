import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { ExecutiveService } from '@/services/executive.service';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const execs = await ExecutiveService.listExecutives(currentUser);
    return NextResponse.json(execs);
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const created = await ExecutiveService.createExecutive(currentUser, body, { ipAddress, userAgent });
    return NextResponse.json(created);
  } catch (error: any) {
    return handleApiError(error);
  }
}
