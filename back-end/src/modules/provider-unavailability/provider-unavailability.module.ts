import { Module } from '@nestjs/common';
import { ProviderUnavailabilityService } from './provider-unavailability.service';
import { ProviderUnavailabilityController } from './provider-unavailability.controller';

@Module({
  controllers: [ProviderUnavailabilityController],
  providers: [ProviderUnavailabilityService],
})
export class ProviderUnavailabilityModule {}
