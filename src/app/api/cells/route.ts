import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cells = await prisma.cell.findMany({
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
