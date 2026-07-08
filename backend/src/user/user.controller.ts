import { Controller,Injectable } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaClient } from '@prisma/client';

@Injectable()
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}
}
