import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserRooms(userId: string) {
    const rooms = await this.prisma.chatRoomParticipant.findMany({
      where: { userId },
      include: { chatRoom: true },
    });
    return rooms.map((participant) => participant.chatRoom);
  }

  async saveMessage(userId: string, roomId: string, message: string, replyToId?: string) {
    const participant = await this.prisma.chatRoomParticipant.findUnique({
      where: {
        roomId_userId: {
          userId,
          roomId
        }
      }
    });

    if (!participant) {
      throw new UnauthorizedException('User is not a participant of this chat room');
    }

    return await this.prisma.message.create({
      data: {
        roomId,
        authorId: userId,
        body: message,
        type: 'TEXT',
        replyToId: replyToId || null
      },
      include: {
        author: { select: { id: true, name: true, profileImage: true } },
      }
    });
  }

  async getUserChatRoomsDetailed(userId: string) {
    return this.prisma.chatRoom.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, profileImage: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getRoomMessages(roomId: string, limit: number = 50, before?: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        roomId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {})
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, profileImage: true } },
        attachments: true,
      },
    });
    return messages.reverse();
  }

  async getOrCreateDirectRoom(userId1: string, userId2: string) {
    const directKey = [userId1, userId2].sort().join('_');

    let room = await this.prisma.chatRoom.findUnique({
      where: { directKey },
      include: {
        participants: true,}
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          type: 'DIRECT',
          directKey: directKey,
          participants: {
            create: [
              { userId: userId1 },
              { userId: userId2 },
            ],
          },
        },
        include: { participants: true },
      });
    }
    return room;
  }

async toggleReaction(userId: string, messageId: string, emoji: string) {
    const existingReaction = await this.prisma.messageReaction.findUnique({
        where: {
            messageId_userId_emoji: { messageId, userId, emoji }
        }
    });

    if (existingReaction) {
        await this.prisma.messageReaction.delete({ where: { id: existingReaction.id } });
    } else {
        await this.prisma.messageReaction.create({
            data: { emoji, messageId, userId }
        });
    }

    return await this.prisma.message.findUnique({
        where: { id: messageId },
        include: {
            author: { select: { id: true, name: true, profileImage: true } }, // 👈 Change 'sender' to 'author'
            reactions: { select: { emoji: true, userId: true, user: { select: { name: true } } } }
        }
    });
}
}