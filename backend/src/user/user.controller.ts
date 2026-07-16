import { Controller,Injectable } from '@nestjs/common';
import { UserService } from './user.service';
import { Get, UseGuards,Req  } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';

@Injectable()
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {
    }
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMe(@Req() req : {user : {userId: string, email: string}}) {
        const user = await this.userService.findByEmail(req.user.email);
        if(!user){
            return null;
        }
        const {passwordHash : _passwordHash,twoFASecret: _twoFASecret,...safeUser} = user;
        return safeUser;
    }
}
