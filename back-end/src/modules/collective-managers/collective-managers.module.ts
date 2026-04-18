import { Module } from '@nestjs/common';
import { CollectiveManagersService } from './collective-managers.service';
import { CollectiveManagersController } from './collective-managers.controller';

@Module({
  controllers: [CollectiveManagersController],
  providers: [CollectiveManagersService],
})
export class CollectiveManagersModule {}
