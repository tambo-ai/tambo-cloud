import {
  HttpException,
  Inject,
  NestMiddleware,
  Provider,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { HydraDb, HydraTransaction, schema } from '@use-hydra-ai/db';
import { sql } from 'drizzle-orm';
import { NextFunction, Response } from 'express';
import { IncomingMessage } from 'http';
import { decryptApiKey } from '../key.utils';

interface HydraRequest extends IncomingMessage {
  tx?: HydraTransaction;
}

// @Injectable()
// export class TransactionInterceptor implements NestInterceptor<HydraRequest> {
//   constructor(
//     @Inject('DbRepository')
//     private readonly db: HydraDb,
//   ) {}

//   intercept(context: ExecutionContext, next: CallHandler) {
//     console.log('====TransactionInterceptor intercept');
//     const request: HydraRequest = context.switchToHttp().getRequest();
//     const apiKeyHeader = request.headers['x-api-key'];
//     const apiKeyHeaderString = Array.isArray(apiKeyHeader)
//       ? apiKeyHeader[0]
//       : apiKeyHeader;
//     const p = this.db.transaction(async (tx) => {
//       const projectId = apiKeyHeaderString
//         ? decryptApiKey(apiKeyHeaderString)?.storedString
//         : null;

//       if (!projectId) {
//         throw new UnauthorizedException('Invalid API key');
//       }
//       request.tx = tx; // Attach transaction to request
//       console.log(
//         '====TransactionInterceptor attached tx to request',
//         `${request}`,
//       );
//       await tx.execute(sql`
//             -- auth.jwt()
//             select set_config('request.apikey.project_id', '${sql.raw(
//               projectId,
//             )}', TRUE);
//             -- set local role
//             set local role ${sql.raw(schema.projectApiKeyRole.name)};
//             `);
//       try {
//         const result = await next.handle().toPromise();
//         console.log('====TransactionInterceptor result', result);
//         return result;
//         // Commit transaction automatically
//       } catch (error) {
//         console.log('====TransactionInterceptor error', error);
//         // automatically rollback on unrecognized errors
//         if (!(error instanceof HttpException) || error.getStatus() >= 500) {
//           tx.rollback(); // Rollback transaction manually on error
//         }
//         throw error;
//       } finally {
//         console.log('====TransactionInterceptor finally');
//         await tx.execute(sql`
//             select set_config('request.apikey.project_id', NULL, TRUE);
//             reset role;
//             `);
//         delete request.tx;
//         console.log(
//           '====TransactionInterceptor finally after delete request.tx',
//         );
//       }
//     });
//     const obs = from(p);
//     console.log('====TransactionInterceptor promise', obs);
//     return obs;
//   }
// }
export const TRANSACTION = Symbol('TRANSACTION');
export const TransactionProvider: Provider = {
  provide: TRANSACTION,
  scope: Scope.REQUEST,
  inject: [REQUEST],
  useFactory: (req: HydraRequest) => {
    console.log(
      '====TransactionProvider useFactory',
      `${req.constructor.name}`,
      `${req.tx?.constructor.name}`,
    );
    return req.tx;
  },
};

export class TransactionMiddleware implements NestMiddleware {
  constructor(
    @Inject('DbRepository')
    private readonly db: HydraDb,
  ) {}
  async use(req: HydraRequest, res: Response, next: NextFunction) {
    console.log(
      '====TransactionMiddleware use with req',
      `${req.constructor.name}`,
    );
    const apiKeyHeader = req.headers['x-api-key'];
    const apiKeyHeaderString = Array.isArray(apiKeyHeader)
      ? apiKeyHeader[0]
      : apiKeyHeader;
    const projectId = apiKeyHeaderString
      ? decryptApiKey(apiKeyHeaderString)?.storedString
      : null;

    if (!projectId) {
      throw new UnauthorizedException('Invalid API key');
    }
    const p = this.db.transaction(async (tx) => {
      (req as HydraRequest).tx = tx; // Attach transaction to request
      console.log('====TransactionMiddleware attached tx to request', `${req}`);
      await tx.execute(sql`
            -- auth.jwt()
            select set_config('request.apikey.project_id', '${sql.raw(
              projectId,
            )}', TRUE);
            -- set local role
            set local role ${sql.raw(schema.projectApiKeyRole.name)};
            `);

      return await new Promise((resolve, reject) => {
        res.on('finish', async () => {
          try {
            console.log('====TransactionMiddleware finish');
            await tx.execute(sql`
                select set_config('request.apikey.project_id', NULL, TRUE);
                reset role;
                `);
            delete (req as HydraRequest).tx;
            console.log('====TransactionMiddleware finish after delete req.tx');
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });

        next();
      });
    });

    try {
      await p;
    } catch (error) {
      console.log('====TransactionMiddleware error', error);
      // automatically rollback on unrecognized errors
      if (!(error instanceof HttpException) || error.getStatus() >= 500) {
        // Rollback transaction manually on error
        await (req as HydraRequest).tx?.rollback(); // Access tx from request object
      }
      throw error;
    }
  }
}

// @Injectable()
// export class TransactionMiddleware implements NestMiddleware {
//   async use(req: HydraRequest, res: Response, next: NextFunction) {
//     console.log('====TransactionMiddleware use');
//     const apiKeyHeader = req.headers['x-api-key'];
//     const apiKeyHeaderString = Array.isArray(apiKeyHeader)
//       ? apiKeyHeader[0]
//       : apiKeyHeader;
//   }
//   constructor(
//     @Inject('DbRepository')
//     private readonly db: HydraDb,
//   ) {}

//   intercept(context: ExecutionContext, next: CallHandler) {
//     console.log('====TransactionInterceptor intercept');
//     const request: HydraRequest = context.switchToHttp().getRequest();
//     const apiKeyHeader = request.headers['x-api-key'];
//     const apiKeyHeaderString = Array.isArray(apiKeyHeader)
//       ? apiKeyHeader[0]
//       : apiKeyHeader;
//     const p = this.db.transaction(async (tx) => {
//       const projectId = apiKeyHeaderString
//         ? decryptApiKey(apiKeyHeaderString)?.storedString
//         : null;

//       if (!projectId) {
//         throw new UnauthorizedException('Invalid API key');
//       }
//       request.tx = tx; // Attach transaction to request
//       console.log(
//         '====TransactionInterceptor attached tx to request',
//         `${request}`,
//       );
//       await tx.execute(sql`
//             -- auth.jwt()
//             select set_config('request.apikey.project_id', '${sql.raw(
//               projectId,
//             )}', TRUE);
//             -- set local role
//             set local role ${sql.raw(schema.projectApiKeyRole.name)};
//             `);
//       try {
//         const result = await next.handle().toPromise();
//         console.log('====TransactionInterceptor result', result);
//         return result;
//         // Commit transaction automatically
//       } catch (error) {
//         console.log('====TransactionInterceptor error', error);
//         // automatically rollback on unrecognized errors
//         if (!(error instanceof HttpException) || error.getStatus() >= 500) {
//           tx.rollback(); // Rollback transaction manually on error
//         }
//         throw error;
//       } finally {
//         console.log('====TransactionInterceptor finally');
//         await tx.execute(sql`
//             select set_config('request.apikey.project_id', NULL, TRUE);
//             reset role;
//             `);
//         delete request.tx;
//         console.log(
//           '====TransactionInterceptor finally after delete request.tx',
//         );
//       }
//     });
//     const obs = from(p);
//     console.log('====TransactionInterceptor promise', obs);
//     return obs;
//   }
// }
