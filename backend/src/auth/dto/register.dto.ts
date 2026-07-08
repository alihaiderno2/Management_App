import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string = '';

  @MinLength(8, { message: 'Password must be at least 6 characters' })
  password: string = '';

  @IsString()
  name: string = '';
}