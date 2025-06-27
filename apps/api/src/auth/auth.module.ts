import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "../common/logger.module";
import { ProjectsModule } from "../projects/projects.module";
import { AuthController } from "./auth.controller";

@Module({
  imports: [ConfigModule, LoggerModule, ProjectsModule],
  controllers: [AuthController],
})
export class AuthModule {}
