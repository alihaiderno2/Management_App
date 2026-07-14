import { Injectable,OnModuleDestroy} from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
    public readonly client: Redis;
    constructor(private readonly configService: ConfigService) {
        this.client = new Redis({port: this.configService.get<number>('REDIS_PORT'), host: this.configService.get<string>('REDIS_HOST')});
    }
    async onModuleDestroy() {
        await this.client.quit();
    }
}
