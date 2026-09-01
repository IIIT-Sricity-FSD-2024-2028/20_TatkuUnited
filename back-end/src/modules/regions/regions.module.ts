import { Module } from '@nestjs/common';
import { RegionsController } from './regions.controller';
import { RegionsService } from './regions.service';
import { RegionsRepository } from './regions.repository';

@Module({
  controllers: [RegionsController],
  providers: [RegionsService, RegionsRepository],
  exports: [RegionsService, RegionsRepository],
})
export class RegionsModule {}
