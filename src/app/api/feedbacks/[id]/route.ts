import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
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
      where: { id: feedbackId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
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
        }
      }
    });

    if (!feedback) {
      return NextResponse.json({ error: 'feedback_not_found' }, { status: 404 });
    }

    // Security check: Only Admin or the owner can view this feedback
    if (currentUser.role !== 'ADMIN' && feedback.userId !== currentUser.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    return NextResponse.json(feedback);
  } catch (error: any) {
    console.error('Error fetching feedback details:', error);
    return NextResponse.json({ error: 'failed_to_fetch_feedback' }, { status: 500 });
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
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

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || (status !== 'PENDING' && status !== 'REVIEWED' && status !== 'RESOLVED')) {
      return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
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
        }
      }
    });

    // Log this status change
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: currentUser.username,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: String(updatedFeedback.id),
      ipAddress,
      userAgent,
      details: `${currentUser.name} (@${currentUser.username}) ফিডব্যাক/ইস্যু "${updatedFeedback.title}" এর স্ট্যাটাস পরিবর্তন করে "${status}" করেছেন।`
    });

    return NextResponse.json(updatedFeedback);
  } catch (error: any) {
    console.error('Error updating feedback status:', error);
    return NextResponse.json({ error: 'failed_to_update_feedback' }, { status: 500 });
  }
}
