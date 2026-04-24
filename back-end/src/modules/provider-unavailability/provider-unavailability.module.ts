import { Module } from '@nestjs/common';
import { ProviderUnavailabilityService } from './provider-unavailability.service';
import { ProviderUnavailabilityController } from './provider-unavailability.controller';
import { ProviderUnavailabilityRepository } from './provider-unavailability.repository';

@Module({
  controllers: [ProviderUnavailabilityController],
  providers: [ProviderUnavailabilityService, ProviderUnavailabilityRepository],
  exports: [ProviderUnavailabilityService],
})
export class ProviderUnavailabilityModule {}
