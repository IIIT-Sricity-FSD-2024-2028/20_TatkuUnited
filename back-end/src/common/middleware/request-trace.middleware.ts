import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestTraceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const traceId = (req.headers['x-trace-id'] as string) || uuidv4();
    // Set trace ID on request object for logging / processing
    req['traceId'] = traceId;
    // Set header on response so clients can correlate logs
    res.setHeader('x-trace-id', traceId);
    next();
  }
}
