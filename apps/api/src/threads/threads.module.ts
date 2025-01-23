import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getDb } from '@use-hydra-ai/db';
import { UsersModule } from 'src/users/users.module';
import { ProjectsModule } from '../projects/projects.module';
import { ThreadsController } from './threads.controller';
import { ThreadsService } from './threads.service';

@Module({
  imports: [ConfigModule, ProjectsModule, UsersModule],
  controllers: [ThreadsController],
  providers: [
    ThreadsService,
    {
      provide: 'DbRepository',
      useFactory: () => getDb(process.env.DATABASE_URL!),
    },
  ],
  exports: [ThreadsService],
})
export class ThreadsModule {}
