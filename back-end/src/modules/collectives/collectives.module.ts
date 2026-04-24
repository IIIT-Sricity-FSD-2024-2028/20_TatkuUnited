import { Module } from '@nestjs/common';
import { CollectivesService } from './collectives.service';
import { CollectivesController } from './collectives.controller';
import { CollectivesRepository } from './collectives.repository';

@Module({
  controllers: [CollectivesController],
  providers: [CollectivesService, CollectivesRepository],
  exports: [CollectivesService],
})
export class CollectivesModule {}
