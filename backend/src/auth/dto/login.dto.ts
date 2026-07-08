import {IsEmail, IsString, Min, MinLength} from 'class-validator';

export class LoginDto{
    @IsEmail()
    email: string = '';

    @IsString()
    @MinLength(8, { message: 'Password must be at least 6 characters' })
    password: string = '';
}