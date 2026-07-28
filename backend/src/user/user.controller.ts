import { Controller, Get, UseGuards, Req, Param, Body, Patch} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: { user: { userId: string; email: string } }) {
    const user = await this.userService.findByEmail(req.user.email);
    if (!user) return null;
    const { passwordHash: _passwordHash, twoFASecret: _twoFASecret, ...safeUser } = user;
    return safeUser;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Req() req: { user: { userId: string } }, @Body() body: { name?: string; showOnlineStatus?: boolean; }) {
    return this.userService.updateProfile(req.user.userId, body);
  }
}