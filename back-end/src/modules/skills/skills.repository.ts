import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, Skill } from '../../common/database/database.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class SkillsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): Skill[] {
    return this.databaseService.skills;
  }

  findById(id: string): Skill {
    const skill = this.databaseService.skills.find(
      (row) => row.skill_id === id,
    );
    if (!skill) {
      throw new NotFoundException(`Skill with id "${id}" not found`);
    }
    return skill;
  }

  create(dto: CreateSkillDto): Skill {
    const skill = {
      skill_id: uuid(),
      skill_name: dto.name,
      description: dto.description || '',
      created_at: new Date().toISOString(),
    } as unknown as Skill;
    
    this.databaseService.skills.push(skill);
    return skill;
  }

  update(id: string, dto: UpdateSkillDto): Skill {
    const skill = this.findById(id);
    
    if (dto.name !== undefined) skill.skill_name = dto.name;
    if (dto.description !== undefined) skill.description = dto.description;
    
    return skill;
  }

  delete(id: string): Skill {
    const index = this.databaseService.skills.findIndex(
      (row) => row.skill_id === id,
    );
    if (index < 0) {
      throw new NotFoundException(`Skill with id "${id}" not found`);
    }
    const [removed] = this.databaseService.skills.splice(index, 1);
    return removed;
  }
}
