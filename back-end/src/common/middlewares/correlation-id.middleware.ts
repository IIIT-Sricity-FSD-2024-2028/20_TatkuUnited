import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const headerName = 'x-request-id';
    const correlationId = (req.headers[headerName] as string) || randomUUID();

    req.headers[headerName] = correlationId;
    (req as any).requestId = correlationId;
    res.setHeader('X-Request-Id', correlationId);

    next();
  }
}
