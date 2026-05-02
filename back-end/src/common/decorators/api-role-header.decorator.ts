import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export function ApiRoleHeader() {
  return applyDecorators(
    ApiHeader({
      name: 'x-role',
      required: true,
      description:
        'Caller role: super_user | collective_manager | unit_manager | service_provider | customer',
    }),
  );
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
