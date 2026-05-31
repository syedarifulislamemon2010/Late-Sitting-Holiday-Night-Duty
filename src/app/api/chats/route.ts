import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { decryptMessage } from '@/lib/encryption';

// Helper to get active session userId
async function getSessionUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('session')?.value;
  if (!sessionVal) return null;
  const userId = parseInt(sessionVal, 10);
  return isNaN(userId) ? null : userId;
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Retrieve chats where current user is a participant
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        }
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
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Format chats for clean consumer structure
    const formattedChats = chats.map(chat => {
      // Find the other participant in DMs
      const otherParticipant = chat.participants.find(p => p.userId !== userId);
      const isGroup = chat.type === 'GROUP';

      // Decrypt the last message if available
      let lastMsg = chat.messages[0] || null;
      if (lastMsg) {
        lastMsg = {
          ...lastMsg,
          message: lastMsg.isUnsent ? '🚫 এই বার্তাটি আনসেন্ট করা হয়েছে' : decryptMessage(lastMsg.message)
        };
      }

      return {
        id: chat.id,
        type: chat.type,
        name: isGroup ? chat.name : (otherParticipant?.user?.name || 'অন্য কর্মকর্তা'),
        avatar: isGroup ? chat.avatar : null,
        creatorId: chat.creatorId,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        participants: chat.participants.map(p => ({
          userId: p.userId,
          name: p.user.name,
          username: p.user.username,
          role: p.user.role,
          lastReadAt: p.lastReadAt
        })),
        lastMessage: lastMsg
      };
    });

    return NextResponse.json(formattedChats);
  } catch (error: any) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'failed_to_fetch_chats' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUserId = await getSessionUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, name, participantIds } = body; // participantIds represents other member ids

    if (type !== 'DIRECT' && type !== 'GROUP') {
      return NextResponse.json({ error: 'invalid_chat_type' }, { status: 400 });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'participants_required' }, { status: 400 });
    }

    // 1. Handle Direct Chats (DM)
    if (type === 'DIRECT') {
      const targetUserId = participantIds[0];
      if (targetUserId === currentUserId) {
        return NextResponse.json({ error: 'cannot_dm_self' }, { status: 400 });
      }

      // Check if a DIRECT chat already exists between these two users
      const existingChat = await prisma.chat.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            { participants: { some: { userId: currentUserId } } },
            { participants: { some: { userId: targetUserId } } }
          ]
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

      if (existingChat) {
        // Return existing DM
        const otherP = existingChat.participants.find(p => p.userId !== currentUserId);
        return NextResponse.json({
          id: existingChat.id,
          type: existingChat.type,
          name: otherP?.user?.name || 'অন্য কর্মকর্তা',
          avatar: null,
          creatorId: null,
          participants: existingChat.participants.map(p => ({
            userId: p.userId,
            name: p.user.name,
            username: p.user.username,
            role: p.user.role
          })),
          lastMessage: null
        });
      }

      // Create new DM Chat
      const newDm = await prisma.$transaction(async (tx) => {
        const chat = await tx.chat.create({
          data: {
            type: 'DIRECT'
          }
        });

        // Add both participants
        await tx.chatParticipant.createMany({
          data: [
            { chatId: chat.id, userId: currentUserId },
            { chatId: chat.id, userId: targetUserId }
          ]
        });

        return chat;
      });

      const fullDm = await prisma.chat.findUnique({
        where: { id: newDm.id },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  role: true
                }
              }
            }
          }
        }
      });

      if (!fullDm) {
        return NextResponse.json({ error: 'failed_to_initialize_chat' }, { status: 500 });
      }

      const otherP = fullDm.participants.find(p => p.userId !== currentUserId);
      return NextResponse.json({
        id: fullDm.id,
        type: fullDm.type,
        name: otherP?.user?.name || 'অন্য কর্মকর্তা',
        avatar: null,
        participants: fullDm.participants.map(p => ({
          userId: p.userId,
          name: p.user.name,
          username: p.user.username,
          role: p.user.role
        })),
        lastMessage: null
      }, { status: 201 });
    }

    // 2. Handle Group Chats
    if (type === 'GROUP') {
      if (!name || name.trim() === '') {
        return NextResponse.json({ error: 'group_name_required' }, { status: 400 });
      }

      // Collect all unique userIds (including the creator/admin)
      const allParticipantIds = Array.from(new Set([currentUserId, ...participantIds]));

      const newGroup = await prisma.$transaction(async (tx) => {
        const chat = await tx.chat.create({
          data: {
            type: 'GROUP',
            name: name.trim(),
            creatorId: currentUserId
          }
        });

        // Add participants
        await tx.chatParticipant.createMany({
          data: allParticipantIds.map(uid => ({
            chatId: chat.id,
            userId: uid
          }))
        });

        return chat;
      });

      const fullGroup = await prisma.chat.findUnique({
        where: { id: newGroup.id },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  role: true
                }
              }
            }
          }
        }
      });

      if (!fullGroup) {
        return NextResponse.json({ error: 'failed_to_initialize_group' }, { status: 500 });
      }

      return NextResponse.json({
        id: fullGroup.id,
        type: fullGroup.type,
        name: fullGroup.name,
        avatar: fullGroup.avatar,
        creatorId: fullGroup.creatorId,
        participants: fullGroup.participants.map(p => ({
          userId: p.userId,
          name: p.user.name,
          username: p.user.username,
          role: p.user.role
        })),
        lastMessage: null
      }, { status: 201 });
    }

  } catch (error: any) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'failed_to_create_chat' }, { status: 500 });
  }
}
