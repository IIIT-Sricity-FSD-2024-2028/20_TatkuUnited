import { Module, forwardRef } from '@nestjs/common';
import { CollectivesService } from './collectives.service';
import { CollectivesController } from './collectives.controller';
import { CollectivesRepository } from './collectives.repository';
import { SectorsModule } from '../sectors/sectors.module';

@Module({
  imports: [SectorsModule],
  controllers: [CollectivesController],
  providers: [CollectivesService, CollectivesRepository],
  exports: [CollectivesService],
})
export class CollectivesModule {}
