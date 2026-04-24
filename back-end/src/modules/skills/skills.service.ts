import { Injectable } from '@nestjs/common';
import { SkillsRepository } from './skills.repository';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly skillsRepository: SkillsRepository) {}

  findAll() {
    return this.skillsRepository.findAll();
  }

  findOne(id: string) {
    return this.skillsRepository.findById(id);
  }

  create(dto: CreateSkillDto) {
    return this.skillsRepository.create(dto);
  }

  update(id: string, dto: UpdateSkillDto) {
    return this.skillsRepository.update(id, dto);
  }

  remove(id: string) {
    return this.skillsRepository.delete(id);
  }
}
