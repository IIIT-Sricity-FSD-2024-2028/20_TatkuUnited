import { Module } from '@nestjs/common';
import { ServiceProvidersService } from './service-providers.service';
import { ServiceProvidersController } from './service-providers.controller';
import { ServiceProvidersRepository } from './service-providers.repository';

@Module({
  controllers: [ServiceProvidersController],
  providers: [ServiceProvidersService, ServiceProvidersRepository],
  exports: [ServiceProvidersService],
})
export class ServiceProvidersModule {}
