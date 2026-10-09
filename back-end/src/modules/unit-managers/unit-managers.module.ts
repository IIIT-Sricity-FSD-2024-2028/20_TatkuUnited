import { Module } from '@nestjs/common';
import { UnitManagersService } from './unit-managers.service';
import { UnitManagersController } from './unit-managers.controller';
import { UnitManagersRepository } from './unit-managers.repository';

@Module({
  controllers: [UnitManagersController],
  providers: [UnitManagersService, UnitManagersRepository],
  exports: [UnitManagersService],
})
export class UnitManagersModule {}
