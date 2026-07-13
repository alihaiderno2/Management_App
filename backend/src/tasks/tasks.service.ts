import { Injectable } from '@nestjs/common';
import {SchedulerRegistry,Interval} from '@nestjs/schedule';
import { CronJob } from 'cron';
import { UserService } from '../user/user.service';

@Injectable()
export class TasksService {
    constructor(private schedulerRegistry: SchedulerRegistry) {}
    async scheduleUserAccountEnablement(userId: string, delayInMinutes: number) {
    {

    }
}
}
