import { Injectable, LoggerService } from '@nestjs/common';
import { winstonLoggerInstance } from './winston.config';

@Injectable()
export class AppLoggerService implements LoggerService {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    winstonLoggerInstance.info(message, {
      context: context || this.context,
    });
  }

  error(message: any, trace?: string, context?: string) {
    winstonLoggerInstance.error(message, {
      trace,
      context: context || this.context,
    });
  }

  warn(message: any, context?: string) {
    winstonLoggerInstance.warn(message, {
      context: context || this.context,
    });
  }

  debug?(message: any, context?: string) {
    winstonLoggerInstance.debug(message, {
      context: context || this.context,
    });
  }

  verbose?(message: any, context?: string) {
    winstonLoggerInstance.verbose(message, {
      context: context || this.context,
    });
  }

  http(message: any, meta?: Record<string, any>) {
    winstonLoggerInstance.log('http', message, {
      context: this.context || 'HTTP',
      ...meta,
    });
  }
}
