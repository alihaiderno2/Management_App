import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnyARecord } from 'dns';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user;
  }

  async create(data: { email: string; passwordHash: string; name: string }) {
    const user = await this.prisma.user.create({
      data,
    });
    return user;
  }
  // Find or Create user using the google profile information
  async findOrCreateGoogleUser(profile: any) {
    const email = profile.emails[0].value || '';
    // find if user exists with the given email
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // If the user not exist
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: profile.displayName,
          googleId: profile.id,
        },
      });
    }
    // If the user exists but does not have a googleId, update the user with the googleId
    if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.id },
      });
    }

    return user;
  }

  async findOrCreateGithubUser(profile:any){
    const email = profile.emails[0].value ;
    // find if user exists with the given email
    let user = await this.prisma.user.findUnique({
      where: { email },
    });
    // create the user if not exists
    if(!user){
      user = await this.prisma.user.create({
        data:{
          name:profile.username,
          email:email,
          githubId:profile.id,
          profileImage: profile.photos[0].value
        }
      })
    }

    // if the user exists but has no id

    if(!user.githubId){
      user = await this.prisma.user.update({
        where:{id:user.id},
        data:{githubId:profile.id}
      })
    }

    return user;
  }
  // function to find user by google id
  async findByGoogleId(googleId: string) {
    const user = await this.prisma.user.findUnique({
      where: { googleId : googleId },
    });
    return user;
  }
  // function to find user by git id
  async findByGithubId(githubId: string) {
    const user = await this.prisma.user.findUnique({
      where: { githubId : githubId },
    });
    return user;
  }


  // Enable two factor authentication
  async enableTwoFactor(userId: string){
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { twoFAEnabled: true },
    });
    return user;
  }

  async updateTwoFASecret(userId: string, secret: string){
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { twoFASecret: secret },
    });
    return user;
  }

  async findByToken(token: string) {
    const tokenFound = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: token },
    });
    if (!tokenFound) {
      return null;
    }
    const user = await this.prisma.user.findUnique({
      where: { id: tokenFound.userId },
    });
    return user;
  }
  async deactivateUser(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isDeactivated: true },
    });
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async disableTwoFactor(userId: string){

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { twoFAEnabled: false, twoFASecret: null },
    });
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; showOnlineStatus?: boolean; }) {
    console.log('Updating profile for userId:', userId, 'with data:', data);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    console.log('Updated user:', user);
    return user;
  }
}