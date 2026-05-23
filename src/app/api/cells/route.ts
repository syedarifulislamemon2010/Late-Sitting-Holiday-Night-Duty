import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    
    let cellIds: number[] = [];
    let isUserRestricted = false;

    if (sessionVal) {
      const userId = parseInt(sessionVal, 10);
      if (!isNaN(userId)) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { cells: true }
        });
        if (user && user.role === 'USER') {
          isUserRestricted = true;
          cellIds = user.cells.map(c => c.id);
        }
      }
    }

    const whereClause = isUserRestricted ? { id: { in: cellIds } } : {};

    const cells = await prisma.cell.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });
    return NextResponse.json(cells);
  } catch (error: any) {
    console.error('Error fetching cells:', error);
    return NextResponse.json({ error: 'failed_to_fetch_cells' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'name_required' }, { status: 400 });
    }
    
    const existing = await prisma.cell.findUnique({
      where: { name: name.trim() }
    });
    
    if (existing) {
      return NextResponse.json({ error: 'cell_exists' }, { status: 400 });
    }
    
    const cell = await prisma.cell.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    });
    
    return NextResponse.json(cell, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cell:', error);
    return NextResponse.json({ error: 'failed_to_create_cell' }, { status: 500 });
  }
}
