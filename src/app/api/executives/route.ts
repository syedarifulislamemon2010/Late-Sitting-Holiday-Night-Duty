import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const executives = await prisma.executive.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(executives);
  } catch (error: any) {
    console.error('Error fetching executives:', error);
    return NextResponse.json({ error: 'failed_to_fetch_executives' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    const currentUserId = parseInt(sessionVal, 10);
    const currentUser = !isNaN(currentUserId)
      ? await prisma.user.findUnique({ where: { id: currentUserId } })
      : null;

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }

    const body = await request.json();
    const { name, designation, phone, email, bankId, fileNo } = body;

    if (!name || !designation) {
      return NextResponse.json({ error: 'name_and_designation_required' }, { status: 400 });
    }

    const created = await prisma.executive.create({
      data: {
        name: name.trim(),
        designation: designation.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        bankId: bankId?.trim() || null,
        fileNo: fileNo?.trim() || null
      }
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error('Error creating executive:', error);
    return NextResponse.json({ error: 'failed_to_create_executive' }, { status: 500 });
  }
}
