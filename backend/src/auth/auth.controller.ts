import { Controller, Post, Body, Get, UseGuards, Req} from '@nestjs/common';
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
    @Post('register')
    async register(@Body() dto:RegisterDto){
        return this.authService.register(dto);
    }
    
    @Post('login')
    async login(@Body() dto:LoginDto){
        return this.authService.login(dto);
    }

    @Post('refresh')
    async refresh(@Body() token: refreshToken){
        return this.authService.refresh(token.token);
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

}