import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const body = await request.json();
    const { name, password, role, cellIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'name_required', message: 'নাম পূরণ করা আবশ্যক।' }, { status: 400 });
    }

    // 1. Clear current cells
    await prisma.user.update({
      where: { id: userId },
      data: {
        cells: {
          set: []
        }
      }
    });

    const cellConnection = Array.isArray(cellIds)
      ? cellIds.map((cid: any) => ({ id: parseInt(cid, 10) }))
      : [];

    // 2. Perform full update
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        role: role || 'USER',
        ...(password && password.trim() ? { password: password.trim() } : {}),
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
    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'failed_to_delete_user', message: error.message }, { status: 500 });
  }
}
