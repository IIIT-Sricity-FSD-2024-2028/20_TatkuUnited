import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Adds `service_provider_id` as an alias for `sp_id` in all API responses.
 *
 * The canonical database field is `sp_id`, but the frontend was built
 * expecting `service_provider_id`.  Rather than changing 50+ frontend
 * call-sites we inject the alias here so both names are present.
 */
@Injectable()
export class SpIdAliasInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.addAlias(data)));
  }

  private addAlias(data: any): any {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.addAlias(item));
    }

    if (typeof data === 'object' && !(data instanceof Date)) {
      const out: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        // Recursively process nested objects / arrays
        out[key] = this.addAlias(value);
      }
      // Add the alias if the canonical field exists
      if ('sp_id' in out && !('service_provider_id' in out)) {
        out['service_provider_id'] = out['sp_id'];
      }
      return out;
    }

    return data;
  }
}
