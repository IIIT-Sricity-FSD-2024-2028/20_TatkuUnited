import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');

    // Daily-rotating transport for ALL logs (info + warn + error)
    const appTransport = new winston.transports.DailyRotateFile({
      dirname: logsDir,
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
    });

    // Daily-rotating transport for ERROR logs only
    const errorTransport = new winston.transports.DailyRotateFile({
      dirname: logsDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'tatku-united' },
      transports: [
        appTransport,
        errorTransport,
        // Console transport for development — coloured, human-readable
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              const ctx = context ? `[${context}]` : '';
              const extra = Object.keys(meta).length > 1 // 1 because of 'service' default
                ? ` ${JSON.stringify(meta)}`
                : '';
              return `${timestamp} ${level} ${ctx} ${message}${extra}`;
            }),
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  /** Direct access to the underlying Winston logger for advanced usage */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}
