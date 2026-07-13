import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TwoFactorService } from '../two-factor/two-factor.service';
import {EmailService} from '../email/email.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly twoFactorService: TwoFactorService,
    private readonly emailService: EmailService
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

    await this.sendVerificationEmail(user.id,user.email);
    return this.issueTokens(user.id,user.email);

  }


  async checkIfPasswordHasBeenPwned(password: string): Promise<boolean> {
    const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();

    const prefix = sha1Hash.slice(0, 5);
    const suffix = sha1Hash.slice(5);
    try{
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`) ;
        console.log(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (!response.ok) {
            return false;
        }

        const data = await response.text() ;
        const lines = data.split('\n');
        for (const line of lines) {
            const [hashSuffix, count] = line.split(':');
            if (hashSuffix === suffix) {
                return true;
            }
        }

        return false;
    }
    catch(error){
        console.error('Error checking password against Have I Been Pwned API:', error);
        return false;
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

    // Checking 2FA if enabled
    if(user.twoFAEnabled){
        console.log("User has 2FA enabled", dto.twoFACode);
        if(!dto.twoFACode){
            throw new UnauthorizedException('Two Factor Authentication code is required');
        }
        const result = await this.twoFactorService.verifyCode(user.id, dto.twoFACode);
        if(!result.valid){
            throw new UnauthorizedException('Invalid Two Factor Authentication code');
        }
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

// Google OAuth function to handle the google login and registration
async googleAuthentication(profile: { id: string; emails: { value: string }[]; displayName: string }) {
    const user = await this.userService.findOrCreateGoogleUser(profile);
    if(!user){
        throw new UnauthorizedException('Google authentication failed');
    }
    return this.issueTokens(user.id,user.email);
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

    // Deleting any existing reset tokens for the user and creating a new one
    await this.prisma.passwordResetToken.deleteMany({
        where: {
            userId: user.id,
        },
    });
    // Creating a new reset token for the user
    await this.prisma.passwordResetToken.create({
        data: {
            tokenHash,
            userId: user.id,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        },
    });
    return {resetToken};
}
// Github Authentication function
async githubAuthentication(profile:any){
    const user  = await this.userService.findOrCreateGithubUser(profile);
    if(!user ){
        throw new UnauthorizedException('Github authentication failed');
    }
    return this.issueTokens(user.id,user.email);
}

// to Handle the reset of password
async resetPassword(resetToken : string, newPassword : string){

    // Verifying the reset token and getting the userId
    const payload = await this.jwtService.verifyAsync(resetToken);
    if(!payload || !payload.userId){
        throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Checking if the reset token exists in the DB
    const tokenRecord =
    await this.prisma.passwordResetToken.findFirst({
        where: {
            userId: payload.userId
        }
    }) ;
    if(!tokenRecord){
        throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Validating  the reset token and checking if it is expired
    const valid = await bcrypt.compare(
        resetToken,
        tokenRecord.tokenHash
    );

    if (tokenRecord.expiresAt < new Date() || !valid) {
        throw new UnauthorizedException("Invalid or expired reset token");
    }

    // Deleting the reset token from the DB
    await this.prisma.passwordResetToken.deleteMany({
        where: { userId: payload.userId },
    });

// Updating the user's password in the DB
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
        where: { id: payload.userId },
        data: { passwordHash: newPasswordHash },
    });
    return {message : 'Password reset successfully'};
}
// To send the verification email
async sendVerificationEmail(userId : string, email : string){
    const token = await this.jwtService.signAsync(
        {userId , type : 'email-verification'
        },
        {expiresIn: '1h'});

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

        await this.emailService.sendEmail({
            recipients: [email],
            subject: 'Verify your email',
            html: `<p>Please verify your email by clicking the link below:</p><a href="${verificationLink}">Verify Email</a>`,
        });
}
// To verify the email of the user
async verifyEmail(token : string){
    let payload;
    try{   
        payload = await this.jwtService.verifyAsync(token);
        if(!payload || !payload.userId || payload.type !== 'email-verification'){
            throw new UnauthorizedException('Invalid or expired email verification token');
        }
    }catch(error){
        throw new UnauthorizedException('Invalid or expired email verification token');
    }

    await this.prisma.user.update({
        where: { id: payload.userId },
        data: { emailVerified: true },
    });
    return {message : 'Email verified successfully'};
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