import { Module } from '@nestjs/common';
import { CollectiveManagersService } from './collective-managers.service';
import { CollectiveManagersController } from './collective-managers.controller';
import { CollectiveManagersRepository } from './collective-managers.repository';

@Module({
  controllers: [CollectiveManagersController],
  providers: [CollectiveManagersService, CollectiveManagersRepository],
  exports: [CollectiveManagersService],
})
export class CollectiveManagersModule {}
