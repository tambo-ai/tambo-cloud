import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getDb } from '@use-hydra-ai/db';
import { CorrelationLoggerService } from '../common/services/logger.service';
import { MessageProjectAccessGuard } from '../messages/guards/message-project-access.guard';
import { ThreadsModule } from '../threads/threads.module';
import { SuggestionsController } from './suggestions.controller';
import { SuggestionsService } from './suggestions.service';

@Module({
  imports: [ConfigModule, ThreadsModule],
  controllers: [SuggestionsController],
  providers: [
    SuggestionsService,
    CorrelationLoggerService,
    MessageProjectAccessGuard,
    {
      provide: 'DbRepository',
      useFactory: () => getDb(process.env.DATABASE_URL!),
    },
  ],
  exports: [SuggestionsService],
})
export class SuggestionsModule {}
