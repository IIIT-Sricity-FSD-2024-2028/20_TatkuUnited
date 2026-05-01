import { Module } from '@nestjs/common';
import { RevenueLedgerService } from './revenue-ledger.service';
import { RevenueLedgerController } from './revenue-ledger.controller';
import { RevenueLedgerRepository } from './revenue-ledger.repository';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';

@Module({
  imports: [PlatformSettingsModule], // for getNumericSetting()
  controllers: [RevenueLedgerController],
  providers: [RevenueLedgerRepository, RevenueLedgerService],
  exports: [RevenueLedgerService], // JobAssignmentsModule imports this
})
export class RevenueLedgerModule {}
