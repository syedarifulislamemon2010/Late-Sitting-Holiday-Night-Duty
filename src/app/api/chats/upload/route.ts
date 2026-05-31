import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

async function getSessionUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('session')?.value;
  if (!sessionVal) return null;
  const userId = parseInt(sessionVal, 10);
  return isNaN(userId) ? null : userId;
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'file_required', message: 'অনুগ্রহ করে ফাইল নির্বাচন করুন।' }, { status: 400 });
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory for chats exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chats');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique safe filename
    const sanitizedName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
    const uniqueFilename = `${Date.now()}_${sanitizedName || 'file'}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Save to disk
    fs.writeFileSync(filePath, buffer);

    const relativePath = `/uploads/chats/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      fileName: file.name,
      fileSize: file.size
    });

  } catch (error: any) {
    console.error('Chat Upload API Error:', error);
    return NextResponse.json({
      error: 'internal_error',
      message: 'ফাইল আপলোড করতে সমস্যা হয়েছে।'
    }, { status: 500 });
  }
}
