import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const feedbackId = parseInt(params.id, 10);
    if (isNaN(feedbackId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId }
    });

    if (!feedback) {
      return NextResponse.json({ error: 'feedback_not_found' }, { status: 404 });
    }

    // Security check: Only Admin or the owner can post messages
    if (currentUser.role !== 'ADMIN' && feedback.userId !== currentUser.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'message_required' }, { status: 400 });
    }

    // Determine new status if Admin replies
    let newStatus = feedback.status;
    if (currentUser.role === 'ADMIN' && feedback.status === 'PENDING') {
      newStatus = 'REVIEWED';
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create new message
      const msg = await tx.feedbackMessage.create({
        data: {
          feedbackId,
          senderId: currentUser.id,
          message: message.trim()
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true
            }
          }
        }
      });

      // Update parent feedback updatedAt time and possibly status
      await tx.feedback.update({
        where: { id: feedbackId },
        data: { 
          updatedAt: new Date(),
          status: newStatus
        }
      });

      return msg;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error posting feedback message:', error);
    return NextResponse.json({ error: 'failed_to_post_message' }, { status: 500 });
  }
}
