import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const { action, username, password } = await request.json();

    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
      response.cookies.set('session', '', {
        path: '/',
        maxAge: -1,
      });
      return response;
    }

    if (action === 'login') {
      if (!username || !password) {
        return NextResponse.json({ error: 'bad_request', message: 'ইউজারনেম ও পাসওয়ার্ড আবশ্যক!' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { username: username.trim() }
      });

      if (user && user.password === password) {
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        
        await logActivity({
          username: user.username,
          action: 'LOGIN',
          entityType: 'USER',
          entityId: String(user.id),
          ipAddress,
          userAgent,
          details: `${user.name} (@${user.username}) সিস্টেমে সফলভাবে লগইন করেছেন।`
        });

        const response = NextResponse.json({ 
          success: true, 
          message: 'Authenticated successfully',
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            mobile: user.mobile
          }
        });
        
        response.cookies.set('session', String(user.id), {
          path: '/',
          maxAge: 60 * 60 * 24, // 1 day
          sameSite: 'lax',
          httpOnly: false, // accessible via document.cookie for client checking
        });
        return response;
      } else {
        return NextResponse.json({ error: 'invalid_credentials', message: 'ভুল ইউজারনেম বা পাসওয়ার্ড!' }, { status: 401 });
      }
    }

    return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
  } catch (error: any) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;

    if (!sessionVal) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const userId = parseInt(sessionVal, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        mobile: true,
        cells: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (error: any) {
    console.error('Auth GET Error:', error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
