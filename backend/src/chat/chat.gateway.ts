// chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayInit,OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private onlineUsers = new Map<string, string[]>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
  ) {}

  afterInit(server: Server) {
    console.log('WebSocket Gateway is running and listening for connections!');
  }
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      
      if (!token) {
        throw new Error('Missing authentication token');
      }

      const payload = await this.jwtService.verifyAsync(token);
      
      const userId = payload.sub || payload.id || payload.userId;
      client.data.user = { userId };

      const userSockets = this.onlineUsers.get(userId) || [];
      userSockets.push(client.id);
      this.onlineUsers.set(userId, userSockets);

      const rooms = await this.chatService.getUserRooms(userId);
      rooms.forEach((room) => client.join(room.id));

      this.server.emit('user-online', { userId });
      
    } catch (error: any) {
      console.error(` Socket connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.userId;
    if (userId) {
      let userSockets = this.onlineUsers.get(userId) || [];
      userSockets = userSockets.filter((id) => id !== client.id);

      if (userSockets.length === 0) {
        this.onlineUsers.delete(userId);
        this.server.emit('user-offline', { userId });
      } else {
        this.onlineUsers.set(userId, userSockets);
      }
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; content: string },
  ) {
    const userId = client.data.user?.userId;
    if (!userId) return;

    try {
      const message = await this.chatService.saveMessage(userId, payload.roomId, payload.content);
      this.server.to(payload.roomId).emit('new-message', message);
    } catch (error) {
      client.emit('error', { message: 'Failed to send message' });
    }
  }
}