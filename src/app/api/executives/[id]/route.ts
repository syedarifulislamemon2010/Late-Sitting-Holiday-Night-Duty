import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function checkAdmin() {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('session')?.value;
  if (!sessionVal) return null;

  const userId = parseInt(sessionVal, 10);
  if (isNaN(userId)) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'ADMIN') return null;

  return user;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
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

    const updated = await prisma.executive.update({
      where: { id: execId },
      data: {
        name: name.trim(),
        designation: designation.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        bankId: bankId?.trim() || null,
        fileNo: fileNo?.trim() || null
      }
    });

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
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    const { id } = await params;
    const execId = parseInt(id, 10);
    
    if (isNaN(execId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const executive = await prisma.executive.findUnique({
      where: { id: execId }
    });

    if (!executive) {
      return NextResponse.json({ error: 'executive_not_found' }, { status: 404 });
    }

    // Save to Trash
    await prisma.trash.create({
      data: {
        entityType: 'EXECUTIVE',
        entityId: execId,
        name: `নির্বাহী: ${executive.name} (${executive.designation})`,
        data: JSON.stringify(executive),
        deletedBy: admin.username
      }
    });

    await prisma.executive.delete({
      where: { id: execId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting executive:', error);
    return NextResponse.json({ error: 'failed_to_delete_executive' }, { status: 500 });
  }
}
