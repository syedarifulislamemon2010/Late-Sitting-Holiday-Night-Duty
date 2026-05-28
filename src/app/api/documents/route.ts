import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }
    const userId = parseInt(sessionVal, 10);
    const user = !isNaN(userId) ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র অ্যাডমিন ফাইল দেখতে পারবেন।' }, { status: 403 });
    }

    const docs = await prisma.document.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
    return NextResponse.json(docs);
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }
    const userId = parseInt(sessionVal, 10);
    const user = !isNaN(userId) ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র অ্যাডমিন ফাইল মুছে ফেলতে পারবেন।' }, { status: 403 });
    }

    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'id_required' }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({
      where: { id: Number(id) },
    });

    if (!doc) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    // Save to Trash (keep physical file for restoration support)
    let deletedBy: string | null = user ? user.username : null;

    await prisma.trash.create({
      data: {
        entityType: 'DOCUMENT',
        entityId: doc.id,
        name: `দলিল: ${doc.name}`,
        data: JSON.stringify(doc),
        deletedBy
      }
    });

    // Delete database entry
    await prisma.document.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: 'Document soft-deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'internal_error', message: error.message }, { status: 500 });
  }
}
