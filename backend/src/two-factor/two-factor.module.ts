import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { TwoFactorController } from './two-factor.controller';
import { TwoFactorService } from './two-factor.service';
@Module({
    imports: [UserModule],
    controllers: [TwoFactorController],
    providers: [TwoFactorService],
    exports: [TwoFactorService],
})
export class TwoFactorModule{}

