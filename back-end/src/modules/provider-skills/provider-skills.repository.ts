import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService, ProviderSkill } from '../../common/database/database.service';
import { CreateProviderSkillDto } from './dto/create-provider-skill.dto';

@Injectable()
export class ProviderSkillsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findByProvider(providerId: string): ProviderSkill[] {
    return this.databaseService.providerSkills.filter(
      (row) => row.sp_id === providerId,
    );
  }

  findBySkill(skillId: string): ProviderSkill[] {
    return this.databaseService.providerSkills.filter(
      (row) => row.skill_id === skillId,
    );
  }

  create(dto: CreateProviderSkillDto): ProviderSkill {
    const existing = this.databaseService.providerSkills.find(
      (row) => row.sp_id === dto.service_provider_id && row.skill_id === dto.skill_id
    );
    if (existing) {
      throw new BadRequestException('Provider already has this skill');
    }

    const providerSkill: ProviderSkill = {
      sp_id: dto.service_provider_id,
      skill_id: dto.skill_id,
      verification_status: dto.is_verified ? 'Verified' : 'Pending',
      verified_at: dto.is_verified ? new Date().toISOString() : null,
    };
    
    this.databaseService.providerSkills.push(providerSkill);
    return providerSkill;
  }

  verifySkill(providerId: string, skillId: string): ProviderSkill {
    const record = this.databaseService.providerSkills.find(
      (row) => row.sp_id === providerId && row.skill_id === skillId
    );
    if (!record) {
      throw new NotFoundException(`Provider skill association not found`);
    }
    
    record.verification_status = 'Verified';
    record.verified_at = new Date().toISOString();
    return record;
  }
}
