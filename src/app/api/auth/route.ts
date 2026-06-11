import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users, employees, userCells, cells } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { signSession, verifySession } from '@/lib/auth-wrapper';

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

      const trimmedUsername = username.trim();
      const userList = await db.select().from(users).where(eq(sql`LOWER(${users.username})`, trimmedUsername.toLowerCase()));
      let user = userList[0];

      // If user doesn't exist, check if there's an employee with this bankId to auto-provision user
      if (!user) {
        const empList = await db.select().from(employees).where(eq(sql`LOWER(${employees.bankId})`, trimmedUsername.toLowerCase()));
        const employee = empList[0];

        if (employee && employee.bankId) {
          const newUserList = await db.insert(users).values({
            username: employee.bankId.trim(),
            password: '123456', // default password
            name: employee.name.trim(),
            role: 'USER',
            mobile: employee.mobile ? employee.mobile.trim() : null,
          }).returning();
          user = newUserList[0];

          // Connect user to the employee's cell (A = cellId, B = userId)
          await db.insert(userCells).values({
            A: employee.cellId,
            B: user.id,
          });

          console.log(`Auto-provisioned User record for Employee: ${employee.name} (${employee.bankId})`);
        }
      }

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
        
        const signedCookie = signSession(String(user.id));
        response.cookies.set('session', signedCookie, {
          path: '/',
          maxAge: 60 * 60 * 24, // 1 day
          sameSite: 'lax',
          httpOnly: true, // secure from XSS
          secure: process.env.NODE_ENV === 'production',
        });
        return response;
      } else {
        return NextResponse.json({ error: 'invalid_credentials', message: 'ভুল ইউজারনেম বা পাসওয়ার্ড!' }, { status: 401 });
      }
    }

    return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
  } catch (error) {
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

    const verifiedUserId = verifySession(sessionVal);
    if (!verifiedUserId) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const userId = parseInt(verifiedUserId, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const userList = await db.select().from(users).where(eq(users.id, userId));
    const user = userList[0];

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const assignedCells = await db
      .select({
        id: cells.id,
        name: cells.name,
      })
      .from(userCells)
      .innerJoin(cells, eq(userCells.A, cells.id))
      .where(eq(userCells.B, user.id));

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        mobile: user.mobile,
        cells: assignedCells,
      },
    });
  } catch (error) {
    console.error('Auth GET Error:', error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
