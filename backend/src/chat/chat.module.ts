// chat.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SUper_secret',
    }),
  ],
  providers: [ChatGateway, ChatService],
  exports: [ChatService, ChatGateway],
  controllers: [ChatController],
})
export class ChatModule {}