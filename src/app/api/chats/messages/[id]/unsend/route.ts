import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

async function getSessionUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('session')?.value;
  if (!sessionVal) return null;
  const userId = parseInt(sessionVal, 10);
  return isNaN(userId) ? null : userId;
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const messageId = parseInt(params.id, 10);
    if (isNaN(messageId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body; // "EVERYONE" or "ME"

    if (type !== 'EVERYONE' && type !== 'ME') {
      return NextResponse.json({ error: 'invalid_unsend_type' }, { status: 400 });
    }

    // Retrieve the message
    const msg = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!msg) {
      return NextResponse.json({ error: 'message_not_found' }, { status: 404 });
    }

    // Verify current user is a participant of this chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: msg.chatId,
        userId: userId
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // A. Unsend for Everyone
    if (type === 'EVERYONE') {
      // Check ownership
      if (msg.senderId !== userId) {
        return NextResponse.json({ error: 'cannot_unsend_others_messages' }, { status: 403 });
      }

      // Update message status
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          isUnsent: true
        }
      });

      return NextResponse.json({ success: true, action: 'EVERYONE' });
    }

    // B. Unsend for Me (delete for me)
    if (type === 'ME') {
      let deletedUsers: number[] = [];
      try {
        deletedUsers = JSON.parse(msg.deletedForUsers || '[]');
      } catch {
        deletedUsers = [];
      }

      // Append user ID if not already deleted
      if (!deletedUsers.includes(userId)) {
        deletedUsers.push(userId);
      }

      // Update message
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          deletedForUsers: JSON.stringify(deletedUsers)
        }
      });

      return NextResponse.json({ success: true, action: 'ME' });
    }

  } catch (error: any) {
    console.error('Error unsending message:', error);
    return NextResponse.json({ error: 'failed_to_unsend_message' }, { status: 500 });
  }
}
