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
//     Google profile: {
//   id: '110270282334872722086',
//   displayName: 'BITF24M004-ALI HAIDER',
//   name: { familyName: 'HAIDER', givenName: 'BITF24M004-ALI' },
//   emails: [ { value: 'bitf24m004@pucit.edu.pk', verified: true } ],
//   photos: [
//     {
//       value: 'https://lh3.googleusercontent.com/a/ACg8ocKoGmpBKeByHU3zFWs4k2rz-MWPd8yPE3vxbF-bFswzaP7Y9w=s96-c'
//     }
//   ],
//   provider: 'google',
//   _raw: '{\n' +
//     '  "sub": "110270282334872722086",\n' +
//     '  "name": "BITF24M004-ALI HAIDER",\n' +
//     '  "given_name": "BITF24M004-ALI",\n' +
//     '  "family_name": "HAIDER",\n' +
//     '  "picture": "https://lh3.googleusercontent.com/a/ACg8ocKoGmpBKeByHU3zFWs4k2rz-MWPd8yPE3vxbF-bFswzaP7Y9w\\u003ds96-c",\n' +
//     '  "email": "bitf24m004@pucit.edu.pk",\n' +
//     '  "email_verified": true,\n' +
//     '  "hd": "pucit.edu.pk"\n' +
//     '}',
//   _json: {
//     sub: '110270282334872722086',
//     name: 'BITF24M004-ALI HAIDER',
//     given_name: 'BITF24M004-ALI',
//     family_name: 'HAIDER',
//     picture: 'https://lh3.googleusercontent.com/a/ACg8ocKoGmpBKeByHU3zFWs4k2rz-MWPd8yPE3vxbF-bFswzaP7Y9w=s96-c',
//     email: 'bitf24m004@pucit.edu.pk',
//     email_verified: true,
//     hd: 'pucit.edu.pk'
//   }
// }
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

  async findByGoogleId(googleId: string) {
    const user = await this.prisma.user.findUnique({
      where: { googleId : googleId },
    });
    return user;
  }
}