import { Module } from '@nestjs/common';
import { ProviderSkillsService } from './provider-skills.service';
import { ProviderSkillsController } from './provider-skills.controller';

@Module({
  controllers: [ProviderSkillsController],
  providers: [ProviderSkillsService],
})
export class ProviderSkillsModule {}
