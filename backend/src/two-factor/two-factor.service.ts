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
        if(!user?.twoFASecret){
            return false;
        }

        const secret = user.twoFASecret;
        const result = await verify({secret, token: code});
        if(!result.valid){
            return false;
        }
        await this.userService.enableTwoFactor(userId);
        return true;
    }

    async verifyCode(userId: string, code: string){
        const user = await this.userService.findById(userId);
        if(!user?.twoFASecret){
            return {valid:false};
        }

        const secret = user.twoFASecret;
        const result = await verify({secret, token: code});
        return result;
    }

    async disableTwoFactor(userId: string){
        const user = await this.userService.findById(userId);
        if(!user?.twoFASecret){
            return false;
        }

        await this.userService.disableTwoFactor(userId);
    }
}
