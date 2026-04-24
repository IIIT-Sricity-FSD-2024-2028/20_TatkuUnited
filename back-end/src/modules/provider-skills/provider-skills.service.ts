import { Injectable } from '@nestjs/common';
import { ProviderSkillsRepository } from './provider-skills.repository';
import { CreateProviderSkillDto } from './dto/create-provider-skill.dto';

@Injectable()
export class ProviderSkillsService {
  constructor(private readonly providerSkillsRepository: ProviderSkillsRepository) {}

  findByProvider(providerId: string) {
    return this.providerSkillsRepository.findByProvider(providerId);
  }

  findBySkill(skillId: string) {
    return this.providerSkillsRepository.findBySkill(skillId);
  }

  create(dto: CreateProviderSkillDto) {
    return this.providerSkillsRepository.create(dto);
  }

  verifySkill(providerId: string, skillId: string) {
    return this.providerSkillsRepository.verifySkill(providerId, skillId);
  }
}
