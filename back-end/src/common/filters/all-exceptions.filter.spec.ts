import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { AppLoggerService } from '../logger/app-logger.service';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockLogger: jest.Mocked<Partial<AppLoggerService>>;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    mockLogger = {
      setContext: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/api/test',
      originalUrl: '/api/test',
      method: 'GET',
      headers: { 'x-request-id': 'req-abc-123' },
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    filter = new AllExceptionsFilter(mockLogger as unknown as AppLoggerService);
  });

  it('should format standard HttpException properly', () => {
    const exception = new HttpException(
      'Resource not found',
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resource not found',
        error: 'HttpException',
        path: '/api/test',
        method: 'GET',
        requestId: 'req-abc-123',
      }),
    );
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('should handle MongoDB duplicate key error (code 11000)', () => {
    const mongoError = {
      code: 11000,
      keyPattern: { email: 1 },
      message: 'E11000 duplicate key error collection',
    };

    filter.catch(mongoError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        error: 'ConflictException',
        message: 'A record with this email already exists.',
        requestId: 'req-abc-123',
      }),
    );
  });

  it('should handle Mongoose CastError as BadRequestException', () => {
    const castError = {
      name: 'CastError',
      path: '_id',
      value: 'invalid-object-id',
    };

    filter.catch(castError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'BadRequestException',
        message: "Invalid format for field '_id': invalid-object-id",
      }),
    );
  });

  it('should handle Mongoose ValidationError as BadRequestException', () => {
    const validationError = {
      name: 'ValidationError',
      errors: {
        email: { message: 'Path `email` is required.' },
      },
    };

    filter.catch(validationError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'ValidationError',
        message: 'Path `email` is required.',
      }),
    );
  });

  it('should handle unknown runtime error as 500 Internal Server Error', () => {
    const unknownError = new Error('Database connection crashed');

    filter.catch(unknownError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'InternalServerError',
        message: 'Database connection crashed',
      }),
    );
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
