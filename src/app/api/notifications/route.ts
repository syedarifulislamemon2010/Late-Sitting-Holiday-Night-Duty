import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const userId = parseInt(sessionVal, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 notifications
    });

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('Error in Notifications GET:', error);
    return NextResponse.json({ error: 'failed_to_fetch_notifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const userId = parseInt(sessionVal, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, id } = body;

    if (action === 'markAllRead') {
      await prisma.notification.updateMany({
        where: { userId: currentUser.id, isRead: false },
        data: { isRead: true }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'markRead' && id) {
      const parsedId = parseInt(id, 10);
      if (!isNaN(parsedId)) {
        await prisma.notification.update({
          where: { id: parsedId, userId: currentUser.id },
          data: { isRead: true }
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in Notifications POST:', error);
    return NextResponse.json({ error: 'failed_to_update_notifications' }, { status: 500 });
  }
}
