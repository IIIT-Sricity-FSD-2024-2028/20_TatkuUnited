import { Module } from '@nestjs/common';
import { DatabaseModule } from '../schema/database.module';
import { RegionsModule } from '../regions/regions.module';
import { ProvidersModule } from '../providers/providers.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [DatabaseModule, RegionsModule, ProvidersModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
