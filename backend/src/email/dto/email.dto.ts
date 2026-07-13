import {IsNotEmpty, IsString, IsEmail, IsOptional} from 'class-validator';
export class EmailDto {

    @IsNotEmpty()
    recipients : string[] = ["alihaiderno2@gmail.com"];

    @IsString()
    @IsNotEmpty()
    subject : string = "No Subject"; 

    @IsString()
    html : string = "<p>No Content</p>";

    @IsOptional()
    @IsString()
    text? : string;

}