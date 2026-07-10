import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import {generateSecret, generateURI, verify} from 'otplib';
import QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {

    constructor(private readonly userService : UserService){}

    async generateTwoFactorSecret(userId: string, email: string)  {
        const secret = generateSecret();

        await this.userService.updateTwoFASecret(userId, secret);
        const uri = generateURI({
            issuer:'Collaboration APp',
            label: email,
            secret
        });

        const qrCodeDataUrl = await QRCode.toDataURL(uri);

        return {qrCodeDataUrl};
    }

    // TO veriffy the code provided by user
    async verifyAndEnable(userId: string, code: string) {
        const user = await this.userService.findById(userId);
        console.log('User:', user);
        console.log('Code:', code);
        if(!user?.twoFASecret){
            return false;
        }

        const secret = user.twoFASecret;
        const isValid = verify({secret, token: code});
        if(!isValid){
            return false;
        }
        await this.userService.enableTwoFactor(userId);
        return true;
    }

    async verifyCode(userId: string, code: string){
        const user = await this.userService.findById(userId);
        if(!user?.twoFASecret){
            return false;
        }

        const secret = user.twoFASecret;
        const isValid = verify({secret, token: code});
        return isValid;
    }
}
