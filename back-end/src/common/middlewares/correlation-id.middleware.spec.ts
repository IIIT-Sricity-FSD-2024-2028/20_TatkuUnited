import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { Request, Response } from 'express';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
  });

  it('should generate a new correlation ID if none is supplied', () => {
    const req = {
      headers: {},
    } as unknown as Request;

    const setHeaderMock = jest.fn();
    const res = {
      setHeader: setHeaderMock,
    } as unknown as Response;

    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBeDefined();
    expect(typeof req.headers['x-request-id']).toBe('string');
    expect((req as any).requestId).toBe(req.headers['x-request-id']);
    expect(setHeaderMock).toHaveBeenCalledWith(
      'X-Request-Id',
      req.headers['x-request-id'],
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should preserve an existing X-Request-Id from request headers', () => {
    const existingId = 'client-provided-correlation-id-999';
    const req = {
      headers: {
        'x-request-id': existingId,
      },
    } as unknown as Request;

    const setHeaderMock = jest.fn();
    const res = {
      setHeader: setHeaderMock,
    } as unknown as Response;

    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBe(existingId);
    expect((req as any).requestId).toBe(existingId);
    expect(setHeaderMock).toHaveBeenCalledWith('X-Request-Id', existingId);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
