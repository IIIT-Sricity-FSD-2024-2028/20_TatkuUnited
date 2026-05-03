import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiSecurity } from '@nestjs/swagger';

export function ApiRoleHeader() {
  return applyDecorators(ApiSecurity('x-role'));
}

export function ApiActorIdHeader() {
  return applyDecorators(
    ApiHeader({
      name: 'x-id',
      required: true,
      description: 'Caller user ID (UUID)',
    }),
  );
}
