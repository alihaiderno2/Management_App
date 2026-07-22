import { Body, Controller, Get, Post } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';

@Controller('auth/two-factor')
export class TwoFactorController {
    constructor(private readonly twoFactorService: TwoFactorService) {}

    @UseGuards(JwtAuthGuard)
    @Get('generate')
    async generate(@Req() req:{user: {userId: string, email: string}}) {
        return await this.twoFactorService.generateTwoFactorSecret(req.user.userId, req.user.email);

    }

    @UseGuards(JwtAuthGuard)
    @Post('verify')
    async verify(@Req() req:{user: {userId: string}}, @Body() body: {code: string}) {
        const isValid = await this.twoFactorService.verifyAndEnable(req.user.userId, body.code);
        if(!isValid){
            return {success: false, message: 'Invalid code'};
        }
        return {success: true, message: 'Code verified successfully'};
    }

}
