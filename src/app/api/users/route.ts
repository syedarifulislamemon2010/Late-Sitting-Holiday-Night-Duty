import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/audit';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    const currentUserId = parseInt(sessionVal, 10);
    const currentUser = !isNaN(currentUserId)
      ? await prisma.user.findUnique({ where: { id: currentUserId } })
      : null;

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র এডমিন এই ইউজার তালিকা দেখতে পারবেন।' }, { status: 403 });
    }
    // 1. Fetch all employees with a bank ID
    const employees = await prisma.employee.findMany({
      where: {
        bankId: {
          not: null
        }
      }
    });

    // 2. Fetch all existing users' usernames
    const existingUsers = await prisma.user.findMany({
      select: { username: true }
    });
    const existingUsernames = new Set(existingUsers.map((u: any) => u.username.trim().toLowerCase()));

    // 3. Sync missing users
    for (const emp of employees) {
      if (emp.bankId && emp.bankId.trim() !== '') {
        const username = emp.bankId.trim().toLowerCase();
        // Skip if username is 'admin' or already exists
        if (username !== 'admin' && !existingUsernames.has(username)) {
          await prisma.user.create({
            data: {
              username: emp.bankId.trim(),
              password: '123456',
              name: emp.name.trim(),
              role: 'USER',
              cells: {
                connect: { id: emp.cellId }
              }
            }
          });
          existingUsernames.add(username);
        }
      }
    }

    // 4. Fetch the users list as normal
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        cells: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users and syncing:', error);
    return NextResponse.json({ error: 'failed_to_fetch_users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    const currentUserId = parseInt(sessionVal, 10);
    const currentUser = !isNaN(currentUserId)
      ? await prisma.user.findUnique({ where: { id: currentUserId } })
      : null;

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র এডমিন নতুন ইউজার তৈরি করতে পারবেন।' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password, name, role, cellIds } = body;

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'fields_required', message: 'সবগুলো আবশ্যক ফিল্ড পূরণ করুন।' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { username: username.trim() }
    });

    if (existing) {
      return NextResponse.json({ error: 'user_exists', message: 'এই ইউজারনেমটি ইতিমধ্যেই ব্যবহৃত হচ্ছে!' }, { status: 400 });
    }

    const cellConnection = Array.isArray(cellIds) 
      ? cellIds.map((id: any) => ({ id: parseInt(id, 10) }))
      : [];

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password: password.trim(),
        name: name.trim(),
        role: role || 'USER',
        cells: {
          connect: cellConnection
        }
      },
      include: {
        cells: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Logging the user creation activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: currentUser!.username,
      action: 'CREATE',
      entityType: 'USER',
      entityId: String(user.id),
      ipAddress,
      userAgent,
      details: `${currentUser!.name} (@${currentUser!.username}) নতুন ইউজার "${user.name}" (@${user.username}) তৈরি করেছেন।`
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'failed_to_create_user', message: error.message }, { status: 500 });
  }
}
