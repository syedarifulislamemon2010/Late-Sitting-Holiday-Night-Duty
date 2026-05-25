import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

export async function GET() {
  try {
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
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    let deletedBy: string | null = null;
    if (sessionVal) {
      const userId = parseInt(sessionVal, 10);
      if (!isNaN(userId)) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          deletedBy = user.username;
        }
      }
    }

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
