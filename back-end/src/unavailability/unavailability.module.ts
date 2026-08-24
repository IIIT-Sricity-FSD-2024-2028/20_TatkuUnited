import { Module } from '@nestjs/common';
import { UnavailabilityService } from './unavailability.service';
import { UnavailabilityController } from './unavailability.controller';

@Module({
  controllers: [UnavailabilityController],
  providers: [UnavailabilityService],
})
export class UnavailabilityModule {}
