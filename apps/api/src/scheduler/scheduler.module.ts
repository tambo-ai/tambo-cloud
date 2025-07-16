import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { EmailService } from "../common/services/email.service";
import { SchedulerService } from "../common/services/scheduler.service";

@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule],
  providers: [SchedulerService, EmailService, ConfigService],
})
export class SchedulerModule {}
