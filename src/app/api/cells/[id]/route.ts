import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cellId = parseInt(id, 10);
    
    if (isNaN(cellId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }
    
    const body = await request.json();
    const { name, description } = body;

    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    let currentUser: any = null;
    if (sessionVal) {
      const userId = parseInt(sessionVal, 10);
      if (!isNaN(userId)) {
        currentUser = await prisma.user.findUnique({
          where: { id: userId }
        });
      }
    }

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'forbidden', message: 'অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন সেল সংশোধন করতে পারবেন।' }, { status: 403 });
    }
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'name_required' }, { status: 400 });
    }
    
    const existing = await prisma.cell.findFirst({
      where: {
        name: name.trim(),
        NOT: { id: cellId }
      }
    });
    
    if (existing) {
      return NextResponse.json({ error: 'cell_exists' }, { status: 400 });
    }
    
    const cell = await prisma.cell.update({
      where: { id: cellId },
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    });
    
    return NextResponse.json(cell);
  } catch (error: any) {
    console.error('Error updating cell:', error);
    return NextResponse.json({ error: 'failed_to_update_cell' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cellId = parseInt(id, 10);
    
    if (isNaN(cellId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }
    
    const cell = await prisma.cell.findUnique({
      where: { id: cellId },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });
    
    if (!cell) {
      return NextResponse.json({ error: 'cell_not_found' }, { status: 404 });
    }
    
    if (cell._count.employees > 0) {
      return NextResponse.json({ error: 'cell_has_employees' }, { status: 400 });
    }
    
    // Save to Trash
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    let currentUser: any = null;
    if (sessionVal) {
      const userId = parseInt(sessionVal, 10);
      if (!isNaN(userId)) {
        currentUser = await prisma.user.findUnique({ where: { id: userId } });
      }
    }

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'forbidden', message: 'অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন সেল মুছে ফেলতে পারবেন।' }, { status: 403 });
    }

    const deletedBy = currentUser.username;

    await prisma.trash.create({
      data: {
        entityType: 'CELL',
        entityId: cellId,
        name: `সেল: ${cell.name}`,
        data: JSON.stringify({ name: cell.name, description: cell.description }),
        deletedBy
      }
    });
    
    await prisma.cell.delete({
      where: { id: cellId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting cell:', error);
    return NextResponse.json({ error: 'failed_to_delete_cell' }, { status: 500 });
  }
}
