import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getDb } from '@use-hydra-ai/db';
import { TransactionProvider } from 'src/common/middleware/db-transaction-middleware';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [ConfigModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    {
      provide: 'DbRepository',
      useFactory: () => getDb(process.env.DATABASE_URL!),
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: TransactionInterceptor,
    // },
    TransactionProvider,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}
