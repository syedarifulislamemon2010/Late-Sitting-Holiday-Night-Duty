import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { cells, employees, trash } from '@/db/schema';
import { and, eq, ne, sql } from 'drizzle-orm';
import { cellUpdateSchema } from '@/validations/cell.schema';
import { handleApiError } from '@/lib/errors';

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
    const validated = cellUpdateSchema.parse(body);
    const { name, description } = validated;

    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'forbidden', message: 'অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন সেল সংশোধন করতে পারবেন।' }, { status: 403 });
    }
    
    if (name) {
      const existingList = await db.select().from(cells).where(
        and(
          eq(cells.name, name.trim()),
          ne(cells.id, cellId)
        )
      );
      const existing = existingList[0];
      
      if (existing) {
        return NextResponse.json({ error: 'cell_exists', message: 'এই নামের একটি সেল ইতিমধ্যেই বিদ্যমান।' }, { status: 400 });
      }
    }
    
    const updateData: { name?: string; description?: string | null } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    const updatedCellList = await db.update(cells)
      .set(updateData)
      .where(eq(cells.id, cellId))
      .returning();
    const cell = updatedCellList[0];
    
    return NextResponse.json(cell);
  } catch (error) {
    return handleApiError(error);
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
    
    const cellList = await db.select().from(cells).where(eq(cells.id, cellId));
    const cell = cellList[0];
    
    if (!cell) {
      return NextResponse.json({ error: 'cell_not_found', message: 'সেলটি পাওয়া যায়নি।' }, { status: 404 });
    }
    
    const empCountResult = await db.select({
      count: sql<number>`count(${employees.id})::int`
    }).from(employees).where(eq(employees.cellId, cellId));
    const employeeCount = empCountResult[0]?.count || 0;
    
    if (employeeCount > 0) {
      return NextResponse.json({ error: 'cell_has_employees', message: 'এই সেলে কর্মকর্তা বিদ্যমান থাকায় সেলটি মুছে ফেলা সম্ভব নয়।' }, { status: 400 });
    }
    
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'forbidden', message: 'অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন সেল মুছে ফেলতে পারবেন।' }, { status: 403 });
    }

    const deletedBy = currentUser.username;

    await db.insert(trash).values({
      entityType: 'CELL',
      entityId: cellId,
      name: `সেল: ${cell.name}`,
      data: JSON.stringify({ name: cell.name, description: cell.description }),
      deletedBy
    });
    
    await db.delete(cells).where(eq(cells.id, cellId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
