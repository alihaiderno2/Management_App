import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
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
    const tokens = await this.issueTokens(user.id,user.email);
    return tokens;
}
async refresh(refreshToken: string){
    // get the refresh token from the DB
    const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: refreshToken },
    }
    );
    // if the token is not found or expired
    if(!tokenRecord || tokenRecord.expiresAt < new Date()){
        throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const user = await this.userService.findById(tokenRecord.userId);
    if(!user){
        throw new UnauthorizedException('User not found');
    }
    // Generate a new access token
    const token = await this.generateAccessToken(user.id,user.email, 60 * 15);
    return {accessToken : token};
}
async issueTokens(userId : string,email : string){
    const accessToken = await this.generateAccessToken(userId,email, 60 * 15);
    const refreshToken = await this.generateRefreshToken(userId,email, 3600 * 24 * 7);
    return {accessToken, refreshToken};
}
async generateAccessToken(userId : string,email : string, expiresIn: number){
    const token = await this.jwtService.signAsync({userId,email}, {expiresIn});
    return token;
}
async generateRefreshToken(userId : string,email : string, expiresIn: number){
    const token = await this.jwtService.signAsync({userId,email}, {expiresIn});
    await this.prisma.refreshToken.create({
        data: {
        tokenHash: token,
        userId,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
    }});
    return token;
}
}