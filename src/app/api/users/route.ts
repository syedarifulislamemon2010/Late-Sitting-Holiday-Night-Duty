import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        cells: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'failed_to_fetch_users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, name, role, cellIds } = body;

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'fields_required', message: 'সবগুলো আবশ্যক ফিল্ড পূরণ করুন।' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { username: username.trim() }
    });

    if (existing) {
      return NextResponse.json({ error: 'user_exists', message: 'এই ইউজারনেমটি ইতিমধ্যেই ব্যবহৃত হচ্ছে!' }, { status: 400 });
    }

    const cellConnection = Array.isArray(cellIds) 
      ? cellIds.map((id: any) => ({ id: parseInt(id, 10) }))
      : [];

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password: password.trim(),
        name: name.trim(),
        role: role || 'USER',
        cells: {
          connect: cellConnection
        }
      },
      include: {
        cells: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'failed_to_create_user', message: error.message }, { status: 500 });
  }
}
