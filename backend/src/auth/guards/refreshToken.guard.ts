import { Injectable } from "@nestjs/common";
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { UserService } from "../../user/user.service";
import { User } from "@prisma/client";

@Injectable()
export class RefreshTokenGuard implements CanActivate {

    constructor(private readonly userService : UserService) {}
    async canActivate(context: ExecutionContext) : Promise<boolean> {
        const req = context.switchToHttp().getRequest();

        const token = req.headers.authorization?.split(' ')[1];
        if(!token){
            return false;
        }
        const result = await this.userService.findByToken(token);
        if(!result){
            return true;
        }

        
        return false;
    }
}