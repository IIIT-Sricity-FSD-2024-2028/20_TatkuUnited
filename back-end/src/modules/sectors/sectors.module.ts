import { Module } from '@nestjs/common';
import { SectorsService } from './sectors.service';
import { SectorsController } from './sectors.controller';
import { SectorsRepository } from './sectors.repository';

@Module({
  controllers: [SectorsController],
  providers: [SectorsService, SectorsRepository],
  exports: [SectorsService],
})
export class SectorsModule {}
