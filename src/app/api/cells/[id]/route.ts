import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    
    await prisma.cell.delete({
      where: { id: cellId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting cell:', error);
    return NextResponse.json({ error: 'failed_to_delete_cell' }, { status: 500 });
  }
}
