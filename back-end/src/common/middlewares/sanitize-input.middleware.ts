import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Sanitizes request objects (body, query, params) by removing keys
 * that begin with '$' or contain dots ('.') to protect against NoSQL injection in MongoDB.
 */
function sanitizeObject(target: any): any {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map((item) => sanitizeObject(item));
  }

  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(target)) {
    // Prohibit keys starting with $ (MongoDB query operators) or containing dots
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    cleanObj[key] =
      typeof value === 'object' && value !== null
        ? sanitizeObject(value)
        : value;
  }
  return cleanObj;
}

@Injectable()
export class SanitizeInputMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    next();
  }
}
