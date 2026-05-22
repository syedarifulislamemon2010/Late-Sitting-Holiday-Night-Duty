import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

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

    // Delete physical file
    const absolutePath = path.join(process.cwd(), 'public', doc.filePath);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (fileErr) {
        console.error('Failed to delete physical file:', fileErr);
      }
    }

    // Delete database entry
    await prisma.document.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'internal_error', message: error.message }, { status: 500 });
  }
}
