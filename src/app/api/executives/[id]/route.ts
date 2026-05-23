import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const execId = parseInt(id, 10);
    
    if (isNaN(execId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const body = await request.json();
    const { name, designation, phone, email } = body;

    if (!name || !designation) {
      return NextResponse.json({ error: 'name_and_designation_required' }, { status: 400 });
    }

    const updated = await prisma.executive.update({
      where: { id: execId },
      data: {
        name: name.trim(),
        designation: designation.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null
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
    const { id } = await params;
    const execId = parseInt(id, 10);
    
    if (isNaN(execId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    await prisma.executive.delete({
      where: { id: execId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting executive:', error);
    return NextResponse.json({ error: 'failed_to_delete_executive' }, { status: 500 });
  }
}
