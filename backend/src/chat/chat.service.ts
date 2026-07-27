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
}