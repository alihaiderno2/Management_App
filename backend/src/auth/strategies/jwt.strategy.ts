import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {ConfigService} from '@nestjs/config';
import {RedisService} from '../../redis/redis.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService,
        private readonly redisService: RedisService,
        private readonly userService: UserService,
        @InjectQueue('account-activation') private readonly accountActivationQueue: Queue
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET')!,
        })
    }
    async validate(payload: {userId: string, email: string, type : string}) {
        const ifAlreadyBlocked = await this.redisService.client.exists(`blocked:${payload.userId}`);
        if(ifAlreadyBlocked){
            throw new UnauthorizedException('Account is blocked. Please try again later.');
        }
        console.log('JWT payload:', payload);
        if(payload.type === 'refresh'){
            await this.redisService.client.set(`blocked:${payload.userId}`, 'true', 'EX', 1 * 60);
            this.userService.deactivateUser(payload.userId);
            this.accountActivationQueue.add('unblock-user', {userId :payload.userId}, {delay: 1 * 60 * 1000});
            throw new UnauthorizedException('Invalid token type - Account blocked for 15 minutes');
        }
        console.log('JWT payload validated:', payload);
        return {userId: payload.userId, email: payload.email};
    }
}