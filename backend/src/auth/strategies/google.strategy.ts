import {Injectable, UnauthorizedException, Req} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy, VerifyCallback} from 'passport-google-oauth20';
import {ConfigService} from '@nestjs/config';
import {UserService} from '../../user/user.service';
import type {Request} from 'express';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private readonly configService: ConfigService,                private readonly userService: UserService) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
            scope: ['email', 'profile'],
        });
    }
    validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): void {
        console.log('Google profile:', profile);
        done(null, profile);
    }
}