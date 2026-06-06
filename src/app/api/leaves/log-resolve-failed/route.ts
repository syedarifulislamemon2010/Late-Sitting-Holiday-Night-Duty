import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { logActivity } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await logActivity({
      username: user.username,
      action: 'RESOLVE_PROFILE_FAILED',
      entityType: 'USER',
      ipAddress,
      userAgent,
      details: `User Profile resolution failed for standard user ${user.name} (@${user.username}).`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to log resolve failed activity:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
