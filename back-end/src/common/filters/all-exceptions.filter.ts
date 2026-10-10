import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../logger/app-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext('ExceptionHandler');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request as any).requestId ||
      request.headers['x-request-id'] ||
      'unknown';

    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let errorType = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message || resObj;
        errorType = resObj.error || exception.name;
      }
    } else if (exception && typeof exception === 'object') {
      const err = exception as Record<string, any>;

      // Handle MongoDB Duplicate Key (E11000)
      if (err.code === 11000) {
        status = HttpStatus.CONFLICT;
        errorType = 'ConflictException';
        const keyPattern = (err.keyPattern || {}) as Record<string, any>;
        const key = Object.keys(keyPattern)[0] || 'field';
        message = `A record with this ${key} already exists.`;
      }
      // Handle Mongoose CastError (e.g. invalid ObjectId)
      else if (err.name === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        errorType = 'BadRequestException';
        message = `Invalid format for field '${err.path}': ${err.value}`;
      }
      // Handle Mongoose ValidationError
      else if (err.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        errorType = 'ValidationError';
        const errObj = (err.errors || {}) as Record<string, any>;
        const errors = Object.values(errObj).map((e: any) => e.message);
        message =
          errors.length > 0 ? errors.join(', ') : 'Validation error occurred';
      } else {
        message = err.message || 'An unexpected error occurred';
      }
    }

    const statusCodeNumber = Number(status);

    const errorResponse = {
      statusCode: statusCodeNumber,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
      method: request.method,
      requestId,
      error: errorType,
      message,
    };

    // Log the error
    const logMessage = `[${requestId}] ${request.method} ${request.url} ${statusCodeNumber} - ${
      typeof message === 'object' ? JSON.stringify(message) : message
    }`;

    if (statusCodeNumber >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(logMessage, stack, 'ExceptionHandler');
    } else {
      this.logger.warn(logMessage, 'ExceptionHandler');
    }

    response.status(statusCodeNumber).json(errorResponse);
  }
}
