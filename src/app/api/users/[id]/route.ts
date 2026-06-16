import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { users, userCells, cells, employees } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'ইউজার সেশন পাওয়া যায়নি।' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    // A standard user (USER) can ONLY update their own profile
    if (currentUser.role !== 'ADMIN' && currentUser.id !== userId) {
      return NextResponse.json({ error: 'unauthorized', message: 'অন্য ইউজারের প্রোফাইল এডিট করার অনুমতি নেই।' }, { status: 403 });
    }

    const body = await request.json();
    const { name, password, role, cellIds, cellDuties, mobile } = body;

    if (!name) {
      return NextResponse.json({ error: 'name_required', message: 'নাম পূরণ করা আবশ্যক।' }, { status: 400 });
    }

    const targetUserList = await db.select().from(users).where(eq(users.id, userId));
    const targetUser = targetUserList[0];

    if (!targetUser) {
      return NextResponse.json({ error: 'not_found', message: 'টার্গেট ইউজার পাওয়া যায়নি।' }, { status: 404 });
    }

    // Enforce parameter security for standard USER role
    const finalRole = currentUser.role === 'ADMIN' ? (role || targetUser.role) : targetUser.role;
    
    // Clear and connect cells ONLY if ADMIN. Standard users cannot change their cell assignments
    if (currentUser.role === 'ADMIN') {
      await db.delete(userCells).where(eq(userCells.B, userId));
      if (Array.isArray(cellIds) && cellIds.length > 0) {
        await db.insert(userCells).values(
          cellIds.map((cid: string | number) => ({
            A: typeof cid === 'string' ? parseInt(cid, 10) : cid,
            B: userId
          }))
        );
      }
    }

    const updatedFields: {
      name: string;
      role: string;
      cellDuties?: string | null;
      mobile?: string | null;
      password?: string;
    } = {
      name: name.trim(),
      role: finalRole,
    };
    if (currentUser.role === 'ADMIN') {
      updatedFields.cellDuties = cellDuties !== undefined ? (cellDuties ? JSON.stringify(cellDuties) : null) : undefined;
    }
    if (mobile !== undefined) {
      updatedFields.mobile = mobile ? mobile.trim() : null;
    }
    if (password && password.trim()) {
      updatedFields.password = password.trim();
    }

    // Perform update
    const updatedUserList = await db.update(users)
      .set(updatedFields)
      .where(eq(users.id, userId))
      .returning();
    const updatedUser = updatedUserList[0];

    // Synchronize the mobile number to the Employee table if username corresponds to an employee's bankId
    if (mobile !== undefined) {
      await db.update(employees)
        .set({ mobile: mobile ? mobile.trim() : null })
        .where(eq(sql`LOWER(TRIM(${employees.bankId}))`, targetUser.username.trim().toLowerCase()));
    }

    const assignedCells = await db
      .select({
        id: cells.id,
        name: cells.name,
      })
      .from(userCells)
      .innerJoin(cells, eq(userCells.A, cells.id))
      .where(eq(userCells.B, userId));

    const result = {
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name,
      role: updatedUser.role,
      mobile: updatedUser.mobile,
      cellDuties: updatedUser.cellDuties,
      createdAt: updatedUser.createdAt,
      cells: assignedCells,
    };

    // Logging the update activity
    const isPasswordChange = !!(password && password.trim());
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await logActivity({
      username: currentUser.username,
      action: isPasswordChange ? 'CHANGE_PASSWORD' : 'UPDATE',
      entityType: 'USER',
      entityId: String(userId),
      ipAddress,
      userAgent,
      details: currentUser.id === userId
        ? `${currentUser.name} (@${currentUser.username}) নিজের তথ্য আপডেট করেছেন ${isPasswordChange ? '(পাসওয়ার্ড পরিবর্তনসহ)' : ''}।`
        : `${currentUser.name} (@${currentUser.username}) ইউজার @${result.username} এর তথ্য আপডেট করেছেন ${isPasswordChange ? '(নতুন পাসওয়ার্ড সেটসহ)' : ''}।`
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'failed_to_update_user', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র এডমিন ইউজার মুছে ফেলতে পারবেন।' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const userToDeleteList = await db.select().from(users).where(eq(users.id, userId));
    const userToDelete = userToDeleteList[0];

    if (!userToDelete) {
      return NextResponse.json({ error: 'not_found', message: 'ইউজার পাওয়া যায়নি।' }, { status: 404 });
    }

    if (userToDelete.username === 'admin') {
      return NextResponse.json({ error: 'cannot_delete_superadmin', message: 'সুপার এডমিন অ্যাকাউন্ট মুছে ফেলা যাবে না।' }, { status: 400 });
    }

    if (currentUser.id === userToDelete.id) {
      return NextResponse.json({ error: 'cannot_delete_self', message: 'নিজের অ্যাকাউন্ট মুছে ফেলা যাবে না।' }, { status: 400 });
    }

    // Delete user
    await db.delete(users).where(eq(users.id, userId));

    // Logging the delete activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await logActivity({
      username: currentUser.username,
      action: 'DELETE',
      entityType: 'USER',
      entityId: String(userId),
      ipAddress,
      userAgent,
      details: `${currentUser.name} (@${currentUser.username}) ইউজার "${userToDelete.name}" (@${userToDelete.username}) কে সিস্টেম থেকে মুছে ফেলেছেন।`
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'failed_to_delete_user', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
