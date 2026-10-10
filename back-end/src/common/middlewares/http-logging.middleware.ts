import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../logger/app-logger.service';

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const requestId =
      (req as any).requestId || req.headers['x-request-id'] || '';

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;

      const message = `${method} ${originalUrl} ${statusCode} ${duration}ms - ${contentLength}b [IP: ${ip}] [UA: ${userAgent}]`;

      const logPayload = {
        method,
        url: originalUrl,
        statusCode,
        durationMs: duration,
        ip,
        userAgent,
        requestId,
      };

      if (statusCode >= 500) {
        this.logger.error(message, undefined, 'HTTP');
      } else if (statusCode >= 400) {
        this.logger.warn(message, 'HTTP');
      } else {
        this.logger.http(message, logPayload);
      }
    });

    next();
  }
}
