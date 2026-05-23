import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const body = await request.json();
    const { name, designation, phone, email } = body;

    if (!name || !designation) {
      return NextResponse.json({ error: 'name_and_designation_required' }, { status: 400 });
    }

    const created = await prisma.executive.create({
      data: {
        name: name.trim(),
        designation: designation.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null
      }
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error('Error creating executive:', error);
    return NextResponse.json({ error: 'failed_to_create_executive' }, { status: 500 });
  }
}
