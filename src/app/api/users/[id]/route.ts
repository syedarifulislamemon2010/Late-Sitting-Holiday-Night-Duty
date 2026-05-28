import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    const currentUserId = parseInt(sessionVal, 10);
    const currentUser = !isNaN(currentUserId)
      ? await prisma.user.findUnique({ where: { id: currentUserId }, include: { cells: true } })
      : null;

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
    const { name, password, role, cellIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'name_required', message: 'নাম পূরণ করা আবশ্যক।' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { cells: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'not_found', message: 'টার্গেট ইউজার পাওয়া যায়নি।' }, { status: 404 });
    }

    // Enforce parameter security for standard USER role
    const finalRole = currentUser.role === 'ADMIN' ? (role || targetUser.role) : targetUser.role;
    
    // Clear and connect cells ONLY if ADMIN. Standard users cannot change their cell assignments
    if (currentUser.role === 'ADMIN') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          cells: {
            set: []
          }
        }
      });
    }

    const cellConnection = currentUser.role === 'ADMIN' && Array.isArray(cellIds)
      ? cellIds.map((cid: any) => ({ id: parseInt(cid, 10) }))
      : undefined;

    // Perform update
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        role: finalRole,
        ...(password && password.trim() ? { password: password.trim() } : {}),
        ...(cellConnection ? { cells: { connect: cellConnection } } : {})
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
        : `${currentUser.name} (@${currentUser.username}) ইউজার @${updated.username} এর তথ্য আপডেট করেছেন ${isPasswordChange ? '(নতুন পাসওয়ার্ড সেটসহ)' : ''}।`
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'failed_to_update_user', message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র এডমিন ইউজার মুছে ফেলতে পারবেন।' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId }
    });

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
    await prisma.user.delete({
      where: { id: userId }
    });

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
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'failed_to_delete_user', message: error.message }, { status: 500 });
  }
}
