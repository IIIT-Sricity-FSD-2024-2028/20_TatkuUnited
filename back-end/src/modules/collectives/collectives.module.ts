import { Module } from '@nestjs/common';
import { CollectivesService } from './collectives.service';
import { CollectivesController } from './collectives.controller';

@Module({
  controllers: [CollectivesController],
  providers: [CollectivesService],
})
export class CollectivesModule {}
