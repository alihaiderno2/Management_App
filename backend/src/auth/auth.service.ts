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

    return this.issueTokens(user.id,user.email);

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
// Logout function for the user
async logout(refreshToken: string){
    const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: refreshToken },
    })
    if(!tokenRecord){
        throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshToken.deleteMany({
        where: { tokenHash: refreshToken },
    });
    return {message : 'Logged out successfully'};
}
// TO issue the tokens to the user
async issueTokens(userId : string,email : string){
    const accessToken = await this.generateAccessToken(userId,email, 60 * 15);
    const refreshToken = await this.generateRefreshToken(userId,email, 3600 * 24 * 7);
    return {accessToken, refreshToken};
}
// To handle the forgot password function
async forgotPassword(email:string){
    const user = await this.userService.findByEmail(email);
    if(!user || !user.passwordHash){
        throw new UnauthorizedException('User not found');
    }
    const resetToken = await this.generateAccessToken(user.id,user.email, 60 * 5);

    const tokenHash = await bcrypt.hash(resetToken, 10);

    await this.prisma.passwordResetToken.deleteMany({
        where: {
            userId: user.id,
        },
    });
    await this.prisma.passwordResetToken.create({
        data: {
            tokenHash,
            userId: user.id,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        },
    });
    return {resetToken};
}

// to Handle the reset of password
async resetPassword(resetToken : string, newPassword : string){

    const payload = await this.jwtService.verifyAsync(resetToken);
    if(!payload || !payload.userId){
        throw new UnauthorizedException('Invalid or expired reset token');
    }

    const tokenRecord =
    await this.prisma.passwordResetToken.findFirst({
        where: {
            userId: payload.userId
        }
    }) ;
    if(!tokenRecord){
        throw new UnauthorizedException('Invalid or expired reset token');
    }

    const valid = await bcrypt.compare(
        resetToken,
        tokenRecord.tokenHash
    );

    if (tokenRecord.expiresAt < new Date() || !valid) {
        throw new UnauthorizedException("Invalid or expired reset token");
    }

    await this.prisma.passwordResetToken.deleteMany({
        where: { userId: payload.userId },
    });
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
        where: { id: payload.userId },
        data: { passwordHash: newPasswordHash },
    });
    return {message : 'Password reset successfully'};
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