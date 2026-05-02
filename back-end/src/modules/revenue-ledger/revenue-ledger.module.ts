import { Module } from '@nestjs/common';
import { RevenueLedgerService } from './revenue-ledger.service';
import { RevenueLedgerController } from './revenue-ledger.controller';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RevenueLedgerController],
  providers: [RevenueLedgerService],
})
export class RevenueLedgerModule {}
