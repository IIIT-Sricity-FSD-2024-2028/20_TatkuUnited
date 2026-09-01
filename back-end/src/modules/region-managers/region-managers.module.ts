import { Module } from '@nestjs/common';
import { RegionManagersController } from './region-managers.controller';
import { RegionManagersService } from './region-managers.service';
import { RegionManagersRepository } from './region-managers.repository';

@Module({
  controllers: [RegionManagersController],
  providers: [RegionManagersService, RegionManagersRepository],
  exports: [RegionManagersService, RegionManagersRepository],
})
export class RegionManagersModule {}
