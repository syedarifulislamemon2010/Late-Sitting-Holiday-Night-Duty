import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    logger.error('Profile GET API Error:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
