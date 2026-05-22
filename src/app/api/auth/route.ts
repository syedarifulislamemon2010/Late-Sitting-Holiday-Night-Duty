import { NextResponse } from 'next/server';

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
      if (username === 'admin' && password === '123456') {
        const response = NextResponse.json({ success: true, message: 'Authenticated successfully' });
        response.cookies.set('session', 'active', {
          path: '/',
          maxAge: 60 * 60 * 24, // 1 day
          sameSite: 'lax',
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

export async function GET(request: Request) {
  const session = request.headers.get('cookie')?.includes('session=active');
  return NextResponse.json({ authenticated: !!session });
}
