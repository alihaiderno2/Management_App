import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // 👇 Add this to see EXACTLY which route is missing the token
    console.log(`\n➡️ [Guard] Request to: ${request.method} ${request.url}`);
    console.log(`[Guard] Auth Header:`, request.headers.authorization ? 'Present' : 'Missing');
    
    console.log('1. [Guard canActivate] Cookies present:', !!request.cookies?.refreshToken);
    
    return super.canActivate(context);
  }

  // 🌟 Add logging here to see exactly why it's blocking the request
  handleRequest(err, user, info, context) {

    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed in guard.');
    }
    
    console.log('✅ Guard passed successfully! Sending to controller...');
    return user;
  }
}