import { SanitizeInputMiddleware } from './sanitize-input.middleware';

describe('SanitizeInputMiddleware', () => {
  let middleware: SanitizeInputMiddleware;

  beforeEach(() => {
    middleware = new SanitizeInputMiddleware();
  });

  it('should strip $ prefixed keys from req.body', () => {
    const req: any = {
      body: {
        email: 'test@example.com',
        $gt: '',
        nested: {
          validField: 123,
          $where: 'malicious',
        },
      },
      query: {},
      params: {},
    };
    const res: any = {};
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.body).toEqual({
      email: 'test@example.com',
      nested: {
        validField: 123,
      },
    });
    expect(req.body.$gt).toBeUndefined();
    expect(req.body.nested.$where).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should strip keys containing dot notation from req.query', () => {
    const req: any = {
      body: {},
      query: {
        search: 'cleaning',
        'user.password': 'leak',
      },
      params: {},
    };
    const res: any = {};
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.query).toEqual({
      search: 'cleaning',
    });
    expect(req.query['user.password']).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
