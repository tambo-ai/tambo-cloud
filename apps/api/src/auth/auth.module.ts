import { Module } from "@nestjs/common";
import { LoggerModule } from "../common/logger.module";
import { ProjectsModule } from "../projects/projects.module";
import { AuthController } from "./auth.controller";

@Module({
  imports: [LoggerModule, ProjectsModule],
  controllers: [AuthController],
})
export class AuthModule {}
