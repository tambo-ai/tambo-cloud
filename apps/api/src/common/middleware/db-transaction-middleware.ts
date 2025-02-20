import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { HydraDb } from '@use-hydra-ai/db';
import { NextFunction, Request, Response } from 'express';

interface MyRequest extends Request {
  transaction: HydraDb;
}

@Injectable()
export class TransactionMiddleware implements NestMiddleware<MyRequest> {
  constructor(
    @Inject('DbRepository')
    private readonly db: HydraDb,
  ) {}

  async use(req: MyRequest, res: Response, next: NextFunction) {
    await this.db.transaction(async (tx) => {
      console.log('beginning transaction...');
      req.transaction = tx; // Attach transaction to request

      const p = new Promise<void>((resolve, reject) => {
        res.on('finish', () => {
          console.log('finishing transaction...', res.status);
          resolve();
        }); // Commit transaction on success
        res.on('close', () => {
          console.log('closing transaction...', res.status);
          resolve();
        });
        res.on('error', (err) => {
          console.log('rolling back transaction...', err);
          reject(err);
        }); // Rollback transaction on error
      });
      next();
      await p;
    });
  }
}
