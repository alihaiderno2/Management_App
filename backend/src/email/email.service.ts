import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { EmailDto } from './dto/email.dto';

@Injectable()
export class EmailService {
    constructor(private configService: ConfigService) {}
    emailTransport(){
        const transporter = nodemailer.createTransport({
            host:this.configService.get('SMTP_HOST'),
            port:this.configService.get('SMTP_PORT'),
            secure:false,
            auth: {
                user: this.configService.get('EMAIL_USER'),
                pass: this.configService.get('EMAIL_PASS'),
            },
        });
        return transporter;
    }

    async sendEmail(email : EmailDto) {
        const transporter = this.emailTransport();
        const {recipients, subject, html} = email;

        const options : nodemailer.SendMailOptions = {
            from: this.configService.get('EMAIL_FROM'),
            to: recipients.join(', '),
            subject,
            html,
        };

        try{
            await transporter.sendMail(options);
            console.log('Email sent successfully');
        }catch(error){
            console.error('Error sending email:', error);
        }
    }
}
