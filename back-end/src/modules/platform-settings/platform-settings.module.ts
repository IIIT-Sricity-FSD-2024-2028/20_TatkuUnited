import { Module, Global } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';
import { PlatformSettingsController } from './platform-settings.controller';
import { PlatformSettingsRepository } from './platform-settings.repository';

@Global()
@Module({
  controllers: [PlatformSettingsController],
  providers: [PlatformSettingsRepository, PlatformSettingsService],
  exports: [PlatformSettingsService],
})
export class PlatformSettingsModule {}
