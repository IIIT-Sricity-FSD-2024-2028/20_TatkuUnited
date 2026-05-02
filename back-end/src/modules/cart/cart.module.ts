import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { DatabaseModule } from '../../common/database/database.module';
import { CartRepository } from './cart.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [CartController],
  providers: [CartService, CartRepository],
  exports: [CartService, CartRepository],
})
export class CartModule {}
