import { Module } from '@nestjs/common';
import { UnitManagersService } from './unit-managers.service';
import { UnitManagersController } from './unit-managers.controller';

@Module({
  controllers: [UnitManagersController],
  providers: [UnitManagersService],
})
export class UnitManagersModule {}
