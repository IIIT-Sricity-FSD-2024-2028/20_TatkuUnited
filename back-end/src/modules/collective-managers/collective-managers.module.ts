import { Module } from '@nestjs/common';
import { CollectiveManagersService } from './collective-managers.service';
import { CollectiveManagersController } from './collective-managers.controller';
import { CollectiveManagersRepository } from './collective-managers.repository';
import { CollectivesModule } from '../collectives/collectives.module';

@Module({
  imports: [],
  controllers: [CollectiveManagersController],
  providers: [CollectiveManagersService, CollectiveManagersRepository],
  exports: [CollectiveManagersService],
})
export class CollectiveManagersModule {}
