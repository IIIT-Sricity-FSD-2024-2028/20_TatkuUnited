import { Module } from '@nestjs/common';
import { DatabaseModule } from '../schema/database.module';
import { RegionsModule } from '../regions/regions.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [DatabaseModule, RegionsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
