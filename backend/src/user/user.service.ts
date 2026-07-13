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

//   GitHub profile: {
//   id: '187115190',
//   nodeId: 'U_kgDOCycmtg',
//   displayName: null,
//   username: 'alihaiderno2',
//   profileUrl: 'https://github.com/alihaiderno2',
//   photos: [
//     { value: 'https://avatars.githubusercontent.com/u/187115190?v=4' }
//   ],
//   provider: 'github',
//   _raw: '{"login":"alihaiderno2","id":187115190,"node_id":"U_kgDOCycmtg","avatar_url":"https://avatars.githubusercontent.com/u/187115190?v=4","gravatar_id":"","url":"https://api.github.com/users/alihaiderno2","html_url":"https://github.com/alihaiderno2","followers_url":"https://api.github.com/users/alihaiderno2/followers","following_url":"https://api.github.com/users/alihaiderno2/following{/other_user}","gists_url":"https://api.github.com/users/alihaiderno2/gists{/gist_id}","starred_url":"https://api.github.com/users/alihaiderno2/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/alihaiderno2/subscriptions","organizations_url":"https://api.github.com/users/alihaiderno2/orgs","repos_url":"https://api.github.com/users/alihaiderno2/repos","events_url":"https://api.github.com/users/alihaiderno2/events{/privacy}","received_events_url":"https://api.github.com/users/alihaiderno2/received_events","type":"User","user_view_type":"public","site_admin":false,"name":null,"company":null,"blog":"","location":null,"email":null,"hireable":null,"bio":null,"twitter_username":null,"notification_email":null,"public_repos":30,"public_gists":0,"followers":2,"following":2,"created_at":"2024-11-02T13:59:41Z","updated_at":"2026-07-09T10:37:23Z"}',
//   _json: {
//     login: 'alihaiderno2',
//     id: 187115190,
//     node_id: 'U_kgDOCycmtg',
//     avatar_url: 'https://avatars.githubusercontent.com/u/187115190?v=4',
//     gravatar_id: '',
//     url: 'https://api.github.com/users/alihaiderno2',
//     html_url: 'https://github.com/alihaiderno2',
//     followers_url: 'https://api.github.com/users/alihaiderno2/followers',
//     following_url: 'https://api.github.com/users/alihaiderno2/following{/other_user}',
//     gists_url: 'https://api.github.com/users/alihaiderno2/gists{/gist_id}',
//     starred_url: 'https://api.github.com/users/alihaiderno2/starred{/owner}{/repo}',
//     subscriptions_url: 'https://api.github.com/users/alihaiderno2/subscriptions',
//     organizations_url: 'https://api.github.com/users/alihaiderno2/orgs',
//     repos_url: 'https://api.github.com/users/alihaiderno2/repos',
//     events_url: 'https://api.github.com/users/alihaiderno2/events{/privacy}',
//     received_events_url: 'https://api.github.com/users/alihaiderno2/received_events',
//     type: 'User',
//     user_view_type: 'public',
//     site_admin: false,
//     name: null,
//     company: null,
//     blog: '',
//     location: null,
//     email: null,
//     hireable: null,
//     bio: null,
//     twitter_username: null,
//     notification_email: null,
//     public_repos: 30,
//     public_gists: 0,
//     followers: 2,
//     following: 2,
//     created_at: '2024-11-02T13:59:41Z',
//     updated_at: '2026-07-09T10:37:23Z'
//   },
//   emails: [ { value: 'alihaiderno2@gmail.com' } ]
// }

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
}