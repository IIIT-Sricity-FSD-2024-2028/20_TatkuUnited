import { Module } from '@nestjs/common';
import { ProviderSkillsService } from './provider-skills.service';
import { ProviderSkillsController } from './provider-skills.controller';
import { ProviderSkillsRepository } from './provider-skills.repository';

@Module({
  controllers: [ProviderSkillsController],
  providers: [ProviderSkillsService, ProviderSkillsRepository],
  exports: [ProviderSkillsService],
})
export class ProviderSkillsModule {}
