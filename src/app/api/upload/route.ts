import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }
    const userId = parseInt(sessionVal, 10);
    const user = !isNaN(userId) ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'শুধুমাত্র অ্যাডমিন ফাইল আপলোড করতে পারবেন।' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'file_required', message: 'অনুগ্রহ করে ফাইল নির্বাচন করুন।' }, { status: 400 });
    }

    if (!file.name.endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'invalid_type', message: 'শুধুমাত্র পিডিএফ (.pdf) ফাইল আপলোড করা যাবে।' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Write file to disk
    fs.writeFileSync(filePath, buffer);

    const relativePath = `/uploads/${uniqueFilename}`;

    // Save to database
    const doc = await prisma.document.create({
      data: {
        name: name || file.name.replace('.pdf', ''),
        filePath: relativePath,
        fileSize: file.size,
      },
    });

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: user.username,
      action: 'CREATE',
      entityType: 'DOCUMENT',
      entityId: String(doc.id),
      ipAddress,
      userAgent,
      details: `${user.name} (@${user.username}) ম্যানুয়াল ফাইল আপলোড করেছেন: "${doc.name}"।`
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    console.error('File Upload Error:', error);
    return NextResponse.json({ error: 'internal_error', message: error.message }, { status: 500 });
  }
}
