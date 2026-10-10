import { Module } from '@nestjs/common';
import { DatabaseModule } from '../schema/database.module';
import { UnavailabilityService } from './unavailability.service';
import { UnavailabilityController } from './unavailability.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [UnavailabilityController],
  providers: [UnavailabilityService],
  exports: [UnavailabilityService],
})
export class UnavailabilityModule {}
