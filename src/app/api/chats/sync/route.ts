import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { decryptMessage } from '@/lib/encryption';

async function getSessionUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('session')?.value;
  if (!sessionVal) return null;
  const userId = parseInt(sessionVal, 10);
  return isNaN(userId) ? null : userId;
}

export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');
    const sinceDate = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to last 24h

    // Get all chat IDs the user belongs to
    const myParticipants = await prisma.chatParticipant.findMany({
      where: { userId: userId },
      select: { chatId: true }
    });

    const myChatIds = myParticipants.map(p => p.chatId);

    if (myChatIds.length === 0) {
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        messages: [],
        chats: []
      });
    }

    // Retrieve any new or updated messages in my chats since timestamp
    const newMessages = await prisma.chatMessage.findMany({
      where: {
        chatId: { in: myChatIds },
        updatedAt: { gt: sinceDate }
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

    // Decrypt and format messages
    const formattedMessages = newMessages
      .filter(msg => {
        try {
          const deletedUsers = JSON.parse(msg.deletedForUsers || '[]');
          return !deletedUsers.includes(userId);
        } catch {
          return true;
        }
      })
      .map(msg => ({
        id: msg.id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        sender: {
          id: msg.sender.id,
          name: msg.sender.name,
          username: msg.sender.username,
          role: msg.sender.role
        },
        message: msg.isUnsent ? '🚫 এই বার্তাটি আনসেন্ট করা হয়েছে' : decryptMessage(msg.message),
        attachmentUrl: msg.attachmentUrl,
        attachmentName: msg.attachmentName,
        attachmentSize: msg.attachmentSize,
        isUnsent: msg.isUnsent,
        createdAt: msg.createdAt
      }));

    // Check if any chat lists updated (e.g. new participants or details)
    const updatedChats = await prisma.chat.findMany({
      where: {
        id: { in: myChatIds },
        updatedAt: { gt: sinceDate }
      },
      include: {
        participants: {
          include: {
            user: {
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

    const formattedChats = updatedChats.map(chat => {
      const otherParticipant = chat.participants.find(p => p.userId !== userId);
      const isGroup = chat.type === 'GROUP';
      return {
        id: chat.id,
        type: chat.type,
        name: isGroup ? chat.name : (otherParticipant?.user?.name || 'অন্য কর্মকর্তা'),
        avatar: isGroup ? chat.avatar : null,
        creatorId: chat.creatorId,
        participants: chat.participants.map(p => ({
          userId: p.userId,
          name: p.user.name,
          username: p.user.username,
          role: p.user.role,
          lastReadAt: p.lastReadAt
        })),
        updatedAt: chat.updatedAt
      };
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      messages: formattedMessages,
      chats: formattedChats
    });

  } catch (error: any) {
    console.error('Error syncing chat records:', error);
    return NextResponse.json({ error: 'failed_to_sync_records' }, { status: 500 });
  }
}
