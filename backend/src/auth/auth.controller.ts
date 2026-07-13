import { Controller, Post, Body, Get, UseGuards, Req, Query, Version} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { refreshToken } from './dto/refreshToken.dto';
import {ResetPasswordDto} from './dto/resetPassword.dto';
import { AuthGuard } from '@nestjs/passport';
import { GoogleAuthGuard } from './guards/googleAuth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
    @Throttle({ default: { limit: 5, ttl: 300000 } })
    @Post('register')
    async register(@Body() dto:RegisterDto){
        return this.authService.register(dto);
    }

    @Version('2')
    @Post('register')
    async registerV2(@Body() dto:RegisterDto){
        const result = await this.authService.checkIfPasswordHasBeenPwned(dto.password);
        if(result){
            throw new Error('Password has been compromised in a data breach.');
        }
        return this.authService.register(dto);
    }

    @Throttle({ default: { limit: 5, ttl: 50000 } })
    @Post('login')
    async login(@Body() dto:LoginDto){
        return this.authService.login(dto);
    }

    @Post('refresh')
    async refresh(@Body() tokeninBody: refreshToken){
        return this.authService.refresh(tokeninBody.token);
    }

    @Post('logout')
    async logout(@Body() token : refreshToken){
        return this.authService.logout(token.token);
    }

    @Post('forgot-password')
    async forgotPassword(@Body() body : {email : string}){
        return this.authService.forgotPassword(body.email);
    }

    @Post('reset-password')
    async resetPassword(@Body() resetPassword: ResetPasswordDto){
        return this.authService.resetPassword(resetPassword.resetToken,resetPassword.password);
    }


    @UseGuards(GoogleAuthGuard)
    @Get('google')
    async googleLogin() {}


    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthRedirect(@Req() req :{user: {id: string; emails: { value: string }[]; displayName: string}}) {
        return this.authService.googleAuthentication(req.user);
    }

    @UseGuards(AuthGuard('github'))
    @Get('github')
    async githubLogin() {}

    @Get('github/callback')
    @UseGuards(AuthGuard('github'))
    async githubAuthentication(@Req() req:any){
        return this.authService.githubAuthentication(req.user);
    }

    @Get('verify-email')
    async verifyEmail(@Query('token') token : string){
        return this.authService.verifyEmail(token);
    }

}