import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    const connect = this.$connect as () => Promise<void>;
    await connect();
  }
  async onModuleDestroy() {
    const disconnect = this.$disconnect as () => Promise<void>;
    await disconnect();
  }
}
