import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SchedulerModule } from "../scheduler/scheduler.module";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

@Module({
  imports: [ConfigModule, SchedulerModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
