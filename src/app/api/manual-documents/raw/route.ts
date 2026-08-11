import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { manualDocuments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');
    
    if (!idStr) {
      return NextResponse.json({ error: 'missing_id', message: 'Missing ID parameter' }, { status: 400 });
    }

    const docId = Number(idStr);
    const docs = await db.select().from(manualDocuments).where(eq(manualDocuments.id, docId));
    const doc = docs[0];

    if (!doc) {
      return NextResponse.json({ error: 'not_found', message: 'Document not found in database' }, { status: 404 });
    }

    const absolutePath = path.join(process.cwd(), 'public', doc.filePath);
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: 'file_not_found', message: 'File not found on disk' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    const base64Data = fileBuffer.toString('base64');
    
    // Resolve mime type
    let mimeType = 'application/octet-stream';
    const ext = doc.fileType.toLowerCase().replace(/^\./, '');
    if (ext === 'pdf') {
      mimeType = 'application/pdf';
    } else if (['jpg', 'jpeg'].includes(ext)) {
      mimeType = 'image/jpeg';
    } else if (ext === 'png') {
      mimeType = 'image/png';
    } else if (ext === 'gif') {
      mimeType = 'image/gif';
    }

    return NextResponse.json({
      success: true,
      data: base64Data,
      mimeType: mimeType,
      name: doc.name
    });
  } catch (error) {
    logger.error('Error serving raw manual document:', error);
    return NextResponse.json({ error: 'internal_error', message: 'Internal Server Error' }, { status: 500 });
  }
}
