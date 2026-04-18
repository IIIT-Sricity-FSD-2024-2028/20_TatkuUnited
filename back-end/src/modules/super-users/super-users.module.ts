import { Module } from '@nestjs/common';
import { SuperUsersService } from './super-users.service';
import { SuperUsersController } from './super-users.controller';

@Module({
  controllers: [SuperUsersController],
  providers: [SuperUsersService],
})
export class SuperUsersModule {}
