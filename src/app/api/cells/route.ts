import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { cells, employees } from '@/db/schema';
import { and, eq, ne, inArray, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const user = await getCurrentUser();
    let cellIds: number[] = [];
    let isUserRestricted = false;

    if (user && user.role === 'USER') {
      isUserRestricted = true;
      cellIds = user.cells.map((c: { id: number }) => c.id);
    }

    const conditions = [ne(cells.name, 'Combined Departmental Sheet')];
    if (isUserRestricted) {
      if (cellIds.length > 0) {
        conditions.push(inArray(cells.id, cellIds));
      } else {
        return NextResponse.json([]);
      }
    }

    const cellsList = await db
      .select({
        id: cells.id,
        name: cells.name,
        description: cells.description,
        createdAt: cells.createdAt,
        employeeCount: sql<number>`count(${employees.id})::int`
      })
      .from(cells)
      .leftJoin(employees, eq(cells.id, employees.cellId))
      .where(and(...conditions))
      .groupBy(cells.id)
      .orderBy(cells.name);

    const formattedCells = cellsList.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      createdAt: c.createdAt,
      _count: {
        employees: c.employeeCount
      }
    }));

    return NextResponse.json(formattedCells);
  } catch (error) {
    console.error('Error fetching cells:', error);
    return NextResponse.json({ error: 'failed_to_fetch_cells' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'forbidden', message: 'অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন নতুন সেল যোগ করতে পারবেন।' }, { status: 403 });
    }
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'name_required' }, { status: 400 });
    }
    
    const existingList = await db.select().from(cells).where(eq(cells.name, name.trim()));
    const existing = existingList[0];
    
    if (existing) {
      return NextResponse.json({ error: 'cell_exists' }, { status: 400 });
    }
    
    const newCellList = await db.insert(cells).values({
      name: name.trim(),
      description: description?.trim() || null
    }).returning();
    const cell = newCellList[0];
    
    return NextResponse.json(cell, { status: 201 });
  } catch (error) {
    console.error('Error creating cell:', error);
    return NextResponse.json({ error: 'failed_to_create_cell' }, { status: 500 });
  }
}
