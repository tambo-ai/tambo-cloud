import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { HydraDb, HydraTransaction } from '@use-hydra-ai/db';
import { Request } from 'express';
import { from } from 'rxjs';

interface HydraRequest extends Request {
  tx: HydraTransaction;
}

@Injectable()
export class TransactionInterceptor implements NestInterceptor<HydraRequest> {
  constructor(
    @Inject('DbRepository')
    private readonly db: HydraDb,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request: HydraRequest = context.switchToHttp().getRequest();
    return from(
      this.db.transaction(async (tx) => {
        request.tx = tx; // Attach transaction to request

        try {
          const result = await next.handle().toPromise();
          return result;
          // Commit transaction automatically
        } catch (error) {
          // automatically rollback on unrecognized errors
          if (!(error instanceof HttpException) || error.getStatus() >= 500) {
            tx.rollback(); // Rollback transaction manually on error
          }
          throw error;
        }
      }),
    );
  }
}
