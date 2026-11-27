import { Module } from '@nestjs/common';
import { DatabaseModule } from '../schema/database.module';
import { RegionsModule } from '../regions/regions.module';
import { ProvidersModule } from '../providers/providers.module';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';

@Module({
  imports: [DatabaseModule, RegionsModule, ProvidersModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
