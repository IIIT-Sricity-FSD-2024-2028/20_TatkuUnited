import { Injectable } from '@nestjs/common';
import { CreateProviderSkillDto } from './dto/create-provider-skill.dto';
import { UpdateProviderSkillDto } from './dto/update-provider-skill.dto';

@Injectable()
export class ProviderSkillsService {
  create(createProviderSkillDto: CreateProviderSkillDto) {
    return 'This action adds a new providerSkill';
  }

  findAll() {
    return `This action returns all providerSkills`;
  }

  findOne(id: number) {
    return `This action returns a #${id} providerSkill`;
  }

  update(id: number, updateProviderSkillDto: UpdateProviderSkillDto) {
    return `This action updates a #${id} providerSkill`;
  }

  remove(id: number) {
    return `This action removes a #${id} providerSkill`;
  }
}
