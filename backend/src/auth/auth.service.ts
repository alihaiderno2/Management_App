import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto){
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) {
        throw new ConflictException('An Acoount with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.create({email : dto.email, passwordHash: passwordHash, name: dto.name});
    if(!user){
        throw new UnauthorizedException('User registration failed');
    }

  }

async login(dto: LoginDto){
    const user = await this.userService.findByEmail(dto.email);
    if(!user || !user.passwordHash){
        throw new UnauthorizedException('Invalid email or password');
    }
    const passwordValidation = await bcrypt.compare(dto.password, user.passwordHash);
    if(!passwordValidation){
        throw new UnauthorizedException('Invalid email or password');
    }
}
}