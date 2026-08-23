import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { users, employees, userCells, cells } from '@/db/schema';
import { eq, isNotNull, sql } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { hashPassword } from '@/lib/password';
import { userCreateSchema } from '@/validations/user.schema';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র এডমিন এই ইউজার তালিকা দেখতে পারবেন।' }, { status: 403 });
    }

    // 1. Fetch all employees with a bank ID
    const emps = await db.select().from(employees).where(isNotNull(employees.bankId));

    // 2. Fetch all existing users' usernames
    const existingUsers = await db.select({ username: users.username }).from(users);
    const existingUsernames = new Set(existingUsers.map((u: { username: string }) => u.username.trim().toLowerCase()));

    // 3. Sync missing users with hashed default password
    const hashedDefaultPassword = await hashPassword('123456');
    for (const emp of emps) {
      if (emp.bankId && emp.bankId.trim() !== '') {
        const username = emp.bankId.trim().toLowerCase();
        // Skip if username is 'admin' or already exists
        if (username !== 'admin' && !existingUsernames.has(username)) {
          const newUsers = await db.insert(users).values({
            username: emp.bankId.trim(),
            password: hashedDefaultPassword,
            name: emp.name.trim(),
            role: 'USER',
            mobile: emp.mobile ? emp.mobile.trim() : null,
          }).returning();
          const newUser = newUsers[0];

          await db.insert(userCells).values({
            A: emp.cellId,
            B: newUser.id,
          });

          existingUsernames.add(username);
        }
      }
    }

    // 4. Fetch the users list as normal
    const allUsersList = await db.select().from(users).orderBy(users.name);
    
    // Fetch cell mappings
    const allUserCells = await db
      .select({
        userId: userCells.B,
        cellId: cells.id,
        cellName: cells.name
      })
      .from(userCells)
      .innerJoin(cells, eq(userCells.A, cells.id));

    const usersWithCells = allUsersList.map((u: typeof users.$inferSelect) => {
      const assigned = allUserCells
        .filter((uc) => uc.userId === u.id)
        .map((uc) => ({
          id: uc.cellId,
          name: uc.cellName
        }));

      return {
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        mobile: u.mobile,
        cellDuties: u.cellDuties,
        createdAt: u.createdAt,
        cells: assigned
      };
    });

    return NextResponse.json(usersWithCells);
  } catch (error) {
    logger.error('Error fetching users and syncing:', error);
    return NextResponse.json({ error: 'failed_to_fetch_users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র এডমিন নতুন ইউজার তৈরি করতে পারবেন।' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = userCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return handleApiError(parseResult.error);
    }
    const validated = parseResult.data;
    const { username, password, name, role, cellIds } = validated;
    const { cellDuties, mobile } = body;

    const existingList = await db.select().from(users).where(eq(users.username, username.trim()));
    const existing = existingList[0];

    if (existing) {
      return NextResponse.json({ error: 'user_exists', message: 'এই ইউজারনেমটি ইতিমধ্যেই ব্যবহৃত হচ্ছে!' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password.trim());

    const newUsers = await db.insert(users).values({
      username: username.trim(),
      password: hashedPassword,
      name: name.trim(),
      role: role || 'USER',
      cellDuties: cellDuties ? JSON.stringify(cellDuties) : null,
      mobile: mobile ? mobile.trim() : null,
    }).returning();
    const user = newUsers[0];

    // Synchronize the mobile number to the Employee table if username corresponds to an employee's bankId
    if (mobile !== undefined && mobile !== null) {
      await db.update(employees)
        .set({ mobile: mobile.trim() || null })
        .where(eq(sql`LOWER(TRIM(${employees.bankId}))`, username.trim().toLowerCase()));
    }

    if (Array.isArray(cellIds) && cellIds.length > 0) {
      await db.insert(userCells).values(
        cellIds.map((cid: string | number) => ({
          A: typeof cid === 'string' ? parseInt(cid, 10) : cid,
          B: user.id
        }))
      );
    }

    const assignedCells = await db
      .select({
        id: cells.id,
        name: cells.name,
      })
      .from(userCells)
      .innerJoin(cells, eq(userCells.A, cells.id))
      .where(eq(userCells.B, user.id));

    const userWithCells = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      mobile: user.mobile,
      cellDuties: user.cellDuties,
      createdAt: user.createdAt,
      cells: assignedCells,
    };

    // Logging the user creation activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: currentUser.username,
      action: 'CREATE',
      entityType: 'USER',
      entityId: String(user.id),
      ipAddress,
      userAgent,
      details: `${currentUser.name} (@${currentUser.username}) নতুন ইউজার "${user.name}" (@${user.username}) তৈরি করেছেন।`
    });

    return NextResponse.json(userWithCells, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
