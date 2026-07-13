import { IsString, IsNotEmpty } from 'class-validator';
export class refreshToken{
    @IsString()
    @IsNotEmpty()
    token : string = '';
}