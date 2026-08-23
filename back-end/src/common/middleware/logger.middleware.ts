import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '-';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      const logMessage = `${method} ${originalUrl} ${statusCode} ${responseTime}ms`;
      const meta = { method, url: originalUrl, statusCode, responseTime, ip, userAgent };

      if (statusCode >= 500) {
        this.logger.error(logMessage, undefined, 'HTTP');
      } else if (statusCode >= 400) {
        this.logger.warn(`${logMessage} ${JSON.stringify(meta)}`, 'HTTP');
      } else {
        this.logger.log(`${logMessage}`, 'HTTP');
      }
    });

    next();
  }
}
