import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { encryptMessage, decryptMessage } from '@/lib/encryption';

async function getSessionUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('session')?.value;
  if (!sessionVal) return null;
  const userId = parseInt(sessionVal, 10);
  return isNaN(userId) ? null : userId;
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const chatId = parseInt(params.id, 10);
    if (isNaN(chatId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Verify current user is a participant of this chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: chatId,
        userId: userId
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Retrieve messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatId: chatId
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
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Update lastReadAt for this participant
    await prisma.chatParticipant.update({
      where: {
        chatId_userId: {
          chatId,
          userId
        }
      },
      data: {
        lastReadAt: new Date()
      }
    });

    // Format & decrypt messages
    const formattedMessages = messages
      .filter(msg => {
        // Filter out messages deleted "for me"
        try {
          const deletedUsers = JSON.parse(msg.deletedForUsers || '[]');
          return !deletedUsers.includes(userId);
        } catch {
          return true;
        }
      })
      .map(msg => {
        return {
          id: msg.id,
          chatId: msg.chatId,
          senderId: msg.senderId,
          sender: {
            id: msg.sender.id,
            name: msg.sender.name,
            username: msg.sender.username,
            role: msg.sender.role
          },
          // Transparently decrypt text or display unsend warning
          message: msg.isUnsent ? '🚫 এই বার্তাটি আনসেন্ট করা হয়েছে' : decryptMessage(msg.message),
          attachmentUrl: msg.attachmentUrl,
          attachmentName: msg.attachmentName,
          attachmentSize: msg.attachmentSize,
          isUnsent: msg.isUnsent,
          createdAt: msg.createdAt
        };
      });

    return NextResponse.json(formattedMessages);
  } catch (error: any) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'failed_to_fetch_messages' }, { status: 500 });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const chatId = parseInt(params.id, 10);
    if (isNaN(chatId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Verify current user is a participant of this chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: chatId,
        userId: userId
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { message, attachmentUrl, attachmentName, attachmentSize } = body;

    if ((!message || message.trim() === '') && !attachmentUrl) {
      return NextResponse.json({ error: 'content_required' }, { status: 400 });
    }

    // Encrypt text message block transparently
    const cipherMessage = encryptMessage((message || '').trim());

    // Save message and touch chat updatedAt inside transaction
    const result = await prisma.$transaction(async (tx) => {
      const msg = await tx.chatMessage.create({
        data: {
          chatId,
          senderId: userId,
          message: cipherMessage,
          attachmentUrl: attachmentUrl || null,
          attachmentName: attachmentName || null,
          attachmentSize: attachmentSize ? parseInt(attachmentSize, 10) : null
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

      // Touch parent chat record
      await tx.chat.update({
        where: { id: chatId },
        data: {
          updatedAt: new Date()
        }
      });

      return msg;
    });

    // Return the decrypted message to the sender
    return NextResponse.json({
      id: result.id,
      chatId: result.chatId,
      senderId: result.senderId,
      sender: {
        id: result.sender.id,
        name: result.sender.name,
        username: result.sender.username,
        role: result.sender.role
      },
      message: decryptMessage(result.message),
      attachmentUrl: result.attachmentUrl,
      attachmentName: result.attachmentName,
      attachmentSize: result.attachmentSize,
      isUnsent: result.isUnsent,
      createdAt: result.createdAt
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error posting chat message:', error);
    return NextResponse.json({ error: 'failed_to_post_message' }, { status: 500 });
  }
}
