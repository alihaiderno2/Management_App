import { Controller, Get, Param, Query, Req, UseGuards, UnauthorizedException, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard'; 

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  async getMyRooms(@Req() req: { user: { userId: string } }) {
    console.log('Fetching chat rooms for user:', req.user.userId);
    return await this.chatService.getUserChatRoomsDetailed(req.user.userId);
  }

  @Get('rooms/:roomId/messages')
  async getRoomMessages(
    @Req() req: { user: { userId: string } },
    @Param('roomId') roomId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    const rooms = await this.chatService.getUserRooms(req.user.userId);
    const hasAccess = rooms.some(room =>
      (typeof room === 'string' ? room === roomId : room.id === roomId)
    );

    if (!hasAccess) {
      throw new UnauthorizedException('You do not have access to this chat room');
    }

    const take = limit ? parseInt(limit, 10) : 50;
    return await this.chatService.getRoomMessages(roomId, take, before);
  }

  @Post('rooms/direct')
  async getOrCreateDirectRoom(
    @Req() req: { user: { userId: string } },
    @Body() body : { targetUserId: string},
  ) {
    if (!body.targetUserId) {
      throw new UnauthorizedException('Other user ID is required to create or get a direct room');
    }
    return await this.chatService.getOrCreateDirectRoom(req.user.userId, body.targetUserId);
  }
}