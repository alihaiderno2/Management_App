import { Controller, Post, Body, Get, UseGuards, Req, Query, Version, Res} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { refreshToken } from './dto/refreshToken.dto';
import {ResetPasswordDto} from './dto/resetPassword.dto';
import { AuthGuard } from '@nestjs/passport';
import { GoogleAuthGuard } from './guards/googleAuth.guard';
import type { Request,Response } from 'express';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
    @Throttle({ default: { limit: 5, ttl: 300000 } })
    @Post('register')
    async register(@Body() dto:RegisterDto ,@Res({passthrough : true}) res: Response){
        const {accessToken,refreshToken } =  await this.authService.register(dto);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {accessToken};
    }

    @Version('2')
    @Post('register')
    async registerV2(@Body() dto:RegisterDto, @Res({passthrough : true}) res: Response){
        const result = await this.authService.checkIfPasswordHasBeenPwned(dto.password);
        if(result){
            throw new Error('Password has been compromised in a data breach.');
        }
        const {accessToken, refreshToken} =  await this.authService.register(dto);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {accessToken};
    }

    @Throttle({ default: { limit: 5, ttl: 50000 } })
    @Post('login')
    async login(@Body() dto:LoginDto, @Res({passthrough : true}) res: Response){
        const {accessToken, refreshToken} = await this.authService.login(dto);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {accessToken};
    }

    @Post('refresh')
    async refresh(@Req()req: Request){
        console.log('Refresh token from cookie:', req.cookies.refreshToken);
        return this.authService.refresh(req.cookies.refreshToken);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('logout')
    async logout(@Req() req: Request){
        return this.authService.logout(req.cookies.refreshToken);
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