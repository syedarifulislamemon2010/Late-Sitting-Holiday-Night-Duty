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
      return new Response('Missing ID parameter', { status: 400 });
    }

    const docId = Number(idStr);
    const docs = await db.select().from(manualDocuments).where(eq(manualDocuments.id, docId));
    const doc = docs[0];

    if (!doc) {
      return new Response('Document not found in database', { status: 404 });
    }

    const absolutePath = path.join(process.cwd(), 'public', doc.filePath);
    if (!fs.existsSync(absolutePath)) {
      return new Response('File not found on disk', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    
    // Resolve content type
    let contentType = 'application/octet-stream';
    const ext = doc.fileType.toLowerCase().replace(/^\./, '');
    if (ext === 'pdf') {
      contentType = 'application/pdf';
    } else if (['jpg', 'jpeg'].includes(ext)) {
      contentType = 'image/jpeg';
    } else if (ext === 'png') {
      contentType = 'image/png';
    } else if (ext === 'gif') {
      contentType = 'image/gif';
    }

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline', // Ensure the browser serves it inline
      },
    });
  } catch (error) {
    console.error('Error serving raw manual document:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
