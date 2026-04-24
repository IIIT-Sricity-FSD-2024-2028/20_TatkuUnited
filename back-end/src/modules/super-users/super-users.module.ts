import { Module } from '@nestjs/common';
import { SuperUsersService } from './super-users.service';
import { SuperUsersController } from './super-users.controller';
import { SuperUsersRepository } from './super-users.repository';

@Module({
  controllers: [SuperUsersController],
  providers: [SuperUsersService, SuperUsersRepository],
  exports: [SuperUsersService],
})
export class SuperUsersModule {}
