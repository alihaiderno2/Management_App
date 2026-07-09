import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy, VerifyCallback} from 'passport-github2';
import {ConfigService} from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor(private readonly configService: ConfigService) {
        super({
            clientID: configService.get<string>('GITHUB_CLIENT_ID')!,
            clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET')!,
            callbackURL: configService.get<string>('GITHUB_CALLBACK_URL')!,
            scope: ['user:email'],
        })
    }
    validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): void {
        console.log('GitHub profile:', profile);
        done(null, profile);
    }
}