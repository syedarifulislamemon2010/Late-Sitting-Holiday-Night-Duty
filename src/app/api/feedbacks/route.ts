import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

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
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    let feedbacks;
    if (currentUser.role === 'ADMIN') {
      feedbacks = await prisma.feedback.findMany({
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
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    } else {
      feedbacks = await prisma.feedback.findMany({
        where: {
          userId: currentUser.id
        },
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
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    }

    return NextResponse.json(feedbacks);
  } catch (error: any) {
    console.error('Error fetching feedbacks:', error);
    return NextResponse.json({ error: 'failed_to_fetch_feedbacks' }, { status: 500 });
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
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    if (currentUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'admins_cannot_create_feedback' }, { status: 403 });
    }

    const body = await request.json();
    const { title, category, description, attachmentUrl } = body;

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'title_required' }, { status: 400 });
    }
    
    const validCategories = ['SUGGESTION', 'IMPROVEMENT', 'REMOVE', 'SIMPLIFY', 'ISSUE'];
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json({ error: 'invalid_category' }, { status: 400 });
    }
    if (!description || description.trim() === '') {
      return NextResponse.json({ error: 'description_required' }, { status: 400 });
    }

    // Create the feedback thread and initial message as a transaction
    const feedback = await prisma.$transaction(async (tx) => {
      const fb = await tx.feedback.create({
        data: {
          title: title.trim(),
          category,
          userId: currentUser.id,
          status: 'PENDING'
        }
      });

      await tx.feedbackMessage.create({
        data: {
          feedbackId: fb.id,
          senderId: currentUser.id,
          message: description.trim(),
          attachmentUrl: attachmentUrl || null
        }
      });

      return fb;
    });

    // Log this activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: currentUser.username,
      action: 'CREATE',
      entityType: 'USER',
      entityId: String(feedback.id),
      ipAddress,
      userAgent,
      details: `${currentUser.name} (@${currentUser.username}) নতুন ফিডব্যাক/ইস্যু "${feedback.title}" তৈরি করেছেন।`
    });

    // Return the created feedback thread fully loaded
    const fullFeedback = await prisma.feedback.findUnique({
      where: { id: feedback.id },
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
                name: true,
                role: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(fullFeedback, { status: 201 });
  } catch (error: any) {
    console.error('Error creating feedback:', error);
    return NextResponse.json({ error: 'failed_to_create_feedback' }, { status: 500 });
  }
}
