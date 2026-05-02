import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { AccessScopeService } from '../access/access-scope.service';

@Global()
@Module({
  providers: [DatabaseService, AccessScopeService],
  exports: [DatabaseService, AccessScopeService],
})
export class DatabaseModule {}
