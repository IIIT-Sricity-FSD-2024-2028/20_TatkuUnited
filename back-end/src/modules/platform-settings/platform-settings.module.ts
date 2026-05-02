import { Module } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';
import { PlatformSettingsController } from './platform-settings.controller';
import { PlatformSettingsRepository } from './platform-settings.repository';

@Module({
  controllers: [PlatformSettingsController],
  providers: [PlatformSettingsRepository, PlatformSettingsService],
  exports: [PlatformSettingsService], // RevenueLedgerModule will import this
})
export class PlatformSettingsModule {}
