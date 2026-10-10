import { Module } from '@nestjs/common';
import { DatabaseModule } from '../schema/database.module';
import { ManagersService } from './managers.service';
import { ManagersController } from './managers.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ManagersController],
  providers: [ManagersService],
  exports: [ManagersService],
})
export class ManagersModule {}
