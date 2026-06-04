import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { executives, trash } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    const { id } = await params;
    const execId = parseInt(id, 10);
    
    if (isNaN(execId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const body = await request.json();
    const { name, designation, phone, email, bankId, fileNo } = body;

    if (!name || !designation) {
      return NextResponse.json({ error: 'name_and_designation_required' }, { status: 400 });
    }

    const updatedList = await db.update(executives)
      .set({
        name: name.trim(),
        designation: designation.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        bankId: bankId?.trim() || null,
        fileNo: fileNo?.trim() || null
      })
      .where(eq(executives.id, execId))
      .returning();
    const updated = updatedList[0];

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating executive:', error);
    return NextResponse.json({ error: 'failed_to_update_executive' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    const { id } = await params;
    const execId = parseInt(id, 10);
    
    if (isNaN(execId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const execList = await db.select().from(executives).where(eq(executives.id, execId));
    const executive = execList[0];

    if (!executive) {
      return NextResponse.json({ error: 'executive_not_found' }, { status: 404 });
    }

    // Save to Trash
    await db.insert(trash).values({
      entityType: 'EXECUTIVE',
      entityId: execId,
      name: `নির্বাহী: ${executive.name} (${executive.designation})`,
      data: JSON.stringify(executive),
      deletedBy: admin.username
    });

    await db.delete(executives).where(eq(executives.id, execId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting executive:', error);
    return NextResponse.json({ error: 'failed_to_delete_executive' }, { status: 500 });
  }
}
