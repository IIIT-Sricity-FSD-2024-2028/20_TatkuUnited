import { Module } from '@nestjs/common';
import { RevenueLedgerService } from './revenue-ledger.service';
import { RevenueLedgerController } from './revenue-ledger.controller';

@Module({
  controllers: [RevenueLedgerController],
  providers: [RevenueLedgerService],
})
export class RevenueLedgerModule {}
